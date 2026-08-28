import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigation } from '@/context/NavigationContext';
import { useCreateSpaceMutation } from '@/store/spacesApi';

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const { setSpace } = useNavigation();
  const [createSpace, { isLoading }] = useCreateSpaceMutation();
  const [name, setName] = useState('');

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const space = await createSpace({ name: trimmed }).unwrap();
      toast.success(`"${space.name}" created`);
      setSpace(space);
      setName('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create space');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!isLoading) {
          if (!o) setName('');
          onOpenChange(o);
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New space</DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="new-space-name">Name</Label>
          <Input
            id="new-space-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="My space"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
