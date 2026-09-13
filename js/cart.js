// ============================================================
//  PET SOCIETY — CART MODULE
// ============================================================

export const cartState = {
  items: [],
  wishlist: new Set()
};

const FREE_SHIPPING_THRESHOLD = 1500;

// ---- CART OPEN / CLOSE -----------------------------------
export function openCart() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('overlay')?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ---- ADD TO CART -----------------------------------------
export function addToCart(product) {
  const existing = cartState.items.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cartState.items.push({ ...product, qty: 1 });
  }
  renderCart();
  showToast(`🛒 ${product.name} added to cart!`, 'success');
  updateCartBadge();
}

// ---- REMOVE FROM CART ------------------------------------
export function removeFromCart(productId) {
  cartState.items = cartState.items.filter(i => i.id !== productId);
  renderCart();
  updateCartBadge();
}

// ---- UPDATE QTY ------------------------------------------
export function updateQty(productId, delta) {
  const item = cartState.items.find(i => i.id === productId);
  if (!item) return;
  item.qty = Math.max(1, item.qty + delta);
  renderCart();
  updateCartBadge();
}

// ---- WISHLIST --------------------------------------------
export function toggleWishlist(productId, btn) {
  if (cartState.wishlist.has(productId)) {
    cartState.wishlist.delete(productId);
    btn?.classList.remove('active');
    btn && (btn.textContent = '♡');
  } else {
    cartState.wishlist.add(productId);
    btn?.classList.add('active');
    btn && (btn.textContent = '♥');
    showToast('❤️ Added to wishlist!', 'success');
  }
  updateWishlistBadge();
}

// ---- SUBTOTAL --------------------------------------------
export function getSubtotal() {
  return cartState.items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export function getTotalQty() {
  return cartState.items.reduce((sum, i) => sum + i.qty, 0);
}

// ---- RENDER CART -----------------------------------------
export function renderCart() {
  const itemsEl = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const fillEl = document.getElementById('cart-shipping-fill');
  const shippingTextEl = document.getElementById('cart-shipping-text');

  if (!itemsEl) return;

  const subtotal = getSubtotal();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // Shipping bar
  if (fillEl) fillEl.style.width = `${progress}%`;
  if (shippingTextEl) {
    shippingTextEl.textContent = remaining > 0
      ? `Add ₹${remaining.toLocaleString('en-IN')} more for FREE delivery!`
      : '🎉 You\'ve unlocked FREE delivery!';
  }

  // Subtotal
  if (subtotalEl) {
    subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
  }

  // Items
  if (cartState.items.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p style="font-weight:600;color:var(--color-slate-700)">Your cart is empty</p>
        <p style="font-size:var(--text-sm)">Add some amazing pet products!</p>
      </div>`;
    return;
  }

  itemsEl.innerHTML = cartState.items.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">
        <img src="${item.image}" alt="${item.name}" style="object-position:${item.imageStyle?.replace('object-position:','').trim() || 'center'}">
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-variant">${item.weight}</div>
        <div class="cart-item-controls">
          <div class="qty-control">
            <button class="qty-btn" onclick="window.cartAPI.updateQty('${item.id}', -1)">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" onclick="window.cartAPI.updateQty('${item.id}', 1)">+</button>
          </div>
          <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
        </div>
        <span class="cart-item-remove" onclick="window.cartAPI.removeFromCart('${item.id}')">Remove</span>
      </div>
    </div>
  `).join('');
}

// ---- UPDATE BADGES ---------------------------------------
export function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const qty = getTotalQty();
  if (badge) {
    badge.textContent = qty;
    badge.style.display = qty > 0 ? 'flex' : 'none';
  }
}

export function updateWishlistBadge() {
  const badge = document.getElementById('wishlist-badge');
  if (badge) {
    const count = cartState.wishlist.size;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// ---- TOAST -----------------------------------------------
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3200);
}
