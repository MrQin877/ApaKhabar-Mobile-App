import { StyleSheet } from "react-native";

const STRIPE = "rgba(63, 204, 84, 0.07)";

export const welcomeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Stripes
  stripe: {
    position: "absolute",
    backgroundColor: STRIPE,
    borderRadius: 16,
    transform: [{ rotate: "-35deg" }],
  },

  // Top
  topContent: {},
  logo: {
    marginBottom: 0,
  },
  title: {
    fontWeight: "800",
    color: "#1A2E27",
    lineHeight: 44,
  },
  subtitle: {
    marginTop: 10,
    lineHeight: 22,
    color: "#8AADA4",
  },

  // Buttons
  buttons: {},
  outlineBtn: {
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  outlineBtnText: {
    color: "#3FCC54",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  linkBtn: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 4,
  },
  linkText: {
    color: "#AABFBA",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
});
