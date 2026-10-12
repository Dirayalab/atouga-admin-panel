// مشارك مشترك: تهيئة Supabase + أدوات الواجهة (توست/تواريخ/صلاحيات).
(function () {
  'use strict';

  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error('config.js: SUPABASE_URL / SUPABASE_ANON_KEY غير معرّفين');
  }

  const supabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY,
  );

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/i;

  let toastContainer = null;

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[m];
    });
  }

  function roleLabel(role) {
    switch (role) {
      case 'super_admin':
        return window.I18N ? window.I18N.t('roleSuperAdmin') : 'مدير عام';
      case 'manager':
        return window.I18N ? window.I18N.t('roleManager') : 'مدير (Manager)';
      case 'marketer':
        return window.I18N ? window.I18N.t('roleMarketer') : 'مسوّق (Marketer)';
      case 'driver':
        return window.I18N ? window.I18N.t('roleDriver') : 'سائق (Driver)';
      case 'packager':
        return window.I18N ? window.I18N.t('rolePackager') : 'معبئ (Packager)';
      case 'driver_packager':
        return window.I18N ? window.I18N.t('roleDriverPackager') : 'موظف (سائق ومعبئ)';
      default:
        return esc(role);
    }
  }

  function toast(message, type) {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    const el = document.createElement('div');
    el.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () {
        el.remove();
      }, 300);
    }, 4000);
  }

  function friendlyError(message) {
    const msg = String(message || '');
    if (/invalid login credentials|invalid_grant|invalid_credentials/i.test(msg)) {
      return window.I18N ? window.I18N.t('invalidUser') : 'اسم المستخدم أو كلمة المرور غير صحيحة.';
    }
    if (/email_not_confirmed|email not confirmed/i.test(msg)) {
      return window.I18N ? window.I18N.t('emailNotConfirmed') : 'يرجى تأكيد البريد الإلكتروني أولاً.';
    }
    if (/Failed to fetch|NetworkError/i.test(msg)) {
      return window.I18N ? window.I18N.t('networkError') : 'تعذّر الاتصال بالخادم. تحقق من الشبكة.';
    }
    return msg || (window.I18N ? window.I18N.t('unexpectedError') : 'حدث خطأ غير متوقع.');
  }

  /** يستخرج رسالة الخطأ المحددة من استجابة Edge Function غير الناجحة. */
  function extractEdgeError(error) {
    try {
      const body = error && error.context ? error.context.body : null;
      if (body && typeof body === 'object') {
        const detail = body.error || body.msg || body.message;
        if (detail) {
          return String(detail);
        }
      }
    } catch (_) {
      // نعود للرسالة العامة.
    }
    return friendlyError(error && error.message);
  }

  function formatDate(iso) {
    if (!iso) {
      return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    try {
      return new Intl.DateTimeFormat('ar-DZ', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch (_) {
      return date.toLocaleString();
    }
  }

  /** يعيد الجلسة إن كان المستخدم Super Admin، وإلا يوجّه لصفحة الدخول. */
  async function requireSuperAdmin() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      window.location.replace('index.html?error=session');
      return null;
    }
    const { data: role, error } = await supabase.rpc('get_my_staff_role');
    if (error || role !== 'super_admin') {
      await supabase.auth.signOut();
      window.location.replace('index.html?error=denied');
      return null;
    }
    return data.session;
  }

  // ---------- صفحة الدخول ----------
  function initLogin() {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const errorBox = document.getElementById('errorBox');
    const submit = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const spinner = document.getElementById('submitSpinner');
    if (!form) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'denied') {
      showError(window.I18N ? window.I18N.t('accessDeniedPanel') : 'Access denied. Only a Super Admin can access this panel.');
    } else if (params.get('error') === 'session') {
      showError(window.I18N ? window.I18N.t('sessionExpired') : 'انتهت الجلسة. سجّل الدخول من جديد.');
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.classList.add('visible');
    }

    function setLoading(loading) {
      submit.disabled = loading;
      submitText.textContent = loading
        ? (window.I18N ? window.I18N.t('loadingLogin') || 'جارٍ تسجيل الدخول...' : 'جارٍ تسجيل الدخول...')
        : (window.I18N ? window.I18N.t('login') : 'تسجيل الدخول');
      spinner.style.display = loading ? '' : 'none';
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      errorBox.classList.remove('visible');
      const emailValue = email.value.trim();
      const passwordValue = password.value;
      if (!emailValue || !passwordValue) {
        showError(window.I18N ? window.I18N.t('invalidUser') : 'اسم المستخدم أو كلمة المرور غير صحيحة.');
        return;
      }
      setLoading(true);
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        });
        if (authError) {
          throw authError;
        }
        const { data: role, error: roleError } = await supabase.rpc('get_my_staff_role');
        if (roleError) {
          throw roleError;
        }
        if (role !== 'super_admin') {
          await supabase.auth.signOut();
          showError(window.I18N ? window.I18N.t('accessDeniedPanel') : 'Access denied. Only a Super Admin can access this panel.');
          return;
        }
        window.location.replace('dashboard.html');
      } catch (error) {
        showError(friendlyError(error.message));
      } finally {
        setLoading(false);
      }
    });
  }

  // ---------- اللوحة ----------
  function initDashboard() {
    const list = document.getElementById('requestsList');
    const counter = document.getElementById('requestsCount');
    const emailEl = document.getElementById('userEmail');
    const refreshBtn = document.getElementById('refreshBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (!list) {
      return;
    }

    initCreateAccount();
    initTabs();
    initAccounts();
    initCleanup();

    (async function () {
      const session = await requireSuperAdmin();
      if (!session) {
        return;
      }
      emailEl.textContent = session.user.email || '';
      window.adminPanelMeId = session.user.id;
      await loadRequests();
      if (typeof window.adminPanelLoadCleanup === 'function') {
        window.adminPanelLoadCleanup().catch(function () {});
      }
    })();

    function initCreateAccount() {
      const form = document.getElementById('createAccountForm');
      const btn = document.getElementById('createAccountBtn');
      if (!form || !btn) {
        return;
      }
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const password = document.getElementById('newPassword').value;
          if (!USERNAME_RE.test(username) && !EMAIL_RE.test(username)) {
            toast(window.I18N ? window.I18N.t('usernameInvalid') : 'اسم المستخدم: 3-30 حرفاً (حروف/أرقام/نقطة/شرطة) فقط.', 'error');
            return;
          }
          if (password.length < 6) {
            toast(window.I18N ? window.I18N.t('passwordMin') : 'كلمة المرور 6 أحرف على الأقل.', 'error');
            return;
          }
          btn.disabled = true;
          const I18 = window.I18N;
          btn.textContent = I18 ? I18.t('creating') || 'جارٍ الإنشاء...' : 'جارٍ الإنشاء...';
        try {
          const { data, error } = await supabase.functions.invoke('admin-create-user', {
            body: {
              username: username,
              password: password,
              role: document.getElementById('newRole').value,
              full_name: document.getElementById('newName').value.trim() || undefined,
              phone: document.getElementById('newPhone').value.trim() || undefined,
            },
          });
          if (error) {
            throw error;
          }
          if (data && data.error) {
            throw new Error(data.error);
          }
          toast(
            window.I18N
              ? window.I18N.t('accountCreated', data.username, data.role)
              : 'تم إنشاء الحساب: ' + data.username + ' (' + data.role + ')',
            'success',
          );
          form.reset();
          if (typeof window.adminPanelLoadAccounts === 'function') {
            window.adminPanelLoadAccounts();
          }
        } catch (error) {
          toast(
            (window.I18N ? window.I18N.t('cantCreate') : 'فشل إنشاء الحساب') + ': ' + extractEdgeError(error),
            'error',
          );
        } finally {
          btn.disabled = false;
          btn.textContent = (window.I18N ? window.I18N.t('createBtn') : 'إنشاء الحساب');
        }
      });
    }

    refreshBtn.addEventListener('click', async function () {
      await Promise.all([
        loadRequests().catch(function () {}),
        typeof window.adminPanelLoadAccounts === 'function'
          ? window.adminPanelLoadAccounts().catch(function () {})
          : Promise.resolve(),
        typeof window.adminPanelLoadCleanup === 'function'
          ? window.adminPanelLoadCleanup().catch(function () {})
          : Promise.resolve(),
      ]);
    });

    // إعادة رسم القوائم عند تغيير اللغة.
    document.addEventListener('i18n:changed', function () {
      if (list && list.children.length > 0) {
        loadRequests().catch(function () {});
      }
      if (typeof window.adminPanelLoadAccounts === 'function') {
        window.adminPanelLoadAccounts().catch(function () {});
      }
      if (typeof window.adminPanelLoadCleanup === 'function') {
        window.adminPanelLoadCleanup().catch(function () {});
      }
    });
    logoutBtn.addEventListener('click', async function () {
      await supabase.auth.signOut();
      window.location.replace('index.html');
    });

    function setLoading(loading) {
      refreshBtn.disabled = loading;
      list.innerHTML = '';
      if (loading) {
        const div = document.createElement('div');
        div.className = 'loading';
        div.textContent = (window.I18N ? window.I18N.t('loadingRequests') : 'جارٍ تحميل الطلبات...');
        list.appendChild(div);
      }
    }

    async function loadRequests() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('admin_requests')
          .select('id, email, requested_at, status')
          .eq('status', 'pending')
          .order('requested_at', { ascending: true });
        if (error) {
          throw error;
        }
        render(data || []);
      } catch (error) {
        setLoading(false);
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = (window.I18N ? window.I18N.t('cantLoadRequests') : 'تعذّر تحميل الطلبات') + ': ' + friendlyError(error.message);
        list.appendChild(div);
        toast(window.I18N ? window.I18N.t('cantLoadRequests') : 'تعذّر تحميل الطلبات', 'error');
      }
    }

    function render(rows) {
      setLoading(false);
      counter.textContent = String(rows.length);
      if (rows.length === 0) {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = (window.I18N ? window.I18N.t('noPending') : 'لا توجد طلبات معلّقة حالياً.');
        list.appendChild(div);
        return;
      }
      rows.forEach(function (row) {
        list.appendChild(buildCard(row));
      });
    }

    function buildCard(row) {
      const card = document.createElement('div');
      card.className = 'request-card';
      card.dataset.id = row.id;

      const inner = document.createElement('div');
      inner.className = 'request-row';

      const info = document.createElement('div');
      info.className = 'request-info';
      const email = document.createElement('div');
      email.className = 'request-email';
      email.textContent = row.email;
      const date = document.createElement('div');
      date.className = 'request-date';
      date.textContent = window.I18N
        ? window.I18N.t('requestedAt', formatDate(row.requested_at))
        : 'تاريخ الطلب: ' + formatDate(row.requested_at);
      info.appendChild(email);
      info.appendChild(date);

      const actions = document.createElement('div');
      actions.className = 'request-actions';
      actions.appendChild(actionButton((window.I18N ? window.I18N.t('approveManager') : 'اعتماد كمدير'), 'btn-success', async function (btn) {
        await runAction(row.id, 'manager', btn);
      }));
      actions.appendChild(actionButton((window.I18N ? window.I18N.t('approveMarketer') : 'اعتماد كمسوّق'), 'btn-warning', async function (btn) {
        await runAction(row.id, 'marketer', btn);
      }));
      actions.appendChild(actionButton(window.I18N ? window.I18N.t('reject') : 'رفض', 'btn-danger', async function (btn) {
        await runAction(row.id, null, btn);
      }));

      inner.appendChild(info);
      inner.appendChild(actions);
      card.appendChild(inner);
      return card;
    }

    function actionButton(label, className, onClick) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn ' + className;
      btn.textContent = label;
      btn.dataset.label = label;
      btn.addEventListener('click', function () {
        onClick(btn);
      });
      return btn;
    }

    async function runAction(id, role, btn) {
      const card = btn.closest('.request-card');
      const buttons = card.querySelectorAll('button');
      buttons.forEach(function (b) {
        b.disabled = true;
      });
      btn.dataset.busy = '1';
      btn.textContent = '...';
      try {
        const result = role
          ? await supabase.rpc('admin_approve_access_request', {
              p_request_id: id,
              p_role: role,
            })
          : await supabase.rpc('admin_reject_access_request', {
              p_request_id: id,
            });
        if (result.error) {
          throw result.error;
        }
        counter.textContent = String(Math.max(0, Number(counter.textContent) - 1));
        card.remove();
        toast(
          role
            ? window.I18N
              ? window.I18N.t(role === 'manager' ? 'requestApprovedManager' : 'requestApprovedMarketer')
              : 'تم اعتماد الطلب.'
            : window.I18N
              ? window.I18N.t('requestRejected')
              : 'تم رفض الطلب.',
          'success',
        );
        if (list.children.length === 0) {
          const div = document.createElement('div');
          div.className = 'empty-state';
          div.textContent = window.I18N ? window.I18N.t('noPending') : 'لا توجد طلبات معلّقة حالياً.';
          list.appendChild(div);
        }
      } catch (error) {
        buttons.forEach(function (b) {
          b.disabled = false;
        });
        btn.textContent = btn.dataset.label || (window.I18N ? window.I18N.t('retry') : 'إعادة المحاولة');
        toast((window.I18N ? window.I18N.t('operationFailed') : 'فشلت العملية') + ': ' + friendlyError(error.message), 'error');
      }
    }

    function initTabs() {
      const tabs = document.getElementById('tabs');
      if (!tabs) {
        return;
      }
      tabs.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          tabs.querySelectorAll('.tab-btn').forEach(function (b) {
            b.classList.toggle('active', b === btn);
          });
          ['requests', 'create', 'accounts', 'cleanup'].forEach(function (name) {
            const panel = document.getElementById('tab-' + name);
            if (panel) {
              panel.classList.toggle('hidden', name !== btn.dataset.tab);
            }
          });
        });
      });
    }

    function initAccounts() {
      const list = document.getElementById('accountsList');
      const counter = document.getElementById('accountsCount');
      const overlay = document.getElementById('modalOverlay');
      if (!list || !counter || !overlay) {
        return;
      }

      function openModal(html) {
        overlay.classList.remove('hidden');
        document.getElementById('modalBox').innerHTML = html;
      }

      function closeModal() {
        overlay.classList.add('hidden');
        document.getElementById('modalBox').innerHTML = '';
      }

      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          closeModal();
        }
      });

      function isPrimary(row) {
        return String(row.email || '').toLowerCase() === 'dirayalab@gmail.com';
      }

      async function loadAccounts() {
        list.innerHTML = '';
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.textContent = window.I18N ? window.I18N.t('loadingAccounts') : 'جارٍ تحميل الحسابات...';
        list.appendChild(loading);
        try {
          const { data, error } = await supabase.rpc('admin_list_staff');
          if (error) {
            throw error;
          }
          renderAccounts(data || []);
        } catch (error) {
          list.innerHTML = '';
          const div = document.createElement('div');
          div.className = 'empty-state';
          div.textContent = (window.I18N ? window.I18N.t('cantLoadAccounts') : 'تعذّر تحميل الحسابات') + ': ' + friendlyError(error.message);
          list.appendChild(div);
          toast(window.I18N ? window.I18N.t('cantLoadAccounts') : 'تعذّر تحميل الحسابات', 'error');
        }
      }

      function renderAccounts(rows) {
        list.innerHTML = '';
        counter.textContent = String(rows.length);
        if (rows.length === 0) {
          const div = document.createElement('div');
          div.className = 'empty-state';
          div.textContent = window.I18N ? window.I18N.t('noAccounts') : 'لا توجد حسابات بعد.';
          list.appendChild(div);
          return;
        }
        rows.forEach(function (row) {
          list.appendChild(buildAccountCard(row));
        });
      }

      function buildAccountCard(row) {
        const primary = isPrimary(row);
        const card = document.createElement('div');
        card.className = 'account-card' + (row.is_active ? '' : ' frozen');

        const head = document.createElement('div');
        head.className = 'account-head';
        const avatar = document.createElement('div');
        avatar.className = 'account-avatar';
        avatar.textContent = String(row.username || row.email || '?').charAt(0).toUpperCase();
        const info = document.createElement('div');
        info.className = 'account-info';
        const nameRow = document.createElement('div');
        nameRow.className = 'account-name-row';
        const name = document.createElement('span');
        name.className = 'account-username';
        name.textContent = row.username || row.email || '—';
        nameRow.appendChild(name);
        if (primary) {
          const badge = document.createElement('span');
          badge.className = 'badge badge-primary';
          badge.textContent = window.I18N ? window.I18N.t('primaryBadge') : 'رئيسي';
          nameRow.appendChild(badge);
        }
        if (!row.is_active) {
          const badge = document.createElement('span');
          badge.className = 'badge badge-frozen';
          badge.textContent = window.I18N ? window.I18N.t('frozenBadge') : 'مجمّد';
          nameRow.appendChild(badge);
        }
        const meta = document.createElement('div');
        meta.className = 'account-meta';
        meta.textContent = [
          row.email,
          roleLabel(row.role),
          row.full_name ? row.full_name : null,
          row.phone ? row.phone : null,
        ].filter(Boolean).join(' • ');
        info.appendChild(nameRow);
        info.appendChild(meta);
        head.appendChild(avatar);
        head.appendChild(info);

        const actions = document.createElement('div');
        actions.className = 'request-actions';
      actions.appendChild(ghostButton((window.I18N ? window.I18N.t('edit') : 'تعديل'), function () {
        openEditModal(row);
      }));
      actions.appendChild(ghostButton((window.I18N ? window.I18N.t('changePassword') : 'كلمة المرور'), function () {
        openPasswordModal(row);
      }));
      if (!primary) {
        actions.appendChild(toneButton(row.is_active ? (window.I18N ? window.I18N.t('freeze') : 'تجميد') : (window.I18N ? window.I18N.t('unfreeze') : 'تفعيل'), row.is_active ? 'btn-warning' : 'btn-success', function () {
          toggleFreeze(row);
        }));
        actions.appendChild(toneButton((window.I18N ? window.I18N.t('delete') : 'حذف'), 'btn-danger', function () {
          confirmDelete(row);
        }));
      }

        card.appendChild(head);
        card.appendChild(actions);
        return card;
      }

      function ghostButton(label, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost';
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
      }

      function toneButton(label, toneClass, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn ' + toneClass;
        btn.textContent = label;
        btn.addEventListener('click', onClick);
        return btn;
      }

      function openEditModal(row) {
        const primary = isPrimary(row);
        const options = ['manager', 'marketer', 'driver', 'packager']
          .map(function (r) {
            return '<option value="' + r + '"' + (row.role === r ? ' selected' : '') + '>' + roleLabel(r) + '</option>';
          })
          .join('');
        const roleField = primary
          ? '<p class="create-hint">' + (window.I18N ? window.I18N.t('primaryRoleFixed') : 'دور الحساب الرئيسي ثابت.') + '</p>'
          : '<select id="editRole" class="input">' + options + '</select>';
        openModal(
          '<h3 class="modal-title">' + (window.I18N ? window.I18N.t('modalEditTitle') : 'تعديل الحساب') + '</h3>' +
            '<div class="modal-body">' +
            '<div class="field"><label for="editUsername">' + (window.I18N ? window.I18N.t('editUsername') : 'اسم المستخدم') + '</label>' +
            '<input id="editUsername" class="input" value="' + esc(row.username || '') + '"' + (primary ? ' readonly' : '') + ' /></div>' +
            '<div class="field"><label for="editName">' + (window.I18N ? window.I18N.t('editName') : 'الاسم الكامل') + '</label>' +
            '<input id="editName" class="input" value="' + esc(row.full_name || '') + '" /></div>' +
            '<div class="field"><label for="editPhone">' + (window.I18N ? window.I18N.t('editPhone') : 'رقم الهاتف') + '</label>' +
            '<input id="editPhone" class="input" value="' + esc(row.phone || '') + '" /></div>' +
            '<div class="field"><label for="editRole">' + (window.I18N ? window.I18N.t('editRole') : 'الدور') + '</label>' + roleField + '</div>' +
            '</div>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">' + (window.I18N ? window.I18N.t('modalCancel') : 'إلغاء') + '</button>' +
            '<button id="modalSave" class="btn btn-primary" type="button">' + (window.I18N ? window.I18N.t('modalSave') : 'حفظ') + '</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const username = document.getElementById('editUsername').value.trim();
          if (!USERNAME_RE.test(username)) {
            toast(window.I18N ? window.I18N.t('usernameInvalid') : 'اسم المستخدم: 3-30 حرفاً (حروف/أرقام/نقطة/شرطة) فقط.', 'error');
            return;
          }
          const save = document.getElementById('modalSave');
          save.disabled = true;
          save.textContent = window.I18N ? window.I18N.t('saving') : 'حفظ...';
          try {
            const { error } = await supabase.rpc('admin_update_account', {
              p_user_id: row.user_id,
              p_username: username,
              p_full_name: document.getElementById('editName').value.trim(),
              p_phone: document.getElementById('editPhone').value.trim(),
              p_role: document.getElementById('editRole').value,
            });
            if (error) {
              throw error;
            }
            toast(window.I18N ? window.I18N.t('savedChanges') : 'تم حفظ التعديلات.', 'success');
            closeModal();
            await loadAccounts();
          } catch (error) {
            toast((window.I18N ? window.I18N.t('cantEdit') : 'فشل التعديل') + ': ' + friendlyError(error.message), 'error');
            save.disabled = false;
            save.textContent = window.I18N ? window.I18N.t('modalSave') : 'حفظ';
          }
        });
      }

      function openPasswordModal(row) {
        openModal(
          '<h3 class="modal-title">' + (window.I18N ? window.I18N.t('modalChangePassword') : 'تغيير كلمة المرور') + '</h3>' +
            '<p class="create-hint">' + (window.I18N && window.I18N.getLang() === 'fr' ? 'Compte' : 'الحساب') + ': ' + esc(row.username || row.email) + '</p>' +
            '<div class="modal-body">' +
            '<div class="field"><label for="pwdNew">' + (window.I18N ? window.I18N.t('pwdNew') : 'كلمة المرور الجديدة') + '</label>' +
            '<input id="pwdNew" class="input" type="text" autocomplete="off" /></div>' +
            '<div class="field"><label for="pwdConfirm">' + (window.I18N ? window.I18N.t('pwdConfirm') : 'تأكيد كلمة المرور') + '</label>' +
            '<input id="pwdConfirm" class="input" type="text" autocomplete="off" /></div>' +
            '</div>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">' + (window.I18N ? window.I18N.t('modalCancel') : 'إلغاء') + '</button>' +
            '<button id="modalSave" class="btn btn-primary" type="button">' + (window.I18N ? window.I18N.t('modalChangePassword') : 'تغيير كلمة المرور') + '</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const password = document.getElementById('pwdNew').value;
          const confirm = document.getElementById('pwdConfirm').value;
          if (password.length < 6) {
            toast(window.I18N ? window.I18N.t('passwordMin') : 'كلمة المرور 6 أحرف على الأقل.', 'error');
            return;
          }
          if (password !== confirm) {
            toast(window.I18N ? window.I18N.t('pwdMismatch') : 'كلمتا المرور غير متطابقتين.', 'error');
            return;
          }
          const save = document.getElementById('modalSave');
          save.disabled = true;
          save.textContent = window.I18N ? window.I18N.t('changing') : 'جارٍ التغيير...';
          try {
            const { data, error } = await supabase.functions.invoke('admin-manage-user', {
              body: { action: 'password', user_id: row.user_id, new_password: password },
            });
            if (error) {
              throw error;
            }
            if (data && data.error) {
              throw new Error(data.error);
            }
            toast(window.I18N ? window.I18N.t('pwdChanged') : 'تم تغيير كلمة المرور.', 'success');
            closeModal();
          } catch (error) {
            toast((window.I18N ? window.I18N.t('cantChangePwd') : 'فشل تغيير كلمة المرور') + ': ' + extractEdgeError(error), 'error');
            save.disabled = false;
            save.textContent = window.I18N ? window.I18N.t('modalChangePassword') : 'تغيير كلمة المرور';
          }
        });
      }

      function toggleFreeze(row) {
        const next = !row.is_active;
        supabase
          .rpc('admin_set_account_active', { p_user_id: row.user_id, p_active: next })
          .then(function (result) {
            if (result.error) {
              throw result.error;
            }
            toast(next ? (window.I18N?window.I18N.t('accountFrozen'):'تم تجميد الحساب.') : (window.I18N?window.I18N.t('accountUnfrozen'):'تم تفعيل الحساب.'), 'success');
            loadAccounts();
          })
          .catch(function (error) {
            toast((window.I18N ? window.I18N.t('operationFailed') : 'فشلت العملية') + ': ' + friendlyError(error.message), 'error');
          });
      }

      function confirmDelete(row) {
        openModal(
          '<h3 class="modal-title">' + (window.I18N ? window.I18N.t('modalDelete') : 'حذف الحساب') + '</h3>' +
            '<p class="modal-text">' +
            (window.I18N
              ? window.I18N.t('deleteConfirm', esc(row.username || row.email))
              : 'سيُحذف الحساب «' + esc(row.username || row.email) + '» نهائياً مع صلاحياته. متابعة؟') +
            '</p>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">' + (window.I18N ? window.I18N.t('modalCancel') : 'إلغاء') + '</button>' +
            '<button id="modalSave" class="btn btn-danger" type="button">' + (window.I18N ? window.I18N.t('delete') : 'حذف') + '</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const btn = document.getElementById('modalSave');
          btn.disabled = true;
          btn.textContent = window.I18N ? window.I18N.t('deleting') : 'جارٍ الحذف...';
          try {
            const { error } = await supabase.rpc('admin_delete_account', { p_user_id: row.user_id });
            if (error) {
              throw error;
            }
            toast(window.I18N ? window.I18N.t('accountDeleted') : 'تم حذف الحساب.', 'success');
            closeModal();
            await loadAccounts();
          } catch (error) {
            toast((window.I18N ? window.I18N.t('cantDelete') : 'فشل الحذف') + ': ' + friendlyError(error.message), 'error');
            btn.disabled = false;
            btn.textContent = window.I18N ? window.I18N.t('delete') : 'حذف';
          }
        });
      }

      // تحميل أولي عند فتح تبويب الحسابات أول مرة
      const accountsTab = document.querySelector('.tab-btn[data-tab="accounts"]');
      if (accountsTab) {
        accountsTab.addEventListener('click', function () {
          if (counter.textContent === '0' && list.childElementCount === 0) {
            loadAccounts();
          }
        });
      }

      window.adminPanelLoadAccounts = loadAccounts;

      const cleanupTab = document.querySelector('.tab-btn[data-tab="cleanup"]');
      if (cleanupTab) {
        cleanupTab.addEventListener('click', function () {
          if (typeof window.adminPanelLoadCleanup === 'function') {
            window.adminPanelLoadCleanup().catch(function () {});
          }
        });
      }
    }
  }

  // ---------- إخراج التطبيق من التجربة (تنظيف انتقائي) ----------
  function initCleanup() {
    const body = document.getElementById('cleanupBody');
    const overlay = document.getElementById('modalOverlay');
    const countEl = document.getElementById('cleanupCount');
    const refreshBtn = document.getElementById('cleanupRefresh');
    if (!body || !overlay) {
      return;
    }

    function T(key, fallback) {
      return window.I18N ? window.I18N.t(key) : fallback;
    }

    let summary = null;
    let meId = null;
    const sel = {
      accounts: new Set(),
      customers: new Set(),
      coupons: new Set(),
      toggles: {},
    };
    let ui = null;

    function openModal(html) {
      overlay.classList.remove('hidden');
      document.getElementById('modalBox').innerHTML = html;
    }

    function closeModal() {
      overlay.classList.add('hidden');
      document.getElementById('modalBox').innerHTML = '';
    }
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    function make(tag, cls, text) {
      const el = document.createElement(tag);
      if (cls) {
        el.className = cls;
      }
      if (text !== undefined && text !== null) {
        el.textContent = text;
      }
      return el;
    }

    function rowsOf(kind) {
      if (kind === 'accounts') {
        return summary.staff || [];
      }
      if (kind === 'customers') {
        return summary.customers || [];
      }
      return summary.coupons || [];
    }

    function idOf(kind, row) {
      return row.user_id || row.id;
    }

    function itemText(kind, row) {
      if (kind === 'accounts') {
        return [row.username || row.email, roleLabel(row.role), row.is_active ? '' : ' (' + T('frozenBadge', 'مجمّد') + ')'].filter(Boolean).join(' — ');
      }
      if (kind === 'customers') {
        return [row.display_name || row.username || row.email || row.phone, row.phone, row.email].filter(Boolean).join(' • ');
      }
      return row.code + (row.title ? ' — ' + row.title : '');
    }

    function itemRow(kind, row) {
      const label = make('label', 'gl-item');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.kind = kind;
      cb.dataset.id = idOf(kind, row);
      cb.checked = sel[kind].has(cb.dataset.id);
      cb.addEventListener('change', function () {
        if (cb.checked) {
          sel[kind].add(cb.dataset.id);
        } else {
          sel[kind].delete(cb.dataset.id);
        }
        updateActive();
      });
      label.appendChild(cb);
      label.appendChild(make('div', 'gl-meta', itemText(kind, row)));
      return label;
    }

    function listGroup(kind, title, desc) {
      const rows = rowsOf(kind).filter(function (r) {
        const id = idOf(kind, r);
        return id !== '249cac50-5ba4-4bb7-8388-c2dd8a9a7945' && id !== meId;
      });
      const g = make('div', 'gl-group');
      const head = make('div', 'gl-group-head');
      const h = make('div');
      h.appendChild(make('h3', 'gl-title', title));
      h.appendChild(make('p', 'gl-desc', desc));
      head.appendChild(h);

      let allSelected = false;
      const allBtn = make('button', 'btn btn-ghost btn-sm', T('selectAll', 'تحديد الكل'));
      function syncAllBtn() {
        allSelected = rows.length > 0 && rows.every(function (r) {
          return sel[kind].has(idOf(kind, r));
        });
        allBtn.textContent = T(allSelected ? 'clearSel' : 'selectAll', allSelected ? 'إلغاء التحديد' : 'تحديد الكل');
      }
      allBtn.addEventListener('click', function () {
        syncAllBtn();
        const next = !allSelected;
        rows.forEach(function (r) {
          const id = idOf(kind, r);
          if (next) {
            sel[kind].add(id);
          } else {
            sel[kind].delete(id);
          }
        });
        g.querySelectorAll('.gl-item input').forEach(function (c) {
          if (c.dataset.kind === kind) {
            c.checked = sel[kind].has(c.dataset.id);
          }
        });
        syncAllBtn();
        updateActive();
      });
      syncAllBtn();
      head.appendChild(allBtn);
      g.appendChild(head);

      const items = make('div', 'gl-items');
      if (rows.length === 0) {
        items.appendChild(make('p', 'gl-empty', T('noneHint', 'لا عناصر في هذه الفئة.')));
      } else {
        rows.forEach(function (r) {
          items.appendChild(itemRow(kind, r));
        });
      }
      g.appendChild(items);
      return g;
    }

    function toggleRow(key, title, hint) {
      const label = make('label', 'gl-toggle');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.toggle = key;
      cb.checked = !!sel.toggles[key];
      cb.addEventListener('change', function () {
        sel.toggles[key] = cb.checked;
        updateActive();
      });
      const d = make('div', 'gl-meta');
      d.appendChild(make('b', null, title));
      if (hint) {
        d.appendChild(make('span', 'gl-hint', hint));
      }
      label.appendChild(cb);
      label.appendChild(d);
      return label;
    }

    function activeCount() {
      return (
        ['accounts', 'customers', 'coupons'].reduce(function (n, k) {
          return n + sel[k].size;
        }, 0) +
        Object.keys(sel.toggles).filter(function (k) {
          return sel.toggles[k];
        }).length
      );
    }

    function activePhrase() {
      const counts = (summary && summary.counts) || {};
      const parts = [];
      if (sel.accounts.size) {
        parts.push(sel.accounts.size + ' ' + T('accountsUnit', 'حساب موظف'));
      }
      if (sel.customers.size) {
        parts.push(sel.customers.size + ' ' + T('customersUnit', 'حساب زبون'));
      }
      if (sel.coupons.size) {
        parts.push(sel.coupons.size + ' ' + T('couponsUnit', 'كوبون'));
      }
      if (sel.toggles.delete_orders) {
        parts.push((counts.orders || 0) + ' ' + T('ordersUnit', 'طلب'));
      }
      if (sel.toggles.delete_cart_items) {
        parts.push(T('cartUnit', 'سلة'));
      }
      if (sel.toggles.delete_favorites) {
        parts.push(T('favUnit', 'مفضلة'));
      }
      if (sel.toggles.delete_addresses) {
        parts.push(T('addrUnit', 'عنوان'));
      }
      if (sel.toggles.delete_wallet_tx) {
        parts.push(T('walletUnit', 'حركة محفظة'));
      }
      if (sel.toggles.delete_user_coupons) {
        parts.push((counts.user_coupons || 0) + ' ' + T('ucUnit', 'كوبون مستخدم'));
      }
      if (sel.toggles.delete_coupon_redemptions) {
        parts.push((counts.coupon_redemptions || 0) + ' ' + T('crUnit', 'سجل استهلاك'));
      }
      if (sel.toggles.delete_promo_banners) {
        parts.push((counts.promo_banners || 0) + ' ' + T('bannerUnit', 'بانر'));
      }
      if (sel.toggles.delete_notification_campaigns) {
        parts.push((counts.notification_campaigns || 0) + ' ' + T('campaignUnit', 'حملة'));
      }
      if (sel.toggles.delete_scheduled_notifications) {
        parts.push((counts.scheduled_notifications || 0) + ' ' + T('schedUnit', 'إشعار مجدول'));
      }
      if (sel.toggles.delete_products) {
        parts.push((counts.products || 0) + ' ' + T('productsUnit', 'منتج'));
      }
      if (sel.toggles.delete_categories) {
        parts.push((counts.categories || 0) + ' ' + T('categoriesUnit', 'تصنيف'));
      }
      if (sel.toggles.delete_admin_requests) {
        parts.push(T('reqUnit', 'طلب وصول'));
      }
      return parts.join('، ');
    }

    function updateActive() {
      if (!ui) {
        return;
      }
      const n = activeCount();
      if (countEl) {
        countEl.textContent = String(n);
      }
      if (n === 0) {
        ui.info.textContent = T('nothingSelected', 'لم تختَر أي شيء بعد.');
        ui.run.disabled = true;
      } else {
        ui.info.textContent = T('willDelete', 'سيتم حذف: ') + activePhrase();
        ui.run.disabled = false;
      }
    }

    function render() {
      body.innerHTML = '';
      const counts = (summary && summary.counts) || {};
      body.appendChild(
        listGroup('accounts', T('groupAccounts', 'حسابات الموظفين'), T('groupAccountsDesc', '')),
      );
      body.appendChild(
        listGroup('customers', T('groupCustomers', 'حسابات الزبائن'), T('groupCustomersDesc', '')),
      );
      body.appendChild(
        listGroup('coupons', T('groupCoupons', 'الكوبونات'), T('groupCouponsDesc', '')),
      );

      const toggles = make('div', 'gl-toggles');
      toggles.appendChild(
        toggleRow(
          'delete_orders',
          T('groupOrders', 'الطلبات التجريبية'),
          T('groupOrdersDesc', '') + ' (' + (counts.orders || 0) + ' + ' + (counts.order_items || 0) + ')',
        ),
      );
      toggles.appendChild(toggleRow('delete_cart_items', T('groupCart', 'سلات التسوق'), String((counts.cart_items || 0))));
      toggles.appendChild(toggleRow('delete_favorites', T('groupFav', 'قوائم المفضلة'), String((counts.favorites || 0))));
      toggles.appendChild(toggleRow('delete_addresses', T('groupAddrs', 'العناوين'), String((counts.addresses || 0))));
      toggles.appendChild(toggleRow('delete_wallet_tx', T('groupWalletTx', 'حركات المحفظة'), String((counts.wallet_transactions || 0))));
      toggles.appendChild(toggleRow('delete_user_coupons', T('groupUserCoupons', 'كوبونات المستخدمين'), String((counts.user_coupons || 0))));
      toggles.appendChild(toggleRow('delete_coupon_redemptions', T('groupRedemptions', 'سجل استهلاك الكوبونات'), String((counts.coupon_redemptions || 0))));
      toggles.appendChild(toggleRow('delete_promo_banners', T('groupBanners', 'البنرات'), String((counts.promo_banners || 0))));
      toggles.appendChild(toggleRow('delete_notification_campaigns', T('groupCampaigns', 'حملات الإشعارات'), String((counts.notification_campaigns || 0))));
      toggles.appendChild(toggleRow('delete_scheduled_notifications', T('groupScheduled', 'الإشعارات المجدولة'), String((counts.scheduled_notifications || 0))));
      toggles.appendChild(
        toggleRow('delete_products', T('groupProducts', 'المنتجات'), T('groupProductsDesc', '') + ' (' + (counts.products || 0) + ')'),
      );
      toggles.appendChild(
        toggleRow('delete_categories', T('groupCategories', 'التصنيفات'), T('groupCategoriesDesc', '') + ' (' + (counts.categories || 0) + ')'),
      );
      toggles.appendChild(toggleRow('delete_admin_requests', T('groupRequests', 'طلبات الوصول'), String((counts.admin_requests || 0))));
      body.appendChild(toggles);

      ui = {
        bar: make('div', 'gl-actionbar'),
        info: make('div', 'gl-activesum'),
        run: make('button', 'btn btn-danger', T('btnRunCleanup', 'حذف المحدد نهائياً')),
      };
      ui.run.type = 'button';
      ui.run.disabled = true;
      ui.run.addEventListener('click', confirmRun);
      ui.bar.appendChild(ui.info);
      ui.bar.appendChild(ui.run);
      body.appendChild(ui.bar);
      updateActive();
    }

    async function load() {
      meId = window.adminPanelMeId || null;
      body.innerHTML = '';
      body.appendChild(make('div', 'loading', T('loadingAccounts', 'جارٍ التحميل...')));
      try {
        const { data, error } = await supabase.rpc('admin_golive_summary');
        if (error) {
          throw error;
        }
        summary = data || {};
        sel.accounts.clear();
        sel.customers.clear();
        sel.coupons.clear();
        sel.toggles = {};
        render();
      } catch (error) {
        body.innerHTML = '';
        body.appendChild(make('div', 'empty-state', T('cantLoadCleanup', 'تعذّر تحميل بيانات التنظيف') + ': ' + friendlyError(error.message)));
        toast(T('cantLoadCleanup', 'تعذّر تحميل بيانات التنظيف'), 'error');
      }
    }

    function confirmRun() {
      const phrase = activePhrase();
      if (!phrase) {
        return;
      }
      openModal(
        '<h3 class="modal-title">' + T('confirmCleanupTitle', 'تأكيد التنظيف النهائي') + '</h3>' +
          '<p class="modal-text">' + T('willDelete', 'سيتم حذف: ') + esc(phrase) + '.</p>' +
          '<div class="field"><label>' + T('confirmCleanupHint', 'اكتب «حذف» للمتابعة — لا يمكن التراجع.') + '</label>' +
          '<input id="cleanupConfirmInput" class="input" autocomplete="off" /></div>' +
          '<div class="modal-actions">' +
          '<button id="modalCancel" class="btn btn-ghost" type="button">' + T('modalCancel', 'إلغاء') + '</button>' +
          '<button id="modalSave" class="btn btn-danger" type="button" disabled>' + T('btnRunCleanup', 'حذف') + '</button>' +
          '</div>',
      );
      const input = document.getElementById('cleanupConfirmInput');
      const save = document.getElementById('modalSave');
      const target = T('confirmWord', 'حذف').trim().toLowerCase();
      input.addEventListener('input', function () {
        save.disabled = input.value.trim().toLowerCase() !== target;
      });
      document.getElementById('modalCancel').addEventListener('click', closeModal);
      save.addEventListener('click', execute);
    }

    async function execute() {
      const save = document.getElementById('modalSave');
      save.disabled = true;
      save.textContent = T('cleanupRunning', 'جارٍ التنظيف...');
      const payload = {
        account_ids: Array.from(sel.accounts),
        customer_ids: Array.from(sel.customers),
        coupon_ids: Array.from(sel.coupons),
        delete_orders: !!sel.toggles.delete_orders,
        delete_products: !!sel.toggles.delete_products,
        delete_categories: !!sel.toggles.delete_categories,
        delete_cart_items: !!sel.toggles.delete_cart_items,
        delete_favorites: !!sel.toggles.delete_favorites,
        delete_addresses: !!sel.toggles.delete_addresses,
        delete_wallet_tx: !!sel.toggles.delete_wallet_tx,
        delete_user_coupons: !!sel.toggles.delete_user_coupons,
        delete_coupon_redemptions: !!sel.toggles.delete_coupon_redemptions,
        delete_promo_banners: !!sel.toggles.delete_promo_banners,
        delete_notification_campaigns: !!sel.toggles.delete_notification_campaigns,
        delete_scheduled_notifications: !!sel.toggles.delete_scheduled_notifications,
        delete_admin_requests: !!sel.toggles.delete_admin_requests,
      };
      try {
        const { data, error } = await supabase.rpc('admin_golive_delete', { payload: payload });
        if (error) {
          throw error;
        }
        toast(T('cleanupDone', 'تم التنظيف بنجاح.'), 'success');
        closeModal();
        await load();
      } catch (error) {
        toast(T('cleanupFailed', 'فشل التنظيف') + ': ' + friendlyError(error.message), 'error');
        closeModal();
      }
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', load);
    }
    const backupBtn = document.getElementById('cleanupBackup');
    if (backupBtn) {
      backupBtn.addEventListener('click', downloadBackup);
    }

    async function downloadBackup() {
      if (!backupBtn) {
        return;
      }
      backupBtn.disabled = true;
      const old = backupBtn.textContent;
      backupBtn.textContent = T('backupRunning', 'جارٍ التحميل...');
      try {
        const { data, error } = await supabase.rpc('admin_backup_snapshot');
        if (error) {
          throw error;
        }
        const blob = new Blob([JSON.stringify(data || {}, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'atoga-backup-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        toast(T('backupDone', 'تم تحميل النسخة الاحتياطية.'), 'success');
      } catch (error) {
        toast(T('backupError', 'فشل تحميل النسخة الاحتياطية') + ': ' + friendlyError(error.message), 'error');
      } finally {
        backupBtn.disabled = false;
        backupBtn.textContent = old;
      }
    }
    window.adminPanelLoadCleanup = load;
  }

  window.adminPanel = {
    supabase: supabase,
    toast: toast,
    formatDate: formatDate,
    requireSuperAdmin: requireSuperAdmin,
    initLogin: initLogin,
    initDashboard: initDashboard,
  };
})();
