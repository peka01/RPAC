'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string | null; // Existing image URL
  onChange: (url: string | null) => void;
  onFileSelect?: (file: File | null) => void;
  bucketName: string; // e.g., 'help-request-images' or 'resource-images'
  folderPath?: string; // e.g., 'help-requests' or 'resources'
  maxSizeMB?: number;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  bucketName,
  folderPath = '',
  maxSizeMB = 5,
  disabled = false,
  label,
  helperText
}: ImageUploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(value ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value prop changes
  useEffect(() => {
    if (value && !imageFile) {
      setImagePreview(value);
    } else if (!value && !imageFile) {
      setImagePreview(null);
    }
  }, [value, imageFile]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`Vänligen välj en giltig bildfil (JPEG, PNG, etc.)`);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Bilden är för stor. Maximal storlek är ${maxSizeMB}MB.`);
      return;
    }

    setImageFile(file);
    setError(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    onChange(null);
    if (onFileSelect) {
      onFileSelect(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async (): Promise<string | null> => {
    if (!imageFile) return value ?? null;

    setIsUploading(true);
    setError(null);

    try {
      const { supabase } = await import('@/lib/supabase');
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      setError('Kunde inte ladda upp bilden. Försök igen.');
      throw uploadError;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-900">
          {label}
        </label>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
        disabled={disabled}
      />

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {!imagePreview ? (
        <button
          type="button"
          onClick={handleImageUploadClick}
          disabled={disabled || isUploading}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-[#3D4A2B] hover:bg-[#3D4A2B]/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3D4A2B]/10">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-[#3D4A2B] animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-[#3D4A2B]" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              Klicka för att välja en bild
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF upp till {maxSizeMB}MB
            </p>
          </div>
        </button>
      ) : (
        <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <img
            src={imagePreview}
            alt="Förhandsvisning"
            className="w-full h-auto max-h-48 object-contain bg-gray-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
            className="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Ta bort
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 shadow-sm z-10">
            <ImageIcon className="h-4 w-4 text-[#3D4A2B]" />
            <span className="text-xs font-medium text-gray-700">
              {imageFile?.name || 'Befintlig bild'}
            </span>
          </div>
        </div>
      )}
      
      {helperText && (
        <p className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}

// Export a hook for uploading images
export async function uploadImageToStorage(
  file: File,
  bucketName: string,
  folderPath: string = ''
): Promise<string> {
  const { supabase } = await import('@/lib/supabase');
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    // Provide more helpful error messages
    const errorMessage = uploadError.message || '';
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('bucket')) {
      throw new Error(`Lagringsutrymme "${bucketName}" finns inte. Kontrollera att bucket är skapad i Supabase Dashboard.`);
    } else if (errorMessage.includes('policy') || errorMessage.includes('permission') || errorMessage.includes('denied')) {
      throw new Error(`Behörighet saknas. Kontrollera att RLS-policies är konfigurerade för "${bucketName}".`);
    }
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrl;
}

