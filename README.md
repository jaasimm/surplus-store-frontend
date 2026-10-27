# Surplus Store — Frontend

Modern, responsive e-commerce web application built with **React**, **Vite**, and **Tailwind CSS**.

## Features
- **Modern UI/UX**: White and royal blue design system with Google Fonts Inter.
- **Product Discovery**: Multi-filter shopping by category, gender, size, colour, price range, and search.
- **Cart & Wishlist**: Anonymous guest carts that persist across reloads + authenticated user carts.
- **Authentication**: Phone OTP login flow with admin dashboard access for administrator accounts.
- **Admin Panel**: Manage products, categories, coupons, orders, customers, and view sales metrics.
- **Order Tracking & Account**: Manage profile, view live order statuses, and saved addresses.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The app runs at `http://localhost:5173` and proxies `/api` and `/uploads` requests to the backend server at `http://localhost:5000`.

### 3. Production Build
```bash
npm run build
```
Build output is generated in the `dist/` directory.
