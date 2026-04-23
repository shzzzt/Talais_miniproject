import React, { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_SETTINGS = {
  logoUrl: null,
  themeColor: "#1e3a5f",
};

const SchoolSettingsContext = createContext(null);

export function SchoolSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("talais_school_settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem("talais_school_settings", JSON.stringify(settings));
    // Apply theme color as CSS variable
    document.documentElement.style.setProperty("--theme-primary", settings.themeColor);
  }, [settings]);

  const updateSettings = (patch) => setSettings(prev => ({ ...prev, ...patch }));

  return (
    <SchoolSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SchoolSettingsContext.Provider>
  );
}

export function useSchoolSettings() {
  return useContext(SchoolSettingsContext);
}