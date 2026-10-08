import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useAppDispatch } from '../redux/hooks';
import {
  fetchSubmissions,
  fetchSubmissionById,
  createSubmission,
  updateSubmission,
  updateSubmissionStatus,
  interactWithSubmission,
  deleteSubmission,
} from '../redux/slices/submissionSlice';
import { showNotification } from '../redux/slices/uiSlice';

export const useSubmissions = () => {
  const dispatch = useAppDispatch();
  const { submissions, submission, loading, error, totalPages, currentPage, totalSubmissions } = useSelector(
    (state: RootState) => state.submissions
  );

  const getSubmissions = useCallback(async (params = {}) => {
    try {
      await dispatch(fetchSubmissions(params)).unwrap();
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  }, [dispatch]);

  const getSubmissionById = useCallback(async (id: string) => {
    try {
      await dispatch(fetchSubmissionById(id)).unwrap();
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  }, [dispatch]);

  const addSubmission = async (submissionData: any, silent = false) => {
    try {
      const result = await dispatch(createSubmission(submissionData)).unwrap();
      if (!silent) {
        dispatch(showNotification({ message: 'Submission created successfully', type: 'success' }));
      }
      return result;
    } catch (error) {
      if (!silent) {
        dispatch(showNotification({ message: error as string, type: 'error' }));
      }
      return null;
    }
  };

  const editSubmission = async (id: string, submissionData: any, silent = false) => {
    try {
      const result = await dispatch(updateSubmission({ id, submissionData })).unwrap();
      if (!silent) {
        dispatch(showNotification({ message: 'Submission updated successfully', type: 'success' }));
      }
      return result;
    } catch (error) {
      if (!silent) {
        dispatch(showNotification({ message: error as string, type: 'error' }));
      }
      return null;
    }
  };

  const reviewSubmission = async (id: string, status: string, comments?: string) => {
    try {
      await dispatch(updateSubmissionStatus({ id, status, comments })).unwrap();
      dispatch(showNotification({ message: 'Status updated successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const removeSubmission = async (id: string) => {
    try {
      await dispatch(deleteSubmission(id)).unwrap();
      dispatch(showNotification({ message: 'Submission deleted successfully', type: 'success' }));
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  const interactSubmission = async (id: string, type: 'LIKE' | 'BOOKMARK') => {
    try {
      await dispatch(interactWithSubmission({ id, type })).unwrap();
      return true;
    } catch (error) {
      dispatch(showNotification({ message: error as string, type: 'error' }));
      return false;
    }
  };

  return {
    submissions,
    submission,
    loading,
    error,
    totalPages,
    currentPage,
    totalSubmissions,
    getSubmissions,
    getSubmissionById,
    addSubmission,
    editSubmission,
    reviewSubmission,
    removeSubmission,
    deleteSubmission: removeSubmission,
    interactSubmission,
  };
};
