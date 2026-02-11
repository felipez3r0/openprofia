import { useCallback, useRef, useState, type DragEvent } from 'react';
import { Upload, FileArchive, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkillUploaderProps {
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  'manifest.json not found in skill package':
    'O pacote não contém um arquivo manifest.json válido. Verifique se o .zip está correto.',
  'File must be a .zip archive': 'O arquivo precisa ser um .zip.',
};

function friendlyError(message: string): string {
  if (ERROR_MESSAGES[message]) return ERROR_MESSAGES[message];
  if (message.includes('is already installed'))
    return 'Essa skill já está instalada. Remova-a antes de reinstalar.';
  if (message.includes('missing required field'))
    return `O manifest.json está incompleto: ${message}`;
  if (message.includes('forbidden executable file'))
    return 'O pacote contém arquivos executáveis proibidos. Skills devem ser apenas declarativas (JSON, Markdown e arquivos de conhecimento).';
  return message;
}

export function SkillUploader({
  onUpload,
  isLoading,
  error,
}: SkillUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.zip')) return;
      await onUpload(file);
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25',
        isLoading && 'pointer-events-none opacity-50',
      )}
    >
      {isLoading ? (
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      ) : (
        <FileArchive className="h-10 w-10 text-muted-foreground" />
      )}
      <p className="mt-4 text-sm font-medium">
        {isLoading ? 'Instalando skill...' : 'Arraste um arquivo .zip aqui'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        ou clique para selecionar
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        onChange={handleInputChange}
        className="hidden"
      />
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Selecionar arquivo
      </Button>

      {error && (
        <div className="mt-4 flex w-full items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{friendlyError(error)}</span>
        </div>
      )}
    </div>
  );
}
