import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#f8fafc",
        brand: {
          DEFAULT: "#0f766e",
          dark: "#115e59",
          light: "#ccfbf1",
        },
        accent: {
          DEFAULT: "#2563eb",
          soft: "#dbeafe",
        },
      },
      boxShadow: {
        glow: "0 30px 80px rgba(15, 23, 42, 0.16)",
        card: "0 18px 60px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(37,99,235,0.18), transparent 30%), radial-gradient(circle at right, rgba(15,118,110,0.18), transparent 32%)",
      },
    },
  },
  plugins: [],
};

export default config;
