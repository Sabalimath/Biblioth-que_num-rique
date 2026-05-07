/** @type {import('tailwindcss').Config} */
export default {
  // On dit à Tailwind de scanner tous ces fichiers
  // pour savoir quelles classes CSS garder
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // On ajoute nos propres couleurs à Tailwind
      // Comme ça on peut écrire bg-terre, text-mousse, etc.
      colors: {
        terre:  "#95714F",   // marron principal → sidebar, boutons
        mousse: "#8C916C",   // vert kaki → badges positifs
        sable:  "#C7AF94",   // beige moyen → bordures, hover
        amande: "#EADED0",   // beige clair → fond de l'app
        sauge:  "#ACB087",   // vert sauge → barres, tags
        danger: "#C0392B",   // rouge → erreurs, bloqué
      },
      // On ajoute notre police DM Sans
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
      },
    },
  },

  plugins: [],
}