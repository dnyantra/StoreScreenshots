import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Image as ImageIcon, Loader2, Palette, Square, Layers, Maximize, Upload, Plus, Trash2, X, Github, Type, Crop } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Size { label: string; width: number; height: number; }
interface StoreType { id: string; label: string; sizes: Size[]; }

interface PopOutRegion {
  id: string;
  x: number; y: number; width: number; height: number;
  borderRadius: number; elevation: number;
  offsetX: number; offsetY: number;
  scale: number;
}

const POP_OUT_ELEVATIONS = [
  { label: 'None', value: 0 },
  { label: 'Small', value: 10 },
  { label: 'Medium', value: 20 },
  { label: 'Large', value: 40 },
  { label: 'Extra Large', value: 80 },
];

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

  // Pop-out region state
  const [popOutRegions, setPopOutRegions] = useState<PopOutRegion[][]>([]);
  const [isPopOutMode, setIsPopOutMode] = useState(false);
  const [selectedPopOutId, setSelectedPopOutId] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState<'none' | 'draw' | 'move' | 'resize'>('none');
  const [drawStart, setDrawStart] = useState<{ fx: number; fy: number } | null>(null);
  const [currentDraw, setCurrentDraw] = useState<{ fx: number; fy: number } | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const previewImageRef = useRef<HTMLImageElement>(null);
  const outerPreviewRef = useRef<HTMLDivElement>(null);
  const [imageRect, setImageRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => { saveCustomSizes(customSizes); }, [customSizes]);

  // Compute image rect relative to outer container
  const computeImageRect = useCallback(() => {
    if (!previewImageRef.current || !outerPreviewRef.current) return;
    const outerRect = outerPreviewRef.current.getBoundingClientRect();
    const imgRect = previewImageRef.current.getBoundingClientRect();
    setImageRect({
      left: imgRect.left - outerRect.left,
      top: imgRect.top - outerRect.top,
      width: imgRect.width,
      height: imgRect.height,
    });
  }, []);

  // ResizeObserver to keep pop-out positions accurate
  useEffect(() => {
    if (!outerPreviewRef.current) return;
    const observer = new ResizeObserver(() => computeImageRect());
    observer.observe(outerPreviewRef.current);
    return () => observer.disconnect();
  }, [computeImageRect]);

  // Deselect and exit drag on image change
  useEffect(() => {
    setSelectedPopOutId(null);
    setDragMode('none');
    setDrawStart(null);
    setCurrentDraw(null);
    computeImageRect();
  }, [activeImageIndex, computeImageRect]);

  // Keyboard handler for Delete/Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPopOutMode) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPopOutId) {
        e.preventDefault();
        setPopOutRegions(prev => {
          const updated = [...prev];
          updated[activeImageIndex] = (updated[activeImageIndex] ?? []).filter(r => r.id !== selectedPopOutId);
          return updated;
        });
        setSelectedPopOutId(null);
      }
      if (e.key === 'Escape') {
        setSelectedPopOutId(null);
        setIsPopOutMode(false);
        setDragMode('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPopOutMode, selectedPopOutId, activeImageIndex]);

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
        setPopOutRegions((prev) => [...prev, ...dataUrls.map(() => [] as PopOutRegion[])]);
        setError(null);
        event.target.value = '';
      })
      .catch(() => setError('Failed to read one or more files'));
  };

  // --- Pop-out region helpers ---
  const currentRegions = popOutRegions[activeImageIndex] ?? [];

  const pageToImageFraction = (clientX: number, clientY: number): { fx: number; fy: number } | null => {
    if (!previewImageRef.current) return null;
    const r = previewImageRef.current.getBoundingClientRect();
    return {
      fx: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      fy: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    };
  };

  const getHandleAtPoint = (fx: number, fy: number, region: PopOutRegion): string | null => {
    if (!previewImageRef.current) return null;
    const r = previewImageRef.current.getBoundingClientRect();
    const hx = 8 / r.width;
    const hy = 8 / r.height;
    const handles: Record<string, { x: number; y: number }> = {
      nw: { x: region.x, y: region.y },
      ne: { x: region.x + region.width, y: region.y },
      sw: { x: region.x, y: region.y + region.height },
      se: { x: region.x + region.width, y: region.y + region.height },
      n: { x: region.x + region.width / 2, y: region.y },
      s: { x: region.x + region.width / 2, y: region.y + region.height },
      w: { x: region.x, y: region.y + region.height / 2 },
      e: { x: region.x + region.width, y: region.y + region.height / 2 },
    };
    for (const [name, pos] of Object.entries(handles)) {
      if (Math.abs(fx - pos.x) < hx && Math.abs(fy - pos.y) < hy) return name;
    }
    return null;
  };

  const addPopOutRegion = (region: PopOutRegion) => {
    setPopOutRegions(prev => {
      const updated = [...prev];
      while (updated.length <= activeImageIndex) updated.push([]);
      updated[activeImageIndex] = [...updated[activeImageIndex], region];
      return updated;
    });
  };

  const updatePopOutRegion = (id: string, updates: Partial<PopOutRegion>) => {
    setPopOutRegions(prev => {
      const updated = [...prev];
      const regions = [...(updated[activeImageIndex] ?? [])];
      const idx = regions.findIndex(r => r.id === id);
      if (idx >= 0) regions[idx] = { ...regions[idx], ...updates };
      updated[activeImageIndex] = regions;
      return updated;
    });
  };

  const deletePopOutRegion = (id: string) => {
    setPopOutRegions(prev => {
      const updated = [...prev];
      updated[activeImageIndex] = (updated[activeImageIndex] ?? []).filter(r => r.id !== id);
      return updated;
    });
  };

  // --- Mouse event handlers for pop-out drawing/editing ---
  const handlePopOutMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pt = pageToImageFraction(e.clientX, e.clientY);
    if (!pt) return;

    // Check selected region for resize handle
    if (selectedPopOutId) {
      const sel = currentRegions.find(r => r.id === selectedPopOutId);
      if (sel) {
        const handle = getHandleAtPoint(pt.fx, pt.fy, sel);
        if (handle) {
          setDragMode('resize');
          setResizeHandle(handle);
          setDrawStart(pt);
          return;
        }
      }
    }

    // Check if clicking inside any region (for move)
    for (const region of [...currentRegions].reverse()) {
      if (pt.fx >= region.x && pt.fx <= region.x + region.width &&
          pt.fy >= region.y && pt.fy <= region.y + region.height) {
        setSelectedPopOutId(region.id);
        setDragMode('move');
        setDragOffset({ dx: pt.fx - region.x, dy: pt.fy - region.y });
        return;
      }
    }

    // Start drawing new region
    setSelectedPopOutId(null);
    setDragMode('draw');
    setDrawStart(pt);
    setCurrentDraw(pt);
  };

  const handlePopOutMouseMove = (e: React.MouseEvent) => {
    if (dragMode === 'none') return;
    const pt = pageToImageFraction(e.clientX, e.clientY);
    if (!pt) return;

    if (dragMode === 'draw') {
      setCurrentDraw(pt);
      return;
    }

    if (dragMode === 'move' && selectedPopOutId) {
      const region = currentRegions.find(r => r.id === selectedPopOutId);
      if (!region) return;
      let nx = pt.fx - dragOffset.dx;
      let ny = pt.fy - dragOffset.dy;
      nx = Math.max(0, Math.min(1 - region.width, nx));
      ny = Math.max(0, Math.min(1 - region.height, ny));
      updatePopOutRegion(selectedPopOutId, { x: nx, y: ny });
      return;
    }

    if (dragMode === 'resize' && selectedPopOutId && drawStart && resizeHandle) {
      const region = currentRegions.find(r => r.id === selectedPopOutId);
      if (!region) return;
      let { x, y, width, height } = region;
      const right = x + width;
      const bottom = y + height;

      if (resizeHandle.includes('w')) { x = Math.min(pt.fx, right - 0.02); width = right - x; }
      if (resizeHandle.includes('e')) { width = Math.max(0.02, pt.fx - x); }
      if (resizeHandle.includes('n')) { y = Math.min(pt.fy, bottom - 0.02); height = bottom - y; }
      if (resizeHandle.includes('s')) { height = Math.max(0.02, pt.fy - y); }

      updatePopOutRegion(selectedPopOutId, { x, y, width, height });
    }
  };

  const handlePopOutMouseUp = () => {
    if (dragMode === 'draw' && drawStart && currentDraw) {
      const x = Math.min(drawStart.fx, currentDraw.fx);
      const y = Math.min(drawStart.fy, currentDraw.fy);
      const w = Math.abs(currentDraw.fx - drawStart.fx);
      const h = Math.abs(currentDraw.fy - drawStart.fy);
      if (w > 0.02 && h > 0.02) {
        const newRegion: PopOutRegion = {
          id: crypto.randomUUID(),
          x, y, width: w, height: h,
          borderRadius: 16,
          elevation: 40,
          offsetX: 0, offsetY: 0,
          scale: 1.3,
        };
        addPopOutRegion(newRegion);
        setSelectedPopOutId(newRegion.id);
      }
    }
    setDragMode('none');
    setDrawStart(null);
    setCurrentDraw(null);
    setResizeHandle(null);
  };

  const renderImageToCanvas = (imageDataUrl: string, captionText?: string, regions?: PopOutRegion[]): Promise<string> => {
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

        // Draw pop-out regions
        if (regions && regions.length > 0) {
          for (const region of regions) {
            const s = region.scale;
            const sx = region.x * img.width;
            const sy = region.y * img.height;
            const sw = region.width * img.width;
            const sh = region.height * img.height;
            const baseW = region.width * drawWidth;
            const baseH = region.height * drawHeight;
            const dw = baseW * s;
            const dh = baseH * s;
            // Center scaled pop-out on region center, then apply offset
            const cx = drawX + (region.x + region.width / 2) * drawWidth;
            const cy = drawY + (region.y + region.height / 2) * drawHeight;
            const dx = cx - dw / 2 + region.offsetX * drawWidth;
            const dy = cy - dh / 2 + region.offsetY * drawHeight;
            const r = region.borderRadius * s * (canvas.width / 1440);

            if (region.elevation > 0) {
              ctx.save();
              ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
              ctx.shadowBlur = region.elevation;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = region.elevation / 2;
              ctx.beginPath();
              ctx.roundRect(dx, dy, dw, dh, r);
              ctx.fillStyle = '#fff';
              ctx.fill();
              ctx.restore();
            }

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, r);
            ctx.clip();
            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.restore();
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
    const dataUrl = await renderImageToCanvas(activeImage, captionTexts[activeImageIndex], popOutRegions[activeImageIndex]);
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
        const dataUrl = await renderImageToCanvas(uploadedImages[i], captionTexts[i], popOutRegions[i]);
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
    setPopOutRegions((prev) => prev.filter((_, i) => i !== index));
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
                    onClick={() => { setUploadedImages([]); setActiveImageIndex(0); setCaptionTexts([]); setPopOutRegions([]); }}
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

            {/* Pop-Out Regions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
                <Crop className="w-4 h-4" /> Pop-Out Regions
              </label>
              <button
                onClick={() => { setIsPopOutMode(!isPopOutMode); if (isPopOutMode) { setSelectedPopOutId(null); setDragMode('none'); } }}
                disabled={!activeImage}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isPopOutMode
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Crop className="w-4 h-4" />
                {isPopOutMode ? 'Exit Pop-Out Mode' : 'Draw Pop-Out Region'}
              </button>
              {isPopOutMode && (
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Click and drag on the preview image to draw a pop-out region. Click a region to select, drag to move, use handles to resize. Press Delete to remove.
                </p>
              )}
              {currentRegions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs text-neutral-500">{currentRegions.length} region{currentRegions.length !== 1 ? 's' : ''}</span>
                  {currentRegions.map((region, i) => (
                    <div
                      key={region.id}
                      onClick={() => { setSelectedPopOutId(region.id); setIsPopOutMode(true); }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        region.id === selectedPopOutId
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="font-medium">Region {i + 1}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deletePopOutRegion(region.id); if (selectedPopOutId === region.id) setSelectedPopOutId(null); }}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {selectedPopOutId && (() => {
                const sel = currentRegions.find(r => r.id === selectedPopOutId);
                if (!sel) return null;
                return (
                  <div className="space-y-3 pt-2 border-t border-neutral-200">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Corner Radius</span>
                        <span className="text-xs text-neutral-500 font-mono">{sel.borderRadius}px</span>
                      </div>
                      <input
                        type="range" min={0} max={48} value={sel.borderRadius}
                        onChange={(e) => updatePopOutRegion(sel.id, { borderRadius: Number(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-neutral-500">Shadow</span>
                      <select
                        value={sel.elevation}
                        onChange={(e) => updatePopOutRegion(sel.id, { elevation: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        {POP_OUT_ELEVATIONS.map(el => (
                          <option key={el.label} value={el.value}>{el.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Scale</span>
                        <span className="text-xs text-neutral-500 font-mono">{sel.scale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range" min={10} max={30} value={Math.round(sel.scale * 10)}
                        onChange={(e) => updatePopOutRegion(sel.id, { scale: Number(e.target.value) / 10 })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Offset X</span>
                        <span className="text-xs text-neutral-500 font-mono">{Math.round(sel.offsetX * 100)}%</span>
                      </div>
                      <input
                        type="range" min={-50} max={50} value={Math.round(sel.offsetX * 100)}
                        onChange={(e) => updatePopOutRegion(sel.id, { offsetX: Number(e.target.value) / 100 })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-neutral-500">Offset Y</span>
                        <span className="text-xs text-neutral-500 font-mono">{Math.round(sel.offsetY * 100)}%</span>
                      </div>
                      <input
                        type="range" min={-50} max={50} value={Math.round(sel.offsetY * 100)}
                        onChange={(e) => updatePopOutRegion(sel.id, { offsetY: Number(e.target.value) / 100 })}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                );
              })()}
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
        {/* Preview Container — outer wrapper (NO overflow-hidden so pop-outs can escape) */}
        <div
          ref={outerPreviewRef}
          className="relative shadow-sm transition-all duration-500"
          style={{
            aspectRatio: `${selectedSize.width} / ${selectedSize.height}`,
            width: '100%',
            maxHeight: '75vh',
            maxWidth: `min(100%, calc(75vh * ${selectedSize.width / selectedSize.height}))`,
          }}
        >
          {/* Inner clipped container */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: selectedBackground.value }}
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
                  ref={previewImageRef}
                  src={activeImage}
                  alt="Preview"
                  className="max-w-full object-contain transition-all duration-300"
                  onLoad={computeImageRect}
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

            {/* Drawing overlay (when pop-out mode active) */}
            {isPopOutMode && activeImage && (
              <div
                className="absolute inset-0 z-10"
                style={{ cursor: dragMode === 'move' ? 'grabbing' : 'crosshair' }}
                onMouseDown={handlePopOutMouseDown}
                onMouseMove={handlePopOutMouseMove}
                onMouseUp={handlePopOutMouseUp}
                onMouseLeave={handlePopOutMouseUp}
              >
                {/* Drawing-in-progress rectangle */}
                {dragMode === 'draw' && drawStart && currentDraw && imageRect && (
                  <div
                    className="absolute border-2 border-dashed border-white/80 bg-white/10 pointer-events-none"
                    style={{
                      left: imageRect.left + Math.min(drawStart.fx, currentDraw.fx) * imageRect.width,
                      top: imageRect.top + Math.min(drawStart.fy, currentDraw.fy) * imageRect.height,
                      width: Math.abs(currentDraw.fx - drawStart.fx) * imageRect.width,
                      height: Math.abs(currentDraw.fy - drawStart.fy) * imageRect.height,
                    }}
                  />
                )}

                {/* Existing region outlines */}
                {imageRect && currentRegions.map(region => (
                  <div key={region.id}>
                    <div
                      className={`absolute border-2 ${region.id === selectedPopOutId ? 'border-indigo-400' : 'border-white/60'} pointer-events-none`}
                      style={{
                        left: imageRect.left + region.x * imageRect.width,
                        top: imageRect.top + region.y * imageRect.height,
                        width: region.width * imageRect.width,
                        height: region.height * imageRect.height,
                        borderRadius: region.borderRadius,
                      }}
                    />
                    {/* Resize handles for selected region */}
                    {region.id === selectedPopOutId && (() => {
                      const rx = imageRect.left + region.x * imageRect.width;
                      const ry = imageRect.top + region.y * imageRect.height;
                      const rw = region.width * imageRect.width;
                      const rh = region.height * imageRect.height;
                      const handles = [
                        { x: 0, y: 0, cursor: 'nw-resize' },
                        { x: rw, y: 0, cursor: 'ne-resize' },
                        { x: 0, y: rh, cursor: 'sw-resize' },
                        { x: rw, y: rh, cursor: 'se-resize' },
                        { x: rw / 2, y: 0, cursor: 'n-resize' },
                        { x: rw / 2, y: rh, cursor: 's-resize' },
                        { x: 0, y: rh / 2, cursor: 'w-resize' },
                        { x: rw, y: rh / 2, cursor: 'e-resize' },
                      ];
                      return handles.map((h, i) => (
                        <div
                          key={i}
                          className="absolute w-2.5 h-2.5 bg-white border border-indigo-400 rounded-sm pointer-events-none"
                          style={{
                            left: rx + h.x - 5,
                            top: ry + h.y - 5,
                          }}
                        />
                      ));
                    })()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pop-out elements (OUTSIDE the clipped inner container) */}
          {activeImage && imageRect && currentRegions.map(region => {
            const s = region.scale;
            const baseW = region.width * imageRect.width;
            const baseH = region.height * imageRect.height;
            const popWidth = baseW * s;
            const popHeight = baseH * s;
            // Center the scaled pop-out on the region center, then apply offset
            const cx = imageRect.left + (region.x + region.width / 2) * imageRect.width;
            const cy = imageRect.top + (region.y + region.height / 2) * imageRect.height;
            const popLeft = cx - popWidth / 2 + region.offsetX * imageRect.width;
            const popTop = cy - popHeight / 2 + region.offsetY * imageRect.height;
            return (
              <div
                key={region.id}
                className="absolute z-20 pointer-events-none"
                style={{
                  left: popLeft,
                  top: popTop,
                  width: popWidth,
                  height: popHeight,
                  borderRadius: region.borderRadius * s,
                  boxShadow: region.elevation > 0
                    ? `0 ${region.elevation / 2}px ${region.elevation}px rgba(0,0,0,0.5)`
                    : 'none',
                  backgroundImage: `url(${activeImage})`,
                  backgroundSize: `${imageRect.width * s}px ${imageRect.height * s}px`,
                  backgroundPosition: `-${region.x * imageRect.width * s}px -${region.y * imageRect.height * s}px`,
                  overflow: 'hidden',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
