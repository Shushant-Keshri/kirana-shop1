import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/SkeletonLoader';

const DEAL_END = new Date(Date.now() + 6 * 60 * 60 * 1000);

function Countdown() {
  const [time, setTime] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = DEAL_END - Date.now();
      if (diff <= 0) return setTime({ h: 0, m: 0, s: 0 });
      setTime({ h: Math.floor(diff / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = n => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-2">
      {[['h', time.h], ['m', time.m], ['s', time.s]].map(([unit, val]) => (
        <div key={unit} className="flex items-center gap-1">
          <span className="bg-white text-primary font-bold text-lg w-10 h-10 rounded-lg flex items-center justify-center shadow">
            {pad(val || 0)}
          </span>
          {unit !== 's' && <span className="text-white font-bold">:</span>}
        </div>
      ))}
    </div>
  );
}

const CATEGORIES = [
  { label: 'Fruits & Veg', slug: 'fruits-vegetables', icon: '🥦', color: 'from-green-400 to-green-600' },
  { label: 'Dairy & Eggs', slug: 'dairy-eggs', icon: '🥛', color: 'from-blue-300 to-blue-500' },
  { label: 'Grains', slug: 'grains-pulses', icon: '🌾', color: 'from-yellow-400 to-amber-500' },
  { label: 'Snacks', slug: 'snacks-beverages', icon: '🍿', color: 'from-purple-400 to-purple-600' },
  { label: 'Spices', slug: 'spices-masala', icon: '🌶️', color: 'from-red-400 to-red-600' },
  { label: 'Oils & Ghee', slug: 'oils-ghee', icon: '🫙', color: 'from-amber-300 to-orange-400' },
  { label: 'Personal Care', slug: 'personal-care', icon: '🧴', color: 'from-pink-400 to-pink-600' },
  { label: 'Household', slug: 'household', icon: '🧹', color: 'from-teal-400 to-teal-600' },
  { label: 'Bakery', slug: 'bakery', icon: '🍞', color: 'from-orange-300 to-orange-500' },
  { label: 'Frozen', slug: 'frozen-foods', icon: '🧊', color: 'from-cyan-400 to-cyan-600' }
];

export default function Home() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [featured, setFeatured] = useState([]);
  const [onSale, setOnSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, saleRes] = await Promise.all([
          productAPI.getAll({ featured: 'true', limit: 8 }),
          productAPI.getAll({ onSale: 'true', limit: 8 })
        ]);
        setFeatured(featRes.data.products);
        setOnSale(saleRes.data.products);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden mb-6 bg-gradient-to-r from-primary to-orange-400 p-6 md:p-10">
        <div className="relative z-10 max-w-lg">
          <p className="text-orange-100 font-medium mb-2">🚀 Free delivery above ₹500</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
            Fresh Groceries<br />
            <span className="text-yellow-200">Delivered Fast!</span>
          </h1>
          <p className="text-orange-100 mb-6">Order before 10 AM, get by evening. Quality guaranteed.</p>

          <form onSubmit={handleSearchSubmit} className="flex max-w-md">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search for groceries..."
              className="flex-1 px-5 py-3 rounded-l-2xl text-gray-800 focus:outline-none"
            />
            <button type="submit" className="bg-dark text-white px-6 rounded-r-2xl font-semibold hover:bg-gray-800 transition-colors">
              Search
            </button>
          </form>
        </div>
        <div className="absolute right-4 bottom-0 text-8xl opacity-20 select-none">🛒</div>
        <div className="absolute right-16 top-4 text-5xl opacity-30 select-none">🥦</div>
        <div className="absolute right-32 top-12 text-4xl opacity-20 select-none">🍅</div>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Shop by Category</h2>
          <Link to="/products" className="text-primary text-sm font-semibold hover:underline">See all →</Link>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              to={`/products?category=${cat.slug}`}
              className="flex flex-col items-center gap-1 group"
            >
              <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:scale-105 transition-transform`}>
                {cat.icon}
              </div>
              <span className="text-xs text-center text-gray-600 font-medium leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Deals Countdown */}
      <section className="mb-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-red-100 text-sm font-medium mb-1">⚡ Flash Sale</p>
            <h3 className="text-2xl font-bold">Today's Deals Ending In</h3>
          </div>
          <Countdown />
          <Link to="/products?onSale=true" className="btn-secondary px-6 py-2 text-sm whitespace-nowrap">
            Shop Deals
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">⭐ Popular Products</h2>
          <Link to="/products?featured=true" className="text-primary text-sm font-semibold hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : featured.map(p => <ProductCard key={p._id} product={p} />)
          }
        </div>
      </section>

      {/* On Sale */}
      {onSale.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">🏷️ On Sale</h2>
            <Link to="/products?onSale=true" className="text-primary text-sm font-semibold hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {onSale.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </section>
      )}

      {/* Banners */}
      <section className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-6 text-white">
          <p className="text-emerald-100 text-sm mb-1">Fresh & Organic</p>
          <h3 className="text-xl font-bold mb-2">Farm Fresh Vegetables</h3>
          <Link to="/products?category=fruits-vegetables" className="bg-white text-green-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors inline-block">
            Shop Now
          </Link>
        </div>
        <div className="bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl p-6 text-white">
          <p className="text-blue-100 text-sm mb-1">Use code: SAVE20</p>
          <h3 className="text-xl font-bold mb-2">20% Off on Orders ₹500+</h3>
          <Link to="/products" className="bg-white text-blue-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors inline-block">
            Explore
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: '🚀', title: 'Fast Delivery', desc: 'Same day delivery' },
          { icon: '✅', title: 'Quality Assured', desc: 'Fresh products' },
          { icon: '💳', title: 'Easy Payment', desc: 'UPI, Card, COD' },
          { icon: '🔄', title: 'Easy Returns', desc: '24h return policy' }
        ].map(f => (
          <div key={f.title} className="card p-4 text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <h4 className="font-bold text-sm text-gray-800">{f.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
