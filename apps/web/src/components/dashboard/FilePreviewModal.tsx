import { useEffect, useState } from 'react';
import { Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatBytes } from '@/lib/format';
import type { SpaceFile } from '@/types/file';

interface FilePreviewModalProps {
  file: SpaceFile | null;
  onClose: () => void;
  downloadUrl: string;
}

function isTextType(mimeType: string) {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/xml' ||
    mimeType === 'application/json' ||
    mimeType === 'application/javascript'
  );
}

function TextPreview({ url }: { url: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    fetch(`${url}?inline=true`, { credentials: 'include' })
      .then((r) => r.text())
      .then(setText)
      .catch(() => setText('Could not load file content.'));
  }, [url]);

  if (text === null) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <pre className="h-full overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed whitespace-pre-wrap break-words">
      {text}
    </pre>
  );
}

export function FilePreviewModal({ file, onClose, downloadUrl }: FilePreviewModalProps) {
  const inlineUrl = downloadUrl ? `${downloadUrl}?inline=true` : '';

  const renderPreview = () => {
    if (!file) return null;

    if (file.mimeType.startsWith('image/')) {
      return (
        <img
          src={inlineUrl}
          alt={file.name}
          className="w-full rounded-md object-contain"
        />
      );
    }

    if (file.mimeType === 'application/pdf') {
      return (
        <div className="aspect-[9/16] w-full">
          <iframe src={inlineUrl} title={file.name} className="h-full w-full rounded-md border" />
        </div>
      );
    }

    if (isTextType(file.mimeType)) {
      return <TextPreview url={downloadUrl} />;
    }

    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <File className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {file.mimeType} · {formatBytes(file.size)}
          </p>
        </div>
        <Button asChild>
          <a href={downloadUrl} download={file.name}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </a>
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-4 pr-8">
            <DialogTitle className="truncate">{file?.name}</DialogTitle>
            {file && (
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <a href={downloadUrl} download={file.name}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{renderPreview()}</div>
      </DialogContent>
    </Dialog>
  );
}
