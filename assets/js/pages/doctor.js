window.renderPage = function () {
  const { t, L, esc } = SPC;
  const root = document.getElementById('doctor-profile');
  const u = Store.doctors.get(SPC.qs('id'));

  if (!u) {
    root.innerHTML = `<section><div class="container">${SPC.empty('doctor.notFound', 'fa-user')}
      <p class="center"><a class="btn btn-outline" href="doctors.html">${t('doctor.back')}</a></p></div></section>`;
    return;
  }
  const d = u.doctor;
  document.title = `SPC | ${L(d.name)}`;
  const timeline = items => items && items.length
    ? `<ul class="timeline">${items.map(i => `<li><div class="yr">${esc(i.year || '')}</div><div>${esc(L(i))}</div></li>`).join('')}</ul>`
    : `<p class="muted">—</p>`;
  const arrow = SPC.lang === 'ar' ? 'right' : 'left';

  root.innerHTML = `
    <div class="profile-hero">
      <div class="container">
        <a href="doctors.html" class="muted" style="display:inline-flex;gap:8px;align-items:center;margin-bottom:20px"><i class="fa-solid fa-arrow-${arrow}"></i>${t('doctor.back')}</a>
        <div class="profile-top">
          <div class="profile-photo">${SPC.doctorPhoto(u)}</div>
          <div>
            <h1>${esc(L(d.name))}</h1>
            <div class="spec">${esc(L(d.specialty))}</div>
            <div class="facts">
              <div class="fact"><small>${t('doctor.age')}</small><b>${d.age} ${t('doctor.yearsOld')}</b></div>
              <div class="fact"><small>${t('doctor.experience')}</small><b>${d.years}+ ${t('doctor.years')}</b></div>
              <div class="fact"><small>${t('doctor.university')}</small><b>${esc(L(d.university))}</b></div>
              <div class="fact"><small>${t('doctor.languages')}</small><b>${esc(L(d.languages))}</b></div>
            </div>
            <a href="book.html?doctor=${u.id}" class="btn btn-primary"><i class="fa-regular fa-calendar-check"></i>${t('doctor.bookWith')}</a>
          </div>
        </div>
      </div>
    </div>
    <div class="container profile-body">
      <div>
        <div class="cv-block card"><h2><i class="fa-regular fa-user"></i>${t('doctor.about')}</h2><p class="muted" style="margin:0">${esc(L(d.bio))}</p></div>
        <div class="cv-block card"><h2><i class="fa-solid fa-graduation-cap"></i>${t('doctor.education')}</h2>${timeline(d.education)}</div>
        <div class="cv-block card"><h2><i class="fa-solid fa-briefcase-medical"></i>${t('doctor.career')}</h2>${timeline(d.career)}</div>
        <div class="cv-block card"><h2><i class="fa-solid fa-award"></i>${t('doctor.certs')}</h2>
          <ul class="check-list" style="margin:0">${(d.certificates || []).map(c => `<li><i class="fa-solid fa-certificate"></i>${esc(L(c))}</li>`).join('') || '<li>—</li>'}</ul>
        </div>
      </div>
      <aside class="sticky-side">
        <div class="card card-shadow">
          <h3 style="font-size:1.05rem">${t('doctor.skills')}</h3>
          <div class="tags">${(d.skills || []).map(s => `<span class="tag">${esc(L(s))}</span>`).join('')}</div>
          <h3 style="font-size:1.05rem;margin-top:22px">${t('doctor.schedule')}</h3>
          <div class="days">${[6, 0, 1, 2, 3, 4, 5].map(x => `<span class="${d.schedule.days.includes(x) ? 'on' : ''}">${t('day.' + x)}</span>`).join('')}</div>
          <div class="summary-row"><span>${t('doctor.hours')}</span><b class="num">${SPC.fmtTime(d.schedule.start)} – ${SPC.fmtTime(d.schedule.end)}</b></div>
          <div class="summary-row" style="border:0"><span>${t('doctor.session')}</span><b>${d.schedule.slot} ${t('doctor.minutes')}</b></div>
          <a href="book.html?doctor=${u.id}" class="btn btn-primary btn-block" style="margin-top:12px"><i class="fa-regular fa-calendar-check"></i>${t('doctor.bookWith')}</a>
        </div>
      </aside>
    </div>`;
};
