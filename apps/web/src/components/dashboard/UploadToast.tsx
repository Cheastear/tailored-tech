import { useEffect, useState } from 'react';
import { CheckCircle2, Upload } from 'lucide-react';

interface Props {
  status: 'uploading' | 'done' | 'error';
  fileName: string;
}

export function UploadToast({ status, fileName }: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (status === 'uploading') {
      const t = setTimeout(() => setWidth(75), 30);
      return () => clearTimeout(t);
    }
    if (status === 'done' || status === 'error') {
      setWidth(100);
    }
  }, [status]);

  return (
    <div className="relative w-72 overflow-hidden rounded-lg border bg-background px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        {status === 'done' ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
        ) : (
          <Upload className="h-5 w-5 shrink-0 animate-pulse text-muted-foreground" />
        )}
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={fileName}>
          {fileName}
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 h-0.5 bg-primary"
        style={{
          width: `${width}%`,
          transition:
            status === 'uploading'
              ? 'width 8s cubic-bezier(0.05, 0.6, 0.3, 1)'
              : 'width 300ms ease-in-out',
        }}
      />
    </div>
  );
}
