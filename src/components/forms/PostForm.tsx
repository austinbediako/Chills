import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Upload } from 'lucide-react';
import { useSubmissions } from '../../hooks/useSubmissions';

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    abstract: string;
    category: string;
    tags: string[];
    image?: string;
    status?: string;
  };
  submissionId?: string;
  isEditing?: boolean;
}

const PostForm: React.FC<PostFormProps> = ({ initialData, submissionId, isEditing = false }) => {
  const navigate = useNavigate();
  const { addSubmission, editSubmission, loading } = useSubmissions(); // removed uploadPostImage since we might not have it in useSubmissions

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    abstract: '',
    category: '',
    tags: '',
    image: '',
    actionType: 'draft', // 'draft' or 'review'
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        abstract: initialData.abstract || '',
        category: initialData.category || '',
        tags: initialData.tags ? initialData.tags.join(', ') : '',
        image: initialData.image || '',
        actionType: initialData.status === 'DRAFT' ? 'draft' : 'review',
      });

      if (initialData.image) {
        setImagePreview(initialData.image);
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      
      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: '' }));
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required';
    } else if (formData.abstract.length > 500) {
      newErrors.abstract = 'Abstract cannot be more than 500 characters';
    }
    
    // Allow empty category if not enforced in frontend yet, or enforce if we had category IDs. 
    // Currently we skip category validation here since we haven't built the Category fetching properly.
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    let imageUrl = formData.image;
    
    // Upload image logic goes here if implemented in the hook
    // if (imageFile) {
    //   const uploadedImageUrl = await uploadPostImage(imageFile);
    //   if (uploadedImageUrl) imageUrl = uploadedImageUrl;
    // }
    
    const submissionData = {
      title: formData.title,
      content: formData.content,
      abstract: formData.abstract,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      image: imageUrl,
      isDraft: formData.actionType === 'draft',
      submitForReview: formData.actionType === 'review',
    };
    
    let success;
    
    if (isEditing && submissionId) {
      success = await editSubmission(submissionId, submissionData);
    } else {
      success = await addSubmission(submissionData);
    }
    
    if (success) {
      navigate('/blog');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Enter publication title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      
      {/* Abstract */}
      <div>
        <label htmlFor="abstract" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Abstract <span className="text-red-500">*</span>
          <span className="ml-1 text-xs text-dark-400 dark:text-light-400">
            (Max 500 characters)
          </span>
        </label>
        <textarea
          id="abstract"
          name="abstract"
          value={formData.abstract}
          onChange={handleChange}
          className={`input w-full h-32 resize-none ${errors.abstract ? 'border-red-500' : ''}`}
          placeholder="Enter a comprehensive abstract of your work"
        />
        <div className="mt-1 flex justify-between">
          {errors.abstract ? (
            <p className="text-sm text-red-500">{errors.abstract}</p>
          ) : (
            <span className="text-xs text-dark-400 dark:text-light-400">
              {formData.abstract.length}/500 characters
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Content / Main Body <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className={`input w-full h-64 resize-none ${errors.content ? 'border-red-500' : ''}`}
          placeholder="Write your main content here"
        />
        {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
      </div>
      
      {/* Tags */}
      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Tags <span className="text-xs text-dark-400 dark:text-light-400">(Comma separated)</span>
        </label>
        <input
          type="text"
          id="tags"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          className="input w-full"
          placeholder="e.g. React, Computer Science, Thesis"
        />
      </div>
      
      {/* Action Type */}
      <div>
        <label className="mb-1 block text-sm font-medium text-dark-100 dark:text-light-100">
          Submission Action
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="actionType"
              value="draft"
              checked={formData.actionType === 'draft'}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-dark-100 dark:text-light-100">Save as Draft</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="actionType"
              value="review"
              checked={formData.actionType === 'review'}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-dark-100 dark:text-light-100">Submit for Review</span>
          </label>
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : formData.actionType === 'review' ? 'Submit for Review' : 'Save Draft'}
        </button>
      </div>
    </form>
  );
};

export default PostForm;