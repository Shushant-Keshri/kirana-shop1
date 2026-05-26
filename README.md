# 🛒 Kirana Shop — Full-Stack MERN Grocery App

A complete Kirana (Indian grocery) shop built with React 18 + Vite + Node.js + MongoDB.

---

## Prerequisites

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **MongoDB Community** running on `localhost:27017` → [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **npm** v9+

---

## Setup & Installation

### Option A — All at once (from root)

```bash
cd kirana-shop
npm install
npm run install:all
```

### Option B — Separately

```bash
# Backend
cd kirana-shop/server
npm install

# Frontend
cd kirana-shop/client
npm install
```

---

## Environment Variables

The file `server/.env` is pre-configured. You can customize:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kiranadb
JWT_SECRET=kirana_jwt_secret_key_2024_super_secure
JWT_REFRESH_SECRET=kirana_refresh_secret_key_2024_super_secure
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## Database Seed

Run once to populate 60+ products, 10 categories, users, and coupons:

```bash
# From root
npm run seed

# Or directly
cd server && npm run seed
```

### Seed Credentials

| Role  | Email               | Password   |
|-------|---------------------|------------|
| Admin | admin@kirana.com    | Admin@123  |
| User  | user@kirana.com     | User@123   |

### Coupon Codes

| Code      | Discount       | Min Order |
|-----------|----------------|-----------|
| SAVE10    | 10% off        | ₹200      |
| SAVE20    | 20% off (max ₹200) | ₹500  |
| WELCOME50 | ₹50 flat off   | ₹150      |

---

## Start Development Servers

### Option A — Both together (from root)

```bash
npm run dev
```

### Option B — Separately

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin Panel**: http://localhost:3000/admin

---

## API Endpoints

### Auth
| Method | Endpoint                      | Description       |
|--------|-------------------------------|-------------------|
| POST   | /api/auth/register            | Register user     |
| POST   | /api/auth/login               | Login             |
| POST   | /api/auth/refresh             | Refresh JWT       |
| GET    | /api/auth/me                  | Get current user  |
| PUT    | /api/auth/profile             | Update profile    |
| PUT    | /api/auth/change-password     | Change password   |
| POST   | /api/auth/forgot-password     | Forgot password   |
| POST   | /api/auth/reset-password      | Reset password    |

### Products
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/products                     | List/search/filter       |
| GET    | /api/products/:id                 | Get single product       |
| GET    | /api/products/:id/related         | Related products         |
| GET    | /api/products/categories          | All categories           |
| GET    | /api/products/search/suggestions  | Autocomplete suggestions |
| POST   | /api/products                     | Create (Admin)           |
| PUT    | /api/products/:id                 | Update (Admin)           |
| DELETE | /api/products/:id                 | Delete (Admin)           |

### Cart
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | /api/cart             | Get cart           |
| POST   | /api/cart/add         | Add item           |
| PUT    | /api/cart/update      | Update quantity    |
| DELETE | /api/cart/item/:id    | Remove item        |
| DELETE | /api/cart/clear       | Clear cart         |
| POST   | /api/cart/coupon      | Apply coupon       |

### Orders
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/orders           | Place order        |
| GET    | /api/orders           | Order history      |
| GET    | /api/orders/:id       | Order details      |
| PUT    | /api/orders/:id/cancel| Cancel order       |
| PUT    | /api/orders/:id/rate  | Rate order         |

### Addresses & Wishlist
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | /api/addresses        | Get addresses      |
| POST   | /api/addresses        | Add address        |
| PUT    | /api/addresses/:id    | Update address     |
| DELETE | /api/addresses/:id    | Delete address     |
| GET    | /api/addresses/wishlist| Get wishlist      |
| POST   | /api/addresses/wishlist| Update wishlist   |

### Admin
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/admin/dashboard              | Dashboard stats          |
| GET    | /api/admin/orders                 | All orders               |
| PUT    | /api/admin/orders/:id/status      | Update order status      |
| GET    | /api/admin/users                  | All users                |
| GET    | /api/admin/products               | All products             |
| POST   | /api/admin/products               | Create product           |
| PUT    | /api/admin/products/:id           | Update product           |
| DELETE | /api/admin/products/:id           | Delete product           |
| GET    | /api/admin/delivery-map           | Live delivery coords     |

---

## Pages

| Route                        | Description                         |
|------------------------------|-------------------------------------|
| /                            | Home — hero, categories, deals, products |
| /login                       | Login with demo credentials         |
| /register                    | Create account                      |
| /products                    | Products grid with filters & sort   |
| /products/:id                | Product detail with Leaflet map     |
| /search?q=...                | Real-time search results            |
| /cart                        | Cart with coupons & price breakdown |
| /checkout                    | Address + map + slots + payment     |
| /order-confirmation/:id      | Animated confirmation + timeline    |
| /profile                     | Edit profile, orders, addresses     |
| /wishlist                    | Saved items                         |
| /admin                       | Admin dashboard (admin only)        |
| /admin/orders                | Order management                    |
| /admin/products              | Product CRUD                        |
| /admin/map                   | Live delivery map                   |

---

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router 6 |
| HTTP      | Axios with JWT interceptors                  |
| Maps      | Leaflet.js + OpenStreetMap (free)            |
| Backend   | Node.js, Express                             |
| Database  | MongoDB + Mongoose                           |
| Auth      | JWT (access + refresh tokens), bcryptjs      |
| Cache     | node-cache (cart sessions)                   |
| Security  | Helmet.js, CORS, express-rate-limit          |
| Validation| express-validator                            |

---

## Security Features

- bcrypt password hashing (salt rounds: 12)
- JWT access token (7d) + refresh token (30d)
- Auto-logout on 401 with token refresh attempt
- Rate limiting: 5 login attempts per 15 minutes
- Helmet.js security headers
- CORS restricted to frontend origin
- Input validation on all POST/PUT endpoints
- Role-based access control (user / admin)

---

## Design

- Primary colour: `#FF6B35` (orange)
- Secondary colour: `#2ECC71` (green)
- Font: Poppins (Google Fonts)
- Mobile-first responsive design
- Bottom 5-tab navigation on mobile
- Skeleton loaders for async content
- Toast notifications
- SVG empty states

---

## Notes

- **No real payments**: Razorpay/Stripe not integrated. Payment UI is a mock.
- **No email**: Forgot password token is logged to server console in dev mode.
- **Cart persistence**: Stored in node-cache (in-memory). Clears on server restart.
- **Images**: Using Unsplash URLs. In production, use Cloudinary or local storage.
