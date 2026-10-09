import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#13222B", soft: "#4A5B66", faint: "#7C8B95" },
        paper: "#F4F6F5",
        brand: { DEFAULT: "#0D5C4F", dark: "#094339", light: "#E3F1EE" },
        line: "#DCE3E0",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
