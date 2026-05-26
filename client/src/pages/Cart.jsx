import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Cart() {
  const { items, loading, coupon, discount, subtotal, tax, deliveryFee, total, updateItem, removeItem, clearCart, applyCoupon, removeCoupon } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const handleQty = async (productId, newQty) => {
    setUpdatingId(productId);
    try {
      await updateItem(productId, newQty);
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (productId, name) => {
    setUpdatingId(productId);
    try {
      await removeItem(productId);
      addToast(`${name} removed from cart`, 'info');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const data = await applyCoupon(couponCode.trim());
      addToast(`Coupon applied! You saved ₹${data.discount}`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Invalid coupon', 'error');
    } finally {
      setCouponLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (items.length === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <div className="text-8xl mb-4">🛒</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6">Add some fresh items to get started!</p>
      <Link to="/products" className="btn-primary px-8 py-3 text-base">Start Shopping</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart ({items.length} items)</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.productId} className={`card p-4 transition-opacity ${updatingId === item.productId ? 'opacity-60' : ''}`}>
              <div className="flex gap-4">
                <Link to={`/products/${item.productId}`}>
                  <img src={item.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                    alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.productId}`}>
                    <h3 className="font-semibold text-gray-800 hover:text-primary line-clamp-2">{item.name}</h3>
                  </Link>
                  {item.weight && <p className="text-xs text-gray-500 mt-0.5">{item.weight}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-gray-900">₹{item.price}</span>
                    {item.originalPrice > item.price && (
                      <span className="text-xs text-gray-400 line-through">₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <button onClick={() => handleRemove(item.productId, item.name)}
                    className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => handleQty(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 font-bold text-lg">−</button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => handleQty(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 font-bold text-lg disabled:opacity-40">+</button>
                  </div>
                  <span className="font-bold text-primary">₹{item.total}</span>
                </div>
              </div>
            </div>
          ))}

          <button onClick={clearCart} className="text-sm text-red-500 hover:underline mt-2">🗑️ Clear Cart</button>
        </div>

        {/* Summary */}
        <div className="card p-5 h-fit sticky top-20">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Order Summary</h2>

          {/* Coupon */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Have a coupon?</p>
            {coupon ? (
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                <div>
                  <span className="text-green-700 font-semibold text-sm">{coupon.code}</span>
                  <p className="text-xs text-green-600">-₹{discount} saved!</p>
                </div>
                <button onClick={removeCoupon} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="SAVE10 / SAVE20" className="input-field text-sm py-2" />
                <button onClick={handleApplyCoupon} disabled={couponLoading}
                  className="btn-primary text-sm py-2 px-3 whitespace-nowrap">
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              Available: <button onClick={() => setCouponCode('SAVE10')} className="text-primary">SAVE10</button>,{' '}
              <button onClick={() => setCouponCode('SAVE20')} className="text-primary">SAVE20</button>,{' '}
              <button onClick={() => setCouponCode('WELCOME50')} className="text-primary">WELCOME50</button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({items.length} items)</span>
              <span>₹{subtotal}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Coupon Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
              </span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-orange-500">Add ₹{100 - subtotal + discount} more for free delivery</p>
            )}
            <hr />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">₹{total}</span>
            </div>
          </div>

          <button onClick={() => navigate('/checkout')} className="w-full btn-primary py-3 text-base mt-5">
            Proceed to Checkout →
          </button>
          <Link to="/products" className="block text-center text-sm text-primary mt-3 hover:underline">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
