import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCroppedImg } from '../utils/cropImage';
import type { Area } from 'react-easy-crop';

// Mock canvas context
const mockCtx = {
  fillStyle: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
};

// Track canvas dimensions
let canvasWidth = 0;
let canvasHeight = 0;

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

  // Mock toBlob
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    function (this: HTMLCanvasElement, callback: BlobCallback) {
      callback(new Blob(['test'], { type: 'image/jpeg' }));
    },
  );

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

const cropArea: Area = { x: 10, y: 20, width: 200, height: 150 };

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
});
