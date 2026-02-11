import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useConnection } from '@/hooks/use-connection';
import { useApi } from '@/providers/connection-provider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DEFAULT_LOCAL_URL } from '@/config/constants';

export function ProviderSelector() {
  const { mode, baseUrl, setMode, setBaseUrl } = useConnection();
  const { healthApi } = useApi();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(
    null,
  );

  const isRemote = mode === 'remote';

  const handleToggle = (checked: boolean) => {
    setMode(checked ? 'remote' : 'local');
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Modo de conexão</p>
            <p className="text-xs text-muted-foreground">
              {isRemote ? 'Servidor remoto' : 'Servidor local'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Local</span>
            <Switch checked={isRemote} onCheckedChange={handleToggle} />
            <span className="text-xs text-muted-foreground">Remoto</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="server-url">
            URL do servidor
          </label>
          <Input
            id="server-url"
            value={isRemote ? baseUrl : DEFAULT_LOCAL_URL}
            onChange={(e) => setBaseUrl(e.target.value)}
            disabled={!isRemote}
            placeholder="https://servidor.universidade.edu.br"
          />
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
