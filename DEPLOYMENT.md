# النشر — PRISM

- **الموقع المباشر:** https://prismmoo.github.io/ma/
- **المستودع:** https://github.com/Prismmoo/ma
- **الفرع:** `main`

## ⚙️ مسار القاعدة (`base`)

قيمة واحدة تحكم كل شيء: **`/ma/`** — وهي تطابق اسم المستودع `ma` حرفياً.

تظهر في أربعة مواضع يجب أن تبقى متطابقة دائماً:

| الملف | الموضع |
| --- | --- |
| `vite.config.ts` | القيمة الافتراضية لـ `base` |
| `.github/workflows/deploy.yml` | `VITE_BASE_PATH` + خطوة الحارس |
| `.github/workflows/quality.yml` | `VITE_BASE_PATH` |
| `playwright.config.ts` | `baseURL` و `url` |

### ⚠️ لماذا كان CI أخضر والموقع أبيض

كان الحارس يبحث عن `src="/assets/` فقط:

| `base` | ناتج البناء | الحارس القديم | الموقع يعمل؟ |
| --- | --- | --- | --- |
| `/` | `src="/assets/…"` | ✅ يمر | ❌ لا |
| `/ma/` | `src="/ma/assets/…"` | ❌ يفشل | ✅ نعم |

أي أنه كان مقلوباً. الحارس الحالي يبحث عن السلسلة الكاملة `src="/ma/assets/`. **لا تختصرها أبداً.**

### إن أعدت تسمية المستودع

| الحالة الجديدة | `base` | الرابط |
| --- | --- | --- |
| اسم المستودع `prismmoo.github.io` | `/` | `https://prismmoo.github.io/` |
| أي اسم آخر، مثلاً `art` | `/art/` | `https://prismmoo.github.io/art/` |

غيّر المواضع الأربعة معاً، ثم حدّث `README.md` و `public/robots.txt` و `public/sitemap.xml` (وفيه سبعة روابط: رابط الصفحة + ست صور).

## 🚀 خطوات النشر

1. **`Settings ← Pages ← Build and deployment ← Source = GitHub Actions`** — خطوة يدوية إجبارية مرة واحدة.
2. `Settings ← Secrets and variables ← Actions` — أضف `VITE_ORDER_WEB_APP_URL`.
3. ادفع إلى `main`. يعمل `deploy.yml` تلقائياً.
4. تابع التقدم في تبويب **Actions**.

## 🧪 البناء محلياً

```bash
npm ci --no-audit --no-fund
VITE_BASE_PATH=/ma/ npm run build
npm run preview -- --port 4173
```

ثم افتح `http://localhost:4173/ma/`.

للتأكد من صحة الناتج قبل الدفع:

```bash
grep -q 'src="/ma/assets/' dist/index.html && echo GUARD-OK || echo GUARD-FAIL
```

## 🧯 حل المشكلات

| العرض | السبب | الحل |
| --- | --- | --- |
| صفحة بيضاء | `base` لا يطابق مسار النشر | وحّد المواضع الأربعة أعلاه |
| 404 على كل الأصول | نفس السبب | افحص `dist/index.html` — يجب أن يحوي `src="/ma/assets/` |
| CI أخضر والموقع أبيض | الحارس يطابق سلسلة جزئية | أعد الحارس إلى `src="/ma/assets/` بالكامل |
| `Get Pages site failed` | مصدر Pages غير مضبوط | نفّذ الخطوة 1 |
| الطلبات لا تُرسل | السر مفقود | نفّذ الخطوة 2 |
| صور الغرف لا تظهر | مسار `/rooms/` بدون `/ma` | المسار الصحيح `/ma/rooms/` |
| اختبارات e2e تفشل | `playwright.config.ts` لا يطابق `base` | وحّدهما |
| `Type check` يمر مع أخطاء | `continue-on-error: true` مقصود بسبب ملفات `fix_*` في الجذر | نظّف الجذر أولاً ثم احذف السطر |
