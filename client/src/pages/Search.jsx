import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/SkeletonLoader';

const SORTS = [
  { label: 'Relevance', value: '' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' }
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const sort = params.get('sort') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [inputVal, setInputVal] = useState(q);

  const search = useCallback(async () => {
    if (!q) return;
    setLoading(true);
    try {
      const { data } = await productAPI.getAll({ search: q, sort, limit: 20 });
      setProducts(data.products);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [q, sort]);

  useEffect(() => {
    setInputVal(q);
    search();
  }, [q, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      setParams({ q: inputVal.trim() });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-xl">
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Search groceries..."
          className="input-field"
          autoFocus
        />
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {q && (
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {loading ? 'Searching...' : `Results for "${q}"`}
            </h1>
            {!loading && <p className="text-sm text-gray-500">{pagination.total || 0} products found</p>}
          </div>
          <select value={sort} onChange={e => setParams({ q, sort: e.target.value })}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}

      {!q ? (
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-700">Search for products</h2>
          <p className="text-gray-500 mt-2">Type to find groceries, brands, and more</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 card p-8">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No results for "{q}"</h3>
          <p className="text-gray-500 mb-4">Try different keywords or browse categories</p>
          <a href="/products" className="btn-primary px-6 py-3 inline-block">Browse All Products</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
