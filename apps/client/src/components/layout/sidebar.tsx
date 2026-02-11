import { Link, useMatchRoute } from '@tanstack/react-router';
import { MessageSquare, Puzzle, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { SkillSelector } from '@/components/skills/skill-selector';
import { HealthIndicator } from '@/components/connection/health-indicator';

const navItems = [
  { to: '/chat' as const, label: 'Chat', icon: MessageSquare },
  { to: '/skills' as const, label: 'Skills', icon: Puzzle },
  { to: '/documents' as const, label: 'Documentos', icon: FileText },
  { to: '/settings' as const, label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const matchRoute = useMatchRoute();

  return (
    <aside className="flex w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          OP
        </div>
        <span className="font-semibold text-sm">OpenProfIA</span>
      </div>

      <div className="px-3 py-2">
        <SkillSelector />
      </div>

      <Separator />

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = matchRoute({ to });
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
        <HealthIndicator />
      </div>
    </aside>
  );
}
