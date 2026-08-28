export type DragItem =
  { kind: 'file'; id: string; name: string } | { kind: 'folder'; id: string; name: string };

const MIME = 'application/x-drag-item';

export function setDragItem(e: React.DragEvent, item: DragItem) {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData(MIME, JSON.stringify(item));
}

export function getDragItem(e: React.DragEvent): DragItem | null {
  try {
    const raw = e.dataTransfer.getData(MIME);
    return raw ? (JSON.parse(raw) as DragItem) : null;
  } catch {
    return null;
  }
}

export function isDragItem(e: React.DragEvent) {
  return e.dataTransfer.types.includes(MIME);
}
