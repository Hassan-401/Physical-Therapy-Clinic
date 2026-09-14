/* Reusable card renderers for public pages */
window.UI = {
  doctorCard(u) {
    const d = u.doctor, t = SPC.t, L = SPC.L, esc = SPC.esc;
    return `
      <article class="doctor-card reveal">
        <a class="photo" href="doctor.html?id=${u.id}">${SPC.doctorPhoto(u)}<span class="exp">${d.years}+ ${t('doctor.years')}</span></a>
        <div class="body">
          <h3><a href="doctor.html?id=${u.id}">${esc(L(d.name))}</a></h3>
          <div class="spec">${esc(L(d.specialty))}</div>
          <div class="meta">
            <span><i class="fa-solid fa-graduation-cap"></i>${esc(L(d.university))}</span>
            <span><i class="fa-regular fa-calendar"></i>${d.schedule.days.map(x => t('day.' + x)).join(' · ')}</span>
          </div>
          <div class="actions">
            <a class="btn btn-ghost btn-sm" href="doctor.html?id=${u.id}">${t('doctor.viewProfile')}</a>
            <a class="btn btn-primary btn-sm" href="book.html?doctor=${u.id}">${t('doctor.book')}</a>
          </div>
        </div>
      </article>`;
  },
  serviceCard(s) {
    const L = SPC.L, esc = SPC.esc;
    return `
      <article class="service-card reveal">
        <div class="thumb"><img src="${s.img}" alt="${esc(L(s.title))}" loading="lazy"><span class="ic"><i class="fa-solid ${s.icon}"></i></span></div>
        <div class="body">
          <h3>${esc(L(s.title))}</h3>
          <p>${esc(L(s.desc))}</p>
          <a class="more" href="services.html#${s.id}">${SPC.t('services.more')} <i class="fa-solid fa-arrow-${SPC.lang === 'ar' ? 'left' : 'right'}"></i></a>
        </div>
      </article>`;
  }
};
