import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '../utils/api';
import { Alert } from 'react-native';

export interface CartItem {
  id: string;
  sheetName: string;
  price: string;
  sellerName: string;
  sheetId: string; // Used to identify duplicates
}

interface CartContextType {
  cartItems: CartItem[];
  cartSheetIds: string[];
  cartCount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (sheetId: string) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Derived state for easy lookup and counting
  const cartSheetIds = cartItems.map((item) => item.sheetId);
  const cartCount = cartItems.length;

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/cart/user', { method: 'GET' });

      if (response.status === 429) {
        console.warn('Too many requests, retry later');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const items: CartItem[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          sheetId: String(item.sheetId || item.sheet?.id || ''), // Ensure we capture the original sheet's ID
          sheetName: item.sheetName ?? 'ไม่ระบุชื่อสินค้า',
          price: String(item.price ?? '0'),
          sellerName: item.sellerName ?? '-',
        }));
        setCartItems(items);
      } else {
        console.error('Fetch failed status:', response.status);
      }
    } catch (err) {
      console.error('Fetch cart error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = async (sheetId: string): Promise<boolean> => {
    if (cartSheetIds.includes(sheetId)) {
      Alert.alert('แจ้งเตือน', 'สินค้านี้อยู่ในตะกร้าแล้ว');
      return false;
    }

    try {
      const res = await apiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({ sheetId }),
      });
      if (res.ok) {
        // Optimistically reload cart
        await fetchCart();
        return true;
      } else if (res.status === 401) {
        // We throw so the component can handle auth redirect if needed, 
        // but typically 401 is handled globally or in the component. We can return false.
        return false;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (cartItemId: string): Promise<boolean> => {
    try {
      const response = await apiRequest('/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItemIds: [cartItemId] }),
      });

      if (response.ok) {
        setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  };

  useEffect(() => {
    // Initial fetch when provider mounts (and user is presumably authed)
    fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartSheetIds,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
