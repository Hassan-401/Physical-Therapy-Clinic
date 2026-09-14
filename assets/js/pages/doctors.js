(function () {
  const input = document.getElementById('doc-search');
  const grid = document.getElementById('doctors-grid');

  function draw() {
    const q = input.value.trim().toLowerCase();
    const list = Store.doctors.list().filter(u => {
      if (!q) return true;
      const d = u.doctor;
      return [d.name.en, d.name.ar, d.specialty.en, d.specialty.ar, ...d.skills.flatMap(s => [s.en, s.ar])]
        .some(v => String(v).toLowerCase().includes(q));
    });
    grid.innerHTML = list.length ? list.map(UI.doctorCard).join('') : `<div style="grid-column:1/-1">${SPC.empty('doctors.none', 'fa-face-frown')}</div>`;
    SPC.reveal();
  }

  input.addEventListener('input', draw);
  window.renderPage = draw;
})();
