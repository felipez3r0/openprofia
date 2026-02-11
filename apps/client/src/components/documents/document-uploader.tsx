import { useCallback, useRef } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSkillStore } from '@/stores/skill.store';

interface DocumentUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function DocumentUploader({
  onUpload,
  isUploading,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSkillId = useSkillStore((s) => s.activeSkillId);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await onUpload(file);
      e.target.value = '';
    },
    [onUpload],
  );

  return (
    <div className="flex items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={isUploading || !activeSkillId}
      >
        {isUploading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileUp className="mr-2 h-4 w-4" />
        )}
        {isUploading ? 'Enviando...' : 'Upload PDF'}
      </Button>
      {!activeSkillId && (
        <p className="text-sm text-muted-foreground">
          Selecione uma skill para enviar documentos.
        </p>
      )}
    </div>
  );
}
