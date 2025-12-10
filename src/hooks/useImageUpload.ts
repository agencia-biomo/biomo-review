'use client';

import { useState, useCallback } from 'react';
import {
  optimizeImage,
  shouldOptimize,
  createThumbnail,
  generateBlurPlaceholder,
  ImageOptimizeOptions,
} from '@/lib/image-optimization';
import { toast } from './useToast';

interface UploadResult {
  url: string;
  thumbnailUrl?: string;
  blurPlaceholder?: string;
  originalSize: number;
  optimizedSize: number;
}

interface UseImageUploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  createThumbnail?: boolean;
  generatePlaceholder?: boolean;
  onProgress?: (progress: number) => void;
}

interface UseImageUploadResult {
  upload: (file: File) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[]) => Promise<UploadResult[]>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

/**
 * Hook for uploading images with automatic optimization
 */
export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const {
    folder = 'images',
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    createThumbnail: shouldCreateThumbnail = false,
    generatePlaceholder = false,
    onProgress,
  } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const updateProgress = useCallback(
    (value: number) => {
      setProgress(value);
      onProgress?.(value);
    },
    [onProgress]
  );

  const uploadToServer = useCallback(
    async (file: File, uploadFolder: string): Promise<string> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', uploadFolder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload failed');
      }

      return data.url;
    },
    []
  );

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);
      updateProgress(0);

      try {
        const originalSize = file.size;
        let fileToUpload = file;

        // Optimize if needed
        if (file.type.startsWith('image/') && shouldOptimize(file)) {
          updateProgress(10);
          const optimizeOptions: ImageOptimizeOptions = {
            maxWidth,
            maxHeight,
            quality,
            format: 'webp',
          };

          try {
            fileToUpload = await optimizeImage(file, optimizeOptions);
            console.log(
              '[ImageUpload] Optimized:',
              originalSize,
              '->',
              fileToUpload.size,
              `(${Math.round((1 - fileToUpload.size / originalSize) * 100)}% reduction)`
            );
          } catch (err) {
            console.warn('[ImageUpload] Optimization failed, using original:', err);
          }
        }

        updateProgress(30);

        // Generate blur placeholder if requested
        let blurPlaceholder: string | undefined;
        if (generatePlaceholder && file.type.startsWith('image/')) {
          try {
            blurPlaceholder = await generateBlurPlaceholder(file);
          } catch (err) {
            console.warn('[ImageUpload] Placeholder generation failed:', err);
          }
        }

        updateProgress(40);

        // Upload main image
        const url = await uploadToServer(fileToUpload, folder);
        updateProgress(70);

        // Create and upload thumbnail if requested
        let thumbnailUrl: string | undefined;
        if (shouldCreateThumbnail && file.type.startsWith('image/')) {
          try {
            const thumbnail = await createThumbnail(file, 300);
            const thumbnailFile = new File([thumbnail], `thumb_${file.name}`, {
              type: 'image/webp',
            });
            thumbnailUrl = await uploadToServer(thumbnailFile, `${folder}/thumbnails`);
          } catch (err) {
            console.warn('[ImageUpload] Thumbnail creation failed:', err);
          }
        }

        updateProgress(100);

        return {
          url,
          thumbnailUrl,
          blurPlaceholder,
          originalSize,
          optimizedSize: fileToUpload.size,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error('Erro no upload', error.message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [
      folder,
      maxWidth,
      maxHeight,
      quality,
      shouldCreateThumbnail,
      generatePlaceholder,
      uploadToServer,
      updateProgress,
    ]
  );

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const result = await upload(files[i]);
        if (result) {
          results.push(result);
        }
        // Update overall progress
        const overallProgress = ((i + 1) / files.length) * 100;
        updateProgress(overallProgress);
      }

      return results;
    },
    [upload, updateProgress]
  );

  return {
    upload,
    uploadMultiple,
    isUploading,
    progress,
    error,
  };
}
