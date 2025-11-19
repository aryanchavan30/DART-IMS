import React from 'react';
import Modal from '../ui/Modal';
import InvoicePreview from './InvoicePreview';
import { Stipend, User, Department, Intern } from '../../types';

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    stipend: Stipend;
    internUser: User;
    department: Department;
    hodUser: User;
    internProfile: Intern;
    hrSignatureUrl?: string;
    internSignatureUrl?: string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
    isOpen,
    onClose,
    stipend,
    internUser,
    department,
    hodUser,
    internProfile,
    hrSignatureUrl,
    internSignatureUrl
}) => {
    const formatStipendMonth = (monthStr: string) => {
        if (!monthStr || !monthStr.includes('-')) return monthStr;
        const [year, month] = monthStr.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        return `${monthName} ${year}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Invoice Preview - ${internUser.name} (${formatStipendMonth(stipend.month)})`}
            size="4xl"
        >
            <div className="max-h-[80vh] overflow-y-auto">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <InvoicePreview
                        stipend={stipend}
                        internUser={internUser}
                        department={department}
                        hodUser={hodUser}
                        internProfile={internProfile}
                        hrSignatureUrl={hrSignatureUrl}
                        internSignatureUrl={internSignatureUrl}
                    />
                </div>
                
                {/* Modal Actions */}
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoicePreviewModal;