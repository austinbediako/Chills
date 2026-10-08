import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, Check, Move, Camera, 
  Sparkles, Eye, Image as ImageIcon 
} from 'lucide-react';

export type CropMode = 'avatar' | 'banner';

interface ImageCropModalProps {
  isOpen: boolean;
  mode: CropMode;
  imageSrc: string;
  authorName?: string;
  authorUsername?: string;
  currentAvatar?: string;
  onClose: () => void;
  onSave: (croppedBlob: Blob, previewUrl: string) => Promise<void>;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  mode,
  imageSrc,
  authorName = 'Author',
  authorUsername = 'author',
  currentAvatar,
  onClose,
  onSave,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>('');

  const imageRef = useRef<HTMLImageElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport dimensions for modal
  // Avatar: 300x300 (1:1 aspect)
  // Banner: 540x180 (3:1 aspect)
  const isAvatar = mode === 'avatar';
  const viewportWidth = isAvatar ? 300 : 540;
  const viewportHeight = isAvatar ? 300 : 180;

  // Output canvas dimensions
  const outputWidth = isAvatar ? 600 : 1500;
  const outputHeight = isAvatar ? 600 : 500;

  // Calculate base scale so image always completely covers the viewport without empty borders
  const getBaseScale = useCallback(() => {
    if (!imageRef.current) return 1;
    const { naturalWidth, naturalHeight } = imageRef.current;
    if (!naturalWidth || !naturalHeight) return 1;
    return Math.max(viewportWidth / naturalWidth, viewportHeight / naturalHeight);
  }, [viewportWidth, viewportHeight]);

  // Clamp position so image can never be dragged beyond viewport borders
  const clampPosition = useCallback(
    (newX: number, newY: number, currentZoom: number) => {
      if (!imageRef.current) return { x: 0, y: 0 };
      const baseScale = getBaseScale();
      const currentScale = baseScale * currentZoom;
      const currentWidth = imageRef.current.naturalWidth * currentScale;
      const currentHeight = imageRef.current.naturalHeight * currentScale;

      const maxDeltaX = Math.max(0, (currentWidth - viewportWidth) / 2);
      const maxDeltaY = Math.max(0, (currentHeight - viewportHeight) / 2);

      const clampedX = Math.min(maxDeltaX, Math.max(-maxDeltaX, newX));
      const clampedY = Math.min(maxDeltaY, Math.max(-maxDeltaY, newY));

      return { x: clampedX, y: clampedY };
    },
    [getBaseScale, viewportWidth, viewportHeight]
  );

  // Reset when modal opens or image changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      setImageLoaded(false);
      setIsSaving(false);
    }
  }, [isOpen, imageSrc]);

  // Update live preview canvas whenever position, zoom, or image changes
  const updatePreviewCanvas = useCallback(() => {
    if (!imageRef.current || !previewCanvasRef.current || !imageLoaded) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    const baseScale = getBaseScale();
    const currentScale = baseScale * zoom;
    const ratio = outputWidth / viewportWidth;

    const img = imageRef.current;
    const renderWidth = img.naturalWidth * currentScale * ratio;
    const renderHeight = img.naturalHeight * currentScale * ratio;

    const drawX = (outputWidth - renderWidth) / 2 + position.x * ratio;
    const drawY = (outputHeight - renderHeight) / 2 + position.y * ratio;

    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setLivePreviewUrl(dataUrl);
    } catch {
      // Ignored if tainted
    }
  }, [imageLoaded, outputWidth, outputHeight, getBaseScale, zoom, viewportWidth, position.x, position.y]);

  useEffect(() => {
    updatePreviewCanvas();
  }, [updatePreviewCanvas]);

  // Dragging handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    setPosition(clampPosition(nextX, nextY, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Dragging handlers (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const nextX = touch.clientX - dragStart.x;
    const nextY = touch.clientY - dragStart.y;
    setPosition(clampPosition(nextX, nextY, zoom));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const nextZoom = Math.min(3, Math.max(1, Number((zoom + delta).toFixed(2))));
    setZoom(nextZoom);
    setPosition((prev) => clampPosition(prev.x, prev.y, nextZoom));
  };

  // Zoom slider change
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);
    setPosition((prev) => clampPosition(prev.x, prev.y, nextZoom));
  };

  // Reset
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Save handler
  const handleSaveCropped = async () => {
    if (!imageRef.current) return;
    try {
      setIsSaving(true);
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const baseScale = getBaseScale();
      const currentScale = baseScale * zoom;
      const ratio = outputWidth / viewportWidth;

      const img = imageRef.current;
      const renderWidth = img.naturalWidth * currentScale * ratio;
      const renderHeight = img.naturalHeight * currentScale * ratio;

      const drawX = (outputWidth - renderWidth) / 2 + position.x * ratio;
      const drawY = (outputHeight - renderHeight) / 2 + position.y * ratio;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setIsSaving(false);
            return;
          }
          const finalPreviewUrl = canvas.toDataURL('image/jpeg', 0.92);
          await onSave(blob, finalPreviewUrl);
          setIsSaving(false);
          onClose();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Failed to crop and save image:', err);
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-dark-900/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-light-100 dark:bg-dark-100 rounded-2xl shadow-2xl border border-light-300 dark:border-dark-300 overflow-hidden my-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-light-200 dark:border-dark-300">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                {isAvatar ? <Camera size={18} /> : <ImageIcon size={18} />}
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-dark-100 dark:text-light-100">
                  {isAvatar ? 'Adjust Profile Photo' : 'Adjust Cover Banner'}
                </h3>
                <p className="text-xs text-dark-400 dark:text-light-400">
                  {isAvatar
                    ? 'Drag to position and zoom to fit the profile ring'
                    : 'Drag and zoom to frame your 3:1 wide banner'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-1.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Hidden reference canvas for live high-res rendering */}
          <canvas ref={previewCanvasRef} className="hidden" />

          {/* Modal Body */}
          <div className="p-5 space-y-5">
            {/* 1. Interactive Crop Viewport */}
            <div className="flex flex-col items-center">
              <div className="relative select-none flex items-center justify-center bg-dark-950 rounded-xl overflow-hidden shadow-inner border border-dark-700 w-full max-w-full">
                <div
                  ref={viewportRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onWheel={handleWheel}
                  style={{
                    width: isAvatar ? '280px' : '100%',
                    maxWidth: isAvatar ? '280px' : '540px',
                    height: isAvatar ? '280px' : '180px',
                    aspectRatio: isAvatar ? '1/1' : '3/1',
                  }}
                  className={`relative overflow-hidden ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  {/* The Image being transformed */}
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Source"
                    crossOrigin="anonymous"
                    onLoad={() => {
                      setImageLoaded(true);
                      handleReset();
                    }}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${
                        getBaseScale() * zoom
                      })`,
                      transformOrigin: 'center center',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      userSelect: 'none',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Overlays / Masks */}
                  {isAvatar ? (
                    /* Circular Mask Guide for Profile Photo */
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-full rounded-full border-2 border-primary-500/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"></div>
                      {/* Grid crosshair guidelines */}
                      <div className="absolute inset-0 rounded-full border border-white/20 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        <div className="border-r border-b border-white/15"></div>
                        <div className="border-r border-b border-white/15"></div>
                        <div className="border-b border-white/15"></div>
                        <div className="border-r border-b border-white/15"></div>
                        <div className="border-r border-b border-white/15"></div>
                        <div className="border-b border-white/15"></div>
                        <div className="border-r border-white/15"></div>
                        <div className="border-r border-white/15"></div>
                        <div></div>
                      </div>
                    </div>
                  ) : (
                    /* Wide Banner Guide with Rule-of-Thirds Grid */
                    <div className="absolute inset-0 pointer-events-none border-2 border-primary-500/80">
                      <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none">
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-r border-b border-white/20"></div>
                        <div className="border-b border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div className="border-r border-white/20"></div>
                        <div></div>
                      </div>
                      {/* Avatar preview silhouette in bottom left */}
                      <div className="absolute bottom-2 left-4 w-14 h-14 rounded-full border-2 border-white/80 bg-black/40 flex items-center justify-center text-[9px] text-white/90 font-bold backdrop-blur-xs">
                        Avatar
                      </div>
                    </div>
                  )}

                  {/* Drag Prompt Hint */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] flex items-center gap-1 backdrop-blur-xs pointer-events-none">
                    <Move size={10} /> Drag to adjust
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Controls: Zoom Slider + Reset Button */}
            <div className="space-y-3 bg-light-150/50 dark:bg-dark-200/40 p-3.5 rounded-xl border border-light-200 dark:border-dark-300">
              <div className="flex items-center justify-between text-xs text-dark-400 dark:text-light-400">
                <span className="font-semibold flex items-center gap-1.5 text-dark-200 dark:text-light-200">
                  <ZoomIn size={14} className="text-primary-500" /> Zoom Level
                </span>
                <span className="font-mono text-xs font-bold text-primary-500">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(1, Number((zoom - 0.15).toFixed(2)));
                    setZoom(next);
                    setPosition((prev) => clampPosition(prev.x, prev.y, next));
                  }}
                  className="p-1.5 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>

                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.02"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="flex-1 accent-primary-500 cursor-pointer h-1.5 bg-light-300 dark:bg-dark-300 rounded-lg appearance-none"
                />

                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(3, Number((zoom + 0.15).toFixed(2)));
                    setZoom(next);
                    setPosition((prev) => clampPosition(prev.x, prev.y, next));
                  }}
                  className="p-1.5 rounded-lg hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-light-200 dark:bg-dark-200 hover:bg-light-300 dark:hover:bg-dark-300 text-dark-300 dark:text-light-300 transition-colors flex items-center gap-1 shrink-0"
                  title="Reset alignment"
                >
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>

            {/* 3. Live Page Mockup Preview ("Never have to guess how the image will look") */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-dark-400 dark:text-light-400">
                <span className="font-semibold flex items-center gap-1 text-dark-200 dark:text-light-200">
                  <Eye size={13} className="text-primary-500" />
                  Live Preview on Your Author Page
                </span>
                <span className="text-[11px] font-mono text-dark-400 dark:text-light-400">
                  {isAvatar ? 'Circular 1:1' : 'Wide Banner 3:1'}
                </span>
              </div>

              {/* Mockup Card */}
              <div className="rounded-xl border border-light-200 dark:border-dark-300 bg-light-100 dark:bg-dark-200/30 overflow-hidden shadow-xs">
                {isAvatar ? (
                  /* Avatar in Profile Header context */
                  <div className="p-4 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={livePreviewUrl || imageSrc}
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 shadow-md"
                      />
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-primary-500 text-white">
                        <Check size={10} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-dark-100 dark:text-light-100 truncate">
                        {authorName}
                      </p>
                      <p className="text-xs text-dark-400 dark:text-light-400 truncate">
                        @{authorUsername}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                        Profile Photo Ready
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Banner Mockup with Avatar overlap */
                  <div>
                    <div className="relative h-24 sm:h-28 w-full bg-dark-900 overflow-hidden">
                      <img
                        src={livePreviewUrl || imageSrc}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-4 pb-3 flex items-end justify-between -mt-6">
                      <img
                        src={
                          currentAvatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&size=80`
                        }
                        alt="Author Avatar"
                        className="w-12 h-12 rounded-full object-cover border-2 border-light-100 dark:border-dark-100 shadow-md bg-dark-300"
                      />
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 mb-1">
                        Wide Banner Ready
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-5 py-3.5 bg-light-150/60 dark:bg-dark-200/60 border-t border-light-200 dark:border-dark-300 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold rounded-full border border-light-300 dark:border-dark-300 text-dark-200 dark:text-light-200 hover:bg-light-200 dark:hover:bg-dark-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCropped}
              disabled={isSaving || !imageLoaded}
              className="px-5 py-2 text-xs font-bold rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving & Uploading...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save & Apply</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageCropModal;
