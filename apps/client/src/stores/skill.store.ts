import { create } from 'zustand';
import type { ISkill } from '@/types';

interface PendingModelInstall {
  skillName: string;
  missingModels: string[];
}

interface SkillState {
  skills: ISkill[];
  activeSkillId: string | null;
  isLoading: boolean;
  error: string | null;
  pendingModelInstall: PendingModelInstall | null;
  setSkills: (skills: ISkill[]) => void;
  setActiveSkillId: (id: string | null) => void;
  addSkill: (skill: ISkill) => void;
  removeSkill: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPendingModelInstall: (pending: PendingModelInstall | null) => void;
}

export const useSkillStore = create<SkillState>()((set, get) => ({
  skills: [],
  activeSkillId: null,
  isLoading: false,
  error: null,
  pendingModelInstall: null,
  setSkills: (skills) => set({ skills }),
  setActiveSkillId: (id) => set({ activeSkillId: id }),
  addSkill: (skill) => set({ skills: [...get().skills, skill] }),
  removeSkill: (id) =>
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
      activeSkillId: state.activeSkillId === id ? null : state.activeSkillId,
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPendingModelInstall: (pendingModelInstall) => set({ pendingModelInstall }),
}));
