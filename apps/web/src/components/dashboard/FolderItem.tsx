import { Folder } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import type { Folder as FolderType } from '@/types/folder';

interface FolderItemProps {
  folder: FolderType;
}

export function FolderItem({ folder }: FolderItemProps) {
  const { enterFolder } = useNavigation();

  const count = folder._count.children + folder._count.files;

  return (
    <button
      onClick={() => enterFolder({ id: folder.id, name: folder.name })}
      className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent/50 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Folder className="h-5 w-5 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{folder.name}</p>
        <p className="text-xs text-muted-foreground">
          {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
        </p>
      </div>
    </button>
  );
}
