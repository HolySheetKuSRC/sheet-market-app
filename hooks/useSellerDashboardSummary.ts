import { useCallback, useEffect, useState } from "react";
import { SellerDashboardSummary } from "../types/dashboard";
import { apiRequest } from "../utils/api";
import { getUserIdFromSessionToken } from "../utils/token";

export function useSellerDashboardSummary() {
  const [data, setData] = useState<SellerDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getUserIdFromSessionToken();
      if (!userId) return;

      const res = await apiRequest("/payments/seller/dashboard/summary", {
        headers: { "X-USER-ID": userId },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData({
            ...json.data,
            // ป้องกัน backend ส่ง null แทน []
            weeklySales: json.data.weeklySales ?? [],
            monthlySales: json.data.monthlySales ?? [],
          });
        } else {
          setError(json.message);
        }
      }
    } catch (err) {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}