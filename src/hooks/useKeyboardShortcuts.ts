import { useEffect, useCallback } from 'react';

/**
 * Detects if user's operating system is macOS / iOS
 */
export const isMac =
  typeof window !== 'undefined' &&
  (navigator.platform?.toUpperCase().indexOf('MAC') >= 0 ||
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent));

/**
 * Returns the human-readable modifier key label for current platform
 * 'Cmd' / '⌘' on macOS, 'Ctrl' on Windows / Linux
 */
export const getModifierKeyLabel = (symbolOnly = false): string => {
  if (isMac) return symbolOnly ? '⌘' : 'Cmd';
  return symbolOnly ? 'Ctrl' : 'Ctrl';
};

/**
 * Checks whether the platform primary modifier key (Cmd on Mac, Ctrl on Win/Linux) is pressed
 */
export const isModifierPressed = (e: KeyboardEvent | React.KeyboardEvent): boolean => {
  return isMac ? e.metaKey : e.ctrlKey;
};

/**
 * Global Hook to dismiss modals and overlays via the ESC key
 */
export const useEscapeKey = (onClose: () => void, active: boolean = true) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!active) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, active]);
};

export interface WritingShortcutsOptions {
  onPublish?: () => void;
  onSaveDraft?: () => void;
  onTogglePreview?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onLink?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onToggleShortcutsModal?: () => void;
  enabled?: boolean;
}

/**
 * Centralized Hook for Writing and Publishing Shortcuts
 * Handles Cmd/Ctrl modifiers across macOS, Windows, and Linux
 */
export const useWritingShortcuts = ({
  onPublish,
  onSaveDraft,
  onTogglePreview,
  onBold,
  onItalic,
  onUnderline,
  onLink,
  onUndo,
  onRedo,
  onToggleShortcutsModal,
  enabled = true,
}: WritingShortcutsOptions) => {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = isModifierPressed(e);

      // 1. Submit / Publish: Ctrl + Enter / Cmd + Enter
      if (mod && e.key === 'Enter') {
        if (onPublish) {
          e.preventDefault();
          e.stopPropagation();
          onPublish();
        }
        return;
      }

      // 2. Save Draft: Ctrl + S / Cmd + S
      if (mod && (e.key === 's' || e.key === 'S')) {
        if (onSaveDraft) {
          e.preventDefault();
          e.stopPropagation();
          onSaveDraft();
        }
        return;
      }

      // 3. Toggle Shortcuts Cheat Sheet: Ctrl + / or Cmd + /
      if (mod && e.key === '/') {
        if (onToggleShortcutsModal) {
          e.preventDefault();
          e.stopPropagation();
          onToggleShortcutsModal();
        }
        return;
      }

      // 4. Toggle Preview: Ctrl/Cmd + Shift + P
      if (mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        if (onTogglePreview) {
          e.preventDefault();
          e.stopPropagation();
          onTogglePreview();
        }
        return;
      }

      // 5. Bold: Ctrl/Cmd + B
      if (mod && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        if (onBold) {
          e.preventDefault();
          onBold();
        }
        return;
      }

      // 6. Italic: Ctrl/Cmd + I
      if (mod && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        if (onItalic) {
          e.preventDefault();
          onItalic();
        }
        return;
      }

      // 7. Underline: Ctrl/Cmd + U
      if (mod && !e.shiftKey && (e.key === 'u' || e.key === 'U')) {
        if (onUnderline) {
          e.preventDefault();
          onUnderline();
        }
        return;
      }

      // 8. Insert Link: Ctrl/Cmd + K
      if (mod && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        if (onLink) {
          e.preventDefault();
          onLink();
        }
        return;
      }

      // 9. Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) || (mod && (e.key === 'y' || e.key === 'Y'))) {
        if (onRedo) {
          e.preventDefault();
          onRedo();
        }
        return;
      }

      // 10. Undo: Ctrl/Cmd + Z
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (onUndo) {
          e.preventDefault();
          onUndo();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onPublish,
    onSaveDraft,
    onTogglePreview,
    onBold,
    onItalic,
    onUnderline,
    onLink,
    onUndo,
    onRedo,
    onToggleShortcutsModal,
  ]);
};
