import { useCallback, useEffect, useRef, useState } from 'react';
import { useApi } from '@/providers/connection-provider';
import { useSkillStore } from '@/stores/skill.store';
import { JobStatus, type IJob } from '@/types';
import { JOB_POLL_INTERVAL_MS } from '@/config/constants';

export function useDocuments() {
  const { documentsApi } = useApi();
  const activeSkillId = useSkillStore((s) => s.activeSkillId);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async () => {
    if (!activeSkillId) return;
    try {
      const data = await documentsApi.listJobs(activeSkillId);
      setJobs(data);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [activeSkillId, documentsApi]);

  const upload = useCallback(
    async (file: File) => {
      if (!activeSkillId) throw new Error('No active skill selected');
      setIsUploading(true);
      setError(null);
      try {
        const result = await documentsApi.upload(activeSkillId, file);
        await fetchJobs();
        return result;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [activeSkillId, documentsApi, fetchJobs],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (j) =>
        j.status === JobStatus.PENDING || j.status === JobStatus.PROCESSING,
    );
    if (hasActiveJobs) {
      pollingRef.current = setInterval(fetchJobs, JOB_POLL_INTERVAL_MS);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobs, fetchJobs]);

  return { jobs, isUploading, error, upload, fetchJobs };
}
