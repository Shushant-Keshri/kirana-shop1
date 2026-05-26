import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { addressAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await productAPI.getOne(id);
        setProduct(data.product);
        const relRes = await productAPI.getRelated(data.product._id);
        setRelated(relRes.data.products);
      } catch {
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addToCart(product._id, qty);
      addToast(`${product.name} added to cart!`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      const action = wishlisted ? 'remove' : 'add';
      await addressAPI.updateWishlist({ productId: product._id, action });
      setWishlisted(!wishlisted);
      addToast(wishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'success');
    } catch {
      addToast('Failed to update wishlist', 'error');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="space-y-4">
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-1/2" />
          <div className="skeleton h-8 w-32" />
          <div className="skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const price = product.discountedPrice || product.price;
  const images = product.images?.length ? product.images : [product.thumbnail];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="hover:text-primary">Home</button>
        <span>›</span>
        <button onClick={() => navigate('/products')} className="hover:text-primary">Products</button>
        <span>›</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-3 aspect-square">
            <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 badge bg-primary text-white text-sm px-3 py-1">
                {product.discountPercent}% OFF
              </span>
            )}
            <button onClick={handleWishlist}
              className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow flex items-center justify-center hover:scale-110 transition-transform">
              <span className={wishlisted ? 'text-red-500 text-xl' : 'text-gray-400 text-xl'}>
                {wishlisted ? '❤️' : '🤍'}
              </span>
            </button>
          </div>
          {images.length > 1 && (
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-primary text-sm font-medium mb-1">{product.category?.name}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>

          {product.weight && (
            <p className="text-gray-500 text-sm mb-3">Weight: <span className="text-gray-700 font-medium">{product.weight}</span></p>
          )}

          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1,2,3,4,5].map(s => (
                  <span key={s} className={s <= Math.round(product.rating) ? 'text-yellow-400' : 'text-gray-300'}>⭐</span>
                ))}
              </div>
              <span className="text-sm text-gray-600">{product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-gray-900">₹{price}</span>
            {product.discountPercent > 0 && (
              <>
                <span className="text-gray-400 line-through text-lg">₹{product.price}</span>
                <span className="badge bg-green-100 text-green-700">Save ₹{product.price - price}</span>
              </>
            )}
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
            {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{product.description}</p>
          )}

          {product.stock > 0 && (
            <>
              {/* Qty stepper */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 font-bold">−</button>
                  <span className="w-12 text-center font-bold">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="w-10 h-10 flex items-center justify-center text-lg hover:bg-gray-100 font-bold">+</button>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button onClick={handleAddToCart} disabled={adding}
                  className="flex-1 btn-outline py-3 text-base">
                  {adding ? '...' : '🛒 Add to Cart'}
                </button>
                <button onClick={handleBuyNow} disabled={adding}
                  className="flex-1 btn-primary py-3 text-base">
                  ⚡ Buy Now
                </button>
              </div>
            </>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="badge bg-gray-100 text-gray-600">#{tag}</span>
              ))}
            </div>
          )}

          {/* Delivery info */}
          <div className="mt-6 p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-3 text-sm text-green-700">
              <span>🚀</span>
              <div>
                <p className="font-semibold">Free Delivery on orders above ₹500</p>
                <p className="text-green-600 text-xs">Delivery by today if ordered before 10 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.slice(0, 8).map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
