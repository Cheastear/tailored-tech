import { useState } from 'react';
import { Files, FolderOpen, Plus } from 'lucide-react';
import { useNavigation } from '@/context/NavigationContext';
import { useGetSpacesQuery } from '@/store/spacesApi';
import type { Space } from '@/types/space';
import { CreateSpaceDialog } from './CreateSpaceDialog';

function SpaceCard({ space, onSelect }: { space: Space; onSelect: () => void }) {
  const letter = space.name[0].toUpperCase();
  const files = space._count.files;
  const folders = space._count.folders;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        {letter}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{space.name}</p>
        <p className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Files className="h-3 w-3" />
            {files} {files === 1 ? 'file' : 'files'}
          </span>
          <span className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            {folders} {folders === 1 ? 'folder' : 'folders'}
          </span>
        </p>
      </div>
    </button>
  );
}

function NewSpaceCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-4 rounded-xl border border-dashed bg-card p-5 text-left shadow-sm transition-all hover:border-primary/60 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground">
        <Plus className="h-5 w-5" />
      </div>
      <p className="font-medium text-muted-foreground">New space</p>
    </button>
  );
}

export function SpacePickerView() {
  const { data: spaces = [] } = useGetSpacesQuery();
  const { setSpace } = useNavigation();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Your spaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a space to continue, or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} onSelect={() => setSpace(space)} />
          ))}
          <NewSpaceCard onClick={() => setCreateOpen(true)} />
        </div>
      </div>

      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
