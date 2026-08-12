/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          "colors": {
              "surface": "#f6f9ff",
              "outline": "#727784",
              "surface-container-high": "#e2e9f1",
              "surface-container-lowest": "#ffffff",
              "inverse-on-surface": "#ebf1fa",
              "on-tertiary": "#ffffff",
              "on-secondary": "#ffffff",
              "secondary-container": "#80f98b",
              "on-primary-fixed": "#001a40",
              "on-primary-container": "#bbd0ff",
              "outline-variant": "#c2c6d4",
              "on-primary": "#ffffff",
              "secondary": "#006e25",
              "on-surface": "#151c22",
              "on-surface-variant": "#424752",
              "primary-container": "#0056b3",
              "inverse-primary": "#acc7ff",
              "surface-tint": "#115cb9",
              "on-tertiary-fixed-variant": "#92001f",
              "on-tertiary-container": "#ffc0bf",
              "on-error": "#ffffff",
              "primary-fixed": "#d7e2ff",
              "error": "#ba1a1a",
              "surface-bright": "#f6f9ff",
              "tertiary-fixed-dim": "#ffb3b2",
              "surface-container": "#e8eef7",
              "on-primary-fixed-variant": "#004491",
              "on-secondary-fixed": "#002106",
              "secondary-fixed-dim": "#66df75",
              "on-background": "#151c22",
              "primary-fixed-dim": "#acc7ff",
              "on-secondary-container": "#007327",
              "tertiary-fixed": "#ffdad9",
              "on-tertiary-fixed": "#410008",
              "secondary-fixed": "#83fc8e",
              "surface-variant": "#dce3ec",
              "primary": "#003f87",
              "inverse-surface": "#2a3138",
              "on-error-container": "#93000a",
              "background": "#f6f9ff",
              "tertiary-container": "#b10f2b",
              "on-secondary-fixed-variant": "#00531a",
              "surface-dim": "#d4dbe3",
              "surface-container-highest": "#dce3ec",
              "tertiary": "#88001c",
              "error-container": "#ffdad6",
              "surface-container-low": "#eef4fd"
          },
          "borderRadius": {
              "DEFAULT": "0.125rem",
              "lg": "0.25rem",
              "xl": "0.5rem",
              "full": "0.75rem"
          },
          "spacing": {
              "stack-lg": "2rem",
              "stack-md": "1rem",
              "margin-tablet": "2rem",
              "stack-sm": "0.5rem",
              "margin-mobile": "1rem",
              "gutter": "1rem"
          },
          "fontFamily": {
              "body-lg": ["Inter", "sans-serif"],
              "headline-lg": ["Inter", "sans-serif"],
              "data-display": ["Inter", "sans-serif"],
              "headline-md": ["Inter", "sans-serif"],
              "headline-lg-mobile": ["Inter", "sans-serif"],
              "body-md": ["Inter", "sans-serif"],
              "label-sm": ["Inter", "sans-serif"]
          },
          "fontSize": {
              "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
              "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
              "data-display": ["40px", { "lineHeight": "48px", "letterSpacing": "-0.03em", "fontWeight": "700" }],
              "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
              "headline-lg-mobile": ["26px", { "lineHeight": "32px", "fontWeight": "700" }],
              "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
              "label-sm": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }]
          },
          "keyframes": {
              "fade-in-up": {
                  "0%": { opacity: "0", transform: "translateY(10px)" },
                  "100%": { opacity: "1", transform: "translateY(0)" }
              },
              "fade-in": {
                  "0%": { opacity: "0" },
                  "100%": { opacity: "1" }
              }
          },
          "animation": {
              "fade-in-up": "fade-in-up 0.4s ease-out forwards",
              "fade-in": "fade-in 0.3s ease-out forwards"
          }
      }
  },
  plugins: [],
}
