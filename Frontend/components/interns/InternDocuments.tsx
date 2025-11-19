import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import apiService from '../../services/apiService';
import { Intern, Role } from '../../types';
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
    aadhar_card: null as File | null,
    pan_card: null as File | null,
    bank_passbook: null as File | null,
    noc:null as File | null,
  });

  useEffect(() => {
    fetchInternDetails();
  }, [internId]);

  const fetchInternDetails = async () => {
    try {
      setIsLoading(true);
      const internData = await apiService.getInternById(internId);
      setIntern(internData);
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
      const result = await apiService.uploadInternDocuments(internId, filesToUpload);
      
      addToast(result.message, 'success');
      setIntern(result.intern);
      
      // Reset file selection
      setUploadFiles({
        aadhar_card: null,
        pan_card: null,
        bank_passbook: null,
      });
      
    } catch (error) {
      addToast(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentUrl = (documentPath: string | undefined) => {
    if (!documentPath) return null;
    // If it's already a full URL, return as is
    if (documentPath.startsWith('http')) return documentPath;
    // Otherwise, construct the media URL
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    return `${baseUrl}/media/${documentPath}`;
  };

  const canUpload = user?.role === Role.HR || user?.id === intern?.user;

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Card>
    );
  }

  if (!intern) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-500">
          Intern not found
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
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
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">Aadhar Card</h5>
              {intern.aadhar_card ? (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Uploaded
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(getDocumentUrl(intern.aadhar_card) || '', '_blank')}
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

            {/* PAN Card */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">PAN Card</h5>
              {intern.pan_card ? (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Uploaded
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(getDocumentUrl(intern.pan_card) || '', '_blank')}
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

            {/* Bank Passbook */}
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-sm text-gray-700 mb-2">Bank Passbook</h5>
              {intern.bank_passbook ? (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Uploaded
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(getDocumentUrl(intern.bank_passbook) || '', '_blank')}
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

        {/* Upload New Documents */}
        {canUpload && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">Upload New Documents</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FileUpload
                  id="aadhar_upload"
                  label="Aadhar Card"
                  onFileSelect={(file) => handleFileSelect('aadhar_card', file)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <FileUpload
                  id="pan_upload"
                  label="PAN Card"
                  onFileSelect={(file) => handleFileSelect('pan_card', file)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <FileUpload
                  id="bank_upload"
                  label="Bank Passbook"
                  onFileSelect={(file) => handleFileSelect('bank_passbook', file)}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || Object.values(uploadFiles).every(file => !file)}
                >
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {!canUpload && (
          <div className="text-sm text-gray-500 italic">
            You don't have permission to upload documents for this intern.
          </div>
        )}
      </div>
    </Card>
  );
};

export default InternDocuments;
