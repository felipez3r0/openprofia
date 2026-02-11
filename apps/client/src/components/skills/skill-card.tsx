import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ISkill } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SkillCardProps {
  skill: ISkill;
  onDelete: (id: string) => void;
}

export function SkillCard({ skill, onDelete }: SkillCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { manifest } = skill;

  const handleDelete = () => {
    onDelete(skill.id);
    setConfirmOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{manifest.name}</CardTitle>
            <CardDescription>
              v{manifest.version}
              {manifest.author && ` · ${manifest.author}`}
            </CardDescription>
          </div>
          {skill.hasKnowledge && <Badge variant="secondary">RAG</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{manifest.description}</p>
        {manifest.capabilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {manifest.capabilities.map((cap) => (
              <Badge key={cap} variant="outline" className="text-xs">
                {cap}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          Instalada em {new Date(skill.installedAt).toLocaleDateString('pt-BR')}
        </span>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Remover skill">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover skill</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover &quot;{manifest.name}&quot;? Esta
                ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Remover
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
