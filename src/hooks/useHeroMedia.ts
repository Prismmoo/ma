import { useEffect, useRef, useState, useCallback } from 'react';
import { useBreakpoint } from './useBreakpoint';
import { useNetworkQuality } from './useNetworkQuality';

interface Options {
  isTransitioning: boolean;
  onExploreGallery: () => void;
}

export function useHeroMedia({ isTransitioning, onExploreGallery }: Options) {
  const { isMobile } = useBreakpoint();
  const { allowHeavyMedia } = useNetworkQuality();

  /*
   * Gate on BANDWIDTH, not on screen width.
   *
   * The old rule was `!isMobile && !saveData`, which removed the hero video
   * from every viewport under 768px — a phone on home Wi-Fi got a black
   * rectangle, and so did a desktop window dragged to half width.
   *
   * allowHeavyMedia is `!saveData && !slow`:
   *   saveData — an explicit user instruction. Always honoured.
   *   slow     — effectiveType 3g or worse. The honest bandwidth signal, and it
   *              was already being computed and never consumed.
   *
   * Browsers without navigator.connection (Safari, Firefox) report neither, so
   * they get the video. Absence of evidence of a bad connection is not evidence
   * of one.
   */
  const showVideo = allowHeavyMedia;

  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  /* الاستعاذة مرة واحدة فقط: إعادة محاولة دائمة على ملف ميت تعني تنزيلًا
     لا نهائيًا على حساب الزائر. مرة واحدة تعالج التعثّر العابر، وما زاد فعطب حقيقي. */
  const recoveredRef = useRef(false);

  /*
   * ⚠ videoFailed إشارة تشخيص فقط. تُقرأ في __prismHero ولا تحكم العرض إطلاقًا.
   * لا تستخدمها لإخفاء أو فكّ عنصر الفيديو: مهلة انتهت لا تعني ملفًا معطوبًا،
   * وكان هذا بالتحديد سبب اختفاء الفيديو نهائيًا على الشبكات البطيئة.
   */
  const [videoFailed, setVideoFailed] = useState(false);
  /* أول إطار قابل للعرض. نستخدمه للتلاشي بدل poster: لا أصل إضافي، ولا وميض. */
  const [videoReady, setVideoReady] = useState(true);

  const triggerReveal = useCallback(() => {
    if (isTransitioning) return;
    onExploreGallery();
  }, [isTransitioning, onExploreGallery]);

  useEffect(() => {
    const mountTime = Date.now();

    const handleScrollOrClick = () => {
      if (Date.now() - mountTime < 150) return;
      triggerReveal();
    };

    const handleWheel = (e: WheelEvent) => {
      if (Date.now() - mountTime < 150) return;
      if (Math.abs(e.deltaY) > 2 || Math.abs(e.deltaX) > 2) {
        triggerReveal();
      }
    };

    let startY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (Date.now() - mountTime < 150) return;
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - startY;
        if (Math.abs(deltaY) > 2) {
          triggerReveal();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('click', handleScrollOrClick);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('click', handleScrollOrClick);
    };
  }, [triggerReveal]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !showVideo) return;

    let recoveryTimer: number | undefined;

    const requestVideoPlayback = () => {
      if (document.visibilityState === 'hidden') return;
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise) {
        void playPromise.catch(() => {});
      }
    };

    const reportFailure = (reason: string) => {
      const err = video.error;
      // eslint-disable-next-line no-console
      console.warn('[hero-video] ' + reason, {
        code: err?.code ?? null,
        message: err?.message ?? null,
        networkState: video.networkState,
        readyState: video.readyState,
        currentSrc: video.currentSrc || '(empty)',
      });
      setVideoFailed(true);
      
      /*
       * محاولة إحياء واحدة ووحيدة: أعِد بناء سلسلة المصادر ثم شغّل.
       * كثير من حالات watchdog هي شبكة تعثّرت لا ملف مفقود، وload() يعيد
       * المحاولة من الصفر بتكلفة زهيدة.
       */
      if (!recoveredRef.current) {
        recoveredRef.current = true;
        try {
          video.load();
          const p = video.play();
          if (p) void p.catch(() => {});
        } catch {
          /* لا شيء أكثر يمكن فعله. */
        }
      }
    };

    const handleError = () => reportFailure('media error');

    /*
     * جاهزية العرض. مستقلة تمامًا عن videoFailed.
     *
     * لماذا أربعة مسارات ومهلة:
     *   (1) فحص متزامن لـreadyState عند الربط — يغطي الملف المخزَّن مؤقتًا
     *       حيث تكون كل الأحداث قد انطلقت قبل وجود المستمع. هذا هو العطب
     *       الذي كان يخفي الفيديو خلف opacity-0.
     *   (2) loadeddata — أول إطار صار مفكوكًا.
     *   (3) playing — التشغيل الفعلي بدأ.
     *   (4) timeupdate — الحرس الأخير: إن تقدّم الوقت فالفيديو يعمل يقينًا،
     *       حتى لو ضاع كل حدث قبله (يحدث فعلًا على بعض متصفّحات أندرويد).
     *   (5) مهلة 2500ms تفتح البوّابة قسرًا. أسوأ ما قد يراه الزائر هو إطار
     *       أول متأخر؛ وهو أهون بما لا يُقاس من شاشة سوداء أبدية.
     */
    const revealVideo = () => setVideoReady(true);

    if (video.readyState >= 2) revealVideo();

    video.addEventListener('loadeddata', revealVideo);
    video.addEventListener('playing', revealVideo);
    video.addEventListener('timeupdate', revealVideo);
    const forcedReveal = window.setTimeout(revealVideo, 2500);

    /*
     * مهلة يقظة: حدث "error" لا يُطلق في كل حالات الفشل — أصل مفقود خلف
     * إعادة توجيه، أو ترميز غير مدعوم، قد يترك العنصر في readyState 0 صامتًا
     * إلى الأبد. 8 ثوانٍ سخيّة لأثقل اتصال معقول، وقصيرة بما يكفي ليرى
     * الزائر بديلًا لا فراغًا.
     */
    const watchdog = window.setTimeout(() => {
      if (video.readyState === 0) reportFailure('watchdog: no data after 8s');
    }, 8000);

    video.addEventListener('error', handleError);

    const schedulePlaybackRecovery = () => {
      window.clearTimeout(recoveryTimer);
      recoveryTimer = window.setTimeout(() => {
        if (video.paused || video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
          requestVideoPlayback();
        }
      }, 250);
    };

    video.addEventListener('loadedmetadata', requestVideoPlayback);
    video.addEventListener('canplay', requestVideoPlayback);
    video.addEventListener('stalled', schedulePlaybackRecovery);
    document.addEventListener('visibilitychange', requestVideoPlayback);

    requestVideoPlayback();

    return () => {
      window.clearTimeout(recoveryTimer);
      window.clearTimeout(watchdog);
      window.clearTimeout(forcedReveal);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadeddata', revealVideo);
      video.removeEventListener('playing', revealVideo);
      video.removeEventListener('timeupdate', revealVideo);
      video.removeEventListener('loadedmetadata', requestVideoPlayback);
      video.removeEventListener('canplay', requestVideoPlayback);
      video.removeEventListener('stalled', schedulePlaybackRecovery);
      document.removeEventListener('visibilitychange', requestVideoPlayback);
    };
  }, [showVideo]);

  useEffect(() => {
    (window as any).__prismHero = () => {
      const v = heroVideoRef.current;
      return {
        showVideo,
        videoReady,
        videoFailed,
        mounted: Boolean(v),
        paused: v?.paused ?? null,
        readyState: v?.readyState ?? null,   // 0 = لا شيء، 4 = جاهز تمامًا
        networkState: v?.networkState ?? null, // 3 = NETWORK_NO_SOURCE
        errorCode: v?.error?.code ?? null,     // 4 = SRC_NOT_SUPPORTED
        currentSrc: v?.currentSrc || '(empty)',
        canPlayWebm: document.createElement('video').canPlayType('video/webm; codecs="vp9"'),
      };
    };
  }, [showVideo, videoFailed, videoReady]);

  return { heroVideoRef, showVideo, videoReady, videoFailed, triggerReveal, isMobile };
}
