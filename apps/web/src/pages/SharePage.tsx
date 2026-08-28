import { useState } from 'react';
import { CornerLeftUp, Folder, Loader2, Mail } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useResolveShareTokenQuery,
  useSharePublicFoldersQuery,
  useSharePublicFilesQuery,
} from '@/store/sharesPublicApi';
import { FilePreviewModal } from '@/components/dashboard/FilePreviewModal';
import { apiBase } from '@/lib/api';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { SpaceFile } from '@/types/file';
import type { Folder as FolderType } from '@/types/folder';

interface NavEntry {
  id: string;
  name: string;
}

export function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [emailInput, setEmailInput] = useState('');
  const [confirmedEmail, setConfirmedEmail] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<NavEntry[]>([]);
  const [previewFile, setPreviewFile] = useState<SpaceFile | null>(null);

  const currentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1].id : undefined;

  const {
    data: share,
    isLoading: shareLoading,
    error: shareError,
  } = useResolveShareTokenQuery({ token: token!, email: confirmedEmail }, { skip: !token });

  const errorStatus = (shareError as any)?.status;
  const is403 = errorStatus === 403;
  const is429 = errorStatus === 429;
  const isNotFound = errorStatus === 404;

  const { data: folders = [], isLoading: foldersLoading } = useSharePublicFoldersQuery(
    { token: token!, parentId: currentFolderId, email: confirmedEmail },
    { skip: !token || !share },
  );

  const { data: files = [], isLoading: filesLoading } = useSharePublicFilesQuery(
    { token: token!, folderId: currentFolderId, email: confirmedEmail },
    { skip: !token || !share },
  );

  const enterFolder = (folder: FolderType) => {
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const goUp = () => {
    setFolderPath((prev) => prev.slice(0, -1));
  };

  const downloadUrl = (fileId: string) => {
    const base = `${apiBase}/shares/resolve/${token}/download/${fileId}`;
    return confirmedEmail ? `${base}?email=${encodeURIComponent(confirmedEmail)}` : base;
  };

  if (!token || isNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">
          This share link is invalid or has been revoked.
        </p>
      </div>
    );
  }

  if (is429) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-3 text-center">
          <h1 className="text-xl font-semibold">Too many attempts</h1>
          <p className="text-sm text-muted-foreground">
            Too many incorrect attempts. Please wait a minute and try again.
          </p>
        </div>
      </div>
    );
  }

  if (shareLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (is403 || (!share && !shareLoading)) {
    const wrongEmail = is403 && !!confirmedEmail;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h1 className="text-xl font-semibold">Access restricted</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email address to view this shared content.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="share-email">Email address</Label>
            <Input
              id="share-email"
              type="email"
              placeholder="you@example.com"
              value={emailInput}
              onChange={(e) => {
                setEmailInput(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && setConfirmedEmail(emailInput.trim())}
              className={wrongEmail ? 'border-destructive' : ''}
              autoFocus
            />
            {wrongEmail && (
              <p className="text-sm text-destructive">
                That email isn't authorized. Please try a different one.
              </p>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => setConfirmedEmail(emailInput.trim())}
            disabled={!emailInput.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  const isContentLoading = foldersLoading || filesLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">DataRoom</span>
            <span className="text-muted-foreground">/</span>
            {folderPath.length === 0 ? (
              <span className="text-sm text-muted-foreground">Shared content</span>
            ) : (
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={() => setFolderPath([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Shared content
                </button>
                {folderPath.map((entry, i) => (
                  <span key={entry.id} className="flex items-center gap-1">
                    <span className="text-muted-foreground">/</span>
                    <button
                      onClick={() => setFolderPath((prev) => prev.slice(0, i + 1))}
                      className={cn(
                        i === folderPath.length - 1
                          ? 'font-medium'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {entry.name}
                    </button>
                  </span>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {isContentLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {(folderPath.length > 0 || folders.length > 0) && (
              <section>
                <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Folders
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {folderPath.length > 0 && (
                    <button
                      onClick={goUp}
                      className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <CornerLeftUp className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">..</span>
                    </button>
                  )}
                  {folders.map((folder) => {
                    const count = folder._count.children + folder._count.files;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => enterFolder(folder)}
                        className="flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Folder className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{folder.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
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
                    <div
                      key={file.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setPreviewFile(file)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {folders.length === 0 && files.length === 0 && folderPath.length === 0 && (
              <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">
                Nothing shared here.
              </div>
            )}
          </div>
        )}
      </main>

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        downloadUrl={previewFile ? downloadUrl(previewFile.id) : ''}
      />
    </div>
  );
}
