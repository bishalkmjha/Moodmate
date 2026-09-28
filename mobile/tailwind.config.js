/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Matches the web app's calm, sunrise-toned dark shell (5AM Club tone)
        base: "#020617",
        surface: "#0f172a",
        border: "#1e293b",
        accent: "#f59e0b",
        "accent-dark": "#020617",
      },
    },
  },
  plugins: [],
};
