import { useEffect } from 'react';

import { useGetMeQuery } from '@/store/authApi';
import { useAppDispatch } from '@/store/hooks';
import { spacesApi } from '@/store/spacesApi';
import { socket } from '@/lib/socket';

export function useUserSync() {
  const dispatch = useAppDispatch();
  const { data: me } = useGetMeQuery();

  useEffect(() => {
    if (!me) return;

    socket.connect();

    const onSpacesChanged = () => dispatch(spacesApi.util.invalidateTags(['Space']));
    socket.on('spaces.changed', onSpacesChanged);

    return () => {
      socket.off('spaces.changed', onSpacesChanged);
      socket.disconnect();
    };
  }, [me?.id, dispatch]);
}
