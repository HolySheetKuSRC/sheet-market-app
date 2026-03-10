import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { MonthlySalesItem } from "../../types/dashboard";

type Props = { data?: MonthlySalesItem[] };

export function MonthlyRevenueLineChart({ data = [] }: Props) {
  // คำนวณความกว้าง: ความกว้างจอ - ขอบหน้าจอและการ์ด (ประมาณ 80px)
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 80;

  if (data.length === 0) {
    return (
      <View style={{ width: "100%" }}>
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#333" }}>
          รายได้รายเดือน
        </Text>
        <Text style={{ color: "#aaa", textAlign: "center", paddingVertical: 24 }}>
          ยังไม่มีข้อมูล
        </Text>
      </View>
    );
  }

  const lineData = data.map((item) => ({
    value: item.amount,
    label: item.month,
    dataPointText: `฿${item.amount}`,
  }));

  return (
    <View style={{ width: "100%", overflow: "hidden" }}>
      <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#333" }}>
        รายได้รายเดือน
      </Text>
      
      {/* ใส่ marginLeft นิดหน่อยเพื่อชดเชยพื้นที่ของแกน Y ให้กราฟดูกึ่งกลาง */}
      <View style={{ marginLeft: -4 }}>
        <LineChart
          data={lineData}
          width={chartWidth}
          adjustToWidth // <-- ทำให้จุดกระจายตัวเต็มพื้นที่ width อัตโนมัติ
          areaChart
          curved
          color="#7A82FF"
          startFillColor="#7A82FF"
          endFillColor="rgba(122,130,255,0.05)"
          startOpacity={0.3}
          endOpacity={0.05}
          thickness={2.5}
          dataPointsColor="#7A82FF"
          dataPointsRadius={5}
          xAxisLabelTextStyle={{ color: "#888", fontSize: 10 }}
          yAxisTextStyle={{ color: "#aaa", fontSize: 10 }}
          yAxisThickness={0}
          xAxisThickness={1}
          noOfSections={4}
          isAnimated
          animationDuration={800}
          textShiftY={-8}
          textFontSize={9}
          textColor="#7A82FF"
        />
      </View>
    </View>
  );
}