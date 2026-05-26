const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', productCtrl.getProducts);
router.get('/categories', productCtrl.getCategories);
router.get('/search/suggestions', productCtrl.searchSuggestions);
router.get('/:id/related', productCtrl.getRelated);
router.get('/:id', productCtrl.getProduct);

// Admin routes
router.post('/', protect, adminOnly, productCtrl.createProduct);
router.put('/:id', protect, adminOnly, productCtrl.updateProduct);
router.delete('/:id', protect, adminOnly, productCtrl.deleteProduct);

module.exports = router;
