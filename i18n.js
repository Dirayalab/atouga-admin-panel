(function () {
  'use strict';

  const translations = {
    ar: {
      login: 'ØªØ³Ø¬ÙÙ Ø§ÙØ¯Ø®ÙÙ',
      lang: 'Ø§ÙÙØºØ©',
      loginTitle: 'ÙÙØ­Ø© Ø¥Ø¯Ø§Ø±Ø© ATOGA â Ø¯Ø®ÙÙ Ø§ÙÙØ¯ÙØ± Ø§ÙØ¹Ø§Ù',
      loginSubtitle: 'Ø§ÙØ¯Ø®ÙÙ ÙÙØµÙØ± Ø¹ÙÙ Ø§ÙÙØ¯ÙØ± Ø§ÙØ¹Ø§Ù (Super Admin)',
      usernameLabel: 'Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù (ÙÙØ²Ø± ÙÙÙ)',
      passwordLabel: 'ÙÙÙØ© Ø§ÙÙØ±ÙØ±',
      usernamePlaceholder: 'Ø£Ø¯Ø®Ù Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù',
      passwordPlaceholder: 'â¢â¢â¢â¢â¢â¢â¢â¢',
      invalidUser: 'Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù Ø£Ù ÙÙÙØ© Ø§ÙÙØ±ÙØ± ØºÙØ± ØµØ­ÙØ­Ø©.',
      sessionExpired: 'Ø§ÙØªÙØª Ø§ÙØ¬ÙØ³Ø©. Ø³Ø¬ÙÙ Ø§ÙØ¯Ø®ÙÙ ÙÙ Ø¬Ø¯ÙØ¯.',
      accessDeniedPanel: 'Access denied. Only a Super Admin can access this panel.',
      dashboardTitle: 'ÙÙØ­Ø© Ø¥Ø¯Ø§Ø±Ø© ATOGA',
      requestsTab: 'Ø·ÙØ¨Ø§Øª Ø§ÙÙØµÙÙ',
      createTab: 'Ø¥ÙØ´Ø§Ø¡ Ø­Ø³Ø§Ø¨',
      accountsTab: 'Ø§ÙØ­Ø³Ø§Ø¨Ø§Øª',
      requestsPending: 'Ø§ÙØ·ÙØ¨Ø§Øª Ø§ÙÙØ¹ÙÙÙØ©',
      refresh: 'ØªØ­Ø¯ÙØ«',
      logout: 'ØªØ³Ø¬ÙÙ Ø§ÙØ®Ø±ÙØ¬',
      createTitle: 'Ø¥ÙØ´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø¬Ø¯ÙØ¯ (ÙÙØ²Ø± ÙÙÙ + Ø¨Ø§Ø³ÙØ±Ø¯Ø Ø¨Ø¯ÙÙ Ø§ÙØªØ¸Ø§Ø±)',
      usernameCreate: 'Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù (ÙÙØ²Ø± ÙÙÙ)',
      passwordCreate: 'ÙÙÙØ© Ø§ÙÙØ±ÙØ± (6 Ø£Ø­Ø±Ù Ø¹ÙÙ Ø§ÙØ£ÙÙ)',
      roleLabel: 'Ø§ÙØ¯ÙØ±',
      roleManager: 'ÙØ¯ÙØ± (Manager)',
      roleMarketer: 'ÙØ³ÙÙÙ (Marketer)',
      roleDriver: 'Ø³Ø§Ø¦Ù (Driver)',
      roleSuperAdmin: 'ÙØ¯ÙØ± Ø¹Ø§Ù',
      rolePackager: 'ÙØ¹Ø¨Ø¦ (Packager)',
      fullNameOptional: 'Ø§ÙØ§Ø³Ù Ø§ÙÙØ§ÙÙ (Ø§Ø®ØªÙØ§Ø±Ù)',
      phoneOptional: 'Ø±ÙÙ Ø§ÙÙØ§ØªÙ (Ø§Ø®ØªÙØ§Ø±Ù)',
      createBtn: 'Ø¥ÙØ´Ø§Ø¡ Ø§ÙØ­Ø³Ø§Ø¨',
      createHint: 'ÙÙÙØ¹ÙÙÙ Ø§ÙØ­Ø³Ø§Ø¨ ÙÙØ±Ø§Ù ÙÙÙÙÙ ØªØ³ÙÙÙÙ ÙÙÙØ³ØªØ®Ø¯Ù ÙØ¨Ø§Ø´Ø±Ø©: ÙÙØªØ­ ØªØ·Ø¨ÙÙ ÙØ§ÙØ¬Ø± Ø¨Ù Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù ÙÙÙÙØ© Ø§ÙÙØ±ÙØ± Ø¯ÙÙ Ø£Ù Ø·ÙØ¨.',
      usernameInvalid: 'Ø§Ø³Ù Ø§ÙÙØ³ØªØ®Ø¯Ù: 3-30 Ø­Ø±ÙØ§Ù (Ø­Ø±ÙÙ/Ø£Ø±ÙØ§Ù/ÙÙØ·Ø©/Ø´Ø±Ø·Ø©) ÙÙØ·.',
      passwordMin: 'ÙÙÙØ© Ø§ÙÙØ±ÙØ± 6 Ø£Ø­Ø±Ù Ø¹ÙÙ Ø§ÙØ£ÙÙ.',
      accountCreated: 'ØªÙ Ø¥ÙØ´Ø§Ø¡ Ø§ÙØ­Ø³Ø§Ø¨: %s (%s)',
      accountsAll: 'Ø¬ÙÙØ¹ Ø§ÙØ­Ø³Ø§Ø¨Ø§Øª',
      protectedNote: 'Ø§ÙØ­Ø³Ø§Ø¨ Ø§ÙØ±Ø¦ÙØ³Ù (dirayalab@gmail.com) ÙØ­ÙÙ: ÙØ§ ÙÙØ­Ø°Ù ÙÙØ§ ÙÙØ¬ÙÙØ¯ ÙÙØ§ ÙØªØºÙØ± Ø§Ø³Ù Ø¯Ø®ÙÙÙ.',
      edit: 'ØªØ¹Ø¯ÙÙ',
      changePassword: 'ÙÙÙØ© Ø§ÙÙØ±ÙØ±',
      freeze: 'ØªØ¬ÙÙØ¯',
      unfreeze: 'ØªÙØ¹ÙÙ',
      delete: 'Ø­Ø°Ù ÙÙØ§Ø¦Ù',
      primaryBadge: 'Ø±Ø¦ÙØ³Ù',
      frozenBadge: 'ÙØ¬ÙÙØ¯',
      approveManager: 'Ø§Ø¹ØªÙØ§Ø¯ ÙÙØ¯ÙØ±',
      approveMarketer: 'Ø§Ø¹ØªÙØ§Ø¯ ÙÙØ³ÙÙÙ',
      reject: 'Ø±ÙØ¶',
      requestedAt: 'ØªØ§Ø±ÙØ® Ø§ÙØ·ÙØ¨: %s',
      loadingRequests: 'Ø¬Ø§Ø±Ù ØªØ­ÙÙÙ Ø§ÙØ·ÙØ¨Ø§Øª...',
      cantLoadRequests: 'ØªØ¹Ø°ÙØ± ØªØ­ÙÙÙ Ø§ÙØ·ÙØ¨Ø§Øª',
      noPending: 'ÙØ§ ØªÙØ¬Ø¯ Ø·ÙØ¨Ø§Øª ÙØ¹ÙÙÙØ© Ø­Ø§ÙÙØ§Ù.',
      noAccounts: 'ÙØ§ ØªÙØ¬Ø¯ Ø­Ø³Ø§Ø¨Ø§Øª Ø¨Ø¹Ø¯.',
      modalCancel: 'Ø¥ÙØºØ§Ø¡',
      modalSave: 'Ø­ÙØ¸',
      modalChangePassword: 'ØªØºÙÙØ± ÙÙÙØ© Ø§ÙÙØ±ÙØ±',
      modalDelete: 'Ø­Ø°Ù Ø§ÙØ­Ø³Ø§Ø¨',
      deleteConfirm: 'Ø³ÙÙØ­Ø°Ù Ø§ÙØ­Ø³Ø§Ø¨ Â«%sÂ» ÙÙØ§Ø¦ÙØ§Ù ÙØ¹ ØµÙØ§Ø­ÙØ§ØªÙ. ÙØªØ§Ø¨Ø¹Ø©Ø',
      savedChanges: 'ØªÙ Ø­ÙØ¸ Ø§ÙØªØ¹Ø¯ÙÙØ§Øª.',
      cantEdit: 'ÙØ´ÙØª Ø§ÙØ¹ÙÙÙØ©: %s',
      pwdNew: 'ÙÙÙØ© Ø§ÙÙØ±ÙØ± Ø§ÙØ¬Ø¯ÙØ¯Ø©',
      pwdConfirm: 'ØªØ£ÙÙØ¯ ÙÙÙØ© Ø§ÙÙØ±ÙØ±',
      pwdMismatch: 'ÙÙÙØªØ§ Ø§ÙÙØ±ÙØ± ØºÙØ± ÙØªØ·Ø§Ø¨ÙØªÙÙ.',
      pwdChanged: 'ØªÙ ØªØºÙÙØ± ÙÙÙØ© Ø§ÙÙØ±ÙØ±.',
      accountFrozen: 'ØªÙ ØªØ¬ÙÙØ¯ Ø§ÙØ­Ø³Ø§Ø¨.',
      accountUnfrozen: 'ØªÙ ØªÙØ¹ÙÙ Ø§ÙØ­Ø³Ø§Ø¨.',
      accountDeleted: 'ØªÙ Ø­Ø°Ù Ø§ÙØ­Ø³Ø§Ø¨.',
      requestApprovedManager: 'ØªÙ Ø§Ø¹ØªÙØ§Ø¯ Ø§ÙØ·ÙØ¨ ÙÙØ¯ÙØ±.',
      requestApprovedMarketer: 'ØªÙ Ø§Ø¹ØªÙØ§Ø¯ Ø§ÙØ·ÙØ¨ ÙÙØ³ÙÙÙ.',
      requestRejected: 'ØªÙ Ø±ÙØ¶ Ø§ÙØ·ÙØ¨.',
    },
    fr: {
      login: 'Connexion',
      lang: 'Langue',
      loginTitle: 'Panneau d\'administration ATOGA â Connexion Super Admin',
      loginSubtitle: 'AccÃ¨s rÃ©servÃ© au Super Administrateur',
      usernameLabel: 'Nom d\'utilisateur (username)',
      passwordLabel: 'Mot de passe',
      usernamePlaceholder: 'Entrez votre nom d\'utilisateur',
      passwordPlaceholder: 'â¢â¢â¢â¢â¢â¢â¢â¢',
      invalidUser: 'Nom d\'utilisateur ou mot de passe incorrect.',
      sessionExpired: 'Session expirÃ©e. Veuillez vous reconnecter.',
      accessDeniedPanel: 'AccÃ¨s refusÃ©. Seul un Super Admin peut accÃ©der Ã  ce panneau.',
      dashboardTitle: 'Panneau d\'administration ATOGA',
      requestsTab: 'Demandes d\'accÃ¨s',
      createTab: 'CrÃ©er un compte',
      accountsTab: 'Comptes',
      requestsPending: 'Demandes en attente',
      refresh: 'Actualiser',
      logout: 'DÃ©connexion',
      createTitle: 'CrÃ©er un compte sans attente (nom d\'utilisateur + mot de passe)',
      usernameCreate: 'Nom d\'utilisateur *',
      passwordCreate: 'Mot de passe * (au moins 6 caractÃ¨res)',
      roleLabel: 'RÃ´le',
      roleManager: 'Gestionnaire',
      roleMarketer: 'Commercial',
      roleDriver: 'Livreur',
      roleSuperAdmin: 'Super Administrateur',
      rolePackager: 'PrÃ©parateur',
      fullNameOptional: 'Nom complet (facultatif)',
      phoneOptional: 'TÃ©lÃ©phone (facultatif)',
      createBtn: 'CrÃ©er le compte',
      createHint: 'Le compte est activÃ© immÃ©diatement â prÃªt Ã  Ãªtre utilisÃ© dans l\'application Manager.',
      usernameInvalid: 'Nom d\'utilisateur: 3-30 caractÃ¨res (lettres/chiffres/point/tiret) uniquement.',
      passwordMin: 'Mot de passe: au moins 6 caractÃ¨res.',
      accountCreated: 'Compte crÃ©Ã©: %s (%s)',
      accountsAll: 'Tous les comptes',
      protectedNote: 'Le compte principal (dirayalab@gmail.com) est protÃ©gÃ©: non supprimable, non gelÃ©, nom d\'accÃ¨s immuable.',
      edit: 'Modifier',
      changePassword: 'Mot de passe',
      freeze: 'Geler',
      unfreeze: 'Activer',
      delete: 'Supprimer dÃ©finitivement',
      primaryBadge: 'Principal',
      frozenBadge: 'GelÃ©',
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
      deleteConfirm: 'Le compte Â«%sÂ» sera supprimÃ© dÃ©finitivement. Continuer ?',
      savedChanges: 'Modifications enregistrÃ©es.',
      cantEdit: 'Ãchec: %s',
      pwdNew: 'Nouveau mot de passe',
      pwdConfirm: 'Confirmer le mot de passe',
      pwdMismatch: 'Les mots de passe ne correspondent pas.',
      pwdChanged: 'Mot de passe modifiÃ©.',
      accountFrozen: 'Compte gelÃ©.',
      accountUnfrozen: 'Compte activÃ©.',
      accountDeleted: 'Compte supprimÃ©.',
      requestApprovedManager: 'Demande approuvÃ©e (Gestionnaire).',
      requestApprovedMarketer: 'Demande approuvÃ©e (Commercial).',
      requestRejected: 'Demande rejetÃ©e.',
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
