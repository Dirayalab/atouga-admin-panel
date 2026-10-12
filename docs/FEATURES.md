# الميزات — Features
> عربي / English — صفحة يدوية تُحدَّث عند إضافة ميزة. Hand-maintained.

## الدخول — Login
- البريد/كلمة المرور + تحقق `super_admin` — email/password + super_admin check.
- إعادة توجيه تلقائية عند انتهاء الجلسة أو الحجب — session/denial redirects.

## الأقسام — Tabs
- **طلبات الوصول**: اعتماد كمدير/مسوّق أو رفض (RPCs ذرّية) — access requests.
- **إنشاء حساب**: يوزر نيم + باسورد + دور فوراً — instant account creation.
- **الحسابات**: تعديل/كلمة مرور/تجميد/تفعيل/حذف (الرئيسي محمي) — account management.
- **إخراج التطبيق من التجربة (Go Live)**: ملخّص أعداد كل الجداول، نسخة احتياطية JSON، حذف انتقائي
  (حسابات/كوبونات/طلبات وعناصرها + حركات محفظة + تصفير أرصدة تلقائي/سلات/مفضلة/عناوين/منتجات/تصنيفات/بنرات/حملات/مجدولة/طلبات وصول)
  بتأكيد كتابة «حذف» — granular test-data cleanup with backup + typed confirm.

## الأمان — Security
- مفتاح publishable فقط؛ الحماية الفعلية في RLS والدوال — publishable keys only.
- لا تُحذف بالنظافة: روابط الدعم، الأوقات، الورديات، مناطق التوصيل — protected config sets.

---
*راجع `docs/ATOGA_SYSTEM_DOCUMENTATION.html` للتوثيق المعماري الكامل.*
