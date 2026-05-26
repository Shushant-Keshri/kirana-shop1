import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    try {
      const { data } = await cartAPI.get();
      setItems(data.items || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (productId, quantity = 1) => {
    await cartAPI.add({ productId, quantity });
    await fetchCart();
  };

  const updateItem = async (productId, quantity) => {
    await cartAPI.update({ productId, quantity });
    await fetchCart();
  };

  const removeItem = async (productId) => {
    await cartAPI.remove(productId);
    await fetchCart();
  };

  const clearCart = async () => {
    try { await cartAPI.clear(); } catch {}
    setItems([]);
    setCoupon(null);
    setDiscount(0);
  };

  const applyCoupon = async (code) => {
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const { data } = await cartAPI.applyCoupon({ code, subtotal });
    setCoupon(data.coupon);
    setDiscount(data.discount);
    return data;
  };

  const removeCoupon = () => { setCoupon(null); setDiscount(0); };

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = Math.round((subtotal - discount) * 0.05);
  const deliveryFee = (subtotal - discount) >= 100 ? 0 : 40;
  const total = subtotal - discount + tax + deliveryFee;
  // cartCount = total quantity of all items (not unique item count)
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, coupon, discount, subtotal, tax, deliveryFee, total, cartCount,
      fetchCart, addToCart, updateItem, removeItem, clearCart, applyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
