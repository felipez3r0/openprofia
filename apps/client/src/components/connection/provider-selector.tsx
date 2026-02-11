import { useState } from 'react';
import { Loader2, Server, Cloud, Laptop, RefreshCw } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';
import { useApi } from '@/providers/connection-provider';
import { useSidecar } from '@/hooks/use-sidecar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DEFAULT_LOCAL_URL } from '@/config/constants';
import type { ConnectionMode } from '@/types';

export function ProviderSelector() {
  const { mode, baseUrl, setMode, setBaseUrl } = useConnection();
  const { healthApi, sidecarStatus } = useApi();
  const { startSidecar, stopSidecar } = useSidecar();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null,
  );

  const handleModeChange = (value: ConnectionMode) => {
    setMode(value);
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await healthApi.check();
      setTestResult('success');
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleRestartSidecar = async () => {
    await stopSidecar();
    setTimeout(() => startSidecar(), 500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="connection-mode">
            Modo de conexão
          </label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger id="connection-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="embedded">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  Local Integrado (Recomendado)
                </div>
              </SelectItem>
              <SelectItem value="local">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Servidor Local Externo
                </div>
              </SelectItem>
              <SelectItem value="remote">
                <div className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Servidor Remoto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status do sidecar quando em modo embedded */}
        {mode === 'embedded' && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {sidecarStatus === 'starting' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span className="text-sm">Iniciando servidor...</span>
                </>
              )}
              {sidecarStatus === 'running' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Servidor em execução</span>
                </>
              )}
              {sidecarStatus === 'stopped' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-sm">Servidor parado</span>
                </>
              )}
              {sidecarStatus === 'error' && (
                <>
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Erro ao iniciar servidor</span>
                </>
              )}
            </div>
            {sidecarStatus === 'running' && (
              <Button variant="ghost" size="sm" onClick={handleRestartSidecar}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Reiniciar
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="server-url">
            URL do servidor
          </label>
          <Input
            id="server-url"
            value={mode === 'remote' ? baseUrl : DEFAULT_LOCAL_URL}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={mode !== 'remote'}
            placeholder="https://servidor.universidade.edu.br"
          />
          {mode === 'embedded' && (
            <p className="text-xs text-muted-foreground">
              O servidor integrado sempre escuta em localhost:3000
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={testing}
          >
            {testing && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Testar conexão
          </Button>
          {testResult === 'success' && (
            <span className="text-sm text-green-600">
              Conectado com sucesso!
            </span>
          )}
          {testResult === 'error' && (
            <span className="text-sm text-destructive">Falha na conexão</span>
          )}
        </div>
      </div>
    </div>
  );
}
