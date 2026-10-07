import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/hooks';
import {
  fetchComments,
  addComment,
  updateComment,
  deleteComment,
  addReply,
} from '../redux/slices/commentSlice';
import { showNotification } from '../redux/slices/uiSlice';

export const useComments = () => {
  const dispatch = useAppDispatch();
  const { comments, loading, error } = useSelector((state: RootState) => state.comments);

  const getComments = useCallback(async (submissionId: string) => {
    try {
      await dispatch(fetchComments(submissionId)).unwrap();
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  }, [dispatch]);

  const createComment = async (submissionId: string, content: string) => {
    try {
      await dispatch(addComment({ submissionId, content })).unwrap();
      dispatch(showNotification({ message: 'Comment added successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const editComment = async (commentId: string, content: string) => {
    try {
      await dispatch(updateComment({ commentId, content })).unwrap();
      dispatch(showNotification({ message: 'Comment updated successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await dispatch(deleteComment(commentId)).unwrap();
      dispatch(showNotification({ message: 'Comment deleted successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const replyToComment = async (commentId: string, content: string) => {
    try {
      await dispatch(addReply({ commentId, content })).unwrap();
      dispatch(showNotification({ message: 'Reply added successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  return {
    comments,
    loading,
    error,
    getComments,
    createComment,
    editComment,
    removeComment,
    replyToComment,
  };
};