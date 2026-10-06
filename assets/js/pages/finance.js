/* Clinic owner's financial management: revenue, expenses, packages & pricing (admin dashboard) */
window.FIN = (function () {
  const { t, L, esc } = SPC;
  const state = { period: '30' };
  const EXP_CATS = ['rent', 'salaries', 'utilities', 'supplies', 'equipment', 'marketing', 'other'];
  const sum = (arr, f) => arr.reduce((n, x) => n + (f(x) || 0), 0);
  const monthKey = d => d.slice(0, 7);

  function range(period) {
    const now = new Date();
    const today = Store.ymd(now);
    const first = (y, m) => Store.ymd(new Date(y, m, 1));
    const last = (y, m) => Store.ymd(new Date(y, m + 1, 0));
    switch (period) {
      case 'month': return [first(now.getFullYear(), now.getMonth()), today];
      case '30': return [Store.ymd(Store.addDays(-29)), today];
      case 'last': return [first(now.getFullYear(), now.getMonth() - 1), last(now.getFullYear(), now.getMonth() - 1)];
      case '90': return [Store.ymd(Store.addDays(-89)), today];
      case 'year': return [first(now.getFullYear(), 0), today];
      default: return ['0000-00-00', '9999-12-31'];
    }
  }

  /** All money figures for a date range. */
  function compute([from, to]) {
    const inR = d => d && d >= from && d <= to;
    const appts = Store.appointments.list();
    const subs = Store.billing.subscriptions();
    const exps = Store.billing.expenses();
    const done = appts.filter(a => a.status === 'completed' && inR(a.date));
    const cashPaid = appts.filter(a => a.payment === 'cash' && a.paid && a.status !== 'cancelled' && inR(a.paidAt));
    const subsSold = subs.filter(s => inR(s.purchasedAt));
    const expIn = exps.filter(e => inR(e.date));
    const cash = sum(cashPaid, a => a.price);
    const pkg = sum(subsSold, s => s.price);
    const expenses = sum(expIn, e => e.amount);
    const unpaid = appts.filter(a => a.payment === 'cash' && a.status === 'completed' && !a.paid);
    const inPeriod = appts.filter(a => inR(a.date) && a.date <= Store.ymd(new Date()));
    return {
      appts, subs, done, cashPaid, subsSold, expIn, cash, pkg, expenses,
      revenue: cash + pkg, net: cash + pkg - expenses,
      consults: done.filter(a => a.kind === 'consult').length,
      sessions: done.filter(a => a.kind !== 'consult').length,
      pkgVisits: done.filter(a => a.payment === 'package').length,
      cancelled: inPeriod.filter(a => a.status === 'cancelled').length,
      totalBooked: inPeriod.length,
      activePatients: new Set(done.map(a => a.patientId)).size,
      newPatients: Store.patients.list().filter(p => inR(p.createdAt)).length,
      unpaid, unpaidSum: sum(unpaid, a => a.price)
    };
  }

  const card = (icon, cls, val, key, sub) =>
    `<div class="stat"><span class="ic ${cls}"><i class="fa-solid ${icon}"></i></span><div><b>${val}</b><small>${t(key)}</small>${sub ? `<em class="stat-sub">${sub}</em>` : ''}</div></div>`;

  /** Extra cards for the admin overview (this month). */
  function overviewCards() {
    const m = compute(range('30'));
    const activeSubs = m.subs.filter(s => s.expiresAt >= Store.ymd(new Date()) && s.used < s.sessions).length;
    return `<div class="stat-cards">
      ${card('fa-sack-dollar', 'ic-teal', SPC.money(m.revenue), 'fin.revenueMonth')}
      ${card('fa-scale-balanced', m.net >= 0 ? 'ic-blue' : 'ic-peach', SPC.money(m.net), 'fin.netMonth')}
      ${card('fa-hourglass-half', 'ic-peach', SPC.money(m.unpaidSum), 'fin.outstanding')}
      ${card('fa-ticket', 'ic-ink', activeSubs, 'fin.activePkgs')}
    </div>`;
  }

  /** Revenue vs expenses for the last 6 months: grouped bars on one shared axis + a table view. */
  function monthlyChart() {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return { key: Store.ymd(d).slice(0, 7), label: d.toLocaleDateString(SPC.lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short' }) };
    });
    const appts = Store.appointments.list();
    const subs = Store.billing.subscriptions();
    const exps = Store.billing.expenses();
    months.forEach(m => {
      m.rev = sum(appts.filter(a => a.payment === 'cash' && a.paid && a.status !== 'cancelled' && a.paidAt && monthKey(a.paidAt) === m.key), a => a.price) +
        sum(subs.filter(s => monthKey(s.purchasedAt) === m.key), s => s.price);
      m.exp = sum(exps.filter(e => monthKey(e.date) === m.key), e => e.amount);
    });
    const max = Math.max(1, ...months.map(m => Math.max(m.rev, m.exp)));
    const nice = Math.ceil(max / 20000) * 20000;
    const ticks = [0, .25, .5, .75, 1].map(f => Math.round(nice * f));
    const fmtK = n => n >= 1000 ? Math.round(n / 1000) + 'k' : n;
    const bar = (v, cls, label, m) => `<span class="bar ${cls}" style="height:${(v / nice) * 100}%" tabindex="0"
      data-tip="${esc(m.label)} · ${esc(t(label))}: ${Math.round(v).toLocaleString('en-US')} ${esc(t('cur.egp'))}"></span>`;
    return `
      <div class="chart-legend"><span><i class="lg-rev"></i>${t('fin.revenue')}</span><span><i class="lg-exp"></i>${t('fin.expenses')}</span></div>
      <div class="bar-chart" dir="ltr">
        <div class="y-axis">${ticks.slice().reverse().map(v => `<span class="num">${fmtK(v)}</span>`).join('')}</div>
        <div class="plot">
          ${ticks.map(v => `<i class="grid" style="bottom:${(v / nice) * 100}%"></i>`).join('')}
          ${months.map(m => `<div class="group">${bar(m.rev, 'rev', 'fin.revenue', m)}${bar(m.exp, 'exp', 'fin.expenses', m)}<small>${esc(m.label)}</small></div>`).join('')}
          <div class="chart-tip" hidden></div>
        </div>
      </div>
      <details class="chart-table"><summary>${t('fin.showTable')}</summary>
        <div class="table-wrap"><table class="table">
          <thead><tr><th>${t('fin.month')}</th><th>${t('fin.revenue')}</th><th>${t('fin.expenses')}</th><th>${t('fin.net')}</th></tr></thead>
          <tbody>${months.map(m => `<tr><td>${esc(m.label)}</td><td>${SPC.money(m.rev)}</td><td>${SPC.money(m.exp)}</td>
            <td class="${m.rev - m.exp < 0 ? 'neg' : 'pos'}">${SPC.money(m.rev - m.exp)}</td></tr>`).join('')}</tbody>
        </table></div>
      </details>`;
  }

  function breakdownTable(rows, firstHead) {
    if (!rows.length) return SPC.empty();
    const total = Math.max(1, ...rows.map(r => r.rev));
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>${t(firstHead)}</th><th>${t('fin.consults')}</th><th>${t('fin.sessions')}</th><th>${t('fin.pkgVisits')}</th><th>${t('fin.cashRevenue')}</th></tr></thead>
      <tbody>${rows.map(r => `<tr>
        <td><b>${esc(r.name)}</b></td><td class="num">${r.consults}</td><td class="num">${r.sessions}</td><td class="num">${r.pkg}</td>
        <td><div class="cell-bar"><span style="width:${(r.rev / total) * 100}%"></span><b>${SPC.money(r.rev)}</b></div></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function group(m, keyFn, nameFn) {
    const map = {};
    m.done.forEach(a => {
      const k = keyFn(a);
      const r = map[k] || (map[k] = { name: nameFn(k), consults: 0, sessions: 0, pkg: 0, rev: 0 });
      if (a.kind === 'consult') r.consults++; else r.sessions++;
      if (a.payment === 'package') r.pkg++;
    });
    m.cashPaid.forEach(a => { const r = map[keyFn(a)]; if (r) r.rev += a.price; });
    return Object.values(map).sort((a, b) => b.rev - a.rev);
  }

  function transactions(m) {
    const items = [
      ...m.cashPaid.map(a => ({ date: a.paidAt, who: DASH.patName(a.patientId), what: `${t('kind.' + (a.kind || 'session'))} — ${DASH.svcName(a.service)}`, method: 'cash', amount: a.price })),
      ...m.subsSold.map(s => ({ date: s.purchasedAt, who: DASH.patName(s.patientId), what: L(s.name), method: 'package', amount: s.price })),
      ...m.expIn.map(e => ({ date: e.date, who: '—', what: `${t('exp.' + e.category)}${e.note ? ' · ' + e.note : ''}`, method: 'expense', amount: -e.amount }))
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
    if (!items.length) return SPC.empty();
    return `<div class="table-wrap"><table class="table">
      <thead><tr><th>${t('th.date')}</th><th>${t('th.patient')}</th><th>${t('fin.item')}</th><th>${t('fin.type')}</th><th>${t('fin.amount')}</th></tr></thead>
      <tbody>${items.map(x => `<tr>
        <td>${SPC.fmtDate(x.date)}</td><td>${esc(x.who)}</td><td>${esc(x.what)}</td>
        <td><span class="badge badge-tx-${x.method}">${t('fin.tx.' + x.method)}</span></td>
        <td class="${x.amount < 0 ? 'neg' : 'pos'}"><b>${x.amount < 0 ? '−' : '+'}${SPC.money(Math.abs(x.amount))}</b></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function expensesPanel(m) {
    const byCat = EXP_CATS.map(c => ({ c, v: sum(m.expIn.filter(e => e.category === c), e => e.amount) })).filter(x => x.v);
    return `<div class="panel">
      <div class="panel-head"><h2><i class="fa-solid fa-file-invoice-dollar"></i> ${t('fin.expenses')}</h2>
        <button class="btn btn-primary btn-sm" data-add-exp><i class="fa-solid fa-plus"></i>${t('exp.add')}</button></div>
      ${byCat.length ? `<div class="chips-row">${byCat.map(x => `<span class="chip">${t('exp.' + x.c)}: <b>${SPC.money(x.v)}</b></span>`).join('')}</div>` : ''}
      ${m.expIn.length ? `<div class="table-wrap"><table class="table">
        <thead><tr><th>${t('th.date')}</th><th>${t('exp.category')}</th><th>${t('exp.note')}</th><th>${t('fin.amount')}</th><th></th></tr></thead>
        <tbody>${m.expIn.map(e => `<tr><td>${SPC.fmtDate(e.date)}</td><td>${t('exp.' + e.category)}</td><td>${esc(e.note) || '—'}</td>
          <td><b>${SPC.money(e.amount)}</b></td><td><button class="btn btn-danger btn-sm" data-del-exp="${e.id}"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</tbody>
      </table></div>` : SPC.empty('dash.noData', 'fa-file-invoice-dollar')}
    </div>`;
  }

  function drawFinance(el) {
    const m = compute(range(state.period));
    const avg = m.done.length ? m.revenue / m.done.length : 0;
    const cancelRate = m.totalBooked ? Math.round(m.cancelled / m.totalBooked * 100) : 0;
    el.innerHTML = `
      <div class="dash-title"><h1>${t('dash.finance')}</h1>
        <div class="checks">${['30', 'month', 'last', '90', 'year', 'all'].map(p => `<button class="btn btn-sm ${state.period === p ? 'btn-primary' : 'btn-ghost'}" data-period="${p}">${t('fin.p.' + p)}</button>`).join('')}</div></div>

      <div class="fin-hero">
        <div><small>${t('fin.revenue')}</small><b>${SPC.money(m.revenue)}</b><span>${t('fin.cash')} ${SPC.money(m.cash)} · ${t('fin.pkgSales')} ${SPC.money(m.pkg)}</span></div>
        <div><small>${t('fin.expenses')}</small><b>${SPC.money(m.expenses)}</b><span>${m.expIn.length} ${t('fin.entries')}</span></div>
        <div class="${m.net < 0 ? 'neg' : 'pos'}"><small>${t('fin.net')}</small><b>${SPC.money(m.net)}</b><span>${m.revenue ? `${t('fin.margin')} <span class="num">${Math.round(m.net / m.revenue * 100)}%</span>` : '&nbsp;'}</span></div>
      </div>

      <div class="stat-cards">
        ${card('fa-stethoscope', 'ic-blue', m.consults, 'fin.consults')}
        ${card('fa-person-walking', 'ic-teal', m.sessions, 'fin.sessions')}
        ${card('fa-hospital-user', 'ic-peach', m.activePatients, 'fin.activePatients', `+${m.newPatients} ${t('fin.new')}`)}
        ${card('fa-ticket', 'ic-ink', m.subsSold.length, 'fin.pkgsSold')}
        ${card('fa-receipt', 'ic-blue', SPC.money(avg), 'fin.avgVisit')}
        ${card('fa-hourglass-half', 'ic-peach', SPC.money(m.unpaidSum), 'fin.outstanding', `${m.unpaid.length} ${t('fin.visits')}`)}
        ${card('fa-calendar-xmark', 'ic-ink', `${cancelRate}%`, 'fin.cancelRate', `${m.cancelled} ${t('fin.visits')}`)}
        ${card('fa-users', 'ic-teal', Store.patients.list().length, 'fin.totalPatients')}
      </div>

      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-chart-column"></i> ${t('fin.monthly')}</h2></div>${monthlyChart()}</div>

      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-user-doctor"></i> ${t('fin.byDoctor')}</h2></div>
        ${breakdownTable(group(m, a => a.doctorId, DASH.docName), 'th.doctor')}</div>
      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-briefcase-medical"></i> ${t('fin.byService')}</h2></div>
        ${breakdownTable(group(m, a => a.service, DASH.svcName), 'th.service')}</div>

      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-hourglass-half"></i> ${t('fin.unpaidVisits')}</h2>
        <b>${SPC.money(m.unpaidSum)}</b></div>
        ${DASH.apptTable(m.unpaid.slice().reverse(), { who: 'both', role: 'admin' })}</div>

      <div class="panel"><div class="panel-head"><h2><i class="fa-solid fa-arrow-right-arrow-left"></i> ${t('fin.transactions')}</h2></div>${transactions(m)}</div>
      ${expensesPanel(m)}`;
  }

  function drawBilling(el) {
    const st = Store.billing.settings();
    const subs = Store.billing.subscriptions();
    const today = Store.ymd(new Date());
    const subStatus = s => s.expiresAt < today ? 'expired' : s.used >= s.sessions ? 'finished' : 'active';
    el.innerHTML = `
      <div class="dash-title"><h1>${t('dash.billing')}</h1></div>

      <form class="panel" id="prices-form">
        <div class="panel-head"><h2><i class="fa-solid fa-tag"></i> ${t('bill.prices')}</h2>
          <button class="btn btn-primary btn-sm" type="submit"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button></div>
        <p class="muted" style="margin-top:-6px">${t('bill.pricesHint')}</p>
        <div class="form-grid price-grid">
          <div class="field"><label><i class="fa-solid fa-stethoscope"></i> ${t('kind.consult')}</label><input type="number" min="0" step="10" name="consultFee" value="${st.consultFee}"></div>
          ${Store.SERVICES.map(s => `<div class="field"><label>${t('kind.session')} — ${esc(L(s.title))}</label><input type="number" min="0" step="10" name="price_${s.id}" value="${st.prices[s.id] || 0}"></div>`).join('')}
        </div>
      </form>

      <form class="panel" id="packages-form">
        <div class="panel-head"><h2><i class="fa-solid fa-boxes-stacked"></i> ${t('bill.packages')}</h2>
          <div class="actions"><button class="btn btn-ghost btn-sm" type="button" data-add-pkg><i class="fa-solid fa-plus"></i>${t('bill.addPkg')}</button>
          <button class="btn btn-primary btn-sm" type="submit"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button></div></div>
        <div id="pkg-rows">${st.packages.map(pkgRow).join('')}</div>
      </form>

      <div class="panel">
        <div class="panel-head"><h2><i class="fa-solid fa-ticket"></i> ${t('bill.subs')}</h2>
          <button class="btn btn-primary btn-sm" data-sell><i class="fa-solid fa-cart-plus"></i>${t('bill.sell')}</button></div>
        ${subs.length ? `<div class="table-wrap"><table class="table">
          <thead><tr><th>${t('th.patient')}</th><th>${t('bill.package')}</th><th>${t('bill.usage')}</th><th>${t('bill.purchased')}</th><th>${t('bill.expires')}</th><th>${t('fin.amount')}</th><th>${t('th.status')}</th><th></th></tr></thead>
          <tbody>${subs.map(s => `<tr>
            <td><a href="patient-profile.html?id=${s.patientId}" style="color:var(--blue);font-weight:700">${esc(DASH.patName(s.patientId))}</a></td>
            <td>${esc(L(s.name))}</td>
            <td><div class="cell-bar"><span style="width:${s.used / s.sessions * 100}%"></span><b class="num">${s.used}/${s.sessions}</b></div></td>
            <td>${SPC.fmtDate(s.purchasedAt)}</td><td>${SPC.fmtDate(s.expiresAt)}</td>
            <td><b>${SPC.money(s.price)}</b></td>
            <td><span class="badge badge-sub-${subStatus(s)}">${t('bill.st.' + subStatus(s))}</span></td>
            <td><button class="btn btn-danger btn-sm" data-del-sub="${s.id}"><i class="fa-solid fa-trash"></i></button></td>
          </tr>`).join('')}</tbody></table></div>` : SPC.empty('dash.noData', 'fa-ticket')}
      </div>`;
  }

  function pkgRow(p = { id: '', name: { en: '', ar: '' }, sessions: 10, price: 2000, days: 90 }) {
    return `<div class="form-grid pkg-row" data-pkg-id="${esc(p.id)}">
      <div class="field"><label>${t('admin.nameAr')}</label><input data-k="ar" dir="rtl" value="${esc(p.name.ar)}"></div>
      <div class="field"><label>${t('admin.nameEn')}</label><input data-k="en" dir="ltr" value="${esc(p.name.en)}"></div>
      <div class="field"><label>${t('bill.sessionsN')}</label><input data-k="sessions" type="number" min="1" value="${p.sessions}"></div>
      <div class="field"><label>${t('fin.amount')} (${t('cur.egp')})</label><input data-k="price" type="number" min="0" step="10" value="${p.price}"></div>
      <div class="field"><label>${t('bill.validity')}</label><input data-k="days" type="number" min="1" value="${p.days}"></div>
      <button type="button" class="btn btn-danger btn-sm" data-del-pkg aria-label="remove"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }

  function sellModal(rerender) {
    const st = Store.billing.settings();
    if (!st.packages.length) { SPC.toast(t('bill.noPkgs'), 'error'); return; }
    const pats = Store.patients.list().sort((a, b) => a.name.localeCompare(b.name));
    const m = SPC.modal({
      title: t('bill.sell'),
      body: `<form class="form-grid" id="sell-form">
        <div class="field full"><label>${t('th.patient')}</label><select name="patientId">${pats.map(p => `<option value="${p.id}">${esc(p.name)} — ${esc(p.phone)}</option>`).join('')}</select></div>
        <div class="field full"><label>${t('bill.package')}</label><select name="packageId">${st.packages.map(p => `<option value="${p.id}">${esc(L(p.name))} — ${p.sessions} ${t('fin.sessions')} — ${Number(p.price).toLocaleString('en-US')} ${t('cur.egp')}</option>`).join('')}</select></div>
        <p class="muted full" style="margin:0">${t('bill.sellHint')}</p>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="do-sell"><i class="fa-solid fa-check"></i>${t('bill.confirmSell')}</button>`
    });
    m.el.querySelector('#do-sell').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(m.el.querySelector('#sell-form')));
      Store.billing.sell(f.patientId, f.packageId);
      m.close();
      SPC.toast(t('bill.sold'));
      rerender();
    });
  }

  function expenseModal(rerender) {
    const m = SPC.modal({
      title: t('exp.add'),
      body: `<form class="form-grid" id="exp-form">
        <div class="field"><label>${t('th.date')}</label><input type="date" name="date" value="${Store.ymd(new Date())}"></div>
        <div class="field"><label>${t('exp.category')}</label><select name="category">${EXP_CATS.map(c => `<option value="${c}">${t('exp.' + c)}</option>`).join('')}</select></div>
        <div class="field"><label>${t('fin.amount')} (${t('cur.egp')}) *</label><input type="number" min="1" name="amount" required></div>
        <div class="field"><label>${t('exp.note')}</label><input name="note"></div>
      </form>`,
      foot: `<button class="btn btn-ghost" data-close>${t('dash.cancel')}</button><button class="btn btn-primary" id="save-exp"><i class="fa-solid fa-floppy-disk"></i>${t('dash.save')}</button>`
    });
    m.el.querySelector('#save-exp').addEventListener('click', () => {
      const f = Object.fromEntries(new FormData(m.el.querySelector('#exp-form')));
      const amount = Number(f.amount);
      if (!amount || amount <= 0 || !f.date) { SPC.toast(t('form.required'), 'error'); return; }
      Store.billing.addExpense({ date: f.date, category: f.category, amount, note: f.note.trim() });
      m.close();
      SPC.toast(t('dash.saved'));
      rerender();
    });
  }

  /** Event delegation for both panes (bind once). */
  function bind(root, rerender) {
    root.addEventListener('click', e => {
      const q = s => e.target.closest(s);
      let el;
      if ((el = q('[data-period]'))) { state.period = el.dataset.period; rerender(); }
      else if (q('[data-add-exp]')) expenseModal(rerender);
      else if ((el = q('[data-del-exp]'))) SPC.confirm(t('dash.confirmTitle'), () => { Store.billing.removeExpense(el.dataset.delExp); rerender(); });
      else if (q('[data-sell]')) sellModal(rerender);
      else if ((el = q('[data-del-sub]'))) SPC.confirm(t('bill.delSub'), () => { Store.billing.removeSubscription(el.dataset.delSub); rerender(); });
      else if (q('[data-add-pkg]')) document.getElementById('pkg-rows').insertAdjacentHTML('beforeend', pkgRow());
      else if ((el = q('[data-del-pkg]'))) el.closest('.pkg-row').remove();
    });
    root.addEventListener('submit', e => {
      if (e.target.id === 'prices-form') {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.target));
        const prices = {};
        Store.SERVICES.forEach(s => { prices[s.id] = Math.max(0, Number(f['price_' + s.id]) || 0); });
        Store.billing.updateSettings({ consultFee: Math.max(0, Number(f.consultFee) || 0), prices });
        SPC.toast(t('dash.saved'));
        rerender();
      } else if (e.target.id === 'packages-form') {
        e.preventDefault();
        const packages = [...e.target.querySelectorAll('.pkg-row')].map(r => {
          const v = k => r.querySelector(`[data-k="${k}"]`).value.trim();
          const en = v('en') || v('ar');
          return { id: r.dataset.pkgId || 'pk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: { en, ar: v('ar') || en },
            sessions: Math.max(1, Number(v('sessions')) || 1), price: Math.max(0, Number(v('price')) || 0), days: Math.max(1, Number(v('days')) || 30) };
        }).filter(p => p.name.en);
        Store.billing.updateSettings({ packages });
        SPC.toast(t('dash.saved'));
        rerender();
      }
    });
    // chart tooltip (hover + keyboard focus)
    const showTip = e => {
      const b = e.target.closest && e.target.closest('.bar[data-tip]');
      const plot = b && b.closest('.plot');
      if (!plot) return;
      const tip = plot.querySelector('.chart-tip');
      const pr = plot.getBoundingClientRect(), br = b.getBoundingClientRect();
      tip.textContent = b.dataset.tip;
      tip.hidden = false;
      tip.style.left = (br.left - pr.left + br.width / 2) + 'px';
      tip.style.bottom = (pr.bottom - br.top + 8) + 'px';
    };
    const hideTip = e => { const b = e.target.closest && e.target.closest('.bar[data-tip]'); if (b) { const tip = b.closest('.plot').querySelector('.chart-tip'); if (tip) tip.hidden = true; } };
    root.addEventListener('mouseover', showTip);
    root.addEventListener('focusin', showTip);
    root.addEventListener('mouseout', hideTip);
    root.addEventListener('focusout', hideTip);
  }

  return { overviewCards, drawFinance, drawBilling, bind };
})();
