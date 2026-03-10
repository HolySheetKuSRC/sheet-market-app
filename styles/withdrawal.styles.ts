import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },

  // ===== Balance Card =====
  balanceCard: {
    backgroundColor: "#353744",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  balanceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#A0E8AF",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 18,
  },
  withdrawBtn: {
    backgroundColor: "#4CD964",
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 24,
  },
  withdrawBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // ===== History Section =====
  historyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 16,
  },

  // ===== History Item =====
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  historyItemCompleted: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  historyItemPending: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFD54F",
  },
  historyItemRejected: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#EF9A9A",
  },
  historyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  historyIconCompleted: {
    backgroundColor: "#4CAF50",
  },
  historyIconPending: {
    backgroundColor: "#F5A623",
  },
  historyIconRejected: {
    backgroundColor: "#FF3B30",
  },
  historyTextContainer: {
    flex: 1,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  historyStatus: {
    fontSize: 13,
    color: "#555",
  },
  historyAmount: {
    fontSize: 20,
    fontWeight: "bold",
  },
  historyAmountCompleted: {
    color: "#2E7D32",
  },
  historyAmountPending: {
    color: "#E65100",
  },
  historyAmountRejected: {
    color: "#C62828",
  },

  // ===== Loading / Empty =====
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
    paddingTop: 30,
  },
  errorText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 14,
    paddingTop: 10,
  },

  // ===== Withdrawal Modal =====
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 18,
    position: "relative",
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CD964",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 4,
  },
  modalBalanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F4F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  modalBalanceLabel: {
    fontSize: 14,
    color: "#666",
  },
  modalBalanceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#222",
    backgroundColor: "#FAFAFA",
    marginBottom: 8,
  },
  modalErrorText: {
    color: "#FF3B30",
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 4,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#4CD964",
    alignItems: "center",
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
});
