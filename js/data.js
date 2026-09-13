// ============================================================
//  PET SOCIETY — DATA STORE
// ============================================================

export const PRODUCTS = [
  {
    id: 'p1',
    name: 'Royal Canin Adult Maxi',
    category: 'dog-food',
    categoryLabel: 'Dog Food',
    weight: '10 kg',
    price: 2499,
    originalPrice: 2999,
    rating: 4.8,
    reviews: 312,
    badge: 'Best Seller',
    badgeType: 'teal',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 0% 50%'
  },
  {
    id: 'p2',
    name: 'Pedigree Puppy Starter',
    category: 'dog-food',
    categoryLabel: 'Dog Food',
    weight: '3 kg',
    price: 649,
    originalPrice: 799,
    rating: 4.6,
    reviews: 198,
    badge: 'New',
    badgeType: 'fuchsia',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 20% 50%'
  },
  {
    id: 'p3',
    name: 'Whiskas Ocean Fish',
    category: 'cat-nutrition',
    categoryLabel: 'Cat Nutrition',
    weight: '3 kg',
    price: 799,
    originalPrice: 999,
    rating: 4.7,
    reviews: 256,
    badge: 'Popular',
    badgeType: 'teal',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 60% 50%'
  },
  {
    id: 'p4',
    name: 'Me-O Persian Cat',
    category: 'cat-nutrition',
    categoryLabel: 'Cat Nutrition',
    weight: '1.5 kg',
    price: 549,
    originalPrice: 699,
    rating: 4.5,
    reviews: 143,
    badge: null,
    badgeType: null,
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 80% 50%'
  },
  {
    id: 'p5',
    name: 'Drools Chicken Treats',
    category: 'treats',
    categoryLabel: 'Treats',
    weight: '500 g',
    price: 349,
    originalPrice: 449,
    rating: 4.9,
    reviews: 421,
    badge: 'Top Rated',
    badgeType: 'gold',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 40% 50%'
  },
  {
    id: 'p6',
    name: 'Himalaya Anti-Tick Shampoo',
    category: 'grooming',
    categoryLabel: 'Grooming',
    weight: '400 ml',
    price: 299,
    originalPrice: 399,
    rating: 4.7,
    reviews: 187,
    badge: 'Natural',
    badgeType: 'teal',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 10% 50%'
  },
  {
    id: 'p7',
    name: 'Purepet Beef Jerky',
    category: 'treats',
    categoryLabel: 'Treats',
    weight: '300 g',
    price: 279,
    originalPrice: 349,
    rating: 4.6,
    reviews: 134,
    badge: null,
    badgeType: null,
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 70% 50%'
  },
  {
    id: 'p8',
    name: 'Dog Cooling Mat & Harness',
    category: 'accessories',
    categoryLabel: 'Accessories',
    weight: 'Size M',
    price: 899,
    originalPrice: 1199,
    rating: 4.4,
    reviews: 89,
    badge: 'Sale',
    badgeType: 'fuchsia',
    image: 'assets/images/products-food.jpg',
    imageStyle: 'object-position: 90% 50%'
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'dog-food', label: '🐕 Dog Food' },
  { id: 'cat-nutrition', label: '🐱 Cat Nutrition' },
  { id: 'treats', label: '🦴 Treats' },
  { id: 'grooming', label: '✂️ Grooming' },
  { id: 'accessories', label: '🎾 Accessories' }
];

export const SPA_SERVICES = [
  { id: 'bath', icon: '🛁', name: 'Hydrobath & Dry', price: '₹799+' },
  { id: 'groom', icon: '✂️', name: 'Full Groom & Style', price: '₹1299+' },
  { id: 'spa', icon: '💆', name: 'Luxury Spa Package', price: '₹1999+' },
  { id: 'dental', icon: '🦷', name: 'Dental & Nail Care', price: '₹499+' }
];

export const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Priya Sharma',
    pet: 'Owner of Bruno (Golden Retriever)',
    quote: 'Pet Society has been a game-changer for Bruno! He used to hate bath time, but now he gets so excited when we pull up to the salon. The team genuinely loves every pet they work with.',
    stars: 5,
    avatar: '🐕'
  },
  {
    id: 't2',
    name: 'Rahul & Meena Kapoor',
    pet: 'Parents of Coco (Poodle)',
    quote: 'We were nervous about Coco\'s first professional groom, but the team made her feel so safe and comfortable. She came back looking absolutely stunning! The before-and-after was incredible.',
    stars: 5,
    avatar: '🐩'
  },
  {
    id: 't3',
    name: 'Ananya Desai',
    pet: 'Owner of Whiskey (Persian Cat)',
    quote: 'Finding a groomer who is experienced with cats and understands their stress triggers was so difficult — until Pet Society. Whiskey was calm and peaceful through the whole experience!',
    stars: 5,
    avatar: '🐱'
  },
  {
    id: 't4',
    name: 'Vikram Nair',
    pet: 'Owner of Max (German Shepherd)',
    quote: 'The store\'s nutrition guidance was exceptional. They helped me switch Max to a diet that has visibly improved his coat shine and energy levels. These folks know their stuff!',
    stars: 5,
    avatar: '🐺'
  },
  {
    id: 't5',
    name: 'Sunita & Arjun Mehta',
    pet: 'Parents of Luna (Husky)',
    quote: 'Live updates during grooming gave us such peace of mind. Luna came back with the most beautiful layered cut and smelling divine. Their organic shampoos are clearly superior — zero irritation.',
    stars: 5,
    avatar: '🐺'
  }
];

export const TEAM = [
  {
    id: 'seema',
    name: 'Seema Pillai',
    role: 'Head Groomer & Co-Founder',
    bio: 'With over 12 years of hands-on experience across breeds of all sizes, Seema\'s gentle technique and deep empathy for animals is the heart of Pet Society\'s philosophy. Certified by the National Dog Groomers Association.',
    chips: ['12+ Years Exp.', 'NDGA Certified', 'Breed Specialist', 'Fear-Free Expert'],
    portraitSide: 'left'
  },
  {
    id: 'raj',
    name: 'Raj Menon',
    role: 'Master Groomer & Co-Founder',
    bio: 'Raj brings a meticulous eye for breed-specific styling and an unmatched passion for pet wellness nutrition. His expertise in dermatological pet care ensures every animal leaves healthier than they arrived.',
    chips: ['Nutrition Expert', 'Derm Specialist', '10+ Years Exp.', 'Anxiety-Free Care'],
    portraitSide: 'right'
  }
];
