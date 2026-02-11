import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useConnectionStore } from '@/stores/connection.store';
import { Server, Cloud, Laptop } from 'lucide-react';
import type { ConnectionMode } from '@/types';

const ONBOARDING_KEY = 'openprofia-onboarding-completed';

export function SetupWizard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ConnectionMode>('embedded');
  const [remoteUrl, setRemoteUrl] = useState('');
  const { setMode, setBaseUrl } = useConnectionStore();

  useEffect(() => {
    // Verifica se o onboarding já foi completado
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    // Salva o modo selecionado
    setMode(selectedMode);

    if (selectedMode === 'remote' && remoteUrl) {
      setBaseUrl(remoteUrl);
    }

    // Marca onboarding como completado
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao OpenProfIA</DialogTitle>
          <DialogDescription>
            Escolha como você deseja conectar ao servidor de IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Modo Embedded (Sidecar) */}
          <button
            type="button"
            onClick={() => setSelectedMode('embedded')}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
              selectedMode === 'embedded'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`p-2 rounded-lg ${
                  selectedMode === 'embedded'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <Laptop className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Modo Local Integrado</h3>
              <p className="text-sm text-muted-foreground">
                O servidor roda automaticamente dentro do app. Recomendado para
                uso pessoal. Não requer configuração adicional.
              </p>
              {selectedMode === 'embedded' && (
                <div className="text-xs text-primary mt-2 font-medium">
                  ✓ Recomendado para iniciantes
                </div>
              )}
            </div>
          </button>

          {/* Modo Local (Externo) */}
          <button
            type="button"
            onClick={() => setSelectedMode('local')}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
              selectedMode === 'local'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`p-2 rounded-lg ${
                  selectedMode === 'local'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <Server className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Servidor Local Externo</h3>
              <p className="text-sm text-muted-foreground">
                Conecta a um servidor já em execução em localhost:3000. Útil
                para desenvolvimento ou configuração customizada.
              </p>
            </div>
          </button>

          {/* Modo Remoto */}
          <button
            type="button"
            onClick={() => setSelectedMode('remote')}
            className={`w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-colors text-left ${
              selectedMode === 'remote'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              <div
                className={`p-2 rounded-lg ${
                  selectedMode === 'remote'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <Cloud className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold">Servidor Remoto</h3>
              <p className="text-sm text-muted-foreground">
                Conecta a um servidor remoto (ex: servidor da universidade).
                Requer URL do servidor.
              </p>
            </div>
          </button>

          {/* Input de URL para modo remoto */}
          {selectedMode === 'remote' && (
            <div className="space-y-2 pl-4 pt-2">
              <label htmlFor="remote-url" className="text-sm font-medium">
                URL do Servidor
              </label>
              <Input
                id="remote-url"
                type="url"
                placeholder="https://servidor.universidade.edu.br"
                value={remoteUrl}
                onChange={(e) => setRemoteUrl(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleComplete}
            disabled={selectedMode === 'remote' && !remoteUrl}
          >
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
