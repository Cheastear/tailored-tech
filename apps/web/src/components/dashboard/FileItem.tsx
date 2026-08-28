import { Download, File, FileImage, FileText, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SpaceFile } from '@/types/file';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const cls = 'h-5 w-5 text-primary';
  if (mimeType.startsWith('image/')) return <FileImage className={cls} />;
  if (mimeType.startsWith('video/')) return <FileVideo className={cls} />;
  if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText className={cls} />;
  return <File className={cls} />;
}

interface FileItemProps {
  file: SpaceFile;
}

export function FileItem({ file }: FileItemProps) {
  const downloadUrl = `/api/spaces/${file.spaceId}/files/${file.id}/download`;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <FileIcon mimeType={file.mimeType} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)} · {file.uploadedBy.name ?? file.uploadedBy.email}
        </p>
      </div>

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
        <a href={downloadUrl} download={file.name} title="Download">
          <Download className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
