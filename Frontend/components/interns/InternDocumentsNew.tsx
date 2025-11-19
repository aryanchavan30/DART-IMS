import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import db from '../../services/db_new';
import { Intern } from '../../services/db_new';
import { Role } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import FileUpload from '../ui/FileUpload';

interface InternDocumentsProps {
  internId: string;
  onClose?: () => void;
}

const InternDocuments: React.FC<InternDocumentsProps> = ({ internId, onClose }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [intern, setIntern] = useState<Intern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState({
    aadharCard: null as File | null,
    panCard: null as File | null,
    bankPassbook: null as File | null,
    noc:null as File | null,
  });

  useEffect(() => {
    fetchInternDetails();
  }, [internId]);

  const fetchInternDetails = async () => {
    try {
      setIsLoading(true);
      const internData = await db.interns.findById(internId);
      if (internData) {
        setIntern(internData);
      } else {
        addToast('Intern not found', 'error');
      }
    } catch (error) {
      addToast('Failed to load intern details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (field: keyof typeof uploadFiles, file: File | null) => {
    setUploadFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleUpload = async () => {
    const filesToUpload = Object.fromEntries(
      Object.entries(uploadFiles).filter(([_, file]) => file !== null)
    ) as { [K in keyof typeof uploadFiles]: File };

    if (Object.keys(filesToUpload).length === 0) {
      addToast('Please select at least one document to upload', 'warning');
      return;
    }

    try {
      setIsUploading(true);
      const updatedIntern = await db.interns.uploadDocuments(internId, filesToUpload);
      
      addToast('Documents uploaded successfully!', 'success');
      setIntern(updatedIntern);
      
      // Reset file selection
      setUploadFiles({
        aadharCard: null,
        panCard: null,
        bankPassbook: null,
        noc:null,
      });
      
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const 
  getDocumentUrl = (documentPath: string | undefined) => {
    if (!documentPath) return null;
    // If it's already a full URL, return as is
    if (documentPath.startsWith('http')) return documentPath;
    // Otherwise, construct the media URL
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return `${baseUrl}/media/${documentPath}`;
  };

  const canUpload = user?.role === Role.HR || user?.id === intern?.userId;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!intern) {
    return (
      <div className="text-center py-8 text-gray-500">
        Intern not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Onboarding Documents</h3>
          <p className="text-sm text-gray-500">{intern.userName} ({intern.userEmail})</p>
        </div>
        {onClose && (
          <Button variant="secondary" onClick={onClose} size="sm">
            Close
          </Button>
        )}
      </div>

      {/* Current Documents */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Current Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Aadhar Card */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h5 className="font-medium text-sm text-gray-700 mb-2">Aadhar Card</h5>
            {intern.aadharCardUrl ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  ✅ Uploaded
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(getDocumentUrl(intern.aadharCardUrl) || '', '_blank')}
                >
                  📄 View Document
                </Button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                ❌ Not uploaded
              </div>
            )}
          </div>

          {/* PAN Card */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h5 className="font-medium text-sm text-gray-700 mb-2">PAN Card</h5>
            {intern.panCardUrl ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  ✅ Uploaded
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(getDocumentUrl(intern.panCardUrl) || '', '_blank')}
                >
                  📄 View Document
                </Button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                ❌ Not uploaded
              </div>
            )}
          </div>

          {/* Bank Passbook */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h5 className="font-medium text-sm text-gray-700 mb-2">Bank Passbook / Cancelled Cheque</h5>
            {intern.bankPassbookUrl ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  ✅ Uploaded
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(getDocumentUrl(intern.bankPassbookUrl) || '', '_blank')}
                >
                  📄 View Document
                </Button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                ❌ Not uploaded
              </div>
            )}
          </div>

          {/*NOC*/}
          <div className="border rounded-lg p-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">NOC</h5>
              {intern.noc ? (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Uploaded
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(getDocumentUrl(intern.noc) || '', '_blank')}
                  >
                    View Document
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-gray-500 flex items-center">
                  <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                  Not uploaded
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Application Documents */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Application Documents</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Offer Letter */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h5 className="font-medium text-sm text-gray-700 mb-2">📋 Offer Letter</h5>
            {intern.offerLetterUrl ? (
              <div className="space-y-2">
                <div className="text-xs text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  ✅ Available
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(getDocumentUrl(intern.offerLetterUrl) || '', '_blank')}
                >
                  📄 View Offer Letter
                </Button>
              </div>
            ) : (
              <div className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-gray-300 rounded-full mr-2"></span>
                ❌ Not available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload New Documents */}
      {canUpload && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-blue-800 mb-3">Upload New Documents</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FileUpload
                id="aadhar_upload"
                label="Aadhar Card"
                onFileSelect={(file) => handleFileSelect('aadharCard', file)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <FileUpload
                id="pan_upload"
                label="PAN Card"
                onFileSelect={(file) => handleFileSelect('panCard', file)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <FileUpload
                id="bank_upload"
                label="Bank Passbook"
                onFileSelect={(file) => handleFileSelect('bankPassbook', file)}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <FileUpload
                  id="noc_upload"
                  label="NOC"
                  onFileSelect={(file) => handleFileSelect('noc', file)}
                  accept=".pdf,.jpg,.jpeg,.png"
              />
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleUpload}
                disabled={isUploading || Object.values(uploadFiles).every(file => !file)}
              >
                {isUploading ? '📤 Uploading...' : '📤 Upload Documents'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!canUpload && (
        <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
          ℹ️ You don't have permission to upload documents for this intern.
        </div>
      )}
    </div>
  );
};

export default InternDocuments;
