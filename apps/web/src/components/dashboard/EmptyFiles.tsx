import { FolderOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyFiles() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No files yet</p>
      <p className="mt-1 text-xs text-muted-foreground">Upload files to this space to get started</p>
      <Button size="sm" className="mt-4 gap-1.5">
        <Upload className="h-4 w-4" />
        Upload files
      </Button>
    </div>
  );
}
