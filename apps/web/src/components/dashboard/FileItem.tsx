import { Download, File, FileImage, FileText, FileVideo, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { setDragItem, type DragItem } from '@/lib/dnd';
import { apiBase } from '@/lib/api';
import { cn } from '@/lib/utils';
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
}

export function FileItem({ file, onDragStart, onDragEnd, isLoading }: FileItemProps) {
  const downloadUrl = `${apiBase}/spaces/${file.spaceId}/files/${file.id}/download`;

  const handleDragStart = (e: React.DragEvent) => {
    if (isLoading) return;
    const item: DragItem = { kind: 'file', id: file.id, name: file.name };
    setDragItem(e, item);
    onDragStart(item);
  };

  return (
    <div
      draggable={!isLoading}
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

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <FileIcon mimeType={file.mimeType} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)} · {file.uploadedBy.name ?? file.uploadedBy.email}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        asChild
        disabled={isLoading}
        onClick={(e) => e.stopPropagation()}
      >
        <a href={downloadUrl} download={file.name} title="Download">
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
