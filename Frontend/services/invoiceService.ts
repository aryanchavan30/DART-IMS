import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Stipend, User, Department, Intern } from '../types';

// Helper to format the stipend month string
const formatStipendMonth = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    const monthName = date.toLocaleString('default', { month: 'long' });
    return `${monthName} ${year}`;
};

const generateInvoicePdf = async (
    stipend: Stipend,
    internUser: User,
    department: Department,
    hodUser: User,
    internProfile: Intern,
    internSignatureUrl: string,
    hrSignatureUrl?: string
): Promise<string> => {
    const doc = new jsPDF();
    const invoiceDate = new Date();
    const monthYear = formatStipendMonth(stipend.month);

    // HEADER
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 20, 40); // primary-navy
    doc.text('INVOICE', 14, 22);

    // BILL TO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 14, 40);
    doc.setLineWidth(0.5);
    doc.line(14, 42, 34, 42);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Solar Industries India Ltd', 14, 48);
    doc.text('Solar House 14, Kachimet, NH-6', 14, 54);
    doc.text('Nagpur - 440023', 14, 60);
    doc.text(`Kind Attention: Mr ${hodUser.name} (HOD-${department.name})`, 14, 66);

    // INVOICE NO & DATE (Right side)
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', 140, 40);
    doc.text('Date:', 140, 46);
    doc.setFont('helvetica', 'normal');
    doc.text(`${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${stipend.id.toUpperCase()}`, 165, 40);
    doc.text(invoiceDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 165, 46);
    
    // --- DETAILS SECTIONS ---
    const detailsY = 85;
    // PERSONAL DETAILS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PERSONAL DETAILS', 14, detailsY);
    doc.line(14, detailsY + 2, 58, detailsY + 2);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let personalY = detailsY + 8;
    doc.text(`Name: ${internUser.name}`, 14, personalY);
    doc.text(`Address: ZEO New Nehru Nagar, Nagpur`, 14, personalY += 6); // Placeholder
    doc.text(`Personal Email: ${internUser.email}`, 14, personalY += 6);
    doc.text(`Contact No: 9911709999`, 14, personalY += 6); // Placeholder

    // BANK DETAILS
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BANK DETAILS', 110, detailsY);
    doc.line(110, detailsY + 2, 145, detailsY + 2);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    let bankY = detailsY + 8;
    doc.text(`Bank Name: ${internProfile.bank_details?.bank_name || 'Not provided'}`, 110, bankY);
    doc.text(`Account Number: ${internProfile.bank_details?.account_number || 'Not provided'}`, 110, bankY += 6);
    doc.text(`IFSC Code: ${internProfile.bank_details?.ifsc_code || 'Not provided'}`, 110, bankY += 6);
    doc.text(`PAN Number: ${internProfile.bank_details?.pan_number || 'Not provided'}`, 110, bankY += 6);

    // --- STIPEND DETAILS ---
    const stipendDetailsY = 130;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('STIPEND DETAILS', 14, stipendDetailsY);
    doc.line(14, stipendDetailsY + 2, 58, stipendDetailsY + 2);
    
    const body = [
        ['Stipend against internship for the current month', `Rs. ${stipend.amount.toLocaleString('en-IN')}`],
        ['Total days in month (including Holiday)', new Date(parseInt(stipend.month.split('-')[0]), parseInt(stipend.month.split('-')[1]), 0).getDate().toString()],
        ['Present Days', stipend.working_days.toString()],
        ['Month', monthYear.split(' ')[0]],
        ['HOD Name', hodUser.name],
        ['Date of Joining', new Date(internProfile.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })]
    ];
    
    autoTable(doc, {
        startY: stipendDetailsY + 5,
        body: body,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 2.5 },
        columnStyles: { 
            0: { cellWidth: 120 },
            1: { halign: 'right', cellWidth: 'auto' }
        },
        didDrawCell: (data) => {
            if (data.section === 'body') {
                doc.setDrawColor(230, 230, 230); // light-gray
                doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
            }
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // TOTAL
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Invoice Amount Payable', 14, finalY + 18);
    doc.text(`Rs. ${stipend.amount.toLocaleString('en-IN')}`, 196, finalY + 18, { align: 'right' });

    // SIGNATURES
    const sigY = finalY + 60;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Checked By (HR) Signature
    doc.text('Checked By', 35, sigY + 15, { align: 'center' });
    doc.line(14, sigY, 80, sigY);
    if (hrSignatureUrl) {
        try {
            doc.addImage(hrSignatureUrl, 'PNG', 18, sigY - 15, 60, 20);
        } catch(e) {
            console.error("Error adding HR signature image to PDF:", e);
            doc.text('[HR Signature]', 35, sigY - 5, { align: 'center' });
        }
    }
    
    // Candidate Signature
    try {
        doc.addImage(internSignatureUrl, 'PNG', 133, sigY - 15, 60, 20);
    } catch(e) {
        console.error("Error adding intern signature image to PDF:", e);
        doc.text('[Signature could not be loaded]', 140, sigY - 5);
    }
    doc.line(130, sigY, 196, sigY);
    doc.text('Signature of Candidate', 163, sigY + 15, { align: 'center' });
    
    return doc.output('datauristring');
};

export const invoiceService = {
  generateInvoicePdf,
};