import { useCallback, useEffect } from 'react';
import { useApi } from '@/providers/connection-provider';
import { useSkillStore } from '@/stores/skill.store';

export function useSkills() {
  const { skillsApi } = useApi();
  const {
    skills,
    activeSkillId,
    isLoading,
    error,
    pendingModelInstall,
    setSkills,
    setActiveSkillId,
    addSkill,
    removeSkill,
    setLoading,
    setError,
    setPendingModelInstall,
  } = useSkillStore();

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await skillsApi.list();
      setSkills(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [skillsApi, setSkills, setLoading, setError]);

  const uploadSkill = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const result = await skillsApi.upload(file);
        const skill = await skillsApi.getById(result.skillId);
        addSkill(skill);

        // Verifica se há modelos faltantes
        if (result.missingModels && result.missingModels.length > 0) {
          setPendingModelInstall({
            skillName: result.name,
            missingModels: result.missingModels,
          });
        }

        return result;
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [skillsApi, addSkill, setLoading, setError, setPendingModelInstall],
  );

  const deleteSkill = useCallback(
    async (id: string) => {
      try {
        await skillsApi.remove(id);
        removeSkill(id);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      }
    },
    [skillsApi, removeSkill, setError],
  );

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const activeSkill = skills.find((s) => s.id === activeSkillId) ?? null;

  return {
    skills,
    activeSkill,
    activeSkillId,
    isLoading,
    error,
    pendingModelInstall,
    fetchSkills,
    uploadSkill,
    deleteSkill,
    setActiveSkillId,
    setPendingModelInstall,
  };
}
