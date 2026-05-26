const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const totalQty = (cart) => cart.items.reduce((s, i) => s + i.quantity, 0);

exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) return res.json({ success: true, items: [] });

    const items = cart.items
      .filter(i => i.product && i.product.isActive)
      .map(i => {
        const price = i.product.discountedPrice || i.product.price;
        return {
          productId: i.product._id,
          name: i.product.name,
          thumbnail: i.product.thumbnail,
          price,
          originalPrice: i.product.price,
          weight: i.product.weight,
          stock: i.product.stock,
          quantity: i.quantity,
          total: price * i.quantity
        };
      });

    res.json({ success: true, items });
  } catch (err) { next(err); }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.stock < 1) return res.status(400).json({ success: false, message: 'Out of stock' });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const idx = cart.items.findIndex(i => i.product.toString() === productId);
    if (idx > -1) {
      cart.items[idx].quantity = Math.min(cart.items[idx].quantity + Number(quantity), product.stock, 10);
    } else {
      cart.items.push({ product: productId, quantity: Math.min(Number(quantity), product.stock, 10) });
    }
    await cart.save();

    res.json({ success: true, message: 'Added to cart', cartCount: totalQty(cart) });
  } catch (err) { next(err); }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const idx = cart.items.findIndex(i => i.product.toString() === productId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not in cart' });

    if (Number(quantity) <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = Math.min(Number(quantity), 10);
    }
    await cart.save();
    res.json({ success: true, message: 'Cart updated', cartCount: totalQty(cart) });
  } catch (err) { next(err); }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== productId);
    await cart.save();
    res.json({ success: true, message: 'Item removed', cartCount: totalQty(cart) });
  } catch (err) { next(err); }
};

exports.clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { upsert: true });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) { next(err); }
};

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return res.status(400).json({ success: false, message: 'Coupon expired' });
    if (coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    if (Number(subtotal) < coupon.minOrderAmount)
      return res.status(400).json({ success: false, message: `Minimum order ₹${coupon.minOrderAmount} required` });

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round(Number(subtotal) * coupon.discountValue / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.discountValue;
    }

    res.json({
      success: true, discount,
      coupon: { code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue }
    });
  } catch (err) { next(err); }
};
