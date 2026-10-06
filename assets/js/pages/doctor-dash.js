(function () {
  const me0 = SPC.auth.require(['doctor']);
  if (!me0) return;
  const { t, L, esc } = SPC;
  const pane = n => document.querySelector(`[data-pane="${n}"]`);
  let apptFilter = 'upcoming';
  let search = '';
  let caseScope = 'mine';

  function patientsTable(me) {
    const mine = Store.appointments.list({ doctorId: me.id });
    const q = search.trim().toLowerCase();
    const list = Store.patients.list()
      .map(p => Object.assign(p, { visits: mine.filter(a => a.patientId === p.id && a.status !== 'cancelled').length }))
      .filter(p => !q || [p.name, p.phone, p.email].some(v => String(v).toLowerCase().includes(q)))
      .sort((a, b) => b.visits - a.visits);
    if (!list.length) return SPC.empty();
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>${t('th.name')}</th><th>${t('th.phone')}</th><th>${t('pf.age')}</th><th>${t('th.visits')}</th><th>${t('th.actions')}</th></tr></thead>
      <tbody>${list.map(p => `<tr>
        <td><div class="who">${SPC.avatar(p)}<b>${esc(p.name)}</b></div></td>
        <td><span class="num">${esc(p.phone)}</span></td>
        <td>${p.dob ? SPC.age(p.dob) : '—'}</td>
        <td>${p.visits}</td>
        <td><a class="btn btn-outline btn-sm" href="patient-profile.html?id=${p.id}"><i class="fa-regular fa-folder-open"></i>${t('doc.openFile')}</a></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function draw() {
    const me = Store.doctors.get(me0.id);
    const d = me.doctor;
    const appts = Store.appointments.list({ doctorId: me.id });
    const today = Store.ymd(new Date());
    const todays = appts.filter(a => a.date === today && a.status !== 'cancelled');
    const upcoming = appts.filter(DASH.isUpcoming);
    const past = appts.filter(a => !DASH.isUpcoming(a)).reverse();
    const patientIds = new Set(appts.map(a => a.patientId));
    const myCases = Store.cases.list({ doctorId: me.id });

    document.getElementById('dash-user').innerHTML = DASH.userBox(me);

    pane('overview').innerHTML = `
      <div class="dash-title"><h1>${t('dash.hello')}${SPC.lang === 'ar' ? '،' : ','} ${esc(L(d.name))}</h1><span class="muted">${SPC.fmtDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
      <div class="stat-cards">
        ${DASH.stat('fa-calendar-day', 'ic-blue', todays.length, 'stat.today')}
        ${DASH.stat('fa-calendar-check', 'ic-teal', upcoming.length, 'stat.upcoming')}
        ${DASH.stat('fa-hospital-user', 'ic-peach', patientIds.size, 'stat.patients')}
        ${DASH.stat('fa-notes-medical', 'ic-ink', myCases.filter(c => c.status === 'active').length, 'stat.activeCases')}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t('doc.todayTitle')}</h2></div>
        ${todays.length ? DASH.apptTable(todays, { who: 'patient', role: 'doctor' }) : `<p class="muted" style="margin:0">${t('doc.noToday')}</p>`}
      </div>
      <div class="panel">
        <div class="panel-head"><h2>${t('dash.upcoming')}</h2></div>
        ${DASH.apptTable(upcoming.slice(0, 6), { who: 'patient', role: 'doctor' })}
      </div>
      <div class="panel">
        <div class="panel-head"><h2><i class="fa-regular fa-comment-dots" style="color:var(--teal)"></i> ${t('case.latestFeedback')}</h2><button class="btn btn-ghost btn-sm" data-goto="cases">${t('dash.cases')}</button></div>
        ${CASES.feedbackFeed(myCases)}
      </div>`;

    pane('cases').innerHTML = `
      <div class="dash-title"><h1>${t('dash.cases')}</h1>
        <button class="btn btn-primary" data-new-case><i class="fa-solid fa-folder-plus"></i>${t('case.new')}</button></div>
      <div class="panel" id="cases-list"></div>`;
    CASES.mountList(document.getElementById('cases-list'),
      () => Store.cases.list(caseScope === 'mine' ? { doctorId: me.id } : {}),
      { showDoctor: caseScope !== 'mine', toolbar: `<div class="checks">${['mine', 'clinic'].map(x => `<button type="button" class="btn btn-sm ${caseScope === x ? 'btn-teal' : 'btn-ghost'}" data-scope="${x}">${t('case.scope.' + x)}</button>`).join('')}</div>` });

    const list = apptFilter === 'upcoming' ? upcoming : apptFilter === 'past' ? past : appts.slice().reverse();
    pane('appointments').innerHTML = `
      <div class="dash-title"><h1>${t('dash.appointments')}</h1></div>
      <div class="panel">
        <div class="panel-head"><div class="checks">
          ${['upcoming', 'past', 'all'].map(f => `<button class="btn btn-sm ${apptFilter === f ? 'btn-primary' : 'btn-ghost'}" data-filter="${f}">${t('dash.' + f)}</button>`).join('')}
        </div></div>
        ${DASH.apptTable(list, { who: 'patient', role: 'doctor' })}
      </div>`;

    pane('patients').innerHTML = `
      <div class="dash-title"><h1>${t('dash.patients')}</h1></div>
      <div class="panel">
        <div class="panel-head"><div class="field" style="min-width:260px"><input type="search" id="pat-search" value="${esc(search)}" placeholder="${t('dash.search')}"></div></div>
        <div id="pat-table">${patientsTable(me)}</div>
      </div>`;

    pane('profile').innerHTML = `
      <div class="dash-title"><h1>${t('doc.myCv')}</h1><a class="btn btn-outline" href="doctor.html?id=${me.id}" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i>${t('doc.viewPublic')}</a></div>
      <div class="panel">
        <div class="dash-user" style="border:0;padding:0">${SPC.avatar(me)}<div><b>${esc(L(d.name))}</b><small>${esc(L(d.specialty))}</small></div></div>
        <div class="info-grid" style="margin-top:14px">
          <div><small>${t('doctor.age')}</small><b>${d.age}</b></div>
          <div><small>${t('doctor.experience')}</small><b>${d.years}+ ${t('doctor.years')}</b></div>
          <div><small>${t('doctor.university')}</small><b>${esc(L(d.university))}</b></div>
          <div><small>${t('th.email')}</small><b class="num">${esc(me.email)}</b></div>
          <div><small>${t('doctor.schedule')}</small><b>${d.schedule.days.map(x => t('day.' + x)).join('، ')}</b></div>
          <div><small>${t('doctor.hours')}</small><b class="num">${SPC.fmtTime(d.schedule.start)} – ${SPC.fmtTime(d.schedule.end)}</b></div>
        </div>
        <p class="muted" style="margin:16px 0 0">${esc(L(d.bio))}</p>
      </div>`;
  }

  const main = document.querySelector('.dash-main');
  DASH.bindApptActions(main, draw);
  main.addEventListener('click', e => {
    const f = e.target.closest('[data-filter]');
    if (f) { apptFilter = f.dataset.filter; draw(); }
    const sc = e.target.closest('[data-scope]');
    if (sc) { caseScope = sc.dataset.scope; draw(); }
    if (e.target.closest('[data-new-case]')) CASES.caseModal({ doctorId: me0.id, onSaved: c => { location.href = 'case.html?id=' + c.id; } });
    const g = e.target.closest('[data-goto]');
    if (g) showTab(g.dataset.goto);
  });
  main.addEventListener('input', e => {
    if (e.target.id !== 'pat-search') return;
    search = e.target.value;
    document.getElementById('pat-table').innerHTML = patientsTable(Store.doctors.get(me0.id));
  });

  const showTab = SPC.tabs(document.getElementById('dash'));
  window.renderPage = draw;
})();
