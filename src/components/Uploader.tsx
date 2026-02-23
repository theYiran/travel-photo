import React, { useState, useCallback } from 'react';
import { Upload, X, MapPin } from 'lucide-react';
import { Photo } from '../types';
import { extractMetadata } from '../utils/exif';

interface UploaderProps {
  onPhotosAdded: (photos: Photo[]) => void;
}

export const Uploader: React.FC<UploaderProps> = ({ onPhotosAdded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newPhotos: Photo[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      const metadata = await extractMetadata(file);
      const url = URL.createObjectURL(file);
      
      newPhotos.push({
        id: Math.random().toString(36).substr(2, 9),
        url,
        name: metadata.name || file.name,
        lat: metadata.lat || null,
        lng: metadata.lng || null,
        timestamp: metadata.timestamp || file.lastModified,
      });
    }

    onPhotosAdded(newPhotos);
    setIsProcessing(false);
  }, [onPhotosAdded]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="p-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300
          ${isDragging ? 'border-white bg-white/10' : 'border-white/20 bg-white/5'}
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className={`w-8 h-8 mb-3 ${isDragging ? 'text-white' : 'text-white/40'}`} />
        <p className="text-sm font-medium text-white/60">
          {isProcessing ? 'Processing memories...' : 'Drop your travel photos here'}
        </p>
        <p className="text-xs text-white/30 mt-1">or click to browse</p>
      </div>
    </div>
  );
};
