import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const EMPTY = { items: [], count: 0, itemsPrice: 0, mrpTotal: 0, shippingPrice: 0, totalPrice: 0 };

/**
 * Cart state, synced with the server.
 * - Guests use a `guestId` stored in localStorage (no login needed).
 * - After OTP login the server merges the guest cart into the account cart.
 */
export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data?.data || EMPTY);
    } catch {
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // When the login state flips, reload the (now merged) server cart.
  useEffect(() => {
    if (!loading) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const addItem = useCallback(
    async (payload, { silent = false } = {}) => {
      setBusyId(payload.productId);
      try {
        const { data } = await api.post('/cart/add', payload);
        setCart(data?.data || EMPTY);
        if (!silent) toast.success(data?.message || 'Added to bag');
        return true;
      } catch (err) {
        toast.error(errMsg(err));
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const updateQty = useCallback(
    async (itemId, qty) => {
      setBusyId(itemId);
      try {
        const { data } = await api.put('/cart/update', { itemId, qty });
        setCart(data?.data || EMPTY);
      } catch (err) {
        toast.error(errMsg(err));
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const removeItem = useCallback(
    async (itemId) => {
      setBusyId(itemId);
      try {
        const { data } = await api.post('/cart/remove', { itemId });
        setCart(data?.data || EMPTY);
        toast.info('Removed from bag');
      } catch (err) {
        toast.error(errMsg(err));
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const clear = useCallback(async () => {
    try {
      await api.post('/cart/clear');
      setCart(EMPTY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ cart, loading, busyId, addItem, updateQty, removeItem, clear, refresh, setCart }),
    [cart, loading, busyId, addItem, updateQty, removeItem, clear, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
};
