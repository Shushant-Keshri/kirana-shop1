import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addressAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    addressAPI.getWishlist().then(({ data }) => setWishlist(data.wishlist)).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId, name) => {
    try {
      await addressAPI.updateWishlist({ productId, action: 'remove' });
      setWishlist(wishlist.filter(p => p._id !== productId));
      addToast(`${name} removed from wishlist`, 'info');
    } catch {
      addToast('Failed to remove', 'error');
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      await handleRemove(product._id, product.name);
      addToast(`${product.name} moved to cart!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">❤️ My Wishlist ({wishlist.length})</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="text-8xl mb-4">💔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save your favourite items for later!</p>
          <Link to="/products" className="btn-primary px-8 py-3 text-base">Browse Products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {wishlist.map(product => {
            const price = product.discountedPrice || product.price;
            return (
              <div key={product._id} className="card group">
                <div className="relative">
                  <Link to={`/products/${product._id}`}>
                    <img src={product.thumbnail} alt={product.name}
                      className="w-full h-40 object-cover rounded-t-2xl group-hover:opacity-90 transition-opacity" />
                  </Link>
                  {product.discountPercent > 0 && (
                    <span className="absolute top-2 left-2 badge bg-primary text-white">{product.discountPercent}% OFF</span>
                  )}
                  <button onClick={() => handleRemove(product._id, product.name)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center text-red-500 hover:scale-110 transition-transform">
                    ❤️
                  </button>
                </div>
                <div className="p-3">
                  <Link to={`/products/${product._id}`}>
                    <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 hover:text-primary">{product.name}</h3>
                  </Link>
                  <div className="flex items-center gap-2 my-2">
                    <span className="font-bold">₹{price}</span>
                    {product.discountPercent > 0 && <span className="text-xs text-gray-400 line-through">₹{product.price}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleMoveToCart(product)}
                      className="flex-1 btn-primary text-xs py-2">🛒 Add to Cart</button>
                    <button onClick={() => navigate(`/products/${product._id}`)}
                      className="px-2 py-2 border border-gray-200 rounded-xl text-xs hover:border-primary hover:text-primary">View</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
