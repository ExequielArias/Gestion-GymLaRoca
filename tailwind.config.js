/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // <<--- ACTIVADO
    content: [
        "./src/**/*.{html,ts}",             // Escanea clases en Angular
        "./projects/shared/**/*.{html,ts}", // Escanea en librería compartida
    ],
    theme: {
        extend: {},
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
    ],
};
