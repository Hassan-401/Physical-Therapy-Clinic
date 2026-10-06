(function () {
  const { t, L, esc } = SPC;
  const DAYS_AHEAD = 21;
  const state = {
    doctorId: SPC.qs('doctor') || '',
    service: SPC.qs('service') || '',
    date: SPC.qs('date') || '',
    time: SPC.qs('time') || ''
  };

  const $ = id => document.getElementById(id);
  const doctor = () => Store.doctors.get(state.doctorId);

  function workDays() {
    const d = doctor();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const date = Store.addDays(i);
      return { date, key: Store.ymd(date), off: !d || !d.doctor.schedule.days.includes(date.getDay()) };
    });
  }
  function freeSlots(date) {
    return Store.slotsFor(state.doctorId, date).filter(s => !s.past && !s.taken);
  }
  /** keep date/time valid when doctor changes; jump to the first day with free slots */
  function normalise() {
    if (!doctor()) { state.date = ''; state.time = ''; return; }
    const days = workDays();
    const valid = days.find(d => d.key === state.date && !d.off);
    if (!valid) {
      const first = days.find(d => !d.off && freeSlots(d.key).length);
      state.date = first ? first.key : '';
    }
    if (state.time && !freeSlots(state.date).some(s => s.time === state.time)) state.time = '';
  }

  function drawAuthAlert() {
    const u = SPC.auth.current();
    const box = $('auth-alert');
    if (!u) box.innerHTML = `<div class="alert alert-info"><i class="fa-solid fa-circle-info"></i> ${t('book.loginFirst')} <a href="login.html?next=${encodeURIComponent('book.html')}" style="text-decoration:underline">${t('nav.login')}</a></div>`;
    else if (u.role !== 'patient') box.innerHTML = `<div class="alert alert-error">${t('book.onlyPatients')}</div>`;
    else box.innerHTML = '';
  }

  function drawDoctors() {
    $('doctor-pick').innerHTML = Store.doctors.list().map(u => `
      <label><input type="radio" name="doctor" value="${u.id}" ${u.id === state.doctorId ? 'checked' : ''}>
        ${SPC.avatar(u)}<span><b>${esc(L(u.name))}</b><small>${esc(L(u.doctor.specialty))}</small></span></label>`).join('');
  }

  function drawServices() {
    $('service-select').innerHTML = `<option value="">${t('book.chooseService')}</option>` +
      Store.SERVICES.map(s => `<option value="${s.id}" ${s.id === state.service ? 'selected' : ''}>${esc(L(s.title))}</option>`).join('');
  }

  function drawDates() {
    const strip = $('date-strip');
    if (!doctor()) { strip.innerHTML = ''; return; }
    const today = Store.ymd(new Date());
    strip.innerHTML = workDays().map(d => `
      <button type="button" data-date="${d.key}" class="${d.key === state.date ? 'active' : ''} ${d.off ? 'off' : ''}" ${d.off ? 'disabled' : ''}>
        <small>${d.key === today ? t('book.today') : t('day.' + d.date.getDay())}</small>
        <b>${d.date.getDate()}</b>
        <small>${d.date.toLocaleDateString(SPC.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short' })}</small>
      </button>`).join('');
    const active = strip.querySelector('.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function drawSlots() {
    const box = $('slots-box');
    if (!doctor()) { box.innerHTML = `<p class="muted">${t('book.pickDoctor')}</p>`; return; }
    if (!state.date) { box.innerHTML = `<p class="muted">${t('book.pickDate')}</p>`; return; }
    const slots = Store.slotsFor(state.doctorId, state.date).filter(s => !s.past);
    const noneFree = !slots.some(s => !s.taken);
    box.innerHTML = (noneFree ? `<p class="muted">${t('book.noSlots')}</p>` : '') +
      (slots.length ? `<div class="slots">${slots.map(s => `
      <button type="button" class="slot ${s.taken ? 'taken' : ''} ${s.time === state.time ? 'active' : ''}"
        data-time="${s.time}" data-label="${t('book.taken')}" ${s.taken ? 'disabled aria-disabled="true"' : ''}>${SPC.fmtTime(s.time)}</button>`).join('')}</div>` : '');
  }

  /** Price block: what the visit costs, or that it's covered by the patient's prepaid package. */
  function priceBox(u, d, s) {
    if (!d || !s) return `<div class="price-box muted-box"><i class="fa-solid fa-tag"></i> ${t('book.priceHint')}</div>`;
    const patientId = u && u.role === 'patient' ? u.id : null;
    const q = Store.billing.quote({ patientId, doctorId: d.id, service: s.id, date: state.date || Store.ymd(new Date()) });
    const kindRow = `<div class="summary-row"><span>${t('book.visitType')}</span><b>${t('kind.' + q.kind)}</b></div>`;
    if (q.subscription) {
      const left = q.subscription.sessions - q.subscription.used;
      return kindRow + `<div class="price-box prepaid">
        <div class="price-line"><span>${t('book.price')}</span><s>${SPC.money(q.price)}</s></div>
        <div class="price-line total"><span>${t('book.due')}</span><b>${SPC.money(0)}</b></div>
        <p><i class="fa-solid fa-circle-check"></i> ${t('book.prepaid').replace('{pkg}', esc(L(q.subscription.name)))}</p>
        <small>${t('book.sessionsLeft').replace('{n}', `<b class="num">${left}</b>`).replace('{t}', `<span class="num">${q.subscription.sessions}</span>`)} · ${t('book.validUntil')} ${SPC.fmtDate(q.subscription.expiresAt)}</small>
      </div>`;
    }
    return kindRow + `<div class="price-box">
      <div class="price-line total"><span>${t('book.due')}</span><b>${SPC.money(q.due)}</b></div>
      <small>${t('book.payAtClinic')}</small>
    </div>`;
  }

  function drawSummary() {
    const u = SPC.auth.current();
    const d = doctor();
    const s = Store.service(state.service);
    const row = (k, v) => `<div class="summary-row"><span>${t(k)}</span><b>${v || '—'}</b></div>`;
    $('summary').innerHTML =
      (u && u.role === 'patient' ? row('book.patient', esc(u.name)) : '') +
      row('book.doctor', d ? esc(L(d.name)) : '') +
      row('book.service', s ? esc(L(s.title)) : '') +
      row('book.date', state.date ? SPC.fmtDate(state.date) : '') +
      row('book.time', state.time ? `<span class="num">${SPC.fmtTime(state.time)}</span>` : '') +
      priceBox(u, d, s);
    $('confirm-btn').disabled = !!(u && u.role !== 'patient');
  }

  function drawAll() {
    normalise();
    drawAuthAlert(); drawDoctors(); drawServices(); drawDates(); drawSlots(); drawSummary();
  }

  // events
  $('doctor-pick').addEventListener('change', e => {
    state.doctorId = e.target.value; state.time = '';
    normalise(); drawDates(); drawSlots(); drawSummary();
  });
  $('service-select').addEventListener('change', e => { state.service = e.target.value; drawSummary(); });
  $('date-strip').addEventListener('click', e => {
    const b = e.target.closest('[data-date]');
    if (!b || b.disabled) return;
    state.date = b.dataset.date; state.time = '';
    drawDates(); drawSlots(); drawSummary();
  });
  $('slots-box').addEventListener('click', e => {
    const b = e.target.closest('.slot');
    if (!b || b.disabled) return;
    state.time = b.dataset.time;
    drawSlots(); drawSummary();
  });
  // another tab booked something -> refresh availability
  window.addEventListener('storage', () => { normalise(); drawSlots(); drawSummary(); });

  $('confirm-btn').addEventListener('click', () => {
    if (!state.doctorId || !state.service || !state.date || !state.time) { SPC.toast(t('book.fillAll'), 'error'); return; }
    const u = SPC.auth.current();
    if (!u) {
      const next = `book.html?doctor=${state.doctorId}&service=${state.service}&date=${state.date}&time=${state.time}`;
      location.href = 'login.html?next=' + encodeURIComponent(next);
      return;
    }
    if (u.role !== 'patient') { SPC.toast(t('book.onlyPatients'), 'error'); return; }
    try {
      Store.appointments.book({ patientId: u.id, doctorId: state.doctorId, date: state.date, time: state.time, service: state.service, notes: $('notes').value.trim() });
    } catch (err) {
      const msg = { slot_taken: 'book.errTaken', patient_busy: 'book.errBusy', off_day: 'book.errOff', past: 'book.errTaken' }[err.code] || 'book.errTaken';
      SPC.toast(t(msg), 'error');
      state.time = '';
      drawSlots(); drawSummary();
      return;
    }
    const d = doctor();
    const booked = Store.appointments.list({ patientId: u.id }).find(a => a.doctorId === state.doctorId && a.date === state.date && a.time === state.time && a.status === 'confirmed');
    SPC.modal({
      title: `<i class="fa-solid fa-circle-check" style="color:var(--success)"></i> ${t('book.success')}`,
      body: `<p class="muted">${t('book.successText')}</p>
        <div class="summary-row"><span>${t('book.doctor')}</span><b>${esc(L(d.name))}</b></div>
        <div class="summary-row"><span>${t('book.date')}</span><b>${SPC.fmtDate(state.date)}</b></div>
        <div class="summary-row"><span>${t('book.time')}</span><b class="num">${SPC.fmtTime(state.time)}</b></div>
        <div class="summary-row" style="border:0"><span>${t('book.due')}</span><b>${booked && booked.payment === 'package' ? `${SPC.money(0)} — ${t('pay.package')}` : SPC.money(booked ? booked.price : 0)}</b></div>`,
      foot: `<a class="btn btn-primary" href="patient-dashboard.html#appointments">${t('book.myAppointments')}</a>`
    });
    state.time = '';
    $('notes').value = '';
    drawSlots(); drawSummary();
  });

  window.renderPage = drawAll;
})();
