const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Category = require('../models/Category');
const Cart = require('../models/Cart');

exports.getDashboard = async (req, res, next) => {
  try {
    const [totalOrders, totalProducts, totalUsers, revenue] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ])
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name');

    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const salesByDay = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, sales: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const lowStockProducts = await Product.find({ isActive: true, stock: { $lt: 10 } })
      .select('name stock thumbnail').limit(10);

    res.json({
      success: true,
      stats: { totalOrders, totalProducts, totalUsers, totalRevenue: revenue[0]?.total || 0 },
      recentOrders, ordersByStatus, salesByDay, lowStockProducts
    });
  } catch (err) { next(err); }
};

exports.getDbStats = async (req, res, next) => {
  try {
    const [users, orders, products, categories, activeProducts, cancelledOrders, deliveredOrders] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'Cancelled' }),
      Order.countDocuments({ status: 'Delivered' })
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    res.json({
      success: true,
      stats: {
        users, orders, products, categories,
        activeProducts, inactiveProducts: products - activeProducts,
        cancelledOrders, deliveredOrders, pendingOrders: orders - cancelledOrders - deliveredOrders,
        totalRevenue: revenueAgg[0]?.total || 0
      }
    });
  } catch (err) { next(err); }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.orderId = { $regex: search, $options: 'i' };

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name email phone')
      .populate('items.product', 'name thumbnail');

    res.json({ success: true, orders, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.statusTimeline.push({ status, note: note || `Status updated to ${status}` });
    if (status === 'Delivered') order.paymentStatus = 'Paid';

    // Restore stock if admin cancels
    if (status === 'Cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    await order.save();
    console.log(`[Admin] Order ${order.orderId} → ${status}`);
    res.json({ success: true, order });
  } catch (err) { next(err); }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'user' };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-password -refreshToken');

    // Attach order count per user
    const userIds = users.map(u => u._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 }, spent: { $sum: '$total' } } }
    ]);
    const countMap = {};
    orderCounts.forEach(o => { countMap[o._id.toString()] = { count: o.count, spent: o.spent }; });

    const enriched = users.map(u => ({
      ...u.toJSON(),
      orderCount: countMap[u._id.toString()]?.count || 0,
      totalSpent: countMap[u._id.toString()]?.spent || 0
    }));

    res.json({ success: true, users: enriched, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, lowStock } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    if (lowStock === 'true') query.stock = { $lt: 10 };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('category', 'name');

    res.json({ success: true, products, pagination: { total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.isActive = !product.isActive;
    await product.save();
    res.json({ success: true, product, message: `Product ${product.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) { next(err); }
};

exports.getDeliveryMap = async (req, res, next) => {
  try {
    const orders = await Order.find({
      status: { $in: ['Shipped', 'Out for Delivery'] },
      'deliveryAddress.lat': { $exists: true, $ne: null }
    }).select('orderId status deliveryAddress total user').populate('user', 'name');
    res.json({ success: true, orders });
  } catch (err) { next(err); }
};
