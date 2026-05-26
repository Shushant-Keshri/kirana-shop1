require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const Coupon = require('./models/Coupon');

const categories = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', icon: '🥦', sortOrder: 1 },
  { name: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', sortOrder: 2 },
  { name: 'Grains & Pulses', slug: 'grains-pulses', icon: '🌾', sortOrder: 3 },
  { name: 'Snacks & Beverages', slug: 'snacks-beverages', icon: '🍿', sortOrder: 4 },
  { name: 'Spices & Masala', slug: 'spices-masala', icon: '🌶️', sortOrder: 5 },
  { name: 'Oils & Ghee', slug: 'oils-ghee', icon: '🫙', sortOrder: 6 },
  { name: 'Personal Care', slug: 'personal-care', icon: '🧴', sortOrder: 7 },
  { name: 'Household', slug: 'household', icon: '🧹', sortOrder: 8 },
  { name: 'Bakery', slug: 'bakery', icon: '🍞', sortOrder: 9 },
  { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊', sortOrder: 10 }
];

const getProducts = (cats) => {
  const c = {};
  cats.forEach(cat => c[cat.slug] = cat._id);

  return [
    // Fruits & Vegetables
    { name: 'Fresh Tomatoes', slug: 'fresh-tomatoes', category: c['fruits-vegetables'], price: 40, discountPercent: 10, weight: '500g', unit: 'pack', tags: ['fresh', 'vegetables', 'tomato'], isFeatured: true, stock: 200, thumbnail: 'https://images.unsplash.com/photo-1546470427-e5b8ce5b2f0c?w=300', images: ['https://images.unsplash.com/photo-1546470427-e5b8ce5b2f0c?w=600'], rating: 4.5, reviewCount: 120 },
    { name: 'Onions', slug: 'onions', category: c['fruits-vegetables'], price: 35, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['vegetables', 'onion'], stock: 300, thumbnail: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300', images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600'], rating: 4.3, reviewCount: 89 },
    { name: 'Potatoes', slug: 'potatoes', category: c['fruits-vegetables'], price: 30, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['vegetables', 'potato'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=300', images: ['https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=600'], rating: 4.2, reviewCount: 76 },
    { name: 'Fresh Spinach', slug: 'fresh-spinach', category: c['fruits-vegetables'], price: 25, discountPercent: 0, weight: '250g', unit: 'bunch', tags: ['vegetables', 'leafy', 'spinach'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300', images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600'], rating: 4.4, reviewCount: 54 },
    { name: 'Bananas', slug: 'bananas', category: c['fruits-vegetables'], price: 50, discountPercent: 5, weight: '12 pieces', unit: 'dozen', tags: ['fruits', 'banana'], isFeatured: true, stock: 200, thumbnail: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300', images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600'], rating: 4.6, reviewCount: 200 },
    { name: 'Apples (Shimla)', slug: 'apples-shimla', category: c['fruits-vegetables'], price: 180, discountPercent: 15, weight: '1kg', unit: 'kg', tags: ['fruits', 'apple'], isFeatured: true, stock: 100, thumbnail: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300', images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600'], rating: 4.7, reviewCount: 160 },
    { name: 'Carrots', slug: 'carrots', category: c['fruits-vegetables'], price: 45, discountPercent: 0, weight: '500g', unit: 'pack', tags: ['vegetables', 'carrot'], stock: 180, thumbnail: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300', images: ['https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600'], rating: 4.3, reviewCount: 67 },

    // Dairy & Eggs
    { name: 'Full Cream Milk', slug: 'full-cream-milk', category: c['dairy-eggs'], price: 65, discountPercent: 0, weight: '1L', unit: 'litre', tags: ['dairy', 'milk'], isFeatured: true, stock: 500, thumbnail: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300', images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600'], rating: 4.5, reviewCount: 300 },
    { name: 'Paneer (Fresh)', slug: 'paneer-fresh', category: c['dairy-eggs'], price: 120, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['dairy', 'paneer', 'cheese'], isFeatured: true, stock: 100, thumbnail: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600'], rating: 4.6, reviewCount: 180 },
    { name: 'Farm Eggs (30 pcs)', slug: 'farm-eggs-30', category: c['dairy-eggs'], price: 200, discountPercent: 10, weight: '30 pcs', unit: 'tray', tags: ['eggs', 'protein'], stock: 80, thumbnail: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300', images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600'], rating: 4.4, reviewCount: 220 },
    { name: 'Curd (Dahi)', slug: 'curd-dahi', category: c['dairy-eggs'], price: 55, discountPercent: 0, weight: '400g', unit: 'pack', tags: ['dairy', 'curd', 'yogurt'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300', images: ['https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=600'], rating: 4.3, reviewCount: 145 },
    { name: 'Butter (Salted)', slug: 'butter-salted', category: c['dairy-eggs'], price: 95, discountPercent: 5, weight: '100g', unit: 'pack', tags: ['dairy', 'butter'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300', images: ['https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600'], rating: 4.5, reviewCount: 98 },

    // Grains & Pulses
    { name: 'Basmati Rice (Premium)', slug: 'basmati-rice-premium', category: c['grains-pulses'], price: 280, discountPercent: 8, weight: '5kg', unit: 'bag', tags: ['rice', 'basmati', 'grains'], isFeatured: true, stock: 200, thumbnail: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300', images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'], rating: 4.7, reviewCount: 420 },
    { name: 'Toor Dal', slug: 'toor-dal', category: c['grains-pulses'], price: 160, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['pulses', 'dal', 'protein'], stock: 300, thumbnail: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=300', images: ['https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600'], rating: 4.4, reviewCount: 180 },
    { name: 'Moong Dal', slug: 'moong-dal', category: c['grains-pulses'], price: 140, discountPercent: 5, weight: '1kg', unit: 'kg', tags: ['pulses', 'dal', 'green moong'], stock: 250, thumbnail: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=300', images: ['https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600'], rating: 4.3, reviewCount: 130 },
    { name: 'Wheat Flour (Atta)', slug: 'wheat-flour-atta', category: c['grains-pulses'], price: 220, discountPercent: 10, weight: '5kg', unit: 'bag', tags: ['flour', 'atta', 'wheat'], isFeatured: true, stock: 400, thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'], rating: 4.6, reviewCount: 320 },
    { name: 'Chana Dal', slug: 'chana-dal', category: c['grains-pulses'], price: 120, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['pulses', 'chana', 'dal'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=300', images: ['https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600'], rating: 4.2, reviewCount: 90 },
    { name: 'Rajma (Red Kidney Beans)', slug: 'rajma-red-kidney', category: c['grains-pulses'], price: 180, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['pulses', 'rajma', 'beans'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=300', images: ['https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=600'], rating: 4.5, reviewCount: 110 },

    // Snacks & Beverages
    { name: 'Lay\'s Classic Salted Chips', slug: 'lays-classic-salted', category: c['snacks-beverages'], price: 30, discountPercent: 0, weight: '55g', unit: 'pack', tags: ['snacks', 'chips', 'lays'], stock: 500, thumbnail: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300', images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600'], rating: 4.4, reviewCount: 560 },
    { name: 'Biscuits (Marie Gold)', slug: 'biscuits-marie-gold', category: c['snacks-beverages'], price: 45, discountPercent: 0, weight: '250g', unit: 'pack', tags: ['biscuits', 'snacks', 'marie'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300', images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600'], rating: 4.3, reviewCount: 280 },
    { name: 'Coca Cola (2L)', slug: 'coca-cola-2l', category: c['snacks-beverages'], price: 95, discountPercent: 5, weight: '2L', unit: 'bottle', tags: ['beverages', 'cold drink', 'cola'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300', images: ['https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600'], rating: 4.5, reviewCount: 400 },
    { name: 'Tata Tea Gold', slug: 'tata-tea-gold', category: c['snacks-beverages'], price: 225, discountPercent: 10, weight: '500g', unit: 'pack', tags: ['tea', 'beverages', 'tata'], isFeatured: true, stock: 300, thumbnail: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=300', images: ['https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600'], rating: 4.6, reviewCount: 340 },
    { name: 'Haldirams Bhujia', slug: 'haldirams-bhujia', category: c['snacks-beverages'], price: 80, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['namkeen', 'bhujia', 'snacks', 'haldirams'], stock: 250, thumbnail: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=300', images: ['https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=600'], rating: 4.7, reviewCount: 500 },
    { name: 'Minute Maid Juice (1L)', slug: 'minute-maid-juice', category: c['snacks-beverages'], price: 110, discountPercent: 8, weight: '1L', unit: 'carton', tags: ['juice', 'beverages', 'fruit'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=300', images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600'], rating: 4.3, reviewCount: 170 },

    // Spices & Masala
    { name: 'Turmeric Powder (Haldi)', slug: 'turmeric-powder-haldi', category: c['spices-masala'], price: 75, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['spices', 'turmeric', 'haldi'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300', images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'], rating: 4.5, reviewCount: 230 },
    { name: 'Red Chilli Powder', slug: 'red-chilli-powder', category: c['spices-masala'], price: 85, discountPercent: 5, weight: '200g', unit: 'pack', tags: ['spices', 'chilli', 'red chilli'], stock: 350, thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'], rating: 4.4, reviewCount: 190 },
    { name: 'Garam Masala', slug: 'garam-masala', category: c['spices-masala'], price: 95, discountPercent: 0, weight: '100g', unit: 'pack', tags: ['spices', 'masala', 'garam masala'], isFeatured: true, stock: 300, thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'], rating: 4.6, reviewCount: 260 },
    { name: 'Coriander Powder', slug: 'coriander-powder', category: c['spices-masala'], price: 65, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['spices', 'coriander', 'dhania'], stock: 280, thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'], rating: 4.3, reviewCount: 140 },
    { name: 'Cumin Seeds (Jeera)', slug: 'cumin-seeds-jeera', category: c['spices-masala'], price: 110, discountPercent: 10, weight: '200g', unit: 'pack', tags: ['spices', 'cumin', 'jeera'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'], rating: 4.5, reviewCount: 180 },

    // Oils & Ghee
    { name: 'Fortune Sunflower Oil', slug: 'fortune-sunflower-oil', category: c['oils-ghee'], price: 190, discountPercent: 5, weight: '1L', unit: 'bottle', tags: ['oil', 'sunflower', 'fortune'], isFeatured: true, stock: 300, thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'], rating: 4.5, reviewCount: 320 },
    { name: 'Amul Pure Ghee', slug: 'amul-pure-ghee', category: c['oils-ghee'], price: 650, discountPercent: 8, weight: '1kg', unit: 'tin', tags: ['ghee', 'amul', 'desi ghee'], isFeatured: true, stock: 150, thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'], rating: 4.8, reviewCount: 450 },
    { name: 'Mustard Oil', slug: 'mustard-oil', category: c['oils-ghee'], price: 175, discountPercent: 0, weight: '1L', unit: 'bottle', tags: ['oil', 'mustard', 'sarson'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'], rating: 4.4, reviewCount: 210 },
    { name: 'Coconut Oil (Cold Pressed)', slug: 'coconut-oil-cold-pressed', category: c['oils-ghee'], price: 280, discountPercent: 10, weight: '500ml', unit: 'bottle', tags: ['oil', 'coconut', 'cold pressed'], stock: 100, thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'], rating: 4.6, reviewCount: 165 },

    // Personal Care
    { name: 'Dove Soap (3pc)', slug: 'dove-soap-3pc', category: c['personal-care'], price: 145, discountPercent: 5, weight: '3x75g', unit: 'pack', tags: ['soap', 'dove', 'personal care', 'bathing'], stock: 300, thumbnail: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'], rating: 4.6, reviewCount: 380 },
    { name: 'Colgate Strong Teeth Toothpaste', slug: 'colgate-strong-teeth', category: c['personal-care'], price: 125, discountPercent: 0, weight: '300g', unit: 'tube', tags: ['toothpaste', 'colgate', 'oral care'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'], rating: 4.5, reviewCount: 290 },
    { name: 'Head & Shoulders Shampoo', slug: 'head-shoulders-shampoo', category: c['personal-care'], price: 380, discountPercent: 12, weight: '340ml', unit: 'bottle', tags: ['shampoo', 'hair care', 'dandruff'], isFeatured: true, stock: 200, thumbnail: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'], rating: 4.4, reviewCount: 260 },
    { name: 'Dettol Hand Sanitizer', slug: 'dettol-hand-sanitizer', category: c['personal-care'], price: 99, discountPercent: 0, weight: '200ml', unit: 'bottle', tags: ['sanitizer', 'dettol', 'hygiene'], stock: 500, thumbnail: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'], rating: 4.3, reviewCount: 340 },

    // Household
    { name: 'Ariel Matic Detergent', slug: 'ariel-matic-detergent', category: c['household'], price: 480, discountPercent: 10, weight: '3kg', unit: 'box', tags: ['detergent', 'ariel', 'laundry'], isFeatured: true, stock: 200, thumbnail: 'https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=300', images: ['https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=600'], rating: 4.6, reviewCount: 310 },
    { name: 'Vim Dishwash Liquid', slug: 'vim-dishwash-liquid', category: c['household'], price: 140, discountPercent: 5, weight: '750ml', unit: 'bottle', tags: ['dishwash', 'vim', 'kitchen'], stock: 300, thumbnail: 'https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=300', images: ['https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=600'], rating: 4.4, reviewCount: 195 },
    { name: 'Harpic Toilet Cleaner', slug: 'harpic-toilet-cleaner', category: c['household'], price: 130, discountPercent: 0, weight: '1L', unit: 'bottle', tags: ['cleaner', 'harpic', 'toilet', 'bathroom'], stock: 250, thumbnail: 'https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=300', images: ['https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=600'], rating: 4.5, reviewCount: 220 },
    { name: 'Good Knight Mosquito Coil', slug: 'good-knight-mosquito-coil', category: c['household'], price: 75, discountPercent: 0, weight: '10 coils', unit: 'pack', tags: ['mosquito', 'good knight', 'household'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=300', images: ['https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=600'], rating: 4.2, reviewCount: 150 },

    // Bakery
    { name: 'Britannia Bread (White)', slug: 'britannia-bread-white', category: c['bakery'], price: 55, discountPercent: 0, weight: '400g', unit: 'loaf', tags: ['bread', 'britannia', 'bakery'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'], rating: 4.4, reviewCount: 280 },
    { name: 'Pav Bun (6 pcs)', slug: 'pav-bun-6pcs', category: c['bakery'], price: 40, discountPercent: 0, weight: '6 pieces', unit: 'pack', tags: ['pav', 'bread', 'bakery'], stock: 100, thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'], rating: 4.3, reviewCount: 190 },
    { name: 'Whole Wheat Bread', slug: 'whole-wheat-bread', category: c['bakery'], price: 65, discountPercent: 5, weight: '400g', unit: 'loaf', tags: ['bread', 'wheat', 'bakery', 'healthy'], stock: 120, thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600'], rating: 4.5, reviewCount: 160 },
    { name: 'Cream Biscuits (Oreo)', slug: 'oreo-cream-biscuits', category: c['bakery'], price: 30, discountPercent: 0, weight: '120g', unit: 'pack', tags: ['biscuits', 'oreo', 'cream', 'snacks'], stock: 600, thumbnail: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300', images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600'], rating: 4.7, reviewCount: 820 },

    // Frozen Foods
    { name: 'McCain French Fries', slug: 'mccain-french-fries', category: c['frozen-foods'], price: 160, discountPercent: 10, weight: '420g', unit: 'pack', tags: ['frozen', 'fries', 'mccain'], isFeatured: true, stock: 100, thumbnail: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300', images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600'], rating: 4.5, reviewCount: 340 },
    { name: 'Frozen Peas', slug: 'frozen-peas', category: c['frozen-foods'], price: 70, discountPercent: 0, weight: '500g', unit: 'pack', tags: ['frozen', 'peas', 'vegetables'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1575218823251-f8c60eca6f6e?w=300', images: ['https://images.unsplash.com/photo-1575218823251-f8c60eca6f6e?w=600'], rating: 4.2, reviewCount: 120 },
    { name: 'Kwality Walls Ice Cream', slug: 'kwality-walls-ice-cream', category: c['frozen-foods'], price: 280, discountPercent: 15, weight: '750ml', unit: 'tub', tags: ['ice cream', 'frozen', 'dessert'], stock: 80, thumbnail: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300', images: ['https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600'], rating: 4.6, reviewCount: 290 },
    { name: 'Frozen Corn', slug: 'frozen-corn', category: c['frozen-foods'], price: 65, discountPercent: 0, weight: '500g', unit: 'pack', tags: ['frozen', 'corn', 'vegetables'], stock: 120, thumbnail: 'https://images.unsplash.com/photo-1575218823251-f8c60eca6f6e?w=300', images: ['https://images.unsplash.com/photo-1575218823251-f8c60eca6f6e?w=600'], rating: 4.3, reviewCount: 95 },

    // More products to reach 60+
    { name: 'Sugar (Refined)', slug: 'sugar-refined', category: c['grains-pulses'], price: 55, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['sugar', 'sweetener'], stock: 500, thumbnail: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300', images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'], rating: 4.1, reviewCount: 80 },
    { name: 'Salt (Tata)', slug: 'salt-tata', category: c['spices-masala'], price: 25, discountPercent: 0, weight: '1kg', unit: 'kg', tags: ['salt', 'tata', 'iodized'], stock: 800, thumbnail: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300', images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'], rating: 4.5, reviewCount: 350 },
    { name: 'Green Chillies', slug: 'green-chillies', category: c['fruits-vegetables'], price: 20, discountPercent: 0, weight: '100g', unit: 'pack', tags: ['vegetables', 'chilli', 'green'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1590004987778-bece5c9adab6?w=300', images: ['https://images.unsplash.com/photo-1590004987778-bece5c9adab6?w=600'], rating: 4.2, reviewCount: 60 },
    { name: 'Ginger (Fresh)', slug: 'ginger-fresh', category: c['fruits-vegetables'], price: 30, discountPercent: 0, weight: '100g', unit: 'pack', tags: ['vegetables', 'ginger', 'fresh'], stock: 180, thumbnail: 'https://images.unsplash.com/photo-1603431777007-34f5dc7b4aff?w=300', images: ['https://images.unsplash.com/photo-1603431777007-34f5dc7b4aff?w=600'], rating: 4.4, reviewCount: 75 },
    { name: 'Garlic (Fresh)', slug: 'garlic-fresh', category: c['fruits-vegetables'], price: 60, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['vegetables', 'garlic', 'fresh'], stock: 150, thumbnail: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300', images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600'], rating: 4.3, reviewCount: 92 },
    { name: 'Nescafe Classic Coffee', slug: 'nescafe-classic-coffee', category: c['snacks-beverages'], price: 290, discountPercent: 5, weight: '100g', unit: 'jar', tags: ['coffee', 'nescafe', 'beverages'], stock: 200, thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300', images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'], rating: 4.6, reviewCount: 420 },
    { name: 'Parle-G Biscuits (Pack of 3)', slug: 'parle-g-pack-3', category: c['snacks-beverages'], price: 30, discountPercent: 0, weight: '3x135g', unit: 'pack', tags: ['biscuits', 'parle', 'glucose'], stock: 800, thumbnail: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300', images: ['https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600'], rating: 4.5, reviewCount: 960 },
    { name: 'Maggi Noodles (6 pack)', slug: 'maggi-noodles-6pack', category: c['snacks-beverages'], price: 120, discountPercent: 0, weight: '6x70g', unit: 'pack', tags: ['noodles', 'maggi', 'instant'], isFeatured: true, stock: 600, thumbnail: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=300', images: ['https://images.unsplash.com/photo-1555126634-323283e090fa?w=600'], rating: 4.7, reviewCount: 1200 },
    { name: 'Amul Cheese Slices', slug: 'amul-cheese-slices', category: c['dairy-eggs'], price: 165, discountPercent: 0, weight: '200g', unit: 'pack', tags: ['cheese', 'amul', 'dairy', 'slices'], stock: 120, thumbnail: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300', images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600'], rating: 4.5, reviewCount: 230 },
    { name: 'Watermelon (Whole)', slug: 'watermelon-whole', category: c['fruits-vegetables'], price: 80, discountPercent: 0, weight: '2-3kg', unit: 'piece', tags: ['fruits', 'watermelon', 'summer'], stock: 50, thumbnail: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300', images: ['https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600'], rating: 4.6, reviewCount: 180 },
    { name: 'Mangoes (Alphonso)', slug: 'mangoes-alphonso', category: c['fruits-vegetables'], price: 450, discountPercent: 0, weight: '12 pcs', unit: 'dozen', tags: ['fruits', 'mango', 'alphonso', 'seasonal'], isFeatured: true, stock: 40, thumbnail: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=300', images: ['https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=600'], rating: 4.9, reviewCount: 380 },
    { name: 'Surf Excel Detergent Bar', slug: 'surf-excel-detergent-bar', category: c['household'], price: 55, discountPercent: 0, weight: '200g', unit: 'bar', tags: ['detergent', 'surf excel', 'washing'], stock: 400, thumbnail: 'https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=300', images: ['https://images.unsplash.com/photo-1585441695325-14f7a43d7804?w=600'], rating: 4.4, reviewCount: 220 },
    { name: 'Santoor Soap (3pc)', slug: 'santoor-soap-3pc', category: c['personal-care'], price: 95, discountPercent: 5, weight: '3x100g', unit: 'pack', tags: ['soap', 'santoor', 'sandalwood'], stock: 300, thumbnail: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600'], rating: 4.3, reviewCount: 200 },
    { name: 'Saffola Gold Oil (2L)', slug: 'saffola-gold-oil-2l', category: c['oils-ghee'], price: 390, discountPercent: 8, weight: '2L', unit: 'bottle', tags: ['oil', 'saffola', 'heart care'], stock: 100, thumbnail: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300', images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600'], rating: 4.5, reviewCount: 280 },
  ];
};

const coupons = [
  { code: 'SAVE10', description: '10% off on orders above ₹200', discountType: 'percentage', discountValue: 10, minOrderAmount: 200, maxDiscount: 100, usageLimit: 1000 },
  { code: 'SAVE20', description: '20% off on orders above ₹500', discountType: 'percentage', discountValue: 20, minOrderAmount: 500, maxDiscount: 200, usageLimit: 500 },
  { code: 'WELCOME50', description: '₹50 off on your first order', discountType: 'fixed', discountValue: 50, minOrderAmount: 150, usageLimit: 200 }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@kirana.com',
      password: 'Admin@123',
      phone: '9999999999',
      role: 'admin'
    });
    console.log(`Admin created: ${admin.email}`);

    // Create test user
    await User.create({
      name: 'Test User',
      email: 'user@kirana.com',
      password: 'User@123',
      phone: '8888888888',
      role: 'user'
    });
    console.log('Test user created: user@kirana.com / User@123');

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created`);

    // Create products — compute discountedPrice manually (pre('save') doesn't run on insertMany)
    const productData = getProducts(createdCategories).map(p => ({
      ...p,
      discountedPrice: p.discountPercent > 0
        ? Math.round(p.price * (1 - p.discountPercent / 100))
        : p.price,
      isOnSale: p.discountPercent > 0
    }));
    const createdProducts = await Product.insertMany(productData);
    console.log(`${createdProducts.length} products created`);

    // Create coupons
    await Coupon.insertMany(coupons);
    console.log('Coupons created: SAVE10, SAVE20, WELCOME50');

    console.log('\n✅ Seed completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin Login: admin@kirana.com / Admin@123');
    console.log('User Login:  user@kirana.com / User@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
