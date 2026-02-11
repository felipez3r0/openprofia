import { useHealth } from '@/hooks/use-health';
import { useApi } from '@/providers/connection-provider';
import { useConnectionStore } from '@/stores/connection.store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function HealthIndicator() {
  const { connected, ollama, database, isChecking } = useHealth();
  const { sidecarStatus } = useApi();
  const mode = useConnectionStore((s) => s.mode);

  const isSidecarStarting = mode === 'embedded' && sidecarStatus === 'starting';

  const statusColor = connected
    ? ollama === 'ok'
      ? 'bg-green-500'
      : 'bg-yellow-500'
    : 'bg-red-500';

  const statusText = isSidecarStarting
    ? 'Iniciando servidor...'
    : connected
      ? ollama === 'ok'
        ? 'Todos os serviços online'
        : 'Ollama indisponível'
      : 'Servidor desconectado';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
            {isSidecarStarting ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            ) : (
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  isChecking
                    ? 'animate-pulse bg-muted-foreground'
                    : statusColor,
                )}
              />
            )}
            <span>
              {isChecking && !isSidecarStarting ? 'Verificando...' : statusText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1 text-xs">
            {mode === 'embedded' && <p>Modo: Servidor Integrado</p>}
            <p>Servidor: {connected ? 'Online' : 'Offline'}</p>
            <p>Ollama: {ollama}</p>
            <p>Database: {database}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
