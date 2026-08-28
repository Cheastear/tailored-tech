import { Loader2 } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useGetFilesQuery, useGetFoldersQuery } from '@/store/spacesApi';
import { EmptyFiles } from './EmptyFiles';
import { FileItem } from './FileItem';
import { FolderItem } from './FolderItem';

export function ContentArea() {
  const { spaceId, folderId } = useNavigation();

  const foldersQuery = useGetFoldersQuery(
    { spaceId: spaceId!, parentId: folderId },
    { skip: !spaceId },
  );

  const filesQuery = useGetFilesQuery(
    { spaceId: spaceId!, folderId },
    { skip: !spaceId },
  );

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
  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyFiles />;
  }

  return (
    <div className="space-y-6">
      {folders.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Folders
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <FolderItem key={folder.id} folder={folder} />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Files
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileItem key={file.id} file={file} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
