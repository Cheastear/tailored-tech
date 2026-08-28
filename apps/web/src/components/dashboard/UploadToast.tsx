import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { formatBytes } from '@/lib/format';

export interface UploadProgress {
  loaded: number;
  total: number;
  speed: number; // bytes/sec
}

interface Props {
  status: 'uploading' | 'done' | 'error';
  fileName: string;
  onCancel?: () => void;
  progress?: UploadProgress;
  errorMessage?: string;
}

export function UploadToast({ status, fileName, onCancel, progress, errorMessage }: Props) {
  const [simulatedWidth, setSimulatedWidth] = useState(0);

  useEffect(() => {
    if (progress) return;
    if (status === 'uploading') {
      const t = setTimeout(() => setSimulatedWidth(75), 30);
      return () => clearTimeout(t);
    }
    if (status === 'done' || status === 'error') {
      setSimulatedWidth(100);
    }
  }, [status, progress]);

  const realWidth =
    progress && progress.total > 0 ? (progress.loaded / progress.total) * 100 : null;

  const isProcessing = status === 'uploading' && realWidth !== null && realWidth >= 100;

  const barWidth =
    status === 'done' || status === 'error' || isProcessing ? 100 : (realWidth ?? simulatedWidth);

  const barTransition =
    status === 'done' || status === 'error'
      ? 'width 300ms ease-in-out'
      : realWidth !== null
        ? 'width 200ms linear'
        : 'width 8s cubic-bezier(0.05, 0.6, 0.3, 1)';

  const barColor = status === 'error' ? 'bg-destructive' : 'bg-primary';

  return (
    <div className="relative w-72 overflow-hidden rounded-lg border bg-background px-4 py-3 shadow-lg">
      <div className="flex items-center gap-3">
        {status === 'done' && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />}
        {status === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />}
        {status === 'uploading' && (
          <Upload className="h-5 w-5 shrink-0 animate-pulse text-muted-foreground" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={fileName}>
            {fileName}
          </p>
          {status === 'uploading' && progress && progress.total > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isProcessing ? (
                'Processing…'
              ) : (
                <>
                  {formatBytes(progress.loaded)} of {formatBytes(progress.total)}
                  {progress.speed > 0 && <> · {formatBytes(Math.round(progress.speed))}/s</>}
                </>
              )}
            </p>
          )}
          {status === 'error' && errorMessage && (
            <p className="mt-0.5 text-xs text-destructive">{errorMessage}</p>
          )}
        </div>

        {status === 'uploading' && onCancel && (
          <button
            onClick={onCancel}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={`absolute bottom-0 left-0 h-0.5 ${barColor}${isProcessing ? ' animate-pulse' : ''}`}
        style={{ width: `${barWidth}%`, transition: barTransition }}
      />
    </div>
  );
}
