import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FC",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 10,
  },

  // ===== Header =====
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
    textAlign: "center",
  },

  // ===== Status Filter Tabs =====
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  filterTabActive: {
    backgroundColor: "#6C63FF",
    borderColor: "#6C63FF",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  filterTabTextActive: {
    color: "#FFFFFF",
  },

  // ===== Sheet Grid =====
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 4,
  },

  // ===== Sheet Card =====
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2FF",
    elevation: 3,
    shadowColor: "#6C63FF",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImageWrapper: {
    position: "relative",
    backgroundColor: "#E8E4F8",
  },
  cardImage: {
    width: "100%",
    height: 130,
    backgroundColor: "#E8E4F8",
  },

  // Rating badge (top-left)
  ratingBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 3,
    color: "#1E293B",
  },

  // Edit button (top-right)
  editButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },

  // Popular badge
  popularBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#22C55E",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
  },
  popularText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },

  // Card content
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
    lineHeight: 18,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 11,
    color: "#64748B",
    lineHeight: 15,
    marginBottom: 6,
  },

  // Tags
  tagWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 8,
  },
  tagPill: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "700",
  },

  // Price row with status
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: "900",
    color: "#4F46E5",
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusApproved: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF9C3",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusTextApproved: {
    color: "#16A34A",
  },
  statusTextPending: {
    color: "#CA8A04",
  },
  statusTextRejected: {
    color: "#DC2626",
  },

  // ===== Loading / Empty / Error =====
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "600",
  },
  emptySubText: {
    textAlign: "center",
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 6,
  },
  errorText: {
    textAlign: "center",
    color: "#FF3B30",
    fontSize: 14,
    paddingTop: 10,
  },

  // ===== Stats summary =====
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEF2FF",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#6C63FF",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
  },

  // ===== Delete Confirmation Modal =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F1F5F9",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
