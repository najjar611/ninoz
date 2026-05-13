// ════════════════════════════════════════════════════════════
// NINOZ — ALL CONTENT DATA FILE
// Edit everything from here: plans, meals, weekly schedules,
// slideshow images, blog posts, FAQ questions
// ════════════════════════════════════════════════════════════

// ── SLIDESHOW IMAGES ──
// These appear in the hero section rotating slideshow
// To add an image:
//   1. Put your photo in /public/slideshow/ folder
//   2. Add an entry below with the path and alt text
// To remove: delete the entry
// To reorder: move entries up or down
export const slideshowImages = [
  { src: '/slideshow/slide-1.jpg', alt: 'Fresh baby meals' },
  { src: '/slideshow/slide-2.jpg', alt: 'Organic ingredients' },
  { src: '/slideshow/slide-3.jpg', alt: 'Our kitchen' },
  { src: '/slideshow/slide-4.jpg', alt: 'Happy baby' },
]

// ── PLAN TYPES ──
// Each stage has multiple plans (Plan 1, Plan 2, etc.)
// Each plan has a weekly schedule (7 days × meals per day)
export type DayMeals = {
  day: string       // e.g. "Monday"
  breakfast: string // Meal name — change here
  lunch: string
  dinner: string
}

export type Plan = {
  id: string
  name: string          // e.g. "Plan 1" — change here
  description: string   // Short description
  price: string         // e.g. "299 SAR/week" — change here
  tag?: string          // e.g. "Most Popular"
  image: string         // Path in /public/plans/ — change here
  weeklySchedule: DayMeals[]
}

// ── STAGE 1 PLANS (3–6 months) ──
// To add a plan: copy one object and paste below
// To edit: change any field directly
export const stage1Plans: Plan[] = [
  {
    id: 's1-p1',
    name: 'Plan 1',
    description: 'A gentle introduction to solids with smooth organic purées.',
    price: '299 SAR / week',
    tag: 'Most Popular',
    image: '/plans/stage1-plan1.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's1-p2',
    name: 'Plan 2',
    description: 'More variety with different vegetable and fruit combinations.',
    price: '299 SAR / week',
    image: '/plans/stage1-plan2.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's1-p3',
    name: 'Plan 3',
    description: 'Iron-rich and protein-packed meals for growing babies.',
    price: '299 SAR / week',
    tag: 'New',
    image: '/plans/stage1-plan3.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
]

// ── STAGE 2 PLANS (6–12 months) ──
export const stage2Plans: Plan[] = [
  {
    id: 's2-p1',
    name: 'Plan 1',
    description: 'Textured meals introducing your baby to real food experiences.',
    price: '349 SAR / week',
    tag: 'Most Popular',
    image: '/plans/stage2-plan1.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's2-p2',
    name: 'Plan 2',
    description: 'Bold flavors and more complex textures for adventurous babies.',
    price: '349 SAR / week',
    image: '/plans/stage2-plan2.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's2-p3',
    name: 'Plan 3',
    description: 'Omega-3 rich meals to support brain and eye development.',
    price: '349 SAR / week',
    tag: 'New',
    image: '/plans/stage2-plan3.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
]

// ── STAGE 3 PLANS (1–3 years) ──
export const stage3Plans: Plan[] = [
  {
    id: 's3-p1',
    name: 'Plan 1',
    description: 'Hearty toddler meals with real chunks and exciting flavors.',
    price: '399 SAR / week',
    tag: 'Most Popular',
    image: '/plans/stage3-plan1.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's3-p2',
    name: 'Plan 2',
    description: 'Balanced nutrition packed with calcium and vitamins for toddlers.',
    price: '399 SAR / week',
    image: '/plans/stage3-plan2.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
  {
    id: 's3-p3',
    name: 'Plan 3',
    description: 'Fun and colorful meals that make mealtimes exciting.',
    price: '399 SAR / week',
    tag: 'New',
    image: '/plans/stage3-plan3.jpg', // ← Add photo here
    weeklySchedule: [
      { day: 'Sunday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Monday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Tuesday',   breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Wednesday', breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Thursday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Friday',    breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
      { day: 'Saturday',  breakfast: 'Meal Name', lunch: 'Meal Name', dinner: 'Meal Name' },
    ],
  },
]

// ── BLOG POSTS ──
// To add a post: copy one object and paste below
// To edit: change title, excerpt, tag, image
// image: add photo to /public/blog/ folder
export const blogPosts = [
  {
    id: 'b1',
    tag: 'Nutrition',
    title: 'When to Start Solid Food for Your Baby?',
    excerpt: 'Signs of readiness, what to introduce first, and what to avoid during the 3–6 month transition.',
    image: '/blog/blog-1.jpg', // ← Add photo here
    emoji: '🥕',
  },
  {
    id: 'b2',
    tag: 'Health',
    title: 'Iron-Rich Foods for Babies Under 12 Months',
    excerpt: 'Iron deficiency is common after 6 months. Here\'s how to make sure your little one gets enough.',
    image: '/blog/blog-2.jpg', // ← Add photo here
    emoji: '🥦',
  },
  {
    id: 'b3',
    tag: 'Parenting',
    title: 'How to Balance Work & Baby Nutrition',
    excerpt: 'A practical guide for working mums in Saudi Arabia on building a healthy feeding routine.',
    image: '/blog/blog-3.jpg', // ← Add photo here
    emoji: '👶',
  },
]

// ── FAQ QUESTIONS ──
// To edit: change question and answer text directly
// To add: copy one object and paste below
// To remove: delete the object
export const faqItems = [
  {
    id: 'f1',
    question: 'How fresh are the meals?',
    answer: 'Every meal is prepared fresh on the same morning it is delivered. We never use frozen or pre-made food. Your baby gets the freshest possible meal every single day.',
  },
  {
    id: 'f2',
    question: 'Can I pause or cancel my subscription?',
    answer: 'Yes, absolutely. You can pause, skip a day, or cancel your subscription at any time with no penalties. Just let us know before 10pm the night before and we\'ll adjust your order.',
  },
  {
    id: 'f3',
    question: 'What if my baby has allergies?',
    answer: 'We take allergies very seriously. During signup you will tell us about any allergies or dietary restrictions. Our nutritionist will build a plan that completely avoids those ingredients.',
  },
  {
    id: 'f4',
    question: 'What areas in Riyadh do you deliver to?',
    answer: 'We currently deliver across all major districts in Riyadh. During signup, enter your address and we will confirm delivery is available in your area. We are expanding coverage regularly.',
  },
  {
    id: 'f5',
    question: 'Are your ingredients certified organic?',
    answer: 'Yes. We use 100% certified organic produce with no preservatives, no artificial colors, and no added sugar. Every ingredient is sourced fresh daily from certified suppliers.',
  },
]
