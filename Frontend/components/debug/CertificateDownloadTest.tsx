import React, { useState } from 'react';
import { certificateService } from '../../services/certificateService';
import { Role, Shift, InternStatus, DepartmentName } from '../../types';
import Button from '../ui/Button';

interface CertificateDownloadTestProps {}

const CertificateDownloadTest: React.FC<CertificateDownloadTestProps> = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificateData, setCertificateData] = useState<string>('');

  const generateAndTestCertificate = async () => {
    setIsGenerating(true);
    
    try {
      // Mock data exactly like in ExitProcess
      const exitRequestId = "1234";
      const internUser = {
        id: "1",
        name: "John Doe",
        email: "john.doe@example.com",
        role: Role.INTERN,
        department: "1",
        departmentName: "Information Technology",
        dob: "1995-01-01",
        shift: Shift.GENERAL,
        weekOffs: [0, 6],
      };
      
      const department = {
        id: "1",
        name: DepartmentName.WEB, // Using existing enum value
        hod: "2",
        hodName: "Department Head"
      };
      
      const hodUser = {
        id: "2",
        name: "Department Head",
        email: "hod@example.com",
        role: Role.HOD,
        department: "1",
        departmentName: "Information Technology",
        dob: "1975-01-01",
        shift: Shift.GENERAL,
        weekOffs: [0, 6],
      };
      
      const internProfile = {
        id: "1",
        user: "1",
        userName: "John Doe",
        candidate: "1",
        joining_date: "2024-01-01",
        mentor: "3",
        status: InternStatus.ACTIVE
      };

      // Generate certificate
      const certificateDataUri = await certificateService.generateCertificatePdf(
        exitRequestId,
        internUser,
        department,
        hodUser,
        internProfile
      );

      setCertificateData(certificateDataUri);
      
      // Test download immediately
      const link = document.createElement('a');
      link.href = certificateDataUri;
      link.download = `Test_Certificate_${internUser.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Certificate generated and download started! Check that the PDF displays text properly without overlapping.');
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadExistingCertificate = () => {
    if (!certificateData) {
      alert('No certificate data available. Generate one first.');
      return;
    }

    const link = document.createElement('a');
    link.href = certificateData;
    link.download = 'Test_Certificate_Download.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Certificate Download Test</h3>
      
      <div className="space-y-4">
        <div>
          <Button 
            onClick={generateAndTestCertificate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating Certificate...' : 'Generate & Download Certificate'}
          </Button>
        </div>

        {certificateData && (
          <div>
            <Button 
              onClick={downloadExistingCertificate}
              variant="secondary"
              className="w-full"
            >
              Download Certificate Again
            </Button>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Test Purpose:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Verify certificate PDF generation works</li>
            <li>Test that text is properly formatted (no overlapping)</li>
            <li>Confirm download functionality</li>
            <li>Validate base64 data URI handling</li>
          </ul>
        </div>

        {certificateData && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p className="text-xs text-gray-600 mb-2"><strong>Generated Certificate Data:</strong></p>
            <p className="text-xs font-mono bg-white p-2 rounded border break-all">
              {certificateData.substring(0, 100)}...
            </p>
            <p className="text-xs text-green-600 mt-1">✓ Certificate data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateDownloadTest;
