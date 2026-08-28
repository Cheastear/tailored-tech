import { useRef, useState } from 'react';
import { FolderPlus, Search, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { rejectOversized } from '@/lib/upload';
import { useNavigation } from '@/context/NavigationContext';
import { useCanWrite } from '@/hooks/useCanWrite';
import { useGetFilesQuery, useUploadFilesMutation } from '@/store/spacesApi';
import { ContentArea } from './ContentArea';
import { CreateFolderDialog } from './CreateFolderDialog';
import { UploadModal } from './UploadModal';
import { UploadToast, type UploadProgress } from './UploadToast';

export function FilesCard() {
  const { spaceId, folderId } = useNavigation();
  const canWrite = useCanWrite();
  const { refetch: refetchFiles } = useGetFilesQuery(
    { spaceId: spaceId!, folderId },
    { skip: !spaceId },
  );
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [upload] = useUploadFilesMutation();

  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);

  const isFileDrop = (e: React.DragEvent) =>
    e.dataTransfer.types.includes('Files') &&
    !e.dataTransfer.types.includes('application/x-drag-item');

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!spaceId || !canWrite || !isFileDrop(e)) return;
    dragCounter.current++;
    if (dragCounter.current === 1) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFileDrop(e)) return;
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    if (!isFileDrop(e)) return;
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (!spaceId || !canWrite) return;

    const { valid: files, rejected } = rejectOversized(Array.from(e.dataTransfer.files));
    rejected.forEach((f) => toast.error(`${f.name} exceeds the 500 MB limit`));
    if (!files.length) return;

    await Promise.all(
      files.map(async (file) => {
        let toastId: string | number;
        let progress: UploadProgress = { loaded: 0, total: file.size, speed: 0 };
        let lastLoaded = 0;
        let lastTick = Date.now();
        let lastToastUpdate = 0;

        let mutation: ReturnType<typeof upload>;
        const cancel = () => {
          mutation.abort();
          toast.dismiss(toastId);
        };

        const onProgress = (loaded: number, total: number) => {
          const now = Date.now();
          const dt = (now - lastTick) / 1000;
          if (dt >= 0.1) {
            progress = { loaded, total, speed: (loaded - lastLoaded) / dt };
            lastLoaded = loaded;
            lastTick = now;
          } else {
            progress = { ...progress, loaded, total };
          }
          if (now - lastToastUpdate >= 100) {
            lastToastUpdate = now;
            toast.custom(
              () => (
                <UploadToast
                  status="uploading"
                  fileName={file.name}
                  onCancel={cancel}
                  progress={progress}
                />
              ),
              { id: toastId, duration: Infinity },
            );
          }
        };

        mutation = upload({ spaceId, folderId, files: [file], onProgress });

        toastId = toast.custom(
          () => (
            <UploadToast
              status="uploading"
              fileName={file.name}
              onCancel={cancel}
              progress={progress}
            />
          ),
          { duration: Infinity },
        );

        try {
          await mutation.unwrap();
          refetchFiles();
          toast.custom(() => <UploadToast status="done" fileName={file.name} />, {
            id: toastId,
            duration: 2500,
          });
        } catch (err: unknown) {
          const isAbort = (err as any)?.error === 'Aborted';
          if (isAbort) {
            toast.dismiss(toastId);
          } else {
            const message = (err as any)?.data?.message ?? 'Upload failed';
            toast.custom(
              () => <UploadToast status="error" fileName={file.name} errorMessage={message} />,
              { id: toastId, duration: 4000 },
            );
          }
        }
      }),
    );
  };

  return (
    <>
      <Card
        className="relative"
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-card/50 backdrop-blur-sm transition-all duration-200',
            dragging ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
        >
          <Upload className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-primary">Drop to upload</p>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search files and folders…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            {canWrite && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  New folder
                </Button>
                <Button size="sm" className="shrink-0" onClick={() => setUploadOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <ContentArea
            search={search}
            onUpload={() => setUploadOpen(true)}
            onNewFolder={() => setCreateFolderOpen(true)}
          />
        </CardContent>
      </Card>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} />
    </>
  );
}
