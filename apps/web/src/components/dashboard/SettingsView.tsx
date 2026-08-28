import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigation } from '@/context/NavigationContext';
import { useGetSpaceQuery, useDeleteSpaceMutation } from '@/store/spacesApi';
import { useGetMeQuery } from '@/store/authApi';

const DELETE_PHRASE = 'delete my space';

export function SettingsView() {
  const { spaceId, setActiveView } = useNavigation();
  const [, setSearchParams] = useSearchParams();
  const { data: space } = useGetSpaceQuery(spaceId!, { skip: !spaceId });
  const { data: me } = useGetMeQuery();
  const [deleteSpace, { isLoading: isDeleting }] = useDeleteSpaceMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const isOwner = space?.ownerId === me?.id;
  const canDelete = deleteInput === DELETE_PHRASE;

  const handleOpenDialog = () => {
    setDeleteInput('');
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!spaceId || !canDelete) return;
    try {
      const name = space?.name;
      await deleteSpace(spaceId).unwrap();
      setDialogOpen(false);
      toast.success(`"${name}" has been deleted`);
      setActiveView('files');
      setSearchParams({});
    } catch {
      toast.error('Failed to delete space');
    }
  };

  if (!space) return null;

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto px-1.5rem">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Space info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <p className="text-sm font-medium">{space.name}</p>
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-destructive">Danger zone</CardTitle>
              <CardDescription>
                Deleting this space permanently removes all files, folders, and member access. This
                cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button variant="destructive" onClick={handleOpenDialog}>
                <Trash2 className="h-4 w-4" />
                Delete this space
              </Button>
            </CardContent>
          </Card>
        )}

        {!isOwner && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Only the space owner can manage settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete space</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{space.name}</strong> and all its files. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              Type{' '}
              <span className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                {DELETE_PHRASE}
              </span>{' '}
              to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && canDelete && handleDelete()}
              placeholder={DELETE_PHRASE}
              className="font-mono text-sm"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete || isDeleting}
              onClick={handleDelete}
            >
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
