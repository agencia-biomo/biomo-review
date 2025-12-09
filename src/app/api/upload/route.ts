import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getAdminApp } from '@/lib/firebase-admin';
import { isFirebaseConfigured } from '@/lib/mock-db';

// Allowed file types - expanded for better communication
const ALLOWED_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Audio
  'audio/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Text
  'text/plain',
  'text/csv',
];

// Max file size: 30MB
const MAX_FILE_SIZE = 30 * 1024 * 1024;

// POST /api/upload - Upload file to Firebase Storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';

    console.log('[Upload] Received file:', file?.name, 'type:', file?.type, 'size:', file?.size);

    if (!file) {
      console.log('[Upload] Error: No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - be more permissive for audio blobs from MediaRecorder
    const fileType = file.type || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'webm', 'mp3', 'wav', 'mp4', 'ogg', 'm4a', 'jpeg', 'jpg', 'png', 'gif', 'pdf'];

    // Check if type is allowed OR extension is allowed OR it's an audio/video type (for MediaRecorder blobs)
    const isTypeAllowed = ALLOWED_TYPES.includes(fileType);
    const isExtAllowed = allowedExts.includes(ext);
    const isMediaType = fileType.startsWith('audio/') || fileType.startsWith('video/') || fileType.startsWith('image/');

    if (!isTypeAllowed && !isExtAllowed && !isMediaType) {
      console.log('[Upload] Error: File type not allowed:', fileType, 'ext:', ext);
      return NextResponse.json(
        { error: `Tipo de arquivo nao permitido: ${fileType || 'desconhecido'}` },
        { status: 400 }
      );
    }

    // Validate file size (max 30MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho maximo: 30MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer first (needed for both paths)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Helper function to return base64 URL (fallback)
    const returnBase64 = () => {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        mode: 'demo',
      });
    };

    // If Firebase not configured, return base64 URL
    if (!isFirebaseConfigured()) {
      console.log('[Upload] Firebase not configured, using base64 fallback');
      return returnBase64();
    }

    // Try to upload to Firebase Storage
    try {
      const adminApp = getAdminApp();
      const storage = getStorage(adminApp);
      // Explicitly specify bucket name to avoid default bucket issues
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'alteracoes-biomo.firebasestorage.app';
      const bucket = storage.bucket(bucketName);

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${folder}/${timestamp}-${randomStr}-${sanitizedName}`;

      // Upload file
      const fileRef = bucket.file(filename);
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type || 'application/octet-stream',
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      console.log('[Upload] File uploaded to Firebase Storage:', publicUrl);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    } catch (storageError) {
      // Firebase Storage failed, fall back to base64
      console.error('[Upload] Firebase Storage failed, using base64 fallback:', storageError);
      return returnBase64();
    }
  } catch (error) {
    console.error('[Upload] Error processing file:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload', details: String(error) },
      { status: 500 }
    );
  }
}

// Dynamic to ensure always fresh (not cached)
export const dynamic = 'force-dynamic';

// Allow larger request bodies (35MB)
export const maxDuration = 60; // seconds timeout
