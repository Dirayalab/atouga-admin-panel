# GitHub Admin Panel — طلبات الوصول (Super Admin)

لوحة ويب خفيفة (HTML/CSS/Vanilla JS + Supabase JS) لإدارة طلبات الوصول
إلى لوحة الإدارة: اعتماد كمدير أو كمسوّق، أو رفض الطلب.

الصلاحية عبر RLS وخوادم الدوال في المشروع:
- `admin_approve_access_request(request_id, role)` — ذرّية: توافق + منح دور في `staff_roles`.
- `admin_reject_access_request(request_id)` — رفض الطلب.
- الدخول محصور بـ `super_admin` عبر `get_my_staff_role`.

## النشر على GitHub Pages (مستودع خاص)

1. ارفع محتويات هذا المجلد (الملفات الستة) إلى مستودعك الخاص.
2. الإعدادات → Pages → المصدر: `Deploy from a branch` → `main` → مسار `/ (root)`.
3. سيتاح الموقع على:
   `https://<username>.github.io/<repo>/`
   — افتح `index.html` من الرابط.

## الإعدادات المطلوبة في Supabase

1. `config.js`: القيمان الافتراضيتان هما لمشروعك الحالي
   (`SUPABASE_URL` + مفتاح **publishable فقط** — لا تضع service_role هنا أبداً).
2. المصادقة بالبريد/كلمة المرور لا تتطلب رابط إعادة توجيه.
3. إن واجهت خطأ CORS في المتصفح:
   أضِف رابط الصفحة إلى
   `Dashboard → Authentication → URL Configuration → Redirect URLs`
   (مثلاً `https://<username>.github.io/<repo>`).
   *في معظم الحالات يعمل دون إعداد لأن Supabase يسمح بالأصول عموماً.*

## الاختبار المحلي

```bash
python -m http.server 8091 --bind 127.0.0.1
```
ثم افتح `http://127.0.0.1:8091/index.html`.

## ملاحظات أمنية

- المفتاح المستخدم هو publishable/anon (آمن للنشر).
- الوصول للطلبات وإجراء الاعتماد محمي من جهة الخادم:
  سياسات RLS على `admin_requests` + دوال `SECURITY DEFINER` تتحقق من أن
  المستدعي `super_admin` — حماية الصفحة في المتصفح طبقة واجهة فقط وليست حاجز الأمان.
- حال أُلغيت جلسة المدير العام، تُعاد الصفحة تلقائياً إلى `index.html`.
