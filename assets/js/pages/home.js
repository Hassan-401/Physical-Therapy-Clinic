window.renderPage = function () {
  const doctors = Store.doctors.list();
  document.getElementById('doc-count').textContent = doctors.length;
  document.getElementById('home-services').innerHTML = Store.SERVICES.slice(0, 4).map(UI.serviceCard).join('');
  document.getElementById('home-doctors').innerHTML = doctors.slice(0, 4).map(UI.doctorCard).join('');
  SPC.reveal();
};
