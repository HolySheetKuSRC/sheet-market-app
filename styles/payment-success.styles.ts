import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTablet: {
    maxWidth: 700,
    padding: 60,
  },
  icon: {
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
  },
  titleTablet: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitleTablet: {
    fontSize: 18,
  },
  orderBadge: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginTop: 20,
  },
  orderText: {
    fontSize: 13,
    color: "#475569",
  },
  orderBold: {
    fontWeight: "bold",
    color: "#0F172A",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 35,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: "#2563EB",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 16,
  },
  linkButton: {
    alignItems: "center",
  },
  linkText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 5,
  },
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});