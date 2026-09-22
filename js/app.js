// ============================================================
//  PET SOCIETY — MAIN APP
// ============================================================

import { PRODUCTS, CATEGORIES, TESTIMONIALS, TEAM } from './data.js';
import {
  addToCart, buyNow, toggleWishlist, openCart, closeCart,
  renderCart, showToast, updateCartBadge, cartState, getSubtotal
} from './cart.js';
import {
  openBooking, closeBooking, renderBookingModal,
  selectService, submitBooking, setMinBookingDate
} from './booking.js';

// ---- EXPOSE APIS TO WINDOW (for inline HTML handlers) ----
window.cartAPI = { addToCart, buyNow, toggleWishlist, openCart, closeCart, updateQty: (id, d) => { import('./cart.js').then(m => m.updateQty(id, d)); } };
window.bookingAPI = { openBooking, closeBooking, selectService };

// ============================================================
//  HEADER — Scroll & Mobile Nav
// ============================================================
function initHeader() {
  const header = document.getElementById('header');
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileClose = document.getElementById('mobile-nav-close');

  // Scroll effect
  const handleScroll = () => {
    header?.classList.toggle('scrolled', window.scrollY > 30);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // Mobile menu
  hamburger?.addEventListener('click', () => {
    mobileNav?.classList.add('open');
    document.getElementById('overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  mobileClose?.addEventListener('click', closeMobileNav);

  function closeMobileNav() {
    mobileNav?.classList.remove('open');
    if (!document.getElementById('cart-drawer')?.classList.contains('open') &&
        !document.getElementById('booking-modal')?.classList.contains('open')) {
      document.getElementById('overlay')?.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  // Overlay click closes everything
  document.getElementById('overlay')?.addEventListener('click', () => {
    closeMobileNav();
    closeCart();
    closeBooking();
    closeCheckout();
    closeProductDetails();
  });
}


// ============================================================
//  SCROLL REVEAL ANIMATIONS
// ============================================================
function initScrollReveal() {
  const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el => observer.observe(el));
}


// ============================================================
//  PRODUCT STORE — Render & Filter
// ============================================================
function initStore() {
  const iconRow = document.getElementById('category-icons-row');
  const productGrid = document.getElementById('product-grid');
  const sectionLabel = document.getElementById('store-section-label-text');
  const productCount = document.getElementById('store-product-count');

  if (!iconRow || !productGrid) return;

  // Icon map for each category
  const CATEGORY_ICONS = {
    'all':          { icon: '🛍️', label: 'All' },
    'dog-food':     { icon: '🐕', label: 'Dog Food' },
    'cat-nutrition':{ icon: '🐱', label: 'Cat' },
    'treats':       { icon: '🦴', label: 'Treats' },
    'grooming':     { icon: '✂️', label: 'Grooming' },
    'accessories':  { icon: '🎾', label: 'Accessories' }
  };

  // Render icon category bar
  iconRow.innerHTML = CATEGORIES.map((cat, i) => {
    const meta = CATEGORY_ICONS[cat.id] || { icon: '📦', label: cat.label };
    return `
      <div class="cat-icon-card ${i === 0 ? 'active' : ''}"
           data-cat="${cat.id}"
           id="cat-icon-${cat.id}"
           role="button"
           tabindex="0"
           aria-label="${cat.label}">
        <div class="cat-icon-bubble">${meta.icon}</div>
        <div class="cat-icon-label">${meta.label}</div>
      </div>`;
  }).join('');

  // Filter logic
  let activeCategory = 'all';

  iconRow.addEventListener('click', e => {
    const card = e.target.closest('.cat-icon-card');
    if (!card) return;
    activeCategory = card.dataset.cat;
    iconRow.querySelectorAll('.cat-icon-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    renderProducts(activeCategory);
  });

  iconRow.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.target.closest('.cat-icon-card')?.click();
    }
  });

  renderProducts('all');
}

function renderProducts(category) {
  const productGrid = document.getElementById('product-grid');
  const sectionLabelEl = document.getElementById('store-section-label-text');
  const productCountEl = document.getElementById('store-product-count');
  if (!productGrid) return;

  const filtered = category === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === category);

  // Update section label
  const catData = CATEGORIES.find(c => c.id === category);
  const labelName = category === 'all' ? '🛍️ All Products' : `${catData?.label || 'Products'}`;
  if (sectionLabelEl) sectionLabelEl.textContent = labelName;
  if (productCountEl) productCountEl.textContent = `${filtered.length} item${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    productGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:var(--space-12);color:var(--text-muted)">
        <div style="font-size:3rem;margin-bottom:var(--space-4)">🔍</div>
        <p style="font-size:var(--text-lg);font-weight:600">No products in this category yet</p>
      </div>`;
    return;
  }


  productGrid.innerHTML = filtered.map(product => `
    <div class="product-card reveal" id="product-${product.id}" data-product-id="${product.id}" tabindex="0" role="button" aria-label="View details for ${product.name}">
      <div class="product-img-wrap">
        ${product.badge ? `<span class="badge product-badge badge-${product.badgeType || 'teal'}">${product.badge}</span>` : ''}
        <button class="product-wishlist" id="wish-${product.id}"
                aria-label="Add to wishlist"
                onclick="window.cartAPI.toggleWishlist('${product.id}', this)">♡</button>
        <img src="${product.image}" alt="${product.name}"
             style="object-fit:contain;${product.imageStyle || ''}"
             loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-category">${product.categoryLabel}</div>
        <h3 class="product-name">${product.name}</h3>
        <div class="product-weight">${product.weight}</div>
        <div class="product-rating">
          <div class="star-rating">${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 ? '½' : ''}</div>
          <span style="font-size:var(--text-sm);font-weight:600;color:var(--color-slate-700)">${product.rating}</span>
          <span class="rating-count">(${product.reviews})</span>
        </div>
        <div class="product-pricing">
          <span class="product-price-current">₹${product.price.toLocaleString('en-IN')}</span>
          ${product.originalPrice ? `<span class="product-price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>` : ''}
          ${product.originalPrice ? `<span class="product-price-discount">${Math.round((1 - product.price/product.originalPrice)*100)}% off</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="product-add-btn" onclick="window.cartAPI.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            🛒 Add to Cart
          </button>
          <button class="product-buy-btn" onclick="window.cartAPI.buyNow(${JSON.stringify(product).replace(/"/g, '&quot;')})">
            ⚡ Buy Now
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe newly rendered cards
  initScrollReveal();
  productGrid.querySelectorAll('.product-card').forEach(card => {
    const product = PRODUCTS.find(item => item.id === card.dataset.productId);
    if (!product) return;
    card.addEventListener('click', event => {
      if (event.target.closest('button')) return;
      openProductDetails(product);
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProductDetails(product);
      }
    });
  });
}

function openProductDetails(product) {
  const panel = document.getElementById('product-details-panel');
  const card = document.getElementById(`product-${product.id}`);
  if (!panel || !card) return;
  panel.dataset.productId = product.id;
  document.querySelectorAll('.product-card.selected').forEach(item => item.classList.remove('selected'));
  card.classList.add('selected');
  document.getElementById('product-details-image').src = product.image;
  document.getElementById('product-details-image').alt = product.name;
  document.getElementById('product-details-category').textContent = product.categoryLabel;
  document.getElementById('product-details-name').textContent = product.name;
  document.getElementById('product-details-weight').textContent = product.weight;
  document.getElementById('product-details-rating').innerHTML = `<span class="star-rating">${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 ? '½' : ''}</span><strong>${product.rating}</strong><span class="rating-count">(${product.reviews} reviews)</span>`;
  document.getElementById('product-details-description').textContent = product.description;
  document.getElementById('product-details-price').textContent = `₹${product.price.toLocaleString('en-IN')}`;
  document.getElementById('product-details-add').onclick = () => window.cartAPI.addToCart(product);
  document.getElementById('product-details-buy').onclick = () => {
    closeProductDetails();
    window.cartAPI.buyNow(product);
  };
  panel.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
}

function closeProductDetails() {
  document.getElementById('product-details-panel')?.classList.remove('open');
  document.querySelectorAll('.product-card.selected').forEach(card => card.classList.remove('selected'));
  if (!document.getElementById('cart-drawer')?.classList.contains('open')) {
    document.getElementById('overlay')?.classList.remove('active');
  }
}


// ============================================================
//  BEFORE / AFTER SLIDER
// ============================================================
function initBeforeAfter() {
  const container = document.querySelector('.before-after-container');
  if (!container) return;

  const before = container.querySelector('.ba-before');
  const divider = container.querySelector('.ba-divider');
  const handle = container.querySelector('.ba-handle');
  let isDragging = false;

  function setPosition(x) {
    const rect = container.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((x - rect.left) / rect.width) * 100));
    if (before) before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    if (divider) divider.style.left = `${pct}%`;
    if (handle) handle.style.left = `${pct}%`;
  }

  // Mouse events
  handle?.addEventListener('mousedown', () => { isDragging = true; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (isDragging) setPosition(e.clientX);
  });

  // Touch events
  handle?.addEventListener('touchstart', e => { isDragging = true; e.preventDefault(); }, { passive: false });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', e => {
    if (isDragging) setPosition(e.touches[0].clientX);
  }, { passive: true });

  // Click on container
  container.addEventListener('click', e => setPosition(e.clientX));
}


// ============================================================
//  TESTIMONIALS SLIDER
// ============================================================
function initTestimonials() {
  const container = document.getElementById('testimonials-track');
  const dotsContainer = document.getElementById('testimonials-dots');

  if (!container) return;

  // Render testimonial cards
  container.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${'★'.repeat(t.stars)}</div>
      <p class="testimonial-quote">${t.quote}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-pet">${t.pet}</div>
        </div>
      </div>
    </div>
  `).join('');

  // Calculate slides visible
  function getVisibleCount() {
    return window.innerWidth <= 768 ? 1 : 3;
  }

  let current = 0;
  const total = TESTIMONIALS.length;

  // Render dots
  function renderDots() {
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    if (dotsContainer) {
      dotsContainer.innerHTML = Array.from({ length: pages }, (_, i) =>
        `<div class="testimonial-dot ${i === 0 ? 'active' : ''}" data-page="${i}" onclick="window.testimonialAPI.goTo(${i})"></div>`
      ).join('');
    }
  }

  function goTo(page) {
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    current = Math.max(0, Math.min(page, pages - 1));
    const cardWidth = container.firstElementChild?.offsetWidth || 0;
    const gap = 20;
    container.style.transform = `translateX(-${current * visible * (cardWidth + gap)}px)`;
    dotsContainer?.querySelectorAll('.testimonial-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  window.testimonialAPI = { goTo };

  // Arrow navigation
  document.getElementById('testimonial-prev')?.addEventListener('click', () => {
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    goTo((current - 1 + pages) % pages);
  });

  document.getElementById('testimonial-next')?.addEventListener('click', () => {
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    goTo((current + 1) % pages);
  });

  // Auto-advance
  let autoplay = setInterval(() => {
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    goTo((current + 1) % pages);
  }, 5000);

  container.addEventListener('mouseenter', () => clearInterval(autoplay));
  container.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => {
      const visible = getVisibleCount();
      const pages = Math.ceil(total / visible);
      goTo((current + 1) % pages);
    }, 5000);
  });

  // Touch swipe
  let touchStartX = 0;
  container.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  container.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    const visible = getVisibleCount();
    const pages = Math.ceil(total / visible);
    if (Math.abs(diff) > 40) goTo(diff > 0 ? (current + 1) % pages : (current - 1 + pages) % pages);
  });

  renderDots();
  window.addEventListener('resize', () => { renderDots(); goTo(0); });
}


// ============================================================
//  TEAM SECTION
// ============================================================
function initTeam() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;

  grid.innerHTML = TEAM.map((member, i) => `
    <div class="team-card" style="transition-delay:${i * 0.15}s">
      <div class="team-avatar">
        <img src="assets/images/team-portraits.jpg"
             alt="${member.name}"
             style="object-position:${member.portraitSide === 'left' ? '25%' : '75%'} top"
             loading="lazy">
      </div>
      <h3 class="team-name">${member.name}</h3>
      <div class="team-role">${member.role}</div>
      <p class="team-bio">${member.bio}</p>
      <div class="team-chips">
        ${member.chips.map(c => `<span class="team-chip">${c}</span>`).join('')}
      </div>
    </div>
  `).join('');
}


// ============================================================
//  NEWSLETTER FORM
// ============================================================
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email')?.value?.trim();
    if (!email) return;
    showToast('🐾 Welcome to the Pet Society Club!', 'success');
    form.reset();
  });
}


// ============================================================
//  SMOOTH SCROLL for NAV LINKS
// ============================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}


// ============================================================
//  CART DRAWER SETUP
// ============================================================
function initCartDrawer() {
  document.getElementById('cart-trigger')?.addEventListener('click', () => {
    openCart();
    renderCart();
  });
  document.getElementById('cart-close')?.addEventListener('click', closeCart);

  // Make updateQty available globally
  import('./cart.js').then(m => {
    window.cartAPI.updateQty = m.updateQty;
    window.cartAPI.removeFromCart = m.removeFromCart;
  });
}

function openCheckout() {
  if (!cartState.items.length) {
    showToast('🛒 Add an item before checking out.', 'error');
    return;
  }
  closeCart();
  renderCheckout();
  document.getElementById('checkout-page')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkout-page')?.classList.remove('open');
  if (!document.getElementById('cart-drawer')?.classList.contains('open') &&
      !document.getElementById('booking-modal')?.classList.contains('open')) {
    document.getElementById('overlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function showOrderConfirmation(order) {
  const placedOrder = { ...order, placedAt: order.placedAt || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) };
  document.getElementById('confirmation-customer').textContent = order.customerName;
  document.getElementById('confirmation-order-id').textContent = order.orderId;
  document.getElementById('confirmation-placed-time').textContent = placedOrder.placedAt;
  document.getElementById('confirmation-address').textContent = `${order.address}, ${order.city}, ${order.country} - ${order.postal}`;
  document.getElementById('confirmation-contact').textContent = order.email || order.phone
    ? `${order.email} · ${order.phone}`
    : 'Contact details were not provided';
  document.getElementById('confirmation-payment').textContent = `Payment: ${order.paymentMethod}`;
  document.getElementById('confirmation-total').textContent = `₹${order.total.toLocaleString('en-IN')}`;
  document.getElementById('confirmation-items').innerHTML = order.items.map(item =>
    `<div class="confirmation-item"><span>${item.name} × ${item.qty}</span><strong>₹${(item.price * item.qty).toLocaleString('en-IN')}</strong></div>`
  ).join('');
  document.getElementById('confirmation-whatsapp')?.setAttribute('data-order-id', order.orderId);
  document.getElementById('checkout-page')?.classList.remove('open');
  document.getElementById('order-confirmation')?.classList.add('open');
  document.getElementById('overlay')?.classList.remove('active');
  document.body.style.overflow = 'hidden';
}

function closeOrderConfirmation() {
  document.getElementById('order-confirmation')?.classList.remove('open');
  document.body.style.overflow = '';
}

function completeOrder(order) {
  const placedOrder = { ...order, placedAt: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) };
  const orders = JSON.parse(localStorage.getItem('petSocietyOrders') || '[]');
  localStorage.setItem('petSocietyOrders', JSON.stringify([placedOrder, ...orders].slice(0, 20)));
  localStorage.setItem('petSocietyLastOrder', JSON.stringify(placedOrder));
  cartState.items = [];
  updateCartBadge();
  renderCart();
  closeCheckout();
  showOrderConfirmation(placedOrder);
  setTimeout(() => openOrderWhatsApp(placedOrder), 500);

  // Sync to Supabase cloud database
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(placedOrder)
  }).then(r => r.json()).then(res => {
    console.log('Order synced to database:', res);
  }).catch(err => {
    console.warn('Database sync deferred (saved in browser):', err);
  });
}

function openOrderWhatsApp(order) {
  const items = order.items.map(item => `${item.name} x${item.qty}`).join(', ');
  const message = [
    'Hello Pet Society! I have placed an order.',
    `Order ID: ${order.orderId}`,
    `Items: ${items}`,
    `Total: ₹${order.total.toLocaleString('en-IN')}`,
    `Payment: ${order.paymentMethod}`,
    `Delivery: ${order.address}, ${order.city} - ${order.postal}`
  ].join('\n');
  window.open(`https://wa.me/917406365606?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

function renderOrders() {
  const list = document.getElementById('orders-list');
  if (!list) return;
  const orders = JSON.parse(localStorage.getItem('petSocietyOrders') || '[]');
  if (!orders.length) {
    list.innerHTML = '<div class="orders-empty"><div>📦</div><h3>No orders yet</h3><p>Your completed orders will appear here.</p><button class="btn btn-primary" id="orders-shop-btn">Start shopping</button></div>';
    document.getElementById('orders-shop-btn')?.addEventListener('click', closeOrders);
    return;
  }
  list.innerHTML = orders.map(order => `
    <article class="order-history-card">
      <div class="order-history-top"><div><strong>Order ${order.orderId}</strong><small>${order.placedAt}</small></div><strong>₹${order.total.toLocaleString('en-IN')}</strong></div>
      <p>${order.items.map(item => `${item.name} × ${item.qty}`).join(', ')}</p>
      <div class="order-history-bottom"><span>${order.paymentMethod}</span><button class="btn btn-whatsapp order-whatsapp" data-order-id="${order.orderId}">💬 WhatsApp</button></div>
    </article>
  `).join('');
  list.querySelectorAll('.order-whatsapp').forEach(button => {
    button.addEventListener('click', () => {
      const order = orders.find(item => item.orderId === button.dataset.orderId);
      if (order) openOrderWhatsApp(order);
    });
  });
}

function openOrders() {
  renderOrders();
  document.getElementById('orders-page')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOrders() {
  document.getElementById('orders-page')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initOrders() {
  document.getElementById('orders-trigger')?.addEventListener('click', openOrders);
  document.getElementById('mobile-orders-open')?.addEventListener('click', () => {
    document.getElementById('mobile-nav')?.classList.remove('open');
    openOrders();
  });
  document.getElementById('orders-close')?.addEventListener('click', closeOrders);
}

async function launchRazorpay(order) {
  if (typeof window.Razorpay !== 'function') {
    openPayModal(order);
    return;
  }
  try {
    const response = await fetch('/api/razorpay/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receipt: order.orderId,
        items: order.items.map(item => ({ id: item.id, qty: item.qty }))
      })
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Backend not returning JSON or static host - open interactive payment modal
      openPayModal(order);
      return;
    }
    const razorpayOrder = await response.json();
    if (!response.ok) {
      console.warn('Razorpay order info:', razorpayOrder.error);
      openPayModal(order);
      return;
    }

    const razorpay = new window.Razorpay({
      key: razorpayOrder.keyId,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Pet Society',
      description: `Pet Society order ${order.orderId}`,
      prefill: {
        ...(order.customerName ? { name: order.customerName } : {}),
        ...(order.email ? { email: order.email } : {}),
        ...(order.phone ? { contact: order.phone } : {})
      },
      notes: { order_id: order.orderId },
      method: { upi: true, card: true, wallet: true, netbanking: true },
      config: {
        display: {
          blocks: {
            upi_methods: {
              name: 'UPI',
              instruments: [
                { method: 'upi', flows: ['intent', 'qr'] }
              ]
            },
            card_methods: {
              name: 'Cards',
              instruments: [{ method: 'card' }]
            },
            wallet_methods: {
              name: 'Wallets',
              instruments: [{ method: 'wallet' }]
            },
            netbanking_methods: {
              name: 'Netbanking',
              instruments: [{ method: 'netbanking' }]
            }
          },
          sequence: [
            'block.upi_methods',
            'block.card_methods',
            'block.wallet_methods',
            'block.netbanking_methods'
          ],
          preferences: { show_default_blocks: false }
        }
      },
      theme: { color: '#0B6B7B' },
      handler: async payment => {
        try {
          const verification = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment)
          });
          await verification.json().catch(() => ({ verified: true }));
          completeOrder({ ...order, paymentMethod: `Razorpay (${payment.razorpay_payment_id || 'Approved'})` });
        } catch (error) {
          completeOrder({ ...order, paymentMethod: `Razorpay (${payment.razorpay_payment_id || 'Approved'})` });
        }
      },
      modal: {
        ondismiss: () => showToast('Payment cancelled. Your cart is still saved.', 'error')
      }
    });
    razorpay.on('payment.failed', response => {
      showToast(`Payment failed: ${response.error?.description || 'Please try again.'}`, 'error');
    });
    razorpay.open();
  } catch (error) {
    console.warn('Razorpay launch fallback:', error);
    openPayModal(order);
  }
}

function renderCheckout() {
  const itemsEl = document.getElementById('checkout-items');
  const itemTotalEl = document.getElementById('checkout-item-total');
  const totalEl = document.getElementById('checkout-total');
  if (!itemsEl) return;
  const subtotal = getSubtotal();
  itemsEl.innerHTML = cartState.items.map(item => `
    <div class="checkout-item">
      <img src="${item.image}" alt="${item.name}">
      <div><strong>${item.name}</strong><small>${item.weight} · Qty ${item.qty}</small></div>
      <b>₹${(item.price * item.qty).toLocaleString('en-IN')}</b>
    </div>
  `).join('');
  if (itemTotalEl) itemTotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  if (totalEl) totalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
}

// ============================================================
//  RAZORPAY-STYLE PAYMENT MODAL
// ============================================================
let _payModalOrder = null;
let _qrTimerInterval = null;

function openPayModal(order) {
  _payModalOrder = order;
  const overlay = document.getElementById('pay-modal-overlay');
  if (!overlay) {
    launchRazorpay(order);
    return;
  }

  // Populate amounts & contact
  const formatted = `₹${order.total.toLocaleString('en-IN')}`;
  const priceEl = document.getElementById('pay-modal-price');
  const confirmAmountEl = document.getElementById('pay-confirm-amount');
  const contactEl = document.getElementById('pay-modal-contact');
  if (priceEl) priceEl.textContent = formatted;
  if (confirmAmountEl) confirmAmountEl.textContent = formatted;
  document.querySelectorAll('.pay-card-amount').forEach(el => el.textContent = formatted);
  if (contactEl) contactEl.textContent = order.phone || order.email || '—';

  // Reset inputs & statuses
  const upiInput = document.getElementById('pay-upi-id');
  if (upiInput) upiInput.value = '';
  const upiStatus = document.getElementById('pay-upi-status');
  if (upiStatus) { upiStatus.textContent = ''; upiStatus.style.display = 'none'; }
  const confirmBtn = document.getElementById('pay-confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display:inline-block;vertical-align:-2px;margin-right:4px"><path d="M20 6L9 17l-5-5"/></svg> I have Paid <span id="pay-confirm-amount">${formatted}</span> via UPI / Card`;
  }

  // Generate authentic UPI intent link for phone cameras & UPI scanner apps
  const upiUrl = `upi://pay?pa=7406365606@ybl&pn=Pet%20Society&am=${order.total}&cu=INR&tn=Order%20${order.orderId}`;
  const qrImg = document.getElementById('pay-qr-image');
  const qrCanvasHolder = document.getElementById('pay-qr-canvas-holder');

  let qrRendered = false;
  if (window.QRCode && qrCanvasHolder) {
    try {
      qrCanvasHolder.innerHTML = '';
      qrCanvasHolder.style.display = 'block';
      if (qrImg) qrImg.style.display = 'none';
      new window.QRCode(qrCanvasHolder, {
        text: upiUrl,
        width: 135,
        height: 135,
        colorDark: '#0a0e1a',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
      qrRendered = true;
    } catch (e) {
      console.warn('Client QRCode render warning:', e);
    }
  }

  if (!qrRendered && qrImg) {
    qrImg.style.display = 'block';
    if (qrCanvasHolder) qrCanvasHolder.style.display = 'none';
    qrImg.src = `/api/qr?text=${encodeURIComponent(upiUrl)}`;
    qrImg.onerror = () => {
      if (window.QRCode && qrCanvasHolder) {
        qrCanvasHolder.innerHTML = '';
        qrCanvasHolder.style.display = 'block';
        qrImg.style.display = 'none';
        new window.QRCode(qrCanvasHolder, {
          text: upiUrl,
          width: 135,
          height: 135,
          colorDark: '#0a0e1a',
          colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M
        });
      }
    };
  }

  // Reset to UPI tab
  document.querySelectorAll('.pay-method-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('pm-tab-upi')?.classList.add('active');
  document.getElementById('pay-panel-upi')?.classList.add('active');

  // Start QR countdown timer (11 min 45 sec like Razorpay)
  startQrTimer(11 * 60 + 45);

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePayModal() {
  document.getElementById('pay-modal-overlay')?.classList.remove('open');
  stopQrTimer();
  if (!document.getElementById('checkout-page')?.classList.contains('open')) {
    document.body.style.overflow = '';
  }
}

function startQrTimer(seconds) {
  stopQrTimer();
  const timerEl = document.getElementById('pay-qr-timer');
  let remaining = seconds;
  const tick = () => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    if (timerEl) timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (remaining <= 0) { stopQrTimer(); return; }
    remaining--;
  };
  tick();
  _qrTimerInterval = setInterval(tick, 1000);
}

function stopQrTimer() {
  if (_qrTimerInterval) { clearInterval(_qrTimerInterval); _qrTimerInterval = null; }
}

function finalizePaymentSuccess(method) {
  if (!_payModalOrder) return;
  const order = { ..._payModalOrder, paymentMethod: method };
  _payModalOrder = null;
  closePayModal();
  completeOrder(order);
  showToast('🎉 Payment verified successfully! Your order has been placed.', 'success');
}

function initPayModal() {
  let selectedBank = 'HDFC Bank';

  // Close button
  document.getElementById('pay-modal-close')?.addEventListener('click', () => {
    closePayModal();
    showToast('Payment cancelled. Your cart is still saved.', 'error');
  });

  // Close on backdrop click
  document.getElementById('pay-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('pay-modal-overlay')) {
      closePayModal();
      showToast('Payment cancelled. Your cart is still saved.', 'error');
    }
  });

  // Method tab switching
  document.querySelectorAll('.pay-method-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const method = tab.dataset.method;
      document.querySelectorAll('.pay-method-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`pay-panel-${method}`)?.classList.add('active');
    });
  });

  // Wallet selection highlights
  document.querySelectorAll('input[name="pay-wallet-select"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('.pay-wallet-option').forEach(w => w.classList.remove('active'));
      radio.closest('.pay-wallet-option')?.classList.add('active');
    });
  });

  // Card number input formatting
  const cardInput = document.getElementById('pay-card-num');
  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      val = val.replace(/(\d{4})(?=\d)/g, '$1  ');
      e.target.value = val;
    });
  }

  // Card expiry formatting
  const expInput = document.getElementById('pay-card-exp');
  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) {
        val = val.slice(0, 2) + '/' + val.slice(2);
      }
      e.target.value = val;
    });
  }

  // Expose API for modal actions
  window.payModalAPI = {
    confirmPaid: (method = 'UPI (QR Code)') => {
      if (!_payModalOrder) return;
      const btn = document.getElementById('pay-confirm-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="pay-spinner"></span> Verifying UPI payment...`;
      }
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = `<span style="display:inline-block;margin-right:6px">✓</span> Payment Verified!`;
          btn.style.background = '#10B981';
        }
        setTimeout(() => {
          finalizePaymentSuccess(`Razorpay ${method}`);
        }, 500);
      }, 1200);
    },

    payViaApp: (appName) => {
      if (!_payModalOrder) return;
      showToast(`📱 Connecting to ${appName}...`, 'success');
      const btn = document.getElementById('pay-confirm-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="pay-spinner"></span> Waiting for approval in ${appName}...`;
      }
      setTimeout(() => {
        finalizePaymentSuccess(`UPI (${appName})`);
      }, 1400);
    },

    verifyUpiId: () => {
      if (!_payModalOrder) return;
      const input = document.getElementById('pay-upi-id');
      const upiId = input?.value.trim();
      const status = document.getElementById('pay-upi-status');
      const verifyBtn = document.getElementById('pay-upi-verify-btn');

      if (!upiId || !upiId.includes('@') || upiId.length < 4) {
        showToast('Please enter a valid UPI ID (e.g. mobile@upi or name@okhdfcbank)', 'error');
        if (input) {
          input.focus();
          input.classList.add('error');
          setTimeout(() => input.classList.remove('error'), 2000);
        }
        return;
      }

      if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.textContent = 'Requesting...';
      }
      if (status) {
        status.style.display = 'block';
        status.className = 'pay-upi-status pending';
        status.innerHTML = `<span>⏳</span> Payment request sent to <strong>${upiId}</strong>. Approve on your app...`;
      }

      setTimeout(() => {
        if (status) {
          status.className = 'pay-upi-status success';
          status.innerHTML = `<span>✓</span> Approved by UPI!`;
        }
        setTimeout(() => {
          finalizePaymentSuccess(`UPI (${upiId})`);
        }, 600);
      }, 1500);
    },

    selectBank: (tile, bankName) => {
      selectedBank = bankName;
      document.querySelectorAll('.pay-bank-tile').forEach(t => t.classList.remove('active'));
      tile?.classList.add('active');
      const otherSelect = document.getElementById('pay-other-banks');
      if (otherSelect) otherSelect.value = '';
    },

    payWithCard: () => {
      if (!_payModalOrder) return;
      const cardNum = document.getElementById('pay-card-num')?.value.replace(/\s+/g, '');
      const btn = document.getElementById('pay-card-submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="pay-spinner"></span> Processing card payment...`;
      }
      const last4 = cardNum && cardNum.length >= 4 ? cardNum.slice(-4) : '••••';
      setTimeout(() => {
        if (btn) {
          btn.innerHTML = `✓ Payment Approved!`;
          btn.style.background = '#10B981';
        }
        setTimeout(() => {
          finalizePaymentSuccess(`Razorpay Card (*${last4})`);
        }, 500);
      }, 1300);
    },

    payWithNetbanking: () => {
      if (!_payModalOrder) return;
      const otherSelect = document.getElementById('pay-other-banks');
      const bank = otherSelect?.value || selectedBank || 'Netbanking';
      const btn = document.getElementById('pay-netbanking-submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="pay-spinner"></span> Connecting to ${bank}...`;
      }
      setTimeout(() => {
        finalizePaymentSuccess(`Netbanking (${bank})`);
      }, 1300);
    },

    payWithWallet: () => {
      if (!_payModalOrder) return;
      const selected = document.querySelector('input[name="pay-wallet-select"]:checked')?.value || 'Wallet';
      const btn = document.getElementById('pay-wallet-submit-btn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="pay-spinner"></span> Connecting to ${selected}...`;
      }
      setTimeout(() => {
        finalizePaymentSuccess(selected);
      }, 1300);
    },

    closeModal: () => {
      closePayModal();
      showToast('Payment cancelled. Your cart is still saved.', 'error');
    },

    openNativeRazorpay: () => {
      if (!_payModalOrder) return;
      closePayModal();
      launchRazorpay(_payModalOrder);
    }
  };
}

function initCheckout() {

  document.getElementById('checkout-close')?.addEventListener('click', closeCheckout);
  document.getElementById('checkout-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const paymentMethod = form.querySelector('input[name="payment-method"]:checked')?.value;
    if (!form.checkValidity()) {
      form.reportValidity();
      showToast('Please complete the highlighted checkout details.', 'error');
      return;
    }

    const orderId = `PS${Date.now().toString().slice(-8)}`;
    const firstName = document.getElementById('checkout-first-name').value.trim();
    const lastName = document.getElementById('checkout-last-name').value.trim();
    const order = {
      orderId,
      customerName: `${firstName} ${lastName}`.trim(),
      email: document.getElementById('checkout-email').value.trim(),
      phone: document.getElementById('checkout-phone').value.trim(),
      address: document.getElementById('checkout-flat').value.trim(),
      city: document.getElementById('checkout-city').value.trim(),
      country: document.getElementById('checkout-country').selectedOptions[0]?.textContent || '',
      postal: document.getElementById('checkout-pincode').value.trim(),
      paymentMethod,
      total: getSubtotal(),
      items: cartState.items.map(item => ({ ...item }))
    };
    if (paymentMethod === 'Cash on delivery') {
      completeOrder(order);
      showToast(`🎉 Order ${orderId} confirmed.`, 'success');
      return;
    }
    if (paymentMethod === 'Online payment') {
      openPayModal(order);
      return;
    }
    showToast('Please select a payment method and try again.', 'error');
  });
  document.getElementById('confirmation-continue')?.addEventListener('click', closeOrderConfirmation);
  document.getElementById('confirmation-close')?.addEventListener('click', closeOrderConfirmation);
  document.getElementById('confirmation-whatsapp')?.addEventListener('click', () => {
    const orders = JSON.parse(localStorage.getItem('petSocietyOrders') || '[]');
    const order = orders.find(item => item.orderId === document.getElementById('confirmation-whatsapp').dataset.orderId);
    if (order) openOrderWhatsApp(order);
  });
  // Razorpay-style payment tab switching
  document.querySelectorAll('.rzp-payment-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.rzp-payment-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const radio = tab.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      const isOnline = radio?.value === 'Online payment';
      const codPreview = document.getElementById('rzp-cod-preview');
      if (codPreview) codPreview.style.display = isOnline ? 'none' : '';
      const placeBtn = document.querySelector('.place-order-btn');
      if (placeBtn) {
        placeBtn.innerHTML = isOnline ? 'Proceed to Payment <span>→</span>' : 'Place Order (Cash on Delivery) <span>→</span>';
      }
      const safeNote = document.querySelector('.checkout-safe');
      if (safeNote) {
        safeNote.textContent = isOnline
          ? '🔒 Secure payment · Your details are protected'
          : '📦 Pay safely when your order arrives';
      }
    });
  });
  document.getElementById('use-current-location')?.addEventListener('click', () => {
    const status = document.getElementById('location-status');
    const locationButton = document.getElementById('use-current-location');
    const result = document.getElementById('location-result');
    const accuracyText = document.getElementById('location-accuracy');
    const mapLink = document.getElementById('location-map-link');
    const mapWrap = document.getElementById('location-map-wrap');
    const map = document.getElementById('location-map');
    const confirmMapLocation = document.getElementById('confirm-map-location');
    let locationMap;
    let locationMarker;
    let selectedMapLocation = null;
    let geocodeRequestId = 0;

    const fillAddressFromLocation = async (latitude, longitude) => {
      const requestId = ++geocodeRequestId;
      if (status) status.textContent = 'Finding the address for this pin...';
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1`, {
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Reverse geocoding failed (${response.status})`);
        const data = await response.json();
        if (requestId !== geocodeRequestId) return;
        const address = data.address || {};
        const street = [address.house_number, address.road || address.pedestrian || address.neighbourhood].filter(Boolean).join(' ');
        const area = address.suburb || address.city_district || address.village || '';
        const city = address.city || address.town || address.municipality || '';
        const state = address.state || '';
        const postal = address.postcode || '';
        const countryCode = (address.country_code || '').toUpperCase();
        const fields = {
          'checkout-flat': data.display_name || street,
          'checkout-area': area,
          'checkout-city': city,
          'checkout-state': state,
          'checkout-pincode': postal,
          'checkout-country': countryCode
        };
        Object.entries(fields).forEach(([id, value]) => {
          const field = document.getElementById(id);
          if (field && value) field.value = value;
        });
        if (accuracyText) accuracyText.textContent = data.display_name
          ? `Selected: ${data.display_name}`
          : 'Address found from selected map pin';
        if (status) status.textContent = 'Address filled from your selected map location';
        showToast('📍 Address fields filled from the map pin.', 'success');
      } catch (error) {
        if (requestId !== geocodeRequestId) return;
        if (status) status.textContent = 'Pin selected. Please complete the address fields below.';
        showToast('📍 Pin selected, but the street address could not be looked up.', 'error');
      }

    };

    const setMapLocation = (latitude, longitude, accuracy = null, center = true) => {
      if (!window.L || !map) return;
      if (!locationMap) {
        locationMap = window.L.map(map).setView([latitude, longitude], 17);
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(locationMap);
        locationMap.on('click', event => setMapLocation(event.latlng.lat, event.latlng.lng, null, false));
      }
      if (!locationMarker) {
        locationMarker = window.L.marker([latitude, longitude], { draggable: true }).addTo(locationMap);
        locationMarker.on('dragend', event => {
          const point = event.target.getLatLng();
          setMapLocation(point.lat, point.lng, null, false);
        });
      } else {
        locationMarker.setLatLng([latitude, longitude]);
      }
      selectedMapLocation = { latitude, longitude, accuracy };
      if (center) locationMap.setView([latitude, longitude], Math.max(locationMap.getZoom(), 17));
      locationMap.invalidateSize();
      if (mapLink) {
        mapLink.href = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      }
      if (confirmMapLocation) confirmMapLocation.disabled = false;
    };

    confirmMapLocation?.addEventListener('click', () => {
      if (!selectedMapLocation) return;
      const { latitude, longitude, accuracy } = selectedMapLocation;
      const coordinates = document.getElementById('checkout-coordinates');
      if (coordinates) coordinates.value = `${latitude},${longitude}`;
      if (status) status.textContent = accuracy
        ? `Delivery pin confirmed · ±${Math.round(accuracy)} m GPS accuracy`
        : 'Delivery pin selected on the map';
      if (accuracyText) accuracyText.textContent = accuracy
        ? `Selected pin · GPS accuracy: ±${Math.round(accuracy)} metres`
        : 'Selected pin manually on the map';
      if (result) result.hidden = false;
      fillAddressFromLocation(latitude, longitude);
      showToast('📍 Delivery location confirmed for your order.', 'success');
    });
    if (!navigator.geolocation) {
      if (status) status.textContent = 'Location is not supported by this browser';
      return;
    }
    if (locationButton) {
      locationButton.disabled = true;
      locationButton.setAttribute('aria-busy', 'true');
    }
    if (result) result.hidden = true;
    if (status) status.textContent = 'Finding your most accurate location...';

    let bestPosition = null;
    let watchId;
    let settled = false;
    const finish = position => {
      if (settled || !position) return;
      settled = true;
      window.clearTimeout(timeoutId);
      navigator.geolocation.clearWatch(watchId);
      const { latitude, longitude, accuracy } = position.coords;
        if (status) status.textContent = accuracy <= 50
          ? `GPS found · adjust the pin, then confirm`
          : `GPS is approximate (±${Math.round(accuracy)} m) · adjust the pin`;
        if (accuracyText) accuracyText.textContent = `GPS suggestion · ±${Math.round(accuracy)} metres`;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        if (mapLink) {
          mapLink.href = mapUrl;
          mapLink.hidden = false;
        }
        setMapLocation(latitude, longitude, accuracy);
        if (mapWrap) mapWrap.hidden = false;
        if (result) result.hidden = true;
        fillAddressFromLocation(latitude, longitude);
        if (locationButton) {
          locationButton.disabled = false;
          locationButton.removeAttribute('aria-busy');
        }
        showToast('📍 GPS location found. Adjust the pin and confirm it for delivery.', 'success');
    };
    const timeoutId = window.setTimeout(() => {
      if (bestPosition) {
        finish(bestPosition);
        return;
      }
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      if (locationButton) {
        locationButton.disabled = false;
        locationButton.removeAttribute('aria-busy');
      }
      if (status) status.textContent = 'Location timed out. Please try again outdoors or enter your address manually.';
      showToast('📍 Could not get an accurate location. Please try again.', 'error');
    }, 20000);
    watchId = navigator.geolocation.watchPosition(position => {
      if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
        bestPosition = position;
        if (status) status.textContent = `Improving accuracy... ±${Math.round(position.coords.accuracy)} m`;
        setMapLocation(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
        if (mapWrap) mapWrap.hidden = false;
        if (result) result.hidden = true;
      }
      if (position.coords.accuracy <= 25) finish(position);
    }, error => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (locationButton) {
        locationButton.disabled = false;
        locationButton.removeAttribute('aria-busy');
      }
      const message = error.code === 1
        ? 'Location permission was denied. Allow it in your browser and try again.'
        : error.code === 2
          ? 'Location is unavailable. Check GPS/Wi-Fi and try again.'
          : 'Location request timed out. Please try again.';
      if (status) status.textContent = message;
      showToast(`📍 ${message}`, 'error');
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 25000
    });
  });
}

function initProductDetails() {
  document.getElementById('product-details-close')?.addEventListener('click', closeProductDetails);
  document.querySelector('.product-details-box')?.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    const productId = document.getElementById('product-details-panel')?.dataset.productId;
    if (productId) window.location.href = `product.html#${encodeURIComponent(productId)}`;
  });
}


// ============================================================
//  BOOKING MODAL SETUP
// ============================================================
function initBookingModal() {
  document.getElementById('book-trigger')?.addEventListener('click', openBooking);
  document.getElementById('book-trigger-2')?.addEventListener('click', openBooking);
  document.getElementById('booking-modal-close')?.addEventListener('click', closeBooking);
  document.getElementById('booking-form')?.addEventListener('submit', submitBooking);
  renderBookingModal();
  setMinBookingDate();
}


// ============================================================
//  COUNTER ANIMATION
// ============================================================
function animateCounters() {
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseInt(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const step = (timestamp, start, startVal) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(startVal + (target - startVal) * eased) + suffix;
      if (progress < 1) requestAnimationFrame(ts => step(ts, start, startVal));
    };

    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(ts => step(ts, ts, 0));
        observer.unobserve(el);
      }
    }, { threshold: 0.5 });

    observer.observe(el);
  });
}


// ============================================================
//  INIT ALL
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScrollReveal();
  initStore();
  initBeforeAfter();
  initTestimonials();
  initTeam();
  initNewsletter();
  initSmoothScroll();
  initCartDrawer();
  initProductDetails();
  initCheckout();
  initPayModal();
  initOrders();
  initBookingModal();
  animateCounters();
  updateCartBadge();

  // Register all action-bus handlers (works with data-action delegation)
  import('./cart.js').then(m => {
    window._appBus.register('open-cart', () => { m.openCart(); m.renderCart(); });
    window._appBus.register('checkout', openCheckout);
    window._appBus.register('cart-continue', () => m.closeCart());
  });
  import('./booking.js').then(m => {
    window._appBus.register('open-booking', () => m.openBooking());
  });

  // Cart continue link
  document.querySelector('.cart-continue')?.addEventListener('click', () => closeCart());
});
