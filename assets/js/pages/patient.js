(function () {
  const me0 = SPC.auth.require(['patient']);
  if (!me0) return;
  const { t, L, esc } = SPC;
  const pane = n => document.querySelector(`[data-pane="${n}"]`);
  let apptFilter = 'upcoming';

  function draw() {
    const me = Store.patients.get(me0.id);
    const appts = Store.appointments.list({ patientId: me.id });
    const upcoming = appts.filter(DASH.isUpcoming);
    const past = appts.filter(a => !DASH.isUpcoming(a)).reverse();
    const records = Store.records.forPatient(me.id);
    const medsCount = records.reduce((n, r) => n + (r.medications || []).length, 0);

    document.getElementById('dash-user').innerHTML = DASH.userBox(me);

    // overview
    const next = upcoming[0];
    pane('overview').innerHTML = `
      <div class="dash-title"><h1>${t('dash.hello')}${SPC.lang === 'ar' ? '،' : ','} ${esc(me.name.split(' ')[0])} 👋</h1>
        <a href="book.html" class="btn btn-primary"><i class="fa-regular fa-calendar-plus"></i>${t('dash.bookNew')}</a></div>
      <div class="stat-cards">
        ${DASH.stat('fa-calendar-check', 'ic-blue', upcoming.length, 'stat.upcoming')}
        ${DASH.stat('fa-calendar-days', 'ic-teal', appts.length, 'stat.totalAppts')}
        ${DASH.stat('fa-file-medical', 'ic-peach', records.length, 'stat.records')}
        ${DASH.stat('fa-pills', 'ic-ink', medsCount, 'stat.meds')}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t('dash.nextAppt')}</h2></div>
        ${next ? `<div class="med" style="grid-template-columns:auto 1fr auto">
            <span class="pill" style="background:var(--blue-l);color:var(--blue)"><i class="fa-regular fa-calendar-check"></i></span>
            <div><b>${esc(DASH.docName(next.doctorId))}</b><small>${esc(DASH.svcName(next.service))}</small></div>
            <div style="text-align:end"><b>${SPC.fmtDate(next.date)}</b><small class="num">${SPC.fmtTime(next.time)}</small></div>
          </div>` : `<p class="muted" style="margin:0">${t('dash.noNext')}</p>`}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t('dash.records')}</h2></div>
        ${DASH.recordsHTML(records.slice(0, 1))}
      </div>`;

    // appointments
    const list = apptFilter === 'upcoming' ? upcoming : past;
    pane('appointments').innerHTML = `
      <div class="dash-title"><h1>${t('dash.appointments')}</h1>
        <a href="book.html" class="btn btn-primary"><i class="fa-regular fa-calendar-plus"></i>${t('dash.bookNew')}</a></div>
      <div class="panel">
        <div class="panel-head">
          <div class="checks">
            <button class="btn btn-sm ${apptFilter === 'upcoming' ? 'btn-primary' : 'btn-ghost'}" data-filter="upcoming">${t('dash.upcoming')} (${upcoming.length})</button>
            <button class="btn btn-sm ${apptFilter === 'past' ? 'btn-primary' : 'btn-ghost'}" data-filter="past">${t('dash.past')} (${past.length})</button>
          </div>
        </div>
        ${DASH.apptTable(list, { who: 'doctor', role: 'patient' })}
      </div>`;

    pane('records').innerHTML = `<div class="dash-title"><h1>${t('dash.records')}</h1></div><div class="panel">${DASH.recordsHTML(records)}</div>`;
    pane('meds').innerHTML = `<div class="dash-title"><h1>${t('dash.meds')}</h1></div><div class="panel">${DASH.medsHTML(records)}</div>`;

    // profile form
    const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${label}</option>`;
    pane('profile').innerHTML = `
      <div class="dash-title"><h1>${t('dash.profile')}</h1><small class="muted">${t('pf.memberSince')} ${SPC.fmtDate(me.createdAt)}</small></div>
      <form class="panel" id="profile-form">
        <div class="panel-head"><h2>${t('pf.personal')}</h2></div>
        <div class="form-grid">
          <div class="field"><label>${t('form.name')}</label><input name="name" value="${esc(me.name)}" required></div>
          <div class="field"><label>${t('form.phone')}</label><input name="phone" type="tel" value="${esc(me.phone)}" required></div>
          <div class="field"><label>${t('form.email')}</label><input name="email" type="email" value="${esc(me.email)}" required></div>
          <div class="field"><label>${t('form.dob')}</label><input name="dob" type="date" value="${esc(me.dob)}"></div>
          <div class="field"><label>${t('form.gender')}</label><select name="gender">${opt('male', me.gender, t('gender.male'))}${opt('female', me.gender, t('gender.female'))}</select></div>
          <div class="field"><label>${t('pf.emergency')}</label><input name="emergency" type="tel" value="${esc(me.emergency)}"></div>
          <div class="field full"><label>${t('pf.address')}</label><input name="address" value="${esc(me.address)}"></div>
        </div>
        <div class="panel-head" style="margin-top:24px"><h2>${t('pf.medical')}</h2></div>
        <div class="form-grid">
          <div class="field"><label>${t('pf.blood')}</label><select name="bloodType">${['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => opt(b, me.bloodType, b || '—')).join('')}</select></div>
          <div class="field"><label>${t('pf.allergies')}</label><input name="allergies" value="${esc(me.allergies)}"></div>
          <div class="field full"><label>${t('pf.conditions')}</label><textarea name="conditions" style="min-height:80px">${esc(me.conditions)}</textarea></div>
          <div class="field"><label>${t('form.password')}</label><input name="password" type="password" autocomplete="new-password" placeholder="${t('admin.passHint')}"></div>
        </div>
        <div style="margin-top:20px"><button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button></div>
      </form>`;
  }

  // one-time event bindings
  const main = document.querySelector('.dash-main');
  DASH.bindApptActions(main, draw);
  main.addEventListener('click', e => {
    const f = e.target.closest('[data-filter]');
    if (f) { apptFilter = f.dataset.filter; draw(); }
  });
  main.addEventListener('submit', e => {
    if (e.target.id !== 'profile-form') return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (!f.name.trim() || !f.email.trim() || !f.phone.trim()) { SPC.toast(t('form.required'), 'error'); return; }
    if (f.password && f.password.length < 6) { SPC.toast(t('register.short'), 'error'); return; }
    if (!f.password) delete f.password;
    try {
      Store.users.update(me0.id, f);
      SPC.toast(t('dash.saved'));
      SPC.setLang(SPC.lang); // refresh header name + panes
    } catch (err) {
      SPC.toast(t(err.code === 'email_taken' ? 'admin.emailTaken' : 'form.required'), 'error');
    }
  });

  SPC.tabs(document.getElementById('dash'));
  window.renderPage = draw;
})();
