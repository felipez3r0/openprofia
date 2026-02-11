import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@/providers/connection-provider';
import type { ISettingsMap } from '@/types';

interface SettingsState {
  settings: Required<ISettingsMap> | null;
  models: string[];
  isLoading: boolean;
  isLoadingModels: boolean;
  isSaving: boolean;
  error: string | null;
  modelsError: string | null;
  saveSuccess: boolean;
}

export function useSettings() {
  const { settingsApi } = useApi();
  const [state, setState] = useState<SettingsState>({
    settings: null,
    models: [],
    isLoading: true,
    isLoadingModels: false,
    isSaving: false,
    error: null,
    modelsError: null,
    saveSuccess: false,
  });

  const fetchSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await settingsApi.getSettings();
      setState((prev) => ({ ...prev, settings: data, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          err instanceof Error ? err.message : 'Erro ao carregar configurações',
      }));
    }
  }, [settingsApi]);

  const fetchModels = useCallback(
    async (url?: string) => {
      setState((prev) => ({
        ...prev,
        isLoadingModels: true,
        modelsError: null,
      }));
      try {
        const models = await settingsApi.listOllamaModels(url);
        setState((prev) => ({ ...prev, models, isLoadingModels: false }));
        return models;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          models: [],
          isLoadingModels: false,
          modelsError:
            err instanceof Error ? err.message : 'Erro ao listar modelos',
        }));
        return [];
      }
    },
    [settingsApi],
  );

  const saveSettings = useCallback(
    async (data: Partial<ISettingsMap>) => {
      setState((prev) => ({
        ...prev,
        isSaving: true,
        error: null,
        saveSuccess: false,
      }));
      try {
        const updated = await settingsApi.updateSettings(data);
        setState((prev) => ({
          ...prev,
          settings: updated,
          isSaving: false,
          saveSuccess: true,
        }));
        // Limpa o indicador de sucesso após 3s
        setTimeout(() => {
          setState((prev) => ({ ...prev, saveSuccess: false }));
        }, 3000);
        return true;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error:
            err instanceof Error ? err.message : 'Erro ao salvar configurações',
        }));
        return false;
      }
    },
    [settingsApi],
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    ...state,
    fetchSettings,
    fetchModels,
    saveSettings,
  };
}
