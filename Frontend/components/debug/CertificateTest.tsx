import React from 'react';
import { certificateService } from '../../services/certificateService';
import { Role, Shift, DepartmentName, InternStatus } from '../../types';

interface CertificateTestProps {}

const CertificateTest: React.FC<CertificateTestProps> = () => {
  const handleGenerateTestCertificate = async () => {
    // Mock test data matching the expected parameter structure
    const exitRequestId = "123";
    const internUser = {
      id: "1",
      loginId: "testuser",
      name: "Test User",
      email: "test@example.com",
      role: Role.INTERN,
      department: "1",
      departmentName: "Information Technology",
      dob: "1995-01-01",
      shift: Shift.GENERAL,
      weekOffs: [0, 6],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    };
    const department = {
      id: "1",
      name: DepartmentName.WEB,
      hod: "2",
      hodName: "HOD Sir"
    };
    const hodUser = {
      id: "2",
      loginId: "hodsir",
      name: "HOD Sir",
      email: "hod@example.com",
      role: Role.HOD,
      department: "1",
      departmentName: "Information Technology",
      dob: "1980-01-01",
      shift: Shift.GENERAL,
      weekOffs: [0, 6],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    };
    const internProfile = {
      id: "1",
      user: "1",
      userName: "Test User",
      userEmail: "test@example.com",
      candidate: "1",
      joining_date: "2024-01-01",
      mentor: "2",
      mentorName: "Mentor Name",
      departmentName: "Information Technology",
      extension_allowed: false,
      status: InternStatus.ACTIVE
    };

    try {
      const pdfDataUri = await certificateService.generateCertificatePdf(
        exitRequestId,
        internUser,
        department,
        hodUser,
        internProfile
      );
      
      // Create a download link and click it
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `internship_certificate_test.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Certificate generated successfully! Check if text is properly formatted without overlapping.');
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please check the console for details.');
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Certificate Generation Test</h3>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Click the button below to test PDF certificate generation with the fixed text rendering.
        </p>
        <button
          onClick={handleGenerateTestCertificate}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Generate Test Certificate PDF
        </button>
        <div className="text-sm text-gray-500 mt-2">
          <p><strong>Test Data:</strong></p>
          <ul className="list-disc pl-5">
            <li>Name: Test User</li>
            <li>Department: Information Technology</li>
            <li>Duration: 6 months (Jan 1, 2024 - Jun 30, 2024)</li>
            <li>Supervisor: Test Supervisor</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CertificateTest;
