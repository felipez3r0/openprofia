import { useSkills } from '@/hooks/use-skills';

export function Header() {
  const { activeSkill } = useSkills();

  return (
    <header className="flex h-12 shrink-0 items-center border-b px-6">
      {activeSkill ? (
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{activeSkill.manifest.name}</h1>
          <span className="text-xs text-muted-foreground">
            v{activeSkill.manifest.version}
          </span>
        </div>
      ) : (
        <h1 className="text-sm text-muted-foreground">
          Nenhuma skill selecionada
        </h1>
      )}
    </header>
  );
}
