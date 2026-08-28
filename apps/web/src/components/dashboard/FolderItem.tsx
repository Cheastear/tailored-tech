import { useState } from 'react';
import { Folder } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getDragItem, isDragItem, setDragItem, type DragItem } from '@/lib/dnd';
import { useNavigation } from '@/context/NavigationContext';
import { useMoveFolderMutation, useMoveFileMutation } from '@/store/spacesApi';
import type { Folder as FolderType } from '@/types/folder';

interface FolderItemProps {
  folder: FolderType;
  onDragStart: (item: DragItem) => void;
  onDragEnd: () => void;
}

export function FolderItem({ folder, onDragStart, onDragEnd }: FolderItemProps) {
  const { spaceId, enterFolder } = useNavigation();
  const [moveFolder] = useMoveFolderMutation();
  const [moveFile] = useMoveFileMutation();
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useState(0);

  const count = folder._count.children + folder._count.files;

  const handleDragStart = (e: React.DragEvent) => {
    const item: DragItem = { kind: 'folder', id: folder.id, name: folder.name };
    setDragItem(e, item);
    onDragStart(item);
    // hide the element ghost slightly so it doesn't look weird
    setTimeout(() => (e.target as HTMLElement).style.opacity, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    e.stopPropagation();
    dragCounter[1]((n) => n + 1);
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    e.stopPropagation();
    dragCounter[1]((n) => {
      const next = n - 1;
      if (next <= 0) setIsOver(false);
      return next;
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter[1](0);
    setIsOver(false);

    const item = getDragItem(e);
    if (!item || !spaceId) return;
    if (item.kind === 'folder' && item.id === folder.id) return; // dropping onto itself

    try {
      if (item.kind === 'file') {
        await moveFile({ spaceId, fileId: item.id, folderId: folder.id }).unwrap();
      } else {
        await moveFolder({ spaceId, folderId: item.id, parentId: folder.id }).unwrap();
      }
      toast.success(`Moved "${item.name}" into "${folder.name}"`);
    } catch (err: unknown) {
      const message = (err as any)?.data?.message ?? 'Move failed';
      toast.error(message);
    }
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => enterFolder({ id: folder.id, name: folder.name })}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors',
        isOver
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'hover:bg-accent/50',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
        isOver ? 'bg-primary/20' : 'bg-primary/10',
      )}>
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
