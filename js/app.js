// ============================================================
//  PET SOCIETY — MAIN APP
// ============================================================

import { PRODUCTS, CATEGORIES, TESTIMONIALS, TEAM } from './data.js';
import {
  addToCart, toggleWishlist, openCart, closeCart,
  renderCart, showToast, updateCartBadge
} from './cart.js';
import {
  openBooking, closeBooking, renderBookingModal,
  selectService, submitBooking, setMinBookingDate
} from './booking.js';

// ---- EXPOSE APIS TO WINDOW (for inline HTML handlers) ----
window.cartAPI = { addToCart, toggleWishlist, openCart, closeCart, updateQty: (id, d) => { import('./cart.js').then(m => m.updateQty(id, d)); } };
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
    <div class="product-card reveal" id="product-${product.id}">
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
        <button class="product-add-btn" onclick="window.cartAPI.addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          🛒 Add to Cart
        </button>
      </div>
    </div>
  `).join('');

  // Re-observe newly rendered cards
  initScrollReveal();
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
    <div class="team-card reveal" style="transition-delay:${i * 0.15}s">
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
      const target = document.querySelector(a.getAttribute('href'));
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
  initBookingModal();
  animateCounters();
  updateCartBadge();

  // Register all action-bus handlers (works with data-action delegation)
  import('./cart.js').then(m => {
    window._appBus.register('open-cart', () => { m.openCart(); m.renderCart(); });
    window._appBus.register('checkout', () => m.showToast('🎉 Redirecting to secure checkout!', 'success'));
    window._appBus.register('cart-continue', () => m.closeCart());
  });
  import('./booking.js').then(m => {
    window._appBus.register('open-booking', () => m.openBooking());
  });

  // Cart continue link
  document.querySelector('.cart-continue')?.addEventListener('click', () => closeCart());
});
