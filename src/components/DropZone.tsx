import React, { useRef } from 'react';
import { LucideIcon, Upload } from 'lucide-react';
import { UploadedFile } from '../types';
import { cn, fileToBase64 } from '../lib/utils';

interface DropZoneProps {
  label: string;
  acceptTypes: string;
  file: UploadedFile | null;
  onFileSelect: (file: UploadedFile) => void;
  icon: LucideIcon;
}

const DropZone: React.FC<DropZoneProps> = ({ label, acceptTypes, file, onFileSelect, icon: Icon }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const base64 = await fileToBase64(selectedFile);
      onFileSelect({
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        data: base64,
      });
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "asset-slot group cursor-pointer hover:border-accent/50 transition-all",
        file && "active"
      )}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        accept={acceptTypes} 
        className="hidden" 
      />
      
      {file ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
          <Icon size={32} className="text-accent mb-2" />
          <div className="font-mono text-[10px] text-white bg-black/80 px-1.5 py-0.5 z-10 truncate max-w-full">
            {file.name}
          </div>
          <div className="text-[10px] text-text-dim mt-1">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-text-dim group-hover:text-text-main transition-colors">
          <Upload size={24} className="mb-2" />
          <span className="text-[10px] uppercase tracking-wider font-mono">{label}</span>
        </div>
      )}
    </div>
  );
};

export default DropZone;
