export type WeeklySalesItem = {
  day: string;
  amount: number;
};

export type MonthlySalesItem = {
  month: string;
  amount: number;
};

export type SellerDashboardSummary = {
  todaySales: number;
  totalBalance: number;
  totalOrders: number;
  newReviewsCount: number;
  weeklySales: WeeklySalesItem[];
  monthlySales: MonthlySalesItem[];
  topSheetTitle: string | null;
  topSheetRevenue: number | null;
};