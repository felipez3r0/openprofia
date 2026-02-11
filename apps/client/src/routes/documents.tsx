import { useDocuments } from '@/hooks/use-documents';
import { DocumentUploader } from '@/components/documents/document-uploader';
import { JobList } from '@/components/documents/job-list';
import { Separator } from '@/components/ui/separator';

export function DocumentsPage() {
  const { jobs, isUploading, upload } = useDocuments();

  const handleUpload = async (file: File) => {
    await upload(file);
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Documentos</h1>
        <p className="text-sm text-muted-foreground">
          Envie documentos PDF para a base de conhecimento da skill ativa.
        </p>
      </div>
      <div className="flex-1 space-y-6 p-6">
        <DocumentUploader onUpload={handleUpload} isUploading={isUploading} />
        <Separator />
        <div>
          <h2 className="mb-4 text-sm font-semibold">Processamento</h2>
          <JobList jobs={jobs} />
        </div>
      </div>
    </div>
  );
}
