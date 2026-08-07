/**
 * MASTER TAXONOMY - single source of truth for BOTH the paintings gallery
 * and the sticker workshop.
 *
 * This block used to live inside `components/GalleryView.tsx`. It was moved here
 * (unchanged) so that stickers cannot drift from paintings: any cover, tagline,
 * description or ordering edited here is instantly reflected in both surfaces.
 *
 * DO NOT duplicate these lists anywhere else.
 */
import { StyleType } from '../types';
import { CARS_SUBCATEGORIES, CARS_COLLECTIONS, collectionCover, collectionCount } from './art';

/** عدد صور السيارات الظاهرة — مشتق، يستثني المخفيّ تلقائيًا. */
const CARS_IMAGE_COUNT = CARS_COLLECTIONS.reduce((n, c) => n + collectionCount(c.slug), 0);

/** غلاف عائلة السيارات — أول صورة ظاهرة في أول مجموعة، بلا رابط مكتوب يدويًا. */
const CARS_COVER_URL =
  (CARS_COLLECTIONS[0] ? collectionCover(CARS_COLLECTIONS[0].slug)?.src : undefined) ?? '';

/** غلاف مجموعة سيارات واحدة — مشتق من الكتالوج، فلا يمكن أن يشير خارج مجلده. */
const carCover = (slug: string): string => collectionCover(slug)?.src ?? '';

export type CategoryInfo = {
  id: string;
  name: StyleType;
  type: 'Traditional' | 'Pop Culture';
  tagline: string;
  desc: string;
  imageUrl: string;
};

export type SubCategoryInfo = {
  name: string | null;
  title: string;
  tagline: string;
  desc: string;
  imageUrl: string;
};

/** Families that browse through a sub-collection page before the product grid. */
export const CATEGORIES_WITH_SUBCOLLECTIONS: StyleType[] = ['Motorbikes', 'Cars', 'Anime', 'Films', 'Gaming'];

export const hasSubCollections = (style: StyleType): boolean =>
  CATEGORIES_WITH_SUBCOLLECTIONS.includes(style);

export const CATEGORIES: {
  id: string;
  name: StyleType;
  type: 'Traditional' | 'Pop Culture';
  tagline: string;
  desc: string;
  imageUrl: string;
}[] = [
  {
    id: 'cat-6',
    name: 'Anime',
    type: 'Pop Culture',
    tagline: 'Atelier Pop-Scenery',
    desc: 'Delicate neoclassical contour linework combined with gorgeous Japanese pop aesthetics and celestial twilight sky gradients.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/coveranime.webp'
  },
  {
    id: 'cat-7',
    name: 'Gaming',
    type: 'Pop Culture',
    tagline: 'Monolithic Realms',
    desc: 'Mystical portals, monolithic architecture, and neon-lit fantasy worlds built with high-relief relief paste and neon oil pigments.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/gamingcover.webp'
  },
  {
    id: 'cat-8',
    name: 'Films',
    type: 'Pop Culture',
    tagline: 'Cinematic Noir',
    desc: 'Deep carbon charcoal shadows and vibrant cinematic neon reflections paying homage to classic New Wave drama.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/moviescover.webp'
  },
  {
    id: 'cat-9',
    name: 'Motorbikes',
    type: 'Pop Culture',
    tagline: 'Mechanical Motion',
    desc: 'Raw speed, textured metal accents, and asphalt-drenched cafe racers captured in dynamic, modern brushwork.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/momomtcover.webp'
  },
  {
    id: 'cat-10',
    name: 'Cars',
    type: 'Pop Culture',
    tagline: 'Aerodynamic Form',
    desc: 'Aerodynamic outlines of legendary sports cars and sleek modern designs rendered with acrylic washes and carbon charcoal.',
    imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/art/cars/mercedes/car-mercedes-01-400.webp'
  }
];

/* ---------------------------------------------------------------------------
 * طبقة التسمية — تفصل الاسم المعروض عن مفتاح البيانات.
 * هذا هو المكان الوحيد المسموح فيه بتغيير نصوص التصنيفات.
 * ------------------------------------------------------------------------- */
export const CATEGORY_DISPLAY_NAMES: Partial<Record<StyleType, string>> = {
  Anime: 'Anime & Manga',
  Films: 'Films & Series',
};

/** الاسم المعروض لتصنيف. ارجع للمفتاح نفسه إن لم يوجد تجاوز. */
export const displayStyle = (style: StyleType): string =>
  CATEGORY_DISPLAY_NAMES[style] ?? style;

export const MOTORBIKE_SUBCATEGORIES = [
  'BMW',
  'KAWASAKI',
  'YAMAHA',
  'DUCATI',
  'Royal enfield',
  'honda',
  'Suzuki',
  'KTM',
  'Harley-Davidson',
];

/**
 * مراجع السيارات تُشتقّ من الكتالوج المولَّد لا من قائمة يدوية.
 *
 * القائمة اليدوية السابقة كانت تعرض nissan و porsch و PRISM Studio
 * وهي مراجع بلا أي صورة مرفوعة — أرفف فارغة بأغلفة Unsplash.
 * بالاشتقاق، رفع ماركة جديدة إلى الـ CDN يُظهرها تلقائيًا،
 * وحذفها يُخفيها تلقائيًا. لا مكان للدريف بين القائمتين.
 */
export const CAR_SUBCATEGORIES = CARS_SUBCATEGORIES;

export const SUBCATEGORY_INFOS: Record<string, {
  name: string | null;
  title: string;
  tagline: string;
  desc: string;
  imageUrl: string;
}[]> = {
  'Motorbikes': [
    {
      name: null,
      title: 'Full Motorbikes Collection',
      tagline: 'Entire Lineup',
      desc: 'Browse the entire Motorbikes family across BMW, Kawasaki, Yamaha, Ducati, Royal Enfield, Honda, Suzuki, KTM, and Harley-Davidson.',
      imageUrl: 'https://i.postimg.cc/Jhm15xJ2/SUZUKI-HAYABUSA.jpg'
    },
    {
      name: 'BMW',
      title: 'BMW',
      tagline: 'German Engineering Precision',
      desc: 'Iconic S1000RR track weapons and GS Adventure long-haul machines.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/6.webp'
    },
    {
      name: 'KAWASAKI',
      title: 'KAWASAKI',
      tagline: 'Sugomi & Ninja Velocity',
      desc: 'Aggressive streetfighter posture, Ninja speed, and bold Sugomi styling.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/1.webp'
    },
    {
      name: 'YAMAHA',
      title: 'YAMAHA',
      tagline: 'Heritage & R-Series Velocity',
      desc: 'Japanese engineering precision, XSR neo-retro aesthetics, and TMAX maxi-scooter power.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/3.webp'
    },
    {
      name: 'DUCATI',
      title: 'DUCATI',
      tagline: 'Italian Aerodynamic Sculpture',
      desc: 'Panigale V4 S red fairings, Desmosedici V4 power, and high-contrast racing sculptures.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/4.webp'
    },
    {
      name: 'Royal enfield',
      title: 'Royal enfield',
      tagline: 'Pure Motorcycling Heritage',
      desc: 'Classic British-Indian engineering, vintage cafe racers, and timeless thumpers.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/royal.webp'
    },
    {
      name: 'honda',
      title: 'honda',
      tagline: 'The Power of Dreams',
      desc: 'Fireblade precision, CBR superbike performance, and iconic Japanese engineering.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/2.webp'
    },
    {
      name: 'Suzuki',
      title: 'Suzuki',
      tagline: 'Hayabusa Speed Legend',
      desc: 'Aerodynamic speed records, GSX-R heritage, and sweeping hyperbike silhouettes.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/5.webp'
    },
    {
      name: 'KTM',
      title: 'KTM',
      tagline: 'Ready to Race',
      desc: 'Lightweight trellis frame corner rockets, Duke agility, and sharp orange street machines.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/7.webp'
    },
    {
      name: 'Harley-Davidson',
      title: 'Harley-Davidson',
      tagline: 'American Heavyweight V-Twin',
      desc: 'Low-slung chrome stance, Fat Boy custom stance, and roaring V-twin cruisers.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/Sportbike%20(2)/8.webp'
    }
  ],
  'Cars': [
    {
      name: null,
      title: 'Full Cars Collection',
      tagline: 'Every Marque',
      desc: `The complete automotive body of work — ${CARS_IMAGE_COUNT} plates across ${CARS_SUBCATEGORIES.length} marques, from AMG bi-turbo muscle and Quattro precision to Skyline turbo lineage and Stuttgart flat-six heritage.`,
      imageUrl: CARS_COVER_URL
    },
    {
      name: 'Audi',
      title: 'Audi',
      tagline: 'Vorsprung durch Technik',
      desc: 'Quattro all-wheel velocity, matrix LED geometry, and the mid-engine R8 silhouette rendered in acrylic wash and carbon charcoal.',
      imageUrl: carCover('audi')
    },
    {
      name: 'BMW',
      title: 'BMW',
      tagline: 'Ultimate Driving Machine',
      desc: 'M-Power aerodynamics, the twin-kidney stance, and motorsport heritage drawn in flowing minimalist ink over atmospheric plaster.',
      imageUrl: carCover('bmw')
    },
    {
      name: 'Mercedes-Benz',
      title: 'Mercedes-Benz',
      tagline: 'Silver Arrow Lineage',
      desc: 'AMG V8 bi-turbo presence, long-hood proportion, and timeless luxury stance in high-relief acrylic and graphite.',
      imageUrl: carCover('mercedes')
    },
    {
      name: 'Nissan',
      title: 'Nissan',
      tagline: 'Skyline Turbo Lineage',
      desc: 'GT-R twin-turbo aggression, wide-body Z proportion, and JDM night-run culture drawn in cold ink over warm asphalt wash.',
      imageUrl: carCover('nissan')
    },
    {
      name: 'Porsche',
      title: 'Porsche',
      tagline: 'Stuttgart Flat-Six',
      desc: 'The rear-engine 911 profile held for six decades, ducktail geometry and Le Mans provenance rendered in graphite and thin lacquer.',
      imageUrl: carCover('porsche')
    },
    {
      name: 'Toyota Supra',
      title: 'Toyota Supra',
      tagline: '2JZ Legend',
      desc: 'The A80 long hood, the 2JZ-GTE iron block, and the tuner-era silhouette that outlived its own decade — charcoal on primed linen.',
      imageUrl: carCover('toyota-supra')
    },
    {
      name: 'More Cars',
      title: 'More Cars',
      tagline: 'Open Garage',
      desc: 'The pieces that refuse a single badge — one-off builds, mixed-marque studies, and road-side finds kept together in one open garage.',
      imageUrl: carCover('more-cars')
    }
  ],
  'Gaming': [
    {
      name: 'PRISM Studio',
      title: 'PRISM Studio',
      tagline: 'Studio Originals',
      desc: 'Hand-finished studio originals inspired by legendary game worlds, produced in the PRISM atelier rather than derived from the plate archive.',
      imageUrl: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/gamingcover.webp'
    }
  ],
  'Anime': [
    {
      name: null,
      title: 'Full Anime & Manga Collection',
      tagline: 'Entire Anthology',
      desc: 'Browse masterworks inspired by legendary anime and manga sagas, from dark fantasy epics to high-octane martial sagas.',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Berserk',
      title: 'Berserk',
      tagline: 'Dark Fantasy Epics',
      desc: 'Raw charcoal linework, heavy iron textures, and fierce dark fantasy compositions honoring the Black Swordsman legend.',
      imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Vagabond',
      title: 'Vagabond',
      tagline: 'Ink & Bushido',
      desc: 'Expressive traditional Japanese sumi-e ink washes, fluid katana silhouettes, and meditative martial philosophy.',
      imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Vinland Saga',
      title: 'Vinland Saga',
      tagline: 'Norse Warrior Sagas',
      desc: 'Fiery battlefield twilight, weathered longship wood, and coastal storm canvases depicting the quest for peace.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Solo Leveling',
      title: 'Solo Leveling',
      tagline: 'Shadow Monarch',
      desc: 'Neon cyan magic glyphs, deep shadow daggers, and electric purple aura bursts from the gates.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Dragon Ball',
      title: 'Dragon Ball',
      tagline: 'Saiyan Energy',
      desc: 'Golden aura surges, celestial energy spheres, and iconic martial arts poses in high-impact brushwork.',
      imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Hajime no Ippo',
      title: 'Hajime no Ippo',
      tagline: 'Boxing Spirit',
      desc: 'Dynamic ring shadows, Dempsey Roll motion trails, and raw sweat-and-leather canvas studies.',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Golden Boy',
      title: 'Golden Boy',
      tagline: 'Classical Study',
      desc: 'Retro 90s cel-shading aesthetics, humorous study notes, and golden vintage Japanese pop art.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Jujutsu Kaisen',
      title: 'Jujutsu Kaisen',
      tagline: 'Domain Expansion',
      desc: 'Infinitely void domain corridors, crimson curse seals, and high-energy modern sorcery silhouettes.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Naruto',
      title: 'Naruto',
      tagline: 'Will of Fire',
      desc: 'Swirling chakra blue, sage mode gold, and stone monument contours honoring the ninja heritage.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Demon Slayer',
      title: 'Demon Slayer',
      tagline: 'Water & Flame Breaths',
      desc: 'Ukiyo-e wave contours, fiery Nichirin blade arcs, and intricate kimono pattern canvases.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'One Piece',
      title: 'One Piece',
      tagline: 'Grand Line Horizon',
      desc: 'Sunlit ocean horizons, Straw Hat silhouettes, and roaring sea adventures in vivid oil colors.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'One Punch Man',
      title: 'One Punch Man',
      tagline: 'Absolute Impact',
      desc: 'Impact shockwaves, minimalist yellow-and-red pop palettes, and monumental hero silhouettes.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Black Clover',
      title: 'Black Clover',
      tagline: 'Anti-Magic Grimoire',
      desc: 'Five-leaf clover grimoires, black anti-magic swirls, and fiery royal kingdom battlegrounds.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Death Note',
      title: 'Death Note',
      tagline: 'Gothic Noir',
      desc: 'Chiaroscuro gothic moonlight, apple crimson contrasts, and dramatic psychological noir portraiture.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Claymore',
      title: 'Claymore',
      tagline: 'Silver-Eyed Witches',
      desc: 'Silver armor reflections, vast snowfield landscapes, and haunting greatsword martial poses.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Climber',
      title: 'The Climber',
      tagline: 'Solitary Peak Ascent',
      desc: 'Extreme high-altitude mountain ascents, frozen cliff faces, and raw psychological endurance.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Attack on Titan',
      title: 'Attack on Titan',
      tagline: 'Behind the Walls',
      desc: 'Colossal stone wall vistas, ODM gear speed trails, and dramatic twilight battlefields.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Hunter x Hunter',
      title: 'Hunter x Hunter',
      tagline: 'Nen Mastership',
      desc: 'Glow-of-Nen aura fields, phantom troupe spiders, and adventurous uncharted continent landscapes.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    }
  ],
  'Films': [
    {
      name: null,
      title: 'Full Films & Series Collection',
      tagline: 'Cinematic Anthology',
      desc: 'Explore iconic cinema and television masterworks captured in rich acrylic, oil, and charcoal canvases.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Se7en',
      title: 'Se7en',
      tagline: 'Gothic Detective',
      desc: 'Dark rain-slicked noir cityscapes, crimson deadly sins, and intense shadow lighting.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Fight Club',
      title: 'Fight Club',
      tagline: 'Project Mayhem',
      desc: 'Soap lather neon contrast, basement fight shadows, and chaotic urban pop art.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Memento',
      title: 'Memento',
      tagline: 'Polaroid Mystery',
      desc: 'Fragmented memory polaroids, sepia ink washes, and psychological narrative puzzles.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Peaky Blinders',
      title: 'Peaky Blinders',
      tagline: 'By Order Of',
      desc: 'Industrial Birmingham smoke, razor flat caps, whiskey amber hues, and 1920s gang prestige.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Breaking Bad',
      title: 'Breaking Bad',
      tagline: 'Empire Business',
      desc: 'Albuquerque desert yellow, hazmat turquoise, and chemical blue crystal glare.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Game of Thrones',
      title: 'Game of Thrones',
      tagline: 'Iron Throne Sagas',
      desc: 'Winterfell frost, dragon fire crimson, and forged steel throne contours.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Better Call Saul',
      title: 'Better Call Saul',
      tagline: "Slippin' Jimmy",
      desc: 'Nebraska Cinnabon sepia, New Mexico neon law office, and brass scales of justice.',
      imageUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Sopranos',
      title: 'The Sopranos',
      tagline: 'New Jersey Empire',
      desc: 'Vintage New Jersey diner lighting, dark cigar smoke, and mob family chiaroscuro.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Six Feet Under',
      title: 'Six Feet Under',
      tagline: 'Life & Departure',
      desc: 'Surreal floral undertones, serene white linen, and philosophical mortality portraits.',
      imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'From',
      title: 'From',
      tagline: 'The Nightmare Town',
      desc: 'Eerie forest shadows, glowing talismans, and dark mystery town horizons.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Dark',
      title: 'Dark',
      tagline: 'Everything Is Connected',
      desc: 'Winden rain-soaked yellow raincoat, cave vortex shadows, and triquetra time loops.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Lost',
      title: 'Lost',
      tagline: 'The Island',
      desc: 'Emerald jungle canopy, mysterious hatch steel, and sun-drenched island shores.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Last Kingdom',
      title: 'The Last Kingdom',
      tagline: 'Destiny Is All',
      desc: 'Anglo-Saxon shield walls, mud-and-fire battlefields, and Wessex kingdom banners.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Walking Dead',
      title: 'The Walking Dead',
      tagline: 'Apocalypse Horizon',
      desc: 'Weathered highway horizon, rustic crossbow steel, and gritty apocalyptic decay.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Wire',
      title: 'The Wire',
      tagline: 'Baltimore Streets',
      desc: 'Raw Baltimore brick textures, police wiretape reels, and gritty urban realism.',
      imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Joker',
      title: 'Joker',
      tagline: 'Put On A Happy Face',
      desc: 'Staircase dance silhouettes, clown makeup crimson, and Gotham 1970s yellow-green drama.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Boys',
      title: 'The Boys',
      tagline: 'Vought International',
      desc: 'Compound V neon blue, laser red eye glows, and anti-hero graphic satire.',
      imageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'The Dark Knight',
      title: 'The Dark Knight',
      tagline: 'Gotham Guardian',
      desc: 'Bat-signal searchlights, towering Gotham skyscraper shadows, and chaotic Joker card pop accents.',
      imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'La Casa de Papel',
      title: 'La Casa de Papel',
      tagline: 'Bella Ciao',
      desc: 'Dalí mask red jumpsuits, royal mint gold bars, and high-stakes heist suspense.',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: '2001: A Space Odyssey',
      title: '2001: A Space Odyssey',
      tagline: 'Monolithic Cosmic',
      desc: 'HAL 9000 glowing red eye, stark white stargate corridors, and monolithic black stone alignment.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Oppenheimer',
      title: 'Oppenheimer',
      tagline: 'Destroyer of Worlds',
      desc: 'Atomic fireball glow, black-and-white quantum physics equations, and desert test site drama.',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Interstellar',
      title: 'Interstellar',
      tagline: 'Gargantua Horizon',
      desc: 'Singularity gravitational lens accretion disk, cornfield dusk, and cosmic wormhole vistas.',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'City of God',
      title: 'City of God',
      tagline: 'Favela Sunset',
      desc: 'Sun-drenched Rio de Janeiro orange, vintage 1970s film grain, and intense favela stories.',
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Paul',
      title: 'Paul',
      tagline: 'Alien Roadtrip',
      desc: 'Area 51 desert highway twilight, neon green extraterrestrial aura, and retro RV adventures.',
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=600'
    },
    {
      name: 'Captain Phillips',
      title: 'Captain Phillips',
      tagline: "I'm The Captain Now",
      desc: 'Deep ocean navy, cargo ship steel, and high-tension maritime rescue drama.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=600'
    }
  ]
};

/** Card metadata for one sub-collection of a family, with a safe fallback. */
export function subCategoryCard(style: StyleType | null, subCat: string): SubCategoryInfo {
  const list = (style ? SUBCATEGORY_INFOS[style] : undefined) || [];
  return (
    list.find((c) => c.name === subCat || c.title === subCat) || {
      name: subCat,
      title: subCat,
      tagline: 'Collection',
      desc: '',
      imageUrl: '',
    }
  );
}

/** Category metadata by style key. */
export function categoryInfo(style: StyleType | null): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.name === style);
}
