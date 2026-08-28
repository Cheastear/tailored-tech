import { useGetMeQuery } from '@/store/authApi';
import { useGetSpaceQuery } from '@/store/spacesApi';
import { useNavigation } from '@/context/NavigationContext';

export function useIsOwner() {
  const { spaceId } = useNavigation();
  const { data: space } = useGetSpaceQuery(spaceId!, { skip: !spaceId });
  const { data: me } = useGetMeQuery();
  if (!space || !me) return false;
  return space.ownerId === me.id;
}
