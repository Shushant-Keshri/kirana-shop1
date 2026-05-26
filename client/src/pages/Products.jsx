import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/SkeletonLoader';

const CATEGORIES = [
  { label: 'All', slug: '' },
  { label: '🥦 Fruits & Veg', slug: 'fruits-vegetables' },
  { label: '🥛 Dairy & Eggs', slug: 'dairy-eggs' },
  { label: '🌾 Grains', slug: 'grains-pulses' },
  { label: '🍿 Snacks', slug: 'snacks-beverages' },
  { label: '🌶️ Spices', slug: 'spices-masala' },
  { label: '🫙 Oils', slug: 'oils-ghee' },
  { label: '🧴 Personal', slug: 'personal-care' },
  { label: '🧹 Household', slug: 'household' },
  { label: '🍞 Bakery', slug: 'bakery' },
  { label: '🧊 Frozen', slug: 'frozen-foods' }
];

const SORTS = [
  { label: 'Newest', value: '' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Name A-Z', value: 'name' }
];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilter, setShowFilter] = useState(false);

  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const page = Number(params.get('page') || 1);

  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ category, sort, minPrice, maxPrice, page, limit: 20 });
      setProducts(data.products);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [category, sort, minPrice, maxPrice, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setParams(p);
  };

  const clearFilters = () => {
    setParams({});
    setPriceRange({ min: '', max: '' });
  };

  const applyPrice = () => {
    const p = new URLSearchParams(params);
    if (priceRange.min) p.set('minPrice', priceRange.min); else p.delete('minPrice');
    if (priceRange.max) p.set('maxPrice', priceRange.max); else p.delete('maxPrice');
    p.delete('page');
    setParams(p);
  };

  const activeFilters = [
    category && { key: 'category', label: `Category: ${CATEGORIES.find(c => c.slug === category)?.label || category}` },
    minPrice && { key: 'minPrice', label: `Min: ₹${minPrice}` },
    maxPrice && { key: 'maxPrice', label: `Max: ₹${maxPrice}` },
    sort && { key: 'sort', label: `Sort: ${SORTS.find(s => s.value === sort)?.label}` }
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Products</h1>
          {pagination.total && <p className="text-sm text-gray-500">{pagination.total} products found</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter(!showFilter)}
            className="btn-outline text-sm py-2 px-3">
            🔧 Filters {activeFilters.length > 0 && <span className="bg-primary text-white text-xs px-1.5 rounded-full ml-1">{activeFilters.length}</span>}
          </button>
          <select value={sort} onChange={e => updateParam('sort', e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {activeFilters.map(f => (
            <span key={f.key} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1.5 rounded-full font-medium">
              {f.label}
              <button onClick={() => { updateParam(f.key, ''); setPriceRange({ min: '', max: '' }); }} className="ml-1 hover:text-primary-dark">✕</button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-red-500 px-2 py-1.5 underline">Clear all</button>
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar filter */}
        {showFilter && (
          <div className="w-56 shrink-0 card p-4 h-fit sticky top-20">
            <h3 className="font-bold text-gray-800 mb-4">Filters</h3>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Category</h4>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.slug}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${category === cat.slug ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Price Range</h4>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={priceRange.min}
                  onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <input type="number" placeholder="Max" value={priceRange.max}
                  onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={applyPrice} className="w-full btn-primary py-1.5 text-sm mt-2">Apply</button>
            </div>

            <button onClick={clearFilters} className="w-full text-sm text-red-500 hover:underline text-center">Clear Filters</button>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1">
          {/* Category pills - horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat.slug}
                onClick={() => updateParam('category', cat.slug)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${category === cat.slug ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {products.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button key={p}
                      onClick={() => { const ps = new URLSearchParams(params); ps.set('page', p); setParams(ps); }}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${page === p ? 'bg-primary text-white' : 'bg-white text-gray-600 border hover:border-primary hover:text-primary'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
