import { useEffect } from 'react';

import { useAppDispatch } from '@/store/hooks';
import { spacesApi } from '@/store/spacesApi';
import { socket } from '@/lib/socket';

export function useSpaceSync(spaceId: string | null) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!spaceId) return;

    const joinRoom = () => socket.emit('joinSpace', spaceId);

    // Join room now if already connected, or wait for connect event
    if (socket.connected) {
      joinRoom();
    } else {
      socket.once('connect', joinRoom);
    }

    const onFileChange = () => dispatch(spacesApi.util.invalidateTags(['File', 'Folder', 'Space']));
    const onFileMoved = () => dispatch(spacesApi.util.invalidateTags(['File', 'Folder']));
    const onFileRenamed = () => dispatch(spacesApi.util.invalidateTags(['File']));
    const onFolderChange = () =>
      dispatch(spacesApi.util.invalidateTags(['Folder', 'File', 'Space']));
    const onFolderUpdate = () => dispatch(spacesApi.util.invalidateTags(['Folder', 'File']));
    const onSpaceUpdate = () => dispatch(spacesApi.util.invalidateTags(['Space']));

    socket.on('file.created', onFileChange);
    socket.on('file.deleted', onFileChange);
    socket.on('file.renamed', onFileRenamed);
    socket.on('file.moved', onFileMoved);
    socket.on('folder.created', onFolderUpdate);
    socket.on('folder.deleted', onFolderChange);
    socket.on('folder.renamed', onFolderUpdate);
    socket.on('folder.moved', onFolderUpdate);
    socket.on('space.updated', onSpaceUpdate);

    return () => {
      socket.off('connect', joinRoom);
      socket.emit('leaveSpace', spaceId);

      socket.off('file.created', onFileChange);
      socket.off('file.deleted', onFileChange);
      socket.off('file.renamed', onFileRenamed);
      socket.off('file.moved', onFileMoved);
      socket.off('folder.created', onFolderUpdate);
      socket.off('folder.deleted', onFolderChange);
      socket.off('folder.renamed', onFolderUpdate);
      socket.off('folder.moved', onFolderUpdate);
      socket.off('space.updated', onSpaceUpdate);
    };
  }, [spaceId, dispatch]);
}
