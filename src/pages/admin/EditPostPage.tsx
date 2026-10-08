import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Clock, User as UserIcon, Tag, X, Image as ImageIcon, 
  Loader2, CheckCircle, Save, Folder, Camera 
} from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import axios from 'axios';
import { useSubmissions } from '../../hooks/useSubmissions';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/article.css';

// Ensure Quill modules are registered
const Parchment = Quill.import('parchment');
const FloatStyle = new Parchment.Attributor.Style('float', 'float');
const MarginStyle = new Parchment.Attributor.Style('margin', 'margin');
const DisplayStyle = new Parchment.Attributor.Style('display', 'display');

Quill.register(FloatStyle, true);
Quill.register(MarginStyle, true);
Quill.register(DisplayStyle, true);

if (typeof window !== 'undefined') {
  (window as any).Quill = Quill;
}
Quill.register('modules/imageResize', ImageResize);

const EditPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { submission, getSubmissionById, editSubmission, loading: fetchingSubmission } = useSubmissions();
  const { user } = useAuth();
  const quillRef = useRef<ReactQuill>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [abstract, setAbstract] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Aux State
  const [categoriesList, setCategoriesList] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch categories and tags on mount
  useEffect(() => {
    axios.get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data)) setCategoriesList(res.data);
      })
      .catch(() => {});

    axios.get('/api/submissions/popular/tags')
      .then((res) => {
        if (Array.isArray(res.data)) setPopularTags(res.data.map((t: any) => t.name).slice(0, 8));
      })
      .catch(() => {});
  }, []);

  // Fetch submission on mount or when slug changes
  useEffect(() => {
    if (slug) {
      getSubmissionById(slug);
    }
  }, [slug, getSubmissionById]);

  // Populate state when submission data arrives
  useEffect(() => {
    if (submission) {
      setTitle(submission.title || '');
      setContent(submission.content || '');
      setAbstract(submission.abstract || '');
      setCoverImage(submission.image || null);
      setCategory(submission.category ? (typeof submission.category === 'object' ? submission.category._id : submission.category) : '');
      setTags(Array.isArray(submission.tags) ? submission.tags : []);
    }
  }, [submission]);

  // Tag helper functions
  const handleAddTag = (rawTag: string) => {
    const cleaned = rawTag.trim().replace(/^#/, '');
    if (!cleaned) return;
    if (!tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append('image', file);

      const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
      const headers = {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const { data } = await axios.post('/api/submissions/upload?folder=covers', formData, { headers });
      if (data?.imageUrl) {
        setCoverImage(data.imageUrl);
      }
    } catch (err) {
      console.warn('Cover upload fallback to data URL', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setCoverImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Inline Quill image upload
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const range = quill.getSelection(true);
      quill.insertText(range.index, 'Uploading image...', 'italic', true);

      try {
        const formData = new FormData();
        formData.append('image', file);
        const token = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : '');
        const headers = {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        };

        const { data } = await axios.post('/api/submissions/upload?folder=articles', formData, { headers });
        quill.deleteText(range.index, 'Uploading image...'.length);
        if (data?.imageUrl) {
          quill.insertEmbed(range.index, 'image', data.imageUrl);
          (quill as any).setSelection(range.index + 1);
        }
      } catch (err) {
        quill.deleteText(range.index, 'Uploading image...'.length);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            quill.insertEmbed(range.index, 'image', reader.result);
            (quill as any).setSelection(range.index + 1);
          }
        };
        reader.readAsDataURL(file);
      }
    };
  }, [user?.token]);

  const modules = useRef({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image', 'code-block'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
      handleStyles: {
        backgroundColor: '#4f46e5',
        border: 'none',
        borderRadius: '50%',
      },
    },
  }).current;

  // Save changes
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Title and article content are required.');
      return;
    }

    if (!submission) return;

    try {
      setIsSaving(true);
      setErrorMsg('');

      const submissionData = {
        title: title.trim(),
        content,
        abstract: abstract.trim() || undefined,
        category: category || undefined,
        tags,
        image: coverImage || '',
      };

      const result = await editSubmission(submission._id, submissionData);
      if (result) {
        navigate(`/blog/${result.slug || submission.slug}`);
      }
    } catch (err: any) {
      console.error('Error saving submission:', err);
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (fetchingSubmission && !submission) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 size={36} className="animate-spin text-primary-500" />
        <p className="text-dark-300 dark:text-light-300 font-serif text-sm">Loading document for editing...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="text-center py-20 card max-w-xl mx-auto my-12">
        <h2 className="text-2xl font-bold font-heading text-dark-100 dark:text-light-100 mb-4">
          Document Not Found
        </h2>
        <p className="text-dark-300 dark:text-light-300 mb-6">
          The document you are attempting to edit does not exist or has been removed.
        </p>
        <Link to="/explore" className="btn btn-primary">
          Back to Repository
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-serif">
      
      {/* ── Top Bar with Actions ── */}
      <div className="sticky top-20 z-40 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md p-4 rounded-2xl border border-light-300 dark:border-dark-300 mb-8 flex items-center justify-between shadow-sm">
        <Link 
          to={`/blog/${submission.slug}`}
          className="flex items-center text-sm font-sans font-medium text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1.5" /> Back to View
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-sans font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            Editing Mode
          </span>

          <Link
            to={`/blog/${submission.slug}`}
            className="btn btn-outline text-xs px-4 py-2 rounded-full font-sans"
          >
            Cancel
          </Link>

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="btn btn-primary text-xs px-5 py-2 rounded-full font-sans font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-sm font-sans">
          {errorMsg}
        </div>
      )}

      {/* ── Article Header (Identical layout to BlogDetailPage) ── */}
      <header className="mb-8">
        
        {/* Category Pill Dropdown */}
        <div className="mb-4 flex items-center gap-2">
          <label className="text-xs font-sans font-semibold uppercase tracking-wider text-dark-400 dark:text-light-400">
            Category:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3.5 py-1 text-sm font-sans font-semibold border-none outline-none cursor-pointer hover:bg-primary-200 transition-colors"
          >
            <option value="">Select Category</option>
            {categoriesList.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Editable Title */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          rows={1}
          className="text-3xl font-bold font-heading sm:text-4xl md:text-5xl text-dark-100 dark:text-light-100 mb-6 leading-tight w-full bg-transparent outline-none resize-none border-b border-light-200 dark:border-dark-300 focus:border-primary-500 transition-colors"
        />

        {/* Author Metadata Bar */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-dark-400 dark:text-light-400 border-b border-light-300 pb-6 dark:border-dark-300">
          <div className="flex items-center">
            <img
              src={submission.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.author?.name || 'Author')}`}
              alt={submission.author?.name || 'Author'}
              className="h-8 w-8 rounded-full mr-2 object-cover"
            />
            <span className="font-medium text-dark-100 dark:text-light-100">
              {submission.author?.name || 'Author'}
            </span>
          </div>
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>
              {new Date(submission.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            <span>{submission.readTime || '5 min read'}</span>
          </div>
        </div>
      </header>

      {/* ── Featured Cover Image (Identical layout with edit trigger) ── */}
      <div className="mb-8 relative group rounded-2xl overflow-hidden aspect-[21/9] border border-light-200 dark:border-dark-300 bg-light-200 dark:bg-dark-200">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-dark-300 dark:text-light-400">
            <ImageIcon size={40} className="mb-2" />
            <span className="text-sm font-sans">No cover image uploaded</span>
          </div>
        )}

        {isUploadingCover && (
          <div className="absolute inset-0 bg-dark-100/60 backdrop-blur-xs flex items-center justify-center text-white text-sm font-sans gap-2">
            <Loader2 size={24} className="animate-spin" /> Uploading cover image...
          </div>
        )}

        {/* Cover Image Action Overlay */}
        <div className="absolute inset-0 bg-dark-100/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <label 
            htmlFor="cover-edit-upload" 
            className="btn btn-primary rounded-full px-4 py-2 text-xs font-sans font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Camera size={14} /> Change Cover
            <input 
              id="cover-edit-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              disabled={isUploadingCover} 
              onChange={handleCoverUpload} 
            />
          </label>
          {coverImage && (
            <button
              type="button"
              onClick={() => setCoverImage(null)}
              className="btn bg-red-600/90 hover:bg-red-700 text-white rounded-full px-4 py-2 text-xs font-sans font-bold shadow-lg"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* ── Abstract Card (Identical layout to BlogDetailPage with in-place editor) ── */}
      <div className="mb-8 p-6 bg-light-200 dark:bg-dark-200 rounded-xl border-l-4 border-primary-500 text-dark-300 dark:text-light-300">
        <h4 className="font-bold font-heading mb-2 not-italic text-sm text-dark-100 dark:text-light-100 uppercase tracking-wider font-sans">
          Abstract
        </h4>
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          placeholder="Brief summary or abstract of this article..."
          rows={3}
          className="w-full bg-transparent font-serif italic text-base sm:text-lg text-dark-200 dark:text-light-200 outline-none resize-none leading-relaxed"
        />
      </div>

      {/* ── Article Content (Uses exact kblog-article styles) ── */}
      <div className="mb-8">
        <h4 className="font-bold font-heading mb-3 text-sm text-dark-400 dark:text-light-400 uppercase tracking-wider font-sans">
          Article Content
        </h4>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={content}
          onChange={setContent}
          modules={modules}
          placeholder="Write your article content..."
          className="kblog-quill"
        />
      </div>

      {/* ── Keywords / Tags (Identical layout to BlogDetailPage with chip editor) ── */}
      <div className="mb-12 pt-6 border-t border-light-200 dark:border-dark-300">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold font-heading text-dark-100 dark:text-light-100">
            Keywords / Tags
          </h3>
          <span className="text-xs font-sans text-dark-400 dark:text-light-400">
            Press Enter or comma to add
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-light-200/60 dark:bg-dark-200/60 border border-light-300 dark:border-dark-300 mb-3">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-light-100 dark:bg-dark-300 px-3.5 py-1 text-sm font-sans font-medium text-dark-500 dark:text-light-300 border border-light-300 dark:border-dark-400 shadow-2xs"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500 ml-0.5 rounded-full p-0.5"
                title={`Remove ${tag}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}

          <div className="flex-1 min-w-[160px]">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => { if (tagInput.trim()) handleAddTag(tagInput); }}
              placeholder={tags.length === 0 ? "Add tags (e.g. AI, React)..." : "Add tag..."}
              className="w-full bg-transparent text-sm font-sans outline-none text-dark-100 dark:text-light-100 placeholder:text-dark-400"
            />
          </div>
        </div>

        {/* Suggested Tags */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-dark-400 dark:text-light-400">
            <span className="font-semibold mr-1">Suggestions:</span>
            {popularTags
              .filter((pt) => !tags.some((t) => t.toLowerCase() === pt.toLowerCase()))
              .map((pt) => (
                <button
                  key={pt}
                  type="button"
                  onClick={() => handleAddTag(pt)}
                  className="px-2.5 py-0.5 rounded-full bg-light-200 dark:bg-dark-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  +{pt}
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ── Author Bio Card (Identical layout to BlogDetailPage) ── */}
      <div className="mb-12 rounded-2xl bg-light-200 p-6 dark:bg-dark-200">
        <div className="flex flex-col sm:flex-row sm:items-center">
          <img
            src={submission.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.author?.name || 'Author')}`}
            alt={submission.author?.name || 'Author'}
            className="h-20 w-20 rounded-full mb-4 sm:mb-0 sm:mr-6 object-cover"
          />
          <div>
            <h3 className="text-xl font-bold font-heading text-dark-100 dark:text-light-100 mb-2">
              {submission.author?.name || 'Author'}
            </h3>
            <p className="text-dark-300 dark:text-light-300 mb-2">
              {submission.author?.bio || 'Document Author'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Save Action ── */}
      <div className="pt-6 border-t border-light-300 dark:border-dark-300 flex items-center justify-between">
        <Link
          to={`/blog/${submission.slug}`}
          className="text-sm font-sans text-dark-400 hover:text-dark-100 dark:text-light-400 dark:hover:text-light-100"
        >
          Discard Changes
        </Link>

        <button
          onClick={handleSave}
          disabled={isSaving || !title.trim() || !content.trim()}
          className="btn btn-primary rounded-full px-8 py-3 text-sm font-sans font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <CheckCircle size={16} /> Save and View Document
            </>
          )}
        </button>
      </div>

      {/* Shared Quill Styling */}
      <style>{`
        .kblog-quill {
          display: flex;
          flex-direction: column;
        }
        .kblog-quill .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.08)) !important;
          padding: 8px 0 16px 0 !important;
          margin-bottom: 24px;
        }
        .dark .kblog-quill .ql-toolbar.ql-snow {
          border-bottom-color: rgba(255,255,255,0.08) !important;
        }
        .dark .kblog-quill .ql-snow .ql-stroke {
          stroke: #9ca3af;
        }
        .dark .kblog-quill .ql-snow .ql-fill {
          fill: #9ca3af;
        }
        .dark .kblog-quill .ql-snow .ql-picker {
          color: #9ca3af;
        }
        .kblog-quill .ql-container.ql-snow {
          border: none !important;
          font-family: 'Lora', Georgia, 'Times New Roman', serif !important;
          font-size: 1.125rem !important;
          line-height: 1.8 !important;
        }
        .kblog-quill .ql-editor {
          padding: 0 !important;
          min-height: 350px;
        }
      `}</style>
    </div>
  );
};

export default EditPostPage;