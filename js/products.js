/* Catalogue — add products and colourways here. Each variant is one card in the shop. */
window.TSH_PRODUCTS = [
  {
    id: 'tee', short: 'Certified Tee', cat: 'Tees', price: 450,
    line: 'Unisex · Cotton jersey', sizes: ['S', 'M', 'L', 'XL'],
    details: '100% combed cotton, heavyweight jersey. Tonal gold CERTIFIED embroidery on the chest. Ribbed crew neck.',
    fit: 'Relaxed fit, true to size. Size up for an oversized look.',
    variants: [
      { vid: 'tee-choc', color: 'Chocolate', img: 'img/p1.jpeg', bg: '#cfcfce' },
      { vid: 'tee-forest', color: 'Forest', img: 'img/p3.jpeg', bg: '#d1d2d1' },
    ],
  },
  {
    id: 'hat', short: 'Kasi Vibe Bucket Hat', cat: 'Hats', price: 350,
    line: 'Unisex · Embroidered twill', sizes: ['S/M', 'L/XL'],
    details: 'Cotton twill with a stitched brim. Raised KASI embroidery with gold Vibe script.',
    fit: 'S/M fits 56–57 cm. L/XL fits 58–60 cm.',
    variants: [
      { vid: 'hat-washed', color: 'Washed Black', img: 'img/p2.jpeg', bg: '#fefeff' },
      { vid: 'hat-forest', color: 'Forest', img: 'img/p4.jpeg', bg: '#fefeff' },
      { vid: 'hat-black', color: 'Black', img: 'img/p5.jpeg', bg: '#e7e7e6' },
      { vid: 'hat-white', color: 'White', img: 'img/p6.jpeg', bg: '#fefeff' },
    ],
  },
];

window.TSH_CATS = [
  { key: 'all', label: 'All' },
  { key: 'Tees', label: 'Tees' },
  { key: 'Hats', label: 'Bucket Hats' },
];

window.TSH_COLORS = [
  ['Chocolate', '#3b2a20'], ['Forest', '#1f4a33'], ['Washed Black', '#3a3a3a'], ['Black', '#141414'], ['White', '#f7f7f5'],
];

window.TSH_DELIVERY = [
  { key: 'courier', label: 'Courier', sub: 'Door to door · 2–4 working days', price: 99 },
  { key: 'paxi', label: 'PAXI', sub: 'Collect at a PEP store · 7–9 days', price: 59 },
  { key: 'collect', label: 'Studio collection', sub: 'By appointment', price: 0 },
];

window.TSH_PAYMENT = [
  { key: 'card', label: 'Card', sub: 'Visa · Mastercard · secured by Yoco' },
  { key: 'eft', label: 'Instant EFT', sub: 'Via your bank · secured by PayFast' },
  { key: 'snap', label: 'SnapScan', sub: 'Scan to pay' },
];
