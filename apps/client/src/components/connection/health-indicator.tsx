import { useHealth } from '@/hooks/use-health';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function HealthIndicator() {
  const { connected, ollama, database, isChecking } = useHealth();

  const statusColor = connected
    ? ollama === 'ok'
      ? 'bg-green-500'
      : 'bg-yellow-500'
    : 'bg-red-500';

  const statusText = connected
    ? ollama === 'ok'
      ? 'Todos os serviços online'
      : 'Ollama indisponível'
    : 'Servidor desconectado';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                isChecking ? 'animate-pulse bg-muted-foreground' : statusColor,
              )}
            />
            <span>{isChecking ? 'Verificando...' : statusText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1 text-xs">
            <p>Servidor: {connected ? 'Online' : 'Offline'}</p>
            <p>Ollama: {ollama}</p>
            <p>Database: {database}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
