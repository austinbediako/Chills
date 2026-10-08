import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';
import { getModifierKeyLabel, useEscapeKey } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const mod = getModifierKeyLabel();

  const shortcutGroups = [
    {
      title: 'Publishing & Actions',
      shortcuts: [
        { keys: [mod, 'Enter'], description: 'Publish or Submit story' },
        { keys: [mod, 'S'], description: 'Save draft to cloud' },
        { keys: [mod, 'Shift', 'P'], description: 'Toggle live story preview' },
        { keys: ['Esc'], description: 'Close modals, overlays & menus' },
      ],
    },
    {
      title: 'Text Formatting',
      shortcuts: [
        { keys: [mod, 'B'], description: 'Bold text' },
        { keys: [mod, 'I'], description: 'Italic text' },
        { keys: [mod, 'U'], description: 'Underline text' },
        { keys: [mod, 'K'], description: 'Insert or edit hyperlink' },
        { keys: ['Enter'], description: 'New line / Paragraph break' },
      ],
    },
    {
      title: 'History & Editing',
      shortcuts: [
        { keys: [mod, 'Z'], description: 'Undo last edit' },
        { keys: [mod, 'Shift', 'Z'], description: 'Redo last edit' },
        { keys: [mod, 'A'], description: 'Select all text' },
        { keys: [mod, 'C'], description: 'Copy selected text' },
        { keys: [mod, 'X'], description: 'Cut selected text' },
        { keys: [mod, 'V'], description: 'Paste text from clipboard' },
        { keys: [mod, '/'], description: 'Show keyboard shortcuts' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-dark-900/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl h-[560px] max-h-[90vh] bg-light-100 dark:bg-dark-100 rounded-2xl shadow-2xl border border-light-300 dark:border-dark-300 flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-light-200 dark:border-dark-300 flex items-center justify-between bg-light-100/90 dark:bg-dark-100/90 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-500/10 text-primary-500">
                <Keyboard size={18} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-dark-100 dark:text-light-100 flex items-center gap-2">
                  <span>Keyboard Shortcuts</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-light-300 dark:bg-dark-300 text-dark-400 dark:text-light-400">
                    {mod}-driven
                  </span>
                </h3>
                <p className="text-xs text-dark-400 dark:text-light-400">
                  Standard desktop shortcuts for fast, fluid publishing
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-light-200 dark:hover:bg-dark-200 text-dark-400 hover:text-dark-100 dark:hover:text-light-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="space-y-2.5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  {group.title}
                </h4>
                <div className="rounded-xl border border-light-200 dark:border-dark-300 divide-y divide-light-200 dark:divide-dark-300 bg-light-200/30 dark:bg-dark-200/30 overflow-hidden">
                  {group.shortcuts.map((sc, i) => (
                    <div
                      key={i}
                      className="px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-light-200/50 dark:hover:bg-dark-200/50 transition-colors"
                    >
                      <span className="text-dark-200 dark:text-light-200 font-medium">
                        {sc.description}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {sc.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="px-2 py-1 rounded-md bg-light-100 dark:bg-dark-100 border border-light-300 dark:border-dark-300 font-mono text-[11px] font-bold text-dark-100 dark:text-light-100 shadow-2xs"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-light-200 dark:border-dark-300 bg-light-150/40 dark:bg-dark-200/40 flex items-center justify-between text-xs text-dark-400 dark:text-light-400 shrink-0">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-light-300 dark:bg-dark-300 font-mono text-[10px]">Esc</kbd> anytime to close</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full bg-dark-100 dark:bg-light-100 text-light-100 dark:text-dark-100 font-bold hover:scale-105 active:scale-95 transition-all text-xs"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
