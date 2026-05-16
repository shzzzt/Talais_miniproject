import React, { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_SETTINGS = {
  logoUrl: null,
  themeColor: "#1e3a5f",
};

const SchoolSettingsContext = createContext(null);

function hexToRgb(hex) {
  const normalized = String(hex || DEFAULT_SETTINGS.themeColor).replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgbToHsl({ r, g, b }) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function shade(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const next = [r, g, b].map((channel) => {
    const adjusted = percent < 0
      ? channel * (1 + percent)
      : channel + (255 - channel) * percent;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  });

  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

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
    const primary = settings.themeColor || DEFAULT_SETTINGS.themeColor;
    const hover = shade(primary, -0.18);
    const soft = shade(primary, 0.88);
    const primaryHsl = rgbToHsl(hexToRgb(primary));

    document.documentElement.style.setProperty("--theme-primary", primary);
    document.documentElement.style.setProperty("--theme-primary-hover", hover);
    document.documentElement.style.setProperty("--theme-primary-soft", soft);
    document.documentElement.style.setProperty("--primary", primaryHsl);
    document.documentElement.style.setProperty("--ring", primaryHsl);
    document.documentElement.style.setProperty("--chart-1", primaryHsl);
    document.documentElement.style.setProperty("--chart-2", rgbToHsl(hexToRgb(hover)));
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
