import React, { useState } from 'react';
import { useComments } from '../../hooks/useComments';

interface CommentFormProps {
  submissionId: string;
  onSuccess?: () => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ submissionId, onSuccess }) => {
  const [content, setContent] = useState('');
  const { createComment, loading } = useComments();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }
    
    const success = await createComment(submissionId, content);
    
    if (success) {
      setContent('');
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <div className="mb-4">
        <textarea
          className="input min-h-[120px] w-full"
          placeholder="Write your comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea>
      </div>
      <div className="flex justify-end">
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading || !content.trim()}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;