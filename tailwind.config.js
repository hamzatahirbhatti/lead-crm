/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14161F",
        muted: "#5A6072",
        line: "#E4E7EC",
        surface: "#F7F8FA",
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          soft: "#EEF0FE",
        },
        // Pipeline stage colors — used consistently everywhere a status appears
        stage: {
          new: "#3B82F6",
          contacted: "#F59E0B",
          qualified: "#8B5CF6",
          won: "#10B981",
          lost: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,31,0.04), 0 1px 3px rgba(20,22,31,0.06)",
        pop: "0 8px 30px rgba(20,22,31,0.12)",
      },
    },
  },
  plugins: [],
};
