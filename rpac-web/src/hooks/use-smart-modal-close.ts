import { useState, useCallback } from 'react';

interface UseSmartModalCloseOptions {
  hasUnsavedWork: boolean;
  modalId?: string;
  onClose: () => void;
}

export function useSmartModalClose({ 
  hasUnsavedWork, 
  modalId, 
  onClose 
}: UseSmartModalCloseOptions) {
  const [isPreventingClose, setIsPreventingClose] = useState(false);

  const handleClose = useCallback(() => {
    if (hasUnsavedWork) {
      // Visual feedback: briefly highlight the modal to show it's "sticky"
      if (modalId) {
        const modal = document.querySelector(`[data-modal="${modalId}"]`);
        if (modal) {
          modal.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-50');
          setIsPreventingClose(true);
          setTimeout(() => {
            modal.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-50');
            setIsPreventingClose(false);
          }, 300);
        }
      }
      return; // Don't close
    }
    onClose();
  }, [hasUnsavedWork, modalId, onClose]);

  return {
    handleClose,
    isPreventingClose
  };
}
