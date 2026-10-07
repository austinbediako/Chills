import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import submissionReducer from './slices/submissionSlice';
import commentReducer from './slices/commentSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    submissions: submissionReducer,
    comments: commentReducer,
    ui: uiReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;