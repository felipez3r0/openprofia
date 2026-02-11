import { FileText } from 'lucide-react';
import { JobStatus, type IJob } from '@/types';
import { Badge } from '@/components/ui/badge';
import { JobProgress } from './job-progress';

interface JobListProps {
  jobs: IJob[];
}

const statusLabels: Record<JobStatus, string> = {
  [JobStatus.PENDING]: 'Pendente',
  [JobStatus.PROCESSING]: 'Processando',
  [JobStatus.COMPLETED]: 'Concluído',
  [JobStatus.FAILED]: 'Falhou',
};

const statusVariants: Record<
  JobStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  [JobStatus.PENDING]: 'outline',
  [JobStatus.PROCESSING]: 'secondary',
  [JobStatus.COMPLETED]: 'default',
  [JobStatus.FAILED]: 'destructive',
};

export function JobList({ jobs }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum documento processado ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center gap-4 rounded-lg border p-4"
        >
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">{job.fileName}</p>
            {(job.status === JobStatus.PROCESSING ||
              job.status === JobStatus.PENDING) && (
              <JobProgress progress={job.progress ?? 0} status={job.status} />
            )}
            {job.error && (
              <p className="mt-1 text-xs text-destructive">{job.error}</p>
            )}
          </div>
          <Badge variant={statusVariants[job.status]}>
            {statusLabels[job.status]}
          </Badge>
        </div>
      ))}
    </div>
  );
}
