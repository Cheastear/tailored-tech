import { useState } from 'react';
import { Folder, Loader2 } from 'lucide-react';
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
  isLoading?: boolean;
  onMoveStart?: (id: string) => void;
  onMoveEnd?: (id: string) => void;
}

export function FolderItem({ folder, onDragStart, onDragEnd, isLoading, onMoveStart, onMoveEnd }: FolderItemProps) {
  const { spaceId, enterFolder } = useNavigation();
  const [moveFolder] = useMoveFolderMutation();
  const [moveFile] = useMoveFileMutation();
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useState(0);

  const count = folder._count.children + folder._count.files;

  const handleDragStart = (e: React.DragEvent) => {
    if (isLoading) return;
    const item: DragItem = { kind: 'folder', id: folder.id, name: folder.name };
    setDragItem(e, item);
    onDragStart(item);
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
    if (item.kind === 'folder' && item.id === folder.id) return;

    onMoveStart?.(item.id);
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
    } finally {
      onMoveEnd?.(item.id);
    }
  };

  return (
    <button
      draggable={!isLoading}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isLoading && enterFolder({ id: folder.id, name: folder.name })}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors',
        isLoading
          ? 'cursor-default opacity-60'
          : isOver
            ? 'border-primary bg-primary/5 ring-1 ring-primary'
            : 'hover:bg-accent/50',
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
          isOver ? 'bg-primary/20' : 'bg-primary/10',
        )}
      >
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
