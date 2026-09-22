require('dotenv').config();

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const Razorpay = require('razorpay');
const QRCode = require('qrcode');

const app = express();
const port = Number(process.env.PORT || 3000);
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const products = new Map([
  ['p1', 2499],
  ['p2', 649],
  ['p3', 799],
  ['p4', 549],
  ['p5', 349],
  ['p6', 299],
  ['p7', 279],
  ['p8', 899]
]);

if (!razorpayKeyId || !razorpayKeySecret) {
  console.warn('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
}

const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret })
  : null;

// Enable CORS and preflight
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname)));

// Health check endpoint for Vercel & local
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.VERCEL ? 'vercel' : 'local',
    razorpayConfigured: Boolean(razorpayKeyId && razorpayKeySecret)
  });
});

app.get(['/api/qr', '/qr'], async (req, res) => {
  const text = req.query.text;
  if (!text) {
    res.status(400).send('Missing text query parameter');
    return;
  }
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      margin: 1,
      width: 150,
      color: { dark: '#0a0e1a', light: '#ffffff' }
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).send('Error generating QR code');
  }
});

function getOrderTotal(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return null;
  }

  let total = 0;
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) {
      return null;
    }
    const price = products.get(item.id);
    if (!price) return null;
    total += price * item.qty;
  }
  return total > 0 ? total : null;
}

function requireRazorpay(res) {
  if (razorpay) return true;
  res.status(503).json({
    error: 'Razorpay is not configured on the server. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables.'
  });
  return false;
}

app.post(['/api/razorpay/orders', '/razorpay/orders'], async (req, res) => {
  if (!requireRazorpay(res)) return;

  const amount = getOrderTotal(req.body?.items);
  const receipt = req.body?.receipt;
  if (!amount || typeof receipt !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(receipt)) {
    res.status(400).json({ error: 'Invalid order details.' });
    return;
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt,
      notes: { source: 'pet-society-website' }
    });
    res.json({ id: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(502).json({ error: 'Unable to create a Razorpay order.' });
  }
});

app.post(['/api/razorpay/verify', '/razorpay/verify'], (req, res) => {
  if (!requireRazorpay(res)) return;

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (![orderId, paymentId, signature].every(value => typeof value === 'string' && value.length > 0)) {
    res.status(400).json({ error: 'Invalid payment verification details.' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const valid = expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

  if (!valid) {
    res.status(400).json({ error: 'Payment signature verification failed.' });
    return;
  }
  res.json({ verified: true, paymentId });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Pet Society server listening on http://localhost:${port}`);
  });
}

module.exports = app;
