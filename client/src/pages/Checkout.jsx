import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderAPI, addressAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onSelect }) {
  useMapEvents({ click: e => onSelect(e.latlng) });
  return null;
}

const PAYMENT_METHODS = [
  { id: 'COD', label: 'Cash on Delivery', icon: '💵' },
  { id: 'UPI', label: 'UPI Payment', icon: '📱' },
  { id: 'Card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'NetBanking', label: 'Net Banking', icon: '🏦' }
];

const emptyAddress = (user) => ({
  fullName: user?.name || '', phone: user?.phone || '',
  line1: '', line2: '', city: '', state: '', pincode: '',
  lat: null, lng: null
});

export default function Checkout() {
  const { items, subtotal, tax, deliveryFee, total, discount, coupon, clearCart } = useCart();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [markerPos, setMarkerPos] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [address, setAddress] = useState(emptyAddress(user));
  const [payment, setPayment] = useState('COD');
  const [placing, setPlacing] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    if (items.length === 0) navigate('/cart');
    addressAPI.getAll().then(({ data }) => {
      setSavedAddresses(data.addresses || []);
      const def = data.addresses?.find(a => a.isDefault);
      if (def) selectSavedAddress(def);
    }).catch(() => {});
  }, []);

  const selectSavedAddress = (a) => {
    const lat = a.lat ?? null;
    const lng = a.lng ?? null;
    setAddress({
      fullName: a.fullName || user?.name || '',
      phone: a.phone || user?.phone || '',
      line1: a.line1 || '', line2: a.line2 || '',
      city: a.city || '', state: a.state || '', pincode: a.pincode || '',
      lat, lng
    });
    if (lat && lng) {
      setMarkerPos({ lat, lng });
      setMapCenter([lat, lng]);
      setMapKey(k => k + 1);
    }
  };

  const useMyLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setMarkerPos({ lat, lng });
        setMapCenter([lat, lng]);
        setMapKey(k => k + 1);
        setAddress(a => ({ ...a, lat, lng }));
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          const addr = d.address || {};
          setAddress(a => ({
            ...a, lat, lng,
            line1: [addr.road, addr.suburb].filter(Boolean).join(', '),
            city: addr.city || addr.town || addr.village || '',
            state: addr.state || '',
            pincode: addr.postcode || ''
          }));
          addToast('Location detected & address filled!', 'success');
        } catch {
          addToast('Location set — fill address manually', 'info');
        }
        setGeoLoading(false);
      },
      () => { addToast('Location access denied', 'error'); setGeoLoading(false); }
    );
  };

  const handleMapClick = ({ lat, lng }) => {
    setMarkerPos({ lat, lng });
    setAddress(a => ({ ...a, lat, lng }));
  };

  const validateAddress = () => ['fullName', 'phone', 'line1', 'city', 'state', 'pincode'].every(k => address[k]?.trim());

  const handlePlaceOrder = async () => {
    if (!validateAddress()) { addToast('Please fill all required address fields', 'error'); return; }
    setPlacing(true);
    try {
      const payload = {
        deliveryAddress: {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || '',
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          ...(address.lat != null && address.lng != null ? { lat: address.lat, lng: address.lng } : {})
        },
        paymentMethod: payment,
        ...(coupon?.code ? { couponCode: coupon.code } : {})
      };
      const { data } = await orderAPI.place(payload);
      await clearCart();
      addToast('Order placed successfully! 🎉', 'success');
      navigate(`/order-confirmation/${data.order._id}`);
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to place order', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const steps = [{ n: 1, label: 'Address' }, { n: 2, label: 'Payment' }];

  const addrField = (key, label, colSpan = 1, type = 'text') => (
    <div key={key} className={colSpan === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label} {['fullName','phone','line1','city','state','pincode'].includes(key) && <span className="text-red-400">*</span>}</label>
      <input type={type} value={address[key]} onChange={e => setAddress({ ...address, [key]: e.target.value })}
        className="input-field text-sm py-2" placeholder={label} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center">
            <button onClick={() => s.n < step && setStep(s.n)}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.n ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'} ${s.n < step ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}>
              {step > s.n ? '✓' : s.n}
            </button>
            <span className={`ml-2 text-sm font-medium ${step >= s.n ? 'text-primary' : 'text-gray-400'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className={`w-16 h-0.5 mx-3 transition-colors ${step > s.n ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">

          {/* Step 1 — Address */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Delivery Address</h2>

              {/* Delivery hours banner */}
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 mb-5 text-sm text-orange-700">
                <span className="text-lg">🕖</span>
                <span>We deliver <span className="font-semibold">7 AM – 8 PM</span>, every day. Orders placed after 8 PM will be delivered the next morning.</span>
              </div>

              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-600 mb-2">Saved Addresses</p>
                  <div className="space-y-2">
                    {savedAddresses.map(a => (
                      <button key={a._id} onClick={() => selectSavedAddress(a)}
                        className={`w-full text-left p-3 border-2 rounded-xl transition-colors text-sm ${address.line1 === a.line1 && address.city === a.city ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span className="font-semibold">{a.label || 'Address'}</span>
                        {a.isDefault && <span className="ml-2 text-xs bg-primary text-white px-2 py-0.5 rounded-full">Default</span>}
                        <p className="text-gray-500 mt-0.5">{a.line1}, {a.city} – {a.pincode}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-3 text-center">— or enter a new address —</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-4">
                {addrField('fullName', 'Full Name', 1)}
                {addrField('phone', 'Phone Number', 1, 'tel')}
                {addrField('line1', 'Address Line 1', 2)}
                {addrField('line2', 'Landmark / Apt (Optional)', 2)}
                {addrField('city', 'City', 1)}
                {addrField('state', 'State', 1)}
                {addrField('pincode', 'Pincode', 1, 'tel')}
              </div>

              {/* Map */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Pin location on map <span className="text-gray-400 text-xs">(optional)</span></p>
                  <button onClick={useMyLocation} disabled={geoLoading}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                    {geoLoading
                      ? <><span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Detecting…</>
                      : '📍 Use My Location'}
                  </button>
                </div>
                <div className="h-52 rounded-xl overflow-hidden border border-gray-200">
                  <MapContainer key={mapKey} center={mapCenter} zoom={markerPos ? 14 : 5} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                    <MapClickHandler onSelect={handleMapClick} />
                    {markerPos && (
                      <Marker position={[markerPos.lat, markerPos.lng]}>
                        <Popup>Delivery here<br />{markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {markerPos && (
                  <p className="text-xs text-green-600 mt-1">✓ Location pinned: {markerPos.lat.toFixed(4)}, {markerPos.lng.toFixed(4)}</p>
                )}
                {!markerPos && <p className="text-xs text-gray-400 mt-1">Click on map to pin delivery location</p>}
              </div>

              <button onClick={() => { if (validateAddress()) setStep(2); else addToast('Fill all required fields (*)', 'error'); }}
                className="w-full btn-primary py-3">Continue to Payment →</button>
            </div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Payment Method</h2>
              <div className="space-y-3 mb-5">
                {PAYMENT_METHODS.map(pm => (
                  <button key={pm.id} onClick={() => setPayment(pm.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${payment === pm.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-2xl">{pm.icon}</span>
                    <span className="font-medium text-gray-800">{pm.label}</span>
                    {payment === pm.id && <span className="ml-auto text-primary font-bold">✓</span>}
                  </button>
                ))}
              </div>

              {payment === 'UPI' && (
                <div className="mb-5 p-4 bg-purple-50 rounded-xl text-center border border-purple-100">
                  <div className="w-36 h-36 bg-white rounded-xl mx-auto mb-3 flex flex-col items-center justify-center border-2 border-dashed border-purple-300 gap-1">
                    <span className="text-5xl">📱</span>
                    <span className="text-xs text-purple-500">QR Code</span>
                  </div>
                  <p className="text-sm font-semibold text-purple-700">Scan to pay via any UPI app</p>
                  <p className="text-xs text-purple-400 mt-1">UPI ID: kiranaShop@upi <span className="italic">(mock)</span></p>
                  <input className="input-field text-sm py-2 mt-3" placeholder="Enter UPI Transaction ID (optional)" />
                </div>
              )}

              {payment === 'Card' && (
                <div className="mb-5 p-4 bg-blue-50 rounded-xl space-y-3 border border-blue-100">
                  <p className="text-sm font-semibold text-blue-700 mb-1">Card Details <span className="text-blue-400 font-normal">(mock — no real charge)</span></p>
                  <input className="input-field text-sm py-2" placeholder="Card Number  •••• •••• •••• ••••" maxLength={19} />
                  <input className="input-field text-sm py-2" placeholder="Name on Card" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input-field text-sm py-2" placeholder="MM / YY" maxLength={5} />
                    <input className="input-field text-sm py-2" placeholder="CVV" maxLength={3} />
                  </div>
                </div>
              )}

              {payment === 'NetBanking' && (
                <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm font-semibold text-green-700 mb-3">Select Bank <span className="text-green-400 font-normal">(mock)</span></p>
                  <div className="grid grid-cols-3 gap-2">
                    {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'BOB', 'Union', 'Canara'].map(b => (
                      <button key={b} className="p-2 border border-green-200 rounded-lg text-sm text-gray-700 hover:bg-green-100 hover:border-green-400 transition-colors">{b}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 btn-outline py-3">← Back</button>
                <button onClick={handlePlaceOrder} disabled={placing}
                  className="flex-1 btn-primary py-3 text-base font-bold">
                  {placing
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Placing Order…
                      </span>
                    : `Place Order ₹${total}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary sidebar */}
        <div className="card p-5 h-fit sticky top-20">
          <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
          <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
            {items.map(item => (
              <div key={item.productId} className="flex gap-2 text-sm">
                <img src={item.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'}
                  alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-xs">{item.name}</p>
                  <p className="text-gray-500 text-xs">×{item.quantity}</p>
                </div>
                <span className="font-semibold text-sm shrink-0">₹{item.total}</span>
              </div>
            ))}
          </div>
          <hr className="mb-3" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal}</span></div>
            {discount > 0 && <div className="flex justify-between text-green-600 font-medium"><span>Discount ({coupon?.code})</span><span>–₹{discount}</span></div>}
            <div className="flex justify-between text-gray-600"><span>Tax (5%)</span><span>₹{tax}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery</span><span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
            <hr />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">₹{total}</span></div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
            <p>📍 {address.city || '—'} {address.pincode ? `– ${address.pincode}` : ''}</p>
            <p>🕖 Delivery: 7 AM – 8 PM daily</p>
            <p>💳 {payment}</p>
            {markerPos && <p className="text-green-600">📌 Location pinned</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
