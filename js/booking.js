// ============================================================
//  PET SOCIETY — BOOKING MODAL MODULE
// ============================================================

import { showToast } from './cart.js';
import { SPA_SERVICES } from './data.js';

let selectedService = null;

// ---- OPEN / CLOSE ----------------------------------------
export function openBooking() {
  const modal = document.getElementById('booking-modal');
  const overlay = document.getElementById('overlay');
  modal?.classList.add('open');
  overlay?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeBooking() {
  const modal = document.getElementById('booking-modal');
  const overlay = document.getElementById('overlay');
  modal?.classList.remove('open');
  if (!document.getElementById('cart-drawer')?.classList.contains('open')) {
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ---- RENDER BOOKING MODAL --------------------------------
export function renderBookingModal() {
  const servicesGrid = document.getElementById('booking-services-grid');
  if (!servicesGrid) return;

  servicesGrid.innerHTML = SPA_SERVICES.map(s => `
    <div class="booking-service-card" id="service-${s.id}" data-service="${s.id}"
         onclick="window.bookingAPI.selectService('${s.id}')">
      <div class="booking-service-icon">${s.icon}</div>
      <div class="booking-service-name">${s.name}</div>
      <div class="booking-service-price">${s.price}</div>
    </div>
  `).join('');
}

// ---- SELECT SERVICE --------------------------------------
export function selectService(serviceId) {
  selectedService = serviceId;
  document.querySelectorAll('.booking-service-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.service === serviceId);
  });
}

// ---- SUBMIT BOOKING --------------------------------------
export function submitBooking(e) {
  e.preventDefault();
  const name    = document.getElementById('booking-name')?.value?.trim();
  const phone   = document.getElementById('booking-phone')?.value?.trim();
  const petName = document.getElementById('booking-pet-name')?.value?.trim();
  const date    = document.getElementById('booking-date')?.value;

  if (!name || !phone || !petName || !date || !selectedService) {
    showToast('⚠️ Please fill in all fields & choose a service.', 'error');
    return;
  }

  // Booking confirmation
  const service = SPA_SERVICES.find(s => s.id === selectedService);
  const bookingId = `BK${Date.now().toString().slice(-6)}`;
  showToast(`🎉 Appointment booked for ${petName}! We'll confirm via SMS.`, 'success');
  closeBooking();

  // Sync to Supabase cloud database
  fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingId,
      serviceId: selectedService,
      serviceName: service?.name || 'Grooming Spa',
      ownerName: name,
      phone,
      petName,
      bookingDate: date,
      notes: `Service: ${service?.name} (${service?.price})`
    })
  }).then(r => r.json()).then(res => {
    console.log('Booking synced to database:', res);
  }).catch(err => {
    console.warn('Booking sync deferred:', err);
  });

  // Reset form
  document.getElementById('booking-form')?.reset();
  selectedService = null;
  document.querySelectorAll('.booking-service-card').forEach(c => c.classList.remove('selected'));
}

// ---- SET MIN DATE ----------------------------------------
export function setMinBookingDate() {
  const dateInput = document.getElementById('booking-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = tomorrow.toISOString().split('T')[0];
  }
}
