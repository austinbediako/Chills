import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

// Types
interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Reply {
  _id: string;
  user: User;
  content: string;
  date: string;
  likedBy?: string[];
}

interface Comment {
  _id: string;
  submission: string;
  user: User;
  content: string;
  isFlagged?: boolean;
  likes?: number;
  likedBy?: string[];
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: CommentState = {
  comments: [],
  loading: false,
  error: null,
};

// Async thunks
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (submissionId: string, { rejectWithValue }) => {
    try {
      const { data } = await axios.get<Comment[]>(`/api/submissions/${submissionId}/comments`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const addComment = createAsyncThunk(
  'comments/addComment',
  async ({ submissionId, content }: { submissionId: string; content: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post<Comment>(
        `/api/submissions/${submissionId}/comments`,
        { content },
        config
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async ({ commentId, content }: { commentId: string; content: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.put<Comment>(
        `/api/comments/${commentId}`,
        { content },
        config
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      await axios.delete(`/api/comments/${commentId}`, config);
      return commentId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

export const addReply = createAsyncThunk(
  'comments/addReply',
  async ({ commentId, content }: { commentId: string; content: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { token } = state.auth.user || {};
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      
      const { data } = await axios.post<Comment>(
        `/api/comments/${commentId}/replies`,
        { content },
        config
      );
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reply');
    }
  }
);

// removed likeComment

// Slice
const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Comments
    builder.addCase(fetchComments.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchComments.fulfilled, (state, action: PayloadAction<Comment[]>) => {
      state.loading = false;
      state.comments = action.payload;
    });
    builder.addCase(fetchComments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add Comment
    builder.addCase(addComment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addComment.fulfilled, (state, action: PayloadAction<Comment>) => {
      state.loading = false;
      state.comments = [action.payload, ...state.comments];
    });
    builder.addCase(addComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Update Comment
    builder.addCase(updateComment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateComment.fulfilled, (state, action: PayloadAction<Comment>) => {
      state.loading = false;
      state.comments = state.comments.map((comment) =>
        comment._id === action.payload._id ? action.payload : comment
      );
    });
    builder.addCase(updateComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete Comment
    builder.addCase(deleteComment.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteComment.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.comments = state.comments.filter((comment) => comment._id !== action.payload);
    });
    builder.addCase(deleteComment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Add Reply
    builder.addCase(addReply.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(addReply.fulfilled, (state, action: PayloadAction<Comment>) => {
      state.loading = false;
      state.comments = state.comments.map((comment) =>
        comment._id === action.payload._id ? action.payload : comment
      );
    });
    builder.addCase(addReply.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // removed likeComment case
  },
});

export const { clearCommentError, clearComments } = commentSlice.actions;

export default commentSlice.reducer;