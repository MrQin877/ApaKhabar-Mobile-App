// Auth-related constants and data
export const AUTH_STRINGS = {
  welcomeTitle: "Selamat Datang ke ApaKhabar",
  welcomeSubtitle: "Dapatkan berita terkini komuniti anda",
  loginTitle: "Log Masuk",
  registerTitle: "Daftar Akaun",
  emailPlaceholder: "Alamat emel",
  passwordPlaceholder: "Kata laluan",
  confirmPasswordPlaceholder: "Sahkan kata laluan",
  loginButton: "Log Masuk",
  registerButton: "Daftar",
  forgotPassword: "Lupa kata laluan?",
  noAccount: "Tiada akaun?",
  haveAccount: "Sudah ada akaun?",
  signUp: "Daftar sekarang",
  signIn: "Log masuk",
};

export const VALIDATION_RULES = {
  email: {
    required: "Emel diperlukan",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Emel tidak sah",
  },
  password: {
    required: "Kata laluan diperlukan",
    minLength: 6,
    message: "Kata laluan mesti sekurang-kurangnya 6 aksara",
  },
};
