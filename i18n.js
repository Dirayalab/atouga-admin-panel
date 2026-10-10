(function () {
  'use strict';

  const translations = {
    ar: {
      login: 'تسجيل الدخول',
      lang: 'اللغة',
      loginTitle: 'لوحة إدارة ATOGA — دخول المدير العام',
      loginSubtitle: 'الدخول مقصور على المدير العام (Super Admin)',
      usernameLabel: 'اسم المستخدم (يوزر نيم)',
      passwordLabel: 'كلمة المرور',
      usernamePlaceholder: 'أدخل اسم المستخدم',
      passwordPlaceholder: '••••••••',
      invalidUser: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
      sessionExpired: 'انتهت الجلسة. سجّل الدخول من جديد.',
      accessDeniedPanel: 'Access denied. Only a Super Admin can access this panel.',
      dashboardTitle: 'لوحة إدارة ATOGA',
      requestsTab: 'طلبات الوصول',
      createTab: 'إنشاء حساب',
      accountsTab: 'الحسابات',
      requestsPending: 'الطلبات المعلّقة',
      refresh: 'تحديث',
      logout: 'تسجيل الخروج',
      createTitle: 'إنشاء حساب جديد (يوزر نيم + باسورد، بدون انتظار)',
      usernameCreate: 'اسم المستخدم (يوزر نيم)',
      passwordCreate: 'كلمة المرور (6 أحرف على الأقل)',
      roleLabel: 'الدور',
      roleManager: 'مدير (Manager)',
      roleMarketer: 'مسوّق (Marketer)',
      roleDriver: 'سائق (Driver)',
      rolePackager: 'معبئ (Packager)',
      fullNameOptional: 'الاسم الكامل (اختياري)',
      phoneOptional: 'رقم الهاتف (اختياري)',
      createBtn: 'إنشاء الحساب',
      createHint: 'يُفعَّل الحساب فوراً ويمكن تسليمه للمستخدم مباشرة: يفتح تطبيق مانجر بـ اسم المستخدم وكلمة المرور دون أي طلب.',
      usernameInvalid: 'اسم المستخدم: 3-30 حرفاً (حروف/أرقام/نقطة/شرطة) فقط.',
      passwordMin: 'كلمة المرور 6 أحرف على الأقل.',
      accountCreated: 'تم إنشاء الحساب: %s (%s)',
      accountsAll: 'جميع الحسابات',
      protectedNote: 'الحساب الرئيسي (dirayalab@gmail.com) محمي: لا يُحذف ولا يُجمّد ولا يتغير اسم دخوله.',
      edit: 'تعديل',
      changePassword: 'كلمة المرور',
      freeze: 'تجميد',
      unfreeze: 'تفعيل',
      delete: 'حذف نهائي',
      primaryBadge: 'رئيسي',
      frozenBadge: 'مجمّد',
      approveManager: 'اعتماد كمدير',
      approveMarketer: 'اعتماد كمسوّق',
      reject: 'رفض',
      requestedAt: 'تاريخ الطلب: %s',
      loadingRequests: 'جارٍ تحميل الطلبات...',
      cantLoadRequests: 'تعذّر تحميل الطلبات',
      noPending: 'لا توجد طلبات معلّقة حالياً.',
      noAccounts: 'لا توجد حسابات بعد.',
      modalCancel: 'إلغاء',
      modalSave: 'حفظ',
      modalChangePassword: 'تغيير كلمة المرور',
      modalDelete: 'حذف الحساب',
      deleteConfirm: 'سيُحذف الحساب «%s» نهائياً مع صلاحياته. متابعة؟',
      savedChanges: 'تم حفظ التعديلات.',
      cantEdit: 'فشلت العملية: %s',
      pwdNew: 'كلمة المرور الجديدة',
      pwdConfirm: 'تأكيد كلمة المرور',
      pwdMismatch: 'كلمتا المرور غير متطابقتين.',
      pwdChanged: 'تم تغيير كلمة المرور.',
      accountFrozen: 'تم تجميد الحساب.',
      accountUnfrozen: 'تم تفعيل الحساب.',
      accountDeleted: 'تم حذف الحساب.',
      requestApprovedManager: 'تم اعتماد الطلب كمدير.',
      requestApprovedMarketer: 'تم اعتماد الطلب كمسوّق.',
      requestRejected: 'تم رفض الطلب.',
    },
    fr: {
      login: 'Connexion',
      lang: 'Langue',
      loginTitle: 'Panneau d\'administration ATOGA — Connexion Super Admin',
      loginSubtitle: 'Accès réservé au Super Administrateur',
      usernameLabel: 'Nom d\'utilisateur (username)',
      passwordLabel: 'Mot de passe',
      usernamePlaceholder: 'Entrez votre nom d\'utilisateur',
      passwordPlaceholder: '••••••••',
      invalidUser: 'Nom d\'utilisateur ou mot de passe incorrect.',
      sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
      accessDeniedPanel: 'Accès refusé. Seul un Super Admin peut accéder à ce panneau.',
      dashboardTitle: 'Panneau d\'administration ATOGA',
      requestsTab: 'Demandes d\'accès',
      createTab: 'Créer un compte',
      accountsTab: 'Comptes',
      requestsPending: 'Demandes en attente',
      refresh: 'Actualiser',
      logout: 'Déconnexion',
      createTitle: 'Créer un compte sans attente (nom d\'utilisateur + mot de passe)',
      usernameCreate: 'Nom d\'utilisateur *',
      passwordCreate: 'Mot de passe * (au moins 6 caractères)',
      roleLabel: 'Rôle',
      roleManager: 'Gestionnaire',
      roleMarketer: 'Commercial',
      roleDriver: 'Livreur',
      rolePackager: 'Préparateur',
      fullNameOptional: 'Nom complet (facultatif)',
      phoneOptional: 'Téléphone (facultatif)',
      createBtn: 'Créer le compte',
      createHint: 'Le compte est activé immédiatement — prêt à être utilisé dans l\'application Manager.',
      usernameInvalid: 'Nom d\'utilisateur: 3-30 caractères (lettres/chiffres/point/tiret) uniquement.',
      passwordMin: 'Mot de passe: au moins 6 caractères.',
      accountCreated: 'Compte créé: %s (%s)',
      accountsAll: 'Tous les comptes',
      protectedNote: 'Le compte principal (dirayalab@gmail.com) est protégé: non supprimable, non gelé, nom d\'accès immuable.',
      edit: 'Modifier',
      changePassword: 'Mot de passe',
      freeze: 'Geler',
      unfreeze: 'Activer',
      delete: 'Supprimer définitivement',
      primaryBadge: 'Principal',
      frozenBadge: 'Gelé',
      approveManager: 'Approuver comme Gestionnaire',
      approveMarketer: 'Approuver comme Commercial',
      reject: 'Rejeter',
      requestedAt: 'Date de la demande: %s',
      loadingRequests: 'Chargement des demandes...',
      cantLoadRequests: 'Impossible de charger les demandes',
      noPending: 'Aucune demande en attente.',
      noAccounts: 'Aucun compte pour le moment.',
      modalCancel: 'Annuler',
      modalSave: 'Enregistrer',
      modalChangePassword: 'Changer le mot de passe',
      modalDelete: 'Supprimer le compte',
      deleteConfirm: 'Le compte «%s» sera supprimé définitivement. Continuer ?',
      savedChanges: 'Modifications enregistrées.',
      cantEdit: 'Échec: %s',
      pwdNew: 'Nouveau mot de passe',
      pwdConfirm: 'Confirmer le mot de passe',
      pwdMismatch: 'Les mots de passe ne correspondent pas.',
      pwdChanged: 'Mot de passe modifié.',
      accountFrozen: 'Compte gelé.',
      accountUnfrozen: 'Compte activé.',
      accountDeleted: 'Compte supprimé.',
      requestApprovedManager: 'Demande approuvée (Gestionnaire).',
      requestApprovedMarketer: 'Demande approuvée (Commercial).',
      requestRejected: 'Demande rejetée.',
    },
  };

  const store = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (_) {}
  };
  const getLang = () => {
    try {
      const l = localStorage.getItem('lang');
      if (l === 'fr' || l === 'ar') {
        return l;
      }
    } catch (_) {}
    return 'ar';
  };

  function t(key, ...args) {
    const l = getLang();
    const dict = translations[l] || translations.ar;
    let text = dict[key] || translations.ar[key] || key;
    for (let i = 0; i < args.length; i++) {
      text = text.replace('%s', args[i]);
    }
    return text;
  }

  function applyI18n() {
    const lang = getLang();
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (el.tagName === 'INPUT' && el.placeholder !== undefined) {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
  }

  window.I18N = {
    t: t,
    apply: applyI18n,
    getLang: getLang,
    setLang: function (l) {
      store('lang', l);
      applyI18n();
    },
  };
})();
