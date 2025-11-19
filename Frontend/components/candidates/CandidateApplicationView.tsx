import React from 'react';

// Helper component for displaying read-only application data
const ViewRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0 border-b border-slate-200 last:border-b-0">
        <dt className="text-sm font-medium leading-6 text-slate-600">{label}</dt>
        <dd className="mt-1 text-sm leading-6 text-slate-800 font-medium sm:col-span-2 sm:mt-0">{value || 'N/A'}</dd>
    </div>
);

// Component to display the full candidate application form in view-only mode
interface CandidateApplicationViewProps {
    questData: Record<string, any> | undefined;
    fallbackFullName?: string;
    fallbackEmail?: string;
}

const CandidateApplicationView: React.FC<CandidateApplicationViewProps> = ({ questData, fallbackFullName, fallbackEmail }) => {
    if (!questData || Object.keys(questData).length === 0) {
        return <div className="text-center py-10 text-slate-500">No detailed application data found for this candidate.</div>;
    }

    const getField = (keys: string[]): any => {
        for (const k of keys) {
            const v = (questData as any)[k];
            if (v !== undefined && v !== null) {
                if (typeof v === 'string') {
                    if (v.trim() !== '') return v;
                } else {
                    return v;
                }
            }
        }
        return undefined;
    };

    const computedFullName = (questData.firstName || questData.lastName)
        ? `${questData.firstName || ''} ${questData.lastName || ''}`.trim()
        : (fallbackFullName || '');

    // Email, Contact, Preferred Location with synonyms
    const emailVal = getField(['email']) || fallbackEmail;
    const contactVal = getField(['contactNumber','contact','phone','mobile','phoneNumber']);
    const preferredLocationVal = getField(['preferredLocation']);

    // Address: check synonyms like address/addressLine1/2
    const street1 = getField(['streetAddress','address','addressLine1']);
    const street2 = getField(['streetAddress2','address2','addressLine2']);
    const city = getField(['city']);
    const state = getField(['state']);
    const zip = getField(['zip']);

    const parts: string[] = [];
    const street = [street1, street2].filter(Boolean).join(', ').trim();
    if (street) parts.push(street);
    const cityState = [city, state].filter(Boolean).join(', ').trim();
    if (cityState) parts.push(cityState);
    const addressDisplay = [parts.join(', '), zip].filter(Boolean).join(' - ');

    return (
        <div className="space-y-6 bg-light-gray p-4 rounded-md">
            <div>
                <h3 className="text-base font-semibold leading-7 text-primary-navy">Personal Information</h3>
                <div className="mt-2">
                    <dl className="divide-y divide-slate-200">
                        <ViewRow label="Full Name" value={computedFullName} />
                        <ViewRow label="Date of Birth" value={questData.dob} />
                        <ViewRow label="Gender" value={questData.gender} />
                        <ViewRow label="Preferred Location" value={preferredLocationVal} />
                        <ViewRow label="Email" value={emailVal} />
                        <ViewRow label="Contact Number" value={contactVal} />
                        <ViewRow label="LinkedIn Profile" value={questData.linkedinProfile ? <a href={questData.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-primary-red hover:underline">{questData.linkedinProfile}</a> : 'N/A'} />
                        <ViewRow label="Address" value={addressDisplay} />
                    </dl>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold leading-7 text-primary-navy">Academic & Professional</h3>
                 <div className="mt-2">
                    <dl className="divide-y divide-slate-200">
                        <ViewRow label="Applicant Status" value={questData.applicantStatus} />
                        <ViewRow label="College Name" value={questData.collegeName} />
                        <ViewRow label="Qualification" value={questData.qualification} />
                        <ViewRow label="Semester" value={questData.semester} />
                        <ViewRow label="Branch (Major)" value={questData.branch} />
                        <ViewRow label="Area of Interest" value={questData.areaOfInterest} />
                        <ViewRow label="Reference" value={questData.reference} />
                    </dl>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold leading-7 text-primary-navy">Training & Placement Officer Details</h3>
                 <div className="mt-2">
                    <dl className="divide-y divide-slate-200">
                        <ViewRow label="TPO Name" value={questData.tpoName} />
                        <ViewRow label="TPO Designation" value={questData.tpoDesignation} />
                        <ViewRow label="TPO Email" value={questData.tpoEmail} />
                        <ViewRow label="TPO Contact" value={questData.tpoContact} />
                    </dl>
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold leading-7 text-primary-navy">Declarations</h3>
                 <div className="mt-2">
                    <dl className="divide-y divide-slate-200">
                        <ViewRow label="Available for 6 months?" value={questData.availableFor6Months} />
                        <ViewRow label="Willing to work in rotational shifts?" value={questData.rotationalShifts} />
                        <ViewRow label="NOC Declaration" value={questData.nocDeclaration ? 'Yes' : 'No'} />
                        <ViewRow label="Information Truth Declaration" value={questData.infoTruthDeclaration ? 'Yes' : 'No'} />
                    </dl>
                </div>
            </div>
        </div>
    );
};

export default CandidateApplicationView;
