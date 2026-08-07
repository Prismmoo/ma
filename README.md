# 🎨 PRISM — NN Cyberspace
### <sub>معرض فني رقمي ومتجر لوحات فيزيائية</sub>

[![Deploy](https://github.com/noureddinelmobaraki-web/prism/actions/workflows/deploy.yml/badge.svg)](https://github.com/noureddinelmobaraki-web/prism/actions/workflows/deploy.yml)
![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-UNLICENSED-blue)

**الموقع المباشر:** https://noureddinelmobaraki-web.github.io/prism/

## 🗺️ المحتويات
- [الميزات](#-الميزات)
- [التقنيات](#-التقنيات)
- [البنية](#-البنية)
- [البدء السريع](#-البدء-السريع)
- [الأوامر](#-الأوامر)
- [الاختبارات والجودة](#-الاختبارات-والجودة)
- [النشر](#-النشر)
- [الأمان والمتغيرات](#-الأمان-والمتغيرات)
- [الرخصة](#-الرخصة)

## ✨ الميزات
- **معرض رقمي فاخر**: تصفح وتصنيف اللوحات الفنية والأعمال السايبربانك.
- **استوديو التخصيص والستيكرات**: تعديل وأثرة الاستيكرات وإضافة نصوص وخطوط وألوان حبر مخصصة.
- **محاكي الجدار الافتراضي (Wall Visualizer)**: استعراض اللوحات والمقاسات والإطارات على جدران الغرف الافتراضية.
- **حزم ومجموعات خاصة (Packs)**: تصفح حزم اللوحات الفنية وإنشاء مجموعات مخصصة.
- **طلب وشراء سلس**: سلة مشتريات محلية ومعالجة طلبات آمنة عبر Google Apps Script.

## 🧱 التقنيات
- **الواجهة الأدوية**: React 19, Vite 6, TypeScript 5.8
- **التنسيق والأنيميشن**: Tailwind CSS 4, Motion (Framer Motion)
- **الأيقونات**: Lucide React
- **الاختبارات والـ CI/CD**: Node test runner (`tsx --test`), Playwright E2E, GitHub Actions
- **المنصة واستضافة الموقع**: GitHub Pages

## 🏛️ البنية
- `src/App.tsx`: مكون التطبيق الرئيسي والملاحة بين العروض
- `src/components/`: مكونات الواجهة (المعرض، المحاكي، الاستوديو، الحزم)
- `src/lib/`: مكتبات العمل المساعدة (تسليم الطلبات، التخصيص، الستيكرات، التسعير)
- `scripts/`: أدوات إدارة وتدقيق كود وتدوير الكتالوجات الفنية
- `tests/`: اختبارات الوحدة التحليلية وتحويلات الستيكرات
- `e2e/`: اختبارات الدخان للواجهة بواسطة Playwright

## ⚡ البدء السريع
```bash
git clone https://github.com/noureddinelmobaraki-web/prism.git
cd prism
npm ci
npm run dev
```

## 🛠️ الأوامر
| الأمر | الوصف |
|---|---|
| `npm run dev` | تشغيل خادم التطوير المحلي على الخادم المنفصل |
| `npm run build` | بناء حزمة الإنتاج داخل مجلد `dist` |
| `npm run preview` | معاينة حزمة الإنتاج مبنية محلياً |
| `npm run lint` | فحص الأنواع بدون إصدار خوارزميات (`tsc --noEmit`) |
| `npm run test` | تشغيل اختبارات الوحدة القياسية بـ Node native runner |
| `npm run e2e` | تشغيل اختبارات الدخان عبر Playwright |
| `npm run audit` | تدقيق الأمان المعتمد للحزم بدقة عالية |
| `npm run art:sync` | مزامنة كتالوج اللوحات والأعمال الفنية |
| `npm run art:verify` | التحقق من صحة روابط وصور اللوحات الفنية |
| `npm run report:bundle` | بناء وإصدار تقرير بحجم وشكل الحزم المجمعة |
| `npm run report:source` | تقرير وتحليل مصدر الكود |
| `npm run audit:catalog` | التدقيق والتحقق من سلامة بيانات الكتالوج |

## 🧪 الاختبارات والجودة
تدار جودة الكود واختباراته بواسطة:
1. **اختبارات الوحدة**: `npm test` للتحقق من خوارزميات الستيكرات والتحويلات.
2. **فحص الأنواع**: `npm run lint` باستخدام TypeScript.
3. **اختبارات الدخان E2E**: `npm run e2e` بواسطة Playwright للتأكد من إقلاع الموقع وصحة المسارات والأصول.
4. **تدقيق الأمان والبيانات**: `npm run audit` و `npm run audit:catalog`.

## 🚀 النشر
يتم النشر آلياً على **GitHub Pages** عند الدفع إلى فرع `main`. تفاصيل البناء وإعدادات السير موجودة في [DEPLOYMENT.md](DEPLOYMENT.md).

## 🔒 الأمان والمتغيرات
تنبيه أمان مهم:
- المتغير `VITE_ORDER_WEB_APP_URL` **يُحقن مباشرة في حزمة JavaScript العامة وقت البناء** وهو مقروء للجميع في العميل.
- هو عبارة عن رابط عمومي مخصص لاستقبال الطلبات عبر Google Apps Script بدون كلمة سر أو مفتاح خاص.
- **أي سر حقيقي يجب ألا يوضع إطلاقاً في أي متغير يبدأ بـ `VITE_`**.

## 📄 الرخصة
UNLICENSED — جميع الحقوق محفوظة لـ NN Cyberspace.
