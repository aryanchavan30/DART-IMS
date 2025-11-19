
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'primary',
  isConfirming = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="text-slate-600">{message}</div>
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Confirming...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
