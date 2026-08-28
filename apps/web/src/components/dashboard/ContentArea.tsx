import { SearchX } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useCanWrite } from '@/hooks/useCanWrite';
import { useGetFilesQuery, useGetFoldersQuery } from '@/store/spacesApi';
import { EmptyFiles } from './EmptyFiles';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';

interface ContentAreaProps {
  search: string;
  onUpload: () => void;
  onNewFolder: () => void;
}

export function ContentArea({ search, onUpload, onNewFolder }: ContentAreaProps) {
  const { spaceId, folderId } = useNavigation();
  const canWrite = useCanWrite();

  const foldersQuery = useGetFoldersQuery(
    { spaceId: spaceId!, parentId: folderId },
    { skip: !spaceId },
  );
  const filesQuery = useGetFilesQuery({ spaceId: spaceId!, folderId }, { skip: !spaceId });

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
  const noResults = q && filteredFolders.length === 0 && filteredFiles.length === 0;

  if (isEmpty) {
    return <EmptyFiles canWrite={canWrite} onUpload={onUpload} onNewFolder={onNewFolder} />;
  }

  if (noResults) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-1.5 text-center">
        <SearchX className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">No results for &ldquo;{search}&rdquo;</p>
        <p className="text-xs text-muted-foreground">Try a different name</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredFolders.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Folders
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFolders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} />
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
              <FileItem key={file.id} file={file} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
