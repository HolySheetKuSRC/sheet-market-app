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
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E3E4FF",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
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
});
