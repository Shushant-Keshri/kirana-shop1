const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', orderCtrl.placeOrder);
router.get('/', orderCtrl.getOrders);
router.get('/:id', orderCtrl.getOrder);
router.put('/:id/cancel', orderCtrl.cancelOrder);
router.put('/:id/rate', orderCtrl.rateOrder);

module.exports = router;
