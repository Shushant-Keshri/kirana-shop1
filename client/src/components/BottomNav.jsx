import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { cartCount } = useCart();
  const { user } = useAuth();

  const tabs = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/products', icon: '🛍️', label: 'Shop' },
    { path: '/cart', icon: '🛒', label: 'Cart', badge: cartCount },
    { path: '/wishlist', icon: '❤️', label: 'Wishlist' },
    { path: user ? '/profile' : '/login', icon: '👤', label: user ? 'Profile' : 'Login' }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe">
      <div className="flex">
        {tabs.map(tab => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-colors ${isActive(tab.path) ? 'text-primary' : 'text-gray-500'}`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
            {tab.badge > 0 && (
              <span className="absolute top-1 right-1/4 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
            {isActive(tab.path) && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
