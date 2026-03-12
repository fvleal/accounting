import type { PixelCrop } from 'react-image-crop';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob returned null'));
        }
      },
      'image/jpeg',
      quality,
    );
  });
}

export async function getCroppedImg(
  imageSrc: string,
  cropArea: PixelCrop,
): Promise<Blob> {
  const img = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = cropArea.width;
  canvas.height = cropArea.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas 2d context');
  }

  // Fill white background for transparent PNG support
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, cropArea.width, cropArea.height);

  ctx.drawImage(
    img,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height,
  );

  // Iterative quality reduction to stay under 5MB
  let quality = 0.9;
  while (quality >= 0.1) {
    const blob = await canvasToJpegBlob(canvas, Math.round(quality * 10) / 10);
    if (blob.size <= MAX_FILE_SIZE) {
      return blob;
    }
    quality -= 0.1;
  }

  throw new Error('Image too large to compress under 5MB');
}
