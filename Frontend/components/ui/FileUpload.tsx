
import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  required?: boolean;
  id: string;
  accept?: string;
  subLabel?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, onFileSelect, required, id, accept, subLabel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    onFileSelect(selectedFile);
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };
  
  const removeFile = () => {
    handleFileChange(null);
    if (inputRef.current) {
        inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-secondary-blue mb-1">
        {label} {required && <span className="text-primary-red">*</span>}
      </label>
      {file ? (
        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-light-gray">
          <div className="flex items-center space-x-2 overflow-hidden">
            <FileIcon className="h-5 w-5 text-secondary-blue flex-shrink-0" />
            <span className="text-sm text-primary-navy truncate">{file.name}</span>
          </div>
          <button type="button" onClick={removeFile} className="p-1 rounded-full hover:bg-red-100 text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-primary-red bg-red-50' : 'border-gray-300 hover:border-secondary-blue'}`}
        >
          <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-secondary-blue font-semibold">Browse Files</p>
          <p className="text-xs text-gray-500">Drag and drop files here</p>
          <input
            ref={inputRef}
            type="file"
            id={id}
            name={id}
            className="hidden"
            onChange={onInputChange}
            accept={accept}
            required={required && !file}
          />
        </div>
      )}
       {subLabel && <p className="text-xs text-slate-500 mt-1">{subLabel}</p>}
    </div>
  );
};

export default FileUpload;
