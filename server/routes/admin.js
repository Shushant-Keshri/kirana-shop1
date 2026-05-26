const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const productCtrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard', adminCtrl.getDashboard);
router.get('/db-stats', adminCtrl.getDbStats);

router.get('/orders', adminCtrl.getAllOrders);
router.put('/orders/:id/status', adminCtrl.updateOrderStatus);

router.get('/users', adminCtrl.getAllUsers);

router.get('/products', adminCtrl.getAllProducts);
router.post('/products', productCtrl.createProduct);
router.put('/products/:id', productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);
router.patch('/products/:id/toggle', adminCtrl.toggleProductStatus);

router.get('/delivery-map', adminCtrl.getDeliveryMap);

module.exports = router;
