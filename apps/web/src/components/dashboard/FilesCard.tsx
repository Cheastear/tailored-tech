import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rejectOversized } from '@/lib/upload';
import { useNavigation } from '@/context/NavigationContext';
import { useUploadFilesMutation } from '@/store/spacesApi';
import { ContentArea } from './ContentArea';
import { UploadToast, type UploadProgress } from './UploadToast';

export function FilesCard() {
  const { spaceId, folderId } = useNavigation();
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const [upload] = useUploadFilesMutation();

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!spaceId) return;
    dragCounter.current++;
    if (dragCounter.current === 1) setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (!spaceId) return;

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

        // mutation is assigned before user can interact — safe to reference in cancel
        let mutation: ReturnType<typeof upload>;
        const cancel = () => { mutation.abort(); toast.dismiss(toastId); };

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

          // throttle toast re-renders to ~10 fps
          if (now - lastToastUpdate >= 100) {
            lastToastUpdate = now;
            toast.custom(
              () => <UploadToast status="uploading" fileName={file.name} onCancel={cancel} progress={progress} />,
              { id: toastId, duration: Infinity },
            );
          }
        };

        mutation = upload({ spaceId, folderId, files: [file], onProgress });

        toastId = toast.custom(
          () => <UploadToast status="uploading" fileName={file.name} onCancel={cancel} progress={progress} />,
          { duration: Infinity },
        );

        try {
          await mutation.unwrap();
          toast.custom(
            () => <UploadToast status="done" fileName={file.name} />,
            { id: toastId, duration: 2500 },
          );
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
    <Card
      className="relative"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5">
          <Upload className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-primary">Drop to upload</p>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Files</CardTitle>
      </CardHeader>

      <CardContent>
        <ContentArea />
      </CardContent>
    </Card>
  );
}
