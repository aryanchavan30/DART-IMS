import jsPDF from 'jspdf';
import { User, Department, Intern } from '../types';

// Helper to format dates
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const generateCertificatePdf = async (
    exitRequestId: string,
    internUser: User,
    department: Department,
    hodUser: User,
    internProfile: Intern
): Promise<string> => {
    // Create PDF in US Letter format (8.5" x 11")
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
    });
    
    const issueDate = new Date();
    const startDate = formatDate(internProfile.joining_date);
    // Assuming 6 month internship. This logic is also in ExitProcess.tsx.
    const endDateString = new Date(new Date(internProfile.joining_date).setMonth(new Date(internProfile.joining_date).getMonth() + 6)).toISOString().split('T')[0];
    const endDate = formatDate(endDateString);

    const referenceNo = `SIIL/HR/DART/${exitRequestId.padStart(4, '0')}`;

    // Letter format dimensions and margins
    const pageWidth = 8.5;
    const pageHeight = 11;
    const leftMargin = 1;
    const rightMargin = pageWidth - 1;
    const topMargin = 1;
    const contentWidth = rightMargin - leftMargin;

    // Set fonts and colors
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);

    // Header - properly positioned for letter format
    doc.setFontSize(11);
    doc.text(referenceNo, leftMargin, topMargin + 0.5);
    doc.text(`Date: ${issueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightMargin, topMargin + 0.5, { align: 'right' });

    // Title - centered and properly spaced
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('TO WHOMSOEVER IT MAY CONCERN', pageWidth / 2, 2.5, { align: 'center' });
    doc.setLineWidth(0.02);
    doc.line(pageWidth / 2 - 2, 2.65, pageWidth / 2 + 2, 2.65);

    // Body - well spaced from title
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text('This is to certify as follows:', leftMargin, 3.5);

    let y = 4.2;

    // Line 1 - Build text with proper bold positioning for letter format
    let currentX = leftMargin;
    doc.setFont('times', 'normal');
    doc.text('1. Mr/Ms ', currentX, y);
    currentX += doc.getTextWidth('1. Mr/Ms ');
    
    doc.setFont('times', 'bold');
    doc.text(internUser.name, currentX, y);
    currentX += doc.getTextWidth(internUser.name);
    
    doc.setFont('times', 'normal');
    doc.text(', has successfully completed his/her internship from ', currentX, y);
    currentX += doc.getTextWidth(', has successfully completed his/her internship from ');
    
    // Check if we need to wrap to next line
    if (currentX + doc.getTextWidth(startDate) > rightMargin - 0.5) {
        y += 0.25;
        currentX = leftMargin + 0.2; // Indent for continuation
    }
    
    doc.setFont('times', 'bold');
    doc.text(startDate, currentX, y);
    currentX += doc.getTextWidth(startDate);
    
    doc.setFont('times', 'normal');
    doc.text(' to ', currentX, y);
    currentX += doc.getTextWidth(' to ');
    
    doc.setFont('times', 'bold');
    doc.text(endDate, currentX, y);
    currentX += doc.getTextWidth(endDate);
    
    doc.setFont('times', 'normal');
    doc.text(' with our Organization.', currentX, y);
    
    y += 0.5;

    // Line 2 - Build text with proper bold positioning
    y += 0.5;
    currentX = leftMargin;
    
    doc.setFont('times', 'normal');
    doc.text('2. The Internship undertaken by him/her in ', currentX, y);
    currentX += doc.getTextWidth('2. The Internship undertaken by him/her in ');
    
    doc.setFont('times', 'bold');
    doc.text(department.name.toUpperCase(), currentX, y);
    currentX += doc.getTextWidth(department.name.toUpperCase());
    
    doc.setFont('times', 'normal');
    
    // Check if we need to wrap to next line for HOD name
    if (currentX + doc.getTextWidth(' department under guidance of Mr. ') > rightMargin - 0.5) {
        y += 0.25;
        currentX = leftMargin + 0.2; // Indent for continuation
        doc.text('department under guidance of Mr. ', currentX, y);
        currentX += doc.getTextWidth('department under guidance of Mr. ');
    } else {
        currentX += doc.getTextWidth(' department under guidance of Mr. ');
    }
    
    doc.setFont('times', 'bold');
    doc.text(hodUser.name, currentX, y);
    currentX += doc.getTextWidth(hodUser.name);
    
    doc.setFont('times', 'normal');
    doc.text('.', currentX, y);
    
    y += 0.5;

    // Line 3
    y += 0.5;
    doc.setFont('times', 'normal');
    doc.text('3. During the period, he/she was found hardworking, diligent, and inquisitive.', leftMargin, y);
    y += 0.5;

    // Closing
    y += 0.5;
    doc.text('We wish all success in his/her future endeavors.', leftMargin, y);
    y += 1.5;

    // Signature Area - with proper bold formatting
    doc.setFont('times', 'bold');
    doc.text('Solar Industries India Limited', leftMargin, y);
    y += 1;

    doc.setFont('times', 'bold');
    doc.text('Ashish Khole', leftMargin, y);
    y += 0.3;
    doc.setFont('times', 'normal');
    doc.text('HEAD - HR', leftMargin, y);

    return doc.output('datauristring');
};

export const certificateService = {
  generateCertificatePdf,
};