import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './authApi';
import { spacesApi } from './spacesApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [spacesApi.reducerPath]: spacesApi.reducer,
  },
  middleware: (getDefault) => getDefault().concat(authApi.middleware, spacesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
