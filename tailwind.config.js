/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      // Tokens complémentaires (UI-1, MASTER-12 §140-141) : nomment
      // sémantiquement des valeurs déjà utilisées dans le code plutôt que
      // d'introduire de nouvelles valeurs brutes. N'étend pas l'échelle
      // spacing/radius par défaut de Tailwind, qui couvre déjà la majorité
      // des usages observés (py-10/12/14/16, rounded-xl/2xl).
      borderRadius: {
        // Alias stable pour les composants "carte" (Card, AdminCard) :
        // même valeur que `rounded-2xl`, mais un seul nom à faire évoluer
        // si le rayon de marque change un jour.
        card: "1rem",
      },
      boxShadow: {
        // Centralise les deux ombres jusqu'ici codées en valeur arbitraire
        // (`shadow-[0_10px_30px_-26px_rgba(10,10,10,0.25)]` et
        // `shadow-[0_20px_60px_-32px_rgba(10,10,10,0.35)]`), conformément à
        // MASTER-12 §20 (ombres discrètes, séparation légère / profondeur
        // ponctuelle).
        card: "0 10px 30px -26px rgba(10, 10, 10, 0.25)",
        elevated: "0 20px 60px -32px rgba(10, 10, 10, 0.35)",
      },
      spacing: {
        // Rythme vertical de section publique déjà observé (py-20) mais
        // jamais nommé : disponible pour les futures sections Home/Services
        // sans introduire de nouvelle valeur brute.
        section: "5rem",
      },
      keyframes: {
        // UI-9.1 : indicateur de scroll des Hero — mouvement vertical très
        // léger et lent (6px, 2.2s), volontairement plus discret que
        // `animate-bounce` (défaut Tailwind, jugé trop marqué/rapide pour un
        // indicateur permanent). `prefers-reduced-motion` est déjà neutralisé
        // globalement (voir app/globals.css) : aucun code spécifique requis
        // ici pour respecter cette préférence.
        "hero-scroll-hint": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(6px)" },
        },
      },
      animation: {
        "hero-scroll-hint": "hero-scroll-hint 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
