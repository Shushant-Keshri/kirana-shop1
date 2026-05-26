const express = require('express');
const router = express.Router();
const addrCtrl = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', addrCtrl.getAddresses);
router.post('/', addrCtrl.addAddress);
router.put('/:id', addrCtrl.updateAddress);
router.delete('/:id', addrCtrl.deleteAddress);

router.get('/wishlist', addrCtrl.getWishlist);
router.post('/wishlist', addrCtrl.updateWishlist);

module.exports = router;
