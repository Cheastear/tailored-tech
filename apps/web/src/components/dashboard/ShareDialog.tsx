import { useState } from 'react';
import { Check, Copy, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateShareMutation,
  useGetSharesForSpaceQuery,
  useRevokeShareMutation,
} from '@/store/spacesApi';
import type { Share } from '@/types/share';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'SPACE' | 'FOLDER' | 'FILE';
  resourceId: string;
  spaceId: string;
}

function resourceLabel(type: 'SPACE' | 'FOLDER' | 'FILE') {
  if (type === 'SPACE') return 'Space';
  if (type === 'FOLDER') return 'Folder';
  return 'File';
}

function resourceIdField(type: 'SPACE' | 'FOLDER' | 'FILE', id: string) {
  if (type === 'SPACE') return { spaceId: id };
  if (type === 'FOLDER') return { folderId: id };
  return { fileId: id };
}

function matchesResource(share: Share, resourceType: string, resourceId: string) {
  if (share.resourceType !== resourceType) return false;
  if (resourceType === 'SPACE') return share.spaceId === resourceId;
  if (resourceType === 'FOLDER') return share.folderId === resourceId;
  return share.fileId === resourceId;
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}

export function ShareDialog({ open, onOpenChange, resourceType, resourceId, spaceId }: ShareDialogProps) {
  const [mode, setMode] = useState<'PUBLIC' | 'PERMISSIONED'>('PUBLIC');
  const [emailInput, setEmailInput] = useState('');

  const { data: allShares = [], isLoading: sharesLoading } = useGetSharesForSpaceQuery(spaceId, {
    skip: !open,
  });
  const [createShare, { isLoading: creating }] = useCreateShareMutation();
  const [revokeShare] = useRevokeShareMutation();

  const activeShares = allShares.filter((s) => matchesResource(s, resourceType, resourceId));

  const handleCreate = async () => {
    const allowedEmails =
      mode === 'PERMISSIONED'
        ? emailInput
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
        : [];

    if (mode === 'PERMISSIONED' && allowedEmails.length === 0) {
      toast.error('Add at least one email for a permissioned link');
      return;
    }

    try {
      await createShare({
        mode,
        resourceType,
        allowedEmails,
        ...resourceIdField(resourceType, resourceId),
      }).unwrap();
      toast.success('Share link created');
      setEmailInput('');
    } catch (err: unknown) {
      toast.error((err as any)?.data?.message ?? 'Failed to create share');
    }
  };

  const handleRevoke = async (share: Share) => {
    try {
      await revokeShare(share.id).unwrap();
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {resourceLabel(resourceType)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Access type</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === 'PUBLIC' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('PUBLIC')}
              >
                Public
              </Button>
              <Button
                variant={mode === 'PERMISSIONED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('PERMISSIONED')}
              >
                Restricted
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'PUBLIC'
                ? 'Anyone with the link can view the content.'
                : 'Only people with the specified emails can access this link.'}
            </p>

            {mode === 'PERMISSIONED' && (
              <div className="space-y-1.5">
                <Label htmlFor="share-emails">Allowed emails</Label>
                <Input
                  id="share-emails"
                  placeholder="alice@example.com, bob@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            )}

            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create link
            </Button>
          </div>

          {(sharesLoading || activeShares.length > 0) && (
            <div className="space-y-2 border-t pt-4">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Active links
              </Label>
              {sharesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading…
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeShares.map((share) => (
                    <li
                      key={share.id}
                      className="flex items-center gap-2 rounded-md border px-3 py-2"
                    >
                      <Badge variant={share.mode === 'PUBLIC' ? 'secondary' : 'outline'} className="shrink-0 text-xs">
                        {share.mode === 'PUBLIC' ? 'Public' : 'Restricted'}
                      </Badge>
                      <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
                        /share/{share.token.slice(0, 8)}…
                      </span>
                      <CopyButton token={share.token} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRevoke(share)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
