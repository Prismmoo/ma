/**
 * Hover soundtracks, keyed by Artist.id from src/data.ts.
 * An artist with no entry keeps today's behaviour: colour on hover, silence.
 *
 * fallbacks: same track in a container every browser can decode. If the CDN
 * only has .webm, leave the array empty — the engine still works in Chrome,
 * Edge and Firefox, and reports 'unsupported-format' in Safari.
 */
export interface ArtistTrack {
  primary: string;
  fallbacks: string[];
}

export const ARTIST_HOVER_AUDIO: Record<string, ArtistTrack> = {
  // MESROUR SALAH EDDINE.
  // ملاحظة: اسم الملف على الـ CDN يحتوي مسافات، وهي مُرمَّزة %20 هنا عن قصد.
  // نص الرابط هو مفتاح الكاش في mediaCache.ts (buffers / Cache Storage)،
  // فأي تمثيل غير مُرمَّز يخلق مفتاحين لملف واحد ويُبطل الكاش بصمت.
  'art-01': {
    primary:
      'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/MESROUR%20SALAH%20EDDINE%20BG.webm',
    fallbacks: [
      // ارفع أحد هذين بجانب الـ .webm ليعمل الصوت على Safari أيضًا:
      // 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/MESROUR%20SALAH%20EDDINE%20BG.m4a',
      // 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/MESROUR%20SALAH%20EDDINE%20BG.mp3',
    ],
  },
  'art-02': {
    primary: 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/cadillac-bg.webm',
    fallbacks: [
      // Upload these next to the .webm when you can. Safari needs one of them.
      // 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/cadillac-bg.m4a',
      // 'https://noureddinelmobaraki-web.github.io/nl-audio-cdn/cadillac-bg.mp3',
    ],
  },
};

export function artistTrack(artistId: string): ArtistTrack | null {
  return ARTIST_HOVER_AUDIO[artistId] ?? null;
}
