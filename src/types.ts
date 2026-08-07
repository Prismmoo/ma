import type { Personalization } from './lib/personalization';
import type { PackComposition } from './lib/packComposition';

/**
 * ⚠️ القيم الداخلية ثابتة ولا تتغيّر أبدًا — هي مفتاح الربط في PAINTINGS
 * وفي StickersView و PacksView و WebsiteMapModal.
 * الاسم المعروض للمستخدم يأتي من STYLE_LABELS أدناه، لا من هذه القيم.
 */
export type StyleType = 'Abstract' | 'Minimalist' | 'Textured' | 'Contemporary' | 'Impressionist' | 'Anime' | 'Gaming' | 'Films' | 'Motorbikes' | 'Cars';

/**
 * طبقة العرض فقط. أي نص يراه المستخدم يمرّ من هنا.
 * هذا يحلّ مشكلة «التسمية الخاطئة» دون لمس أي مفتاح بيانات.
 */
export const STYLE_LABELS: Record<StyleType, string> = {
  Anime:         'Anime & Manga',
  Films:         'Films & Series',
  Gaming:        'Gaming',
  Motorbikes:    'Motorbikes',
  Cars:          'Cars',
  Abstract:      'Abstract',
  Minimalist:    'Minimalist',
  Textured:      'Textured',
  Contemporary:  'Contemporary',
  Impressionist: 'Impressionist',
};

/** التصنيفات الفعلية على الـ CDN. */
export type ArtCategorySlug = 'anime-manga' | 'films-series' | 'games' | 'cars';

/** نوع المجموعة داخل التصنيف — يُستخدم لتقسيم Films & Series. */
export type ArtCollectionType = 'anime' | 'film' | 'series' | 'game' | 'car';

/** بادئة معرّف الصورة. */
export type ArtPrefix = 'anm' | 'flm' | 'srs' | 'gam' | 'car';
export type SizeCategory = 'Small' | 'Medium' | 'Large' | 'Collector';


export type SupportedCustomerImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export interface CustomerArtworkUpload {
  id: string;
  originalName: string;
  mimeType: SupportedCustomerImageMime;
  sizeBytes: number;
  widthPx: number;
  heightPx: number;
  /** Data URL is kept in React/cart memory only. Never persist this in localStorage. */
  dataUrl: string;
}

/**
 * مواصفات الطباعة التي اختارها الزبون فعلًا في المحاكي.
 * اختياري بالكامل: كل منتج لا يمرّ بالمحاكي (الستيكر، الباكات) يتركه غير معرّف،
 * ولا يجوز لأي كود أن يفترض وجوده.
 */
export interface PrintSpec {
  widthCm: number;
  heightCm: number;
  sizeId: string | null;
  sizeLabel: string;
  isCustom: boolean;
  shape: 'square' | 'classic' | 'tall' | 'panorama';
  ratio: string;
  orientation: 'portrait' | 'landscape' | 'square';
  fitMode: 'cover' | 'contain' | 'extend';
  fitNote: string;
  cropLossPct: number;
  printDpi: number;
}

export interface Painting {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  year: number;
  style: StyleType;
  sizeCategory: SizeCategory;
  widthCm: number;
  heightCm: number;
  price: number;
  story: string;
  imageUrl: string;
  colorPalette: string[]; // List of primary hex colors
  paletteNames: string[]; // List of names for these colors
  featured?: boolean;
  subCategory?: string;
  /** Present only when the customer supplied the product artwork. */
  customerUpload?: CustomerArtworkUpload;
  /**
   * مرجع الصورة متعدد المقاسات.
   * موجود فقط في لوحات PRISM المولّدة من الـ CDN.
   * يبقى undefined في اللوحات الأصلية — لذلك هو اختياري.
   * كل مكوّن يجب أن يتعامل مع غيابه بمسار تراجع إلى imageUrl.
   */
  image?: ArtImageRef;
  /** Present only on synthetic bundle products built by PacksView.
   * Carries every artwork the buyer picked, with its real size and finish.
   */
  packComposition?: PackComposition;
  /** Present only when the buyer configured the size in the room visualizer. */
  printSpec?: PrintSpec;
  /** Present only when the artwork was uploaded by the customer in a pack or custom upload. */
  isCustomerUpload?: boolean;
}

export interface FramingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  borderHex: string;
  materialWidthCm: number;
  image?: string;
  color?: string;
}

export interface RoomType {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  approxWidthM: number;
  approxHeightM: number;
  paintingDefaultXPercent: number; // For room placement
  paintingDefaultYPercent: number;
  defaultScale: number; // To normalize physical size in room relative to image width
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  location: string;
  philosophy: string;
  avatarUrl: string;
}

export interface CartItem {
  painting: Painting;
  frame: FramingOption;
  quantity: number;
  personalization?: Personalization;
}

export interface ActiveFilters {
  styles: StyleType[];
  sizes: SizeCategory[];
  palette: string | null;
  maxPrice: number;
}

/* =========================================================================
 *  طبقة الصور المولّدة — تطابق مخرجات scripts/sync-art-catalog.mjs
 * ========================================================================= */

/**
 * سجل صورة واحدة بأقل ترميز ممكن.
 *  i = الفهرس داخل المجموعة (1-based، يُبطّن إلى خانتين في الرابط)
 *  w,h = أبعاد أكبر متغيّر متوفر — تُستخدم لـ aspect-ratio ولمنع CLS
 *  z = المقاسات المتوفرة فعليًا على الخادم. لا تفترض أبدًا أنها 5 مقاسات:
 *      97.6% من الصور لها [400] فقط.
 */
export interface GeneratedImage {
  i: number;
  w: number;
  h: number;
  z: number[];
}

export interface GeneratedCollection {
  slug: string;
  title: string;
  cat: ArtCategorySlug;
  pfx: ArtPrefix;
  type: ArtCollectionType;
  imgs: GeneratedImage[];
}

/** مرجع صورة جاهز للعرض، يُشتق في الذاكرة ولا يُخزّن في الحزمة. */
export interface ArtImageRef {
  /** مثال: 'anm-berserk-01' */
  id: string;
  /** الرابط الاحتياطي (أكبر مقاس متوفر). يُضمن وجوده. */
  src: string;
  /** مبني من z فقط. يكون مدخلًا واحدًا لمعظم الصور. */
  srcSet: string;
  width: number;
  height: number;
  /** أقصى عرض حقيقي متوفر — لمنع التمديد فوق الدقة الأصلية. */
  maxWidth: number;
}
