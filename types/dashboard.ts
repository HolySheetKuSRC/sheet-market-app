export type WeeklySalesItem = {
  day: string;
  amount: number;
};

export type MonthlySalesItem = {
  month: string;
  amount: number;
};

// เพิ่ม Type สำหรับ Performance ของแต่ละชีท
export type SheetPerformance = {
  sheetName: string;
  totalRevenue: number;
  salesCount: number;
};

export type SellerDashboardSummary = {
  todaySales: number;
  totalBalance: number;
  totalOrders: number;
  weeklySales: WeeklySalesItem[];
  monthlySales: MonthlySalesItem[];
  topSheetTitle: string | null;
  topSheetRevenue: number | null;
  sheetPerformances: SheetPerformance[]; // จำเป็นสำหรับ UI Section ผลงานชีทสรุป
  
  // Optional (เผื่ออนาคตอยากดึงมาโชว์)
  totalSalesVolume?: number;
  totalRevenue?: number;
  withdrawableAmount?: number;
};