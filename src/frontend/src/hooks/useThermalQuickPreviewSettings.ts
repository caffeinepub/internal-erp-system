import { useState, useEffect, useCallback } from 'react';
import {
  ThermalQuickPreviewSettings,
  DEFAULT_THERMAL_SETTINGS,
} from '../utils/thermalQuickPreview';

const STORAGE_KEY = 'thermal-quick-preview-settings';
const STORAGE_VERSION = 1;

interface StoredSettings {
  version: number;
  settings: ThermalQuickPreviewSettings;
}

export function useThermalQuickPreviewSettings() {
  const [settings, setSettings] = useState<ThermalQuickPreviewSettings>(DEFAULT_THERMAL_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StoredSettings = JSON.parse(stored);
        if (parsed.version === STORAGE_VERSION && parsed.settings) {
          setSettings(parsed.settings);
        }
      }
    } catch (err) {
      console.warn('Failed to load thermal preview settings:', err);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      const toStore: StoredSettings = {
        version: STORAGE_VERSION,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.warn('Failed to save thermal preview settings:', err);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<ThermalQuickPreviewSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_THERMAL_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetToDefaults,
  };
}
