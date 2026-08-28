import { useState } from 'react';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigation } from '@/context/NavigationContext';
import { useGetMeQuery } from '@/store/authApi';
import { useAddMemberMutation, useGetSpaceQuery, useRemoveMemberMutation } from '@/store/spacesApi';

function initials(name: string | null, email: string) {
  const src = name ?? email;
  return src.slice(0, 2).toUpperCase();
}

export function MembersView() {
  const { spaceId } = useNavigation();
  const { data: space } = useGetSpaceQuery(spaceId!, { skip: !spaceId });
  const { data: me } = useGetMeQuery();
  const [addMember, { isLoading: isAdding }] = useAddMemberMutation();
  const [removeMember] = useRemoveMemberMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'READER' | 'WRITER'>('READER');

  const isOwner = space?.ownerId === me?.id;

  const handleAdd = async () => {
    if (!spaceId || !email.trim()) return;
    try {
      await addMember({ spaceId, email: email.trim(), role }).unwrap();
      toast.success(`${email.trim()} added`);
      setEmail('');
      setRole('READER');
      setDialogOpen(false);
    } catch (err: unknown) {
      const message = (err as any)?.data?.message ?? 'Failed to add member';
      toast.error(message);
    }
  };

  const handleRemove = async (userId: string, displayName: string) => {
    if (!spaceId) return;
    try {
      await removeMember({ spaceId, userId }).unwrap();
      toast.success(`${displayName} removed`);
    } catch {
      toast.error('Failed to remove member');
    }
  };

  if (!space) return null;

  return (
    <>
      <Card className="max-w-4xl mx-auto px-1.5rem">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                Members
              </p>
              <h2 className="text-xl font-semibold">{space.name}</h2>
            </div>
            {isOwner && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Add member
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ul>
            {/* Owner row */}
            <MemberRow
              avatarUrl={space.owner.avatar}
              abbr={initials(space.owner.name, space.owner.email)}
              name={space.owner.name}
              email={space.owner.email}
              role="OWNER"
              isSelf={me?.id === space.owner.id}
              canRemove={false}
              onRemove={() => {}}
            />

            {/* Regular members */}
            {space.members.map((member) => (
              <MemberRow
                key={member.user.id}
                avatarUrl={member.user.avatar}
                abbr={initials(member.user.name, member.user.email)}
                name={member.user.name}
                email={member.user.email}
                role={member.role}
                isSelf={me?.id === member.user.id}
                canRemove={isOwner && me?.id !== member.user.id}
                onRemove={() => handleRemove(member.user.id, member.user.name ?? member.user.email)}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-email">Email address</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as 'READER' | 'WRITER')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READER">Reader — view &amp; download files</SelectItem>
                  <SelectItem value="WRITER">Writer — upload &amp; delete files</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!email.trim() || isAdding}>
              {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MemberRowProps {
  avatarUrl: string | null;
  abbr: string;
  name: string | null;
  email: string;
  role: string;
  isSelf: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

function MemberRow({
  avatarUrl,
  abbr,
  name,
  email,
  role,
  isSelf,
  canRemove,
  onRemove,
}: MemberRowProps) {
  const badgeVariant = role === 'OWNER' ? 'default' : role === 'WRITER' ? 'secondary' : 'outline';

  return (
    <li className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50">
      <Avatar className="h-8 w-8 shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} />}
        <AvatarFallback className="text-xs">{abbr}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {name ?? email}
          {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
        </p>
        {name && <p className="truncate text-xs text-muted-foreground">{email}</p>}
      </div>

      <Badge variant={badgeVariant} className="shrink-0 capitalize">
        {role.toLowerCase()}
      </Badge>

      {canRemove ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <div className="h-7 w-7 shrink-0" />
      )}
    </li>
  );
}
