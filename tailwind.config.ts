import type { Config } from "tailwindcss";

// Paleta oscura (Material 3) con ámbar como acción principal y menta como
// "libre/positivo". Los NOMBRES de token se conservan del tema claro anterior
// para que ninguna pantalla existente tenga que cambiar de clases; solo
// cambian los valores.
//
// Ojo con la escala de superficies: en el tema claro, `surface-container-lowest`
// era el blanco de las tarjetas (lo más "elevado"). En oscuro las tarjetas
// también deben verse MÁS CLARAS que el fondo, así que `lowest` ya no es lo
// más oscuro: el fondo más profundo (barra superior/inferior) es `deep`.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // --- Primario: ámbar ---
        primary: "#ffc174",
        "on-primary": "#472a00",
        "primary-container": "#f59e0b",
        "on-primary-container": "#613b00",
        "primary-fixed": "#ffddb8",
        "primary-fixed-dim": "#ffb95f",
        "on-primary-fixed": "#2a1700",
        "on-primary-fixed-variant": "#653e00",
        "inverse-primary": "#855300",
        "surface-tint": "#ffb95f",

        // --- Secundario: menta (mesa libre, estados positivos) ---
        secondary: "#4edea3",
        "on-secondary": "#003824",
        "secondary-container": "#00a572",
        "on-secondary-container": "#00311f",
        "secondary-fixed": "#6ffbbe",
        "secondary-fixed-dim": "#4edea3",
        "on-secondary-fixed": "#002113",
        "on-secondary-fixed-variant": "#005236",

        // --- Terciario: en esta app es el color de "acción" de caja y
        // administración (botones, foco). Mismo verde menta que secundario. ---
        tertiary: "#4edea3",
        "on-tertiary": "#003824",
        "tertiary-container": "#00a572",
        "on-tertiary-container": "#00311f",
        "tertiary-fixed": "#6ffbbe",
        "tertiary-fixed-dim": "#4edea3",
        "on-tertiary-fixed": "#002113",
        "on-tertiary-fixed-variant": "#005236",

        // --- Alerta (coral): cuenta pedida ---
        alert: "#ffbcb7",
        "on-alert": "#68000a",
        "alert-container": "#ff938c",
        "on-alert-container": "#8d0012",

        // --- Error ---
        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",

        // --- Estados de negocio ---
        success: "#4edea3",
        "success-container": "#00311f",
        warning: "#ffb95f",
        "warning-container": "#3d2a00",

        // --- Superficies (de más profunda a más elevada) ---
        deep: "#0b0e12",
        background: "#111418",
        surface: "#111418",
        "surface-dim": "#111418",
        "surface-container-lowest": "#191c20",
        "surface-container-low": "#1d2024",
        "surface-container": "#22262b",
        "surface-container-high": "#272a2f",
        "surface-container-highest": "#323539",
        "surface-variant": "#323539",
        "surface-bright": "#36393e",

        // --- Texto y bordes ---
        "on-surface": "#e1e2e8",
        "on-background": "#e1e2e8",
        "on-surface-variant": "#d8c3ad",
        outline: "#a08e7a",
        "outline-variant": "#534434",
        "inverse-surface": "#e1e2e8",
        "inverse-on-surface": "#2e3135",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
      spacing: {
        gutter: "16px",
        "touch-target-min": "44px",
        "margin-mobile": "16px",
        "stack-md": "16px",
        "stack-lg": "24px",
        "margin-tablet": "24px",
        "stack-sm": "8px",
        // Escala del diseño nuevo (pantallas de mesero).
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "0.75rem",
        "space-lg": "1rem",
        "space-xl": "1.5rem",
        margin: "1rem",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      fontSize: {
        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "display-table-num": [
          "32px",
          { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "700" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "numeric-pin": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "headline-lg-mobile": ["22px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "26px", fontWeight: "400" }],
        // Escala del diseño nuevo (pantallas de mesero).
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
        "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-lg": ["15px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.01em", fontWeight: "400" }],
        "mono-metric": ["18px", { lineHeight: "22px", letterSpacing: "-0.01em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
} satisfies Config;
