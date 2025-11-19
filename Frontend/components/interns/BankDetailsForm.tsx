import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import apiService from '../../services/apiService';
import { Intern } from '../../types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { SaveIcon } from '../icons';

interface BankDetailsFormProps {
  internId: string;
  initialData: any;
  onUpdateSuccess: (updatedIntern: Intern) => void;
}

const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ internId, initialData, onUpdateSuccess }) => {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    pan_number: '',
  });

  // When the component loads or the initial data changes, fill the form
  useEffect(() => {
    if (initialData) {
      setBankDetails({
        bank_name: initialData.bank_name || '',
        account_number: initialData.account_number || '',
        ifsc_code: initialData.ifsc_code || '',
        pan_number: initialData.pan_number || '',
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBankDetails(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Call the function we created in the apiService
      const updatedIntern = await apiService.updateInternBankDetails(internId, bankDetails);
      addToast('Bank details updated successfully!', 'success');
      // Notify the parent component (Profile.tsx) that the update was successful
      onUpdateSuccess(updatedIntern);
    } catch (error) {
      addToast('Failed to update bank details.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Update Bank Account Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Bank Name"
            name="bank_name"
            value={bankDetails.bank_name}
            onChange={handleInputChange}
            placeholder="e.g., State Bank of India"
            required
          />
          <Input
            label="Account Number"
            name="account_number"
            value={bankDetails.account_number}
            onChange={handleInputChange}
            placeholder="Enter account number"
            required
          />
          <Input
            label="IFSC Code"
            name="ifsc_code"
            value={bankDetails.ifsc_code}
            onChange={handleInputChange}
            placeholder="Enter IFSC code"
            required
          />
          <Input
            label="PAN Number"
            name="pan_number"
            value={bankDetails.pan_number}
            onChange={handleInputChange}
            placeholder="Enter PAN card number"
          />
        </div>
        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            <SaveIcon />
            <span className="ml-2">{isSubmitting ? 'Saving...' : 'Save Details'}</span>
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default BankDetailsForm;