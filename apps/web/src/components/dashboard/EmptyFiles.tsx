import { FolderOpen, FolderPlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyFilesProps {
  canWrite: boolean;
  onUpload: () => void;
  onNewFolder: () => void;
}

export function EmptyFiles({ canWrite, onUpload, onNewFolder }: EmptyFilesProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No files yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {canWrite ? 'Upload files or create a folder to get started' : 'This space has no files yet'}
      </p>
      {canWrite && (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNewFolder}>
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
          <Button size="sm" onClick={onUpload}>
            <Upload className="h-4 w-4" />
            Upload files
          </Button>
        </div>
      )}
    </div>
  );
}
