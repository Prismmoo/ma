# 🚀 دليل النشر — PRISM (GitHub Pages)

## 📌 الرابط الإنتاجي
- **الموقع المباشر:** `https://noureddinelmobaraki-web.github.io/prism/`

## ⚙️ إعداد مسار القاعدة (`base`)
يتم استضافة التطبيق على GitHub Pages تحت مسار المجلد `prism`.
- تم ضبط `base` في `vite.config.ts` ليكون افتراضياً `/prism/` أو يُقرأ من المتغير `VITE_BASE_PATH`.
- سير عمل GitHub Actions يحقن تلقائياً `VITE_BASE_PATH: /prism/` وقت البناء لضمان تحميل جميع الأصول من المسار الصحيح.

## 🔐 أسرار ومتغيرات بيئة GitHub (GitHub Secrets)

| اسم السر | الوصف | إجباري؟ |
|---|---|---|
| `VITE_ORDER_WEB_APP_URL` | رابط تطبيق Google Apps Script لاستقبال طلبات الشراء والعملاء | نعم (لتفعيل إرسال الطلبات) |

> ⚠️ **ملاحظة أمان**: أي متغير بيئة يبدأ بـ `VITE_` يتم تضمينه داخل حزمة العميل (JavaScript Bundle). رابط Apps Script عمومي بطبيعته ولا يحتوي على أي مفاتيح سرية.

## 🛠️ خطوات البناء والمعاينة محلياً
1. تثبيت الاعتمادات بالضبط:
   ```bash
   npm ci
   ```
2. بناء الحزمة بالمسار الصحيح:
   ```bash
   VITE_BASE_PATH=/prism/ npm run build
   ```
3. معاينة الحزمة محلياً:
   ```bash
   npm run preview
   ```
   وافتح الرابط: `http://localhost:4173/prism/`

## 🚨 استكشاف الأخطاء وإصلاحها (Troubleshooting)

### 1. ظهور صفحة بيضاء عند زيارة الموقع
- **السبب**: عدم تطابق مسار الأصول بسبب `base` خاطئ.
- **الحل**:
  - التأكد من فتح الملف `dist/index.html` والتحقق من أن مسارات الأصول تبدأ بـ `/prism/assets/`.
  - تحقق في سير عمل CI من نجاح خطوة `Guard against wrong base path`.

### 2. خطأ في إرسال الطلبات (Order Receiver Not Configured)
- **السبب**: عدم إضافة `VITE_ORDER_WEB_APP_URL` في GitHub Repository Secrets.
- **الحل**: انتقل إلى Settings -> Secrets and variables -> Actions في المستودع وأضف `VITE_ORDER_WEB_APP_URL`.
