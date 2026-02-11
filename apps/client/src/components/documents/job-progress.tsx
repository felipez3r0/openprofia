import { Progress } from '@/components/ui/progress';
import { JobStatus } from '@/types';

interface JobProgressProps {
  progress: number;
  status: JobStatus;
}

export function JobProgress({ progress, status }: JobProgressProps) {
  return (
    <div className="mt-2 space-y-1">
      <Progress value={progress} className="h-1.5" />
      <p className="text-xs text-muted-foreground">
        {status === JobStatus.PENDING
          ? 'Na fila...'
          : `Processando: ${Math.round(progress)}%`}
      </p>
    </div>
  );
}
