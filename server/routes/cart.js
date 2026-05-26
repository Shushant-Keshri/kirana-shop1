const express = require('express');
const router = express.Router();
const cartCtrl = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', cartCtrl.getCart);
router.post('/add', cartCtrl.addToCart);
router.put('/update', cartCtrl.updateCartItem);
router.delete('/item/:productId', cartCtrl.removeFromCart);
router.delete('/clear', cartCtrl.clearCart);
router.post('/coupon', cartCtrl.applyCoupon);

module.exports = router;
