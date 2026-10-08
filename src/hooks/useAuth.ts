import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { login, register, logout, updateProfile } from '../redux/slices/authSlice';
import { showNotification } from '../redux/slices/uiSlice';

export const useAuth = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const loginUser = async (email: string, password: string) => {
    try {
      await dispatch(login({ email, password })).unwrap();
      dispatch(showNotification({ message: 'Login successful', type: 'success' }));
      return true;
    } catch (error: any) {
      const errMsg = typeof error === 'string' ? error : error?.message || 'Invalid email or password';
      dispatch(showNotification({ message: errMsg, type: 'error' }));
      return false;
    }
  };

  const registerUser = async (name: string, email: string, username: string, password: string, gender: string) => {
    try {
      await dispatch(register({ name, email, username, password, gender })).unwrap();
      dispatch(showNotification({ message: 'Registration successful', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const logoutUser = () => {
    dispatch(logout());
    dispatch(showNotification({ message: 'Logged out successfully', type: 'info' }));
  };

  interface ProfileData {
    name?: string;
    email?: string;
    username?: string;
    password?: string;
    bio?: string;
    avatar?: string;
    coverImage?: string;
    gender?: string;
    role?: string;
  }

  const updateUserProfile = async (profileData: ProfileData) => {
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      dispatch(showNotification({ message: 'Profile updated successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
    updateUserProfile,
  };
};