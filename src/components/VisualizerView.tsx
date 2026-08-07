import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  Sparkles,
  Move,
  Upload,
  RotateCcw,
  RotateCw,
  HelpCircle,
  ChevronRight,
  Play,
  ZoomIn,
  ZoomOut,
  Ruler,
  Lock,
  Unlock,
  Undo2,
  Redo2,
  Crosshair,
  ShieldCheck} from 'lucide-react';
import { Painting, FramingOption, RoomType } from '../types';
import { PAINTINGS, FRAMING_OPTIONS, ROOMS } from '../data';
import { motion } from 'motion/react';
import {
  matchSizes,
  bestSizeFor,
  outerFrameCm,
  PRINT_SIZES,
  type SizeMatch,
  type OrientationChoice,
  ORIENTATION_LABELS,
} from '../lib/printSizes';
import {
  resizeFromHandle,
  resizeFromPinch,
  normalizeSize,
  fitFor,
  dpiFor,
  nearestStandard,
  ratioLabel,
  shapeOf,
  MIN_SIDE_CM,
  MAX_SIDE_CM,
  type FitMode,
  type ResizeHandle,
} from '../lib/sizeMath';
import { useLiveVariant } from '../hooks/useLiveVariant';
import { clearVariantCache } from '../lib/liveVariants';
import {
  formatMAD,
  formatAddOn,
  paintingPriceContinuousMAD,
} from '../lib/pricing';
import MiniPreview from './visualizer/MiniPreview';
import PanelGroup from './visualizer/PanelGroup';
import { useBreakpoint } from '../hooks/useBreakpoint';
import SizeField from './visualizer/SizeField';
import OptionTile from './visualizer/OptionTile';
import PersonalizationPreviewLayer from './personalization/PersonalizationPreviewLayer';
import { usePersonalizationEntry } from '../hooks/usePersonalizationEntry';
import type { Personalization } from '../lib/personalization';
import { useVisualizerHistory } from '../hooks/useVisualizerHistory';

interface VisualizerViewProps {
  selectedPainting: Painting | null;
  selectedFrame: FramingOption;
  setSelectedFrame: (frame: FramingOption) => void;
  onAddToCart: (painting: Painting, frame: FramingOption, personalization?: Personalization) => void;
}

/* ════════════════════════════════════════════════════════════
   ثوابت وأنواع
   ════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'prism.visualizer.v2';
const STAGE_ASPECT = 16 / 10; // يطابق aspect-[16/10] للمسرح
const SNAP_TOLERANCE = 1.2; // بالمئة
const EYE_LEVEL_Y = 40; // مستوى نظر تقريبي 145سم داخل مسرح 16/10
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
const ZOOM_STEPS = [1, 1.5, 2, 3, 4] as const;
const HISTORY_LIMIT = 30;

type Transform = {
  x: number; // %
  y: number; // %
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  flipH: boolean;
  flipV: boolean;
};

type CustomSize = { widthCm: number; heightCm: number } | null;

type Snapshot = {
  transform: Transform;
  sizeId: string | null;
  customSize: CustomSize;
};

type Gesture =
  | null
  | { kind: 'move'; startX: number; startY: number; originX: number; originY: number }
  | {
      kind: 'resize';
      handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';
      /** إحداثيات المؤشّر لحظة الضغط — مرجع الإزاحة النسبية. */
      startX: number;
      startY: number;
      /** موضع اللوحة بالمئة لحظة الضغط — أساس زحف المركز. */
      originX: number;
      originY: number;
      /** المقاس الفيزيائي لحظة الضغط، بالسنتيمتر. */
      startW: number;
      startH: number;
      /**
       * كم بكسلًا تخطيطيًا يساوي السنتيمتر الواحد على الجدار، مقيسًا
       * مرة واحدة لحظة الضغط. يُقاس مرة واحدة لا في كل إطار لأنّ اللوحة
       * نفسها تتغيّر أثناء السحب، فقياسه داخل الحلقة يولّد تغذية راجعة
       * تجعل السحب يتسارع أو يتجمّد.
       */
      pxPerCm: number;
      /** القياس المعروض لحظة الضغط — يُرسم منه الطيف قبل أول حركة. */
      startWidthPct: number;
      startHeightPct: number;
    }
  | { kind: 'rotate'; startAngle: number; startRotateZ: number; centerPx: { x: number; y: number } }
  | {
      kind: 'pinch';
      startDist: number;
      startAngle: number;
      startScale: number;
      startRotateZ: number;
      startCenter: { x: number; y: number };
      originX: number;
      originY: number;
    }
  | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number };

const DEFAULT_TRANSFORM: Transform = {
  x: 50,
  y: 32,
  scale: 1,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  flipH: false,
  flipV: false,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const WALL_PAINT_PRESETS = [
  { name: 'Gallery Original', hex: 'transparent' },
  { name: 'Warm Alabaster', hex: '#FAF5ED' },
  { name: 'Lichen Sage', hex: '#E2E6DF' },
  { name: 'Misty Blue', hex: '#DFE5EA' },
  { name: 'Soot Charcoal', hex: '#3E4144' },
  { name: 'Terracotta Soil', hex: '#C28975' },
];

/* ════════════════════════════════════════════════════════════
   مكوّن مساعد: زر مجموعة (segmented) احترافي
   ════════════════════════════════════════════════════════════ */

function SegButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title?: string;
  key?: string | number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={!!active}
      className={`px-2.5 py-1.5 text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer rounded-sm ${
        active
          ? 'bg-ui-accent text-ui-on-accent'
          : 'bg-forest-black text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════
   المكوّن الرئيسي
   ════════════════════════════════════════════════════════════ */


const ANGLE_PRESETS = [
  { id: 'flat',    label: 'Straight on', meta: '0°',   v: { rotateX: 0,   rotateY: 0,   rotateZ: 0 } },
  { id: 'l-soft',  label: 'Slight left', meta: '10°',  v: { rotateX: 1,   rotateY: 10,  rotateZ: 0 } },
  { id: 'l-wall',  label: 'From left',   meta: '24°',  v: { rotateX: 2,   rotateY: 24,  rotateZ: -1 } },
  { id: 'r-soft',  label: 'Slight right',meta: '10°',  v: { rotateX: 1,   rotateY: -10, rotateZ: 0 } },
  { id: 'r-wall',  label: 'From right',  meta: '24°',  v: { rotateX: 2,   rotateY: -24, rotateZ: 1 } },
  { id: 'below',   label: 'From below',  meta: '14°',  v: { rotateX: -14, rotateY: 0,   rotateZ: 0 } },
  { id: 'above',   label: 'From above',  meta: '14°',  v: { rotateX: 14,  rotateY: 0,   rotateZ: 0 } },
  { id: 'gallery', label: 'Gallery shot',meta: '3/4',  v: { rotateX: 8,   rotateY: -18, rotateZ: 2 } },
] as const;

const PERSPECTIVE_DEPTH = [
  { id: 'flat',   label: 'Flat',     px: 3000 },
  { id: 'normal', label: 'Natural',  px: 1200 },
  { id: 'deep',   label: 'Immersive',px: 650  },
] as const;

export default function VisualizerView({
  selectedPainting,
  selectedFrame,
  setSelectedFrame,
  onAddToCart,
}: VisualizerViewProps) {
  /* ══════ V36 — فرع الهاتف ══════
     يُستدعى هنا في أعلى المكوّن مع بقية الخُطّافات، فوق أي return مبكر.
     وضعه داخل شرط أو بعد return يكسر ترتيب الخُطّافات ويرمي
     "Rendered more hooks than during the previous render". */
  const { isMobile, isLandscapePhone } = useBreakpoint();
  const activePainting = selectedPainting || PAINTINGS[0];

  /* التخصيص يُقرأ من المخزن وفق اللوحة المعروضة فعلًا — لا عبر prop.
     يتتبّع تلقائيًا أي تبديل للوحة داخل المحاكي، ويتحدّث فورًا عند حفظ الاستوديو. */
  const personalization: Personalization | undefined = usePersonalizationEntry(activePainting.id);

  /* ── حالة المشهد ── */
  const [activeRoom, setActiveRoom] = useState<RoomType>(ROOMS[0]);
  const [customWallUrl, setCustomWallUrl] = useState<string | null>(null);
  const [wallColor, setWallColor] = useState<string>('transparent');
  const [wallColorName, setWallColorName] = useState<string>('Gallery Original');
  const [lighting, setLighting] = useState<'daylight' | 'evening' | 'spotlight'>('daylight');

  /* ── التحويل والمقاس ── */
  const [transform, setTransform] = useState<Transform>(DEFAULT_TRANSFORM);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [customSize, setCustomSize] = useState<CustomSize>(null);
  /* يبدأ مفتوحًا عمدًا: السحب اليدوي يجب أن يعطي المقاس المرسوم حرفيًا.
   القفل خيار واعٍ يفعّله من يريد الحفاظ على نسبة العمل، لا سلوك مفروض
   يجعل المستخدم يرسم مستطيلًا عريضًا فيحصل على مستطيل طويل. */
  const [lockAspect, setLockAspect] = useState(false);
  /** كيف يملأ العمل المقاس: قصّ، أو احتواء كامل، أو احتواء بخلفية ممتدّة. */
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  /** يومض حين يبلغ السحب حدًّا، فلا يظنّ المستخدم أن السحب تعطّل. */
  const [limitPulse, setLimitPulse] = useState(false);
  /**
   * المقاس قيد السحب، للعرض فقط.
   *
   * لماذا حالة منفصلة وليس customSize مباشرة؟ لأنّ customSize يغذّي
   * السعر والمطابقة والدقة وحمولة الطلب والتاريخ، فكتابته في كل إطار
   * تُعيد حساب 64 مقاسًا وتُعيد تخطيط الصورة ستين مرة في الثانية.
   * الطيف عنصر واحد بلا صورة وبلا ظلّ وبلا تأثير، فتحديثه رخيص.
   *
   * null يعني: لا سحب جارٍ، فلا يُرسم شيء.
   */
  const [draftSize, setDraftSize] = useState<{
    widthCm: number;
    heightCm: number;
    /** زحف المركز بالمئة من المشهد، ليثبت الطيف على الحافة المقابلة. */
    shiftXPct: number;
    shiftYPct: number;
    hitLimit: boolean;
  } | null>(null);
  /** اختيار اتجاه الطباعة. 'auto' يحاكي سلوك ما قبل هذه النسخة تمامًا. */
  const [orientationChoice, setOrientationChoice] =
    useState<OrientationChoice>('auto');
  /* ── المجموعة المفتوحة في لوحة الإعدادات ── */
  type PanelKey = 'wall' | 'size' | 'frame' | 'angle';
  const [openGroup, setOpenGroup] = useState<PanelKey | null>('size');
  const [depthId, setDepthId] = useState<(typeof PERSPECTIVE_DEPTH)[number]['id']>('normal');
  const depthPx = PERSPECTIVE_DEPTH.find((d) => d.id === depthId)!.px;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const toggleGroup = (k: PanelKey) => setOpenGroup((g) => (g === k ? null : k));

  /* ── التكبير ── */
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // بالمئة من المسرح

  /* ── التفاعل ── */
  const [gesture, setGesture] = useState<Gesture>(null);
  const [snapLines, setSnapLines] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const [showHandles, setShowHandles] = useState(true);

  /* ── العرض التوضيحي ── */
  /* ── قياسات الصورة الحقيقية ── */
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  /* V36 — النسبة مقفلة إجباريًا على الهاتف بغضّ النظر عن حالة المفتاح.
     نحسبها قيمة مشتقّة بدل تعديل الحالة، حتى لا يفقد المستخدم
     اختياره على الحاسوب عند تدوير الجهاز أو تغيير المقاس. */
  const effectiveLockAspect = isMobile ? true : lockAspect;

  /* V36 — ورقة المقاس على الهاتف: مغلقة افتراضيًا حتى تبقى
     الصفحة صفحة واحدة بلا تمرير. */
  const [sheetOpen, setSheetOpen] = useState(false);

  /* V36 — كتم التمرير المطّاطي أثناء وجود المحاكي على الهاتف فقط.
     نستعمل صنفًا على <html> لا على <body>: وضع overflow:hidden على
     body يكسر أوراق pz-sheet القائمة في ProductDetailModal
     وPersonalizationStudio. التنظيف إلزامي عند إلغاء التركيب. */
  useEffect(() => {
    if (!isMobile) return;
    const root = document.documentElement;
    root.classList.add('pz-vz-lock');
    return () => root.classList.remove('pz-vz-lock');
  }, [isMobile]);

  /* ── التاريخ ── */
  const { commit, undo, redo, canUndo, canRedo } = useVisualizerHistory(
    transform,
    sizeId,
    customSize,
    setTransform,
    setSizeId,
    setCustomSize
  );

  const containerRef = useRef<HTMLDivElement>(null);
  /** غلاف اللوحة على المسرح. يُقاس منه بكسل/سنتيمتر مباشرةً. */
  const artBoxRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const [containerPx, setContainerPx] = useState({ w: 0, h: 0 });

  /* ══ قياس الحاوية ══ */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContainerPx({ w: e.contentRect.width, h: e.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ══ تنظيف ذاكرة المقاسات المولّدة ══ */
  useEffect(() => () => clearVariantCache(), []);

  /* ══ إعادة القياس عند تغيّر اللوحة ══ */
  useEffect(() => {
    setNatural(null);
    setSizeId(null);
    setCustomSize(null);
    setDraftSize(null);
  }, [activePainting.id]);

  /* ══ مواضع افتراضية عند تغيّر الغرفة ══ */
  useEffect(() => {
    if (customWallUrl) return;
    setTransform((t) => ({
      ...t,
      x: activeRoom.paintingDefaultXPercent,
      y: activeRoom.paintingDefaultYPercent,
    }));
  }, [activeRoom, customWallUrl]);

  /* ══ استعادة الحفظ التلقائي (مرة واحدة) ══ */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        transform: Transform;
        sizeId: string | null;
        customSize: CustomSize;
        fitMode: FitMode;
        lighting: 'daylight' | 'evening' | 'spotlight';
        wallColor: string;
        wallColorName: string;
        roomId: string;
      }>;
      if (saved.transform) setTransform((t) => ({ ...t, ...saved.transform }));
      /* التحقّق من الحدود قبل الاستعادة: مخزَّن قديم أو تالف لا يُصدَّق. */
      if (
        saved.customSize &&
        Number.isFinite(saved.customSize.widthCm) &&
        Number.isFinite(saved.customSize.heightCm)
      ) {
        setCustomSize(normalizeSize(saved.customSize).size);
      }
      if (
        saved.fitMode === 'cover' ||
        saved.fitMode === 'contain' ||
        saved.fitMode === 'extend'
      ) {
        setFitMode(saved.fitMode);
      }
      if (saved.lighting) setLighting(saved.lighting);
      if (saved.wallColor) setWallColor(saved.wallColor);
      if (saved.wallColorName) setWallColorName(saved.wallColorName);
      const room = ROOMS.find((r) => r.id === saved.roomId);
      if (room) setActiveRoom(room);
    } catch {
      /* تجاهل أي تخزين تالف */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ══ حفظ تلقائي ══ */
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          transform,
          sizeId,
          customSize,
          fitMode,
          lighting,
          wallColor,
          wallColorName,
          roomId: activeRoom.id,
        }),
      );
    } catch {
      /* وضع تصفح خاص أو ذاكرة ممتلئة — لا تؤثر */
    }
  }, [transform, sizeId, customSize, fitMode, lighting, wallColor, wallColorName, activeRoom.id]);

  /* وميض بلوغ الحدّ يُطفأ بعد نصف ثانية. مؤقّت واحد ينظَّف دائمًا. */
  useEffect(() => {
    if (!limitPulse) return;
    const id = window.setTimeout(() => setLimitPulse(false), 520);
    return () => window.clearTimeout(id);
  }, [limitPulse]);

  /* ══ النسبة الحقيقية للعمل الفني ══ */
  const artAspect = useMemo(() => {
    if (natural && natural.w > 0) return natural.h / natural.w;
    if (activePainting.widthCm > 0) return activePainting.heightCm / activePainting.widthCm;
    return 1.4;
  }, [natural, activePainting.widthCm, activePainting.heightCm]);

  /* ══ المقاسات المرتّبة حسب المطابقة ══ */
  const sizeMatches = useMemo(
    () => matchSizes(artAspect, orientationChoice),
    [artAspect, orientationChoice],
  );



  const activeMatch = useMemo(
    () => sizeMatches.find((m) => m.size.id === sizeId) ?? null,
    [sizeMatches, sizeId],
  );

  /* ══ الأبعاد الفيزيائية الفعلية ══ */
  const physical = useMemo(() => {
    if (customSize) return customSize;
    if (activeMatch) return { widthCm: activeMatch.widthCm, heightCm: activeMatch.heightCm };
    return { widthCm: activePainting.widthCm, heightCm: activePainting.heightCm };
  }, [customSize, activeMatch, activePainting.widthCm, activePainting.heightCm]);

  /* ══ رياضيات القياس داخل المسرح ══ */
/* ══ رياضيات القياس داخل المسرح ══
 *
 * مصدر واحد للحقيقة. اللوحة الحقيقية والطيف المتقطّع يمرّان من هنا معًا،
 * فيستحيل عليهما أن يختلفا. كانا قبل V29 يُحسبان بصيغتين متوازيتين:
 * اللوحة بنسبة من المسرح، والطيف بنسبة من اللوحة — فظهر الطيف أصغر
 * بنحو سبع مرّات من نتيجته.
 *
 * الدالة نقيّة ولا تقرأ شيئًا من خارج وسائطها، فيمكن استدعاؤها داخل
 * useMemo أو أثناء الرسم دون أثر جانبي.
 */
  const roomWidthCm = (customWallUrl ? 4.0 : activeRoom.approxWidthM) * 100;
  const visualScale = customWallUrl ? 1.0 : activeRoom.defaultScale;

  const stageRectFor = useCallback(
    (widthCm: number, heightCm: number) => {
      const w = Math.max(1e-6, widthCm);
      const h = Math.max(1e-6, heightCm);
      const widthPct = (w / roomWidthCm) * 100 * visualScale;
      /* الارتفاع يُضرب في STAGE_ASPECT لأن نسبة المئة الرأسية تُقاس من ارتفاع
         المسرح، والمسرح ليس مربّعًا (16/10). بدون هذا المعامل تخرج كل لوحة
         مسحوقة رأسيًا. */
      const heightPct = widthPct * (h / w) * STAGE_ASPECT;
      return { widthPct, heightPct };
    },
    [roomWidthCm, visualScale],
  );

  const { widthPct, heightPct } = stageRectFor(physical.widthCm, physical.heightCm);

  /* ══ المقاس اللحظي للصورة ══ */
  const displayWidthPx = Math.max(
    1,
    Math.round((containerPx.w * widthPct) / 100) * zoom,
  );

  const artSrcSet =
    (activePainting as unknown as { image?: { srcSet?: string } }).image?.srcSet ?? null;

  const variant = useLiveVariant({
    src: activePainting.imageUrl,
    srcSet: artSrcSet,
    displayWidth: displayWidthPx,
    active: gesture === null, // لا توليد أثناء الحركة
  });

  /* ══ أدوات ══ */
  const centerOfPainting = useCallback(() => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };
    return {
      x: box.left + (box.width * transform.x) / 100,
      y: box.top + (box.height * transform.y) / 100,
    };
  }, [transform.x, transform.y]);

  const applySnap = useCallback((x: number, y: number) => {
    let nx = x;
    let ny = y;
    const v = Math.abs(x - 50) <= SNAP_TOLERANCE;
    const h = Math.abs(y - EYE_LEVEL_Y) <= SNAP_TOLERANCE;
    if (v) nx = 50;
    if (h) ny = EYE_LEVEL_Y;
    setSnapLines({ v, h });
    return { x: nx, y: ny };
  }, []);

  const resetAll = useCallback(() => {
    commit();
    setTransform({
      ...DEFAULT_TRANSFORM,
      x: customWallUrl ? 50 : activeRoom.paintingDefaultXPercent,
      y: customWallUrl ? 50 : activeRoom.paintingDefaultYPercent,
    });
    setWallColor('transparent');
    setWallColorName('Gallery Original');
    setLighting('daylight');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCustomSize(null);
    setSnapLines({ v: false, h: false });
  }, [commit, activeRoom, customWallUrl]);

  const handleWallUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomWallUrl((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setWallColor('transparent');
    setWallColorName('Original Upload');
  };

  useEffect(
    () => () => {
      if (customWallUrl && customWallUrl.startsWith('blob:')) {
        URL.revokeObjectURL(customWallUrl);
      }
    },
    [customWallUrl],
  );

  /* ══════════════════════════════════════════════════════
     Pointer Events — مسار واحد للماوس واللمس والقلم
     ══════════════════════════════════════════════════════ */

  const beginMove = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button > 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      setGesture({
        kind: 'pinch',
        startDist: Math.hypot(b.x - a.x, b.y - a.y),
        startAngle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
        startScale: transform.scale,
        startRotateZ: transform.rotateZ,
        startCenter: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        originX: transform.x,
        originY: transform.y,
      });
      return;
    }

    commit();
    setGesture({
      kind: 'move',
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
    });
  };

  /**
   * كم بكسلًا تخطيطيًا يساوي السنتيمتر الواحد من اللوحة على الشاشة؟
   *
   * الطريقة المباشرة والموثوقة: نقيس صندوق العمل الفني نفسه ونقسمه على
   * عرضه الفيزيائي. لا نعيد اشتقاقه من STAGE_ASPECT ولا من roomWidthCm، لأنّ
   * كل إعادة اشتقاق تدخل فيها ثوابت العرض هي مصدر الأخطاء السابقة.
   *
   * نستعمل offsetWidth لا getBoundingClientRect لأنّ الثانية تشمل أثر
   * التحويلات (rotate / scale / zoom) فتُعيد إدخال التكبير مرتين.
   * offsetWidth يعطي البكسل التخطيطي النقي، وهو المطلوب.
   */
  const measurePxPerCm = (): number => {
    const el = artBoxRef.current;
    const w = physical.widthCm;
    if (!el || !w || w <= 0) return 0;
    const px = el.offsetWidth;
    if (!px || px <= 0) return 0;
    return px / w;
  };

  const beginResize = (
    e: React.PointerEvent,
    handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w',
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

    const pxPerCm = measurePxPerCm();
    /* إن تعذّر القياس فلا نبدأ إيماءة أصلًا. بدؤها بـ pxPerCm = 0 يعني
       قسمة على صفر ومقاسًا Infinity. الصمت أفضل من الجنون. */
    if (pxPerCm <= 0) return;

    commit();

    /* أول ما يُفعّل المقبض: إن لم يكن ثمة مقاس مخصّص، نثبّت المقاس
       المعياري الحالي كمقاس مخصّص ابتدائي. بدون هذا يظلّ customSize
       فارغًا حتى أول حركة، فتختلف لحظة الإفلات بلا حركة عن المتوقع. */
    if (!customSize) {
      setCustomSize({
        widthCm: physical.widthCm,
        heightCm: physical.heightCm,
      });
    }

    /* الطيف يبدأ مطابقًا تمامًا للوضع القائم، فلا تظهر قفزة عند الظهور. */
    setDraftSize({
      widthCm: physical.widthCm,
      heightCm: physical.heightCm,
      shiftXPct: 0,
      shiftYPct: 0,
      hitLimit: false,
    });

    setGesture({
      kind: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      originX: transform.x,
      originY: transform.y,
      startW: physical.widthCm,
      startH: physical.heightCm,
      pxPerCm,
      startWidthPct: widthPct,
      startHeightPct: heightPct,
    });
  };

  const beginRotate = (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    commit();
    const c = centerOfPainting();
    setGesture({
      kind: 'rotate',
      startAngle: (Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180) / Math.PI,
      startRotateZ: transform.rotateZ,
      centerPx: c,
    });
  };

  const beginPan = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setGesture({
      kind: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!gesture) return;
    if (pointers.current.has(e.pointerId)) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const box = containerRef.current?.getBoundingClientRect();
    if (!box) return;

    if (gesture.kind === 'move') {
      const dx = ((e.clientX - gesture.startX) / box.width) * 100 / zoom;
      const dy = ((e.clientY - gesture.startY) / box.height) * 100 / zoom;
      const snapped = applySnap(
        clamp(gesture.originX + dx, 4, 96),
        clamp(gesture.originY + dy, 4, 96),
      );
      setTransform((t) => ({ ...t, x: snapped.x, y: snapped.y }));
      return;
    }

    if (gesture.kind === 'resize') {
      /* 1 — ما قطعه المؤشّر منذ الضغط، بإحداثيات الشاشة.
         إزاحة نسبية منذ لحظة الضغط — لا مسافة من المركز — لأنّ المسافة
         من المركز تجعل اللوحة تقفز لحظة المسك إن لم يمسك المؤشّر
         مركز المقبض بالضبط. */
      const rawDx = e.clientX - gesture.startX;
      const rawDy = e.clientY - gesture.startY;

      /* 2 — إلغاء دوران اللوحة.
         المقبض مرسوم داخل عنصر مُدار بـ rotateZ، بينما تصل إزاحة المؤشّر
         بإحداثيات الشاشة غير المُدارة. بلا هذا التصحيح يهرب المقبض جانبًا
         على أي لوحة مائلة. يعالج rotateZ فقط؛ أما rotateX/rotateY فميلٌ
         منظوري للعرض ولا يغيّر المقاس المطبوع، ولذلك يُتجاهل عمدًا. */
      const rad = (-transform.rotateZ * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      let localDx = rawDx * cos - rawDy * sin;
      let localDy = rawDx * sin + rawDy * cos;

      /* 3 — القلب الأفقي/الرأسي يعكس اتجاه المقبض على الشاشة. */
      if (transform.flipH) localDx = -localDx;
      if (transform.flipV) localDy = -localDy;

      /* 4 — إلى السنتيمتر. قسمة zoom لأن إزاحة المؤشّر بالبكسل المعروض
         بينما pxPerCm مقيس بالبكسل التخطيطي. */
      const dxCm = localDx / zoom / gesture.pxPerCm;
      const dyCm = localDy / zoom / gesture.pxPerCm;

      /* 5 — الحساب النقي: الحافة المقابلة ثابتة، والأركان تحرّك البعدين.
         لا شيء من هذا يمسّ الـ DOM — حساب أرقام فقط. */
      const r = resizeFromHandle({
        handle: gesture.handle,
        startW: gesture.startW,
        startH: gesture.startH,
        dxCm,
        dyCm,
        lockRatio: effectiveLockAspect,
      });

      /* 6 — تحويل زحف المركز إلى نسبة مئوية من المشهد.

         تحذير دقيق: الموضع x منسوب إلى عرض المشهد، والموضع y منسوب إلى
         ارتفاعه. والمشهد ليس مربّعًا (STAGE_ASPECT = 16/10)، فالسنتيمتر
         الواحد يساوي نسبة مئوية أفقية تختلف عن الرأسية. استعمال معامل
         واحد للمحورين ينحرف بالمرساة نحو 60% في المحور الرأسي. */
      const pctPerCmX = (gesture.pxPerCm / box.width) * 100;
      const pctPerCmY = (gesture.pxPerCm / box.height) * 100;

      /* 7 — الكتابة الوحيدة: الطيف.
         لا setCustomSize ولا setTransform هنا. اللوحة والسعر والقائمة
         تبقى ساكنة تمامًا حتى يُرفع الإصبع. هذا هو موضع توفير
         المعالجة الذي طلبه المالك. */
      setDraftSize({
        widthCm: r.size.widthCm,
        heightCm: r.size.heightCm,
        shiftXPct: r.centerShiftXCm * pctPerCmX,
        shiftYPct: r.centerShiftYCm * pctPerCmY,
        hitLimit: r.hitLimit,
      });
      return;
    }

    if (gesture.kind === 'rotate') {
      const angle =
        (Math.atan2(e.clientY - gesture.centerPx.y, e.clientX - gesture.centerPx.x) * 180) /
        Math.PI;
      const delta = angle - gesture.startAngle;
      const raw = gesture.startRotateZ + delta;
      // التقاط عند 0 درجة
      const next = Math.abs(raw) < 2 ? 0 : clamp(raw, -45, 45);
      setTransform((t) => ({ ...t, rotateZ: Math.round(next) }));
      return;
    }

    if (gesture.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      const pinchFactor = dist / Math.max(1, gesture.startDist);

      /* القرص يغيّر المقاس المطبوع فعلًا،
         فيصل أثر الإصبعين إلى السعر والطلب لا إلى المعاينة وحدها. */
      const base = customSize ?? { widthCm: physical.widthCm, heightCm: physical.heightCm };
      const pr = resizeFromPinch(base, pinchFactor);
      setCustomSize(pr.size);
      setSizeId(null);
      if (pr.hitLimit) setLimitPulse(true);
      const nextRotate = clamp(
        gesture.startRotateZ + (angle - gesture.startAngle),
        -45,
        45,
      );
      const dx = ((center.x - gesture.startCenter.x) / box.width) * 100 / zoom;
      const dy = ((center.y - gesture.startCenter.y) / box.height) * 100 / zoom;

      setTransform((t) => ({
        ...t,
        rotateZ: Math.round(nextRotate),
        x: clamp(gesture.originX + dx, 4, 96),
        y: clamp(gesture.originY + dy, 4, 96),
      }));
      return;
    }

    if (gesture.kind === 'pan') {
      const dx = ((e.clientX - gesture.startX) / box.width) * 100;
      const dy = ((e.clientY - gesture.startY) / box.height) * 100;
      const limit = (zoom - 1) * 50;
      setPan({
        x: clamp(gesture.originX + dx, -limit, limit),
        y: clamp(gesture.originY + dy, -limit, limit),
      });
    }
  };

  const endGesture = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);

    /* إيداع الطيف: هنا — وهنا فقط — تأخذ اللوحة مقاسها الجديد.
       كتابة واحدة في الحالة للسحبة بأكملها، بدل ستين كتابة في الثانية.

       ملاحظة ترتيب: نقرأ gesture قبل مسحه. ونستعمل الشكل الدالّي
       في setTransform لأن قيمة transform الملتقطة في هذا التصيير قد تكون
       قديمة إن أُطلق حدث آخر في الإطار نفسه. */
    if (gesture?.kind === 'resize' && draftSize) {
      const originX = gesture.originX;
      const originY = gesture.originY;
      const pctPerCmX = (100 * visualScale) / roomWidthCm;
      const pctPerCmY = pctPerCmX * STAGE_ASPECT;

      setCustomSize({ widthCm: draftSize.widthCm, heightCm: draftSize.heightCm });
      setSizeId(null);
      setTransform((t) => ({
        ...t,
        x: clamp(originX + draftSize.shiftXPct * pctPerCmX, 2, 98),
        y: clamp(originY + draftSize.shiftYPct * pctPerCmY, 2, 98),
      }));
      if (draftSize.hitLimit) setLimitPulse(true);
    }

    if (pointers.current.size === 0) {
      setGesture(null);
      setSnapLines({ v: false, h: false });
      setDraftSize(null);
    }
  };

  /* ══ عجلة الماوس: Ctrl/⌘ = تكبير المشهد · مجردة = تحجيم اللوحة ══ */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      if (!ev.ctrlKey && !ev.metaKey && !ev.shiftKey) return;
      ev.preventDefault();
      const dir = ev.deltaY > 0 ? -1 : 1;
      if (ev.shiftKey) {
        setTransform((t) => ({
          ...t,
          scale: clamp(+(t.scale + dir * 0.05).toFixed(2), MIN_SCALE, MAX_SCALE),
        }));
      } else {
        setZoom((z) => clamp(+(z + dir * 0.25).toFixed(2), 1, 4));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  /* ══ اختصارات اللوحة ══ */
  const onKeyDown = (e: React.KeyboardEvent) => {
    /* إفلات آمن: Escape يُلغي السحبة ويترك اللوحة على ما كانت.
       متاح فقط لأن التغيير مؤجّل: لم يُكتب شيء بعد. */
    if (e.key === 'Escape' && gesture?.kind === 'resize') {
      e.preventDefault();
      setDraftSize(null);
      setGesture(null);
      return;
    }

    const step = e.shiftKey ? 3 : 0.6;
    const set = (patch: Partial<Transform>) => setTransform((t) => ({ ...t, ...patch }));

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        set({ x: clamp(transform.x - step, 4, 96) });
        break;
      case 'ArrowRight':
        e.preventDefault();
        set({ x: clamp(transform.x + step, 4, 96) });
        break;
      case 'ArrowUp':
        e.preventDefault();
        set({ y: clamp(transform.y - step, 4, 96) });
        break;
      case 'ArrowDown':
        e.preventDefault();
        set({ y: clamp(transform.y + step, 4, 96) });
        break;
      case '+':
      case '=':
        set({ scale: clamp(+(transform.scale + 0.05).toFixed(2), MIN_SCALE, MAX_SCALE) });
        break;
      case '-':
      case '_':
        set({ scale: clamp(+(transform.scale - 0.05).toFixed(2), MIN_SCALE, MAX_SCALE) });
        break;
      case '[':
        set({ rotateZ: clamp(transform.rotateZ - 1, -45, 45) });
        break;
      case ']':
        set({ rotateZ: clamp(transform.rotateZ + 1, -45, 45) });
        break;
      case '0':
        resetAll();
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        }
        break;
      default:
        break;
    }
  };

  /* ══ الإضافة للسلة بالمقاس المختار ══ */
  const priceWithSize = useMemo(
    () =>
      paintingPriceContinuousMAD(
        { widthCm: physical.widthCm, heightCm: physical.heightCm },
        'resin',
      ),
    [physical],
  );

  const handleAcquire = () => {
    onAddToCart(
      {
        ...activePainting,
        widthCm: physical.widthCm,
        heightCm: physical.heightCm,
        price: priceWithSize,
        /* حقل اختياري إضافي — لا يمسّ مخطّط الطلب ولا رقم نسخته.
           الكود المنشور حاليًا يتجاهله بلا ضرر، والنسخة القادمة تقرأه. */
        printSpec: {
          widthCm: physical.widthCm,
          heightCm: physical.heightCm,
          sizeId: customSize ? null : sizeId,
          sizeLabel: customSize
            ? nearStd
              ? `Custom (near ${nearStd.entry.label})`
              : 'Custom'
            : (activeMatch?.size.label ?? 'Studio original'),
          isCustom: !!customSize,
          shape: sizeShape,
          ratio: sizeRatio,
          orientation:
            physical.heightCm > physical.widthCm * 1.03
              ? 'portrait'
              : physical.widthCm > physical.heightCm * 1.03
                ? 'landscape'
                : 'square',
          fitMode,
          fitNote: fit.note,
          cropLossPct: Math.round(fit.cropLossPct),
          printDpi: printDpiNow,
        },
      },
      selectedFrame,
      personalization,
    );
  };

  const outer = outerFrameCm(physical.widthCm, physical.heightCm);

  /* كيف يجلس العمل داخل المقاس المختار. */
  const fit = useMemo(
    () => fitFor(artAspect, physical.widthCm, physical.heightCm, fitMode),
    [artAspect, physical.widthCm, physical.heightCm, fitMode],
  );

  /* الدقّة الفعلية عند هذا المقاس. صفر يعني أن عرض الملف بالبكسل غير معروف
     (يحدث في النسخ المولّدة، انظر onLoad) والواجهة تخفيها حينئذ. */
  const printDpiNow = useMemo(
    () => dpiFor(natural?.w ?? 0, physical.widthCm),
    [natural, physical.widthCm],
  );

  /* أقرب مقاس معياري لمقاس حرّ — كي لا يترك المستخدم أمام رقمين مجرّدين. */
  const nearStd = useMemo(
    () =>
      customSize
        ? nearestStandard(PRINT_SIZES, physical.widthCm, physical.heightCm)
        : null,
    [customSize, physical.widthCm, physical.heightCm],
  );

  /* وصف واحد يُعاد استعماله في اللوحة وفي الطلب. */
  const sizeShape = shapeOf(physical.widthCm, physical.heightCm);
  const sizeRatio = ratioLabel(physical.widthCm, physical.heightCm);

  /* ══════════════════════════════════════════════════════════
     الواجهة
     ══════════════════════════════════════════════════════════ */

  /* معالِم المعاينات المصغّرة: كل خيار يرسم بـ MiniPreview
     مع تبديل قيمة واحدة فقط، فيرى المستخدم أثر الخيار قبل النقر. */
  const previewBase = {
    roomUrl: customWallUrl || activeRoom.imageUrl,
    roomLabel: customWallUrl ? 'Your wall' : activeRoom.name,
    artUrl: activePainting.imageUrl,
    artAspect,
  } as const;

  const wallSummary = customWallUrl
    ? 'Your uploaded wall'
    : `${activeRoom.name} · ${wallColorName} · ${lighting}`;

  const sizeSummary = customSize
    ? `Custom · ${Math.round(physical.widthCm)}×${Math.round(physical.heightCm)} cm · ${sizeRatio}`
    : activeMatch
      ? `${activeMatch.size.label} · ${Math.round(physical.widthCm)}×${Math.round(physical.heightCm)} cm`
      : `Original · ${Math.round(physical.widthCm)}×${Math.round(physical.heightCm)} cm`;

  const angleSummary =
    transform.rotateX === 0 && transform.rotateY === 0 && transform.rotateZ === 0
      ? `Flat on wall · ${Math.round(transform.scale * 100)}%`
      : `${transform.rotateY}° / ${transform.rotateX}° / ${transform.rotateZ}° · ${Math.round(transform.scale * 100)}%`;

  /**
   * هندسة الطيف المتقطّع.
   *
   * تُحسب من stageRectFor نفسها التي تحسب اللوحة، فالطيف والنتيجة
   * متطابقان بحكم البناء لا بحكم الصدفة.
   *
   * الموضع: مركز اللوحة لحظة الضغط (originX/originY بالمئة من المسرح)
   * مضافًا إليه زحف المركز الناتج عن السحب. resizeFromHandle تعيد
   * centerShiftXCm/centerShiftYCm بالسنتيمتر، ونحوّلها إلى نسبة مسرحية
   * بمعاملين منفصلين: المعامل الأفقي والرأسي مختلفان لأن المسرح 16/10،
   * واستعمال معامل واحد يُزيح المرساة نحو 60% رأسيًا.
   */
  const draftGeometry = useMemo(() => {
    if (!draftSize || gesture?.kind !== 'resize') return null;

    const rect = stageRectFor(draftSize.widthCm, draftSize.heightCm);

    /* نسبة المئة المسرحية لكل سنتيمتر، أفقيًا ورأسيًا. */
    const pctPerCmX = (100 * visualScale) / roomWidthCm;
    const pctPerCmY = pctPerCmX * STAGE_ASPECT;

    const xPct = clamp(gesture.originX + draftSize.shiftXPct * pctPerCmX, 2, 98);
    const yPct = clamp(gesture.originY + draftSize.shiftYPct * pctPerCmY, 2, 98);

    return {
      widthPct: rect.widthPct,
      heightPct: rect.heightPct,
      xPct,
      yPct,
      hitLimit: draftSize.hitLimit,
      label: `${draftSize.widthCm.toFixed(1)} × ${draftSize.heightCm.toFixed(1)} cm`,
    };
  }, [draftSize, gesture, stageRectFor, visualScale, roomWidthCm]);

  /**
   * مقبض تحجيم احترافي: مربّع أبيض صغير بحلقة داكنة — لغة الأدوات
   * المهنية (Figma، Photoshop، Illustrator) لا المربّع الذهبي المصمت.
   *
   * 8 بكسل بدل 14: المقبض أداة دقّة لا زرّ دعاية. وعلى لوحة بعرض 90px
   * في المشهد، المقبض ذو 14px كان يأكل 15% من العرض ويحجب العمل الفني.
   *
   * الأبيض مع حلقة سوداء مقروء فوق أي لوحة: فاتحة أو داكنة أو ملوّنة.
   * الذهبي السابق كان يذوب داخل أي لوحة دافئة الألوان.
   *
   * transition-transform وحدها وليس transition-all: تحريك الألوان والأبعاد
   * يُلزِم المتصفّح بإعادة الطلاء أثناء السحب، وهو ما نتجنّبه أصلًا.
   */
  /* V36 — على الهاتف يكبر المربّع المرئي قليلًا (8px → 12px) وتتضاعف
     منطقة اللمس غير المرئية (‎-inset-2.5 → ‎-inset-5) لتتجاوز 44px.
     المرئي يبقى صغيرًا حتى لا يحجب العمل الفني. */
  const handleStyle =
    `absolute ${isMobile ? 'w-3 h-3' : 'w-2 h-2'} bg-white ring-1 ring-forest-black/85 rounded-[2px] ` +
    'shadow-[0_1px_2px_rgba(0,0,0,0.45)] pointer-events-auto ' +
    'transition-transform duration-150 hover:scale-150 focus-visible:scale-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-gold' +
    ` before:content-[''] before:absolute ${isMobile ? 'before:-inset-5' : 'before:-inset-2.5'} before:rounded-[6px]`;

  return (
    <div
      className={
        isMobile
          ? 'pz-vz-shell'
          : 'min-h-screen pt-28 pb-20 px-6 lg:px-12'
      }
    >
      <div className={isMobile ? 'pz-vz-inner' : 'max-w-[1600px] mx-auto'}>
        {/* ──── الرأس — حاسوب فقط (V36) ──── */}
        {!isMobile && (
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-forest-gold text-[11px] uppercase tracking-[0.4em] mb-3">
              Simulateur d&apos;espaces
            </p>
            <h1 className="text-forest-black text-4xl lg:text-5xl font-light tracking-tight">
              View in Room
            </h1>
            <p className="text-forest-sage text-sm mt-3 max-w-xl">
              Drag, pinch, resize and rotate the artwork directly on the wall — or fine-tune
              every parameter from the studio panel.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex border border-forest-sage/40 divide-x divide-forest-sage/30">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="px-3 py-2.5 text-forest-black disabled:opacity-30 hover:text-forest-gold transition-colors cursor-pointer"
              >
                <Undo2 size={14} />
              </button>
              <button
                type="button"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                className="px-3 py-2.5 text-forest-black disabled:opacity-30 hover:text-forest-gold transition-colors cursor-pointer"
              >
                <Redo2 size={14} />
              </button>
              <button
                type="button"
                onClick={resetAll}
                title="Reset everything (0)"
                className="px-3 py-2.5 text-forest-black hover:text-forest-gold transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ──── الشرح السريع — حاسوب فقط (V36) ──── */}
        {!isMobile && (
        <div className="mb-8 border border-forest-sage/25 bg-forest-black/[0.03] p-6">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={15} className="text-forest-gold" />
            <h3 className="text-forest-black text-xs uppercase tracking-[0.25em]">
              Quick Guide: How to Test on Your Own Wall
            </h3>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                n: '01',
                t: 'Place it',
                d: 'Drag with a finger, mouse or pen. Guides snap to wall centre and eye level.',
              },
              {
                n: '02',
                t: 'Size it',
                d: 'Pull any corner handle, pinch with two fingers, or pick a certified print size.',
              },
              {
                n: '03',
                t: 'Inspect it',
                d: 'Zoom up to 400% to inspect texture, framing and print sharpness.',
              },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3"
              >
                <span className="text-forest-gold text-xs font-bold">{s.n}</span>
                <div>
                  <p className="text-forest-black text-sm mb-1">{s.t}</p>
                  <p className="text-forest-sage text-xs leading-relaxed">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        )}

        <div className={isMobile ? 'pz-vz-body' : 'grid lg:grid-cols-3 gap-8'}>
          {/* ══════ المسرح ══════ */}
          {/* V37 — حاوية المسرح تقبل ابنًا واحدًا فقط.
              .pz-vz-stage-wrap هي display:flex باتجاه row؛ أي ابن ثانٍ
              يقف بجانب المسرح لا فوقه ويسرق من عرضه. */}
          <div className={isMobile ? 'pz-vz-stage-wrap' : 'lg:col-span-2'}>
            <div
              ref={containerRef}
              tabIndex={0}
              onKeyDown={onKeyDown}
              onPointerDown={beginPan}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
              className={
                isMobile
                  ? 'pz-vz-stage relative w-full overflow-hidden bg-[#1a1b23] outline-none select-none'
                  : 'relative w-full aspect-[16/10] overflow-hidden bg-[#1a1b23] border border-forest-sage/25 outline-none select-none'
              }
              style={{ touchAction: 'none', cursor: zoom > 1 ? 'grab' : 'default' }}
            >
              {/* طبقة التكبير: تلفّ كل المشهد */}
              <div
                ref={stageRef}
                className="absolute inset-0"
                style={{
                  transform: `translate(${pan.x}%, ${pan.y}%) scale(${zoom})`,
                  transformOrigin: `${transform.x}% ${transform.y}%`,
                  transition: gesture ? 'none' : 'transform 220ms ease-out',
                }}
              >
                {/* 1 — الغرفة */}
                <img
                  src={customWallUrl || activeRoom.imageUrl}
                  alt={customWallUrl ? 'Your wall' : activeRoom.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                  referrerPolicy="no-referrer"
                />

                {/* 2 — طلاء الجدار */}
                {wallColor !== 'transparent' && (
                  <div
                    className="absolute inset-0 mix-blend-multiply opacity-80 pointer-events-none"
                    style={{ backgroundColor: wallColor }}
                  />
                )}

                {/* 3 — تعتيم الأطراف */}
                <div className="absolute inset-0 vignette-overlay pointer-events-none" />

                {/* 4 — الإضاءة */}
                {lighting === 'evening' && (
                  <div className="absolute inset-0 bg-amber-500/15 mix-blend-color-burn pointer-events-none" />
                )}
                {lighting === 'spotlight' && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 50% 35%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.60) 75%)',
                    }}
                  />
                )}

                {/* 5 — خطوط الالتقاط */}
                {snapLines.v && (
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-forest-gold/70 pointer-events-none" />
                )}
                {snapLines.h && (
                  <div
                    className="absolute left-0 right-0 h-px bg-forest-gold/70 pointer-events-none"
                    style={{ top: `${EYE_LEVEL_Y}%` }}
                  />
                )}

                {/* 6 — اللوحة */}
                <div
                  onPointerDown={beginMove}
                  onPointerMove={onPointerMove}
                  onPointerUp={endGesture}
                  onPointerCancel={endGesture}
                  onDoubleClick={resetAll}
                  className="absolute"
                  style={{
                    left: `${transform.x}%`,
                    top: `${transform.y}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    opacity: gesture?.kind === 'resize' ? 0.45 : 1,
                    transform: `translate(-50%, -50%) perspective(${depthPx}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) rotateZ(${transform.rotateZ}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
                    transformStyle: 'preserve-3d',
                    cursor: gesture?.kind === 'move' ? 'grabbing' : 'grab',
                    touchAction: 'none',
                    transition: gesture ? 'none' : 'width 180ms ease-out, height 180ms ease-out',
                    border:
                      selectedFrame.id !== 'fr-00'
                        ? `${Math.max(4, selectedFrame.materialWidthCm * 2)}px solid ${selectedFrame.borderHex}`
                        : 'none',
                    boxShadow:
                      lighting === 'spotlight'
                        ? '0 30px 60px rgba(0,0,0,0.55)'
                        : '0 18px 40px rgba(0,0,0,0.35)',
                  }}
                >
                  <motion.div
                    ref={artBoxRef}
                    className="w-full h-full relative"
                    style={{ containerType: 'inline-size' }}
                  >
                    {/* خلفية ممتدّة لوضع "العمل كاملًا مع تمديد".
                        نسخة مكبّرة ومموّهة من العمل نفسه تملأ الفراغ بدل
                        هامش أبيض، فيبقى كل محتوى الصورة ظاهرًا ولا يُقصّ
                        منها شيء. ترسم قبل الصورة الأصلية وتحتها. */}
                    {fitMode === 'extend' && (
                      <img
                        src={variant.url}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-80 select-none pointer-events-none"
                        draggable={false}
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <img
                      src={variant.url}
                      alt={activePainting.title}
                      className={`relative z-10 w-full h-full ${fit.objectFit === 'cover' ? 'object-cover' : 'object-contain'} select-none animate-fade-in`}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        const el = e.currentTarget;
                        // لا نسجّل أبعاد النسخة المولّدة — فقط المصدر الحقيقي
                        if (!variant.synthetic && el.naturalWidth > 0) {
                          setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                        }
                      }}
                    />

                    {personalization && <PersonalizationPreviewLayer personalization={personalization} />}
                  </motion.div>

                  {/* مقابض التحجيم */}
                  {showHandles && (
                    <>
                      {(
                          [
                            ['nw', '-top-1 -left-1 cursor-nwse-resize'],
                            ['ne', '-top-1 -right-1 cursor-nesw-resize'],
                            ['se', '-bottom-1 -right-1 cursor-nwse-resize'],
                            ['sw', '-bottom-1 -left-1 cursor-nesw-resize'],
                            ['n', '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                            ['s', '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize'],
                            ['w', 'top-1/2 -left-1 -translate-y-1/2 cursor-ew-resize'],
                            ['e', 'top-1/2 -right-1 -translate-y-1/2 cursor-ew-resize'],
                          ] as const
                        ).map(([h, pos]) => (
                        <div
                          key={h}
                          role="slider"
                          aria-label={
                            h === 'e' || h === 'w'
                              ? 'Resize width'
                              : h === 'n' || h === 's'
                                ? 'Resize height'
                                : 'Resize width and height'
                          }
                          aria-valuenow={Math.round(
                            h === 'n' || h === 's' ? physical.heightCm : physical.widthCm,
                          )}
                          aria-valuemin={MIN_SIDE_CM}
                          aria-valuemax={MAX_SIDE_CM}
                          aria-valuetext={`${Math.round(physical.widthCm)} by ${Math.round(physical.heightCm)} centimetres`}
                          tabIndex={0}
                          onKeyDown={(ev) => {
                            const stepCm = ev.shiftKey ? 5 : 0.5;
                            const dw =
                              ev.key === 'ArrowRight'
                                ? stepCm
                                : ev.key === 'ArrowLeft'
                                  ? -stepCm
                                  : 0;
                            const dh =
                              ev.key === 'ArrowDown'
                                ? stepCm
                                : ev.key === 'ArrowUp'
                                  ? -stepCm
                                  : 0;
                            if (dw === 0 && dh === 0) return;
                            ev.preventDefault();
                            ev.stopPropagation();
                            commit();
                            const base = { ...physical };
                            const next = normalizeSize({
                              widthCm: base.widthCm + dw,
                              heightCm: effectiveLockAspect
                                ? (base.widthCm + dw) * (base.heightCm / base.widthCm)
                                : base.heightCm + dh,
                            });
                            setCustomSize(next.size);
                            if (next.hitLimit) setLimitPulse(true);
                          }}
                          onPointerDown={(ev) => beginResize(ev, h)}
                          onPointerMove={onPointerMove}
                          onPointerUp={endGesture}
                          onPointerCancel={endGesture}
                          className={`${handleStyle} ${pos}`}
                          style={{ touchAction: 'none' }}
                        />
                      ))}

                      {/* مقبض التدوير */}
                      <div
                        onPointerDown={beginRotate}
                        onPointerMove={onPointerMove}
                        onPointerUp={endGesture}
                        onPointerCancel={endGesture}
                        title="Rotate"
                        className="absolute left-1/2 -translate-x-1/2 -top-9 w-6 h-6 rounded-full bg-forest-gold text-forest-black flex items-center justify-center shadow-md cursor-alias"
                        style={{ touchAction: 'none' }}
                      >
                        <RotateCw size={12} />
                      </div>
                    </>
                  )}
                </div>

                {/* 7 — طيف التحجيم.
                    شقيق اللوحة لا طفلها: نسبه نسب مسرحية، فلو رُسم داخل اللوحة
                    لقُرئت 22% على أنها 22% من اللوحة نفسها فيظهر أصغر بسبع مرّات.
                    ولا يرث perspective ولا rotateX/rotateY ولا الانقلاب: هو مسطرة
                    تقيس المقاس القادم، لا نسخة ثانية من اللوحة.
                    ولا transition عليه عمدًا — يجب أن يلاحق الإصبع في نفس الإطار. */}
                {draftGeometry && (
                  <div
                    aria-hidden
                    className="absolute pointer-events-none z-30"
                    style={{
                      left: `${draftGeometry.xPct}%`,
                      top: `${draftGeometry.yPct}%`,
                      width: `${draftGeometry.widthPct}%`,
                      height: `${draftGeometry.heightPct}%`,
                      transform: `translate(-50%, -50%) rotateZ(${transform.rotateZ}deg)`,
                      border: `1.5px dashed ${
                        draftGeometry.hitLimit ? 'rgba(220, 80, 80, 0.95)' : 'rgba(255, 255, 255, 0.95)'
                      }`,
                      boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.45)',
                      borderRadius: '2px',
                    }}
                  >
                    <span
                      className="absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium tabular-nums"
                      style={{
                        background: 'rgba(15, 15, 15, 0.88)',
                        color: draftGeometry.hitLimit ? '#ffb4b4' : '#ffffff',
                      }}
                    >
                      {draftGeometry.label}
                    </span>
                  </div>
                )}
              </div>




              {/* شارة دقة المعاينة — صريحة ولا تكذب */}
              {zoom > 1 && (
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md border border-[#7952F3]/30 px-3.5 py-2 max-w-[240px] shadow-lg rounded-2xl">
                  <p className="text-[#7952F3] text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    Inspection zoom
                  </p>
                  <p className="text-[#4A32B8] text-[10px] leading-relaxed font-medium">
                    Screen preview only. Your print is made from the archival master file.
                  </p>
                </div>
              )}

              {/* شارة الغرفة */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-forest-cream/70 text-[10px] uppercase tracking-[0.3em] pointer-events-none">
                {customWallUrl ? 'Your Wall' : activeRoom.name}
              </div>

              {/* V36 — زرّ الجدار المصغّر: حبّة عائمة، هاتف فقط.
                  يعيد استعمال handleWallUpload نفسها المستعملة في
                  بطاقة اللوحة الجانبية — لا منطق مكرّر. */}
              {isMobile && (
                <label className="pz-vz-wallpill" aria-label="Change wall">
                  <Upload size={13} aria-hidden="true" />
                  <span>{customWallUrl ? 'Your wall' : 'Wall'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleWallUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* V36 — تدوير الغرف الجاهزة بضغطة واحدة، بجانب حبّة الرفع. */}
              {isMobile && (
                <button
                  type="button"
                  className="pz-vz-roompill"
                  aria-label="Next room"
                  onClick={() => {
                    setCustomWallUrl(null);
                    const i = ROOMS.findIndex((r) => r.id === activeRoom.id);
                    setActiveRoom(ROOMS[(i + 1) % ROOMS.length]);
                  }}
                >
                  {activeRoom.name}
                </button>
              )}
            </div>
          </div>

          {/* ══════ لوحة الإعدادات — أربع مجموعات مطوية ══════ */}
          <aside
            className={
              isMobile
                ? 'pz-vz-dock'
                : 'space-y-2 lg:sticky lg:top-28 self-start'
            }
          >
            {(!isMobile || sheetOpen) && (
              <>
                {/* ══ 1. الجدار: غرفة + رفع صورتك + طلاء + إضاءة ══ */}
                <PanelGroup
                  index={1}
                  title="Your Wall"
                  summary={wallSummary}
                  open={openGroup === 'wall'}
                  onToggle={() => toggleGroup('wall')}
                  thumb={
                    <MiniPreview
                      {...previewBase}
                      wallColor={wallColor}
                      lighting={lighting}
                      frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                      className="w-full h-full"
                    />
                  }
                >
                  {/* الغرف + رفع جدارك — في نفس الشبكة، لأنهما نفس القرار */}
                  <p className="text-ui-muted text-[10px] uppercase tracking-[0.18em] mb-2 font-medium">
                    Room
                  </p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {ROOMS.map((room) => (
                      <OptionTile
                        key={room.id}
                        selected={!customWallUrl && activeRoom.id === room.id}
                        onClick={() => {
                          setCustomWallUrl(null);
                          setActiveRoom(room);
                        }}
                        label={room.name}
                        aspect="aspect-video"
                        preview={
                          <MiniPreview
                            roomUrl={room.imageUrl}
                            roomLabel={room.name}
                            artUrl={activePainting.imageUrl}
                            artAspect={artAspect}
                            wallColor={wallColor}
                            lighting={lighting}
                            frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                            className="w-full h-full"
                          />
                        }
                      />
                    ))}


                  </div>

                  {!isMobile && (
                    <>
                      {/* الطلاء — معاينة حقيقية لا مربّع لون */}
                      <p className="text-ui-muted text-[10px] uppercase tracking-[0.18em] mb-2 font-medium">
                        Wall paint
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {WALL_PAINT_PRESETS.map((p) => (
                          <OptionTile
                            key={p.name}
                            selected={wallColorName === p.name}
                            disabled={!!customWallUrl}
                            onClick={() => {
                              setWallColor(p.hex);
                              setWallColorName(p.name);
                            }}
                            label={p.name}
                            preview={
                              <MiniPreview
                                {...previewBase}
                                wallColor={p.hex}
                                lighting={lighting}
                                frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                                className="w-full h-full"
                              />
                            }
                          />
                        ))}
                      </div>
                      {customWallUrl && (
                        <p className="text-ui-muted text-[11px] mb-4">
                          Wall paint is disabled while using your own photo.
                        </p>
                      )}

                      {/* الإضاءة — خاصية جدارية */}
                      <p className="text-ui-muted text-[10px] uppercase tracking-[0.18em] mb-2 font-medium">
                        Lighting
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            ['daylight', 'Daylight'],
                            ['evening', 'Warm Sunset'],
                            ['spotlight', 'Spotlight'],
                          ] as const
                        ).map(([key, label]) => (
                          <OptionTile
                            key={key}
                            selected={lighting === key}
                            onClick={() => setLighting(key)}
                            label={label}
                            preview={
                              <MiniPreview
                                {...previewBase}
                                wallColor={wallColor}
                                lighting={key}
                                frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                                className="w-full h-full"
                              />
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                </PanelGroup>

                {/* ══ 2. المقاس — خانة واحدة تتوسّع ══ */}
                <PanelGroup
                  index={2}
                  title="Print Size"
                  summary={sizeSummary}
                  open={openGroup === 'size'}
                  onToggle={() => toggleGroup('size')}
                  thumb={
                    <MiniPreview
                      {...previewBase}
                      wallColor={wallColor}
                      lighting={lighting}
                      frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                      className="w-full h-full"
                    />
                  }
                >
                  <SizeField
                    matches={sizeMatches}
                    activeId={sizeId}
                    isCustom={!!customSize}
                    customLabel={`Custom · ${Math.round(physical.widthCm)}×${Math.round(physical.heightCm)} cm`}
                    onPick={(id) => {
                      commit();
                      setCustomSize(null);
                      setSizeId(id);
                    }}
                    onClearCustom={() => {
                      commit();
                      setCustomSize(null);
                    }}
                    widthCm={physical.widthCm}
                    heightCm={physical.heightCm}
                    onCustomSize={(next) => {
                      commit();
                      const n = normalizeSize(next);
                      setCustomSize(n.size);
                      if (n.hitLimit) setLimitPulse(true);
                    }}
                    lockRatio={effectiveLockAspect}
                    onToggleLockRatio={() => {
                      if (isMobile) return;
                      setLockAspect((v) => !v);
                    }}
                    compact={isMobile}
                    fitMode={fitMode}
                    onFitMode={(m) => {
                      commit();
                      setFitMode(m);
                    }}
                    orientation={orientationChoice}
                    onOrientation={(next) => {
                      commit();
                      setOrientationChoice(next);
                      setCustomSize(null);
                      if (next !== 'auto') {
                        const artIsPortrait = artAspect > 1.03;
                        const wantsPortrait = next === 'portrait';
                        if (artIsPortrait !== wantsPortrait && fitMode === 'cover') {
                          setFitMode('extend');
                        }
                      }
                    }}
                    fitNote={fit.note}
                    cropLossPct={fit.cropLossPct}
                    dpi={printDpiNow}
                    ratio={sizeRatio}
                    shape={sizeShape}
                    nearStandardLabel={nearStd?.entry.label ?? null}
                    atLimit={limitPulse}
                  />

                  <p className="mt-3 flex items-start gap-1.5 text-ui-muted text-[11px] leading-relaxed">
                    <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ui-accent" />
                    Every print is produced to order from the archival master file, hand-prepared by
                    the studio at your chosen dimensions.
                  </p>

                  <p className="mt-2 text-ui-muted text-[11px]">
                    Framed outer dimension ≈ {outer.widthCm} × {outer.heightCm} cm
                  </p>
                </PanelGroup>
              </>
            )}

            {/* ══ 3. الإطار — معاينة للوحتك داخل كل إطار ══ */}
            {!isMobile && (
              <PanelGroup
                index={3}
                title="Framing"
                summary={`${selectedFrame.name} · ${formatAddOn(selectedFrame.price)}`}
                open={openGroup === 'frame'}
                onToggle={() => toggleGroup('frame')}
                thumb={
                  <MiniPreview
                    {...previewBase}
                    wallColor={wallColor}
                    lighting={lighting}
                    frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                    className="w-full h-full"
                  />
                }
              >
                <div className="grid grid-cols-2 gap-2">
                  {FRAMING_OPTIONS.map((f) => (
                    <OptionTile
                      key={f.id}
                      selected={selectedFrame.id === f.id}
                      onClick={() => setSelectedFrame(f)}
                      label={f.name}
                      meta={formatAddOn(f.price)}
                      preview={
                        <MiniPreview
                          {...previewBase}
                          wallColor={wallColor}
                          lighting={lighting}
                          frame={f.id === 'fr-00' ? null : f}
                          artWidthPct={42}
                          className="w-full h-full"
                        />
                      }
                    />
                  ))}
                </div>
              </PanelGroup>
            )}

            {/* ══ 4. الزاوية والموضع — متقدّم ══ */}
            {!isMobile && (
              <PanelGroup
                index={4}
                title="Angle & Position"
                summary={angleSummary}
                open={openGroup === 'angle'}
                onToggle={() => toggleGroup('angle')}
                thumb={
                  <MiniPreview
                    {...previewBase}
                    wallColor={wallColor}
                    lighting={lighting}
                    frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                    rotate={{
                      x: transform.rotateX,
                      y: transform.rotateY,
                      z: transform.rotateZ,
                    }}
                    flip={{ h: transform.flipH, v: transform.flipV }}
                    className="w-full h-full"
                  />
                }
              >
                <p className="text-ui-muted text-[11px] leading-relaxed mb-3">
                  Tip: you can also drag, pinch and rotate the artwork directly on the wall.
                </p>

                <div role="radiogroup" aria-label="Viewing angle" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {ANGLE_PRESETS.map((p) => {
                    const isActive =
                      transform.rotateX === p.v.rotateX &&
                      transform.rotateY === p.v.rotateY &&
                      transform.rotateZ === p.v.rotateZ;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          commit();
                          setTransform((t) => ({ ...t, ...p.v }));
                        }}
                        className={`group relative rounded-sm border transition-colors overflow-hidden cursor-pointer ${
                          isActive
                            ? 'border-ui-accent ring-1 ring-ui-accent bg-ui-accent-soft'
                            : 'border-ui-line bg-ui-surface hover:border-ui-line-strong hover:bg-ui-surface-alt'
                        }`}
                      >
                        <MiniPreview
                          {...previewBase}
                          wallColor={wallColor}
                          lighting={lighting}
                          frame={selectedFrame.id === 'fr-00' ? null : selectedFrame}
                          rotate={{ x: p.v.rotateX, y: p.v.rotateY, z: p.v.rotateZ }}
                          className="w-full aspect-[4/3]"
                        />
                        <div className="block py-1 text-center">
                          <span className="block text-ui-text text-[11px] font-medium">{p.label}</span>
                          <span className="block text-ui-muted text-[9px]">{p.meta}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </PanelGroup>
            )}

            {/* V36 — شريط أدوات الهاتف: صف واحد، كل زر ≥ 44px. */}
            {isMobile && (
              <div className="pz-vz-toolbar">
                <button
                  type="button"
                  className="pz-vz-tool"
                  onClick={() => setSheetOpen((v) => !v)}
                  aria-expanded={sheetOpen}
                >
                  {sizeSummary}
                </button>
                <button
                  type="button"
                  className="pz-vz-tool pz-vz-tool--icon"
                  onClick={undo}
                  disabled={!canUndo}
                  aria-label="Undo"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  type="button"
                  className="pz-vz-tool pz-vz-tool--icon"
                  onClick={resetAll}
                  aria-label="Reset"
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            )}

            {/* ══ شريط الشراء — دائم الظهور ══ */}
            <div className="mt-4 pt-4 border-t border-ui-line">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-ui-muted text-[11px] truncate">
                  {sizeSummary}
                </span>
                <span className="text-ui-text text-xl font-medium tabular-nums shrink-0">
                  {formatMAD(priceWithSize)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAcquire}
                className="w-full py-4 rounded-sm bg-ui-accent text-ui-on-accent text-[11px] uppercase tracking-[0.28em] flex items-center justify-center gap-2 hover:brightness-110 transition-[filter] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent focus-visible:ring-offset-2"
              >
                <Sparkles size={13} /> Acquire Collection Piece
                <ChevronRight size={13} />
              </button>
              {!isMobile && (
                <p className="text-ui-muted text-[11px] mt-3 leading-relaxed">
                  White-glove delivery and installation included. Every piece is produced to order
                  from the archival master file at your selected dimensions.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
