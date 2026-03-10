import React from "react";
import { Dimensions, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { WeeklySalesItem } from "../../types/dashboard";

type Props = { data?: WeeklySalesItem[] };

export function WeeklySalesBarChart({ data = [] }: Props) {
  // คำนวณความกว้างและช่องว่าง
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 80; // หักลบ Padding ขอบจอ
  const barWidth = 28; // ขนาดความกว้างของแท่ง

  // คำนวณช่องว่าง (Spacing) ให้แท่งกระจายเต็มพื้นที่การ์ด
  // หักพื้นที่แกน Y (ประมาณ 30px) เพื่อให้คำนวณได้เป๊ะขึ้น
  const availableWidthForBars = chartWidth - 30;
  const numberOfBars = data.length > 0 ? data.length : 7;
  const calculatedSpacing = Math.max(
    (availableWidthForBars - barWidth * numberOfBars) / numberOfBars,
    10 // ขั้นต่ำเว้น 10px
  );

  if (data.length === 0) {
    return (
      <View style={{ width: "100%" }}>
        <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#333" }}>
          ยอดขายรายสัปดาห์
        </Text>
        <Text style={{ color: "#aaa", textAlign: "center", paddingVertical: 24 }}>
          ยังไม่มีข้อมูล
        </Text>
      </View>
    );
  }

  const barData = data.map((item) => ({
    value: item.amount,
    label: item.day,
    frontColor: "#7A82FF",
    topLabelComponent: () => (
      <Text style={{ fontSize: 9, color: "#555", marginBottom: 2 }}>
        {item.amount > 0 ? `฿${item.amount}` : ""}
      </Text>
    ),
  }));

  return (
    <View style={{ width: "100%", overflow: "hidden" }}>
      <Text style={{ fontSize: 14, fontWeight: "600", marginBottom: 12, color: "#333" }}>
        ยอดขายรายสัปดาห์
      </Text>
      
      <View style={{ marginLeft: -4 }}>
        <BarChart
          data={barData}
          width={chartWidth}
          barWidth={barWidth}
          spacing={calculatedSpacing} // <-- ใช้ Spacing ที่คำนวณได้เพื่อให้เต็มจอ
          roundedTop
          xAxisThickness={1}
          yAxisThickness={0}
          yAxisTextStyle={{ color: "#aaa", fontSize: 10 }}
          xAxisLabelTextStyle={{ color: "#888", fontSize: 11 }}
          noOfSections={4}
          maxValue={Math.max(...data.map((d) => d.amount), 100)}
          isAnimated
          animationDuration={600}
        />
      </View>
    </View>
  );
}