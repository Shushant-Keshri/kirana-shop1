import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../services/api';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOne(id).then(({ data }) => setOrder(data.order)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Order not found</p>
      <Link to="/" className="btn-primary mt-4 inline-block">Go Home</Link>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Animated checkmark */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-in">
          <svg className="w-12 h-12 text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" strokeDasharray="100" strokeDashoffset="0" className="animate-checkmark" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Order Placed!</h1>
        <p className="text-gray-500 mt-2">Thank you for shopping with Kirana Shop</p>
        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mt-3">
          <span className="text-sm text-gray-600">Order ID:</span>
          <span className="font-bold text-primary">{order.orderId}</span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-5">Order Status</h2>

        {/* Progress bar */}
        <div className="flex items-center mb-4 overflow-x-auto pb-2">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              <p className={`text-xs ml-1 whitespace-nowrap ${i <= currentStep ? 'text-primary font-medium' : 'text-gray-400'}`}>{s}</p>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 shrink-0 ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Timeline events */}
        <div className="space-y-3 mt-4">
          {order.statusTimeline.map((event, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
              <div>
                <p className="font-medium text-sm text-gray-800">{event.status}</p>
                <p className="text-xs text-gray-500">{event.note}</p>
                <p className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Details */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">Order Details</h2>
        <div className="space-y-3 mb-4">
          {order.items.map(item => (
            <div key={item._id} className="flex gap-3">
              <img src={item.thumbnail || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=60'}
                alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">×{item.quantity}</p>
              </div>
              <span className="font-semibold text-sm">₹{item.total}</span>
            </div>
          ))}
        </div>
        <hr className="mb-3" />
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount}</span></div>}
          <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{order.tax}</span></div>
          <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span></div>
          <div className="flex justify-between font-bold text-base pt-2 border-t"><span>Total</span><span className="text-primary">₹{order.total}</span></div>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-3">Delivery Info</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p className="font-medium text-gray-800">{order.deliveryAddress?.fullName}</p>
          <p>{order.deliveryAddress?.line1}</p>
          {order.deliveryAddress?.line2 && <p>{order.deliveryAddress.line2}</p>}
          <p>{order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}</p>
          <p className="mt-2">📞 {order.deliveryAddress?.phone}</p>
          <p className="mt-2">⏰ <strong>Slot:</strong> {order.deliverySlot?.date} {order.deliverySlot?.time}</p>
          <p>💳 <strong>Payment:</strong> {order.paymentMethod} ({order.paymentStatus})</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link to="/profile?tab=orders" className="flex-1 btn-outline py-3 text-center">View All Orders</Link>
        <Link to="/products" className="flex-1 btn-primary py-3 text-center">Continue Shopping</Link>
      </div>
    </div>
  );
}
