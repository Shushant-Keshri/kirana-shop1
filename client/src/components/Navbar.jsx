import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSugg(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (val) => {
    setSearchQ(val);
    clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await productAPI.getSuggestions(val);
        setSuggestions(data.suggestions);
        setShowSugg(true);
      } catch {}
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setShowSugg(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🛒</span>
            <span className="font-bold text-primary text-xl hidden sm:block">Kirana Shop</span>
          </Link>

          {/* Search */}
          <div ref={searchRef} className="flex-1 relative max-w-xl">
            <form onSubmit={handleSearchSubmit} className="flex">
              <input
                type="text"
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search groceries, brands..."
                className="w-full border border-gray-200 rounded-l-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              <button type="submit" className="bg-primary text-white px-4 rounded-r-xl hover:bg-primary-dark transition-colors">
                🔍
              </button>
            </form>
            {showSugg && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-xl mt-1 overflow-hidden z-50">
                {suggestions.map(s => (
                  <button
                    key={s._id}
                    onClick={() => { navigate(`/products/${s._id}`); setShowSugg(false); setSearchQ(''); }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                  >
                    <img src={s.thumbnail} alt={s.name} className="w-8 h-8 object-cover rounded" />
                    <span className="text-sm">{s.name}</span>
                    <span className="ml-auto text-primary font-semibold text-sm">₹{s.discountedPrice}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.name?.split(' ')[0]}</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-xl overflow-hidden w-48 z-50">
                    <Link to="/profile" onClick={() => setShowMenu(false)} className="block px-4 py-3 hover:bg-gray-50 text-sm">👤 Profile</Link>
                    <Link to="/profile?tab=orders" onClick={() => setShowMenu(false)} className="block px-4 py-3 hover:bg-gray-50 text-sm">📦 Orders</Link>
                    <Link to="/wishlist" onClick={() => setShowMenu(false)} className="block px-4 py-3 hover:bg-gray-50 text-sm">❤️ Wishlist</Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setShowMenu(false)} className="block px-4 py-3 hover:bg-gray-50 text-sm text-primary font-semibold">⚙️ Admin Panel</Link>
                    )}
                    <hr />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-red-500">🚪 Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4 hidden sm:block">Login</Link>
            )}
          </div>
        </div>

        {/* Category nav */}
        <div className="hidden md:flex gap-6 pb-2 overflow-x-auto text-sm">
          {[
            { label: 'Fruits & Veg', slug: 'fruits-vegetables', icon: '🥦' },
            { label: 'Dairy', slug: 'dairy-eggs', icon: '🥛' },
            { label: 'Grains', slug: 'grains-pulses', icon: '🌾' },
            { label: 'Snacks', slug: 'snacks-beverages', icon: '🍿' },
            { label: 'Spices', slug: 'spices-masala', icon: '🌶️' },
            { label: 'Oils', slug: 'oils-ghee', icon: '🫙' },
            { label: 'Personal', slug: 'personal-care', icon: '🧴' },
            { label: 'Household', slug: 'household', icon: '🧹' },
            { label: 'Bakery', slug: 'bakery', icon: '🍞' },
            { label: 'Frozen', slug: 'frozen-foods', icon: '🧊' }
          ].map(cat => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className={`flex items-center gap-1 whitespace-nowrap py-1 px-2 rounded-lg hover:bg-orange-50 hover:text-primary transition-colors ${location.search.includes(cat.slug) ? 'text-primary font-semibold' : 'text-gray-600'}`}
            >
              <span>{cat.icon}</span> {cat.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
