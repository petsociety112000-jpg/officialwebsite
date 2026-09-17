import { PRODUCTS } from './data.js';
import { addToCart } from './cart.js';

const productId = window.location.hash.slice(1);
const product = PRODUCTS.find(item => item.id === productId);
const content = document.getElementById('product-page-content');

if (!product) {
  document.title = 'Product not found | Pet Society';
  content.innerHTML = `
    <div class="product-page-empty">
      <div class="product-page-empty-icon">🔍</div>
      <h1>Product not found</h1>
      <p>That product may no longer be available.</p>
      <a class="product-page-back-button" href="index.html#store">Return to store</a>
    </div>`;
} else {
  document.title = `${product.name} | Pet Society`;
  content.innerHTML = `
    <div class="product-page-image-wrap">
      <img src="${product.image}" alt="${product.name}" style="object-position:${product.imageStyle?.replace('object-position:', '').trim() || 'center'}">
    </div>
    <div class="product-page-info">
      <div class="product-category">${product.categoryLabel}</div>
      <h1>${product.name}</h1>
      <p class="product-page-weight">${product.weight}</p>
      <div class="product-rating">
        <span class="star-rating">${'★'.repeat(Math.floor(product.rating))}${product.rating % 1 ? '½' : ''}</span>
        <strong>${product.rating}</strong>
        <span class="rating-count">(${product.reviews} reviews)</span>
      </div>
      <p class="product-page-description">${product.description}</p>
      <div class="product-page-price">₹${product.price.toLocaleString('en-IN')}</div>
      ${product.originalPrice ? `<p class="product-page-original-price">₹${product.originalPrice.toLocaleString('en-IN')} original price</p>` : ''}
      <div class="product-page-actions">
        <button class="product-add-btn" id="product-page-add">🛒 Add to Cart</button>
        <a class="product-buy-btn product-page-store-link" href="index.html#store">⚡ Continue shopping</a>
      </div>
    </div>`;

  document.getElementById('product-page-add').addEventListener('click', () => {
    addToCart(product);
  });
}
