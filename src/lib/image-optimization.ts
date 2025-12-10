/**
 * Image optimization utilities
 *
 * Note: For server-side optimization with sharp, we need to run in a Node.js environment.
 * For client-side, we use canvas-based compression.
 */

export interface ImageOptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'webp' | 'jpeg' | 'png';
}

export interface OptimizedImageResult {
  blob: Blob;
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}

/**
 * Client-side image compression using canvas
 */
export async function compressImageClient(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'webp',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = format === 'webp'
        ? 'image/webp'
        : format === 'jpeg'
          ? 'image/jpeg'
          : 'image/png';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }

          resolve({
            blob,
            width,
            height,
            originalSize: file.size,
            optimizedSize: blob.size,
            compressionRatio: file.size / blob.size,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

/**
 * Create a thumbnail from an image file
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<Blob> {
  const result = await compressImageClient(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.6,
    format: 'webp',
  });
  return result.blob;
}

/**
 * Convert an image to WebP format
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.8
): Promise<Blob> {
  const result = await compressImageClient(file, {
    quality,
    format: 'webp',
  });
  return result.blob;
}

/**
 * Get image dimensions without loading fully into memory
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image'));
    };

    img.src = url;
  });
}

/**
 * Generate a blur placeholder data URL
 */
export async function generateBlurPlaceholder(file: File): Promise<string> {
  const result = await compressImageClient(file, {
    maxWidth: 10,
    maxHeight: 10,
    quality: 0.3,
    format: 'jpeg',
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read blob'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(result.blob);
  });
}

/**
 * Check if an image needs optimization
 */
export function shouldOptimize(file: File): boolean {
  // Optimize if larger than 500KB
  if (file.size > 500 * 1024) return true;

  // Optimize if not already WebP
  if (!file.type.includes('webp')) return true;

  return false;
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/webp': '.webp',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  };
  return extensions[mimeType] || '.jpg';
}

/**
 * Create optimized image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<File> {
  const result = await compressImageClient(file, options);
  const extension = options.format === 'webp' ? '.webp' : getExtensionFromMime(file.type);
  const name = file.name.replace(/\.[^.]+$/, extension);

  return new File([result.blob], name, {
    type: result.blob.type,
  });
}
