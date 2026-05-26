import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI, orderAPI, addressAPI } from '../services/api';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
const STATUS_ICONS  = ['📋', '✅', '📦', '🚚', '🛵', '🏠'];
const STATUS_COLORS = {
  Placed: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-indigo-100 text-indigo-700',
  Packed: 'bg-yellow-100 text-yellow-700',
  Shipped: 'bg-orange-100 text-orange-700',
  'Out for Delivery': 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
};

function OrderTracker({ order }) {
  if (order.status === 'Cancelled') {
    return (
      <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 text-sm text-red-600">
        ✕ Order cancelled — {order.cancelReason || 'Cancelled by customer'}
      </div>
    );
  }
  const currentIdx = STATUS_STEPS.indexOf(order.status);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1">
        {STATUS_STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-1 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${i <= currentIdx ? 'bg-primary text-white shadow' : 'bg-gray-100 text-gray-400'}`}>
              {i < currentIdx ? '✓' : STATUS_ICONS[i]}
            </div>
            <span className={`text-xs text-center leading-tight ${i <= currentIdx ? 'text-primary font-semibold' : 'text-gray-400'}`}
              style={{ fontSize: '10px', maxWidth: 52 }}>{s}</span>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`hidden sm:block absolute`} />
            )}
          </div>
        ))}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 mb-3">
        <div className="bg-primary h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {[...order.statusTimeline].reverse().map((ev, i) => (
          <div key={i} className="flex gap-2 text-xs text-gray-600">
            <span className="text-primary mt-0.5 shrink-0">●</span>
            <div>
              <span className="font-semibold text-gray-800">{ev.status}</span>
              {ev.note && <span className="text-gray-500"> — {ev.note}</span>}
              <span className="text-gray-400 ml-2">{new Date(ev.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddressForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial || { label: 'Home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false });
  const [geoLoading, setGeoLoading] = useState(false);
  const { addToast } = useToast();

  const autofill = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          const a = d.address || {};
          setForm(f => ({ ...f, lat, lng, line1: [a.road, a.suburb].filter(Boolean).join(', '), city: a.city || a.town || a.village || '', state: a.state || '', pincode: a.postcode || '' }));
          addToast('Address auto-filled from location!', 'success');
        } catch { addToast('Could not auto-fill address', 'error'); }
        setGeoLoading(false);
      },
      () => { addToast('Location access denied', 'error'); setGeoLoading(false); }
    );
  };

  return (
    <div className="card p-5 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-800">{initial ? 'Edit Address' : 'Add New Address'}</h4>
        <button onClick={autofill} disabled={geoLoading} className="btn-outline text-xs py-1.5 px-3">
          {geoLoading ? '…' : '📍 Auto-fill'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[['label','Label (Home/Work)',1],['fullName','Full Name',1],['phone','Phone',1],['line1','Address Line 1',2],['line2','Landmark (Optional)',2],['city','City',1],['state','State',1],['pincode','Pincode',1]].map(([k, l, s]) => (
          <div key={k} className={s === 2 ? 'col-span-2' : ''}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{l}</label>
            <input value={form[k] || ''} onChange={e => setForm({ ...form, [k]: e.target.value })} className="input-field text-sm py-2" placeholder={l} />
          </div>
        ))}
        <div className="col-span-2 flex items-center gap-2">
          <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="w-4 h-4 accent-primary" />
          <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave(form)} className="btn-primary py-2 px-6 text-sm">Save Address</button>
        <button onClick={onCancel} className="btn-outline py-2 px-4 text-sm">Cancel</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'profile';

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true);
      orderAPI.getAll().then(({ data }) => setOrders(data.orders || [])).finally(() => setOrdersLoading(false));
    }
    if (activeTab === 'addresses') {
      addressAPI.getAll().then(({ data }) => setAddresses(data.addresses || []));
    }
  }, [activeTab]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) { addToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      updateUser(data.user);
      addToast('Profile updated!', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Update failed', 'error');
    } finally { setSaving(false); }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await orderAPI.cancel(orderId, { reason: 'Cancelled by customer' });
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: 'Cancelled', statusTimeline: [...(o.statusTimeline || []), { status: 'Cancelled', note: 'Cancelled by customer', timestamp: new Date() }] } : o));
      addToast('Order cancelled & stock restored', 'info');
    } catch (err) {
      addToast(err.response?.data?.message || 'Cannot cancel at this stage', 'error');
    }
  };

  const handleSaveAddress = async (form) => {
    try {
      if (editingAddress) {
        const { data } = await addressAPI.update(editingAddress._id, form);
        setAddresses(data.addresses);
        addToast('Address updated!', 'success');
      } else {
        const { data } = await addressAPI.add(form);
        setAddresses(data.addresses);
        addToast('Address added!', 'success');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save address', 'error');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      const { data } = await addressAPI.delete(id);
      setAddresses(data.addresses);
      addToast('Address deleted', 'info');
    } catch {
      addToast('Failed to delete', 'error');
    }
  };

  const TABS = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'orders', label: '📦 Orders' },
    { id: 'addresses', label: '📍 Addresses' },
    { id: 'settings', label: '🔒 Security' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-400 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          {user?.phone && <p className="text-gray-400 text-xs mt-0.5">📞 {user.phone}</p>}
          {user?.role === 'admin' && <span className="badge bg-primary text-white mt-1 inline-block">Admin</span>}
        </div>
        <button onClick={() => { logout(); navigate('/login'); }}
          className="btn-outline text-sm py-2 px-4 text-red-500 border-red-300 hover:bg-red-50 hover:border-red-500">
          🚪 Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setParams({ tab: t.id })}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === t.id ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <h3 className="font-bold text-gray-800 mb-5">Edit Profile</h3>
          <form onSubmit={handleProfileSave} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 text-xs">(change in Security tab)</span></label>
              <input value={user?.email} disabled className="input-field bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-field" placeholder="10-digit mobile" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-8">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 card">
              <div className="text-7xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-5">Your order history will appear here</p>
              <button onClick={() => navigate('/products')} className="btn-primary px-6 py-3">Shop Now</button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order._id} className="card overflow-hidden">
                  <button onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-800 font-mono text-sm">#{order.orderId}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{order.paymentMethod} · {order.deliverySlot?.date} {order.deliverySlot?.time}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                        <p className="font-bold text-primary mt-1.5">₹{order.total}</p>
                      </div>
                    </div>
                  </button>

                  {expandedOrder === order._id && (
                    <div className="px-4 pb-5 border-t border-gray-100">
                      {/* Live tracker */}
                      <OrderTracker order={order} />

                      {/* Items */}
                      <div className="mt-4 space-y-2">
                        {order.items?.map(item => (
                          <div key={item._id} className="flex gap-3 text-sm">
                            <img src={item.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'}
                              alt={item.name} className="w-10 h-10 rounded-xl object-cover" />
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-gray-500 text-xs">×{item.quantity} · ₹{item.price} each</p>
                            </div>
                            <span className="font-semibold">₹{item.total}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
                        {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>–₹{order.discount}</span></div>}
                        <div className="flex justify-between"><span>Tax + Delivery</span><span>₹{(order.tax || 0) + (order.deliveryFee || 0)}</span></div>
                        <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t"><span>Total</span><span className="text-primary">₹{order.total}</span></div>
                      </div>

                      {/* Address */}
                      <p className="text-xs text-gray-500 mt-2">
                        📍 {order.deliveryAddress?.line1}, {order.deliveryAddress?.city} – {order.deliveryAddress?.pincode}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {['Placed', 'Confirmed'].includes(order.status) && (
                          <button onClick={() => handleCancelOrder(order._id)}
                            className="text-sm text-red-500 border border-red-300 rounded-xl px-3 py-1.5 hover:bg-red-50 transition-colors">
                            Cancel Order
                          </button>
                        )}
                        <button onClick={() => navigate(`/order-confirmation/${order._id}`)}
                          className="text-sm text-primary border border-primary rounded-xl px-3 py-1.5 hover:bg-primary/5 transition-colors">
                          View Full Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Saved Addresses</h3>
            {!showAddressForm && (
              <button onClick={() => { setShowAddressForm(true); setEditingAddress(null); }} className="btn-primary text-sm py-2 px-4">
                + Add Address
              </button>
            )}
          </div>

          {showAddressForm && (
            <AddressForm
              initial={editingAddress}
              onSave={handleSaveAddress}
              onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
            />
          )}

          {addresses.length === 0 && !showAddressForm ? (
            <div className="text-center py-12 card">
              <div className="text-5xl mb-3">📍</div>
              <p className="text-gray-500 mb-4">No saved addresses yet</p>
              <button onClick={() => setShowAddressForm(true)} className="btn-primary py-2 px-6">Add Address</button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div key={addr._id} className={`card p-4 border-2 ${addr.isDefault ? 'border-primary/30' : 'border-transparent'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">{addr.label || 'Address'}</span>
                        {addr.isDefault && <span className="badge bg-primary text-white text-xs">Default</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-700">{addr.fullName}</p>
                      <p className="text-sm text-gray-500">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}</p>
                      <p className="text-sm text-gray-500">{addr.city}, {addr.state} – {addr.pincode}</p>
                      <p className="text-sm text-gray-400 mt-1">📞 {addr.phone}</p>
                      {addr.lat && <p className="text-xs text-green-600 mt-1">📌 Location saved</p>}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => { setEditingAddress(addr); setShowAddressForm(true); }}
                        className="text-xs text-blue-500 hover:underline">Edit</button>
                      <button onClick={() => handleDeleteAddress(addr._id)}
                        className="text-xs text-red-400 hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings / Security Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">

          {/* Change Email */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-1">Change Email Address</h3>
            <p className="text-sm text-gray-500 mb-5">Current email: <span className="font-medium text-gray-700">{user?.email}</span></p>
            <ChangeEmailForm updateUser={updateUser} addToast={addToast} />
          </div>

          {/* Change Password */}
          <div className="card p-6">
            <h3 className="font-bold text-gray-800 mb-1">Change Password</h3>
            <p className="text-sm text-gray-500 mb-5">Use a strong password with letters, numbers and symbols.</p>
            <ChangePasswordForm addToast={addToast} />
          </div>

          {/* Danger zone */}
          <div className="card p-6 border-2 border-red-100">
            <h3 className="font-bold text-red-600 mb-1">Sign Out</h3>
            <p className="text-sm text-gray-500 mb-4">You will be logged out of your account on this device.</p>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm">
              🚪 Logout Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ChangeEmailForm({ updateUser, addToast }) {
  const [form, setForm] = useState({ newEmail: '', currentPassword: '' });
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newEmail || !form.currentPassword) {
      addToast('Please fill all fields', 'error'); return;
    }
    setSaving(true);
    try {
      const { data } = await authAPI.changeEmail(form);
      updateUser(data.user);
      addToast('Email updated successfully!', 'success');
      setForm({ newEmail: '', currentPassword: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update email', 'error');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
        <input type="email" value={form.newEmail}
          onChange={e => setForm({ ...form, newEmail: e.target.value })}
          className="input-field" placeholder="new@example.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password <span className="text-gray-400 text-xs">(to confirm)</span></label>
        <div className="relative">
          <input type={showPass ? 'text' : 'password'} value={form.currentPassword}
            onChange={e => setForm({ ...form, currentPassword: e.target.value })}
            className="input-field pr-10" placeholder="Enter your current password" />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPass ? '🙈' : '👁️'}
          </button>
        </div>
      </div>
      <button type="submit" disabled={saving} className="btn-primary py-2.5 px-8">
        {saving ? 'Saving…' : 'Update Email'}
      </button>
    </form>
  );
}

function ChangePasswordForm({ addToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ cur: false, new: false, con: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword) {
      addToast('Please fill all fields', 'error'); return;
    }
    if (form.newPassword.length < 6) {
      addToast('New password must be at least 6 characters', 'error'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      addToast('Passwords do not match', 'error'); return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      addToast('Password changed successfully!', 'success');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setSaving(false); }
  };

  const passField = (key, label, showKey) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input type={show[showKey] ? 'text' : 'password'} value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          className="input-field pr-10" placeholder="••••••••" />
        <button type="button" onClick={() => setShow({ ...show, [showKey]: !show[showKey] })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[showKey] ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {passField('currentPassword', 'Current Password', 'cur')}
      {passField('newPassword', 'New Password', 'new')}
      {passField('confirmPassword', 'Confirm New Password', 'con')}
      {form.newPassword && (
        <div className="flex gap-1">
          {['Length (6+)', 'Uppercase', 'Number'].map((req, i) => {
            const met = i === 0 ? form.newPassword.length >= 6
              : i === 1 ? /[A-Z]/.test(form.newPassword)
              : /[0-9]/.test(form.newPassword);
            return (
              <span key={req} className={`text-xs px-2 py-1 rounded-full ${met ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {met ? '✓' : '○'} {req}
              </span>
            );
          })}
        </div>
      )}
      <button type="submit" disabled={saving} className="btn-primary py-2.5 px-8">
        {saving ? 'Saving…' : 'Change Password'}
      </button>
    </form>
  );
}
