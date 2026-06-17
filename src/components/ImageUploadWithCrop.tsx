import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, X, Sliders, Image as ImageIcon, ZoomIn, AlertCircle, RefreshCw } from 'lucide-react';

interface ImageUploadWithCropProps {
  onUploadSuccess: (url: string) => void;
  aspectRatio?: '1:1' | '4:3'; // 1:1 is circular profile, 4:3 is vendor food item
  radiusType?: 'circle' | 'square';
  label?: string;
  initialValue?: string;
}

export default function ImageUploadWithCrop({
  onUploadSuccess,
  aspectRatio = '1:1',
  radiusType = 'circle',
  label = 'Upload Image',
  initialValue = ''
}: ImageUploadWithCropProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(initialValue);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Crop manipulation states
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue) {
      setPreviewUrl(initialValue);
    }
  }, [initialValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setUploadError(null);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    if ('touches' in e) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  const executeCrop = async () => {
    if (!imageRef.current) return;
    setUploading(true);
    setUploadError(null);

    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not compute 2D context');

      // Target output bounds
      const targetWidth = aspectRatio === '1:1' ? 150 : 400;
      const targetHeight = aspectRatio === '1:1' ? 150 : 300;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Visual crop frame dimensions on screen
      const viewW = aspectRatio === '1:1' ? 180 : 280;
      const viewH = aspectRatio === '1:1' ? 180 : 210;

      // Main container dimensions
      const containerW = 290;
      const containerH = 240;

      // Image natural properties
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;

      // Browser scales the image inside the container using maxWidth/maxHeight 100%
      // Compute the layout base unzoomed rendered image dimensions
      let w_img = containerW;
      let h_img = containerW * (natH / natW);
      if (h_img > containerH) {
        h_img = containerH;
        w_img = containerH * (natW / natH);
      }

      // Draw backing color
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Save canvas state
      ctx.save();
      
      // Scale coordinates from screen crop viewport size (viewW x viewH) up to output resolution (targetWidth x targetHeight)
      const outputScale = targetWidth / viewW;
      ctx.scale(outputScale, outputScale);
      
      // Translate to viewport center (viewW / 2, viewH / 2) plus the custom translation offset
      ctx.translate(viewW / 2 + offset.x, viewH / 2 + offset.y);
      
      // Scale relative to natural image dimensions
      const imgScale = (w_img * zoom) / natW;
      ctx.scale(imgScale, imgScale);
      
      // Draw image centered around the origin
      ctx.drawImage(img, -natW / 2, -natH / 2);
      ctx.restore();

      // Convert cropped canvas to lightweight optimized base64 JPEG
      // JPEG quality 0.7 keeps image file extremely low-size (around 5kb - 15kb)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

      // Transmit to cheap internal/external Database storage
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });

      if (!res.ok) {
        throw new Error('Image database reject: Server failed to write image');
      }

      const data = await res.json();
      if (data.success && data.url) {
        setPreviewUrl(data.url);
        onUploadSuccess(data.url);
        setCropModalOpen(false);
      } else {
        throw new Error(data.message || 'Image storage failure');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to crop and compress picture');
    } finally {
      setUploading(false);
    }
  };

  const getViewportDimensions = () => {
    if (aspectRatio === '1:1') {
      return { width: '180px', height: '180px', borderRadius: radiusType === 'circle' ? '9999px' : '16px' };
    }
    return { width: '280px', height: '210px', borderRadius: '16px' }; // 4:3
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 bg-slate-900/40 p-4 border border-slate-800 rounded-2xl">
        <div className="relative flex-shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className={`object-cover border border-slate-700 bg-slate-950 ${
                aspectRatio === '1:1' && radiusType === 'circle'
                  ? 'w-14 h-14 rounded-full'
                  : 'w-20 h-14 rounded-xl'
              }`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center text-slate-500 ${
              aspectRatio === '1:1' && radiusType === 'circle'
                ? 'w-14 h-14 rounded-full'
                : 'w-20 h-14 rounded-xl'
            }`}>
              <ImageIcon className="w-5 h-5 text-slate-600" />
            </div>
          )}
          {previewUrl && (
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                onUploadSuccess('');
              }}
              className="absolute -top-1.5 -right-1.5 bg-slate-950 border border-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 p-0.5 rounded-full transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-grow text-left">
          <span className="block text-[11px] font-bold text-slate-350 uppercase tracking-wider mb-1">{label}</span>
          <p className="text-[10px] text-slate-500 leading-normal mb-2.5">
            {aspectRatio === '1:1' 
              ? 'Ideal: Square photo. Automatic crop to 150x150 circular resolution' 
              : 'Ideal: Food photography 4:3 ratio. Resizes to 400x300 image, highly optimized (< 15KB)'}
          </p>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-slate-700 transition-all cursor-pointer shadow-sm hover:shadow-md"
          >
            <Upload className="w-3.5 h-3.5" />
            Choose New File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>

      {uploadError && (
        <div className="p-2 py-1.5 bg-rose-950/40 border border-rose-900 rounded-lg text-rose-400 text-[10px] font-bold flex items-center gap-1.5">
          <X className="w-3.5 h-3.5 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* TACTILE CROPPER MODAL OVERLAY */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-100 text-left">
            
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <span className="font-extrabold text-[11px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#FF5E2A]" /> Crop & Save Selection
              </span>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Active HTML5 viewport editor */}
            <div className="p-5 flex flex-col items-center justify-center space-y-4">
              <p className="text-[10px] text-slate-400 font-medium text-center bg-slate-950/40 px-3 py-1.5 rounded-lg">
                👉 Drag picture inside the frame to adjust alignment. Use zoom slider for scale.
              </p>

              {/* Viewport Box */}
              <div 
                ref={containerRef}
                onMouseDown={startDrag}
                onTouchStart={startDrag}
                onMouseMove={onDrag}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchMove={onDrag}
                onTouchEnd={endDrag}
                className="relative bg-slate-950 border border-slate-850 overflow-hidden flex items-center justify-center select-none cursor-move"
                style={{ width: '290px', height: '240px' }}
              >
                {/* Img component styled interactively with transform */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Original"
                  draggable="false"
                  style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transition: isDragging ? 'none' : 'transform 0.1s ease',
                    userSelect: 'none'
                  }}
                  className="pointer-events-auto"
                />

                {/* Shutter Mask Layer overlay highlighting target area bounds */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                  <div 
                    className="border-2 border-dashed border-[#FF5E2A]"
                    style={{
                      ...getViewportDimensions(),
                      outline: '500px solid rgba(15, 23, 42, 0.85)',
                      boxShadow: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Zoom tactile Slider */}
              <div className="w-full space-y-1 bg-slate-950/20 p-3 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom Slider</span>
                  <span className="font-mono text-[#FF5E2A]">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-[#FF5E2A] bg-slate-850 h-1.5 rounded-lg cursor-pointer appearance-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-400 bg-transparent hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCrop}
                disabled={uploading}
                className="bg-[#08BE3B] hover:opacity-90 disabled:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-98 border-0 cursor-pointer"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Apply Crop & Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
