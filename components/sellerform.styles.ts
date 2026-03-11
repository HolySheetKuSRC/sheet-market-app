import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,

    height: 80,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },

  content: {
    padding: 24,
    alignItems: "center",
  },

  cardContainer: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
    marginTop: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#334155",
    marginBottom: 18,
  },

  inputFocused: {
    borderColor: "#6366F1",
    backgroundColor: "#FFF",
  },

  uploadBox: {
    height: 64,
    borderWidth: 1.5,
    borderColor: "#6366F1",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    marginBottom: 16,
  },

  submitButton: {
    marginTop: 30,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  dropdown: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },

  dropdownContainer: {
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
  },

  dropdownPlaceholder: {
    color: "#B7B7D2",
    fontSize: 14,
  },

  dropdownSelectedText: {
    color: "#333",
    fontSize: 14,
  },

  dropdownSearchInput: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
    borderColor: "#E0E0E0",
  },

  dropdownIcon: {
    width: 20,
    height: 20,
  },

  dropdownLeftIcon: {
    marginRight: 8,
  },
});
