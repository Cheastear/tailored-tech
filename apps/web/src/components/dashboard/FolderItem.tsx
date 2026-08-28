import { useEffect, useRef, useState } from 'react';
import { Folder, Loader2, MoreHorizontal, Pencil, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getDragItem, isDragItem, setDragItem, type DragItem } from '@/lib/dnd';
import { useNavigation } from '@/context/NavigationContext';
import { useMoveFolderMutation, useMoveFileMutation, useRenameFolderMutation } from '@/store/spacesApi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import type { Folder as FolderType } from '@/types/folder';

interface FolderItemProps {
  folder: FolderType;
  onDragStart: (item: DragItem) => void;
  onDragEnd: () => void;
  isLoading?: boolean;
  canWrite?: boolean;
  isOwner?: boolean;
  onMoveStart?: (id: string) => void;
  onMoveEnd?: (id: string) => void;
  onShare?: (folder: FolderType) => void;
  onDelete?: (folder: FolderType) => void;
}

export function FolderItem({
  folder,
  onDragStart,
  onDragEnd,
  isLoading,
  canWrite,
  isOwner,
  onMoveStart,
  onMoveEnd,
  onShare,
  onDelete,
}: FolderItemProps) {
  const { spaceId, enterFolder } = useNavigation();
  const [moveFolder] = useMoveFolderMutation();
  const [moveFile] = useMoveFileMutation();
  const [renameFolder] = useRenameFolderMutation();
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useState(0);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const count = folder._count.children + folder._count.files;

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(folder.name);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [isRenaming, folder.name]);

  const handleDragStart = (e: React.DragEvent) => {
    if (isLoading || isRenaming) return;
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

  const handleRenameSubmit = async () => {
    const name = renameValue.trim();
    if (!name || name === folder.name || !spaceId) {
      setIsRenaming(false);
      return;
    }
    try {
      await renameFolder({ spaceId, folderId: folder.id, name }).unwrap();
      toast.success('Folder renamed');
    } catch (err: unknown) {
      toast.error((err as any)?.data?.message ?? 'Rename failed');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') setIsRenaming(false);
  };

  return (
    <div
      draggable={!isLoading && !isRenaming}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors',
        isLoading
          ? 'cursor-default opacity-60'
          : isOver
            ? 'border-primary bg-primary/5 ring-1 ring-primary'
            : '',
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <button
        className="flex flex-1 items-center gap-3 text-left"
        onClick={() => !isLoading && !isRenaming && enterFolder({ id: folder.id, name: folder.name })}
        disabled={isLoading || isRenaming}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
            isOver ? 'bg-primary/20' : 'bg-primary/10',
          )}
        >
          <Folder className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          {isRenaming ? (
            <Input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="h-7 text-sm"
            />
          ) : (
            <>
              <p className="truncate text-sm font-medium">{folder.name}</p>
              <p className="text-xs text-muted-foreground">
                {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
              </p>
            </>
          )}
        </div>
      </button>

      {canWrite && !isLoading && !isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsRenaming(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            {isOwner && onShare && (
              <DropdownMenuItem onClick={() => onShare(folder)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            )}
            {(isOwner || canWrite) && onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(folder)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
