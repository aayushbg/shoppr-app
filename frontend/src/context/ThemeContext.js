import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check local storage first
    const storedTheme = localStorage.getItem('theme');
    // Check system preference if no theme stored
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return storedTheme || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = theme;

    // Remove the other theme class
    root.classList.remove(currentTheme === 'dark' ? 'light' : 'dark');
    // Add the current theme class
    root.classList.add(currentTheme);

    // Save theme preference to local storage
    localStorage.setItem('theme', currentTheme);

  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 