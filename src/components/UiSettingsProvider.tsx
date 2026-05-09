import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface ThemeConfig {
  primaryColor: string;
  borderRadius: string;
  compactMode: boolean;
  fontScale: number;
}

interface MenuLabels {
  [key: string]: string;
}

interface UiSettingsContextType {
  theme: ThemeConfig;
  labels: MenuLabels;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  updateLabels: (newLabels: Partial<MenuLabels>) => Promise<void>;
  loading: boolean;
}

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#ef4444',
    borderRadius: '32px',
    compactMode: false,
    fontScale: 1.0
  });
  const [labels, setLabels] = useState<MenuLabels>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const config = await apiFetch('/api/ui-settings');
        if (config.theme) setTheme(config.theme);
        if (config.menu_labels) setLabels(config.menu_labels);
      } catch (err) {
        console.error("Error loading UI settings", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply CSS variables to root
    const root = document.documentElement;
    root.style.setProperty('--primary-fire', theme.primaryColor);
    root.style.setProperty('--app-radius', theme.borderRadius);
    root.style.setProperty('--font-scale', theme.fontScale.toString());
  }, [theme]);

  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    const updated = { ...theme, ...newTheme };
    setTheme(updated);
    await apiFetch('/api/ui-settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'theme', value: updated })
    });
  };

  const updateLabels = async (newLabels: Partial<MenuLabels>) => {
    const updated = { ...labels, ...newLabels };
    setLabels(updated);
    await apiFetch('/api/ui-settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'menu_labels', value: updated })
    });
  };

  return (
    <UiSettingsContext.Provider value={{ theme, labels, updateTheme, updateLabels, loading }}>
      {children}
    </UiSettingsContext.Provider>
  );
}

export function useUiSettings() {
  const context = useContext(UiSettingsContext);
  if (!context) throw new Error("useUiSettings must be used within UiSettingsProvider");
  return context;
}
