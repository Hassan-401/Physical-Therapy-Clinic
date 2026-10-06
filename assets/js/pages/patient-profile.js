(function () {
  const staff = SPC.auth.require(['doctor', 'admin']);
  if (!staff) return;
  const { t, esc } = SPC;
  const root = document.getElementById('patient-file');
  const pid = SPC.qs('id');

  function draw() {
    const p = Store.patients.get(pid);
    const back = `<a href="${SPC.auth.dashboardUrl(staff.role)}#patients" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-${SPC.lang === 'ar' ? 'right' : 'left'}"></i>${t('dash.back')}</a>`;
    if (!p) { root.innerHTML = `${back}${SPC.empty('dash.noData', 'fa-user')}`; return; }

    const appts = Store.appointments.list({ patientId: p.id }).reverse();
    const records = Store.records.forPatient(p.id);
    const cases = Store.cases.list({ patientId: p.id });
    document.title = `SPC | ${p.name}`;

    root.innerHTML = `
      <div class="dash-title">
        <div style="display:flex;gap:14px;align-items:center">
          ${back}
          <div class="dash-user" style="border:0;padding:0;margin:0">${SPC.avatar(p)}<div><b style="font-size:1.25rem">${esc(p.name)}</b><small>${t('pf.title')} · ${t('pf.memberSince')} ${SPC.fmtDate(p.createdAt)}</small></div></div>
        </div>
        <button class="btn btn-primary" id="add-record"><i class="fa-solid fa-file-circle-plus"></i>${t('rec.add')}</button>
      </div>

      <div class="stat-cards">
        ${DASH.stat('fa-calendar-days', 'ic-blue', appts.filter(a => a.status !== 'cancelled').length, 'stat.totalAppts')}
        ${DASH.stat('fa-calendar-check', 'ic-teal', appts.filter(DASH.isUpcoming).length, 'stat.upcoming')}
        ${DASH.stat('fa-file-medical', 'ic-peach', records.length, 'stat.records')}
        ${DASH.stat('fa-pills', 'ic-ink', records.reduce((n, r) => n + (r.medications || []).length, 0), 'stat.meds')}
      </div>

      <div class="panel"><div class="panel-head"><h2><i class="fa-regular fa-id-card" style="color:var(--teal)"></i> ${t('pf.personal')}</h2></div>${DASH.patientInfo(p)}</div>
      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-notes-medical" style="color:var(--teal)"></i> ${t('dash.cases')}</h2>
        <button class="btn btn-outline btn-sm" id="add-case"><i class="fa-solid fa-folder-plus"></i>${t('case.new')}</button></div>
        ${cases.length ? `<div class="case-grid">${cases.map(c => CASES.caseCard(c, { showPatient: false })).join('')}</div>` : SPC.empty('dash.noData', 'fa-notes-medical')}</div>
      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-file-medical" style="color:var(--teal)"></i> ${t('dash.records')}</h2></div>${DASH.recordsHTML(records)}</div>
      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-pills" style="color:var(--teal)"></i> ${t('dash.meds')}</h2></div>${DASH.medsHTML(records)}</div>
      <div class="panel"><div class="panel-head"><h2><i class="fa-regular fa-calendar" style="color:var(--teal)"></i> ${t('dash.appointments')}</h2></div>${DASH.apptTable(appts, { who: 'doctor', role: staff.role })}</div>`;
  }

  root.addEventListener('click', e => {
    if (e.target.closest('#add-case')) CASES.caseModal({ patientId: pid, doctorId: staff.role === 'doctor' ? staff.id : null, onSaved: c => { location.href = 'case.html?id=' + c.id; } });
    if (e.target.closest('#add-record')) DASH.recordModal(pid, staff.role === 'doctor' ? staff.id : null, draw);
  });
  DASH.bindApptActions(root, draw);
  window.renderPage = draw;
})();
