import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Space } from '@/types/space';
import type { Folder } from '@/types/folder';
import type { SpaceFile } from '@/types/file';

export const spacesApi = createApi({
  reducerPath: 'spacesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Space', 'Folder', 'File'],
  endpoints: (builder) => ({
    getSpaces: builder.query<Space[], void>({
      query: () => '/spaces',
      providesTags: ['Space'],
    }),

    createSpace: builder.mutation<Space, { name: string }>({
      query: (body) => ({ url: '/spaces', method: 'POST', body }),
      invalidatesTags: ['Space'],
    }),

    getFolders: builder.query<Folder[], { spaceId: string; parentId?: string }>({
      query: ({ spaceId, parentId }) => ({
        url: `/spaces/${spaceId}/folders`,
        params: parentId ? { parentId } : {},
      }),
      providesTags: ['Folder'],
    }),

    getFiles: builder.query<SpaceFile[], { spaceId: string; folderId?: string }>({
      query: ({ spaceId, folderId }) => ({
        url: `/spaces/${spaceId}/files`,
        params: folderId ? { folderId } : {},
      }),
      providesTags: ['File'],
    }),
  }),
});

export const {
  useGetSpacesQuery,
  useCreateSpaceMutation,
  useGetFoldersQuery,
  useGetFilesQuery,
} = spacesApi;
