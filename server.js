require('dotenv').config();

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const Razorpay = require('razorpay');
const QRCode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = Number(process.env.PORT || 3000);
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
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

if (!supabase) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY for cloud database storage.');
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
    razorpayConfigured: Boolean(razorpayKeyId && razorpayKeySecret),
    supabaseConfigured: Boolean(supabase)
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

// ---- SUPABASE: ORDERS API ----------------------------------
app.post(['/api/orders', '/orders'], async (req, res) => {
  const {
    orderId,
    customerName,
    email,
    phone,
    address,
    city,
    country,
    postal,
    paymentMethod,
    total,
    items,
    status
  } = req.body || {};

  if (!orderId || !customerName || !phone || total == null) {
    return res.status(400).json({ error: 'Missing required order fields.' });
  }

  const orderRecord = {
    order_id: String(orderId),
    customer_name: String(customerName),
    email: email ? String(email) : null,
    phone: String(phone),
    address: String(address || ''),
    city: String(city || ''),
    country: String(country || 'India'),
    postal: String(postal || ''),
    payment_method: String(paymentMethod || 'Online payment'),
    total: Number(total),
    items: Array.isArray(items) ? items : [],
    status: String(status || 'confirmed'),
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([orderRecord])
        .select()
        .single();

      if (error) {
        console.error('Supabase order insert error:', error);
        return res.status(500).json({ error: error.message, savedLocally: true });
      }

      return res.status(201).json({ success: true, order: data, source: 'supabase' });
    } catch (err) {
      console.error('Supabase orders exception:', err);
      return res.status(500).json({ error: err.message, savedLocally: true });
    }
  }

  // Fallback when Supabase env variables are not yet provided
  res.json({
    success: true,
    warning: 'Supabase credentials not yet configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    order: orderRecord,
    source: 'local'
  });
});

app.get(['/api/orders', '/orders'], async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured on the server.' });
  }

  try {
    const { phone, orderId } = req.query;
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (phone) query = query.eq('phone', phone);
    if (orderId) query = query.eq('order_id', orderId);

    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json({ orders: data });
  } catch (err) {
    console.error('Supabase orders fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---- SUPABASE: BOOKINGS API --------------------------------
app.post(['/api/bookings', '/bookings'], async (req, res) => {
  const {
    bookingId,
    serviceId,
    serviceName,
    ownerName,
    phone,
    petName,
    bookingDate,
    timeSlot,
    notes
  } = req.body || {};

  if (!ownerName || !phone || !petName || !bookingDate) {
    return res.status(400).json({ error: 'Missing required booking fields.' });
  }

  const generatedId = bookingId || `BK${Date.now().toString().slice(-6)}`;
  const bookingRecord = {
    booking_id: String(generatedId),
    service_id: String(serviceId || ''),
    service_name: String(serviceName || 'Pet Spa Grooming'),
    owner_name: String(ownerName),
    phone: String(phone),
    pet_name: String(petName),
    booking_date: String(bookingDate),
    time_slot: String(timeSlot || 'Morning (10:00 AM)'),
    notes: notes ? String(notes) : null,
    status: 'confirmed',
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingRecord])
        .select()
        .single();

      if (error) {
        console.error('Supabase booking insert error:', error);
        return res.status(500).json({ error: error.message, savedLocally: true });
      }

      return res.status(201).json({ success: true, booking: data, source: 'supabase' });
    } catch (err) {
      console.error('Supabase bookings exception:', err);
      return res.status(500).json({ error: err.message, savedLocally: true });
    }
  }

  res.json({
    success: true,
    warning: 'Supabase credentials not yet configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    booking: bookingRecord,
    source: 'local'
  });
});

app.get(['/api/bookings', '/bookings'], async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured on the server.' });
  }

  try {
    const { date, phone } = req.query;
    let query = supabase.from('bookings').select('*').order('booking_date', { ascending: true });

    if (date) query = query.eq('booking_date', date);
    if (phone) query = query.eq('phone', phone);

    const { data, error } = await query.limit(50);
    if (error) throw error;
    res.json({ bookings: data });
  } catch (err) {
    console.error('Supabase bookings fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---- ADMIN API ---------------------------------------------
app.get(['/api/admin/stats', '/admin/stats'], async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  try {
    // Determine start of today in IST (UTC+5:30)
    const now = new Date();
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 3600000;
    const istNow = new Date(utcTime + istOffset);
    const todayStr = istNow.toISOString().split('T')[0];
    const todayStartIso = `${todayStr}T00:00:00.000Z`;

    // Fetch all orders
    const { data: allOrders, error: orderErr } = await supabase
      .from('orders')
      .select('order_id, total, status, created_at');

    if (orderErr) throw orderErr;

    const orders = allOrders || [];
    let todayOrdersCount = 0;
    let todayRevenue = 0;
    let totalRevenue = 0;
    let pendingOrders = 0;

    for (const o of orders) {
      const amt = Number(o.total) || 0;
      totalRevenue += amt;

      if (o.status !== 'delivered' && o.status !== 'cancelled') {
        pendingOrders++;
      }

      if (o.created_at && o.created_at >= todayStartIso) {
        todayOrdersCount++;
        todayRevenue += amt;
      }
    }

    // Fetch bookings
    const { data: allBookings, error: bookErr } = await supabase
      .from('bookings')
      .select('booking_id, booking_date, status');

    if (bookErr) throw bookErr;

    const bookings = allBookings || [];
    let todayBookingsCount = 0;
    let upcomingBookings = 0;

    for (const b of bookings) {
      if (b.booking_date === todayStr) {
        todayBookingsCount++;
      }
      if (b.booking_date >= todayStr && b.status !== 'cancelled') {
        upcomingBookings++;
      }
    }

    res.json({
      todayStr,
      today: {
        ordersCount: todayOrdersCount,
        revenue: todayRevenue,
        bookingsCount: todayBookingsCount
      },
      overall: {
        totalOrders: orders.length,
        totalRevenue,
        pendingOrders,
        upcomingBookings
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/orders/status', '/orders/status'], async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured.' });

  const { orderId, status } = req.body || {};
  const validStatuses = ['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!orderId || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status or orderId' });
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('order_id', orderId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, order: data });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post(['/api/bookings/status', '/bookings/status'], async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Supabase is not configured.' });

  const { bookingId, status } = req.body || {};
  const validStatuses = ['confirmed', 'completed', 'cancelled'];
  if (!bookingId || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status or bookingId' });
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, booking: data });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: err.message });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Pet Society server listening on http://localhost:${port}`);
  });
}

module.exports = app;
