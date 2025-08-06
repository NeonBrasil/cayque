// This file contains utility functions that can be used throughout the JavaScript code.

export function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString(undefined, options);
}

export function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

export function generateUniqueId() {
    return 'id-' + Math.random().toString(36).substr(2, 16);
}