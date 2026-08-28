import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { User } from '../types/user';
import { spacesApi } from './spacesApi';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
    }),
    login: builder.mutation<User, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(spacesApi.util.resetApiState());
        const { data } = await queryFulfilled;
        dispatch(authApi.util.upsertQueryData('getMe', undefined, data));
      },
    }),
    register: builder.mutation<User, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        dispatch(spacesApi.util.resetApiState());
        const { data } = await queryFulfilled;
        dispatch(authApi.util.upsertQueryData('getMe', undefined, data));
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(spacesApi.util.resetApiState());
        dispatch(authApi.util.resetApiState());
      },
    }),

    updateProfile: builder.mutation<User, { name?: string; currentPassword?: string; newPassword?: string }>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(authApi.util.upsertQueryData('getMe', undefined, data));
      },
    }),

    uploadAvatar: builder.mutation<User, FormData>({
      query: (body) => ({ url: '/auth/me/avatar', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(authApi.util.upsertQueryData('getMe', undefined, data));
      },
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} = authApi;
