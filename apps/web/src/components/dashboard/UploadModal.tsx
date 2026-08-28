import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNavigation } from '@/context/NavigationContext';
import { formatBytes } from '@/lib/format';
import { useUploadFilesMutation } from '@/store/spacesApi';
import { UploadDropzone } from './UploadDropzone';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: Props) {
  const { spaceId, folderId } = useNavigation();
  const [files, setFiles] = useState<File[]>([]);
  const [upload, { isLoading }] = useUploadFilesMutation();

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...incoming.filter((f) => !names.has(f.name))];
    });
  };

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleUpload = async () => {
    if (!spaceId || !files.length) return;
    await upload({ spaceId, folderId, files });
    setFiles([]);
    onOpenChange(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (isLoading) return;
    setFiles([]);
    onOpenChange(next);
  };

  const label =
    files.length > 0
      ? `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
      : 'Upload';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <UploadDropzone onFiles={addFiles} />

          {files.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {files.map((file, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!files.length || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading…
              </>
            ) : (
              label
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
