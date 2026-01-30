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

export type SortType = "newest" | "oldest";

export interface FilterPopupHandle {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
}

interface Props {
  selected: SortType;
  onSelect: (value: SortType) => void;
}

const FilterPopup = forwardRef<FilterPopupHandle, Props>(
  ({ selected, onSelect }, ref) => {
    const [visible, setVisible] = useState(false);
    const opacity = useRef(new Animated.Value(0)).current;

    const show = () => {
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };

    const hide = () => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    };

    useImperativeHandle(ref, () => ({
      show,
      hide,
      isVisible: visible,
    }));

    if (!visible) return null;

    const renderItem = (label: string, value: SortType) => (
      <TouchableOpacity
        style={[styles.item, selected === value && styles.itemActive]}
        onPress={() => {
          onSelect(value);
          hide();
        }}
      >
        <Text
          style={[styles.itemText, selected === value && styles.itemTextActive]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={hide}>
          <View style={styles.outside} />
        </TouchableWithoutFeedback>

        <Animated.View style={[styles.container, { opacity } as ViewStyle]}>
          <View style={styles.arrow} />
          <View style={styles.card}>
            <Text style={styles.title}>เรียงลำดับ</Text>
            {renderItem("ใหม่สุด", "newest")}
            {renderItem("เก่าสุด", "oldest")}
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
    top: 180,
    right: 16,
    width: 200,
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
    marginRight: 12,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 10,
    color: "#6C63FF",
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: "#EEF2FF",
  },
  itemText: {
    fontSize: 13,
    color: "#334155",
  },
  itemTextActive: {
    color: "#6C63FF",
    fontWeight: "bold",
  },
});
