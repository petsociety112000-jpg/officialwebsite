# 🐾 Pet Society — Luxury Spa & Pet Nutrition

[![Website](https://img.shields.io/badge/Status-Live%20Ready-brightgreen.svg)](#)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](#)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern, responsive web application for **Pet Society** — a premier cage-free pet grooming spa and curated pet nutrition store. Designed with rich aesthetics, micro-animations, and an interactive e-commerce and appointment booking experience.

---

## 🌟 Key Features

### 🛁 Interactive Spa & Grooming Booking
- **Step-by-Step Booking Modal**: Seamless multi-step scheduling for pet parents.
- **Service Selection**: Hydrobath & blow dry, full grooming styling, luxury ayurvedic spa packages, and dental/nail hygiene care.
- **Pet Profile Details**: Breed type, pet size, temperament notes, and custom date/time selection.
- **Instant Booking Confirmation**: Real-time feedback and toast notifications upon booking.

### 🛍️ E-Commerce Store & Cart System
- **Product Catalog**: Curated foods, veterinary-approved nutrition, organic treats, grooming shampoos, and accessories.
- **Dynamic Category Filtering**: Instant client-side filtering (Dog Food, Cat Nutrition, Treats, Grooming, Accessories) with badges (*Best Seller*, *New*, *Sale*).
- **Two-Stage Product Browsing**: Click a product once for a quick in-page preview, then click the preview content to open the complete product detail page.
- **Persistent Shopping Cart**: Slide-out cart drawer with quantity adjustments, item removal, price calculation, and LocalStorage persistence.
- **My Orders**: Customers can review their completed orders locally in the browser, including order items, totals, payment method, and WhatsApp support.
- **Interactive Wishlist**: Save favorite items with quick toggle and counter badges.
- **Razorpay Checkout**: Razorpay-hosted test-mode payment window for UPI, cards, wallets, and net banking.

### 🎨 Visuals & User Experience
- **Cage-Free Luxury Experience**: Showcase sections detailing stress-free grooming environments and certified groomers.
- **Interactive Before & After Gallery**: Visual transformations demonstrating styling quality.
- **Customer Reviews & Testimonials**: Verified ratings and testimonials from pet parents.
- **Fully Responsive**: Mobile-first fluid layouts with dedicated mobile navigation drawer and touch-friendly controls.
- **Micro-Interactions & Animations**: Smooth scroll reveals, dynamic badge counters, and animated toast alerts.
- **WhatsApp Support**: Order confirmations can open a prefilled WhatsApp message to customer support. Browsers require the customer to tap Send; websites cannot send WhatsApp messages silently.

---

## 📁 Project Structure

```text
pet-society/
├── assets/
│   └── images/              # Optimized imagery (hero, spa, products, team, before/after)
├── css/
│   ├── variables.css        # Color palette, spacing, typography tokens & shadows
│   ├── main.css             # Base styles, reset, layout, and global utilities
│   ├── components.css       # Buttons, cards, modals, drawers, toasts & badges
│   └── responsive.css       # Media queries for tablet, mobile, and desktop breakpoints
├── js/
│   ├── app.js               # Main application orchestration & UI event listeners
│   ├── booking.js           # Multi-step booking engine & appointment workflow
│   ├── cart.js              # Cart & Wishlist state management with LocalStorage
│   └── data.js              # Product catalog, services, categories & testimonials dataset
├── .gitignore               # Git ignore rules for OS and IDE files
├── index.html               # Main semantic HTML5 webpage
└── README.md                # Project documentation
```

---

## 🚀 Getting Started

No build tools or heavy node dependencies required! The project is built with vanilla web technologies and ES modules.

### Prerequisites
A modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari).

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/varunkshatriya/petsocietywebsite.git
   cd petsocietywebsite
   ```

2. **Serve with a local static server** (required for ES module support `type="module"`):

   - **Using VS Code Live Server extension**:
     Right-click `index.html` and select **"Open with Live Server"**.

   - **Using Node.js (`npx serve` or `npx http-server`)**:
     ```bash
     npx serve .
     ```

   - **Using Python 3**:
     ```bash
     python -m http.server 8000
     ```

3. Open your browser and navigate to `http://localhost:8000` (or the port provided by your server).

---

## 🛠️ Technology Stack

- **Markup**: Semantic HTML5 with accessible ARIA attributes and SEO meta tags.
- **Styling**: Vanilla CSS3 utilizing CSS Custom Properties (CSS variables), Flexbox, and CSS Grid.
- **Scripting**: Modern Vanilla JavaScript (ES6+ Modules, LocalStorage API, DOM Manipulation).

### Razorpay setup

Online checkout uses a Node.js/Express backend to create Razorpay Orders and
verify `razorpay_signature` before the browser shows an order confirmation. The
Razorpay Key Secret is only read by the server and must never be added to
frontend code or committed.

1. Copy `.env.example` to `.env`.
2. Add the Razorpay **Key ID** and **Key Secret** from the Razorpay dashboard.
   Test credentials use the `rzp_test_` prefix.
3. Start the site with:

   ```bash
   npm start
   ```

The server serves the static site and exposes `/api/razorpay/orders` and
`/api/razorpay/verify`. The order endpoint calculates the amount from the
server-side product prices instead of trusting the browser.

### Supabase Cloud Database setup

Pet Society uses Supabase (PostgreSQL) for persistent cloud storage of orders and grooming bookings.

1. Create a free project at [supabase.com](https://supabase.com/).
2. Open the **SQL Editor** in Supabase and run the provided script:
   [`supabase-schema.sql`](supabase-schema.sql)
3. Go to **Project Settings > API** in your Supabase dashboard and copy:
   - **Project URL**
   - **anon / public key**
4. Add them to your `.env` (and in your **Vercel Project Settings > Environment Variables**):
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. All completed orders and grooming spa appointments will now automatically sync to your Supabase tables in real-time!

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Varun Kshatriya**  
- GitHub: [@varunkshatriya](https://github.com/varunkshatriya)
