
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import apiService from '../services/apiService';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import FileUpload from '../components/ui/FileUpload';
import RadioGroup from '../components/ui/RadioGroup';
import Checkbox from '../components/ui/Checkbox';
import { ArrowLeft } from 'lucide-react';

const FormRow: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required }) => (
    <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-200">
        <label className="text-sm font-medium text-secondary-blue md:pt-2">
            {label} {required && <span className="text-primary-red">*</span>}
        </label>
        <div className="md:col-span-2">
            {children}
        </div>
    </div>
);


const AddNewCandidate: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: '', gender: 'Female', preferredLocation: 'SCL Dhule',
        email: '', contactNumber: '', linkedinProfile: '', streetAddress: '', streetAddress2: '',
        city: '', state: '', zip: '', applicantStatus: 'Student', collegeName: 'VNIT College',
        qualification: 'B.Tech', semester: 'VIII', branch: 'Computer Science', areaOfInterest: 'Web Development',
        reference: 'LINKEDIN', availableFor6Months: 'Yes', nocDeclaration: true, tpoName: '',
        tpoDesignation: '', tpoEmail: '', tpoContact: '', rotationalShifts: 'Yes', infoTruthDeclaration: false,
    });

    const [files, setFiles] = useState({
        cv: null as File | null, photo: null as File | null,
        projectReport: null as File | null, signature: null as File | null,
    });

    const handleFileSelect = (field: keyof typeof files, file: File | null) => {
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.infoTruthDeclaration) {
            addToast('You must declare that the information provided is true.', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            
            // Prepare candidate data for API
            // Create a clean quest_data object with only serializable values
            const questData = {
                firstName: String(formData.firstName || ''),
                lastName: String(formData.lastName || ''),
                dob: String(formData.dob || ''),
                gender: String(formData.gender || ''),
                preferredLocation: String(formData.preferredLocation || ''),
                email: String(formData.email || ''),
                contactNumber: String(formData.contactNumber || ''),
                linkedinProfile: String(formData.linkedinProfile || ''),
                streetAddress: String(formData.streetAddress || ''),
                streetAddress2: String(formData.streetAddress2 || ''),
                city: String(formData.city || ''),
                state: String(formData.state || ''),
                zip: String(formData.zip || ''),
                applicantStatus: String(formData.applicantStatus || ''),
                collegeName: String(formData.collegeName || ''),
                qualification: String(formData.qualification || ''),
                semester: String(formData.semester || ''),
                branch: String(formData.branch || ''),
                areaOfInterest: String(formData.areaOfInterest || ''),
                reference: String(formData.reference || ''),
                availableFor6Months: String(formData.availableFor6Months || ''),
                nocDeclaration: Boolean(formData.nocDeclaration),
                tpoName: String(formData.tpoName || ''),
                tpoDesignation: String(formData.tpoDesignation || ''),
                tpoEmail: String(formData.tpoEmail || ''),
                tpoContact: String(formData.tpoContact || ''),
                rotationalShifts: String(formData.rotationalShifts || ''),
                infoTruthDeclaration: Boolean(formData.infoTruthDeclaration),
            };

            const candidateData = {
                name: fullName,
                email: formData.email,
                resume: files.cv,
                photo: files.photo,
                signature: files.signature,
                last_project_report: files.projectReport,
                quest_data: questData,
            };

            await apiService.createCandidate(candidateData);

            addToast('Candidate application submitted successfully!', 'success');
            navigate('/candidates');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add candidate.';
            addToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Options for dropdowns
    const collegeOptions = [
  "VNIT Nagpur",
  "Priyadarshini J. L. College Of Engineering",
  "Government College of Engineering, Nagpur",
  "Nagpur Institute of Technology, Nagpur",
  "G. H. Raisoni College of Engineering",
  "Shri Ramdeobaba College of Engineering",
  "K.D.K. College of Engineering, Nagpur",
  "Govindrao Wanjari College of Engineering and Technology",
  "J D College of Engineering and Management",
  "Priyadarshani College of Engineering, Nagpur",
  "Guru Nanak Institute of Engineering & Technology, Kalmeshwar, Nagpur",
  "Shree Govindrao Wanjari College of Engineering & Technology, Nagpur",
  "Jhulelal Institute of Technology, Nagpur",
  "Vilasrao Deshmukh College of Engineering and Technology, Nagpur",
  "Wainganga College of Engineering and Management",
  "Priyadarshini Bhagwati College of Engineering, Harpur Nagar, Umred Road, Nagpur",
  "Swaminarayan Siddhanta Institute Of Technology, Nagpur",
  "Suryodaya College of Engineering & Technology, Nagpur",
  "S. B. Jain Institute of Technology, Management",
  "YCCE College",
  "Government College of Engineering, Nagpur",
  "Tirpude College",
  "St. Vincent Pallotti College of Engineering and Technology, Nagpur",
  "RTMNU Oberoi Centre for Excellence",
  "Dr. Punjabrao Deshmukh Institute of Management and Technology Research, Nagpur",
  "Dhanwate National College",
  "Priyadarshini Lokmanya Tilak Institute of Management Studies and Research, Nagpur",
  "Government College of Engineering, Nagpur",
  "Rajiv Gandhi College of Engineering & Research, Nagpur",
  "Dr. B. R. Ambedkar College, Nagpur",
  "D.Y. Patil Institute of MCA and Management",
  "Pune Institute of Computer Technology",
  "MIT WPU",
  "USICT",
  "Shreeyash College Of Engineering and Technology",
  "MIT-ADT",
  "Indian Institute of Information Technology, Pune",
  "Bharati Vidyapeeth College of Engineering, Pune",
  "VIIT, Pune",
  "JSPM's Rajarshi Shahu College of Engineering, Pune",
  "Vishwakarma Institute of Information Technology",
  "P.R. Pote College of Engineering and Management, Amravati",
  "MVJ College of Engineering, Bangalore",
  "Rajiv Gandhi College of Engineering & Research, Chandrapur",
  "Bindeshwar Singh College, Danapur",
  "Bapuji Institute of Engineering and Technology, Devangere",
  "National Forensic Sciences University, Gandhinagar",
  "University of Engineering and Management, Jaipur",
  "Shri Mata Vaishno Devi University, Katra",
  "Institute of Engineering and Technology, Lucknow",
  "Aditya Institute of Management Studies and Research, Mumbai",
  "Indian Institute of Information Technology, Una, Himachal Pradesh",
  "Gujarat Technological University",
  "I.K. Gujral Punjab Technical University, Amritsar Campus, Punjab 143001",
  "Nutan College Of Engineering And Research",
  "Marathwada Mitra Mandal’s College Of Engineering",
  "Bangalore Technological Institute",
  "Christ University",
  "PES University",
  "BMS College of Engineering, Bangalore",
  "Oriental College of Technology, Bhopal",
  "Anurag University",
  "Siddartha Institute of Science and Technology",
  "Government Engineering College, Bikaner",
  "Chandigarh University",
  "Sri Ramachandra Engineering and Technology",
  "Rajalakshmi Institute of Technology",
  "Annamalai University",
  "Graphic Era University",
  "Maharaja Surajmal Institute of Technology",
  "Manav Rachna International Institute of Research and Studies",
  "NITRA Technical Campus, Ghaziabad",
  "ABES Institute of Technology",
  "Gautam Buddha University",
  "Vignan Degree College",
  "K.R. Mangalam University",
  "Dronacharya College of Engineering",
  "Amity University (M.P.)",
  "Haldia Institute of Technology",
  "Jawaharlal Nehru Technological University",
  "Arya College Of Engineering & IT",
  "Institute of Engineering & Science, IPS Academy",
  "Jaipur National University",
  "Chameli Devi Group of Institutions",
  "Amity University Jaipur",
  "Indian Institute of Technology, Kanpur",
  "IIT Kharagpur",
  "Behala Government Polytechnic",
  "Dr. A.P.J. Abdul Kalam Technical University",
  "University of Lucknow",
  "Manipal Institute of Technology",
  "Meerut Institute of Engineering and Technology",
  "Government Polytechnic Mumbai",
  "Lokamanya Tilak College of Engineering",
  "Sardar Patel Institute of Technology",
  "Atharva College of Engineering",
  "Tulsiram Gaikwad Patil College of Engineering",
  "Pillai College of Engineering",
  "International Institute of Information Technology, Naya Raipur",
  "Rajiv Gandhi University of Knowledge Technologies, Ongole",
  "Thapar University",
  "Lovely Professional University",
  "Amity University Raipur, Chhattisgarh",
  "College of Engineering Roorkee",
  "K.S. Rangasamy College of Technology",
  "KL University",
  "Indian Institute of Information Technology (IIIT)",
  "Vellore Institute of Technology",
  "GITAM University",
  "Government Engineering College",
  "SSVPS College Of Engineering",
  "Adarsh Polytechnic College, Dhule",
  "Gangamai College of Engineering, Nagaon",
  "SVKM Shri Vile Parle Kelavani Mandal",
  "IIIT Nagpur",
  "Government Engineering College"
];
    const qualificationOptions = ["B.Tech", "M.Tech", "B.E.", "MCA", "BCA"];
    const semesterOptions = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
    const branchOptions = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil"];
    const interestOptions = ["Web Development", "SAP BTP Development", "RPA", "Gen AI & LLM", "IIoT Development", "HR & Admin"];
    const referenceOptions = ["LINKEDIN", "Naukri.com", "Indeed", "Campus Placement", "Employee Referral"];

    return (
        <Card>
             <div className="flex items-center mb-6">
                <Button variant="ghost" size="sm" onClick={() => navigate('/candidates')} className="mr-2 !p-2 h-auto">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold text-primary-navy">New Candidate Application</h1>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <FormRow label="Name" required>
                        <div className="grid grid-cols-2 gap-4">
                            <Input name="firstName" value={formData.firstName} onChange={handleChange} required subLabel="First Name" />
                            <Input name="lastName" value={formData.lastName} onChange={handleChange} required subLabel="Last Name" />
                        </div>
                    </FormRow>

                    <FormRow label="Date of Birth" required>
                        <Input name="dob" type="date" value={formData.dob} onChange={handleChange} required subLabel="Date" />
                    </FormRow>

                    <FormRow label="Gender" required>
                        <RadioGroup name="gender" value={formData.gender} onChange={handleChange} options={[{label: 'Male', value: 'Male'}, {label: 'Female', value: 'Female'}]} />
                    </FormRow>

                    <FormRow label="Preferred Location" required>
                        <RadioGroup name="preferredLocation" value={formData.preferredLocation} onChange={handleChange} options={[{label: 'SCL Dhule', value: 'SCL Dhule'}, {label: 'RECL Dholpur', value: 'RECL Dholpur'}, {label: 'Solar Nagpur', value: 'Solar Nagpur'}]} />
                    </FormRow>

                    <FormRow label="E-mail of Applicant" required><Input name="email" type="email" value={formData.email} onChange={handleChange} required /></FormRow>
                    <FormRow label="Contact Number" required><Input name="contactNumber" type="tel" value={formData.contactNumber} onChange={handleChange} required /></FormRow>
                    <FormRow label="LinkedIn Profile" required><Input name="linkedinProfile" value={formData.linkedinProfile} onChange={handleChange} required /></FormRow>

                    <FormRow label="Address" required>
                        <div className="space-y-4">
                            <Textarea name="streetAddress" value={formData.streetAddress} onChange={handleChange} required subLabel="Street Address" rows={2}/>
                            <Input name="streetAddress2" value={formData.streetAddress2} onChange={handleChange} subLabel="Street Address Line 2" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input name="city" value={formData.city} onChange={handleChange} required subLabel="City" />
                                <Input name="state" value={formData.state} onChange={handleChange} required subLabel="State / Province" />
                            </div>
                            <Input name="zip" value={formData.zip} onChange={handleChange} required subLabel="Postal / Zip Code" />
                        </div>
                    </FormRow>

                    <FormRow label="Applicant Status" required><RadioGroup name="applicantStatus" value={formData.applicantStatus} onChange={handleChange} options={[{label: 'Student', value: 'Student'}, {label: 'Pass-out', value: 'Pass-out'}]} /></FormRow>
                    
                    <FormRow label="College Name" required><Select name="collegeName" value={formData.collegeName} onChange={handleChange}>{collegeOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    <FormRow label="Qualification" required><Select name="qualification" value={formData.qualification} onChange={handleChange}>{qualificationOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    <FormRow label="Semester" required><Select name="semester" value={formData.semester} onChange={handleChange}>{semesterOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    <FormRow label="Branch (Major)" required><Select name="branch" value={formData.branch} onChange={handleChange}>{branchOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    <FormRow label="Area of Interest" required><Select name="areaOfInterest" value={formData.areaOfInterest} onChange={handleChange}>{interestOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    <FormRow label="Reference by" required><Select name="reference" value={formData.reference} onChange={handleChange}>{referenceOptions.map(o => <option key={o}>{o}</option>)}</Select></FormRow>
                    
                    <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-4">
                        <FileUpload id="cv" label="Upload your CV Here" onFileSelect={file => handleFileSelect('cv', file)} required accept=".pdf,.doc,.docx" />
                        <FileUpload id="photo" label="Photograph" onFileSelect={file => handleFileSelect('photo', file)} required accept="image/*" />
                    </div>
                    <div className="pt-4 border-b pb-4">
                        <FileUpload id="projectReport" label="Your last project report" onFileSelect={file => handleFileSelect('projectReport', file)} accept=".pdf,.doc,.docx" />
                    </div>
                    
                    <FormRow label="Are you available for minimum 6 months of Internship?" required><RadioGroup name="availableFor6Months" value={formData.availableFor6Months} onChange={handleChange} options={[{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}]} /></FormRow>
                    
                    <FormRow label="">
                        <Checkbox name="nocDeclaration" checked={formData.nocDeclaration} onChange={handleChange} required label={<>I hereby declare that my Institute will provide the NOC (No Objection Certificate) for 6 months of Internship. If I do not submit NOC, I will not be eligible for Internship Completion Certificate in future. <span className="text-primary-red">*</span></>} />
                    </FormRow>

                    <FormRow label="Your Institute's T&P Contact Details" required>
                        <div className="space-y-4">
                            <Input name="tpoName" value={formData.tpoName} onChange={handleChange} required subLabel="Name of TPO" />
                            <Input name="tpoDesignation" value={formData.tpoDesignation} onChange={handleChange} subLabel="TPO Designation" />
                            <Input name="tpoEmail" type="email" value={formData.tpoEmail} onChange={handleChange} required subLabel="EMAIL ID" />
                            <Input name="tpoContact" value={formData.tpoContact} onChange={handleChange} required subLabel="Contact No." />
                        </div>
                    </FormRow>

                    <FormRow label="I am willing to work in rotational shifts as well as rotational week offs" required><RadioGroup name="rotationalShifts" value={formData.rotationalShifts} onChange={handleChange} options={[{label: 'Yes', value: 'Yes'}, {label: 'No', value: 'No'}]} /></FormRow>
                    
                    <FormRow label="">
                        <Checkbox name="infoTruthDeclaration" checked={formData.infoTruthDeclaration} onChange={handleChange} required label={<>I do hereby declare that all the information given above is true to the best of my knowledge and belief. <span className="text-primary-red">*</span></>} />
                    </FormRow>

                    <FormRow label="Signature" required>
                        <FileUpload id="signature" label="" onFileSelect={file => handleFileSelect('signature', file)} required accept="image/*" subLabel="Please upload an image of your signature."/>
                    </FormRow>

                </div>
                <div className="mt-8 flex justify-center">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default AddNewCandidate;
