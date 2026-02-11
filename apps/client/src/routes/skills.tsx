import { useSkills } from '@/hooks/use-skills';
import { SkillList } from '@/components/skills/skill-list';
import { SkillUploader } from '@/components/skills/skill-uploader';
import { ModelInstallDialog } from '@/components/skills/model-install-dialog';
import { Separator } from '@/components/ui/separator';

export function SkillsPage() {
  const {
    skills,
    isLoading,
    error,
    uploadSkill,
    deleteSkill,
    pendingModelInstall,
    setPendingModelInstall,
  } = useSkills();

  const handleUpload = async (file: File) => {
    try {
      await uploadSkill(file);
    } catch {
      // error already stored in skill store
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Gerenciar Skills</h1>
        <p className="text-sm text-muted-foreground">
          Instale e gerencie skills de IA para personalizar o assistente.
        </p>
      </div>
      <div className="flex-1 space-y-6 p-6">
        <SkillUploader
          onUpload={handleUpload}
          isLoading={isLoading}
          error={error}
        />
        <Separator />
        <SkillList skills={skills} onDelete={deleteSkill} />
      </div>

      {pendingModelInstall && (
        <ModelInstallDialog
          skillName={pendingModelInstall.skillName}
          missingModels={pendingModelInstall.missingModels}
          onClose={() => setPendingModelInstall(null)}
        />
      )}
    </div>
  );
}
