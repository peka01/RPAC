'use client';

import { t } from '@/lib/locales';
import { Image as ImageIcon, Upload, Edit3, X, Trash2, GripVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
}

interface HomepageGallerySectionProps {
  communityId: string;
  images: GalleryImage[];
  onImagesChange: (images: GalleryImage[]) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function HomepageGallerySection({
  communityId,
  images,
  onImagesChange,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: HomepageGallerySectionProps) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const newImages: GalleryImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${communityId}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `community-gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('public-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public-assets')
          .getPublicUrl(filePath);

        // Save to database
        const { data, error: dbError } = await supabase
          .from('community_gallery_images')
          .insert({
            community_id: communityId,
            image_url: publicUrl,
            display_order: images.length + newImages.length
          })
          .select()
          .single();

        if (dbError) throw dbError;
        if (data) newImages.push(data);
      }

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error('Gallery upload error:', error);
      alert('Kunde inte ladda upp bilder. Försök igen.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Ta bort denna bild från galleriet?')) return;

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('community_gallery_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Try to delete from storage (optional - might fail if file doesn't exist)
      try {
        const filePath = imageUrl.split('/public-assets/')[1];
        if (filePath) {
          await supabase.storage.from('public-assets').remove([filePath]);
        }
      } catch (e) {
        console.log('Storage file delete failed (might already be deleted)');
      }

      onImagesChange(images.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Delete image error:', error);
      alert('Kunde inte ta bort bilden. Försök igen.');
    }
  };

  const handleUpdateCaption = async (imageId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('community_gallery_images')
        .update({ caption })
        .eq('id', imageId);

      if (error) throw error;

      onImagesChange(images.map(img => 
        img.id === imageId ? { ...img, caption } : img
      ));
      setEditingCaption(null);
    } catch (error) {
      console.error('Update caption error:', error);
      alert('Kunde inte uppdatera bildtext. Försök igen.');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reorderedImages = [...images];
    const draggedImage = reorderedImages[draggedIndex];
    reorderedImages.splice(draggedIndex, 1);
    reorderedImages.splice(index, 0, draggedImage);

    // Update display_order
    const updatedImages = reorderedImages.map((img, idx) => ({
      ...img,
      display_order: idx
    }));

    onImagesChange(updatedImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Save new order to database
    try {
      for (const image of images) {
        await supabase
          .from('community_gallery_images')
          .update({ display_order: image.display_order })
          .eq('id', image.id);
      }
    } catch (error) {
      console.error('Save order error:', error);
    }

    setDraggedIndex(null);
  };

  if (isEditing) {
    return (
      <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📸 {t('homespace.editor.gallery_section')}</h2>
        
        {/* Upload button */}
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageUpload(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages}
            className="px-4 py-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] flex items-center gap-2 disabled:opacity-50"
          >
            <Upload size={16} />
            {uploadingImages ? 'Laddar upp...' : t('homespace.editor.add_images')}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            {t('homespace.editor.drag_to_reorder')}
          </p>
        </div>

        {/* Gallery grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className="relative group bg-gray-100 rounded-lg overflow-hidden cursor-move border-2 border-gray-200 hover:border-[#5C6B47] transition-all"
              >
                <div className="absolute top-2 left-2 bg-black/50 text-white p-1 rounded z-10">
                  <GripVertical size={16} />
                </div>
                <img 
                  src={image.image_url} 
                  alt={image.caption || ''}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3">
                  {editingCaption === image.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        defaultValue={image.caption || ''}
                        onBlur={(e) => handleUpdateCaption(image.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateCaption(image.id, e.currentTarget.value);
                          }
                        }}
                        placeholder="Bildtext..."
                        autoFocus
                        className="flex-1 px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingCaption(image.id)}
                      className="text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded min-h-[28px]"
                    >
                      {image.caption || <span className="text-gray-400 italic">Klicka för bildtext...</span>}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteImage(image.id, image.image_url)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 hover:bg-red-700 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Inga bilder i galleriet än</p>
            <p className="text-sm text-gray-400">Klicka på "Lägg till bilder" för att börja</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Klar
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Stäng
          </button>
        </div>
      </div>
    );
  }

  // Display mode
  if (images.length === 0) return null;

  return (
    <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8 group">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📸 Bildgalleri</h2>
        <button
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
        >
          <Edit3 size={16} />
        </button>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <img 
                src={image.image_url} 
                alt={image.caption || ''}
                className="w-full h-48 object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(image.image_url, '_blank')}
              />
              {image.caption && (
                <div className="p-3 bg-gray-50">
                  <p className="text-sm text-gray-700">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <ImageIcon size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Inga bilder än</h3>
          <p className="text-gray-500 mb-4">Klicka på pennikonen för att lägga till bilder i galleriet</p>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors"
          >
            Lägg till bilder
          </button>
        </div>
      )}
    </div>
  );
}

