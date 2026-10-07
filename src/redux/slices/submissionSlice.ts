import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

// Types
interface Author {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface Submission {
  _id: string;
  title: string;
  slug: string;
  content: string;
  abstract: string;
  author: Author;
  image?: string;
  category: Category;
  tags: string[];
  likesCount?: number;
  bookmarksCount?: number;
  readTime: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'REVISIONS_REQUESTED' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsState {
  submissions: Submission[];
  submission: Submission | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalSubmissions: number;
}

interface SubmissionsResponse {
  submissions: Submission[];
  totalPages: number;
  currentPage: number;
  totalSubmissions: number;
}

interface SubmissionResponse {
  submission: Submission;
  comments: any[];
  likesCount: number;
  bookmarksCount: number;
}

interface SubmissionData {
  title: string;
  content: string;
  abstract: string;
  category?: string;
  tags?: string[];
  image?: string;
  isDraft?: boolean;
  submitForReview?: boolean;
}

interface QueryParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  status?: string;
}

// Initial state
const initialState: SubmissionsState = {
  submissions: [],
  submission: null,
  loading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
  totalSubmissions: 0,
};

// Async thunks
export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (params: QueryParams = {}, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.user?.token;
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const queryString = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryString.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get<SubmissionsResponse>(`/api/submissions?${queryString.toString()}`, config);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submissions');
    }
  }
);

export const fetchSubmissionById = createAsyncThunk(
  'submissions/fetchSubmissionById',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.auth.user?.token;
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const { data } = await axios.get<SubmissionResponse>(`/api/submissions/${id}`, config);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch submission');
    }
  }
);

export const createSubmission = createAsyncThunk(
  'submissions/createSubmission',
  async (submissionData: SubmissionData, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post<Submission>('/api/submissions', submissionData, config);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create submission');
    }
  }
);

export const updateSubmission = createAsyncThunk(
  'submissions/updateSubmission',
  async ({ id, submissionData }: { id: string; submissionData: SubmissionData }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.put<Submission>(`/api/submissions/${id}`, submissionData, config);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update submission');
    }
  }
);

export const updateSubmissionStatus = createAsyncThunk(
  'submissions/updateStatus',
  async ({ id, status, comments }: { id: string; status: string, comments?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.put<Submission>(`/api/submissions/${id}/status`, { status, comments }, config);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update status');
    }
  }
);

export const deleteSubmission = createAsyncThunk(
  'submissions/deleteSubmission',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.delete(`/api/submissions/${id}`, config);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete submission');
    }
  }
);

export const interactWithSubmission = createAsyncThunk(
  'submissions/interact',
  async ({ id, type }: { id: string; type: 'LIKE' | 'BOOKMARK' }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post(`/api/submissions/${id}/interact`, { type }, config);
      return { id, type, action: data.action };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to interact');
    }
  }
);

// Slice
const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    clearSubmissionError: (state) => {
      state.error = null;
    },
    clearCurrentSubmission: (state) => {
      state.submission = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Submissions
    builder.addCase(fetchSubmissions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSubmissions.fulfilled, (state, action: PayloadAction<SubmissionsResponse>) => {
      state.loading = false;
      state.submissions = action.payload.submissions;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
      state.totalSubmissions = action.payload.totalSubmissions;
    });
    builder.addCase(fetchSubmissions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch Submission By Id
    builder.addCase(fetchSubmissionById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSubmissionById.fulfilled, (state, action: PayloadAction<SubmissionResponse>) => {
      state.loading = false;
      state.submission = { 
        ...action.payload.submission, 
        likesCount: action.payload.likesCount,
        bookmarksCount: action.payload.bookmarksCount 
      };
    });
    builder.addCase(fetchSubmissionById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Create Submission
    builder.addCase(createSubmission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createSubmission.fulfilled, (state, action: PayloadAction<Submission>) => {
      state.loading = false;
      state.submissions = [action.payload, ...state.submissions];
    });
    builder.addCase(createSubmission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Update Submission
    builder.addCase(updateSubmission.fulfilled, (state, action: PayloadAction<Submission>) => {
      state.loading = false;
      state.submission = { ...state.submission, ...action.payload };
      state.submissions = state.submissions.map((sub) =>
        sub._id === action.payload._id ? action.payload : sub
      );
    });

    builder.addCase(updateSubmissionStatus.fulfilled, (state, action: PayloadAction<Submission>) => {
        if (state.submission && state.submission._id === action.payload._id) {
            state.submission.status = action.payload.status;
        }
        state.submissions = state.submissions.map((sub) =>
            sub._id === action.payload._id ? { ...sub, status: action.payload.status } : sub
        );
    });

    // Delete Submission
    builder.addCase(deleteSubmission.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteSubmission.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.submissions = state.submissions.filter((sub) => sub._id !== action.payload);
      if (state.submission && state.submission._id === action.payload) {
          state.submission = null;
      }
    });
    builder.addCase(deleteSubmission.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Interact (Like/Bookmark)
    builder.addCase(interactWithSubmission.fulfilled, (state, action) => {
      const { id, type, action: act } = action.payload;
      if (state.submission && state.submission._id === id) {
        if (type === 'LIKE') {
            state.submission.likesCount = (state.submission.likesCount || 0) + (act === 'added' ? 1 : -1);
        } else if (type === 'BOOKMARK') {
            state.submission.bookmarksCount = (state.submission.bookmarksCount || 0) + (act === 'added' ? 1 : -1);
        }
      }
    });
  },
});

export const { clearSubmissionError, clearCurrentSubmission } = submissionSlice.actions;

export default submissionSlice.reducer;
