/* =========================================================
   SPC shared shell: language, header/footer, intro, auth, UI helpers
   ========================================================= */
(function () {
  const LANG_KEY = 'spc_lang';
  const SESSION_KEY = 'spc_session';
  const INTRO_KEY = 'spc_intro';
  const CLINIC = { phone: '01055566910', phoneIntl: '+201055566910', email: 'spc@info.com' };

  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) { /* ignore */ } },
    del(k, s = localStorage) { try { s.removeItem(k); } catch (e) { /* ignore */ } }
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const SPC = {
    CLINIC, esc,
    lang: store.get(LANG_KEY) === 'en' ? 'en' : 'ar',

    t(key) {
      const v = window.I18N[key];
      return v ? v[SPC.lang === 'en' ? 0 : 1] : key;
    },
    /** Localize a {ar,en} object or return plain strings as-is */
    L(v) {
      if (v == null) return '';
      if (typeof v === 'object') return v[SPC.lang] || v.en || v.ar || '';
      return v;
    },

    setLang(lang) {
      SPC.lang = lang;
      store.set(LANG_KEY, lang);
      SPC.applyLang();
      renderChrome();
      if (typeof window.renderPage === 'function') window.renderPage();
    },
    applyLang() {
      const h = document.documentElement;
      h.lang = SPC.lang;
      h.dir = SPC.lang === 'ar' ? 'rtl' : 'ltr';
      SPC.translate(document);
    },
    translate(root) {
      root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = SPC.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = SPC.t(el.dataset.i18nPlaceholder); });
      root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = SPC.t(el.dataset.i18nTitle); });
    },

    qs: name => new URLSearchParams(location.search).get(name),

    fmtDate(ymdStr, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
      if (!ymdStr) return '';
      const [y, m, d] = ymdStr.slice(0, 10).split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(SPC.lang === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', opts);
    },
    fmtTime(hhmm) {
      const [h, m] = hhmm.split(':').map(Number);
      const suffix = h >= 12 ? (SPC.lang === 'ar' ? 'م' : 'PM') : (SPC.lang === 'ar' ? 'ص' : 'AM');
      const h12 = h % 12 || 12;
      return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
    },
    age(dob) {
      if (!dob) return '';
      const b = new Date(dob), n = new Date();
      let a = n.getFullYear() - b.getFullYear();
      if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--;
      return a;
    },
    initials(name) {
      return String(SPC.L(name)).replace(/^(Dr\.|د\.)\s*/, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    },
    avatar(user, cls = 'avatar') {
      const photo = user && user.doctor && user.doctor.photo;
      const ini = esc(SPC.initials(user ? user.name : '?'));
      if (photo) return `<span class="${cls}"><img src="${esc(photo)}" alt="" onerror="this.replaceWith(document.createTextNode('${ini}'))"></span>`;
      return `<span class="${cls}">${ini}</span>`;
    },
    doctorPhoto(user) {
      const ini = esc(SPC.initials(user.name));
      const photo = user.doctor && user.doctor.photo;
      if (!photo) return `<div class="initials-avatar">${ini}</div>`;
      return `<img src="${esc(photo)}" alt="${esc(SPC.L(user.name))}" loading="lazy" onerror="this.outerHTML='<div class=&quot;initials-avatar&quot;>${ini}</div>'">`;
    },
    statusBadge: s => `<span class="badge badge-${s}">${SPC.t('status.' + s)}</span>`,
    empty: (msgKey = 'dash.noData', icon = 'fa-folder-open') => `<div class="empty"><i class="fa-regular ${icon}"></i>${SPC.t(msgKey)}</div>`,

    /* ---------- auth ---------- */
    auth: {
      current() {
        const id = store.get(SESSION_KEY);
        return id ? Store.users.get(id) : null;
      },
      login(email, password) {
        const u = Store.auth.check(email, password);
        if (u) store.set(SESSION_KEY, u.id);
        return u;
      },
      setSession(id) { store.set(SESSION_KEY, id); },
      logout() { store.del(SESSION_KEY); location.href = 'index.html'; },
      dashboardUrl(role) {
        return { admin: 'admin-dashboard.html', doctor: 'doctor-dashboard.html', patient: 'patient-dashboard.html' }[role] || 'index.html';
      },
      /** Redirects to login if the visitor isn't one of the roles. Returns the user or null. */
      require(roles) {
        const u = SPC.auth.current();
        if (!u) {
          location.replace('login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search));
          return null;
        }
        if (roles && !roles.includes(u.role)) {
          location.replace(SPC.auth.dashboardUrl(u.role));
          return null;
        }
        return u;
      }
    },

    /* ---------- UI ---------- */
    toast(msg, type = 'success') {
      let box = document.querySelector('.toasts');
      if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
      const el = document.createElement('div');
      el.className = 'toast ' + type;
      el.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i><span>${esc(msg)}</span>`;
      box.appendChild(el);
      setTimeout(() => el.remove(), 3800);
    },

    /** modal({title, body (html), foot (html), size}) -> {el, close} */
    modal({ title, body, foot = '', size = '' }) {
      const wrap = document.createElement('div');
      wrap.className = 'modal-backdrop';
      wrap.innerHTML = `
        <div class="modal ${size}" role="dialog" aria-modal="true">
          <div class="modal-head"><h3>${title}</h3><button class="modal-close" aria-label="close"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="modal-body">${body}</div>
          ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
        </div>`;
      const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
      const onKey = e => { if (e.key === 'Escape') close(); };
      wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('.modal-close') || e.target.closest('[data-close]')) close(); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(wrap);
      return { el: wrap, close };
    },

    confirm(text, onYes, danger = true) {
      const m = SPC.modal({
        title: SPC.t('dash.confirmTitle'),
        body: `<p class="muted" style="margin:0">${esc(text)}</p>`,
        foot: `<button class="btn btn-ghost" data-close>${SPC.t('dash.cancel')}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${SPC.t('dash.yes')}</button>`
      });
      m.el.querySelector('[data-yes]').addEventListener('click', () => { m.close(); onYes(); });
    },

    /** Dashboard tab switching: buttons [data-tab] + panes [data-pane] */
    tabs(root, onChange) {
      const btns = root.querySelectorAll('[data-tab]');
      const show = name => {
        btns.forEach(b => b.classList.toggle('active', b.dataset.tab === name));
        root.querySelectorAll('[data-pane]').forEach(p => p.classList.toggle('hidden', p.dataset.pane !== name));
        history.replaceState(null, '', '#' + name);
        onChange && onChange(name);
      };
      btns.forEach(b => b.addEventListener('click', () => show(b.dataset.tab)));
      const initial = location.hash.slice(1);
      show([...btns].some(b => b.dataset.tab === initial) ? initial : btns[0].dataset.tab);
      return show;
    },

    reveal() {
      const els = document.querySelectorAll('.reveal:not(.in)');
      if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
      const io = new IntersectionObserver(entries => entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: .12 });
      els.forEach(e => io.observe(e));
    },

    logoSVG(size = 44) {
      // One leaf with a leaf-shaped hole, rotated four times around the center.
      const leaf = 'M4 4H26A22 22 0 0 1 48 26V48H26A22 22 0 0 1 4 26Z M17 17H26A9 9 0 0 1 35 26V35H26A9 9 0 0 1 17 26Z';
      const colors = ['#2466ae', '#dff1f2', '#f3c79c', '#7ecbc4'];
      return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${
        colors.map((c, i) => `<path d="${leaf}" fill="${c}" fill-rule="evenodd" transform="rotate(${i * 90} 50 50)"/>`).join('')
      }</svg>`;
    }
  };

  /* ---------- Header / footer ---------- */
  const NAV = [
    ['index.html', 'nav.home'], ['about.html', 'nav.about'], ['services.html', 'nav.services'],
    ['doctors.html', 'nav.doctors'], ['contact.html', 'nav.contact']
  ];
  const currentFile = () => (location.pathname.split('/').pop() || 'index.html');

  function headerHTML() {
    const u = SPC.auth.current();
    const file = currentFile();
    const active = f => (f === file || (f === 'doctors.html' && file === 'doctor.html')) ? 'active' : '';
    const account = u
      ? `<div class="user-menu">
          <button class="user-chip" type="button">${SPC.avatar(u)}<span class="name">${esc(SPC.L(u.name).split(' ').slice(0, 2).join(' '))}</span><i class="fa-solid fa-chevron-down" style="font-size:.7rem"></i></button>
          <div class="dropdown">
            <a href="${SPC.auth.dashboardUrl(u.role)}"><i class="fa-solid fa-gauge"></i>${SPC.t('nav.dashboard')}</a>
            <button type="button" data-logout><i class="fa-solid fa-arrow-right-from-bracket"></i>${SPC.t('nav.logout')}</button>
          </div>
        </div>`
      : `<a class="btn btn-ghost btn-sm" href="login.html"><i class="fa-regular fa-user"></i><span>${SPC.t('nav.login')}</span></a>`;
    return `
      <header class="site-header">
        <div class="container header-inner">
          <a href="index.html" class="brand" aria-label="SPC">${SPC.logoSVG()}<span class="brand-text"><b>SPC</b><small>${SPC.t('brand.tagline')}</small></span></a>
          <nav class="main-nav">${NAV.map(([f, k]) => `<a href="${f}" class="${active(f)}">${SPC.t(k)}</a>`).join('')}</nav>
          <div class="header-actions">
            <a href="book.html" class="btn btn-primary btn-sm btn-book"><i class="fa-regular fa-calendar-check"></i>${SPC.t('nav.book')}</a>
            <button class="lang-btn" type="button" data-lang><i class="fa-solid fa-globe"></i>${SPC.t('nav.lang')}</button>
            ${account}
            <button class="menu-toggle" type="button" aria-label="menu"><i class="fa-solid fa-bars"></i></button>
          </div>
        </div>
      </header>`;
  }

  function footerHTML() {
    return `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <a href="index.html" class="brand">${SPC.logoSVG()}<span class="brand-text"><b>SPC</b><small>${SPC.t('brand.tagline')}</small></span></a>
              <p style="margin-top:16px">${SPC.t('footer.about')}</p>
              <div class="socials">
                <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://wa.me/${CLINIC.phoneIntl.replace('+', '')}" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
              </div>
            </div>
            <div>
              <h4>${SPC.t('footer.links')}</h4>
              <ul>${NAV.map(([f, k]) => `<li><a href="${f}">${SPC.t(k)}</a></li>`).join('')}<li><a href="book.html">${SPC.t('nav.book')}</a></li></ul>
            </div>
            <div>
              <h4>${SPC.t('footer.contact')}</h4>
              <ul>
                <li><i class="fa-solid fa-phone"></i><a href="tel:${CLINIC.phoneIntl}" class="num">${CLINIC.phone}</a></li>
                <li><i class="fa-regular fa-envelope"></i><a href="mailto:${CLINIC.email}" class="num">${CLINIC.email}</a></li>
                <li><i class="fa-solid fa-location-dot"></i><span>${SPC.t('contact.addressVal')}</span></li>
              </ul>
            </div>
            <div>
              <h4>${SPC.t('footer.hours')}</h4>
              <ul>
                <li><i class="fa-regular fa-clock"></i><span>${SPC.t('footer.hoursVal')}</span></li>
                <li><i class="fa-solid fa-moon"></i><span>${SPC.t('footer.friday')}</span></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} SPC. ${SPC.t('footer.rights')}</span>
            <span class="num">${CLINIC.email}</span>
          </div>
        </div>
      </footer>`;
  }

  function renderChrome() {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) {
      h.innerHTML = headerHTML();
      const header = h.querySelector('.site-header');
      h.querySelector('[data-lang]').addEventListener('click', () => SPC.setLang(SPC.lang === 'ar' ? 'en' : 'ar'));
      const nav = h.querySelector('.main-nav');
      h.querySelector('.menu-toggle').addEventListener('click', () => nav.classList.toggle('open'));
      const menu = h.querySelector('.user-menu');
      if (menu) {
        menu.querySelector('.user-chip').addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
        document.addEventListener('click', () => menu.classList.remove('open'));
        menu.querySelector('[data-logout]').addEventListener('click', () => SPC.auth.logout());
      }
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    if (f) f.innerHTML = footerHTML();
  }

  /* ---------- Intro animation (once per session) ---------- */
  function intro() {
    const html = document.documentElement;
    if (!html.classList.contains('show-intro')) return;
    store.set(INTRO_KEY, '1', sessionStorage);
    const leaf = 'M4 4H26A22 22 0 0 1 48 26V48H26A22 22 0 0 1 4 26Z M17 17H26A9 9 0 0 1 35 26V35H26A9 9 0 0 1 17 26Z';
    const colors = ['#2466ae', '#dff1f2', '#f3c79c', '#7ecbc4'];
    const el = document.createElement('div');
    el.id = 'preloader';
    el.innerHTML = `
      <svg class="intro-logo" viewBox="0 0 100 150" role="img" aria-label="SPC">
        <g class="petals">${colors.map((c, i) => `<g class="petal"><path d="${leaf}" fill="${c}" fill-rule="evenodd" transform="rotate(${i * 90} 50 50)"/></g>`).join('')}</g>
        <text class="word" x="50" y="128" text-anchor="middle">SPC</text>
        <text class="tag" x="50" y="144" text-anchor="middle">PHYSICAL THERAPY</text>
      </svg>`;
    document.body.appendChild(el);
    const finish = () => {
      el.classList.add('done');
      html.classList.remove('show-intro');
      setTimeout(() => el.remove(), 700);
    };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(finish, reduce ? 300 : 2900);
  }

  function init() {
    SPC.applyLang();
    renderChrome();
    intro();
    if (typeof window.renderPage === 'function') window.renderPage();
    SPC.reveal();
  }

  window.SPC = SPC;
  document.addEventListener('DOMContentLoaded', init);
})();
