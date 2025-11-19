import React from 'react';

interface CertificateProps {
  referenceNo: string;
  date: string;
  internName: string;
  startDate: string;
  endDate: string;
  departmentName: string;
  hodName: string;
}

const InternshipCertificate: React.FC<CertificateProps> = ({
  referenceNo, date, internName, startDate, endDate, departmentName, hodName
}) => {
  return (
    <div className="pt-12 px-12 pb-12 border border-slate-300 bg-white font-serif text-slate-800 text-sm max-w-3xl mx-auto min-h-[1050px]">
      <div className="flex justify-between mb-20">
        <span>{referenceNo}</span>
        <span>Date: {date}</span>
      </div>

      <div className="text-center mb-16">
        <h1 className="text-lg font-bold tracking-wider">TO WHOMSOEVER IT MAY CONCERN</h1>
        <div className="w-64 h-px bg-slate-800 mx-auto mt-1"></div>
      </div>

      <p className="mb-8">This is to certify as follows:</p>

      <div className="space-y-6 ml-4 text-base leading-relaxed">
        <p><span className="font-bold mr-2">1.</span>
          Mr/Ms <span className="font-bold">{internName}</span>, has successfully completed his/her internship from <span className="font-bold">{startDate}</span> to <span className="font-bold">{endDate}</span> with our Organization.
        </p>
        <p><span className="font-bold mr-2">2.</span>
          The Internship undertaken by him/her in <span className="font-bold">{departmentName.toUpperCase()}</span> department under guidance of Mr. <span className="font-bold">{hodName}</span>.
        </p>
        <p><span className="font-bold mr-2">3.</span>
          During the period, he/she was found hardworking, diligent, and inquisitive.
        </p>
      </div>
      
      <p className="my-16">We wish all success in his/her future endeavors.</p>

      <div className="mt-24">
        <p className="font-bold">Solar Industries India Limited</p>
        <div className="mt-20">
          <p className="font-bold">Ashish Khole</p>
          <p>HEAD - HR</p>
        </div>
      </div>
    </div>
  );
};

export default InternshipCertificate;