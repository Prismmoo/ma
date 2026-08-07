# النشر — PRISM

- **الموقع المباشر:** https://prismmoo.github.io/
- **المستودع:** https://github.com/Prismmoo/prismmoo.github.io

## ⚙️ مسار القاعدة (`base`)

قيمة واحدة تحكم كل شيء: `/`.

تظهر في أربعة مواضع يجب أن تبقى متطابقة دائماً:

| الملف | الموضع |
| --- | --- |
| `vite.config.ts` | القيمة الافتراضية لـ `base` |
| `.github/workflows/deploy.yml` | `VITE_BASE_PATH` في خطوة Build |
| `.github/workflows/quality.yml` | `VITE_BASE_PATH` في خطوة Build |
| `playwright.config.ts` | `baseURL` و `url` |

إن غيّرت اسم المستودع، غيّر الأربعة معاً وإلا ظهرت صفحة بيضاء.

## 🚀 خطوات النشر

1. `Settings ← Pages ← Source = GitHub Actions` — **خطوة يدوية إجبارية مرة واحدة.**
2. `Settings ← Secrets and variables ← Actions` — أضف `VITE_ORDER_WEB_APP_URL`.
3. ادفع إلى `main`. يعمل `deploy.yml` تلقائياً.
4. تابع التقدم في تبويب **Actions**.

## 🧪 البناء محلياً

```bash
npm ci
VITE_BASE_PATH=/ npm run build
npm run preview -- --port 4173
```

ثم افتح `http://localhost:4173/`.

## 🧯 حل المشكلات

| العرض | السبب | الحل |
| --- | --- | --- |
| صفحة بيضاء | `base` لا يطابق مسار النشر | وحّد المواضع الأربعة أعلاه |
| 404 على كل الأصول | نفس السبب | افحص `dist/index.html` — يجب أن يحوي `/assets/` |
| CI أخضر والموقع أبيض | خطوة الحارس تطابق `/assets/` بدل `src="/assets/` | راجع خطوة Guard في `deploy.yml` |
| `Failed to create deployment (404)` | مصدر Pages غير مضبوط | نفّذ الخطوة 1 |
| الطلبات لا تُرسل | السر مفقود | نفّذ الخطوة 2 |
| اختبارات e2e تفشل | `playwright.config.ts` لا يطابق `base` | وحّدهما |
