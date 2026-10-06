/* Shared dashboard renderers (patient / doctor / admin / patient file) */
window.DASH = (function () {
  const { t, L, esc } = SPC;
  const pad = n => String(n).padStart(2, '0');
  const nowKey = () => { const n = new Date(); return `${Store.ymd(n)} ${pad(n.getHours())}:${pad(n.getMinutes())}`; };
  const isUpcoming = a => a.status === 'confirmed' && `${a.date} ${a.time}` >= nowKey();
  const docName = id => { const d = Store.doctors.get(id); return d ? L(d.name) : '—'; };
  const patName = id => { const p = Store.patients.get(id); return p ? p.name : '—'; };
  const svcName = id => { const s = Store.service(id); return s ? L(s.title) : (id || '—'); };

  const stat = (icon, cls, val, key) =>
    `<div class="stat"><span class="ic ${cls}"><i class="fa-solid ${icon}"></i></span><div><b>${val}</b><small>${t(key)}</small></div></div>`;

  function userBox(u) {
    return `${SPC.avatar(u)}<div><b>${esc(L(u.name))}</b><small>${t('role.' + u.role)}</small></div>`;
  }

  /** who: which person column to show ('doctor' | 'patient' | 'both'); role controls actions */
  function apptTable(list, { who = 'doctor', role = 'patient' } = {}) {
    if (!list.length) return SPC.empty('dash.noData', 'fa-calendar');
    const showDoc = who === 'doctor' || who === 'both';
    const showPat = who === 'patient' || who === 'both';
    const showPay = role !== 'doctor';
    const patCell = a => role === 'patient' ? esc(patName(a.patientId))
      : `<a href="patient-profile.html?id=${a.patientId}" style="color:var(--blue);font-weight:700">${esc(patName(a.patientId))}</a>`;
    const actions = a => {
      const btns = [];
      if (role !== 'patient' && a.status === 'confirmed') btns.push(`<button class="btn btn-success btn-sm" data-complete="${a.id}"><i class="fa-solid fa-check"></i>${t('appt.complete')}</button>`);
      if (role === 'admin' && a.payment === 'cash' && a.status !== 'cancelled') btns.push(a.paid
        ? `<button class="btn btn-ghost btn-sm" data-unpaid="${a.id}" title="${t('pay.markUnpaid')}"><i class="fa-solid fa-rotate-left"></i></button>`
        : `<button class="btn btn-outline btn-sm" data-paid="${a.id}"><i class="fa-solid fa-money-bill-wave"></i>${t('pay.markPaid')}</button>`);
      if (isUpcoming(a)) btns.push(`<button class="btn btn-danger btn-sm" data-cancel="${a.id}"><i class="fa-solid fa-xmark"></i>${t('appt.cancel')}</button>`);
      return `<div class="actions">${btns.join('') || '—'}</div>`;
    };
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>${t('th.date')}</th><th>${t('th.time')}</th>${showDoc ? `<th>${t('th.doctor')}</th>` : ''}${showPat ? `<th>${t('th.patient')}</th>` : ''}<th>${t('th.service')}</th>${showPay ? `<th>${t('th.price')}</th>` : ''}<th>${t('th.status')}</th><th>${t('th.actions')}</th></tr></thead>
      <tbody>${list.map(a => `<tr>
        <td>${SPC.fmtDate(a.date)}</td>
        <td><span class="num">${SPC.fmtTime(a.time)}</span></td>
        ${showDoc ? `<td>${esc(docName(a.doctorId))}</td>` : ''}
        ${showPat ? `<td>${patCell(a)}</td>` : ''}
        <td>${esc(svcName(a.service))}${a.kind ? `<small class="muted" style="display:block">${t('kind.' + a.kind)}</small>` : ''}</td>
        ${showPay ? `<td>${SPC.payBadge(a)}</td>` : ''}
        <td>${SPC.statusBadge(a.status)}</td>
        <td>${actions(a)}</td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  /** Handles cancel / complete buttons inside root (bind once). */
  function bindApptActions(root, rerender) {
    root.addEventListener('click', e => {
      const c = e.target.closest('[data-cancel]');
      const d = e.target.closest('[data-complete]');
      const p = e.target.closest('[data-paid],[data-unpaid]');
      if (p) {
        Store.appointments.setPaid(p.dataset.paid || p.dataset.unpaid, !!p.dataset.paid);
        SPC.toast(t('pay.updated'));
        rerender();
      }
      if (c) SPC.confirm(t('appt.cancelConfirm'), () => {
        Store.appointments.setStatus(c.dataset.cancel, 'cancelled');
        SPC.toast(t('appt.cancelled'));
        rerender();
      });
      if (d) {
        Store.appointments.setStatus(d.dataset.complete, 'completed');
        SPC.toast(t('appt.completed'));
        rerender();
      }
    });
  }

  function medsTable(meds) {
    if (!meds || !meds.length) return '';
    return `<div class="table-wrap" style="margin-top:12px"><table class="table">
      <thead><tr><th>${t('med.name')}</th><th>${t('med.dose')}</th><th>${t('med.freq')}</th><th>${t('med.duration')}</th></tr></thead>
      <tbody>${meds.map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.dose)}</td><td>${esc(m.freq)}</td><td>${esc(m.duration)}</td></tr>`).join('')}</tbody>
    </table></div>`;
  }

  function recordsHTML(records) {
    if (!records.length) return SPC.empty('dash.noData', 'fa-file-medical');
    return records.map(r => `
      <article class="record">
        <div class="record-head">
          <div><h3>${esc(r.diagnosis)}</h3><small>${t('rec.by')} ${esc(docName(r.doctorId))}</small></div>
          <small><i class="fa-regular fa-calendar"></i> ${SPC.fmtDate(r.date)}</small>
        </div>
        <dl>
          <dt>${t('rec.plan')}</dt><dd>${esc(r.plan) || '—'}</dd>
          <dt>${t('rec.notes')}</dt><dd>${esc(r.notes) || '—'}</dd>
          <dt>${t('rec.sessions')}</dt><dd>${r.sessions || '—'}</dd>
        </dl>
        ${r.medications && r.medications.length ? `<h4 style="margin:14px 0 0;font-size:.92rem;color:var(--teal)"><i class="fa-solid fa-pills"></i> ${t('rec.meds')}</h4>${medsTable(r.medications)}` : ''}
      </article>`).join('');
  }

  function medsHTML(records) {
    const meds = records.flatMap(r => (r.medications || []).map(m => Object.assign({ date: r.date, doctorId: r.doctorId }, m)));
    if (!meds.length) return SPC.empty('dash.noData', 'fa-pills');
    return `<div class="med-list">${meds.map(m => `
      <div class="med">
        <span class="pill"><i class="fa-solid fa-capsules"></i></span>
        <div><b>${esc(m.name)}</b><small>${esc(m.dose)} · ${esc(m.freq)} · ${esc(m.duration)}</small></div>
        <small class="muted" style="text-align:end">${t('med.prescribedBy')} ${esc(docName(m.doctorId))}<br>${SPC.fmtDate(m.date)}</small>
      </div>`).join('')}</div>`;
  }

  function patientInfo(p) {
    const val = v => esc(v) || `<span class="muted">${t('pf.none')}</span>`;
    const items = [
      ['th.phone', `<span class="num">${esc(p.phone)}</span>`], ['th.email', `<span class="num">${esc(p.email)}</span>`],
      ['pf.age', p.dob ? `${SPC.age(p.dob)} ${t('doctor.yearsOld')}` : '—'], ['form.gender', p.gender ? t('gender.' + p.gender) : '—'],
      ['pf.blood', val(p.bloodType)], ['pf.emergency', `<span class="num">${val(p.emergency)}</span>`],
      ['pf.address', val(p.address)], ['pf.conditions', val(p.conditions)], ['pf.allergies', val(p.allergies)]
    ];
    return `<div class="info-grid">${items.map(([k, v]) => `<div><small>${t(k)}</small><b>${v}</b></div>`).join('')}</div>`;
  }

  /** Modal to add a medical record. doctorId fixed for doctors, selectable for admin. */
  function recordModal(patientId, doctorId, onSaved) {
    const doctors = Store.doctors.list();
    const docField = doctorId ? '' : `<div class="field full"><label>${t('th.doctor')}</label>
      <select name="doctorId" required>${doctors.map(d => `<option value="${d.id}">${esc(L(d.name))}</option>`).join('')}</select></div>`;
    const medRow = () => `<div class="form-grid med-row" style="grid-template-columns:1.3fr 1fr 1.3fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end">
      <div class="field"><input data-m="name" placeholder="${t('med.name')}"></div>
      <div class="field"><input data-m="dose" placeholder="${t('med.dose')}"></div>
      <div class="field"><input data-m="freq" placeholder="${t('med.freq')}"></div>
      <div class="field"><input data-m="duration" placeholder="${t('med.duration')}"></div>
      <button type="button" class="btn btn-danger btn-sm" data-remove-med aria-label="remove"><i class="fa-solid fa-trash"></i></button>
    </div>`;
    const m = SPC.modal({
      title: t('rec.add'), size: 'lg',
      body: `<form class="form-grid" id="rec-form">
        ${docField}
        <div class="field"><label>${t('th.date')}</label><input type="date" name="date" value="${Store.ymd(new Date())}" required></div>
        <div class="field"><label>${t('rec.sessions')}</label><input type="number" min="0" name="sessions" value="6"></div>
        <div class="field full"><label>${t('rec.diagnosis')} *</label><input name="diagnosis" required></div>
        <div class="field full"><label>${t('rec.plan')}</label><textarea name="plan" style="min-height:80px"></textarea></div>
        <div class="field full"><label>${t('rec.notes')}</label><textarea name="notes" style="min-height:80px"></textarea></div>
        <h4 class="form-section-title full"><i class="fa-solid fa-pills"></i> ${t('rec.meds')}</h4>
        <div class="full" id="med-rows">${medRow()}</div>
        <div class="full"><button type="button" class="btn btn-ghost btn-sm" id="add-med"><i class="fa-solid fa-plus"></i>${t('med.add')}</button></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-rec"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });
    const form = m.el.querySelector('#rec-form');
    const rows = m.el.querySelector('#med-rows');
    m.el.querySelector('#add-med').addEventListener('click', () => rows.insertAdjacentHTML('beforeend', medRow()));
    rows.addEventListener('click', e => { const b = e.target.closest('[data-remove-med]'); if (b) b.closest('.med-row').remove(); });
    m.el.querySelector('#save-rec').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(form));
      if (!f.diagnosis.trim() || !f.date) { SPC.toast(t('form.required'), 'error'); return; }
      const medications = [...rows.querySelectorAll('.med-row')].map(r => {
        const o = {}; r.querySelectorAll('[data-m]').forEach(i => { o[i.dataset.m] = i.value.trim(); }); return o;
      }).filter(x => x.name);
      Store.records.add({
        patientId, doctorId: doctorId || f.doctorId, date: f.date, sessions: Number(f.sessions) || 0,
        diagnosis: f.diagnosis.trim(), plan: f.plan.trim(), notes: f.notes.trim(), medications
      });
      m.close();
      SPC.toast(t('rec.added'));
      onSaved && onSaved();
    });
  }

  return { isUpcoming, docName, patName, svcName, stat, userBox, apptTable, bindApptActions, recordsHTML, medsHTML, patientInfo, recordModal };
})();
