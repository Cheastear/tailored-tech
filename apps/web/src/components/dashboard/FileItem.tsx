import { Download, File, FileImage, FileText, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/format';
import { setDragItem, type DragItem } from '@/lib/dnd';
import { apiBase } from '@/lib/api';
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
}

export function FileItem({ file, onDragStart, onDragEnd }: FileItemProps) {
  const downloadUrl = `${apiBase}/spaces/${file.spaceId}/files/${file.id}/download`;

  const handleDragStart = (e: React.DragEvent) => {
    const item: DragItem = { kind: 'file', id: file.id, name: file.name };
    setDragItem(e, item);
    onDragStart(item);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className="flex cursor-grab items-center gap-3 rounded-lg border bg-card px-4 py-3 active:cursor-grabbing active:opacity-60"
    >
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
        onClick={(e) => e.stopPropagation()}
      >
        <a href={downloadUrl} download={file.name} title="Download">
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
