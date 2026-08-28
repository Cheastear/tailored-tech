import { useEffect, useRef, useState } from 'react';
import {
  Download,
  File,
  FileImage,
  FileText,
  FileVideo,
  Loader2,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { formatBytes } from '@/lib/format';
import { setDragItem, type DragItem } from '@/lib/dnd';
import { apiBase } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/context/NavigationContext';
import { useRenameFileMutation } from '@/store/spacesApi';
import type { SpaceFile } from '@/types/file';

function FileIcon({ mimeType }: { mimeType: string }) {
  const cls = 'h-5 w-5 text-primary';
  if (mimeType.startsWith('image/')) return <FileImage className={cls} />;
  if (mimeType.startsWith('video/')) return <FileVideo className={cls} />;
  if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className={cls} />;
  return <File className={cls} />;
}

interface FileItemProps {
  file: SpaceFile;
  onDragStart: (item: DragItem) => void;
  onDragEnd: () => void;
  isLoading?: boolean;
  canWrite?: boolean;
  isOwner?: boolean;
  onPreview?: (file: SpaceFile) => void;
  onShare?: (file: SpaceFile) => void;
  onDelete?: (file: SpaceFile) => void;
}

export function FileItem({
  file,
  onDragStart,
  onDragEnd,
  isLoading,
  canWrite,
  isOwner,
  onPreview,
  onShare,
  onDelete,
}: FileItemProps) {
  const { spaceId } = useNavigation();
  const [renameFile] = useRenameFileMutation();
  const downloadUrl = `${apiBase}/spaces/${file.spaceId}/files/${file.id}/download`;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(file.name);
      setTimeout(() => {
        if (!inputRef.current) return;
        const dotIndex = file.name.lastIndexOf('.');
        const selEnd = dotIndex > 0 ? dotIndex : file.name.length;
        inputRef.current.setSelectionRange(0, selEnd);
        inputRef.current.focus();
      }, 0);
    }
  }, [isRenaming, file.name]);

  const handleDragStart = (e: React.DragEvent) => {
    if (isLoading || isRenaming) return;
    const item: DragItem = { kind: 'file', id: file.id, name: file.name };
    setDragItem(e, item);
    onDragStart(item);
  };

  const handleRenameSubmit = async () => {
    const name = renameValue.trim();
    if (!name || name === file.name || !spaceId) {
      setIsRenaming(false);
      return;
    }
    try {
      await renameFile({ spaceId, fileId: file.id, name }).unwrap();
      toast.success('File renamed');
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
      className={cn(
        'relative flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-opacity',
        isLoading
          ? 'cursor-default opacity-60'
          : 'cursor-grab active:cursor-grabbing active:opacity-60',
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <button
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => !isLoading && !isRenaming && onPreview?.(file)}
        disabled={isLoading || isRenaming || !onPreview}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <FileIcon mimeType={file.mimeType} />
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
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} · {file.uploadedBy.name ?? file.uploadedBy.email}
              </p>
            </>
          )}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        {canWrite && !isLoading && !isRenaming && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <a href={downloadUrl} download={file.name}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              {isOwner && onShare && (
                <DropdownMenuItem onClick={() => onShare(file)}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
              )}
              {(isOwner || canWrite) && onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(file)}
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
    </div>
  );
}
