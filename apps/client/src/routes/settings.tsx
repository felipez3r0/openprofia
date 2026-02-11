import { ProviderSelector } from '@/components/connection/provider-selector';
import { Separator } from '@/components/ui/separator';

export function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Configure a conexão com o servidor e preferências do aplicativo.
        </p>
      </div>
      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="mb-4 text-sm font-semibold">Conexão</h2>
          <ProviderSelector />
        </div>
        <Separator />
        <div>
          <h2 className="mb-4 text-sm font-semibold">Sobre</h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>OpenProfIA v0.1.0</p>
            <p>Plataforma de IA open-source para educação</p>
          </div>
        </div>
      </div>
    </div>
  );
}
