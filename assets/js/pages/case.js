(function () {
  const me = SPC.auth.require(['doctor', 'admin', 'patient']);
  if (!me) return;
  const { t, esc } = SPC;
  const root = document.getElementById('case-file');
  const id = SPC.qs('id');
  const isStaff = me.role !== 'patient';

  const overallIcon = o => o === 'better' ? 'fa-face-smile' : o === 'same' ? 'fa-face-meh' : 'fa-face-frown';
  const dl = (rows) => `<dl class="exam-dl">${rows.filter(([, v]) => v).map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(v)}</dd>`).join('') || `<dd class="muted">${t('dash.noData')}</dd>`}</dl>`;

  function draw() {
    const c = Store.cases.get(id);
    const backUrl = me.role === 'patient' ? 'patient-dashboard.html#progress' : SPC.auth.dashboardUrl(me.role) + '#cases';
    const back = `<a href="${backUrl}" class="btn btn-ghost btn-sm"><i class="fa-solid fa-arrow-${SPC.lang === 'ar' ? 'right' : 'left'}"></i>${t('dash.back')}</a>`;
    // patients may only open their own cases
    if (!c || (me.role === 'patient' && c.patientId !== me.id)) { root.innerHTML = `${back}${SPC.empty('dash.noData', 'fa-folder-open')}`; return; }

    const p = Store.patients.get(c.patientId);
    const imp = CASES.improvement(c);
    const impPat = CASES.improvement(c, 'patient');
    const wait = CASES.awaiting(c);
    document.title = `SPC | ${c.title}`;

    const staffActions = isStaff ? `<div class="actions case-actions">
        <button class="btn btn-primary" data-act="session"><i class="fa-solid fa-plus"></i>${t('case.addSession')}</button>
        <button class="btn btn-outline" data-act="edit"><i class="fa-solid fa-pen"></i>${t('case.edit')}</button>
        <button class="btn btn-ghost" data-act="status"><i class="fa-solid ${c.status === 'active' ? 'fa-box-archive' : 'fa-rotate-left'}"></i>${t(c.status === 'active' ? 'case.close' : 'case.reopen')}</button>
      </div>` : '';

    const sessions = c.sessions.map((s, i) => ({ s, i })).reverse().map(({ s, i }) => {
      const f = s.feedback;
      const fbBlock = f ? `<div class="fb-box ov-${f.overall}">
            <div class="fb-head"><i class="fa-regular ${overallIcon(f.overall)}"></i><b>${t('case.patientFeedback')}: ${t('case.ov.' + f.overall)}</b><small class="muted">${SPC.fmtDate(f.date, { day: 'numeric', month: 'short' })}</small>
              ${me.role === 'patient' && c.status === 'active' ? `<button class="btn btn-ghost btn-sm" data-fb="${s.id}"><i class="fa-solid fa-pen"></i>${t('dash.edit')}</button>` : ''}</div>
            ${CASES.ratingChips(c, f.ratings, i, 'patient')}
            ${f.comment ? `<p>“${esc(f.comment)}”</p>` : ''}
          </div>`
        : me.role === 'patient' && c.status === 'active'
          ? `<div class="fb-box fb-empty"><span>${t('case.howFeel')}</span><button class="btn btn-teal btn-sm" data-fb="${s.id}"><i class="fa-regular fa-comment-dots"></i>${t('case.giveFeedback')}</button></div>`
          : `<div class="fb-box fb-empty"><span class="muted"><i class="fa-regular fa-hourglass-half"></i> ${t('case.awaitingFb')}</span></div>`;
      return `<article class="session" id="s-${s.id}">
        <div class="session-head">
          <div><span class="session-no">#${s.no}</span><b>${t('case.session')} ${s.no}</b><small class="muted"> · ${SPC.fmtDate(s.date)}</small></div>
          ${isStaff ? `<div class="actions"><button class="btn btn-ghost btn-sm" data-edit-session="${s.id}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-ghost btn-sm" data-del-session="${s.id}"><i class="fa-solid fa-trash"></i></button></div>` : ''}
        </div>
        <small class="lbl">${t('case.docRating')}</small>
        ${CASES.ratingChips(c, s.ratings, i)}
        ${s.treatment ? `<p><b>${t('case.treatment')}:</b> ${esc(s.treatment)}</p>` : ''}
        ${s.notes ? `<p class="muted"><b>${t('rec.notes')}:</b> ${esc(s.notes)}</p>` : ''}
        ${fbBlock}
      </article>`;
    }).join('');

    const tests = c.tests.length ? `<div class="test-list">${c.tests.slice().sort((a, b) => b.date.localeCompare(a.date)).map(x => `
        <div class="test">
          <span class="pill"><i class="fa-solid ${CASES.TEST_ICONS[x.type] || 'fa-file-waveform'}"></i></span>
          <div><b>${esc(x.name)}</b><small class="muted">${t('test.' + x.type)} · ${SPC.fmtDate(x.date)}</small>${x.result ? `<p>${esc(x.result)}</p>` : ''}</div>
          ${isStaff ? `<button class="btn btn-ghost btn-sm" data-del-test="${x.id}" aria-label="delete"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>`).join('')}</div>` : SPC.empty('dash.noData', 'fa-file-waveform');

    root.innerHTML = `
      <div class="dash-title">
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
          ${back}
          <div>
            <span class="badge badge-case-${c.status}">${t('case.status.' + c.status)}</span>
            <h1 style="margin:6px 0 2px;font-size:1.5rem">${esc(c.title)}</h1>
            <small class="muted">${isStaff && p ? `<a href="patient-profile.html?id=${p.id}" style="color:var(--blue);font-weight:700">${esc(p.name)}</a> · ` : ''}${esc(DASH.docName(c.doctorId))} · ${t('case.startDate')}: ${SPC.fmtDate(c.startDate)}</small>
          </div>
        </div>
        ${staffActions}
      </div>

      <div class="stat-cards">
        ${DASH.stat('fa-chart-line', 'ic-teal', `<bdi dir="ltr">${CASES.pctText(imp)}</bdi>`, 'case.improvementDoc')}
        ${DASH.stat('fa-face-smile', 'ic-blue', `<bdi dir="ltr">${CASES.pctText(impPat)}</bdi>`, 'case.improvementPat')}
        ${DASH.stat('fa-person-walking', 'ic-peach', c.sessions.length, 'case.sessionsDone')}
        ${DASH.stat('fa-comment-dots', 'ic-ink', wait, 'case.awaitingFb')}
      </div>

      <div class="case-layout">
        <div>
          <div class="panel">
            <div class="panel-head"><h2><i class="fa-solid fa-chart-line" style="color:var(--teal)"></i> ${t('case.progress')}</h2><small class="muted">${t('case.scaleNote')}</small></div>
            ${CASES.chart(c)}
            ${CASES.progressTable(c)}
          </div>
          <div class="panel">
            <div class="panel-head"><h2><i class="fa-solid fa-clipboard-list" style="color:var(--teal)"></i> ${t('case.followUp')}</h2>
              ${isStaff && c.status === 'active' ? `<button class="btn btn-primary btn-sm" data-act="session"><i class="fa-solid fa-plus"></i>${t('case.addSession')}</button>` : ''}</div>
            ${sessions || SPC.empty('case.noSessions', 'fa-clipboard')}
          </div>
        </div>
        <div>
          <div class="panel">
            <div class="panel-head"><h2><i class="fa-solid fa-stethoscope" style="color:var(--teal)"></i> ${t('case.exam')}</h2></div>
            ${dl([['case.complaint', c.exam.complaint], ['case.history', c.exam.history], ['case.findings', c.exam.findings], ['case.rom', c.exam.rom], ['rec.notes', c.exam.notes]])}
          </div>
          <div class="panel">
            <div class="panel-head"><h2><i class="fa-solid fa-x-ray" style="color:var(--teal)"></i> ${t('case.tests')}</h2>
              ${isStaff ? `<button class="btn btn-outline btn-sm" data-act="test"><i class="fa-solid fa-plus"></i>${t('case.addTest')}</button>` : ''}</div>
            ${tests}
          </div>
        </div>
      </div>`;
  }

  root.addEventListener('click', e => {
    const c = Store.cases.get(id);
    if (!c) return;
    const act = e.target.closest('[data-act]');
    const fb = e.target.closest('[data-fb]');
    const es = e.target.closest('[data-edit-session]');
    const ds = e.target.closest('[data-del-session]');
    const dt = e.target.closest('[data-del-test]');
    if (act && isStaff) {
      const a = act.dataset.act;
      if (a === 'session') CASES.sessionModal(c, null, draw);
      if (a === 'edit') CASES.caseModal({ existing: c, onSaved: draw });
      if (a === 'test') CASES.testModal(c, draw);
      if (a === 'status') { Store.cases.save({ id: c.id, status: c.status === 'active' ? 'closed' : 'active' }); SPC.toast(t('dash.saved')); draw(); }
    }
    if (fb && me.role === 'patient') CASES.feedbackModal(c, c.sessions.find(s => s.id === fb.dataset.fb), draw);
    if (es && isStaff) CASES.sessionModal(c, c.sessions.find(s => s.id === es.dataset.editSession), draw);
    if (ds && isStaff) SPC.confirm(t('case.delSession'), () => { Store.cases.removeSession(c.id, ds.dataset.delSession); draw(); });
    if (dt && isStaff) SPC.confirm(t('case.delTest'), () => { Store.cases.removeTest(c.id, dt.dataset.delTest); draw(); });
  });

  window.renderPage = draw;
  // deep link to a session (e.g. from the feedback feed)
  window.addEventListener('load', () => {
    const el = location.hash && document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
})();
