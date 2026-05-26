const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discountedPrice: { type: Number },
  discountPercent: { type: Number, default: 0 },
  unit: { type: String, default: 'piece' },
  weight: { type: String },
  stock: { type: Number, default: 100 },
  images: [{ type: String }],
  thumbnail: { type: String },
  tags: [String],
  brand: { type: String },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isOnSale: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  soldCount: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.pre('save', function (next) {
  if (this.discountPercent > 0) {
    this.discountedPrice = Math.round(this.price * (1 - this.discountPercent / 100));
    this.isOnSale = true;
  } else {
    this.discountedPrice = this.price;
    this.isOnSale = false;
  }
  next();
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
