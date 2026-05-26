import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addressAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ProductCard({ product, wishlistIds = [], onWishlistChange }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(wishlistIds.includes(product._id));

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      addToast(`${product.name} added to cart`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      const action = wishlisted ? 'remove' : 'add';
      await addressAPI.updateWishlist({ productId: product._id, action });
      setWishlisted(!wishlisted);
      addToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
      if (onWishlistChange) onWishlistChange(product._id, action);
    } catch {
      addToast('Failed to update wishlist', 'error');
    }
  };

  const price = product.discountedPrice || product.price;
  const hasDiscount = product.discountPercent > 0;

  return (
    <Link to={`/products/${product._id}`} className="card block group">
      <div className="relative overflow-hidden rounded-t-2xl">
        <img
          src={product.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
          alt={product.name}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-2 left-2 badge bg-primary text-white">
            {product.discountPercent}% OFF
          </span>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-2 right-10 badge bg-yellow-400 text-white text-xs">
            Low Stock
          </span>
        )}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:scale-110 transition-transform"
        >
          <span className={wishlisted ? 'text-red-500' : 'text-gray-400'}>
            {wishlisted ? '❤️' : '🤍'}
          </span>
        </button>
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl">
            <span className="text-white font-semibold text-sm bg-black/60 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{product.category?.name || ''}</p>
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.weight && <p className="text-xs text-gray-400 mb-2">{product.weight}</p>}

        <div className="flex items-center gap-2 mb-3">
          <span className="font-bold text-gray-900">₹{price}</span>
          {hasDiscount && <span className="text-xs text-gray-400 line-through">₹{product.price}</span>}
        </div>

        {product.rating > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-400 text-xs">⭐</span>
            <span className="text-xs text-gray-600">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({product.reviewCount})</span>
          </div>
        )}

        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
            product.stock === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          {adding ? '...' : product.stock === 0 ? 'Out of Stock' : '+ Add to Cart'}
        </button>
      </div>
    </Link>
  );
}
