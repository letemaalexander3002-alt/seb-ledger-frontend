/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // The Sovereign Ecosystem Blueprint — design token system
        seb: {
          obsidian: "#0B0D0E", // base canvas
          ledger: "#12161A", // panel / surface
          ledgerlight: "#171C21", // hovered surface
          gold: "#C9A24B", // Imperial Gold — primary accent
          golddim: "#8A7233", // muted gold — hairlines, borders
          goldfaint: "rgba(201, 162, 75, 0.14)",
          platinum: "#C7CDD1", // primary body text on dark
          mist: "#6B7378", // tertiary text / captions
          emerald: "#3FA973", // inflow / positive
          rust: "#C1542E", // outflow / alert
        },
      },
      fontFamily: {
        display: ["Spectral", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        ledger: "0.14em",
      },
      boxShadow: {
        none: "none",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
      },
    },
  },
  plugins: [],
};
