import { Puzzle } from 'lucide-react';
import type { ISkill } from '@/types';
import { SkillCard } from './skill-card';

interface SkillListProps {
  skills: ISkill[];
  onDelete: (id: string) => void;
}

export function SkillList({ skills, onDelete }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Puzzle className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold text-muted-foreground">
          Nenhuma skill instalada
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Faça upload de um arquivo .zip para instalar sua primeira skill.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} onDelete={onDelete} />
      ))}
    </div>
  );
}
