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
  console.log('[useSettings] Hook initialized');
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
    console.log('[Settings] Fetching settings...');
    console.log('[Settings] settingsApi:', typeof settingsApi, settingsApi);
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('[Settings] Calling settingsApi.getSettings()...');
      const data = await settingsApi.getSettings();
      console.log('[Settings] Settings fetched successfully:', data);
      setState((prev) => ({ ...prev, settings: data, isLoading: false }));
    } catch (err) {
      console.error('[Settings] Failed to fetch settings - ERROR:', err);
      console.error('[Settings] Error type:', typeof err);
      console.error('[Settings] Error instanceof Error:', err instanceof Error);
      if (err instanceof Error) {
        console.error('[Settings] Error message:', err.message);
        console.error('[Settings] Error stack:', err.stack);
        console.error('[Settings] Error name:', err.name);
      }
      console.error('[Settings] Error toString:', String(err));
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao carregar configurações';
      console.error('[Settings] Final error message:', errorMessage);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [settingsApi]);

  const fetchModels = useCallback(
    async (url?: string) => {
      console.log('[Settings] Fetching Ollama models...', { url });
      setState((prev) => ({
        ...prev,
        isLoadingModels: true,
        modelsError: null,
      }));
      try {
        const models = await settingsApi.listOllamaModels(url);
        console.log('[Settings] Ollama models fetched:', models);
        setState((prev) => ({ ...prev, models, isLoadingModels: false }));
        return models;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erro ao listar modelos';
        console.error(
          '[Settings] Failed to fetch Ollama models:',
          errorMsg,
          err,
        );
        setState((prev) => ({
          ...prev,
          models: [],
          isLoadingModels: false,
          modelsError: errorMsg,
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
    console.log('[useSettings] Effect triggered, calling fetchSettings');
    console.log('[useSettings] fetchSettings function:', typeof fetchSettings);
    fetchSettings().catch((err) => {
      console.error('[useSettings] Unhandled error in fetchSettings:', err);
    });
  }, [fetchSettings]);

  return {
    ...state,
    fetchSettings,
    fetchModels,
    saveSettings,
  };
}
