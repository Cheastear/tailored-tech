import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteFolderMutation, useGetFolderStatsQuery } from '@/store/spacesApi';
import type { Folder } from '@/types/folder';

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: Folder | null;
  spaceId: string;
}

export function DeleteFolderDialog({ open, onOpenChange, folder, spaceId }: DeleteFolderDialogProps) {
  const [deleteFolder] = useDeleteFolderMutation();
  const [confirming, setConfirming] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetFolderStatsQuery(
    { spaceId, folderId: folder?.id ?? '' },
    { skip: !open || !folder },
  );

  useEffect(() => {
    if (!open) setConfirming(false);
  }, [open]);

  const handleConfirm = async () => {
    if (!folder) return;
    setConfirming(true);
    try {
      await deleteFolder({ spaceId, folderId: folder.id }).unwrap();
      toast.success(`"${folder.name}" deleted`);
      onOpenChange(false);
    } catch {
      toast.error('Delete failed');
    } finally {
      setConfirming(false);
    }
  };

  const folderCount = stats?.folderCount ?? 0;
  const fileCount = stats?.fileCount ?? 0;

  const buildDescription = () => {
    if (statsLoading) return null;
    if (folderCount === 0 && fileCount === 0) {
      return `"${folder?.name}" is empty and will be permanently deleted.`;
    }
    const parts: string[] = [];
    if (folderCount > 0) parts.push(`${folderCount} folder${folderCount !== 1 ? 's' : ''}`);
    if (fileCount > 0) parts.push(`${fileCount} file${fileCount !== 1 ? 's' : ''}`);
    return `This will permanently delete "${folder?.name}" and all its contents: ${parts.join(' and ')}.`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete folder?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              {statsLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading contents…
                </span>
              ) : (
                buildDescription()
              )}
              <span className="mt-2 block text-sm font-medium text-destructive">
                This action cannot be undone.
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={statsLoading || confirming}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
