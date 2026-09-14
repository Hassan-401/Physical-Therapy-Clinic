(function () {
  const me0 = SPC.auth.require(['admin']);
  if (!me0) return;
  const { t, L, esc } = SPC;
  const pane = n => document.querySelector(`[data-pane="${n}"]`);
  const state = { appt: 'upcoming', patSearch: '' };

  /* ---------- doctor form helpers ---------- */
  const lines3 = arr => (arr || []).map(i => [i.year || '', i.en || '', i.ar || ''].join(' | ')).join('\n');
  const lines2 = arr => (arr || []).map(i => [i.en || '', i.ar || ''].join(' | ')).join('\n');
  const parse3 = txt => txt.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p.some(Boolean))
    .map(([year = '', en = '', ar = '']) => ({ year, en, ar: ar || en }));
  const parse2 = txt => txt.split('\n').map(l => l.split('|').map(s => s.trim())).filter(p => p.some(Boolean))
    .map(([en = '', ar = '']) => ({ en, ar: ar || en }));

  function doctorModal(existing) {
    const d = existing ? existing.doctor : {
      name: {}, specialty: {}, university: {}, bio: {}, languages: { en: 'Arabic, English', ar: 'العربية، الإنجليزية' },
      age: '', years: '', photo: '', education: [], career: [], certificates: [], skills: [],
      schedule: { days: [6, 0, 1, 2, 3], start: '10:00', end: '18:00', slot: 60 }
    };
    const v = x => esc(x == null ? '' : x);
    const field = (label, name, value, attrs = '', cls = '') =>
      `<div class="field ${cls}"><label>${t(label)}</label><input name="${name}" value="${v(value)}" ${attrs}></div>`;
    const area = (label, name, value, hint) =>
      `<div class="field full"><label>${t(label)}</label><textarea name="${name}" style="min-height:90px">${v(value)}</textarea>${hint ? `<span class="hint">${t(hint)}</span>` : ''}</div>`;

    const m = SPC.modal({
      title: t(existing ? 'admin.editDoctor' : 'admin.addDoctor'), size: 'lg',
      body: `<form class="form-grid" id="doc-form" novalidate>
        <h4 class="form-section-title full" style="border:0;padding:0;margin:0"><i class="fa-solid fa-key"></i> ${t('admin.account')}</h4>
        ${field('form.email', 'email', existing && existing.email, 'type="email" required dir="ltr"')}
        <div class="field"><label>${t('form.password')}</label><input name="password" type="password" autocomplete="new-password" ${existing ? `placeholder="${t('admin.passHint')}"` : 'required'}></div>
        ${field('form.phone', 'phone', existing && existing.phone, 'type="tel"')}
        ${field('admin.photo', 'photo', d.photo, 'dir="ltr" placeholder="https://…"')}

        <h4 class="form-section-title full"><i class="fa-regular fa-id-card"></i> ${t('admin.basic')}</h4>
        ${field('admin.nameEn', 'name_en', d.name.en, 'required dir="ltr" placeholder="Dr. …"')}
        ${field('admin.nameAr', 'name_ar', d.name.ar, 'required dir="rtl" placeholder="د. …"')}
        ${field('admin.specEn', 'spec_en', d.specialty.en, 'required dir="ltr"')}
        ${field('admin.specAr', 'spec_ar', d.specialty.ar, 'required dir="rtl"')}
        ${field('admin.uniEn', 'uni_en', d.university.en, 'dir="ltr"')}
        ${field('admin.uniAr', 'uni_ar', d.university.ar, 'dir="rtl"')}
        ${field('admin.age', 'age', d.age, 'type="number" min="20" max="90"')}
        ${field('admin.years', 'years', d.years, 'type="number" min="0" max="60"')}
        ${field('admin.langEn', 'lang_en', d.languages.en, 'dir="ltr"')}
        ${field('admin.langAr', 'lang_ar', d.languages.ar, 'dir="rtl"')}
        <div class="field full"><label>${t('admin.bioEn')}</label><textarea name="bio_en" dir="ltr" style="min-height:80px">${v(d.bio.en)}</textarea></div>
        <div class="field full"><label>${t('admin.bioAr')}</label><textarea name="bio_ar" dir="rtl" style="min-height:80px">${v(d.bio.ar)}</textarea></div>

        <h4 class="form-section-title full"><i class="fa-regular fa-clock"></i> ${t('admin.scheduleT')}</h4>
        <div class="field full"><label>${t('admin.days')}</label>
          <div class="checks">${[6, 0, 1, 2, 3, 4, 5].map(x => `<label><input type="checkbox" name="days" value="${x}" ${d.schedule.days.includes(x) ? 'checked' : ''}>${t('day.' + x)}</label>`).join('')}</div>
        </div>
        ${field('admin.start', 'start', d.schedule.start, 'type="time" step="900"')}
        ${field('admin.end', 'end', d.schedule.end, 'type="time" step="900"')}
        <div class="field"><label>${t('admin.slot')}</label><select name="slot">${[30, 45, 60, 90].map(s => `<option ${s === d.schedule.slot ? 'selected' : ''}>${s}</option>`).join('')}</select></div>

        <h4 class="form-section-title full"><i class="fa-solid fa-graduation-cap"></i> ${t('admin.cv')}</h4>
        ${area('admin.education', 'education', lines3(d.education), 'admin.lineHint3')}
        ${area('admin.career', 'career', lines3(d.career), 'admin.lineHint3')}
        ${area('admin.certs', 'certificates', lines2(d.certificates), 'admin.lineHint2')}
        ${area('admin.skills', 'skills', lines2(d.skills), 'admin.lineHint2')}
        <div class="full" id="doc-alert"></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-doc"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });

    m.el.querySelector('#save-doc').addEventListener('click', () => {
      const form = m.el.querySelector('#doc-form');
      const fd = new FormData(form);
      const f = Object.fromEntries(fd);
      const alertBox = m.el.querySelector('#doc-alert');
      const fail = key => { alertBox.innerHTML = `<div class="alert alert-error">${t(key)}</div>`; alertBox.scrollIntoView({ block: 'nearest' }); };
      const days = fd.getAll('days').map(Number);
      if (!f.email.trim() || !f.name_en.trim() || !f.name_ar.trim() || !f.spec_en.trim() || !f.spec_ar.trim() || (!existing && !f.password) || !days.length) return fail('form.required');
      if (f.password && f.password.length < 6) return fail('register.short');

      const doctor = {
        name: { en: f.name_en.trim(), ar: f.name_ar.trim() },
        specialty: { en: f.spec_en.trim(), ar: f.spec_ar.trim() },
        university: { en: f.uni_en.trim(), ar: f.uni_ar.trim() || f.uni_en.trim() },
        bio: { en: f.bio_en.trim(), ar: f.bio_ar.trim() || f.bio_en.trim() },
        languages: { en: f.lang_en.trim(), ar: f.lang_ar.trim() || f.lang_en.trim() },
        age: Number(f.age) || '', years: Number(f.years) || 0, photo: f.photo.trim(),
        education: parse3(f.education), career: parse3(f.career),
        certificates: parse2(f.certificates), skills: parse2(f.skills),
        schedule: { days, start: f.start || '10:00', end: f.end || '18:00', slot: Number(f.slot) || 60 }
      };
      try {
        if (existing) {
          Store.doctors.update(existing.id, { email: f.email, password: f.password || undefined, phone: f.phone, doctor });
          SPC.toast(t('dash.saved'));
        } else {
          Store.doctors.create({ email: f.email, password: f.password, phone: f.phone, doctor });
          SPC.toast(t('admin.created'));
        }
        m.close();
        draw();
      } catch (err) {
        fail(err.code === 'email_taken' ? 'admin.emailTaken' : 'form.required');
      }
    });
  }

  /* ---------- panes ---------- */
  function patientsTable() {
    const q = state.patSearch.trim().toLowerCase();
    const appts = Store.appointments.list();
    const list = Store.patients.list().filter(p => !q || [p.name, p.phone, p.email].some(x => String(x).toLowerCase().includes(q)));
    if (!list.length) return SPC.empty();
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>${t('th.name')}</th><th>${t('th.phone')}</th><th>${t('th.email')}</th><th>${t('th.visits')}</th><th>${t('pf.memberSince')}</th><th>${t('th.actions')}</th></tr></thead>
      <tbody>${list.map(p => `<tr>
        <td><div class="who">${SPC.avatar(p)}<b>${esc(p.name)}</b></div></td>
        <td><span class="num">${esc(p.phone)}</span></td>
        <td><span class="num">${esc(p.email)}</span></td>
        <td>${appts.filter(a => a.patientId === p.id && a.status !== 'cancelled').length}</td>
        <td>${SPC.fmtDate(p.createdAt)}</td>
        <td><a class="btn btn-outline btn-sm" href="patient-profile.html?id=${p.id}"><i class="fa-regular fa-folder-open"></i>${t('doc.openFile')}</a></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function draw() {
    const me = Store.users.get(me0.id);
    const doctors = Store.doctors.list();
    const patients = Store.patients.list();
    const appts = Store.appointments.list();
    const messages = Store.messages.list();
    const today = Store.ymd(new Date());
    const upcoming = appts.filter(DASH.isUpcoming);

    document.getElementById('dash-user').innerHTML = DASH.userBox(me);
    document.getElementById('msg-count').textContent = messages.length || '';

    pane('overview').innerHTML = `
      <div class="dash-title"><h1>${t('dash.hello')}${SPC.lang === 'ar' ? '،' : ','} ${esc(L(me.name))}</h1>
        <button class="btn btn-ghost btn-sm" id="reset-demo"><i class="fa-solid fa-rotate"></i>${t('admin.reset')}</button></div>
      <div class="stat-cards">
        ${DASH.stat('fa-user-doctor', 'ic-blue', doctors.length, 'stat.doctors')}
        ${DASH.stat('fa-hospital-user', 'ic-teal', patients.length, 'stat.patients')}
        ${DASH.stat('fa-calendar-day', 'ic-peach', appts.filter(a => a.date === today && a.status !== 'cancelled').length, 'stat.today')}
        ${DASH.stat('fa-envelope', 'ic-ink', messages.length, 'stat.messages')}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t('dash.upcoming')}</h2></div>
        ${DASH.apptTable(upcoming.slice(0, 8), { who: 'both', role: 'admin' })}
      </div>`;

    pane('doctors').innerHTML = `
      <div class="dash-title"><h1>${t('dash.doctors')}</h1><button class="btn btn-primary" id="add-doctor"><i class="fa-solid fa-user-plus"></i>${t('admin.addDoctor')}</button></div>
      <div class="panel">${doctors.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>${t('th.name')}</th><th>${t('th.specialty')}</th><th>${t('th.email')}</th><th>${t('doctor.experience')}</th><th>${t('doctor.schedule')}</th><th>${t('th.actions')}</th></tr></thead>
        <tbody>${doctors.map(u => `<tr>
          <td><div class="who">${SPC.avatar(u)}<b>${esc(L(u.name))}</b></div></td>
          <td>${esc(L(u.doctor.specialty))}</td>
          <td><span class="num">${esc(u.email)}</span></td>
          <td>${u.doctor.years}+</td>
          <td>${u.doctor.schedule.days.map(x => t('day.' + x)).join(' · ')}</td>
          <td><div class="actions">
            <a class="btn btn-ghost btn-sm" href="doctor.html?id=${u.id}" target="_blank"><i class="fa-regular fa-eye"></i></a>
            <button class="btn btn-outline btn-sm" data-edit-doc="${u.id}"><i class="fa-solid fa-pen"></i>${t('dash.edit')}</button>
            <button class="btn btn-danger btn-sm" data-del-doc="${u.id}"><i class="fa-solid fa-trash"></i></button>
          </div></td>
        </tr>`).join('')}</tbody></table></div>` : SPC.empty()}</div>`;

    pane('patients').innerHTML = `
      <div class="dash-title"><h1>${t('dash.patients')}</h1></div>
      <div class="panel">
        <div class="panel-head"><div class="field" style="min-width:260px"><input type="search" id="pat-search" value="${esc(state.patSearch)}" placeholder="${t('dash.search')}"></div></div>
        <div id="pat-table">${patientsTable()}</div>
      </div>`;

    const past = appts.filter(a => !DASH.isUpcoming(a)).reverse();
    const list = state.appt === 'upcoming' ? upcoming : state.appt === 'past' ? past : appts.slice().reverse();
    pane('appointments').innerHTML = `
      <div class="dash-title"><h1>${t('dash.appointments')}</h1></div>
      <div class="panel">
        <div class="panel-head"><div class="checks">
          ${['upcoming', 'past', 'all'].map(f => `<button class="btn btn-sm ${state.appt === f ? 'btn-primary' : 'btn-ghost'}" data-filter="${f}">${t('dash.' + f)}</button>`).join('')}
        </div></div>
        ${DASH.apptTable(list, { who: 'both', role: 'admin' })}
      </div>`;

    pane('messages').innerHTML = `
      <div class="dash-title"><h1>${t('dash.messages')}</h1></div>
      <div class="panel">${messages.length ? messages.map(msg => `
        <article class="record">
          <div class="record-head">
            <div><h3>${esc(msg.subject || '—')}</h3><small>${esc(msg.name)} · <span class="num">${esc(msg.phone)}</span>${msg.email ? ` · <span class="num">${esc(msg.email)}</span>` : ''}</small></div>
            <div style="display:flex;gap:8px;align-items:center"><small class="muted">${SPC.fmtDate(msg.createdAt)}</small>
              <button class="btn btn-danger btn-sm" data-del-msg="${msg.id}"><i class="fa-solid fa-trash"></i></button></div>
          </div>
          <p style="margin:0">${esc(msg.message)}</p>
        </article>`).join('') : SPC.empty('admin.noMessages', 'fa-envelope')}</div>`;
  }

  /* ---------- events (bound once) ---------- */
  const main = document.querySelector('.dash-main');
  DASH.bindApptActions(main, draw);
  main.addEventListener('click', e => {
    const q = s => e.target.closest(s);
    let el;
    if (q('#add-doctor')) doctorModal(null);
    else if ((el = q('[data-edit-doc]'))) doctorModal(Store.doctors.get(el.dataset.editDoc));
    else if ((el = q('[data-del-doc]'))) SPC.confirm(t('admin.deleteDoctor'), () => { Store.doctors.remove(el.dataset.delDoc); SPC.toast(t('admin.deleted')); draw(); });
    else if ((el = q('[data-del-msg]'))) SPC.confirm(t('dash.confirmTitle'), () => { Store.messages.remove(el.dataset.delMsg); draw(); });
    else if ((el = q('[data-filter]'))) { state.appt = el.dataset.filter; draw(); }
    else if (q('#reset-demo')) SPC.confirm(t('admin.resetConfirm'), () => {
      Store.reset();
      SPC.auth.setSession('u_admin');
      location.reload();
    });
  });
  main.addEventListener('input', e => {
    if (e.target.id !== 'pat-search') return;
    state.patSearch = e.target.value;
    document.getElementById('pat-table').innerHTML = patientsTable();
  });

  SPC.tabs(document.getElementById('dash'));
  window.renderPage = draw;
})();
