import { useSkills } from '@/hooks/use-skills';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SkillSelector() {
  const { skills, activeSkillId, setActiveSkillId } = useSkills();

  return (
    <Select value={activeSkillId ?? ''} onValueChange={setActiveSkillId}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecionar skill..." />
      </SelectTrigger>
      <SelectContent>
        {skills.map((skill) => (
          <SelectItem key={skill.id} value={skill.id}>
            {skill.manifest.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
