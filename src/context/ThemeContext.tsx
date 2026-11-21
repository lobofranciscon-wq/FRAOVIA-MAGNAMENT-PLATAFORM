import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  customAppIcon: string | null;
  setCustomAppIcon: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  setTheme: () => {},
  customAppIcon: null,
  setCustomAppIcon: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('fraovia_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [customAppIcon, setCustomAppIconState] = useState<string | null>(() => {
    return localStorage.getItem('fraovia_custom_app_icon') || null;
  });

  useEffect(() => {
    localStorage.setItem('fraovia_theme', theme);
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light-theme', 'light');
      body.classList.remove('dark-theme', 'dark');
      root.style.colorScheme = 'light';
      body.style.backgroundColor = '#F8FAFC';
      body.style.color = '#0F172A';
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark-theme', 'dark');
      body.classList.remove('light-theme', 'light');
      root.style.colorScheme = 'dark';
      body.style.backgroundColor = '#070D1E';
      body.style.color = '#F1F5F9';
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const setCustomAppIcon = (url: string | null) => {
    setCustomAppIconState(url);
    if (url) {
      localStorage.setItem('fraovia_custom_app_icon', url);
    } else {
      localStorage.removeItem('fraovia_custom_app_icon');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, customAppIcon, setCustomAppIcon }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
