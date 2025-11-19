import React from 'react';
import { Stipend, User, Department, Intern } from '../../types';

interface InvoicePreviewProps {
    stipend: Stipend;
    internUser: User;
    department: Department;
    hodUser: User;
    internProfile: Intern;
    hrSignatureUrl?: string;
    internSignatureUrl?: string;
}

const formatStipendMonth = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ stipend, internUser, department, hodUser, internProfile, hrSignatureUrl, internSignatureUrl }) => {
    const invoiceDate = new Date();
    const monthYear = formatStipendMonth(stipend.month);

    const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <div>
            <h3 className="text-xs font-bold text-primary-navy tracking-wider uppercase border-b-2 border-primary-navy pb-1 mb-2">{title}</h3>
            <div className="space-y-1 text-sm text-slate-700">
                {children}
            </div>
        </div>
    );
    
    const DetailItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <p><span className="text-slate-500">{label}:</span> <span className="font-semibold">{value}</span></p>
    );

    const StipendRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <p className="text-sm text-slate-700">{label}</p>
            <p className="text-sm font-semibold text-slate-800">{value}</p>
        </div>
    );

    return (
        <div className="font-sans bg-white p-4">
            <header className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-primary-navy">INVOICE</h1>
                </div>
                <div className="text-right text-xs">
                    <p><span className="font-bold">Invoice No:</span> {`${invoiceDate.getFullYear()}${String(invoiceDate.getMonth() + 1).padStart(2, '0')}${stipend.id.toUpperCase()}`}</p>
                    <p><span className="font-bold">Date:</span> {invoiceDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </header>

            <section className="mb-8">
                <DetailSection title="Bill To">
                    <p className="font-bold">Solar Industries India Ltd</p>
                    <p>Solar House 14, Kachimet, NH-6</p>
                    <p>Nagpur - 440023</p>
                    <p className="mt-2"><span className="text-slate-500">Kind Attention:</span> Mr {hodUser.name} (HOD-{department.name})</p>
                </DetailSection>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <DetailSection title="Personal Details">
                    <DetailItem label="Name" value={internUser.name} />
                    <DetailItem label="Address" value="ZEO New Nehru Nagar, Nagpur" />
                    <DetailItem label="Personal Email" value={internUser.email} />
                    <DetailItem label="Contact No" value="9911709999" />
                </DetailSection>
                <DetailSection title="Bank Details">
                    <DetailItem label="Bank Name" value={internProfile.bank_details?.bank_name || 'Not provided'} />
                    <DetailItem label="Account Number" value={internProfile.bank_details?.account_number || 'Not provided'} />
                    <DetailItem label="IFSC Code" value={internProfile.bank_details?.ifsc_code || 'Not provided'} />
                    <DetailItem label="PAN Number" value={internProfile.bank_details?.pan_number || 'Not provided'} />
                </DetailSection>
            </section>

            <section>
                <DetailSection title="Stipend Details">
                    <StipendRow label="Stipend against internship for the current month" value={`Rs. ${stipend.amount.toLocaleString('en-IN')}`} />
                    <StipendRow label="Total days in month (including Holiday)" value={new Date(parseInt(stipend.month.split('-')[0]), parseInt(stipend.month.split('-')[1]), 0).getDate()} />
                    <StipendRow label="Present Days" value={stipend.working_days} />
                    <StipendRow label="Month" value={monthYear.split(' ')[0]} />
                    <StipendRow label="HOD Name" value={hodUser.name} />
                    <StipendRow label="Date of Joining" value={new Date(internProfile.joining_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} />
                </DetailSection>
            </section>

            <footer className="mt-8 pt-4 border-t-2 border-primary-navy">
                 <div className="flex justify-between items-center mb-12">
                    <p className="text-md font-bold mr-4">Total Invoice Amount Payable</p>
                    <p className="text-xl font-bold text-primary-navy">Rs. {stipend.amount.toLocaleString('en-IN')}</p>
                </div>
                <div className="mt-16 grid grid-cols-2 gap-8 text-center">
                    <div>
                        {hrSignatureUrl && <img src={hrSignatureUrl} alt="HR Signature" className="h-12 mx-auto" />}
                        <div className="border-t border-slate-400 mt-2 pt-1">
                            <p className="text-sm font-semibold">Checked By (HR)</p>
                        </div>
                    </div>
                    <div>
                        {internSignatureUrl ? (
                            <img src={internSignatureUrl} alt="Intern Signature" className="h-12 mx-auto" />
                        ) : (
                            <div className="h-12 border-b border-dashed border-slate-400 mb-2">
                                <p className="text-slate-400 text-xs pt-4">Intern signs here</p>
                            </div>
                        )}
                        <div className="border-t border-slate-400 mt-2 pt-1">
                            <p className="text-sm font-semibold">Signature of Candidate</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InvoicePreview;