import { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';

export function Titlebar() {
  const [appWindow, setAppWindow] = useState<Awaited<
    ReturnType<typeof import('@tauri-apps/api/window').getCurrentWindow>
  > | null>(null);

  useEffect(() => {
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => setAppWindow(getCurrentWindow()))
      .catch(() => {
        // Running in browser (dev without Tauri)
      });
  }, []);

  if (!appWindow) {
    return <div className="h-8 shrink-0 bg-muted/50" />;
  }

  return (
    <div
      data-tauri-drag-region
      className="flex h-8 shrink-0 items-center justify-end bg-muted/50"
    >
      <button
        onClick={() => appWindow.minimize()}
        className="inline-flex h-8 w-10 items-center justify-center hover:bg-muted"
        aria-label="Minimizar"
      >
        <Minus className="h-3 w-3" />
      </button>
      <button
        onClick={() => appWindow.toggleMaximize()}
        className="inline-flex h-8 w-10 items-center justify-center hover:bg-muted"
        aria-label="Maximizar"
      >
        <Square className="h-3 w-3" />
      </button>
      <button
        onClick={() => appWindow.close()}
        className="inline-flex h-8 w-10 items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
        aria-label="Fechar"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
