import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FC", // Light background matching dashboard
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },

    // Section Header
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    dateFilterButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    dateFilterText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },

    // Chart Card
    chartCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    chartHeader: {
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#888",
        marginBottom: 4,
    },
    chartValue: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#6C63FF", // Purple that matches the design
    },

    // Mock Bar Chart
    barChartContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        height: 180, // Fixed height for area
        paddingTop: 20,
    },
    barColumn: {
        alignItems: "center",
        flex: 1,
    },
    barWrapper: {
        flex: 1,
        justifyContent: "flex-end",
        width: "100%",
        alignItems: "center",
    },
    bar: {
        width: "80%",
        backgroundColor: "#7A82FF",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#333",
        marginTop: 8,
    },

    // Bottom Row Layout
    bottomRow: {
        flexDirection: "row",
        gap: 16,
    },

    // Ranking Card (Left)
    rankingCard: {
        flex: 1.2,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rankingHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        gap: 8,
    },
    rankingItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    rankBadgeWrapper: {
        width: 32,
        height: 32,
        backgroundColor: "#E2E5FF", // Fallback color
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    rankBadgeText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    rankInfo: {
        flex: 1,
        justifyContent: "center",
    },
    rankTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 2,
    },
    rankSubtitle: {
        fontSize: 12,
        color: "#888",
    },
    rankValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },

    // Demographics Card (Right)
    demoCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    demoItem: {
        marginBottom: 16,
    },
    demoLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    demoFaculty: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333",
    },
    demoPercent: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#333",
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: "#F0F0F0",
        borderRadius: 4,
        width: "100%",
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },

    // Empty State
    emptyText: {
        textAlign: "center",
        color: "#999",
        marginTop: 20,
        fontSize: 14,
    }
});
