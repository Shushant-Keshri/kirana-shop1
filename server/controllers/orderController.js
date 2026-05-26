const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

exports.placeOrder = async (req, res, next) => {
  try {
    const { deliveryAddress, deliverySlot, paymentMethod, couponCode } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items.length)
      return res.status(400).json({ success: false, message: 'Cart is empty' });

    let subtotal = 0;
    const items = cart.items.map(i => {
      const p = i.product;
      if (!p) return null;
      const total = p.discountedPrice * i.quantity;
      subtotal += total;
      return { product: p._id, name: p.name, thumbnail: p.thumbnail, price: p.discountedPrice, quantity: i.quantity, total };
    }).filter(Boolean);

    let discount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          discount = Math.round(subtotal * coupon.discountValue / 100);
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.discountValue;
        }
        await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
      }
    }

    const tax = Math.round((subtotal - discount) * 0.05);
    const deliveryFee = (subtotal - discount) >= 100 ? 0 : 40;
    const total = subtotal - discount + tax + deliveryFee;

    const order = await Order.create({
      user: req.user._id, items, deliveryAddress, deliverySlot, paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Paid',
      subtotal, tax, deliveryFee, discount, couponCode, total
    });

    // Reduce stock
    for (const i of cart.items) {
      await Product.findByIdAndUpdate(i.product._id, { $inc: { soldCount: i.quantity, stock: -i.quantity } });
    }

    // Clear cart in MongoDB
    cart.items = [];
    await cart.save();

    console.log(`[Order] ${order.orderId} placed by ${req.user.email} — ₹${total}`);
    res.status(201).json({ success: true, order });
  } catch (err) { next(err); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name thumbnail');
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};

exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name thumbnail slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['Placed', 'Confirmed'].includes(order.status))
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });

    order.status = 'Cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    order.statusTimeline.push({ status: 'Cancelled', note: order.cancelReason });
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    console.log(`[Order] ${order.orderId} cancelled — stock restored`);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.rateOrder = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Delivered')
      return res.status(400).json({ success: false, message: 'Can only rate delivered orders' });
    order.rating = rating;
    order.review = review;
    await order.save();
    res.json({ success: true, message: 'Rating submitted' });
  } catch (err) { next(err); }
};
