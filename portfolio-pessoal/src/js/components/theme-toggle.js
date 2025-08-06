// filepath: /portfolio-pessoal/portfolio-pessoal/src/js/components/theme-toggle.js

const themeToggleButton = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
};

themeToggleButton.addEventListener('click', toggleTheme);
applyTheme(currentTheme);