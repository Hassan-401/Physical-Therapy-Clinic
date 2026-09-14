/* =========================================================
   SPC mock database (localStorage).
   Everything the UI needs goes through `Store` so this file can later be
   replaced by real API calls without touching the pages.
   ========================================================= */
(function () {
  const DB_KEY = 'spc_db';
  const DB_VERSION = 3;

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (n, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + n); return d; };
  const uid = p => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  /* ---------- Services (static content) ---------- */
  const SERVICES = [
    {
      id: 'ortho', icon: 'fa-bone', img: 'assets/img/image-8.jpg',
      title: { en: 'Orthopedic Rehabilitation', ar: 'تأهيل العظام والمفاصل' },
      desc: { en: 'Treatment for joint pain, fractures, arthritis and ligament injuries to restore strength and range of motion.', ar: 'علاج آلام المفاصل والكسور والخشونة وإصابات الأربطة لاستعادة القوة ومدى الحركة.' },
      points: [{ en: 'Knee & shoulder pain', ar: 'آلام الركبة والكتف' }, { en: 'Arthritis & stiffness', ar: 'الخشونة وتيبس المفاصل' }, { en: 'Rehab after fractures', ar: 'التأهيل بعد الكسور' }]
    },
    {
      id: 'sports', icon: 'fa-person-running', img: 'assets/img/hero.jpg',
      title: { en: 'Sports Injuries', ar: 'الإصابات الرياضية' },
      desc: { en: 'Fast, safe return to training after sprains, muscle tears, ACL and meniscus injuries.', ar: 'عودة آمنة وسريعة للتمرين بعد الالتواءات وتمزق العضلات وإصابات الرباط الصليبي والغضروف.' },
      points: [{ en: 'ACL & meniscus rehab', ar: 'تأهيل الرباط الصليبي والغضروف' }, { en: 'Muscle strains', ar: 'الشد والتمزق العضلي' }, { en: 'Return-to-sport testing', ar: 'اختبارات العودة للملاعب' }]
    },
    {
      id: 'neuro', icon: 'fa-brain', img: 'assets/img/image-2.jpg',
      title: { en: 'Neurological Rehabilitation', ar: 'تأهيل المخ والأعصاب' },
      desc: { en: 'Programmes for stroke, spinal cord injury, MS and Parkinson\'s to improve balance, walking and independence.', ar: 'برامج لحالات الجلطات وإصابات الحبل الشوكي والتصلب المتعدد والشلل الرعاش لتحسين الاتزان والمشي والاستقلالية.' },
      points: [{ en: 'Stroke recovery', ar: 'التعافي من الجلطات' }, { en: 'Gait & balance training', ar: 'تدريب المشي والاتزان' }, { en: 'Spinal cord injuries', ar: 'إصابات الحبل الشوكي' }]
    },
    {
      id: 'pediatric', icon: 'fa-child-reaching', img: 'assets/img/image-5.jpg',
      title: { en: 'Pediatric Physiotherapy', ar: 'العلاج الطبيعي للأطفال' },
      desc: { en: 'Play-based therapy for developmental delay, cerebral palsy, flat feet and posture problems.', ar: 'علاج قائم على اللعب لحالات تأخر النمو والشلل الدماغي والفلات فوت ومشاكل القوام.' },
      points: [{ en: 'Motor development', ar: 'تنمية المهارات الحركية' }, { en: 'Cerebral palsy', ar: 'الشلل الدماغي' }, { en: 'Posture correction', ar: 'تعديل القوام' }]
    },
    {
      id: 'spine', icon: 'fa-person-walking', img: 'assets/img/image-3.jpg',
      title: { en: 'Spine & Back Pain', ar: 'آلام الظهر والعمود الفقري' },
      desc: { en: 'Relief for disc herniation, sciatica, neck pain and postural problems with manual therapy and exercise.', ar: 'علاج الانزلاق الغضروفي وعرق النسا وآلام الرقبة ومشاكل القوام بالعلاج اليدوي والتمارين.' },
      points: [{ en: 'Disc herniation', ar: 'الانزلاق الغضروفي' }, { en: 'Sciatica', ar: 'عرق النسا' }, { en: 'Neck & posture pain', ar: 'آلام الرقبة والقوام' }]
    },
    {
      id: 'postop', icon: 'fa-user-nurse', img: 'assets/img/image-1.jpg',
      title: { en: 'Post-Surgery Rehabilitation', ar: 'التأهيل بعد العمليات' },
      desc: { en: 'Structured recovery after joint replacement, ligament reconstruction and spinal surgery.', ar: 'برنامج تعافٍ منظم بعد تغيير المفاصل وإعادة بناء الأربطة وجراحات العمود الفقري.' },
      points: [{ en: 'Knee & hip replacement', ar: 'تغيير مفصل الركبة والفخذ' }, { en: 'Walking re-education', ar: 'إعادة تعلم المشي' }, { en: 'Home exercise plans', ar: 'برامج تمارين منزلية' }]
    },
    {
      id: 'manual', icon: 'fa-hands', img: 'assets/img/image-6.jpg',
      title: { en: 'Manual Therapy', ar: 'العلاج اليدوي' },
      desc: { en: 'Hands-on mobilisation, soft-tissue release and dry needling to reduce pain and stiffness.', ar: 'تحريك المفاصل يدوياً وتحرير الأنسجة الرخوة والإبر الجافة لتقليل الألم والتيبس.' },
      points: [{ en: 'Joint mobilisation', ar: 'تحريك المفاصل' }, { en: 'Myofascial release', ar: 'تحرير اللفافة العضلية' }, { en: 'Dry needling', ar: 'الإبر الجافة' }]
    },
    {
      id: 'electro', icon: 'fa-bolt', img: 'assets/img/image-7.jpg',
      title: { en: 'Electrotherapy & Shockwave', ar: 'العلاج الكهربائي والموجات التصادمية' },
      desc: { en: 'TENS, ultrasound, laser and shockwave therapy to speed up healing and control pain.', ar: 'تنبيه كهربائي، موجات فوق صوتية، ليزر وموجات تصادمية لتسريع الالتئام والتحكم في الألم.' },
      points: [{ en: 'Shockwave therapy', ar: 'الموجات التصادمية' }, { en: 'Therapeutic ultrasound', ar: 'الموجات فوق الصوتية' }, { en: 'Laser therapy', ar: 'العلاج بالليزر' }]
    }
  ];

  /* ---------- Seed ---------- */
  function seed() {
    const now = new Date().toISOString();
    const users = [];

    users.push({ id: 'u_admin', role: 'admin', email: 'admin@spc.com', password: 'admin123', name: { en: 'Clinic Admin', ar: 'إدارة العيادة' }, phone: '01055566910', createdAt: now });

    const doctors = [
      {
        id: 'd1', email: 'doctor1@spc.com', phone: '01000000001',
        doctor: {
          name: { en: 'Dr. Ahmed Mostafa', ar: 'د. أحمد مصطفى' },
          specialty: { en: 'Orthopedic & Sports Physiotherapy', ar: 'علاج طبيعي العظام والإصابات الرياضية' },
          age: 45, years: 20, photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          university: { en: 'Cairo University', ar: 'جامعة القاهرة' },
          bio: { en: 'Consultant physiotherapist with two decades of experience treating athletes and orthopedic cases. Former physiotherapist for a Premier League football club and lecturer in sports rehabilitation.', ar: 'استشاري علاج طبيعي بخبرة عشرين عاماً في علاج الرياضيين وحالات العظام. عمل أخصائياً للعلاج الطبيعي لأحد أندية الدوري الممتاز ومحاضراً في تأهيل الإصابات الرياضية.' },
          languages: { en: 'Arabic, English', ar: 'العربية، الإنجليزية' },
          education: [
            { year: '2004', en: 'Bachelor of Physical Therapy — Cairo University', ar: 'بكالوريوس العلاج الطبيعي — جامعة القاهرة' },
            { year: '2010', en: 'Master\'s in Orthopedic Physiotherapy — Cairo University', ar: 'ماجستير العلاج الطبيعي للعظام — جامعة القاهرة' },
            { year: '2015', en: 'PhD in Sports Rehabilitation — Cairo University', ar: 'دكتوراه تأهيل الإصابات الرياضية — جامعة القاهرة' }
          ],
          career: [
            { year: '2005 – 2012', en: 'Physiotherapist — Al Salam International Hospital', ar: 'أخصائي علاج طبيعي — مستشفى السلام الدولي' },
            { year: '2012 – 2019', en: 'Head of Sports Rehab — Premier League football club', ar: 'رئيس قسم التأهيل الرياضي — نادي بالدوري الممتاز' },
            { year: '2019 – Now', en: 'Consultant & Clinical Director — SPC', ar: 'استشاري ومدير طبي — SPC' }
          ],
          certificates: [
            { en: 'FIFA Diploma in Football Medicine', ar: 'دبلومة FIFA في طب كرة القدم' },
            { en: 'Certified Kinesio Taping Practitioner', ar: 'شهادة معتمدة في الشريط اللاصق الطبي (كينزيو)' },
            { en: 'Shockwave Therapy Certification — EMS', ar: 'شهادة العلاج بالموجات التصادمية — EMS' }
          ],
          skills: [
            { en: 'ACL rehab', ar: 'تأهيل الرباط الصليبي' }, { en: 'Shoulder injuries', ar: 'إصابات الكتف' },
            { en: 'Shockwave', ar: 'الموجات التصادمية' }, { en: 'Return to sport', ar: 'العودة للملاعب' }
          ],
          schedule: { days: [6, 0, 1, 2, 3], start: '10:00', end: '17:00', slot: 60 }
        }
      },
      {
        id: 'd2', email: 'doctor2@spc.com', phone: '01000000002',
        doctor: {
          name: { en: 'Dr. Mariam Adel', ar: 'د. مريم عادل' },
          specialty: { en: 'Neurological Rehabilitation', ar: 'تأهيل المخ والأعصاب' },
          age: 38, years: 14, photo: 'https://randomuser.me/api/portraits/women/44.jpg',
          university: { en: 'Cairo University', ar: 'جامعة القاهرة' },
          bio: { en: 'Specialist in stroke and spinal cord injury rehabilitation. Passionate about helping patients regain independence through task-oriented training and balance programmes.', ar: 'متخصصة في تأهيل الجلطات الدماغية وإصابات الحبل الشوكي. شغوفة بمساعدة المرضى على استعادة استقلاليتهم من خلال التدريب الوظيفي وبرامج الاتزان.' },
          languages: { en: 'Arabic, English, French', ar: 'العربية، الإنجليزية، الفرنسية' },
          education: [
            { year: '2009', en: 'Bachelor of Physical Therapy — Cairo University', ar: 'بكالوريوس العلاج الطبيعي — جامعة القاهرة' },
            { year: '2014', en: 'Master\'s in Neuromuscular Disorders — Cairo University', ar: 'ماجستير الاضطرابات العصبية العضلية — جامعة القاهرة' }
          ],
          career: [
            { year: '2010 – 2016', en: 'Neuro Physiotherapist — Kasr Al Ainy Hospital', ar: 'أخصائية علاج طبيعي أعصاب — مستشفى قصر العيني' },
            { year: '2016 – 2021', en: 'Senior Therapist — Stroke Rehabilitation Unit, Dar Al Fouad', ar: 'أخصائية أولى — وحدة تأهيل الجلطات، دار الفؤاد' },
            { year: '2021 – Now', en: 'Neuro Rehab Specialist — SPC', ar: 'أخصائية تأهيل الأعصاب — SPC' }
          ],
          certificates: [
            { en: 'Bobath Concept Certified Therapist', ar: 'معالجة معتمدة بمفهوم بوباث' },
            { en: 'PNF Level 1 & 2', ar: 'التسهيل العصبي العضلي PNF المستوى ١ و٢' }
          ],
          skills: [
            { en: 'Stroke', ar: 'الجلطات' }, { en: 'Balance training', ar: 'تدريب الاتزان' },
            { en: 'Multiple sclerosis', ar: 'التصلب المتعدد' }, { en: 'Gait training', ar: 'تدريب المشي' }
          ],
          schedule: { days: [6, 1, 3, 4], start: '12:00', end: '20:00', slot: 60 }
        }
      },
      {
        id: 'd3', email: 'doctor3@spc.com', phone: '01000000003',
        doctor: {
          name: { en: 'Dr. Karim Hassan', ar: 'د. كريم حسن' },
          specialty: { en: 'Spine & Manual Therapy', ar: 'العمود الفقري والعلاج اليدوي' },
          age: 41, years: 16, photo: 'https://randomuser.me/api/portraits/men/46.jpg',
          university: { en: 'Beni-Suef University', ar: 'جامعة بني سويف' },
          bio: { en: 'Manual therapist focused on neck and back pain, disc problems and posture. Combines joint mobilisation, dry needling and targeted exercise for long-lasting results.', ar: 'معالج يدوي متخصص في آلام الرقبة والظهر ومشاكل الغضاريف والقوام. يجمع بين تحريك المفاصل والإبر الجافة والتمارين الموجهة لنتائج تدوم.' },
          languages: { en: 'Arabic, English', ar: 'العربية، الإنجليزية' },
          education: [
            { year: '2007', en: 'Bachelor of Physical Therapy — Beni-Suef University', ar: 'بكالوريوس العلاج الطبيعي — جامعة بني سويف' },
            { year: '2013', en: 'Master\'s in Musculoskeletal Physiotherapy — Cairo University', ar: 'ماجستير العلاج الطبيعي للجهاز العضلي الهيكلي — جامعة القاهرة' }
          ],
          career: [
            { year: '2008 – 2014', en: 'Physiotherapist — Nasr City Health Insurance Hospital', ar: 'أخصائي علاج طبيعي — مستشفى التأمين الصحي بمدينة نصر' },
            { year: '2014 – 2020', en: 'Manual Therapy Specialist — Private practice, Dubai', ar: 'أخصائي علاج يدوي — عيادة خاصة، دبي' },
            { year: '2020 – Now', en: 'Spine Specialist — SPC', ar: 'أخصائي العمود الفقري — SPC' }
          ],
          certificates: [
            { en: 'Maitland Manual Therapy Certificate', ar: 'شهادة ميتلاند في العلاج اليدوي' },
            { en: 'McKenzie Method — Part A–D', ar: 'طريقة ماكنزي — المستويات A–D' },
            { en: 'Dry Needling Certification', ar: 'شهادة الإبر الجافة' }
          ],
          skills: [
            { en: 'Disc herniation', ar: 'الانزلاق الغضروفي' }, { en: 'Sciatica', ar: 'عرق النسا' },
            { en: 'Dry needling', ar: 'الإبر الجافة' }, { en: 'Posture', ar: 'القوام' }
          ],
          schedule: { days: [0, 1, 2, 3, 4], start: '14:00', end: '22:00', slot: 60 }
        }
      },
      {
        id: 'd4', email: 'doctor4@spc.com', phone: '01000000004',
        doctor: {
          name: { en: 'Dr. Nour El-Sayed', ar: 'د. نور السيد' },
          specialty: { en: 'Pediatric Physiotherapy', ar: 'العلاج الطبيعي للأطفال' },
          age: 34, years: 10, photo: 'https://randomuser.me/api/portraits/women/65.jpg',
          university: { en: 'Misr University for Science & Technology', ar: 'جامعة مصر للعلوم والتكنولوجيا' },
          bio: { en: 'Pediatric physiotherapist who makes therapy feel like play. Works with children with developmental delay, cerebral palsy and orthopedic conditions, and coaches parents on home programmes.', ar: 'أخصائية علاج طبيعي أطفال تجعل الجلسة أشبه باللعب. تعمل مع الأطفال ذوي تأخر النمو والشلل الدماغي وحالات العظام، وتدرب الأهل على البرامج المنزلية.' },
          languages: { en: 'Arabic, English', ar: 'العربية، الإنجليزية' },
          education: [
            { year: '2013', en: 'Bachelor of Physical Therapy — MUST', ar: 'بكالوريوس العلاج الطبيعي — جامعة مصر للعلوم والتكنولوجيا' },
            { year: '2018', en: 'Master\'s in Pediatric Physiotherapy — Cairo University', ar: 'ماجستير العلاج الطبيعي للأطفال — جامعة القاهرة' }
          ],
          career: [
            { year: '2014 – 2019', en: 'Pediatric Therapist — Abu El Reesh Children\'s Hospital', ar: 'أخصائية علاج أطفال — مستشفى أبو الريش للأطفال' },
            { year: '2019 – Now', en: 'Pediatric Specialist — SPC', ar: 'أخصائية علاج الأطفال — SPC' }
          ],
          certificates: [
            { en: 'NDT Pediatric Certificate', ar: 'شهادة NDT لعلاج الأطفال' },
            { en: 'Sensory Integration Course', ar: 'دورة التكامل الحسي' }
          ],
          skills: [
            { en: 'Cerebral palsy', ar: 'الشلل الدماغي' }, { en: 'Developmental delay', ar: 'تأخر النمو' },
            { en: 'Flat feet', ar: 'الفلات فوت' }, { en: 'Torticollis', ar: 'صعر الرقبة' }
          ],
          schedule: { days: [6, 0, 2, 4], start: '10:00', end: '16:00', slot: 45 }
        }
      },
      {
        id: 'd5', email: 'doctor5@spc.com', phone: '01000000005',
        doctor: {
          name: { en: 'Dr. Omar Farouk', ar: 'د. عمر فاروق' },
          specialty: { en: 'Post-Surgical & Geriatric Rehab', ar: 'التأهيل بعد الجراحات وكبار السن' },
          age: 50, years: 25, photo: 'https://randomuser.me/api/portraits/men/75.jpg',
          university: { en: 'Cairo University', ar: 'جامعة القاهرة' },
          bio: { en: 'Senior consultant with 25 years in post-operative and elderly rehabilitation. Known for safe, gradual programmes after joint replacement and for fall-prevention training.', ar: 'استشاري أول بخبرة ٢٥ عاماً في تأهيل ما بعد العمليات وكبار السن. معروف ببرامجه الآمنة والتدريجية بعد تغيير المفاصل وتدريبات الوقاية من السقوط.' },
          languages: { en: 'Arabic, English, German', ar: 'العربية، الإنجليزية، الألمانية' },
          education: [
            { year: '1998', en: 'Bachelor of Physical Therapy — Cairo University', ar: 'بكالوريوس العلاج الطبيعي — جامعة القاهرة' },
            { year: '2004', en: 'Master\'s in Surgery Physiotherapy — Cairo University', ar: 'ماجستير العلاج الطبيعي للجراحة — جامعة القاهرة' },
            { year: '2009', en: 'Clinical Fellowship in Geriatric Rehab — Charité, Berlin', ar: 'زمالة سريرية في تأهيل كبار السن — مستشفى شاريتيه، برلين' }
          ],
          career: [
            { year: '1999 – 2008', en: 'Physiotherapist — Ain Shams University Hospitals', ar: 'أخصائي علاج طبيعي — مستشفيات جامعة عين شمس' },
            { year: '2008 – 2016', en: 'Rehab Department Head — Cleopatra Hospital', ar: 'رئيس قسم التأهيل — مستشفى كليوباترا' },
            { year: '2016 – Now', en: 'Senior Consultant — SPC', ar: 'استشاري أول — SPC' }
          ],
          certificates: [
            { en: 'Otago Fall Prevention Programme Leader', ar: 'قائد برنامج أوتاجو للوقاية من السقوط' },
            { en: 'Advanced Hydrotherapy Course', ar: 'دورة متقدمة في العلاج المائي' }
          ],
          skills: [
            { en: 'Joint replacement', ar: 'تغيير المفاصل' }, { en: 'Fall prevention', ar: 'الوقاية من السقوط' },
            { en: 'Osteoporosis', ar: 'هشاشة العظام' }, { en: 'Walking aids', ar: 'وسائل المساعدة على المشي' }
          ],
          schedule: { days: [6, 0, 1, 2, 3, 4], start: '09:00', end: '15:00', slot: 60 }
        }
      }
    ];
    doctors.forEach(d => users.push({ id: d.id, role: 'doctor', email: d.email, password: 'doctor123', phone: d.phone, name: d.doctor.name, doctor: d.doctor, createdAt: now }));

    const patients = [
      { id: 'p1', email: 'patient@spc.com', name: 'Youssef Ibrahim', phone: '01122334455', dob: '1990-04-12', gender: 'male', bloodType: 'O+', address: 'Abbas El Akkad St., Nasr City', conditions: 'Mild hypertension', allergies: 'Penicillin', emergency: '01099887766', createdAt: ymd(addDays(-120)) },
      { id: 'p2', email: 'sara@spc.com', name: 'Sara Mahmoud', phone: '01233445566', dob: '1985-09-03', gender: 'female', bloodType: 'A+', address: 'Makram Ebeid St., Nasr City', conditions: '', allergies: '', emergency: '01288776655', createdAt: ymd(addDays(-60)) },
      { id: 'p3', email: 'khaled@spc.com', name: 'Khaled Nabil', phone: '01544556677', dob: '1958-01-22', gender: 'male', bloodType: 'B+', address: 'Heliopolis, Cairo', conditions: 'Type 2 diabetes', allergies: '', emergency: '01577665544', createdAt: ymd(addDays(-30)) }
    ];
    patients.forEach(p => users.push(Object.assign({ role: 'patient', password: 'patient123' }, p)));

    // Appointments: find working days relative to today
    const nextWorkday = (doctorId, offset) => {
      const sch = doctors.find(d => d.id === doctorId).doctor.schedule;
      let d = addDays(offset);
      const step = offset < 0 ? -1 : 1;
      while (!sch.days.includes(d.getDay())) d = addDays(step, d);
      return ymd(d);
    };
    const A = (id, patientId, doctorId, offset, time, service, status, notes = '') =>
      ({ id, patientId, doctorId, date: nextWorkday(doctorId, offset), time, service, status, notes, createdAt: now });
    const appointments = [
      A('a1', 'p1', 'd1', -40, '11:00', 'sports', 'completed', 'Knee pain after football'),
      A('a2', 'p1', 'd1', -25, '11:00', 'sports', 'completed'),
      A('a3', 'p1', 'd3', -10, '15:00', 'spine', 'completed', 'Lower back pain'),
      A('a4', 'p1', 'd1', 2, '12:00', 'sports', 'confirmed'),
      A('a5', 'p2', 'd1', 2, '14:00', 'ortho', 'confirmed', 'Shoulder stiffness'),
      A('a6', 'p3', 'd5', 1, '10:00', 'postop', 'confirmed', 'Follow-up after knee replacement'),
      A('a7', 'p2', 'd2', -15, '13:00', 'neuro', 'completed'),
      A('a8', 'p3', 'd5', -20, '09:00', 'postop', 'completed'),
      A('a9', 'p2', 'd3', 3, '16:00', 'manual', 'confirmed'),
      A('a10', 'p3', 'd1', 2, '10:00', 'ortho', 'confirmed')
    ];

    const records = [
      {
        id: 'r1', patientId: 'p1', doctorId: 'd1', date: appointments[0].date, sessions: 8,
        diagnosis: 'Patellar tendinopathy (right knee)',
        plan: 'Eccentric strengthening, shockwave therapy once weekly, activity modification for 4 weeks.',
        notes: 'Pain 6/10 on squatting. Avoid jumping until reassessment.',
        medications: [
          { name: 'Brufen 400mg', dose: '1 tablet', freq: 'Twice daily after meals', duration: '7 days' },
          { name: 'Voltaren Emulgel', dose: 'Thin layer', freq: '3 times daily', duration: '14 days' }
        ]
      },
      {
        id: 'r2', patientId: 'p1', doctorId: 'd3', date: appointments[2].date, sessions: 6,
        diagnosis: 'Mechanical low back pain with muscle spasm',
        plan: 'Manual therapy, core stabilisation exercises, ergonomic advice for desk work.',
        notes: 'Improved after first session. Home exercise sheet given.',
        medications: [
          { name: 'Myolgin', dose: '1 tablet', freq: 'Twice daily', duration: '5 days' }
        ]
      },
      {
        id: 'r3', patientId: 'p2', doctorId: 'd2', date: appointments[6].date, sessions: 12,
        diagnosis: 'Peripheral neuropathy — balance deficit',
        plan: 'Balance and proprioception training, gait training, 3 sessions weekly.',
        notes: 'Berg balance score 44/56.',
        medications: [{ name: 'Milga', dose: '1 tablet', freq: 'Once daily', duration: '1 month' }]
      },
      {
        id: 'r4', patientId: 'p3', doctorId: 'd5', date: appointments[7].date, sessions: 16,
        diagnosis: 'Post total knee replacement (left) — week 3',
        plan: 'ROM exercises, quadriceps strengthening, walker to cane progression.',
        notes: 'Flexion 85°. Monitor blood sugar before sessions.',
        medications: [
          { name: 'Paracetamol 500mg', dose: '2 tablets', freq: 'Every 8 hours if needed', duration: '10 days' },
          { name: 'Clexane 40mg', dose: '1 injection', freq: 'Once daily', duration: '2 weeks' }
        ]
      }
    ];

    const messages = [
      { id: 'm1', name: 'Mona Adel', email: 'mona@example.com', phone: '01011112222', subject: 'Home visits', message: 'Do you offer home physiotherapy sessions for elderly patients?', createdAt: addDays(-2).toISOString() }
    ];

    return { version: DB_VERSION, users, appointments, records, messages };
  }

  /* ---------- Persistence ---------- */
  let db;
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(DB_KEY));
      if (raw && raw.version === DB_VERSION) return raw;
    } catch (e) { /* ignore */ }
    const fresh = seed();
    persist(fresh);
    return fresh;
  }
  function persist(data) {
    try { localStorage.setItem(DB_KEY, JSON.stringify(data || db)); } catch (e) { /* storage unavailable */ }
  }
  db = load();
  // keep multiple tabs in sync
  window.addEventListener('storage', e => { if (e.key === DB_KEY) db = load(); });

  const clone = o => JSON.parse(JSON.stringify(o));
  const safeUser = u => { if (!u) return null; const c = clone(u); delete c.password; return c; };
  const err = code => { const e = new Error(code); e.code = code; return e; };
  const isActive = a => a.status !== 'cancelled';

  /* ---------- Public API ---------- */
  const Store = {
    SERVICES,
    service: id => SERVICES.find(s => s.id === id),
    ymd, addDays, toMin, toTime,

    reset() { db = seed(); persist(); },

    auth: {
      check(email, password) {
        const u = db.users.find(x => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password);
        return safeUser(u);
      }
    },

    users: {
      get: id => safeUser(db.users.find(u => u.id === id)),
      emailTaken: (email, exceptId) => db.users.some(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== exceptId),
      update(id, patch) {
        const u = db.users.find(x => x.id === id);
        if (!u) throw err('not_found');
        if (patch.email && Store.users.emailTaken(patch.email, id)) throw err('email_taken');
        Object.assign(u, patch);
        persist();
        return safeUser(u);
      }
    },

    patients: {
      list: () => db.users.filter(u => u.role === 'patient').map(safeUser),
      get: id => { const u = db.users.find(x => x.id === id && x.role === 'patient'); return safeUser(u); },
      register(data) {
        if (Store.users.emailTaken(data.email)) throw err('email_taken');
        const u = Object.assign({ id: uid('p'), role: 'patient', bloodType: '', address: '', conditions: '', allergies: '', emergency: '', createdAt: ymd(new Date()) }, data);
        db.users.push(u);
        persist();
        return safeUser(u);
      }
    },

    doctors: {
      list: () => db.users.filter(u => u.role === 'doctor').map(safeUser),
      get: id => { const u = db.users.find(x => x.id === id && x.role === 'doctor'); return safeUser(u); },
      create({ email, password, phone, doctor }) {
        if (Store.users.emailTaken(email)) throw err('email_taken');
        const u = { id: uid('d'), role: 'doctor', email: email.trim(), password, phone, name: doctor.name, doctor, createdAt: new Date().toISOString() };
        db.users.push(u);
        persist();
        return safeUser(u);
      },
      update(id, { email, password, phone, doctor }) {
        const u = db.users.find(x => x.id === id && x.role === 'doctor');
        if (!u) throw err('not_found');
        if (email && Store.users.emailTaken(email, id)) throw err('email_taken');
        if (email) u.email = email.trim();
        if (password) u.password = password;
        if (phone !== undefined) u.phone = phone;
        if (doctor) { u.doctor = doctor; u.name = doctor.name; }
        persist();
        return safeUser(u);
      },
      remove(id) {
        const today = ymd(new Date());
        db.appointments.forEach(a => { if (a.doctorId === id && a.date >= today && a.status === 'confirmed') a.status = 'cancelled'; });
        db.users = db.users.filter(u => u.id !== id);
        persist();
      }
    },

    /** Returns every slot of the doctor's working day with its availability. */
    slotsFor(doctorId, date) {
      const doc = db.users.find(u => u.id === doctorId && u.role === 'doctor');
      if (!doc) return [];
      const sch = doc.doctor.schedule;
      const [y, m, d] = date.split('-').map(Number);
      const day = new Date(y, m - 1, d);
      if (!sch.days.includes(day.getDay())) return [];
      const now = new Date();
      const isToday = ymd(now) === date;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const out = [];
      for (let t = toMin(sch.start); t + sch.slot <= toMin(sch.end); t += sch.slot) {
        const time = toTime(t);
        out.push({
          time,
          taken: db.appointments.some(a => a.doctorId === doctorId && a.date === date && a.time === time && isActive(a)),
          past: isToday && t <= nowMin
        });
      }
      return out;
    },

    appointments: {
      list(filter = {}) {
        return clone(db.appointments
          .filter(a => (!filter.patientId || a.patientId === filter.patientId) && (!filter.doctorId || a.doctorId === filter.doctorId))
          .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)));
      },
      /** Books a slot. Throws slot_taken / patient_busy / off_day / past. */
      book({ patientId, doctorId, date, time, service, notes }) {
        db = load(); // re-read in case another tab booked meanwhile
        const slot = Store.slotsFor(doctorId, date).find(s => s.time === time);
        if (!slot) throw err('off_day');
        if (slot.past) throw err('past');
        if (slot.taken) throw err('slot_taken');
        if (db.appointments.some(a => a.patientId === patientId && a.date === date && a.time === time && isActive(a))) throw err('patient_busy');
        const a = { id: uid('a'), patientId, doctorId, date, time, service, notes: notes || '', status: 'confirmed', createdAt: new Date().toISOString() };
        db.appointments.push(a);
        persist();
        return clone(a);
      },
      setStatus(id, status) {
        const a = db.appointments.find(x => x.id === id);
        if (!a) throw err('not_found');
        a.status = status;
        persist();
        return clone(a);
      }
    },

    records: {
      forPatient: pid => clone(db.records.filter(r => r.patientId === pid).sort((a, b) => b.date.localeCompare(a.date))),
      add(rec) {
        const r = Object.assign({ id: uid('r'), medications: [] }, rec);
        db.records.push(r);
        persist();
        return clone(r);
      },
      remove(id) { db.records = db.records.filter(r => r.id !== id); persist(); }
    },

    messages: {
      list: () => clone(db.messages).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      add(m) { db.messages.push(Object.assign({ id: uid('m'), createdAt: new Date().toISOString() }, m)); persist(); },
      remove(id) { db.messages = db.messages.filter(m => m.id !== id); persist(); }
    }
  };

  window.Store = Store;
})();
