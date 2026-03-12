import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FC",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#333",
    },
    dateFilterButton: {
        backgroundColor: "#fff",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dateFilterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
    },
    chartCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    chartHeader: {
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#888",
    },
    chartValue: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#6C63FF",
    },
    barChartContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch", // ทำให้ barColumn ยืดเต็มความสูง container
        height: 200,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barWrapper: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 8,
    },
    barValueLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#6C63FF",
        marginBottom: 4,
    },
    bar: {
        width: 18,
        backgroundColor: '#6C63FF',
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        color: "#666",
        textAlign: 'center',
    },
    bottomRow: {
        flexDirection: "row",
        gap: 12,
    },
    rankingCard: {
        flex: 1.2,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
    },
    rankingHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    rankingItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    rankBadgeWrapper: {
        width: 28,
        height: 28,
        backgroundColor: "#F0F2FF",
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    rankBadgeText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    rankInfo: {
        flex: 1,
    },
    rankTitle: {
        fontSize: 13,
        fontWeight: "bold",
    },
    rankSubtitle: {
        fontSize: 11,
        color: "#888",
    },
    demoCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
    },
    demoItem: {
        marginBottom: 12,
    },
    demoLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
    },
    demoFaculty: {
        fontSize: 11,
        fontWeight: "bold",
        flex: 1,
    },
    demoPercent: {
        fontSize: 11,
        fontWeight: "bold",
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: "#F0F0F0",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
    },
    emptyText: {
        fontSize: 12,
        color: "#ccc",
        textAlign: 'center',
        marginTop: 10,
    }
});