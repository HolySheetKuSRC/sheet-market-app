import React from "react";
import { Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

type Props = {
  todaySales?: number;
  totalBalance?: number;
};

export function SalesPieChart({ todaySales = 0, totalBalance = 0 }: Props) {
  const remaining = Math.max(totalBalance - todaySales, 0);

  const pieData = [
    { value: todaySales > 0 ? todaySales : 1, color: "#7A82FF", text: "วันนี้" },
    { value: remaining > 0 ? remaining : 0, color: "#E8E9FF", text: "ก่อนหน้า" },
  ];

  return (
    <View style={{ alignItems: "center", width: "100%" }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          marginBottom: 16, // ขยับช่องว่างนิดหน่อยให้กราฟดูไม่อึดอัด
          color: "#333",
          alignSelf: "flex-start",
        }}
      >
        สัดส่วนยอดขายวันนี้
      </Text>
      
      <PieChart
        data={pieData}
        donut
        innerRadius={75} // <-- ขยายรูตรงกลางให้กว้างขึ้น (เดิม 55)
        radius={110}     // <-- ขยายขนาดวงกลมให้ใหญ่ขึ้น (เดิม 80)
        centerLabelComponent={() => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 14, color: "#888" }}>วันนี้</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#7A82FF" }}>
              ฿{todaySales.toLocaleString()}
            </Text>
          </View>
        )}
        isAnimated
        animationDuration={600}
      />
      
      <View style={{ flexDirection: "row", gap: 16, marginTop: 16 }}>
        {pieData.map((item) => (
          <View
            key={item.text}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6, // ทำให้เป็นวงกลม
                backgroundColor: item.color,
              }}
            />
            <Text style={{ fontSize: 13, color: "#666" }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}