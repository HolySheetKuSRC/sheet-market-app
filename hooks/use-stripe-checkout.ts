import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { apiRequest } from '../utils/api';

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);

  const startCheckout = async (orderId: string) => {
    if (loading) return;

    try {
      setLoading(true);

      const response = await apiRequest(
        `/payments/create-checkout-session/${orderId}`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'สร้าง Checkout ไม่สำเร็จ');
      }

      // เปิดหน้า Stripe
      await WebBrowser.openBrowserAsync(data.checkout_url);

    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { startCheckout, loading };
};