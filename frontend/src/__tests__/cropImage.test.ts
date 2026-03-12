import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCroppedImg } from '../utils/cropImage';
import type { PixelCrop } from 'react-image-crop';

// Mock canvas context
const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
};

// Track canvas dimensions
let canvasWidth = 0;
let canvasHeight = 0;

// Track toBlob calls
let toBlobMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.restoreAllMocks();
  mockCtx.fillStyle = '';
  mockCtx.fillRect.mockClear();
  mockCtx.drawImage.mockClear();
  canvasWidth = 0;
  canvasHeight = 0;

  // Mock getContext
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  );

  // Default toBlob mock: returns a small blob (under 5MB)
  toBlobMock = vi.fn().mockImplementation(
    function (this: HTMLCanvasElement, callback: BlobCallback, type?: string, quality?: number) {
      callback(new Blob([new ArrayBuffer(1024)], { type: 'image/jpeg' }));
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(toBlobMock);

  // Track canvas width/height
  vi.spyOn(HTMLCanvasElement.prototype, 'width', 'set').mockImplementation(
    (v: number) => {
      canvasWidth = v;
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'width', 'get').mockImplementation(
    () => canvasWidth,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'height', 'set').mockImplementation(
    (v: number) => {
      canvasHeight = v;
    },
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'height', 'get').mockImplementation(
    () => canvasHeight,
  );

  // Mock Image: override window.Image to trigger onload asynchronously
  const OriginalImage = window.Image;
  window.Image = class MockImage {
    src = '';
    onload: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;

    constructor() {
      setTimeout(() => {
        if (this.onload) this.onload();
      }, 0);
    }
  } as unknown as typeof OriginalImage;
});

const cropArea: PixelCrop = { x: 10, y: 20, width: 200, height: 150, unit: 'px' };

describe('getCroppedImg', () => {
  it('returns a Blob of type image/jpeg', async () => {
    const blob = await getCroppedImg('blob:http://localhost/test', cropArea);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/jpeg');
  });

  it('creates a canvas with dimensions matching the crop area', async () => {
    await getCroppedImg('blob:http://localhost/test', cropArea);
    expect(canvasWidth).toBe(200);
    expect(canvasHeight).toBe(150);
  });

  it('fills white background before drawing', async () => {
    await getCroppedImg('blob:http://localhost/test', cropArea);
    expect(mockCtx.fillStyle).toBe('#FFFFFF');
    expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 200, 150);
    // fillRect must be called before drawImage
    const fillOrder = mockCtx.fillRect.mock.invocationCallOrder[0];
    const drawOrder = mockCtx.drawImage.mock.invocationCallOrder[0];
    expect(fillOrder).toBeLessThan(drawOrder);
  });

  it('returns blob directly when under 5MB at default quality', async () => {
    // 1MB blob - under 5MB limit
    toBlobMock.mockImplementation(
      function (this: HTMLCanvasElement, callback: BlobCallback, type?: string, quality?: number) {
        callback(new Blob([new ArrayBuffer(1 * 1024 * 1024)], { type: 'image/jpeg' }));
      },
    );

    const blob = await getCroppedImg('blob:http://localhost/test', cropArea);
    expect(blob).toBeInstanceOf(Blob);
    expect(toBlobMock).toHaveBeenCalledTimes(1);
    expect(toBlobMock).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9);
  });

  it('reduces quality iteratively when blob exceeds 5MB', async () => {
    let callCount = 0;
    toBlobMock.mockImplementation(
      function (this: HTMLCanvasElement, callback: BlobCallback, type?: string, quality?: number) {
        callCount++;
        if (callCount <= 2) {
          // First two calls: 6MB (over limit)
          callback(new Blob([new ArrayBuffer(6 * 1024 * 1024)], { type: 'image/jpeg' }));
        } else {
          // Third call: 3MB (under limit)
          callback(new Blob([new ArrayBuffer(3 * 1024 * 1024)], { type: 'image/jpeg' }));
        }
      },
    );

    const blob = await getCroppedImg('blob:http://localhost/test', cropArea);
    expect(blob).toBeInstanceOf(Blob);
    expect(toBlobMock).toHaveBeenCalledTimes(3);
    expect(toBlobMock).toHaveBeenNthCalledWith(1, expect.any(Function), 'image/jpeg', 0.9);
    expect(toBlobMock).toHaveBeenNthCalledWith(2, expect.any(Function), 'image/jpeg', 0.8);
    expect(toBlobMock).toHaveBeenNthCalledWith(3, expect.any(Function), 'image/jpeg', 0.7);
  });

  it('throws when compression cannot fit under 5MB', async () => {
    // Always return 6MB
    toBlobMock.mockImplementation(
      function (this: HTMLCanvasElement, callback: BlobCallback, type?: string, quality?: number) {
        callback(new Blob([new ArrayBuffer(6 * 1024 * 1024)], { type: 'image/jpeg' }));
      },
    );

    await expect(getCroppedImg('blob:http://localhost/test', cropArea)).rejects.toThrow(
      'Image too large to compress under 5MB',
    );
  });
});
