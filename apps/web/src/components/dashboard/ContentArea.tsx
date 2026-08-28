import { useState } from 'react';
import { CornerLeftUp, Loader2, SearchX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getDragItem, isDragItem, type DragItem } from '@/lib/dnd';
import { useNavigation } from '@/context/NavigationContext';
import { useCanWrite } from '@/hooks/useCanWrite';
import {
  useDeleteFileMutation,
  useDeleteFolderMutation,
  useGetFilesQuery,
  useGetFoldersQuery,
  useMoveFileMutation,
  useMoveFolderMutation,
} from '@/store/spacesApi';
import { EmptyFiles } from './EmptyFiles';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';

// The ".." entry — navigates up and accepts drops to move items to the parent
function ParentFolderItem({ parentFolderId }: { parentFolderId: string | null }) {
  const { spaceId, folderPath, navigateTo } = useNavigation();
  const [moveFile] = useMoveFileMutation();
  const [moveFolder] = useMoveFolderMutation();
  const [isOver, setIsOver] = useState(false);
  const [counter, setCounter] = useState(0);

  const goUp = () => navigateTo(folderPath.length - 2);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    setCounter((n) => n + 1);
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragItem(e)) return;
    setCounter((n) => {
      const next = n - 1;
      if (next <= 0) setIsOver(false);
      return next;
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setCounter(0);
    setIsOver(false);
    const item = getDragItem(e);
    if (!item || !spaceId) return;
    try {
      if (item.kind === 'file') {
        await moveFile({ spaceId, fileId: item.id, folderId: parentFolderId }).unwrap();
      } else {
        await moveFolder({ spaceId, folderId: item.id, parentId: parentFolderId }).unwrap();
      }
      toast.success(`Moved "${item.name}" to ${parentFolderId ? 'parent folder' : 'root'}`);
    } catch (err: unknown) {
      toast.error((err as any)?.data?.message ?? 'Move failed');
    }
  };

  // suppress unused warning
  void counter;

  return (
    <button
      onClick={goUp}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors',
        isOver
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'hover:bg-accent/50',
      )}
    >
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors',
        isOver ? 'bg-primary/20' : 'bg-muted',
      )}>
        <CornerLeftUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">..</span>
    </button>
  );
}

interface ContentAreaProps {
  search: string;
  onUpload: () => void;
  onNewFolder: () => void;
}

export function ContentArea({ search, onUpload, onNewFolder }: ContentAreaProps) {
  const { spaceId, folderId, folderPath } = useNavigation();
  const canWrite = useCanWrite();
  const [deleteFile] = useDeleteFileMutation();
  const [deleteFolder] = useDeleteFolderMutation();

  const [draggingItem, setDraggingItem] = useState<DragItem | null>(null);
  const [overTrash, setOverTrash] = useState(false);

  const foldersQuery = useGetFoldersQuery(
    { spaceId: spaceId!, parentId: folderId },
    { skip: !spaceId },
  );
  const filesQuery = useGetFilesQuery({ spaceId: spaceId!, folderId }, { skip: !spaceId });

  const handleDragEnd = () => {
    setDraggingItem(null);
    setOverTrash(false);
  };

  const handleTrashDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setOverTrash(false);
    const item = getDragItem(e);
    if (!item || !spaceId) return;

    try {
      if (item.kind === 'file') {
        await deleteFile({ spaceId, fileId: item.id }).unwrap();
      } else {
        await deleteFolder({ spaceId, folderId: item.id }).unwrap();
      }
      toast.success(`"${item.name}" deleted`);
    } catch {
      toast.error('Delete failed');
    }
    setDraggingItem(null);
  };

  if (!spaceId) {
    return (
      <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
        Select a space to get started
      </div>
    );
  }

  const isLoading = foldersQuery.isLoading || filesQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const folders = foldersQuery.data ?? [];
  const files = filesQuery.data ?? [];

  const q = search.trim().toLowerCase();
  const filteredFolders = q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  const filteredFiles = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;

  const isEmpty = folders.length === 0 && files.length === 0;
  const noResults = !!q && filteredFolders.length === 0 && filteredFiles.length === 0;

  return (
    <div className="space-y-6">
      {isEmpty ? (
        <EmptyFiles canWrite={canWrite} onUpload={onUpload} onNewFolder={onNewFolder} />
      ) : noResults ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-1.5 text-center">
          <SearchX className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No results for &ldquo;{search}&rdquo;</p>
          <p className="text-xs text-muted-foreground">Try a different name</p>
        </div>
      ) : (
        <>
          {(folderId || filteredFolders.length > 0) && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Folders
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {folderId && (
                  <ParentFolderItem
                    parentFolderId={folderPath.length >= 2 ? folderPath[folderPath.length - 2].id : null}
                  />
                )}
                {filteredFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onDragStart={setDraggingItem}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredFiles.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Files
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFiles.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onDragStart={setDraggingItem}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Trash drop zone — always mounted, expands/collapses smoothly */}
      {canWrite && (
        <div
          onDragOver={(e) => { e.preventDefault(); setOverTrash(true); }}
          onDragLeave={() => setOverTrash(false)}
          onDrop={handleTrashDrop}
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all duration-200 ease-in-out overflow-hidden pointer-events-none',
            draggingItem
              ? 'max-h-20 py-5 opacity-100 pointer-events-auto'
              : 'max-h-0 py-0 opacity-0',
            overTrash
              ? 'border-destructive bg-destructive/10 text-destructive'
              : 'border-muted-foreground/25 text-muted-foreground',
          )}
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-sm font-medium">Drop here to delete</span>
        </div>
      )}
    </div>
  );
}
