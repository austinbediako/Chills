import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle, Clock, Image as ImageIcon, X, Eye, Loader2, AlertCircle, Tag, Hash, Folder, Keyboard
} from 'lucide-react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageResize from 'quill-image-resize-module-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import Logo from '../components/common/Logo';
import { useSubmissions } from '../hooks/useSubmissions';
import { useWritingShortcuts, useEscapeKey, getModifierKeyLabel } from '../hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '../components/common/KeyboardShortcutsModal';
import '../styles/article.css';

// --- Register Quill modules and attributors ONCE at module scope ---

// Register float, margin, display as style attributors so Quill
// persists them in the HTML content (instead of stripping them).
const Parchment = Quill.import('parchment');
const FloatStyle = new Parchment.Attributor.Style('float', 'float');
const MarginStyle = new Parchment.Attributor.Style('margin', 'margin');
const DisplayStyle = new Parchment.Attributor.Style('display', 'display');

Quill.register(FloatStyle, true);
Quill.register(MarginStyle, true);
Quill.register(DisplayStyle, true);

// Expose Quill on window for the image-resize module
if (typeof window !== 'undefined') {
  (window as any).Quill = Quill;
}
Quill.register('modules/imageResize', ImageResize);


const WritePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDraftId = searchParams.get('draftId') || searchParams.get('id');
  const initialDraftId = paramId || queryDraftId || null;

  const { addSubmission, editSubmission, loading } = useSubmissions();
  const { user } = useSelector((state: RootState) => state.auth);
  const quillRef = useRef<ReactQuill>(null);
  
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(initialDraftId);
  const [parentPost, setParentPost] = useState<any>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(Boolean(initialDraftId));

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [abstract, setAbstract] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Categories & Tags state
  const [category, setCategory] = useState<string>('');
  const [categoriesList, setCategoriesList] = useState<Array<{ _id: string; name: string; slug: string }>>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [popularTags, setPopularTags] = useState<string[]>([]);
  
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch available categories and popular tags on mount
  useEffect(() => {
    axios.get('/api/categories')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategoriesList(res.data);
        }
      })
      .catch((err) => console.error('Failed to load categories:', err));

    axios.get('/api/submissions/popular/tags')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setPopularTags(res.data.map((t: any) => t.name).slice(0, 10));
        }
      })
      .catch((err) => console.error('Failed to load popular tags:', err));
  }, []);

  // Refs for robust autosave management
  const isInitialLoadRef = useRef(Boolean(initialDraftId));
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef({
    title: '',
    content: '',
    abstract: '',
    coverImage: null as string | null,
    category: '',
    tags: [] as string[],
  });
  const stateRef = useRef({
    title,
    content,
    abstract,
    coverImage,
    category,
    tags,
    currentDraftId,
    parentPost,
  });

  // Keep stateRef synchronized with latest component state
  useEffect(() => {
    stateRef.current = {
      title,
      content,
      abstract,
      coverImage,
      category,
      tags,
      currentDraftId,
      parentPost,
    };
  }, [title, content, abstract, coverImage, category, tags, currentDraftId, parentPost]);

  const stripHtml = (html: string) => html.replace(/<[^>]*>?/gm, '');

  const loadedDraftIdRef = useRef<string | null>(null);

  // Load existing draft from database when draft ID is provided on mount or URL changes
  useEffect(() => {
    if (!initialDraftId) {
      setIsLoadingDraft(false);
      isInitialLoadRef.current = false;
      return;
    }

    if (loadedDraftIdRef.current === initialDraftId) {
      setIsLoadingDraft(false);
      return;
    }

    let isMounted = true;
    const fetchDraft = async () => {
      try {
        setIsLoadingDraft(true);
        const storedToken = user?.token || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).token : null);
        const config = storedToken ? { headers: { Authorization: `Bearer ${storedToken}` } } : {};
        const { data } = await axios.get(`/api/submissions/${initialDraftId}`, config);
        
        if (data?.submission && isMounted) {
          loadedDraftIdRef.current = initialDraftId;
          const sub = data.submission;
          const loadedTitle = sub.title || '';
          const loadedContent = sub.content || '';
          const loadedAbstract = sub.abstract || '';
          const loadedCover = sub.image || null;
          const loadedCategory = sub.category ? (typeof sub.category === 'object' ? sub.category._id : sub.category) : '';
          const loadedTags = Array.isArray(sub.tags) ? sub.tags : [];

          setTitle(loadedTitle);
          setContent(loadedContent);
          setAbstract(loadedAbstract);
          setCoverImage(loadedCover);
          setCategory(loadedCategory);
          setTags(loadedTags);
          setCurrentDraftId(sub._id);
          
          if (sub.draftOf) {
            setParentPost(sub.draftOf);
          }

          // Record last saved snapshot so autosave doesn't immediately re-save
          lastSavedRef.current = {
            title: loadedTitle,
            content: loadedContent,
            abstract: loadedAbstract,
            coverImage: loadedCover,
            category: loadedCategory,
            tags: loadedTags,
          };

          // Display the real database timestamp from Mongoose
          if (sub.updatedAt) {
            setLastSavedTime(new Date(sub.updatedAt));
            setSaveState('saved');
          }
        }
      } catch (err) {
        console.error('Failed to load referenced draft from database:', err);
      } finally {
        if (isMounted) {
          setIsLoadingDraft(false);
          // Wait for render cycle before allowing autosave
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 300);
        }
      }
    };

    fetchDraft();
    return () => { isMounted = false; };
  }, [initialDraftId, user?.token]);

  // Safety watchdog: never leave user hanging on loading screen for more than 3 seconds
  useEffect(() => {
    if (isLoadingDraft) {
      const watchdog = setTimeout(() => {
        setIsLoadingDraft(false);
      }, 3000);
      return () => clearTimeout(watchdog);
    }
  }, [isLoadingDraft]);

  // Performs actual autosave to MongoDB
  const performAutoSave = useCallback(async () => {
    const { 
      title: curTitle, 
      content: curContent, 
      abstract: curAbstract, 
      coverImage: curCover, 
      category: curCategory,
      tags: curTags,
      currentDraftId: curDraftId, 
      parentPost: curParent 
    } = stateRef.current;

    // Do not save completely empty posts
    const hasText = Boolean(curTitle.trim() || stripHtml(curContent).trim() || curCover || curTags.length > 0 || curCategory);
    if (!hasText) {
      setSaveState('idle');
      return;
    }

    // Do not save if nothing changed since last save
    if (
      curTitle === lastSavedRef.current.title &&
      curContent === lastSavedRef.current.content &&
      curAbstract === lastSavedRef.current.abstract &&
      curCover === lastSavedRef.current.coverImage &&
      curCategory === lastSavedRef.current.category &&
      JSON.stringify(curTags) === JSON.stringify(lastSavedRef.current.tags)
    ) {
      setSaveState('saved');
      return;
    }

    setSaveState('saving');
    const plainText = stripHtml(curContent).trim();
    const submissionData = {
      title: curTitle.trim() || 'Untitled Draft',
      content: curContent,
      abstract: (curAbstract.trim() || plainText.substring(0, 150) || 'Draft submission').slice(0, 480),
      category: curCategory || undefined,
      tags: curTags,
      image: curCover || '',
      isDraft: true,
      submitForReview: false,
      draftOf: curParent?._id || undefined,
    };

    try {
      if (curDraftId) {
        // Update the existing draft document in the database
        const result = await editSubmission(curDraftId, submissionData, true);
        if (result) {
          lastSavedRef.current = {
            title: curTitle,
            content: curContent,
            abstract: curAbstract,
            coverImage: curCover,
            category: curCategory,
            tags: [...curTags],
          };
          setLastSavedTime(new Date(result.updatedAt || Date.now()));
          setSaveState('saved');
        } else {
          setSaveState('error');
        }
      } else {
        // First save: create the draft in the database and save its ID reference
        const result = await addSubmission(submissionData, true);
        if (result && result._id) {
          setCurrentDraftId(result._id);
          window.history.replaceState(null, '', `?draftId=${result._id}`);
          lastSavedRef.current = {
            title: curTitle,
            content: curContent,
            abstract: curAbstract,
            coverImage: curCover,
            category: curCategory,
            tags: [...curTags],
          };
          setLastSavedTime(new Date(result.updatedAt || Date.now()));
          setSaveState('saved');
        } else {
          setSaveState('error');
        }
      }
    } catch (err) {
      console.error('Autosave to database failed:', err);
      setSaveState('error');
    }
  }, [editSubmission, addSubmission]);

  // True debounced autosave effect
  useEffect(() => {
    // Skip if draft is still being fetched from database
    if (isInitialLoadRef.current) return;

    // Check if there is actual content
    const hasText = Boolean(title.trim() || stripHtml(content).trim() || coverImage || tags.length > 0 || category);
    if (!hasText) return;

    // Check if anything changed compared to last saved state
    const isUnchanged = 
      title === lastSavedRef.current.title &&
      content === lastSavedRef.current.content &&
      abstract === lastSavedRef.current.abstract &&
      coverImage === lastSavedRef.current.coverImage &&
      category === lastSavedRef.current.category &&
      JSON.stringify(tags) === JSON.stringify(lastSavedRef.current.tags);

    if (isUnchanged) return;

    // Immediately show that saving is pending
    setSaveState('saving');

    // Debounce actual database request by 1500ms after user pauses typing
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [title, content, abstract, coverImage, category, tags, performAutoSave]);

  // Custom Quill toolbar image upload handler - groups images into "articles" folder
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

      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };

      // Try uploading to server endpoint into "articles" folder
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'articles');
        const token = user?.token;
        const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const { data } = await axios.post('/api/submissions/upload?folder=articles', formData, { headers });
        if (data?.imageUrl) {
          quill.insertEmbed(range.index, 'image', data.imageUrl);
          quill.setSelection(range.index + 1, 0);
          return;
        }
      } catch (err) {
        console.warn('Image upload to server failed, falling back to base64 data URL', err);
      }

      // Fallback: Read as base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          quill.insertEmbed(range.index, 'image', reader.result);
          quill.setSelection(range.index + 1, 0);
        }
      };
      reader.readAsDataURL(file);
    };
  }, [user]);

  // Quill modules — memoized so Quill doesn't re-init on every render
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
    imageResize: {
      parchment: Parchment,
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image',
    // These formats let Quill persist the inline styles from the image toolbar
    'float', 'display', 'margin', 'height', 'width'
  ];

  // Auto-resize for title and abstract textareas
  const adjustHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  // Cover image upload handler - groups images into "covers" folder
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setCoverImage(previewUrl);

    try {
      setIsUploadingCover(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', 'covers');
      const token = user?.token;
      const headers: Record<string, string> = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post('/api/submissions/upload?folder=covers', formData, { headers });
      if (data?.imageUrl) {
        setCoverImage(data.imageUrl);
      }
    } catch (err) {
      console.warn('Cover image upload failed, converting to data URL fallback', err);
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

  // Tag management helpers
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

  // Publish handler: cancels pending autosave and submits draft for review
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required to publish.');
      return;
    }
    
    // Clear any pending autosave timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    setIsPublishing(true);
    const plainText = stripHtml(content).trim();
    const submissionData = {
      title: title.trim(),
      content,
      abstract: (abstract.trim() || plainText.substring(0, 150) || 'Story submission').slice(0, 480),
      category: category || undefined,
      tags,
      image: coverImage || '',
      isDraft: false,
      submitForReview: true,
      draftOf: parentPost?._id || undefined,
    };
    
    let result;
    if (currentDraftId) {
      result = await editSubmission(currentDraftId, submissionData);
    } else {
      result = await addSubmission(submissionData);
    }

    if (result) {
      navigate(result.slug ? `/blog/${result.slug}` : '/me/stories');
    } else {
      setIsPublishing(false);
    }
  };

  // Format timestamp nicely for UI
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  };

  if (isLoadingDraft) {
    return (
      <div className="min-h-screen bg-light-100 dark:bg-dark-100 flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-primary-500" />
        <p className="text-dark-300 dark:text-light-300 font-serif text-sm">Loading referenced draft...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-100 dark:bg-dark-100 flex flex-col">

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-50 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md border-b border-light-200 dark:border-dark-300 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/me/stories" className="text-dark-300 dark:text-light-300 hover:text-dark-100 dark:hover:text-light-100 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="hidden sm:block">
            <Logo />
          </div>
          
          {/* Draft Reference Indicator */}
          <div className="flex items-center gap-2">
            {currentDraftId ? (
              <span className="bg-light-200 dark:bg-dark-300 text-dark-400 dark:text-light-300 px-2 py-0.5 rounded-full font-mono text-[11px] border border-light-300 dark:border-dark-200">
                Draft #{currentDraftId.slice(-6)}
              </span>
            ) : (
              <span className="text-dark-300 dark:text-light-400 font-serif text-sm px-1">Draft</span>
            )}
            {parentPost && (
              <span className="hidden md:inline text-xs text-primary-600 dark:text-primary-400 font-medium">
                (Revising "{parentPost.title?.slice(0, 20)}...")
              </span>
            )}
          </div>

          {/* Real Auto-Save Timestamp Indicator */}
          <div className="flex items-center text-xs ml-2">
            {saveState === 'saving' && (
              <span className="animate-pulse flex items-center text-dark-400 dark:text-light-400">
                <Clock size={12} className="mr-1 text-primary-500 animate-spin" /> Saving draft...
              </span>
            )}
            {saveState === 'saved' && (
              <span className="flex items-center text-primary-600 dark:text-primary-400 font-medium transition-colors">
                <CheckCircle size={12} className="mr-1" />
                {lastSavedTime ? `Saved at ${formatTimestamp(lastSavedTime)}` : 'Saved'}
              </span>
            )}
            {saveState === 'error' && (
              <span className="flex items-center text-red-500 font-medium">
                <AlertCircle size={12} className="mr-1" /> Auto-save failed
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="flex items-center text-sm font-medium text-dark-400 dark:text-light-300 hover:text-dark-100 dark:hover:text-light-100 transition-colors px-3 py-2"
          >
            <Eye size={16} className="mr-1" /> Preview
          </button>
          
          <button 
            onClick={handlePublish}
            disabled={loading || isPublishing || !title.trim() || !content.trim()}
            className="btn btn-primary rounded-full px-5 py-2 text-sm font-bold disabled:opacity-50"
          >
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </header>

      {/* ── Editor Canvas ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 lg:px-8">
        
        {/* Cover Image Upload (Cloudinary/Local "covers" folder) */}
        <div className="mb-8">
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] group shadow-md border border-light-200 dark:border-dark-300">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              {isUploadingCover && (
                <div className="absolute inset-0 bg-dark-100/40 backdrop-blur-sm flex items-center justify-center text-white text-sm font-medium gap-2">
                  <Loader2 size={20} className="animate-spin" /> Uploading cover image...
                </div>
              )}
              <button 
                onClick={() => setCoverImage(null)}
                className="absolute top-4 right-4 bg-dark-100/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-32 md:h-48 rounded-2xl border-2 border-dashed border-light-300 dark:border-dark-300 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer text-dark-300 dark:text-light-400">
              <div className="flex flex-col items-center">
                {isUploadingCover ? (
                  <>
                    <Loader2 size={32} className="mb-2 animate-spin text-primary-500" />
                    <span className="text-sm font-medium">Uploading cover image...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-sm font-medium">Add a high-quality cover image</span>
                  </>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" disabled={isUploadingCover} onChange={handleImageUpload} />
            </label>
          )}
        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => { setTitle(e.target.value); adjustHeight(e.target); }}
          placeholder="Title"
          className="w-full bg-transparent text-4xl md:text-5xl font-bold font-heading text-dark-100 dark:text-light-100 placeholder:text-light-400 dark:placeholder:text-dark-400 outline-none resize-none overflow-hidden mb-6 leading-tight tracking-tight"
          rows={1}
        />
        
        {/* Abstract / Subtitle */}
        <textarea
          value={abstract}
          onChange={(e) => { setAbstract(e.target.value); adjustHeight(e.target); }}
          placeholder="Subtitle or brief abstract (optional)"
          className="w-full bg-transparent text-xl md:text-2xl font-serif font-light text-dark-300 dark:text-light-300 placeholder:text-light-400 dark:placeholder:text-dark-400 outline-none resize-none overflow-hidden mb-6 leading-relaxed"
          rows={1}
        />

        {/* ── Category & Tags Metadata Panel ── */}
        <div className="mb-8 p-4 rounded-2xl bg-light-200/60 dark:bg-dark-200/60 border border-light-300 dark:border-dark-300 space-y-4 shadow-sm">
          {/* Category Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-dark-300 dark:text-light-300 text-xs font-semibold uppercase tracking-wider">
              <Folder size={15} className="text-primary-500" />
              <span>Category</span>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 rounded-lg px-3 py-1.5 text-sm font-medium text-dark-100 dark:text-light-100 outline-none focus:ring-2 focus:ring-primary-500 transition-all sm:w-64"
            >
              <option value="">Select Category (Optional)</option>
              {categoriesList.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Creator */}
          <div className="space-y-2 pt-3 border-t border-light-300/50 dark:border-dark-300/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-dark-300 dark:text-light-300 text-xs font-semibold uppercase tracking-wider">
                <Tag size={15} className="text-primary-500" />
                <span>Tags & Keywords</span>
              </div>
              <span className="text-xs text-dark-400 dark:text-light-400">
                {tags.length} added • Press Enter or comma to create
              </span>
            </div>

            {/* Tag Badges and Input */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-light-300 dark:border-dark-300 bg-light-100 dark:bg-dark-100 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500 dark:hover:text-red-400 transition-colors ml-0.5 rounded-full p-0.5"
                    title={`Remove ${t}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <div className="flex-1 flex items-center min-w-[150px]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput.trim()) handleAddTag(tagInput); }}
                  placeholder={tags.length === 0 ? "Add tags (e.g. AI, React, Architecture)..." : "Add another tag..."}
                  className="w-full bg-transparent text-sm text-dark-100 dark:text-light-100 placeholder:text-dark-400 dark:placeholder:text-light-400 outline-none"
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="ml-2 px-2.5 py-1 text-xs font-bold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shrink-0"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Suggested Popular Tags */}
            {popularTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-dark-400 dark:text-light-400">
                <span className="font-medium mr-1">Suggestions:</span>
                {popularTags
                  .filter((pt) => !tags.some((t) => t.toLowerCase() === pt.toLowerCase()))
                  .slice(0, 7)
                  .map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => handleAddTag(pt)}
                      className="px-2.5 py-0.5 rounded-full bg-light-300 dark:bg-dark-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      +{pt}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Rich Text Editor */}
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={content} 
          onChange={setContent} 
          modules={modules}
          formats={formats}
          placeholder="Tell your story..."
          className="kblog-quill"
        />
      </main>

      {/* ── Fullscreen Preview Modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] bg-light-100 dark:bg-dark-100 overflow-y-auto">
          <div className="sticky top-0 bg-light-100/90 dark:bg-dark-100/90 backdrop-blur-md border-b border-light-200 dark:border-dark-300 px-4 h-16 flex items-center justify-between z-10">
            <div className="font-heading font-bold text-xl text-dark-100 dark:text-light-100">Preview</div>
            <button 
              onClick={() => setShowPreview(false)}
              className="btn btn-outline rounded-full px-5 py-2 text-sm"
            >
              Back to Editor
            </button>
          </div>
          
          <div className="max-w-3xl mx-auto px-6 py-12">
            {coverImage && (
              <img 
                src={coverImage} 
                alt="Cover Preview" 
                className="w-full aspect-[21/9] object-cover rounded-2xl mb-8 shadow-sm"
              />
            )}

            {/* Category in Preview */}
            {category && (
              <div className="mb-4">
                <span className="rounded-full bg-primary-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {categoriesList.find((c) => c._id === category)?.name || 'Category'}
                </span>
              </div>
            )}

            <h1 className="text-4xl md:text-5xl font-bold font-heading text-dark-100 dark:text-light-100 mb-4 leading-tight">
              {title || 'Untitled Draft'}
            </h1>
            {abstract && (
              <p className="text-xl font-serif font-light text-dark-300 dark:text-light-300 mb-6 pb-6 border-b border-light-200 dark:border-dark-300 leading-relaxed">
                {abstract}
              </p>
            )}

            {/* Tags in Preview */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-light-200 px-3 py-1 text-xs font-medium text-dark-500 dark:bg-dark-300 dark:text-light-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
            
            {/* Render with the shared article stylesheet */}
            <div 
              className="kblog-article"
              dangerouslySetInnerHTML={{ __html: content || '<p>Start writing to see preview...</p>' }}
            />
          </div>
        </div>
      )}

      {/* Custom Quill Toolbar and Editor Styles */}
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
          min-height: 400px;
        }
        .kblog-quill .ql-editor.ql-blank::before {
          left: 0 !important;
          font-family: 'Lora', Georgia, 'Times New Roman', serif;
          font-style: italic;
          color: #9ca3af;
          font-size: 1.125rem;
        }
      `}</style>
    </div>
  );
};

export default WritePage;
