import React, { useState, useRef, useEffect } from 'react';
import { Download, Image as ImageIcon, Loader2, Palette, Square, Layers, Maximize, Upload, Plus, Trash2, X, Github, Type } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Size { label: string; width: number; height: number; }
interface StoreType { id: string; label: string; sizes: Size[]; }

const STORE_TYPES: StoreType[] = [
  { id: 'ios', label: 'iOS', sizes: [
    { label: 'iPhone 6.9"', width: 1320, height: 2868 },
    { label: 'iPhone 6.7"', width: 1290, height: 2796 },
    { label: 'iPhone 6.5"', width: 1242, height: 2688 },
    { label: 'iPhone 5.5"', width: 1242, height: 2208 },
    { label: 'iPhone 4.7"', width: 750,  height: 1334 },
  ]},
  { id: 'ipados', label: 'iPadOS', sizes: [
    { label: 'iPad Pro 12.9"', width: 2048, height: 2732 },
    { label: 'iPad Pro 11"',   width: 1668, height: 2388 },
    { label: 'iPad 10th gen',  width: 1640, height: 2360 },
    { label: 'iPad mini',      width: 1488, height: 2266 },
  ]},
  { id: 'macos', label: 'macOS', sizes: [
    { label: '1280 × 800',  width: 1280, height: 800  },
    { label: '1440 × 900',  width: 1440, height: 900  },
    { label: '2560 × 1600', width: 2560, height: 1600 },
    { label: '2880 × 1800', width: 2880, height: 1800 },
  ]},
  { id: 'android', label: 'Android', sizes: [
    { label: 'Android Phone',      width: 1080, height: 1920 },
    { label: 'Android 7" Tablet',  width: 1200, height: 1920 },
    { label: 'Android 10" Tablet', width: 1920, height: 1200 },
    { label: 'Android TV',         width: 1920, height: 1080 },
    { label: 'WearOS',             width: 384,  height: 384  },
  ]},
  { id: 'windows', label: 'Windows', sizes: [
    { label: 'Desktop',     width: 1366, height: 768  },
    { label: 'Surface Hub', width: 1920, height: 1080 },
    { label: 'Xbox',        width: 3840, height: 2160 },
    { label: 'Mobile',      width: 480,  height: 800  },
  ]},
  { id: 'custom', label: 'Custom', sizes: [] },
];

const CUSTOM_SIZES_KEY = 'custom-screenshot-sizes';

function loadCustomSizes(): Size[] {
  try {
    const raw = localStorage.getItem(CUSTOM_SIZES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is Size =>
      typeof item === 'object' &&
      typeof item.label === 'string' &&
      typeof item.width === 'number' &&
      typeof item.height === 'number'
    );
  } catch { return []; }
}

function saveCustomSizes(sizes: Size[]): void {
  localStorage.setItem(CUSTOM_SIZES_KEY, JSON.stringify(sizes));
}

const BACKGROUNDS = [
  // Gradients
  { label: 'Dark Slate', value: 'linear-gradient(to bottom right, #0f172a, #334155)' },
  { label: 'Sunset', value: 'linear-gradient(to bottom right, #f97316, #eab308)' },
  { label: 'Ocean', value: 'linear-gradient(to bottom right, #0ea5e9, #3b82f6)' },
  { label: 'Purple Haze', value: 'linear-gradient(to bottom right, #a855f7, #ec4899)' },
  { label: 'Emerald', value: 'linear-gradient(to bottom right, #10b981, #059669)' },
  { label: 'Cherry', value: 'linear-gradient(to bottom right, #f43f5e, #be123c)' },
  { label: 'Mango', value: 'linear-gradient(to bottom right, #f59e0b, #d97706)' },
  { label: 'Midnight', value: 'linear-gradient(to bottom right, #1e1b4b, #312e81)' },
  { label: 'Mint', value: 'linear-gradient(to bottom right, #34d399, #059669)' },
  { label: 'Rose', value: 'linear-gradient(to bottom right, #fda4af, #e11d48)' },
  { label: 'Lavender', value: 'linear-gradient(to bottom right, #d8b4e2, #a275e3)' },
  { label: 'Peach', value: 'linear-gradient(to bottom right, #ffecd2, #fcb69f)' },
  { label: 'Aqua', value: 'linear-gradient(to bottom right, #2af598, #009efd)' },
  { label: 'Crimson', value: 'linear-gradient(to bottom right, #ff0844, #ffb199)' },
  { label: 'Forest', value: 'linear-gradient(to bottom right, #5b247a, #1bcedf)' },
  { label: 'Neon Blue', value: 'linear-gradient(to bottom right, #00c6ff, #0072ff)' },
  { label: 'Neon Pink', value: 'linear-gradient(to bottom right, #f857a6, #ff5858)' },
  { label: 'Neon Purple', value: 'linear-gradient(to bottom right, #cc2b5e, #753a88)' },
  { label: 'Neon Green', value: 'linear-gradient(to bottom right, #11998e, #38ef7d)' },
  { label: 'Neon Orange', value: 'linear-gradient(to bottom right, #ff9966, #ff5e62)' },
  // Solids
  { label: 'Solid White', value: '#ffffff' },
  { label: 'Solid Black', value: '#000000' },
  { label: 'Solid Gray', value: '#94a3b8' },
  { label: 'Solid Slate', value: '#64748b' },
  { label: 'Solid Indigo', value: '#6366f1' },
];

const ELEVATIONS = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 10 },
  { label: 'Medium', value: 20 },
  { label: 'Large', value: 40 },
  { label: 'Extra Large', value: 80 },
];

const BORDER_RADII = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 8 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 24 },
  { label: 'Extra Large', value: 32 },
];

const PADDINGS = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 32 },
  { label: 'Medium', value: 64 },
  { label: 'Large', value: 128 },
  { label: 'Extra Large', value: 256 },
];

const CAPTION_FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif";

export default function App() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [customFileName, setCustomFileName] = useState<string>('');

  const activeImage = uploadedImages[activeImageIndex] as string | undefined;

  const macosStore = STORE_TYPES.find(s => s.id === 'macos')!;
  const [selectedStoreTypeId, setSelectedStoreTypeId] = useState<string>('macos');
  const [selectedSize, setSelectedSize] = useState<Size>(macosStore.sizes[0]);
  const [customSizes, setCustomSizes] = useState<Size[]>(() => loadCustomSizes());
  const [customLabel, setCustomLabel] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUNDS[0]);
  const [showAllBackgrounds, setShowAllBackgrounds] = useState(false);
  const [customColor, setCustomColor] = useState('#ff0000');
  const [selectedElevation, setSelectedElevation] = useState(ELEVATIONS[3]);
  const [selectedBorderRadius, setSelectedBorderRadius] = useState(BORDER_RADII[2]);
  const [selectedPadding, setSelectedPadding] = useState(PADDINGS[2]);

  const [captionTexts, setCaptionTexts] = useState<string[]>([]);
  const [captionPosition, setCaptionPosition] = useState<'above' | 'below'>('above');
  const [captionFontSize, setCaptionFontSize] = useState<number>(64);
  const [captionFontWeight, setCaptionFontWeight] = useState<string>('bold');
  const [captionColor, setCaptionColor] = useState<string>('#ffffff');
  const activeCaption = captionTexts[activeImageIndex] ?? '';

  const [showDonation, setShowDonation] = useState(false);
  const [hasShownDonation, setHasShownDonation] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveCustomSizes(customSizes); }, [customSizes]);

  const handleStoreTypeChange = (id: string) => {
    setSelectedStoreTypeId(id);
    if (id === 'custom') {
      if (customSizes.length > 0) setSelectedSize(customSizes[0]);
    } else {
      const store = STORE_TYPES.find(s => s.id === id);
      if (store?.sizes.length) setSelectedSize(store.sizes[0]);
    }
  };

  const handleAddCustomSize = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    const lbl = customLabel.trim();
    if (!lbl || isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
    const newSize: Size = { label: lbl, width: w, height: h };
    setCustomSizes(prev => [...prev, newSize]);
    setSelectedSize(newSize);
    setCustomLabel(''); setCustomWidth(''); setCustomHeight('');
  };

  const handleDeleteCustomSize = (index: number) => {
    setCustomSizes(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (selectedSize === prev[index]) {
        setSelectedSize(updated.length > 0 ? updated[0] : macosStore.sizes[0]);
      }
      return updated;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const readers = Array.from(files).map(
      (file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject();
        reader.readAsDataURL(file);
      })
    );
    Promise.all(readers)
      .then((dataUrls) => {
        setUploadedImages((prev) => { setActiveImageIndex(prev.length); return [...prev, ...dataUrls]; });
        setCaptionTexts((prev) => [...prev, ...dataUrls.map(() => '')]);
        setError(null);
        event.target.value = '';
      })
      .catch(() => setError('Failed to read one or more files'));
  };

  const renderImageToCanvas = (imageDataUrl: string, captionText?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No context')); return; }

      canvas.width = selectedSize.width;
      canvas.height = selectedSize.height;

      // Word-wrap helper
      const wrapText = (text: string, maxWidth: number): string[] => {
        const lines: string[] = [];
        for (const paragraph of text.split('\n')) {
          const words = paragraph.split(' ');
          let currentLine = '';
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          lines.push(currentLine);
        }
        return lines;
      };

      // Draw background
      if (selectedBackground.value.startsWith('linear-gradient')) {
        const matches = selectedBackground.value.match(/linear-gradient\(to bottom right, (#[a-f0-9]+), (#[a-f0-9]+)\)/i);
        if (matches) {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, matches[1]);
          gradient.addColorStop(1, matches[2]);
          ctx.fillStyle = gradient;
        } else {
          ctx.fillStyle = '#1e293b';
        }
      } else {
        ctx.fillStyle = selectedBackground.value;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = new Image();
      img.onload = () => {
        const caption = captionText?.trim() || '';

        // Measure caption height if present
        let captionTotalHeight = 0;
        let captionLines: string[] = [];
        const lineHeight = captionFontSize * 1.2;
        const captionPadding = captionFontSize * 0.5;
        if (caption) {
          ctx.font = `${captionFontWeight} ${captionFontSize}px ${CAPTION_FONT_FAMILY}`;
          const maxTextWidth = canvas.width - (selectedPadding.value * 2) - captionFontSize;
          captionLines = wrapText(caption, maxTextWidth);
          captionTotalHeight = captionLines.length * lineHeight + captionPadding;
        }

        const availableWidth = canvas.width - (selectedPadding.value * 2);
        const availableHeight = canvas.height - (selectedPadding.value * 2) - captionTotalHeight;

        const imgRatio = img.width / img.height;
        const availableRatio = availableWidth / availableHeight;

        let drawWidth, drawHeight;
        if (imgRatio > availableRatio) {
          drawWidth = availableWidth;
          drawHeight = availableWidth / imgRatio;
        } else {
          drawHeight = availableHeight;
          drawWidth = availableHeight * imgRatio;
        }

        let drawX = (canvas.width - drawWidth) / 2;
        let drawY: number;
        if (caption && captionPosition === 'above') {
          drawY = selectedPadding.value + captionTotalHeight + (availableHeight - drawHeight) / 2;
        } else if (caption && captionPosition === 'below') {
          drawY = selectedPadding.value + (availableHeight - drawHeight) / 2;
        } else {
          drawY = (canvas.height - drawHeight) / 2;
        }

        if (selectedElevation.value > 0) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
          ctx.shadowBlur = selectedElevation.value;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = selectedElevation.value / 2;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        const radius = selectedBorderRadius.value * (canvas.width / 1440);
        ctx.roundRect(drawX, drawY, drawWidth, drawHeight, radius);
        ctx.fillStyle = '#fff';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        // Draw caption text
        if (caption && captionLines.length > 0) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.font = `${captionFontWeight} ${captionFontSize}px ${CAPTION_FONT_FAMILY}`;
          ctx.fillStyle = captionColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          let textStartY: number;
          if (captionPosition === 'above') {
            textStartY = drawY - captionTotalHeight + captionPadding * 0.25;
          } else {
            textStartY = drawY + drawHeight + captionPadding * 0.5;
          }

          for (let i = 0; i < captionLines.length; i++) {
            ctx.fillText(captionLines[i], canvas.width / 2, textStartY + i * lineHeight);
          }
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  };

  const triggerDonationToast = () => {
    if (!hasShownDonation) {
      setTimeout(() => setShowDonation(true), 800);
      setHasShownDonation(true);
    }
  };

  const trackDownload = (count: number, type: 'single' | 'zip') => {
    (window as any).gtag?.('event', 'image_download', { count, type });
  };

  const handleDownload = async () => {
    if (!activeImage) return;
    const dataUrl = await renderImageToCanvas(activeImage, captionTexts[activeImageIndex]);
    const baseName = customFileName.trim() || `screenshot-${selectedSize.width}x${selectedSize.height}`;
    const link = document.createElement('a');
    link.download = `${baseName}.png`;
    link.href = dataUrl;
    link.click();
    trackDownload(1, 'single');
    triggerDonationToast();
  };

  const handleDownloadAll = async () => {
    if (uploadedImages.length === 0) return;
    setIsDownloadingAll(true);
    setError(null);
    try {
      const zip = new JSZip();
      const baseName = customFileName.trim() || `screenshot-${selectedSize.width}x${selectedSize.height}`;
      for (let i = 0; i < uploadedImages.length; i++) {
        const dataUrl = await renderImageToCanvas(uploadedImages[i], captionTexts[i]);
        const base64 = dataUrl.split(',')[1];
        zip.file(`${baseName}-${i + 1}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${baseName}.zip`);
      trackDownload(uploadedImages.length, 'zip');
      triggerDonationToast();
    } catch {
      setError('Failed to generate ZIP. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      setActiveImageIndex(updated.length === 0 ? 0 : Math.min(activeImageIndex, updated.length - 1));
      return updated;
    });
    setCaptionTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, text: string) => {
    setCaptionTexts((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const activeSizes: Size[] =
    selectedStoreTypeId === 'custom'
      ? customSizes
      : STORE_TYPES.find(s => s.id === selectedStoreTypeId)?.sizes ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-neutral-200 flex flex-col h-screen overflow-y-auto shrink-0">
        <div className="p-6 border-b border-neutral-200">
          <h1 className="text-xl font-semibold tracking-tight">App Store Screenshots</h1>
          <p className="text-sm text-neutral-500 mt-1">Create beautiful App Store screenshots</p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Image Source */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-700">Image Source</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload className="w-4 h-4" /> Upload Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
            </div>

            {/* Thumbnail strip */}
            {uploadedImages.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''}</span>
                  <button
                    onClick={() => { setUploadedImages([]); setActiveImageIndex(0); setCaptionTexts([]); }}
                    className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {uploadedImages.map((src, i) => (
                    <div
                      key={i}
                      className="relative shrink-0 group cursor-pointer"
                      onClick={() => setActiveImageIndex(i)}
                    >
                      <img
                        src={src}
                        alt={`Upload ${i + 1}`}
                        className={`w-14 h-14 object-cover rounded-lg border-2 transition-all ${
                          i === activeImageIndex
                            ? 'border-indigo-500'
                            : 'border-transparent hover:border-neutral-300'
                        }`}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold leading-none items-center justify-center hidden group-hover:flex"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>

          <hr className="border-neutral-200" />

          {/* Settings */}
          <div className="space-y-5">
            {/* Store Type + Size */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Maximize className="w-4 h-4" /> Target Size
              </label>

              {/* Store type pill buttons */}
              <div className="flex flex-wrap gap-1.5">
                {STORE_TYPES.map(store => (
                  <button
                    key={store.id}
                    onClick={() => handleStoreTypeChange(store.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedStoreTypeId === store.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {store.label}
                  </button>
                ))}
              </div>

              {/* Size dropdown for non-custom store types */}
              {activeSizes.length > 0 && selectedStoreTypeId !== 'custom' && (
                <select
                  value={selectedSize.label}
                  onChange={(e) => {
                    const found = activeSizes.find(s => s.label === e.target.value);
                    if (found) setSelectedSize(found);
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {activeSizes.map(size => (
                    <option key={size.label} value={size.label}>
                      {size.label} — {size.width}×{size.height}
                    </option>
                  ))}
                </select>
              )}

              {/* Custom sizes UI */}
              {selectedStoreTypeId === 'custom' && (
                <div className="space-y-2">
                  {customSizes.length === 0 && (
                    <p className="text-xs text-neutral-400 italic">No custom sizes saved yet.</p>
                  )}
                  {customSizes.map((size, index) => (
                    <div
                      key={`${size.label}-${index}`}
                      onClick={() => setSelectedSize(size)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        selectedSize.label === size.label && selectedSize.width === size.width
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="font-medium truncate flex-1">{size.label}</span>
                      <span className="text-neutral-400 ml-2 shrink-0">{size.width}×{size.height}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustomSize(index); }}
                        className="ml-2 p-1 text-neutral-400 hover:text-red-500 transition-colors rounded shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add Custom Size form */}
                  <div className="border border-dashed border-neutral-300 rounded-lg p-3 space-y-2 bg-neutral-50">
                    <p className="text-xs font-medium text-neutral-600">Add Custom Size</p>
                    <input
                      type="text"
                      placeholder="Label (e.g. My Phone)"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full px-2 py-1.5 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number" placeholder="Width (px)" value={customWidth} min={1}
                        onChange={(e) => setCustomWidth(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <input
                        type="number" placeholder="Height (px)" value={customHeight} min={1}
                        onChange={(e) => setCustomHeight(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-1.5 border border-neutral-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleAddCustomSize}
                      disabled={!customLabel.trim() || !customWidth || !customHeight}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 disabled:text-neutral-400 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Size
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Background */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Background
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(showAllBackgrounds ? BACKGROUNDS : BACKGROUNDS.slice(0, 5)).map(bg => (
                  <button
                    key={bg.label}
                    onClick={() => setSelectedBackground(bg)}
                    title={bg.label}
                    className={`w-full aspect-square rounded-md border-2 transition-all ${selectedBackground.label === bg.label ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ background: bg.value }}
                  />
                ))}
                <label
                  title="Custom Color"
                  className={`w-full aspect-square rounded-md border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden ${selectedBackground.label === 'Custom' ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ background: selectedBackground.label === 'Custom' ? selectedBackground.value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                >
                  <input
                    type="color"
                    value={selectedBackground.label === 'Custom' ? selectedBackground.value : customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setSelectedBackground({ label: 'Custom', value: e.target.value });
                    }}
                    className="opacity-0 w-[150%] h-[150%] cursor-pointer -translate-x-1/4 -translate-y-1/4"
                  />
                </label>
                {!showAllBackgrounds && (
                  <button
                    onClick={() => setShowAllBackgrounds(true)}
                    className="w-full aspect-square rounded-md border-2 border-dashed border-neutral-300 hover:border-neutral-400 text-neutral-500 hover:text-neutral-600 transition-all flex flex-col items-center justify-center text-[10px] font-medium"
                  >
                    <span>+{BACKGROUNDS.length - 5}</span>
                    <span>More</span>
                  </button>
                )}
              </div>
              {showAllBackgrounds && (
                <button
                  onClick={() => setShowAllBackgrounds(false)}
                  className="w-full py-1.5 text-xs text-neutral-500 hover:text-neutral-700 font-medium"
                >
                  Show Less
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Type className="w-4 h-4" /> Caption
              </label>
              <textarea
                rows={2}
                disabled={uploadedImages.length === 0}
                placeholder="Enter caption text…"
                value={activeCaption}
                onChange={(e) => handleCaptionChange(activeImageIndex, e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none disabled:bg-neutral-100 disabled:text-neutral-400"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCaptionPosition('above')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    captionPosition === 'above'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Above Image
                </button>
                <button
                  onClick={() => setCaptionPosition('below')}
                  className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    captionPosition === 'below'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Below Image
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">Font Size</span>
                  <span className="text-xs text-neutral-500 font-mono">{captionFontSize}px</span>
                </div>
                <input
                  type="range"
                  min={24}
                  max={128}
                  value={captionFontSize}
                  onChange={(e) => setCaptionFontSize(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <select
                value={captionFontWeight}
                onChange={(e) => setCaptionFontWeight(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="bold">Bold</option>
                <option value="900">Black</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={captionColor}
                  onChange={(e) => setCaptionColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-neutral-300"
                />
                <span className="text-xs text-neutral-500 font-mono uppercase">{captionColor}</span>
              </div>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Square className="w-4 h-4" /> Padding
              </label>
              <select
                value={selectedPadding.label}
                onChange={(e) => setSelectedPadding(PADDINGS.find(p => p.label === e.target.value) || PADDINGS[2])}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {PADDINGS.map(p => (
                  <option key={p.label} value={p.label}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Elevation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Elevation
              </label>
              <select
                value={selectedElevation.label}
                onChange={(e) => setSelectedElevation(ELEVATIONS.find(el => el.label === e.target.value) || ELEVATIONS[3])}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {ELEVATIONS.map(el => (
                  <option key={el.label} value={el.label}>{el.label}</option>
                ))}
              </select>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Square className="w-4 h-4 rounded-md" /> Rounded Corners
              </label>
              <select
                value={selectedBorderRadius.label}
                onChange={(e) => setSelectedBorderRadius(BORDER_RADII.find(br => br.label === e.target.value) || BORDER_RADII[2])}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {BORDER_RADII.map(br => (
                  <option key={br.label} value={br.label}>{br.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 bg-neutral-50 space-y-2">
          <input
            type="text"
            value={customFileName}
            onChange={(e) => setCustomFileName(e.target.value)}
            placeholder={`screenshot-${selectedSize.width}x${selectedSize.height}`}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
          />
          <button
            onClick={handleDownload}
            disabled={!activeImage}
            className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:text-neutral-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-5 h-5" /> Download {selectedSize.width}x{selectedSize.height}
          </button>
          {uploadedImages.length > 1 && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isDownloadingAll
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Rendering {uploadedImages.length} images...</>
                : <><Download className="w-4 h-4" /> Download All ({uploadedImages.length}) as ZIP</>}
            </button>
          )}
          <a
            href="https://buymeacoffee.com/dnyantra5"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-amber-600 transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </div>

      {/* Donation Toast */}
      {showDonation && (
        <div className="fixed bottom-6 right-6 z-50 max-w-xs bg-white border border-neutral-200 rounded-2xl shadow-xl p-5 flex flex-col gap-3 animate-slide-up">
          <button onClick={() => setShowDonation(false)} className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600">
            <X size={16} />
          </button>
          <div className="text-2xl">☕</div>
          <div>
            <p className="font-semibold text-neutral-900 text-sm">Screenshots look great! 🎉</p>
            <p className="text-neutral-500 text-xs mt-1 leading-relaxed">
              You just dodged Photoshop for the day. If this saved you time, a coffee would make my day.
            </p>
          </div>
          <a
            href="https://buymeacoffee.com/dnyantra5"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-semibold text-sm rounded-xl px-4 py-2 transition-colors"
          >
            ☕ Buy me a coffee
          </a>
        </div>
      )}

      {/* Main Preview Area */}
      <div className="flex-1 bg-neutral-100 p-8 flex items-center justify-center overflow-hidden relative">
        {/* Top-right nav */}
        <div className="absolute top-4 right-5 flex items-center gap-4">
          <a
            href="https://github.com/dnyantra/StoreScreenshots"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <Github className="w-4 h-4" /> Star
          </a>
          <a
            href="https://dnyantra.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            dnyantra.com
          </a>
        </div>
        {/* Preview Container */}
        <div
          className="relative rounded-xl overflow-hidden shadow-sm transition-all duration-500 flex items-center justify-center"
          style={{
            background: selectedBackground.value,
            aspectRatio: `${selectedSize.width} / ${selectedSize.height}`,
            width: '100%',
            maxHeight: '75vh',
            maxWidth: `min(100%, calc(75vh * ${selectedSize.width / selectedSize.height}))`,
          }}
        >
          {activeImage ? (
            <div
              className="relative transition-all duration-300"
              style={{
                padding: `${selectedPadding.value / 4}px`,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {activeCaption && captionPosition === 'above' && (
                <p style={{
                  fontFamily: CAPTION_FONT_FAMILY,
                  fontSize: `${captionFontSize / 4}px`,
                  fontWeight: captionFontWeight,
                  color: captionColor,
                  textAlign: 'center',
                  margin: 0,
                  paddingBottom: `${captionFontSize / 8}px`,
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                }}>{activeCaption}</p>
              )}
              <img
                src={activeImage}
                alt="Preview"
                className="max-w-full object-contain transition-all duration-300"
                style={{
                  maxHeight: activeCaption ? '80%' : '100%',
                  borderRadius: `${selectedBorderRadius.value}px`,
                  boxShadow: selectedElevation.value > 0 ? `0 ${selectedElevation.value / 2}px ${selectedElevation.value}px rgba(0,0,0,0.4)` : 'none'
                }}
              />
              {activeCaption && captionPosition === 'below' && (
                <p style={{
                  fontFamily: CAPTION_FONT_FAMILY,
                  fontSize: `${captionFontSize / 4}px`,
                  fontWeight: captionFontWeight,
                  color: captionColor,
                  textAlign: 'center',
                  margin: 0,
                  paddingTop: `${captionFontSize / 8}px`,
                  lineHeight: 1.2,
                  wordBreak: 'break-word',
                  maxWidth: '90%',
                  whiteSpace: 'pre-wrap',
                }}>{activeCaption}</p>
              )}
            </div>
          ) : (
            <div className="text-center text-white/70 flex flex-col items-center">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium text-lg">No image selected</p>
              <p className="text-sm opacity-75 mt-1">Upload an image to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
