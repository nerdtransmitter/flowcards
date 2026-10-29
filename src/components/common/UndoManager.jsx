import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

const UndoContext = createContext(null);

export function UndoProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [toastId, setToastId] = useState(null);

  const addUndo = useCallback((action) => {
    const undoItem = {
      id: Date.now(),
      action,
      timestamp: Date.now()
    };

    setUndoStack(prev => [...prev.slice(-9), undoItem]); // Keep last 10

    // Clear previous toast
    if (toastId) {
      toast.dismiss(toastId);
    }

    // Show new toast with undo option
    const newToastId = toast.success(action.message || 'Task completed', {
      duration: 5000,
      action: {
        label: 'Undo (⌘Z)',
        onClick: () => performUndo(undoItem)
      }
    });
    setToastId(newToastId);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setUndoStack(prev => prev.filter(item => item.id !== undoItem.id));
    }, 5000);
  }, [toastId]);

  const performUndo = useCallback(async (undoItem) => {
    if (!undoItem) {
      // Get most recent
      if (undoStack.length === 0) {
        toast.error('Nothing to undo');
        return;
      }
      undoItem = undoStack[undoStack.length - 1];
    }

    try {
      await undoItem.action.undo();
      setUndoStack(prev => prev.filter(item => item.id !== undoItem.id));
      toast.success('Undone!');
    } catch (error) {
      toast.error('Failed to undo');
      console.error('Undo error:', error);
    }
  }, [undoStack]);

  const handleKeyboardUndo = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (isTyping) return;

      e.preventDefault();
      if (undoStack.length > 0) {
        performUndo(undoStack[undoStack.length - 1]);
      }
    }
  }, [undoStack, performUndo]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyboardUndo);
    return () => window.removeEventListener('keydown', handleKeyboardUndo);
  }, [handleKeyboardUndo]);

  return (
    <UndoContext.Provider value={{ addUndo, performUndo }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  const context = useContext(UndoContext);
  if (!context) {
    throw new Error('useUndo must be used within UndoProvider');
  }
  return context;
}