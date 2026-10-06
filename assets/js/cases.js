/* Case files UI: symptom classification & search, progress, charts and modals.
   Severity scale 0 (none) – 10 (worst): a lower rating means the symptom improved. */
window.CASES = (function () {
  const { t, L, esc } = SPC;
  const COLORS = ['#2466ae', '#2f9c92', '#e08a3c', '#8e5bd0', '#d64545', '#3aa0d8', '#6b8e23', '#c2477a'];

  /* ---------- symptoms ---------- */
  const symName = s => { const c = Store.symptom(s.key); return c ? L(c) : (s.name || s.key); };
  /** Every language variant of a symptom's name (used by search). */
  const symTerms = s => { const c = Store.symptom(s.key); return c ? [c.en, c.ar] : [s.name || s.key]; };
  /** Maps typed text to a catalog symptom (matches English or Arabic), or a custom one. */
  function toSymptom(text) {
    const v = text.trim();
    const hit = Store.SYMPTOMS.find(x => [x.en, x.ar, x.key].some(n => n.toLowerCase() === v.toLowerCase()));
    if (hit) return { key: hit.key, name: '' };
    return { key: 'x_' + v.toLowerCase().replace(/\s+/g, '_'), name: v };
  }
  const datalist = () => `<datalist id="sym-list">${Store.SYMPTOMS.map(x => `<option value="${esc(L(x))}">`).join('')}</datalist>`;

  /* ---------- progress maths ---------- */
  /** Latest rating of a symptom; source 'doctor' (session ratings) or 'patient' (feedback). */
  function latest(c, key, source = 'doctor') {
    for (let i = c.sessions.length - 1; i >= 0; i--) {
      const r = source === 'doctor' ? c.sessions[i].ratings : (c.sessions[i].feedback || {}).ratings;
      if (r && r[key] !== undefined && r[key] !== '') return Number(r[key]);
    }
    return null;
  }
  const pct = (base, cur) => (cur === null || !base) ? null : Math.round((base - cur) / base * 100);
  function symImprovement(c, s, source = 'doctor') { return pct(Number(s.baseline), latest(c, s.key, source)); }
  /** Average improvement across the case's symptoms (null when no session yet). */
  function improvement(c, source = 'doctor') {
    const vals = c.symptoms.map(s => symImprovement(c, s, source)).filter(v => v !== null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }
  const tone = v => v === null ? 'none' : v >= 50 ? 'good' : v >= 20 ? 'ok' : v >= 0 ? 'low' : 'bad';
  const pctText = v => v === null ? '—' : `${v > 0 ? '+' : ''}${v}%`;
  const bar = v => `<div class="prog prog-${tone(v)}"><span style="width:${Math.max(0, Math.min(100, v || 0))}%"></span></div>`;
  const awaiting = c => c.sessions.filter(s => !s.feedback).length;

  /* ---------- search / classification ---------- */
  function matches(c, q) {
    q = q.trim().toLowerCase();
    if (!q) return true;
    const p = Store.patients.get(c.patientId);
    const hay = [c.title, p && p.name, (c.exam || {}).complaint, DASH.docName(c.doctorId), ...c.symptoms.flatMap(symTerms), ...(c.tests || []).map(x => x.name)];
    return hay.some(v => v && String(v).toLowerCase().includes(q));
  }
  /** Symptom -> number of cases, most common first. */
  function symptomCounts(list) {
    const m = new Map();
    list.forEach(c => c.symptoms.forEach(s => {
      const e = m.get(s.key) || { s, n: 0 };
      e.n++; m.set(s.key, e);
    }));
    return [...m.values()].sort((a, b) => b.n - a.n);
  }

  /* ---------- cards ---------- */
  function caseCard(c, { showPatient = true, showDoctor = true } = {}) {
    const p = Store.patients.get(c.patientId);
    const imp = improvement(c);
    const wait = awaiting(c);
    return `<a class="case-card" href="case.html?id=${c.id}">
      <div class="case-card-top">
        <span class="badge badge-case-${c.status}">${t('case.status.' + c.status)}</span>
        <small class="muted"><i class="fa-regular fa-calendar"></i> ${SPC.fmtDate(c.startDate, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
      </div>
      <h3>${esc(c.title)}</h3>
      ${showPatient && p ? `<div class="who">${SPC.avatar(p)}<b>${esc(p.name)}</b></div>` : ''}
      ${showDoctor ? `<small class="muted"><i class="fa-solid fa-user-doctor"></i> ${esc(DASH.docName(c.doctorId))}</small>` : ''}
      <div class="sym-chips">${c.symptoms.map(s => `<span class="sym-chip">${esc(symName(s))}</span>`).join('')}</div>
      <div class="case-card-foot">
        <div class="case-imp"><small>${t('case.improvement')}</small><b class="t-${tone(imp)}">${pctText(imp)}</b></div>
        ${bar(imp)}
        <div class="case-meta"><span><i class="fa-solid fa-person-walking"></i> ${c.sessions.length} ${t('case.sessionsN')}</span>
          ${wait && c.status === 'active' ? `<span class="t-low"><i class="fa-regular fa-comment-dots"></i> ${wait} ${t('case.awaitingN')}</span>` : ''}</div>
      </div>
    </a>`;
  }

  /**
   * Mounts a searchable, symptom-classified list of cases into el.
   * getCases() returns the cases to show; opts: {showPatient, showDoctor, extraFilters (html), toolbar (html)}.
   */
  function mountList(el, getCases, opts = {}) {
    const st = el._caseState || (el._caseState = { q: '', sym: '', status: 'active' });
    const results = () => {
      const all = getCases();
      const byStatus = all.filter(c => st.status === 'all' || c.status === st.status);
      const list = byStatus.filter(c => (!st.sym || c.symptoms.some(s => s.key === st.sym)) && matches(c, st.q));
      const chips = symptomCounts(byStatus);
      return `<div class="sym-filter">
          <button type="button" class="sym-chip ${!st.sym ? 'on' : ''}" data-sym="">${t('dash.all')} <b>${byStatus.length}</b></button>
          ${chips.map(({ s, n }) => `<button type="button" class="sym-chip ${st.sym === s.key ? 'on' : ''}" data-sym="${esc(s.key)}">${esc(symName(s))} <b>${n}</b></button>`).join('')}
        </div>
        ${list.length ? `<div class="case-grid">${list.map(c => caseCard(c, opts)).join('')}</div>` : SPC.empty('case.noResults', 'fa-folder-open')}`;
    };
    el.innerHTML = `
      <div class="case-toolbar">
        <div class="field case-search"><i class="fa-solid fa-magnifying-glass"></i><input type="search" data-case-q value="${esc(st.q)}" placeholder="${t('case.searchPh')}"></div>
        <div class="checks">${['active', 'closed', 'all'].map(f => `<button type="button" class="btn btn-sm ${st.status === f ? 'btn-primary' : 'btn-ghost'}" data-case-status="${f}">${t(f === 'all' ? 'dash.all' : 'case.status.' + f)}</button>`).join('')}</div>
        ${opts.toolbar || ''}
      </div>
      <div data-case-results>${results()}</div>`;
    const redraw = () => { el.querySelector('[data-case-results]').innerHTML = results(); };
    if (!el._caseBound) {
      el._caseBound = true;
      el.addEventListener('input', e => { if (e.target.matches('[data-case-q]')) { st.q = e.target.value; redraw(); } });
      el.addEventListener('click', e => {
        const s = e.target.closest('[data-sym]');
        const f = e.target.closest('[data-case-status]');
        if (s) { st.sym = s.dataset.sym; redraw(); }
        if (f) { st.status = f.dataset.caseStatus; st.sym = ''; mountList(el, getCases, opts); }
      });
    }
  }

  /* ---------- chart ---------- */
  /** Line chart of every symptom's severity: baseline + each session (doctor = solid, patient = dashed). */
  function chart(c) {
    if (!c.sessions.length) return `<p class="muted" style="margin:0">${t('case.noSessions')}</p>`;
    const W = 640, H = 250, pl = 34, pr = 16, pt = 14, pb = 34;
    const n = c.sessions.length + 1;
    const x = i => pl + (n === 1 ? 0 : i * (W - pl - pr) / (n - 1));
    const y = v => pt + (10 - v) * (H - pt - pb) / 10;
    const grid = [0, 2, 4, 6, 8, 10].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="ch-grid"/><text x="${pl - 8}" y="${y(v) + 4}" class="ch-lbl" text-anchor="end">${v}</text>`).join('');
    const xl = [t('case.baselineShort'), ...c.sessions.map(s => '#' + s.no)].map((l, i) => `<text x="${x(i)}" y="${H - 10}" class="ch-lbl" text-anchor="middle">${esc(l)}</text>`).join('');
    const lines = c.symptoms.map((s, k) => {
      const col = COLORS[k % COLORS.length];
      const pts = src => [[0, Number(s.baseline)], ...c.sessions.map((se, i) => {
        const r = src === 'doctor' ? se.ratings : (se.feedback || {}).ratings;
        return r && r[s.key] !== undefined && r[s.key] !== '' ? [i + 1, Number(r[s.key])] : null;
      })].filter(Boolean);
      const d = pts('doctor'), p = pts('patient');
      const path = arr => arr.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      return `<g>
        ${p.length > 1 ? `<polyline points="${path(p)}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="5 5" opacity=".6"/>` : ''}
        <polyline points="${path(d)}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        ${d.map(([i, v]) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" fill="#fff" stroke="${col}" stroke-width="2.5"><title>${esc(symName(s))}: ${v}/10</title></circle>`).join('')}
      </g>`;
    }).join('');
    const legend = c.symptoms.map((s, k) => `<span><i style="background:${COLORS[k % COLORS.length]}"></i>${esc(symName(s))}</span>`).join('');
    return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('case.chart')}">${grid}${xl}${lines}</svg></div>
      <div class="chart-legend">${legend}<span class="muted"><i class="ln-solid"></i>${t('case.docRating')}</span><span class="muted"><i class="ln-dash"></i>${t('case.patRating')}</span></div>`;
  }

  /** Per-symptom table: baseline → latest (doctor & patient) + improvement bar. */
  function progressTable(c) {
    return `<div class="sym-progress">${c.symptoms.map((s, k) => {
      const d = latest(c, s.key), p = latest(c, s.key, 'patient');
      const imp = symImprovement(c, s);
      return `<div class="sym-row">
        <div class="sym-row-name"><i style="background:${COLORS[k % COLORS.length]}"></i><b>${esc(symName(s))}</b></div>
        <div class="sym-row-vals">
          <span title="${t('case.baseline')}"><small>${t('case.baseline')}</small><b class="num">${s.baseline}/10</b></span>
          <span><small>${t('case.docRating')}</small><b class="num">${d === null ? '—' : d + '/10'}</b></span>
          <span><small>${t('case.patRating')}</small><b class="num">${p === null ? '—' : p + '/10'}</b></span>
        </div>
        <div class="sym-row-imp">${bar(imp)}<b class="num t-${tone(imp)}" dir="ltr">${pctText(imp)}</b></div>
      </div>`;
    }).join('')}</div>`;
  }

  /** Rating chips for a session: value and change vs the previous session (or baseline). */
  function ratingChips(c, ratings, sessionIndex, source = 'doctor') {
    return `<div class="rating-chips">${c.symptoms.filter(s => ratings && ratings[s.key] !== undefined && ratings[s.key] !== '').map(s => {
      const v = Number(ratings[s.key]);
      let prev = Number(s.baseline);
      for (let i = sessionIndex - 1; i >= 0; i--) {
        const r = source === 'doctor' ? c.sessions[i].ratings : (c.sessions[i].feedback || {}).ratings;
        if (r && r[s.key] !== undefined && r[s.key] !== '') { prev = Number(r[s.key]); break; }
      }
      const diff = v - prev;
      const arrow = diff < 0 ? `<em class="t-good"><i class="fa-solid fa-arrow-down"></i>${-diff}</em>` : diff > 0 ? `<em class="t-bad"><i class="fa-solid fa-arrow-up"></i>${diff}</em>` : `<em class="muted">=</em>`;
      return `<span class="rating-chip">${esc(symName(s))} <b class="num">${v}/10</b>${arrow}</span>`;
    }).join('')}</div>`;
  }

  /* ---------- modals ---------- */
  const range = (name, value, label, hint = '') => `<div class="rate-field">
      <div class="rate-top"><label>${esc(label)}</label><output class="num">${value}</output></div>
      <input type="range" min="0" max="10" step="1" name="${esc(name)}" value="${value}">
      <div class="rate-scale"><small>0 · ${t('case.none')}</small>${hint ? `<small>${hint}</small>` : ''}<small>10 · ${t('case.worst')}</small></div>
    </div>`;
  const bindRanges = root => root.addEventListener('input', e => {
    if (e.target.type === 'range') e.target.closest('.rate-field').querySelector('output').textContent = e.target.value;
  });

  /** New / edit case. fixed: {patientId, doctorId} (omit to choose). */
  function caseModal({ existing = null, patientId = null, doctorId = null, onSaved }) {
    const c = existing || { title: '', startDate: Store.ymd(new Date()), symptoms: [], exam: {}, status: 'active' };
    const ex = c.exam || {};
    const patients = Store.patients.list();
    const doctors = Store.doctors.list();
    const symRow = (s = { key: '', baseline: 5 }) => `<div class="sym-edit-row">
        <div class="field"><input list="sym-list" data-s="name" value="${s.key ? esc(symName(s)) : ''}" placeholder="${t('case.symptomPh')}"></div>
        <div class="sym-base"><input type="range" min="0" max="10" data-s="baseline" value="${s.baseline}"><output class="num">${s.baseline}</output></div>
        <button type="button" class="btn btn-danger btn-sm" data-remove-sym aria-label="remove"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    const sel = (name, list, cur, label) => `<div class="field"><label>${label}</label><select name="${name}" required>
        ${list.map(u => `<option value="${u.id}" ${u.id === cur ? 'selected' : ''}>${esc(L(u.name))}</option>`).join('')}</select></div>`;
    const m = SPC.modal({
      title: existing ? t('case.edit') : t('case.new'), size: 'lg',
      body: `<form class="form-grid" id="case-form">${datalist()}
        ${patientId || existing ? '' : sel('patientId', patients, '', t('th.patient') + ' *')}
        ${doctorId || existing ? '' : sel('doctorId', doctors, '', t('th.doctor') + ' *')}
        <div class="field"><label>${t('case.startDate')}</label><input type="date" name="startDate" value="${esc(c.startDate)}" required></div>
        <div class="field full"><label>${t('case.titleLbl')} *</label><input name="title" value="${esc(c.title)}" placeholder="${t('case.titlePh')}" required></div>

        <h4 class="form-section-title full"><i class="fa-solid fa-list-check"></i> ${t('case.symptoms')}</h4>
        <p class="muted full" style="margin:-8px 0 4px;font-size:.85rem">${t('case.symptomsHint')}</p>
        <div class="full" id="sym-rows">${(c.symptoms.length ? c.symptoms : [undefined]).map(s => symRow(s)).join('')}</div>
        <div class="full"><button type="button" class="btn btn-ghost btn-sm" id="add-sym"><i class="fa-solid fa-plus"></i>${t('case.addSymptom')}</button></div>

        <h4 class="form-section-title full"><i class="fa-solid fa-stethoscope"></i> ${t('case.exam')}</h4>
        <div class="field full"><label>${t('case.complaint')}</label><textarea name="complaint">${esc(ex.complaint || '')}</textarea></div>
        <div class="field full"><label>${t('case.history')}</label><textarea name="history">${esc(ex.history || '')}</textarea></div>
        <div class="field full"><label>${t('case.findings')}</label><textarea name="findings">${esc(ex.findings || '')}</textarea></div>
        <div class="field"><label>${t('case.rom')}</label><input name="rom" value="${esc(ex.rom || '')}"></div>
        <div class="field"><label>${t('rec.notes')}</label><input name="notes" value="${esc(ex.notes || '')}"></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-case"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });
    const form = m.el.querySelector('#case-form');
    const rows = m.el.querySelector('#sym-rows');
    m.el.querySelector('#add-sym').addEventListener('click', () => rows.insertAdjacentHTML('beforeend', symRow()));
    rows.addEventListener('click', e => { const b = e.target.closest('[data-remove-sym]'); if (b) b.closest('.sym-edit-row').remove(); });
    rows.addEventListener('input', e => { if (e.target.type === 'range') e.target.nextElementSibling.textContent = e.target.value; });
    m.el.querySelector('#save-case').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(form));
      const seen = new Set();
      const symptoms = [...rows.querySelectorAll('.sym-edit-row')].map(r => {
        const name = r.querySelector('[data-s="name"]').value;
        if (!name.trim()) return null;
        return Object.assign(toSymptom(name), { baseline: Number(r.querySelector('[data-s="baseline"]').value) });
      }).filter(s => s && !seen.has(s.key) && seen.add(s.key));
      if (!f.title.trim() || !f.startDate) { SPC.toast(t('form.required'), 'error'); return; }
      if (!symptoms.length) { SPC.toast(t('case.needSymptom'), 'error'); return; }
      const saved = Store.cases.save(Object.assign({}, existing || {}, {
        patientId: existing ? existing.patientId : (patientId || f.patientId),
        doctorId: existing ? existing.doctorId : (doctorId || f.doctorId),
        title: f.title.trim(), startDate: f.startDate, symptoms,
        exam: { complaint: f.complaint.trim(), history: f.history.trim(), findings: f.findings.trim(), rom: f.rom.trim(), notes: f.notes.trim() }
      }));
      m.close();
      SPC.toast(t('dash.saved'));
      onSaved && onSaved(saved);
    });
  }

  /** Doctor adds / edits a session with a rating for every symptom. */
  function sessionModal(c, session, onSaved) {
    const s = session || { date: Store.ymd(new Date()), ratings: {}, treatment: '', notes: '' };
    const m = SPC.modal({
      title: session ? `${t('case.session')} #${session.no}` : t('case.addSession'), size: 'lg',
      body: `<form class="form-grid" id="sess-form">
        <div class="field"><label>${t('th.date')}</label><input type="date" name="date" value="${esc(s.date)}" required></div>
        <h4 class="form-section-title full"><i class="fa-solid fa-sliders"></i> ${t('case.rateSymptoms')}</h4>
        <div class="full rate-list">${c.symptoms.map(sy => {
          const prev = latest(c, sy.key);
          const v = s.ratings[sy.key] !== undefined ? s.ratings[sy.key] : (prev !== null ? prev : sy.baseline);
          return range('r_' + sy.key, v, symName(sy), `${t('case.baseline')}: ${sy.baseline}`);
        }).join('')}</div>
        <div class="field full"><label>${t('case.treatment')}</label><textarea name="treatment" placeholder="${t('case.treatmentPh')}">${esc(s.treatment)}</textarea></div>
        <div class="field full"><label>${t('rec.notes')}</label><textarea name="notes">${esc(s.notes)}</textarea></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-sess"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });
    bindRanges(m.el);
    m.el.querySelector('#save-sess').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(m.el.querySelector('#sess-form')));
      if (!f.date) { SPC.toast(t('form.required'), 'error'); return; }
      const ratings = {};
      c.symptoms.forEach(sy => { ratings[sy.key] = Number(f['r_' + sy.key]); });
      Store.cases.saveSession(c.id, Object.assign(session ? { id: session.id } : {}, { date: f.date, ratings, treatment: f.treatment.trim(), notes: f.notes.trim() }));
      m.close();
      SPC.toast(t('case.sessionSaved'));
      onSaved && onSaved();
    });
  }

  /** Patient reports how each symptom feels after a session. */
  function feedbackModal(c, session, onSaved) {
    const fbk = session.feedback || { ratings: {}, overall: '', comment: '' };
    const m = SPC.modal({
      title: `${t('case.feedbackFor')} #${session.no} · ${SPC.fmtDate(session.date, { day: 'numeric', month: 'short' })}`, size: 'lg',
      body: `<form class="form-grid" id="fb-form">
        <p class="muted full" style="margin:0">${t('case.feedbackIntro')}</p>
        <div class="full rate-list">${c.symptoms.map(sy => {
          const prev = latest(c, sy.key, 'patient');
          const v = fbk.ratings[sy.key] !== undefined ? fbk.ratings[sy.key] : (prev !== null ? prev : sy.baseline);
          return range('r_' + sy.key, v, symName(sy));
        }).join('')}</div>
        <div class="field full"><label>${t('case.overall')}</label>
          <div class="overall-pick">${['better', 'same', 'worse'].map(o => `<label><input type="radio" name="overall" value="${o}" ${fbk.overall === o ? 'checked' : ''}><span class="ov-${o}"><i class="fa-regular ${o === 'better' ? 'fa-face-smile' : o === 'same' ? 'fa-face-meh' : 'fa-face-frown'}"></i>${t('case.ov.' + o)}</span></label>`).join('')}</div>
        </div>
        <div class="field full"><label>${t('case.comment')}</label><textarea name="comment" placeholder="${t('case.commentPh')}">${esc(fbk.comment || '')}</textarea></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-fb"><i class="fa-solid fa-paper-plane"></i>${t('case.sendFeedback')}</button>`
    });
    bindRanges(m.el);
    m.el.querySelector('#save-fb').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(m.el.querySelector('#fb-form')));
      if (!f.overall) { SPC.toast(t('case.pickOverall'), 'error'); return; }
      const ratings = {};
      c.symptoms.forEach(sy => { ratings[sy.key] = Number(f['r_' + sy.key]); });
      Store.cases.feedback(c.id, session.id, { ratings, overall: f.overall, comment: f.comment.trim() });
      m.close();
      SPC.toast(t('case.feedbackSaved'));
      onSaved && onSaved();
    });
  }

  const TEST_TYPES = ['xray', 'mri', 'ct', 'us', 'lab', 'other'];
  const TEST_ICONS = { xray: 'fa-x-ray', mri: 'fa-magnet', ct: 'fa-circle-radiation', us: 'fa-wave-square', lab: 'fa-vial', other: 'fa-file-waveform' };
  function testModal(c, onSaved) {
    const m = SPC.modal({
      title: t('case.addTest'),
      body: `<form class="form-grid" id="test-form">
        <div class="field"><label>${t('case.testType')}</label><select name="type">${TEST_TYPES.map(x => `<option value="${x}">${t('test.' + x)}</option>`).join('')}</select></div>
        <div class="field"><label>${t('th.date')}</label><input type="date" name="date" value="${Store.ymd(new Date())}" required></div>
        <div class="field full"><label>${t('case.testName')} *</label><input name="name" placeholder="${t('case.testNamePh')}" required></div>
        <div class="field full"><label>${t('case.testResult')}</label><textarea name="result"></textarea></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-test"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });
    m.el.querySelector('#save-test').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(m.el.querySelector('#test-form')));
      if (!f.name.trim() || !f.date) { SPC.toast(t('form.required'), 'error'); return; }
      Store.cases.addTest(c.id, { type: f.type, name: f.name.trim(), date: f.date, result: f.result.trim() });
      m.close();
      SPC.toast(t('dash.saved'));
      onSaved && onSaved();
    });
  }

  /** Latest patient feedback across cases (for dashboards). */
  function feedbackFeed(cases, limit = 5) {
    const items = cases.flatMap(c => c.sessions.filter(s => s.feedback).map(s => ({ c, s })))
      .sort((a, b) => b.s.feedback.date.localeCompare(a.s.feedback.date)).slice(0, limit);
    if (!items.length) return SPC.empty('case.noFeedback', 'fa-comment-dots');
    return `<div class="fb-feed">${items.map(({ c, s }) => {
      const p = Store.patients.get(c.patientId);
      const o = s.feedback.overall;
      return `<a class="fb-item" href="case.html?id=${c.id}#s-${s.id}">
        <span class="ov-dot ov-${o}"><i class="fa-regular ${o === 'better' ? 'fa-face-smile' : o === 'same' ? 'fa-face-meh' : 'fa-face-frown'}"></i></span>
        <div><b>${esc(p ? p.name : '—')}</b> <small class="muted">· ${esc(c.title)} · ${t('case.session')} #${s.no}</small>
          <p>${s.feedback.comment ? '“' + esc(s.feedback.comment) + '”' : `<span class="muted">${t('case.ov.' + o)}</span>`}</p></div>
        <small class="muted">${SPC.fmtDate(s.feedback.date, { day: 'numeric', month: 'short' })}</small>
      </a>`;
    }).join('')}</div>`;
  }

  return {
    COLORS, TEST_ICONS, symName, latest, improvement, symImprovement, tone, pctText, bar, awaiting,
    matches, caseCard, mountList, chart, progressTable, ratingChips,
    caseModal, sessionModal, feedbackModal, testModal, feedbackFeed
  };
})();
