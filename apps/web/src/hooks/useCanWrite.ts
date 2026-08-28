import { useGetMeQuery } from '@/store/authApi';
import { useGetSpaceQuery } from '@/store/spacesApi';
import { useNavigation } from '@/context/NavigationContext';

export function useCanWrite() {
  const { spaceId } = useNavigation();
  const { data: space } = useGetSpaceQuery(spaceId!, { skip: !spaceId });
  const { data: me } = useGetMeQuery();
  if (!space || !me) return false;
  if (space.ownerId === me.id) return true;
  const member = space.members.find((m) => m.user.id === me.id);
  return member?.role === 'WRITER';
}
