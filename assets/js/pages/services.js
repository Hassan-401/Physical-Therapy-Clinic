window.renderPage = function () {
  const { L, t, esc } = SPC;
  document.getElementById('services-list').innerHTML = Store.SERVICES.map((s, i) => `
    <div class="service-row reveal" id="${s.id}" style="scroll-margin-top:100px">
      <div class="media"><img src="${s.img}" alt="${esc(L(s.title))}" loading="lazy"></div>
      <div>
        <div class="num">${String(i + 1).padStart(2, '0')}</div>
        <h2 style="font-size:1.7rem;margin-top:8px"><i class="fa-solid ${s.icon}" style="color:var(--teal)"></i> ${esc(L(s.title))}</h2>
        <p class="muted">${esc(L(s.desc))}</p>
        <ul class="check-list">${s.points.map(p => `<li><i class="fa-solid fa-circle-check"></i>${esc(L(p))}</li>`).join('')}</ul>
        <a href="book.html?service=${s.id}" class="btn btn-primary"><i class="fa-regular fa-calendar-check"></i>${t('services.book')}</a>
      </div>
    </div>`).join('');
  SPC.reveal();
  if (location.hash) { const el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
};
