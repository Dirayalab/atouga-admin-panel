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
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (/email_not_confirmed|email not confirmed/i.test(msg)) {
      return 'يرجى تأكيد البريد الإلكتروني أولاً.';
    }
    if (/Failed to fetch|NetworkError/i.test(msg)) {
      return 'تعذّر الاتصال بالخادم. تحقق من الشبكة.';
    }
    return msg || 'حدث خطأ غير متوقع.';
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

    (async function () {
      const session = await requireSuperAdmin();
      if (!session) {
        return;
      }
      emailEl.textContent = session.user.email || '';
      await loadRequests();
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
          toast('تم إنشاء الحساب: ' + data.username + ' (' + data.role + ')', 'success');
          form.reset();
          if (typeof window.adminPanelLoadAccounts === 'function') {
            window.adminPanelLoadAccounts();
          }
        } catch (error) {
          toast('فشل إنشاء الحساب: ' + extractEdgeError(error), 'error');
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
      ]);
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
        date.textContent = 'تاريخ الطلب: ' + formatDate(row.requested_at);
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
            ? 'تم اعتماد الطلب كـ' + (role === 'manager' ? 'مدير' : 'مسوّق') + '.'
            : 'تم رفض الطلب.',
          'success',
        );
        if (list.children.length === 0) {
          const div = document.createElement('div');
          div.className = 'empty-state';
          div.textContent = 'لا توجد طلبات معلّقة حالياً.';
          list.appendChild(div);
        }
      } catch (error) {
        buttons.forEach(function (b) {
          b.disabled = false;
        });
        btn.textContent = btn.dataset.label || 'إعادة المحاولة';
        toast('فشلت العملية: ' + friendlyError(error.message), 'error');
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
          ['requests', 'create', 'accounts'].forEach(function (name) {
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
        loading.textContent = 'جارٍ تحميل الحسابات...';
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
          div.textContent = 'تعذّر تحميل الحسابات: ' + friendlyError(error.message);
          list.appendChild(div);
          toast('تعذّر تحميل الحسابات', 'error');
        }
      }

      function renderAccounts(rows) {
        list.innerHTML = '';
        counter.textContent = String(rows.length);
        if (rows.length === 0) {
          const div = document.createElement('div');
          div.className = 'empty-state';
          div.textContent = 'لا توجد حسابات بعد.';
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
          badge.textContent = 'رئيسي';
          nameRow.appendChild(badge);
        }
        if (!row.is_active) {
          const badge = document.createElement('span');
          badge.className = 'badge badge-frozen';
          badge.textContent = 'مجمّد';
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
          ? '<p class="create-hint">دور الحساب الرئيسي ثابت.</p>'
          : '<select id="editRole" class="input">' + options + '</select>';
        openModal(
          '<h3 class="modal-title">تعديل الحساب</h3>' +
            '<div class="modal-body">' +
            '<div class="field"><label for="editUsername">اسم المستخدم</label>' +
            '<input id="editUsername" class="input" value="' + esc(row.username || '') + '"' + (primary ? ' readonly' : '') + ' /></div>' +
            '<div class="field"><label for="editName">الاسم الكامل</label>' +
            '<input id="editName" class="input" value="' + esc(row.full_name || '') + '" /></div>' +
            '<div class="field"><label for="editPhone">رقم الهاتف</label>' +
            '<input id="editPhone" class="input" value="' + esc(row.phone || '') + '" /></div>' +
            '<div class="field"><label for="editRole">الدور</label>' + roleField + '</div>' +
            '</div>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">إلغاء</button>' +
            '<button id="modalSave" class="btn btn-primary" type="button">حفظ</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const username = document.getElementById('editUsername').value.trim();
          if (!USERNAME_RE.test(username)) {
            toast('اسم المستخدم: 3-30 حرفاً (حروف/أرقام/نقطة/شرطة) فقط.', 'error');
            return;
          }
          const save = document.getElementById('modalSave');
          save.disabled = true;
          save.textContent = 'حفظ...';
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
            toast('تم حفظ التعديلات.', 'success');
            closeModal();
            await loadAccounts();
          } catch (error) {
            toast('فشل التعديل: ' + friendlyError(error.message), 'error');
            save.disabled = false;
            save.textContent = 'حفظ';
          }
        });
      }

      function openPasswordModal(row) {
        openModal(
          '<h3 class="modal-title">تغيير كلمة المرور</h3>' +
            '<p class="create-hint">الحساب: ' + esc(row.username || row.email) + '</p>' +
            '<div class="modal-body">' +
            '<div class="field"><label for="pwdNew">كلمة المرور الجديدة</label>' +
            '<input id="pwdNew" class="input" type="text" autocomplete="off" /></div>' +
            '<div class="field"><label for="pwdConfirm">تأكيد كلمة المرور</label>' +
            '<input id="pwdConfirm" class="input" type="text" autocomplete="off" /></div>' +
            '</div>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">إلغاء</button>' +
            '<button id="modalSave" class="btn btn-primary" type="button">تغيير كلمة المرور</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const password = document.getElementById('pwdNew').value;
          const confirm = document.getElementById('pwdConfirm').value;
          if (password.length < 6) {
            toast('كلمة المرور 6 أحرف على الأقل.', 'error');
            return;
          }
          if (password !== confirm) {
            toast('كلمتا المرور غير متطابقتين.', 'error');
            return;
          }
          const save = document.getElementById('modalSave');
          save.disabled = true;
          save.textContent = 'جارٍ التغيير...';
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
            toast('تم تغيير كلمة المرور.', 'success');
            closeModal();
          } catch (error) {
            toast('فشل تغيير كلمة المرور: ' + extractEdgeError(error), 'error');
            save.disabled = false;
            save.textContent = 'تغيير كلمة المرور';
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
            toast('فشلت العملية: ' + friendlyError(error.message), 'error');
          });
      }

      function confirmDelete(row) {
        openModal(
          '<h3 class="modal-title">حذف الحساب</h3>' +
            '<p class="modal-text">سيُحذف الحساب «' + esc(row.username || row.email) + '» نهائياً مع صلاحياته. متابعة؟</p>' +
            '<div class="modal-actions">' +
            '<button id="modalCancel" class="btn btn-ghost" type="button">إلغاء</button>' +
            '<button id="modalSave" class="btn btn-danger" type="button">حذف نهائي</button>' +
            '</div>',
        );
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        document.getElementById('modalSave').addEventListener('click', async function () {
          const btn = document.getElementById('modalSave');
          btn.disabled = true;
          btn.textContent = 'جارٍ الحذف...';
          try {
            const { error } = await supabase.rpc('admin_delete_account', { p_user_id: row.user_id });
            if (error) {
              throw error;
            }
            toast('تم حذف الحساب.', 'success');
            closeModal();
            await loadAccounts();
          } catch (error) {
            toast('فشل الحذف: ' + friendlyError(error.message), 'error');
            btn.disabled = false;
            btn.textContent = 'حذف نهائي';
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
    }
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
