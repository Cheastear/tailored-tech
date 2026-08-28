import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGetMeQuery, useLogoutMutation } from '@/store/authApi';

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return email?.[0]?.toUpperCase() ?? '?';
}

export function UserFooter() {
  const navigate = useNavigate();
  const { data: user } = useGetMeQuery();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <Separator />
      <div className="flex items-center gap-2.5 px-4 py-3">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.avatar ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(user?.name, user?.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium leading-none">{user?.name ?? user?.email}</p>
          {user?.name && (
            <p className="truncate text-xs text-muted-foreground mt-0.5">{user.email}</p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={handleLogout}
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
