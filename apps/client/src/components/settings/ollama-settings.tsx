import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface OllamaSettingsProps {
  readonly: boolean;
}

export function OllamaSettings({ readonly }: OllamaSettingsProps) {
  const {
    settings,
    models,
    isLoading,
    isLoadingModels,
    isSaving,
    error,
    modelsError,
    saveSuccess,
    fetchModels,
    saveSettings,
  } = useSettings();

  const [ollamaUrl, setOllamaUrl] = useState('');
  const [chatModel, setChatModel] = useState('');
  const [embeddingModel, setEmbeddingModel] = useState('');
  const [urlTestResult, setUrlTestResult] = useState<
    'success' | 'error' | null
  >(null);

  // Sincroniza form com settings carregadas do server
  useEffect(() => {
    if (settings) {
      setOllamaUrl(settings.ollama_base_url);
      setChatModel(settings.ollama_chat_model);
      setEmbeddingModel(settings.ollama_embedding_model);
    }
  }, [settings]);

  // Carrega modelos quando settings estiver disponível
  useEffect(() => {
    if (settings) {
      fetchModels();
    }
  }, [settings, fetchModels]);

  const handleTestUrl = async () => {
    setUrlTestResult(null);
    const result = await fetchModels(ollamaUrl);
    setUrlTestResult(result.length > 0 ? 'success' : 'error');
  };

  const handleRefreshModels = () => {
    setUrlTestResult(null);
    fetchModels(ollamaUrl);
  };

  const handleSave = async () => {
    await saveSettings({
      ollama_base_url: ollamaUrl,
      ollama_chat_model: chatModel,
      ollama_embedding_model: embeddingModel,
    });
    // Recarrega modelos com a nova URL (pode ter mudado)
    fetchModels(ollamaUrl);
  };

  const hasChanges =
    settings &&
    (ollamaUrl !== settings.ollama_base_url ||
      chatModel !== settings.ollama_chat_model ||
      embeddingModel !== settings.ollama_embedding_model);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ollama</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando configurações...
        </CardContent>
      </Card>
    );
  }

  if (error && !settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ollama</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Ollama</CardTitle>
            <CardDescription>
              Configure o servidor Ollama e os modelos de IA.
            </CardDescription>
          </div>
          {readonly && <Badge variant="secondary">Somente leitura</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* URL do Ollama */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ollama-url">
            URL do Ollama
          </label>
          <div className="flex gap-2">
            <Input
              id="ollama-url"
              value={ollamaUrl}
              onChange={(e) => {
                setOllamaUrl(e.target.value);
                setUrlTestResult(null);
              }}
              disabled={readonly}
              placeholder="http://localhost:11434"
            />
            {!readonly && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestUrl}
                disabled={isLoadingModels || !ollamaUrl}
                className="shrink-0"
              >
                {isLoadingModels ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : null}
                Testar
              </Button>
            )}
          </div>
          {urlTestResult === 'success' && (
            <p className="flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" />
              Conectado — {models.length} modelo(s) encontrado(s)
            </p>
          )}
          {urlTestResult === 'error' && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              Não foi possível conectar ao Ollama nesta URL
            </p>
          )}
        </div>

        {/* Modelo de Chat */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="chat-model">
              Modelo de Chat
            </label>
            {!readonly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshModels}
                disabled={isLoadingModels}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw
                  className={`mr-1 h-3 w-3 ${isLoadingModels ? 'animate-spin' : ''}`}
                />
                Atualizar
              </Button>
            )}
          </div>
          <Select
            value={chatModel}
            onValueChange={setChatModel}
            disabled={readonly || models.length === 0}
          >
            <SelectTrigger id="chat-model">
              <SelectValue
                placeholder={
                  isLoadingModels
                    ? 'Carregando...'
                    : models.length === 0
                      ? 'Nenhum modelo disponível'
                      : 'Selecione o modelo'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Usado para gerar respostas no chat. Skills podem definir um modelo
            preferido que prevalece sobre esta configuração.
          </p>
        </div>

        {/* Modelo de Embedding */}
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="embedding-model">
            Modelo de Embedding (RAG)
          </label>
          <Select
            value={embeddingModel}
            onValueChange={setEmbeddingModel}
            disabled={readonly || models.length === 0}
          >
            <SelectTrigger id="embedding-model">
              <SelectValue
                placeholder={
                  isLoadingModels
                    ? 'Carregando...'
                    : models.length === 0
                      ? 'Nenhum modelo disponível'
                      : 'Selecione o modelo'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Usado para gerar embeddings dos documentos e buscas semânticas.
          </p>
        </div>

        {/* Erros e Ações */}
        {modelsError && (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            {modelsError}
          </p>
        )}

        {!readonly && (
          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Salvar configurações
            </Button>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <Check className="h-3 w-3" />
                Salvo com sucesso
              </span>
            )}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
