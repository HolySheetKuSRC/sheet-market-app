import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBFAFF",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  content: {
    padding: 24,
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
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E3E4FF",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#000",
    marginBottom: 18,
  },

  uploadBox: {
    height: 50,
    borderWidth: 1,
    borderColor: "#DADAF7",
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FF",
    marginBottom: 16,
  },

  submitButton: {
    marginTop: 30,
    backgroundColor: "#6C63FF",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },

  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
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
