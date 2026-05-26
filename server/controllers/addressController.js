const User = require('../models/User');

exports.getAddresses = async (req, res) => {
  res.json({ success: true, addresses: req.user.addresses });
};

exports.addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) {
      user.addresses.forEach(a => a.isDefault = false);
    }
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    Object.assign(addr, req.body);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
};

exports.updateWishlist = async (req, res, next) => {
  try {
    const { productId, action } = req.body;
    const user = await User.findById(req.user._id);
    if (action === 'add') {
      if (!user.wishlist.includes(productId)) user.wishlist.push(productId);
    } else {
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    }
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
};

exports.getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) { next(err); }
};
