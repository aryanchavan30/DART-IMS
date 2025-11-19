import React, { useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import { useToast } from '../../hooks/useToast';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  title: string;
  isConfirming?: boolean;
  children?: React.ReactNode;
  confirmText?: string;
  promptText?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isConfirming = false,
  children,
  confirmText = 'I Accept & Sign',
  promptText = 'By signing below, you are digitally approving this invoice and confirming its details are correct.',
}) => {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const { addToast } = useToast();

  const handleConfirm = () => {
    if (signaturePadRef.current?.isEmpty()) {
        addToast('Please provide your signature.', 'error');
        return;
    }
    const signatureData = signaturePadRef.current?.getSignature();
    if (signatureData) {
        onConfirm(signatureData);
    }
  };
  
  const handleClear = () => {
    signaturePadRef.current?.clear();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="4xl">
      <div className="space-y-4">
        {children && (
          <div className="max-h-[50vh] overflow-y-auto border border-slate-200 rounded-md p-6 mb-4 bg-slate-50 shadow-inner">
            {children}
          </div>
        )}
        <p className="text-sm text-slate-600 text-center font-medium">{promptText}</p>
        <div className="flex justify-center">
            <SignaturePad ref={signaturePadRef} />
        </div>
        <div className="flex justify-between items-center pt-4">
            <Button variant="secondary" onClick={handleClear} disabled={isConfirming}>
                Clear Signature
            </Button>
            <div className="space-x-2">
                <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
                    Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={isConfirming}>
                    {isConfirming ? 'Submitting...' : confirmText}
                </Button>
            </div>
        </div>
      </div>
    </Modal>
  );
};

export default SignatureModal;