import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigation } from '@/context/NavigationContext';
import { useUploadFilesMutation } from '@/store/spacesApi';
import { ContentArea } from './ContentArea';
import { UploadToast } from './UploadToast';

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

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    await Promise.all(
      files.map(async (file) => {
        const toastId = toast.custom(
          () => <UploadToast status="uploading" fileName={file.name} />,
          { duration: Infinity },
        );

        await upload({ spaceId, folderId, files: [file] });

        toast.custom(
          () => <UploadToast status="done" fileName={file.name} />,
          { id: toastId, duration: 2500 },
        );
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
