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

interface QuarterIdentity {
  nombre: string;
  ciudad: string;
  numero: string;
  logo: string | null;
}

interface UiSettingsContextType {
  theme: ThemeConfig;
  identity: QuarterIdentity;
  labels: MenuLabels;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  updateLabels: (newLabels: Partial<MenuLabels>) => Promise<void>;
  updateIdentity: (newIdentity: Partial<QuarterIdentity>) => Promise<void>;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  loading: boolean;
}

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>({
    primaryColor: '#DC2626',
    borderRadius: '12px',
    compactMode: false,
    fontScale: 1.0
  });
  const [identity, setIdentity] = useState<QuarterIdentity>({
    nombre: 'Bomberos Voluntarios de Chimpay',
    ciudad: 'Chimpay',
    numero: '',
    logo: null
  });
  const [labels, setLabels] = useState<MenuLabels>({});
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const config = await apiFetch('/api/ui-settings');
        
        if (config && typeof config === 'object' && !Array.isArray(config)) {
          if (config.theme) setTheme(config.theme);
          if (config.menu_labels) setLabels(config.menu_labels);
          
          setIdentity({
            nombre: config.cuartel_nombre || 'Bomberos Voluntarios de Chimpay',
            ciudad: config.cuartel_ciudad || 'Chimpay',
            numero: config.cuartel_numero || '',
            logo: config.cuartel_logo || null
          });
        }
      } catch (err) {
        console.error("Error loading UI settings", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();

    // Dark mode initial state
    const savedDark = localStorage.getItem('darkMode') === 'true';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = savedDark !== null ? savedDark : prefersDark;
    setDarkMode(initialDark);
  }, []);

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    localStorage.setItem('darkMode', val.toString());
    if (val) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
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
      body: JSON.stringify({ key: 'theme', value: JSON.stringify(updated) })
    });
  };

  const updateLabels = async (newLabels: Partial<MenuLabels>) => {
    const updated = { ...labels, ...newLabels };
    setLabels(updated);
    await apiFetch('/api/ui-settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'menu_labels', value: JSON.stringify(updated) })
    });
  };

  const updateIdentity = async (newIdentity: Partial<QuarterIdentity>) => {
    const updated = { ...identity, ...newIdentity };
    setIdentity(updated);
    
    // Save each key individually to the DB
    const promises = Object.entries(newIdentity).map(([key, value]) => {
      return apiFetch('/api/ui-settings', {
        method: 'POST',
        body: JSON.stringify({ key: `cuartel_${key}`, value })
      });
    });
    await Promise.all(promises);
  };

  return (
    <UiSettingsContext.Provider value={{ 
      theme, identity, labels, updateTheme, updateLabels, updateIdentity, 
      darkMode, setDarkMode, loading 
    }}>
      {children}
    </UiSettingsContext.Provider>
  );
}

export function useUiSettings() {
  const context = useContext(UiSettingsContext);
  if (!context) throw new Error("useUiSettings must be used within UiSettingsProvider");
  return context;
}
