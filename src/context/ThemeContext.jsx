import React, { createContext, useContext, useState, useEffect } from 'react';

if (typeof window !== 'undefined' && !window.__ThemeContext) {
  window.__ThemeContext = createContext();
}
const ThemeContext = typeof window !== 'undefined' ? window.__ThemeContext : createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Apply theme to document element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const defaultTheme = {
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return defaultTheme;
  }
  return context;
};
