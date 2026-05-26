import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { adminAPI, productAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const STATUS_FLOW = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUS_COLORS = {
  Placed: 'bg-blue-100 text-blue-700', Confirmed: 'bg-indigo-100 text-indigo-700',
  Packed: 'bg-yellow-100 text-yellow-700', Shipped: 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700', Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
};

// ─── Dashboard ─────────────────────────────────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getDashboard(), adminAPI.getDbStats()])
      .then(([d, s]) => { setData(d.data); setDbStats(s.data.stats); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Orders',  value: data?.stats.totalOrders,  icon: '📦', color: 'from-blue-400 to-blue-600' },
          { label: 'Revenue',       value: `₹${(data?.stats.totalRevenue||0).toLocaleString()}`, icon: '💰', color: 'from-green-400 to-green-600' },
          { label: 'Products',      value: data?.stats.totalProducts, icon: '🛍️', color: 'from-orange-400 to-orange-600' },
          { label: 'Customers',     value: data?.stats.totalUsers,    icon: '👥', color: 'from-purple-400 to-purple-600' }
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} text-white rounded-2xl p-5`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm opacity-80 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* DB Stats row */}
      {dbStats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Delivered',  value: dbStats.deliveredOrders,  color: 'text-green-600'  },
            { label: 'Pending',    value: dbStats.pendingOrders,    color: 'text-orange-500' },
            { label: 'Cancelled',  value: dbStats.cancelledOrders,  color: 'text-red-500'    },
            { label: 'Active Prods', value: dbStats.activeProducts, color: 'text-blue-600'   },
            { label: 'Inactive',   value: dbStats.inactiveProducts, color: 'text-gray-500'   },
            { label: 'Categories', value: dbStats.categories,       color: 'text-purple-600' }
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {data?.recentOrders?.slice(0, 8).map(order => (
              <div key={order._id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-mono text-xs text-gray-500">{order.orderId}</p>
                  <p className="font-medium">{order.user?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`badge text-xs ${STATUS_COLORS[order.status]||'bg-gray-100'}`}>{order.status}</span>
                  <p className="font-bold text-primary text-sm mt-0.5">₹{order.total}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4">⚠️ Low Stock Alert</h3>
          {data?.lowStockProducts?.length === 0
            ? <p className="text-gray-400 text-sm">All products have adequate stock</p>
            : <div className="space-y-2">
                {data?.lowStockProducts?.map(p => (
                  <div key={p._id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <img src={p.thumbnail} alt={p.name} className="w-9 h-9 object-cover rounded-lg" />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className={`font-bold text-sm ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Orders ────────────────────────────────────────────────────────────────
function OrdersAdmin() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI.getOrders({ status: statusFilter, search }).then(({ data }) => setOrders(data.orders || [])).finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await adminAPI.updateOrderStatus(orderId, { status });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o));
      addToast(`Order → ${status}`, 'success');
    } catch { addToast('Update failed', 'error'); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Orders Management</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search order ID…" className="input-field text-sm py-2 w-48" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
          <option value="">All Status</option>
          {[...STATUS_FLOW, 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="btn-primary text-sm py-2 px-4">Search</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-gray-400 text-center py-8">No orders found</p>}
          {orders.map(order => (
            <div key={order._id} className="card overflow-hidden">
              <button onClick={() => setExpanded(expanded === order._id ? null : order._id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold font-mono text-sm">{order.orderId}</p>
                    <p className="text-sm text-gray-600">{order.user?.name} · {order.user?.phone}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${STATUS_COLORS[order.status]||'bg-gray-100'}`}>{order.status}</span>
                    <span className="font-bold text-primary">₹{order.total}</span>
                    <span className="text-gray-400 text-xs">{order.paymentMethod}</span>
                  </div>
                </div>
              </button>
              {expanded === order._id && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 mt-3 mb-3 items-center">
                    <span className="text-sm font-medium text-gray-600">Update status:</span>
                    {order.status !== 'Cancelled' && order.status !== 'Delivered'
                      ? STATUS_FLOW.map(s => (
                          <button key={s} onClick={() => updateStatus(order._id, s)}
                            disabled={updating === order._id || order.status === s}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${order.status === s ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:border-primary hover:text-primary'}`}>
                            {s}
                          </button>
                        ))
                      : <span className="text-sm text-gray-400">{order.status} — no further updates</span>
                    }
                    {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                      <button onClick={() => updateStatus(order._id, 'Cancelled')}
                        className="text-xs px-3 py-1.5 rounded-full border border-red-300 text-red-500 hover:bg-red-50">
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>📍 {order.deliveryAddress?.line1}, {order.deliveryAddress?.city} – {order.deliveryAddress?.pincode}</p>
                    <p>⏰ {order.deliverySlot?.date} {order.deliverySlot?.time}</p>
                    <p>{order.items?.length} items · Subtotal ₹{order.subtotal} · Tax ₹{order.tax} · Delivery {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</p>
                    {order.discount > 0 && <p className="text-green-600">Discount –₹{order.discount} ({order.couponCode})</p>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Products ──────────────────────────────────────────────────────────────
function ProductsAdmin() {
  const { addToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyForm = { name:'', description:'', price:'', discountPercent:0, weight:'', stock:100, category:'', tags:'', thumbnail:'' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminAPI.getProducts({ search, lowStock: lowStockOnly }), productAPI.getCategories()])
      .then(([p, c]) => { setProducts(p.data.products || []); setCategories(c.data.categories || []); })
      .finally(() => setLoading(false));
  }, [search, lowStockOnly]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description||'', price: p.price, discountPercent: p.discountPercent||0, weight: p.weight||'', stock: p.stock, category: p.category?._id||'', tags: p.tags?.join(', ')||'', thumbnail: p.thumbnail||'' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), discountPercent: Number(form.discountPercent), stock: Number(form.stock), tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editProduct) {
        const { data } = await adminAPI.updateProduct(editProduct._id, payload);
        setProducts(products.map(p => p._id === editProduct._id ? data.product : p));
        addToast('Product updated!', 'success');
      } else {
        const { data } = await adminAPI.createProduct(payload);
        setProducts([data.product, ...products]);
        addToast('Product created!', 'success');
      }
      setShowForm(false); setEditProduct(null); setForm(emptyForm);
    } catch (err) { addToast(err.response?.data?.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id, name, current) => {
    try {
      await adminAPI.toggleProduct(id);
      setProducts(products.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p));
      addToast(`${name} ${current ? 'deactivated' : 'activated'}`, 'info');
    } catch { addToast('Toggle failed', 'error'); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await adminAPI.deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      addToast('Product deleted', 'info');
    } catch { addToast('Delete failed', 'error'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">Products</h2>
        <button onClick={() => { setEditProduct(null); setForm(emptyForm); setShowForm(true); }} className="btn-primary text-sm">+ Add Product</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="Search products…" className="input-field text-sm py-2 w-48" />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} className="accent-primary" />
          Low stock only
        </label>
        <button onClick={load} className="btn-outline text-sm py-2 px-4">Filter</button>
      </div>

      {showForm && (
        <div className="card p-5 mb-5 border-2 border-primary/20">
          <h3 className="font-bold mb-4">{editProduct ? 'Edit Product' : 'New Product'}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            {[['name','Product Name',2],['description','Description (optional)',2],['price','Price (₹)',1],['discountPercent','Discount %',1],['weight','Weight / Unit (e.g. 500g)',1],['stock','Stock Qty',1],['thumbnail','Thumbnail URL',2],['tags','Tags (comma separated)',2]].map(([k,l,s]) => (
              <div key={k} className={s===2?'col-span-2':''}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
                {k==='description'
                  ? <textarea value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input-field text-sm py-2 h-16 resize-none" />
                  : <input type={['price','discountPercent','stock'].includes(k)?'number':'text'} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="input-field text-sm py-2" />
                }
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="input-field text-sm py-2">
                <option value="">Select category</option>
                {categories.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary px-6">{saving?'Saving…':'Save'}</button>
              <button type="button" onClick={()=>{setShowForm(false);setEditProduct(null);}} className="btn-outline px-6">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.thumbnail} alt={p.name} className="w-9 h-9 object-cover rounded-lg" />
                        <span className="font-medium max-w-[160px] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">₹{p.discountedPrice}</span>
                      {p.discountPercent>0 && <span className="text-xs text-gray-400 line-through ml-1">₹{p.price}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.stock===0?'text-red-600':p.stock<10?'text-orange-500':''}`}>
                        {p.stock===0?'OUT':p.stock}
                        {p.stock>0&&p.stock<10&&<span className="text-xs text-orange-400 ml-1">low</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={()=>handleToggle(p._id,p.name,p.isActive)}
                        className={`badge cursor-pointer ${p.isActive?'bg-green-100 text-green-700 hover:bg-green-200':'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                        {p.isActive?'Active':'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button onClick={()=>openEdit(p)} className="text-blue-500 hover:underline text-xs">Edit</button>
                        <button onClick={()=>handleDelete(p._id,p.name)} className="text-red-400 hover:underline text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length===0 && <p className="text-center text-gray-400 py-8 text-sm">No products found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Database Viewer ────────────────────────────────────────────────────────
function DbViewer() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s] = await Promise.all([adminAPI.getDbStats()]);
      setDbStats(s.data.stats);
      if (tab === 'users') { const r = await adminAPI.getUsers({ search, limit: 50 }); setUsers(r.data.users||[]); }
      if (tab === 'orders') { const r = await adminAPI.getOrders({ search, limit: 50 }); setOrders(r.data.orders||[]); }
      if (tab === 'products') { const r = await adminAPI.getProducts({ search, limit: 50 }); setProducts(r.data.products||[]); }
    } finally { setLoading(false); }
  }, [tab, search]);

  useEffect(() => { loadData(); }, [tab]);

  const TABS = [
    { id: 'users', label: '👥 Users', count: dbStats?.users },
    { id: 'orders', label: '📦 Orders', count: dbStats?.orders },
    { id: 'products', label: '🛍️ Products', count: dbStats?.products }
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Database Viewer</h2>

      {dbStats && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Users', v: dbStats.users, color: 'text-blue-600' },
            { label: 'Total Orders', v: dbStats.orders, color: 'text-orange-600' },
            { label: 'Total Products', v: dbStats.products, color: 'text-green-600' },
            { label: 'Revenue', v: `₹${(dbStats.totalRevenue||0).toLocaleString()}`, color: 'text-primary' }
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.v}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab===t.id?'bg-white text-gray-800 shadow':'text-gray-500 hover:text-gray-700'}`}>
            {t.label} {t.count!=null && <span className="text-xs text-gray-400 ml-1">({t.count})</span>}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&loadData()}
          placeholder={`Search ${tab}…`} className="input-field text-sm py-2 w-56" />
        <button onClick={loadData} className="btn-primary text-sm py-2 px-4">Search</button>
      </div>

      {loading ? <Spinner /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            {/* Users table */}
            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th><th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Spent</th><th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.phone||'—'}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{u.orderCount}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">₹{u.totalSpent||0}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Orders table */}
            {tab === 'orders' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3">Order ID</th><th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Payment</th><th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs">{o.orderId}</td>
                      <td className="px-4 py-3">{o.user?.name}<br/><span className="text-xs text-gray-400">{o.user?.email}</span></td>
                      <td className="px-4 py-3 font-bold text-primary">₹{o.total}</td>
                      <td className="px-4 py-3"><span className={`badge text-xs ${STATUS_COLORS[o.status]||'bg-gray-100'}`}>{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.paymentMethod}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Products table */}
            {tab === 'products' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 text-left">
                  <tr>
                    <th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Sold</th><th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={p.thumbnail} alt={p.name} className="w-8 h-8 object-cover rounded" />
                          <span className="font-medium max-w-[140px] truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.category?.name}</td>
                      <td className="px-4 py-3 font-semibold">₹{p.discountedPrice}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${p.stock===0?'text-red-600':p.stock<10?'text-orange-500':''}`}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{p.soldCount||0}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${p.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                          {p.isActive?'Active':'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {((tab==='users'&&users.length===0)||(tab==='orders'&&orders.length===0)||(tab==='products'&&products.length===0)) && (
              <p className="text-center text-gray-400 py-10 text-sm">No records found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Delivery Map ───────────────────────────────────────────────────────────
function DeliveryMap() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDeliveryMap().then(({ data }) => setOrders(data.orders || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Live Delivery Map</h2>
      <div className="card p-4">
        <div className="h-[480px] rounded-xl overflow-hidden">
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors' />
            {orders.filter(o => o.deliveryAddress?.lat).map(order => (
              <Marker key={order._id} position={[order.deliveryAddress.lat, order.deliveryAddress.lng]}>
                <Popup>
                  <div className="text-sm space-y-1">
                    <p className="font-bold">{order.orderId}</p>
                    <p>{order.user?.name}</p>
                    <p>₹{order.total}</p>
                    <span className={`badge text-xs ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {loading ? 'Loading…' : orders.length === 0
            ? 'No active deliveries with pinned locations yet. Customers must pin location during checkout.'
            : `${orders.length} active delivery${orders.length !== 1 ? 'ies' : ''} shown`}
        </p>
      </div>
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ─── Shell ──────────────────────────────────────────────────────────────────
export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const NAV = [
    { path: '/admin',          label: '📊 Dashboard',    exact: true },
    { path: '/admin/orders',   label: '📦 Orders' },
    { path: '/admin/products', label: '🛍️ Products' },
    { path: '/admin/database', label: '🗄️ Database' },
    { path: '/admin/map',      label: '🗺️ Delivery Map' }
  ];

  const isActive = (path, exact) =>
    exact ? location.pathname === '/admin' : location.pathname.startsWith(path) && path !== '/admin';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-dark text-white flex flex-col shrink-0 min-h-screen">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <p className="font-bold text-sm">Kirana Admin</p>
              <p className="text-xs text-gray-400 truncate max-w-[120px]">{user?.name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <Link key={item.path} to={item.path}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive(item.path, item.exact) ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/" className="block px-3 py-2 text-sm text-gray-400 hover:text-white">← Back to Shop</Link>
          <button onClick={() => { logout(); navigate('/login'); }}
            className="block w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300">🚪 Logout</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto min-h-screen">
        <Routes>
          <Route index      element={<Dashboard />} />
          <Route path="orders"   element={<OrdersAdmin />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="database" element={<DbViewer />} />
          <Route path="map"      element={<DeliveryMap />} />
        </Routes>
      </main>
    </div>
  );
}
