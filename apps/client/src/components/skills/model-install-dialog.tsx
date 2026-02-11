import { useCallback, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Loader2,
  Terminal,
} from 'lucide-react';
import type { IModelPullProgress } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/providers/connection-provider';
import { useConnectionStore } from '@/stores/connection.store';

interface ModelInstallDialogProps {
  skillName: string;
  missingModels: string[];
  onClose: () => void;
}

interface ModelStatus {
  state: 'pending' | 'downloading' | 'done' | 'error';
  percent: number;
  statusText: string;
  error?: string;
}

export function ModelInstallDialog({
  skillName,
  missingModels,
  onClose,
}: ModelInstallDialogProps) {
  const { settingsApi } = useApi();
  const mode = useConnectionStore((s) => s.mode);
  const baseUrl = useConnectionStore((s) => s.baseUrl);
  const isLocal = mode === 'local';

  const [modelStatuses, setModelStatuses] = useState<
    Record<string, ModelStatus>
  >(() => {
    const initial: Record<string, ModelStatus> = {};
    for (const model of missingModels) {
      initial[model] = {
        state: 'pending',
        percent: 0,
        statusText: 'Aguardando',
      };
    }
    return initial;
  });

  const [copied, setCopied] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const allDone = missingModels.every(
    (m) => modelStatuses[m]?.state === 'done',
  );
  const isDownloading = missingModels.some(
    (m) => modelStatuses[m]?.state === 'downloading',
  );

  const handleInstall = useCallback(
    (model: string) => {
      setModelStatuses((prev) => ({
        ...prev,
        [model]: {
          state: 'downloading',
          percent: 0,
          statusText: 'Iniciando download...',
        },
      }));

      const controller = settingsApi.pullModel(
        baseUrl,
        model,
        (progress: IModelPullProgress) => {
          setModelStatuses((prev) => ({
            ...prev,
            [model]: {
              state: 'downloading',
              percent: progress.percent,
              statusText:
                progress.status === 'pulling manifest'
                  ? 'Baixando manifesto...'
                  : progress.total > 0
                    ? `Baixando... ${formatBytes(progress.completed)} / ${formatBytes(progress.total)}`
                    : progress.status,
            },
          }));
        },
        () => {
          setModelStatuses((prev) => ({
            ...prev,
            [model]: {
              state: 'done',
              percent: 100,
              statusText: 'Instalado com sucesso!',
            },
          }));
        },
        (error: string) => {
          setModelStatuses((prev) => ({
            ...prev,
            [model]: {
              state: 'error',
              percent: 0,
              statusText: 'Erro na instalação',
              error,
            },
          }));
        },
      );

      abortRef.current = controller;
    },
    [settingsApi, baseUrl],
  );

  const handleInstallAll = useCallback(() => {
    for (const model of missingModels) {
      if (
        modelStatuses[model]?.state === 'pending' ||
        modelStatuses[model]?.state === 'error'
      ) {
        handleInstall(model);
      }
    }
  }, [missingModels, modelStatuses, handleInstall]);

  const handleCopy = useCallback(async (model: string) => {
    await navigator.clipboard.writeText(`ollama pull ${model}`);
    setCopied(model);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleClose = useCallback(() => {
    if (abortRef.current && isDownloading) {
      abortRef.current.abort();
    }
    onClose();
  }, [onClose, isDownloading]);

  return (
    <Dialog open onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Modelos necessários
          </DialogTitle>
          <DialogDescription>
            A skill <strong>&quot;{skillName}&quot;</strong> precisa de{' '}
            {missingModels.length === 1
              ? 'um modelo que não está'
              : `${missingModels.length} modelos que não estão`}{' '}
            instalado{missingModels.length > 1 ? 's' : ''} no Ollama.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {missingModels.map((model) => {
            const status = modelStatuses[model];
            return (
              <div key={model} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono">
                      {model}
                    </code>
                    {status?.state === 'done' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>

                  {isLocal ? (
                    status?.state === 'pending' || status?.state === 'error' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInstall(model)}
                      >
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        Instalar
                      </Button>
                    ) : status?.state === 'downloading' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : null
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(model)}
                    >
                      {copied === model ? (
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {copied === model ? 'Copiado!' : 'Copiar'}
                    </Button>
                  )}
                </div>

                {status?.state === 'downloading' && (
                  <div className="space-y-1">
                    <Progress value={status.percent} />
                    <p className="text-xs text-muted-foreground">
                      {status.statusText}
                      {status.percent > 0 && ` (${status.percent}%)`}
                    </p>
                  </div>
                )}

                {status?.state === 'error' && (
                  <p className="text-xs text-destructive">
                    {status.error ?? 'Falha ao instalar o modelo'}
                  </p>
                )}

                {status?.state === 'done' && (
                  <p className="text-xs text-green-600">{status.statusText}</p>
                )}
              </div>
            );
          })}

          {!isLocal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <Terminal className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Servidor remoto detectado
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Você está conectado a um servidor remoto. Solicite ao
                    administrador que execute os comandos abaixo no servidor:
                  </p>
                  <div className="rounded bg-amber-100 p-2 dark:bg-amber-900">
                    {missingModels.map((model) => (
                      <code
                        key={model}
                        className="block text-xs font-mono text-amber-900 dark:text-amber-100"
                      >
                        ollama pull {model}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isLocal && !allDone && missingModels.length > 1 && (
            <Button onClick={handleInstallAll} disabled={isDownloading}>
              <Download className="mr-2 h-4 w-4" />
              Instalar todos
            </Button>
          )}
          <Button
            variant={allDone ? 'default' : 'outline'}
            onClick={handleClose}
          >
            {allDone ? 'Pronto!' : isLocal ? 'Depois' : 'Fechar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
