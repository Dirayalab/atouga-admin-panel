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

  let toastContainer = null;

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
      showError('Access denied. Employees must use the Fulfillment App.');
    } else if (params.get('error') === 'session') {
      showError('انتهت الجلسة. سجّل الدخول من جديد.');
    }

    function showError(message) {
      errorBox.textContent = message;
      errorBox.classList.add('visible');
    }

    function setLoading(loading) {
      submit.disabled = loading;
      submitText.textContent = loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول';
      spinner.style.display = loading ? '' : 'none';
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      errorBox.classList.remove('visible');
      const emailValue = email.value.trim();
      const passwordValue = password.value;
      if (!emailValue || !passwordValue) {
        showError('أدخل البريد الإلكتروني وكلمة المرور.');
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
          showError('Access denied. Only a Super Admin can access this panel.');
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

    (async function () {
      const session = await requireSuperAdmin();
      if (!session) {
        return;
      }
      emailEl.textContent = session.user.email || '';
      await loadRequests();
    })();

    refreshBtn.addEventListener('click', loadRequests);
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
        div.textContent = 'جارٍ تحميل الطلبات...';
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
        div.textContent = 'تعذّر تحميل الطلبات: ' + friendlyError(error.message);
        list.appendChild(div);
        toast('تعذّر تحميل الطلبات', 'error');
      }
    }

    function render(rows) {
      setLoading(false);
      counter.textContent = String(rows.length);
      if (rows.length === 0) {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.textContent = 'لا توجد طلبات معلّقة حالياً.';
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
      actions.appendChild(actionButton('اعتماد كمدير', 'btn-success', async function (btn) {
        await runAction(row.id, 'manager', btn);
      }));
      actions.appendChild(actionButton('اعتماد كمسوّق', 'btn-warning', async function (btn) {
        await runAction(row.id, 'marketer', btn);
      }));
      actions.appendChild(actionButton('رفض', 'btn-danger', async function (btn) {
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
