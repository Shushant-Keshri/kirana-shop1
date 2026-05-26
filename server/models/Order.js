const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  thumbnail: String,
  price: Number,
  quantity: Number,
  total: Number
});

const statusTimelineSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now },
  note: String
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  deliveryAddress: {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number
  },
  deliverySlot: {
    date: String,
    time: String
  },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'Card', 'NetBanking'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
  status: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  statusTimeline: [statusTimelineSchema],
  subtotal: Number,
  tax: Number,
  deliveryFee: Number,
  discount: Number,
  couponCode: String,
  total: Number,
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  cancelReason: String
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.orderId) {
    this.orderId = 'KS' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
  }
  if (this.isNew) {
    this.statusTimeline = [{ status: 'Placed', note: 'Order placed successfully' }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
