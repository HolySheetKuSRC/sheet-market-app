import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from "react-native";

const { width, height } = Dimensions.get("window");

export type SortType =
  | "newest"
  | "oldest"
  | "price_high"
  | "price_low"
  | "highest_rating"
  | "lowest_rating"
  | "most_popular";

export interface FilterPopupHandle {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
}

interface Props {
  selected: SortType;
  onSelect: (value: SortType) => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export const SORT_OPTIONS: { label: string; value: SortType; icon: IoniconName }[] = [
  { label: "ใหม่ที่สุด",    value: "newest",        icon: "time-outline" },
  { label: "เก่าที่สุด",   value: "oldest",        icon: "hourglass-outline" },
  { label: "ราคา: สูง → ต่ำ", value: "price_high",  icon: "trending-down-outline" },
  { label: "ราคา: ต่ำ → สูง", value: "price_low",   icon: "trending-up-outline" },
  { label: "คะแนนสูงสุด",   value: "highest_rating", icon: "star" },
  { label: "คะแนนต่ำสุด",  value: "lowest_rating",  icon: "star-outline" },
  { label: "ยอดนิยม",       value: "most_popular",   icon: "flame-outline" },
];

const FilterPopup = forwardRef<FilterPopupHandle, Props>(
  ({ selected, onSelect }, ref) => {
    const [visible, setVisible] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-12)).current;

    const show = () => {
      setVisible(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    };

    const hide = () => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    };

    useImperativeHandle(ref, () => ({ show, hide, isVisible: visible }));

    if (!visible) return null;

    return (
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hide}>
          <View style={styles.outside} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.container,
            { opacity, transform: [{ translateY }] } as ViewStyle,
          ]}
        >
          <View style={styles.arrow} />
          <View style={styles.card}>
            <Text style={styles.title}>เรียงลำดับ</Text>
            {SORT_OPTIONS.map(({ label, value, icon }) => {
              const isActive = selected === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.item, isActive && styles.itemActive]}
                  onPress={() => { onSelect(value); hide(); }}
                >
                  <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                    <Ionicons name={icon} size={14} color={isActive ? "#6366F1" : "#94A3B8"} />
                  </View>
                  <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
                    {label}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark" size={14} color="#6366F1" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    );
  },
);

export default FilterPopup;

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width,
    height,
    zIndex: 9999,
  },
  outside: { flex: 1 },
  container: {
    position: "absolute",
    top: 116,
    right: 16,
    width: 240,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderLeftColor: "transparent",
    borderRightWidth: 8,
    borderRightColor: "transparent",
    borderBottomWidth: 8,
    borderBottomColor: "#FFF",
    alignSelf: "flex-end",
    marginRight: 14,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 12,
    shadowColor: "#6366F1",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    borderWidth: 1,
    borderColor: "#EEF2FF",
  },
  title: {
    fontFamily: "Mitr_600SemiBold",
    fontSize: 14,
    marginBottom: 6,
    color: "#3730A3",
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    gap: 10,
  },
  itemActive: {
    backgroundColor: "#EEF2FF",
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  iconWrapActive: {
    backgroundColor: "#E0E7FF",
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Mitr_400Regular",
    color: "#475569",
  },
  itemTextActive: {
    color: "#6366F1",
    fontFamily: "Mitr_500Medium",
  },
});
