import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetMeQuery, useUpdateProfileMutation, useUploadAvatarMutation } from '@/store/authApi';

function getInitials(name?: string | null, email?: string | null) {
  if (name)
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  return email?.[0]?.toUpperCase() ?? '?';
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
  const { data: user } = useGetMeQuery();
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();

  const [nameInput, setNameInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) setNameInput(user.name ?? '');
  }, [user?.name, open]);

  useEffect(() => {
    if (!open) {
      setAvatarPreview(null);
      setPendingAvatarFile(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    try {
      if (pendingAvatarFile) {
        const fd = new FormData();
        fd.append('avatar', pendingAvatarFile);
        await uploadAvatar(fd).unwrap();
        setPendingAvatarFile(null);
      }

      const trimmed = nameInput.trim();
      if (trimmed !== (user?.name ?? '')) {
        await updateProfile({ name: trimmed }).unwrap();
      }

      toast.success('Profile updated');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await updateProfile({ currentPassword, newPassword }).unwrap();
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: unknown) {
      const message = (err as any)?.data?.message ?? 'Failed to change password';
      toast.error(message);
    }
  };

  const nameChanged = nameInput.trim() !== (user?.name ?? '');
  const profileDirty = nameChanged || !!pendingAvatarFile;
  const displayAvatar = avatarPreview ?? user?.avatar ?? undefined;
  const hasPassword = user?.hasPassword ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile">
          <TabsList className="w-full">
            <TabsTrigger value="profile" className="flex-1">
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex-1">
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile tab */}
          <TabsContent value="profile" className="space-y-5 pt-2">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={displayAvatar} />
                  <AvatarFallback className="text-xl">
                    {getInitials(user?.name, user?.email)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
                  disabled={isUploadingAvatar}
                >
                  <Camera className="h-3 w-3" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-xs text-muted-foreground">Click the camera icon to change</p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Display name</Label>
              <Input
                id="profile-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && profileDirty && handleSaveProfile()}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled className="text-muted-foreground" />
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={!profileDirty || isSavingProfile || isUploadingAvatar}
              className="w-full"
            >
              {(isSavingProfile || isUploadingAvatar) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Save profile
            </Button>
          </TabsContent>

          {/* Security tab */}
          <TabsContent value="security" className="space-y-4 pt-2">
            {!hasPassword && (
              <p className="text-sm text-muted-foreground rounded-md border px-3 py-2">
                Your account uses Google sign-in. Password change is not available.
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={!hasPassword}
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!hasPassword}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
                disabled={!hasPassword}
                autoComplete="new-password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={
                !hasPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                isSavingProfile
              }
              className="w-full"
            >
              {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Change password
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
