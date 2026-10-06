/* =========================================================
   SPC mock database (localStorage).
   Everything the UI needs goes through `Store` so this file can later be
   replaced by real API calls without touching the pages.
   ========================================================= */
(function () {
  const DB_KEY = 'spc_db';
  const DB_VERSION = 8;

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

  /* ---------- Symptom catalog (used for classification & search) ---------- */
  const SYMPTOMS = [
    { key: 'headache', en: 'Headache', ar: 'صداع' },
    { key: 'neck_pain', en: 'Neck pain', ar: 'ألم الرقبة' },
    { key: 'low_back_pain', en: 'Lower back pain', ar: 'ألم أسفل الظهر' },
    { key: 'sciatica', en: 'Sciatica / leg radiation', ar: 'عرق النسا / ألم ممتد للساق' },
    { key: 'shoulder_pain', en: 'Shoulder pain', ar: 'ألم الكتف' },
    { key: 'knee_pain', en: 'Knee pain', ar: 'ألم الركبة' },
    { key: 'hip_pain', en: 'Hip pain', ar: 'ألم الحوض والفخذ' },
    { key: 'ankle_pain', en: 'Ankle pain', ar: 'ألم الكاحل' },
    { key: 'stiffness', en: 'Joint stiffness', ar: 'تيبس المفاصل' },
    { key: 'swelling', en: 'Swelling', ar: 'تورم' },
    { key: 'weakness', en: 'Muscle weakness', ar: 'ضعف العضلات' },
    { key: 'numbness', en: 'Numbness / tingling', ar: 'تنميل / وخز' },
    { key: 'spasm', en: 'Muscle spasm', ar: 'تقلص عضلي' },
    { key: 'dizziness', en: 'Dizziness', ar: 'دوخة' },
    { key: 'balance', en: 'Balance problems', ar: 'مشاكل الاتزان' },
    { key: 'walking', en: 'Difficulty walking', ar: 'صعوبة المشي' },
    { key: 'limited_rom', en: 'Limited range of motion', ar: 'محدودية الحركة' },
    { key: 'fatigue', en: 'Fatigue', ar: 'إرهاق' }
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
          age: 45, years: 20, photo: 'assets/img/doctors/ahmed-mostafa.jpg',
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
          age: 38, years: 14, photo: 'assets/img/doctors/mariam-adel.jpg',
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
          age: 41, years: 16, photo: 'assets/img/doctors/karim-hassan.jpg',
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
          age: 34, years: 10, photo: 'assets/img/doctors/nour-elsayed.jpg',
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

    // Case files: examination, investigations, symptoms and per-session follow-up.
    // Severity scale 0 (none) – 10 (worst). ratings = doctor's assessment, feedback = patient's own report.
    const S = (key, baseline) => ({ key, name: '', baseline });
    const sess = (no, date, ratings, treatment, notes, feedback) => ({ id: 's' + no + '_' + Math.random().toString(36).slice(2, 6), no, date, ratings, treatment, notes, feedback: feedback || null });
    const fb = (date, ratings, overall, comment) => ({ date, ratings, overall, comment });
    const D = n => ymd(addDays(n));
    const cases = [
      {
        id: 'c1', patientId: 'p1', doctorId: 'd1', status: 'active', startDate: appointments[0].date,
        title: 'Patellar tendinopathy (right knee)',
        symptoms: [S('knee_pain', 7), S('swelling', 5), S('stiffness', 6)],
        exam: {
          complaint: 'Pain below the right kneecap when running, jumping and climbing stairs for 2 months.',
          history: 'Amateur footballer, 3 matches weekly. No previous surgery.',
          findings: 'Tenderness at inferior pole of patella. Single-leg squat painful at 60°. Mild effusion. Quadriceps strength 4/5.',
          rom: 'Knee flexion 125° (left 140°), full extension.',
          notes: 'Avoid jumping until reassessment.'
        },
        tests: [
          { id: 't1', type: 'us', name: 'Ultrasound — right knee', date: appointments[0].date, result: 'Thickened patellar tendon with hypoechoic area at proximal insertion. No tear.' },
          { id: 't2', type: 'xray', name: 'X-ray — right knee (AP/Lateral)', date: D(-45), result: 'No bony abnormality.' }
        ],
        sessions: [
          sess(1, D(-38), { knee_pain: 7, swelling: 5, stiffness: 6 }, 'Shockwave (2000 shots), isometric quads, ice', 'Tolerated well.', fb(D(-37), { knee_pain: 6, swelling: 5, stiffness: 5 }, 'better', 'Less pain the next morning.')),
          sess(2, D(-31), { knee_pain: 6, swelling: 4, stiffness: 5 }, 'Shockwave, eccentric decline squats 3x15', '', fb(D(-30), { knee_pain: 6, swelling: 3, stiffness: 5 }, 'same', 'Stairs still painful.')),
          sess(3, D(-24), { knee_pain: 4, swelling: 2, stiffness: 4 }, 'Shockwave, eccentric progression, hip strengthening', 'Swelling much improved.', fb(D(-23), { knee_pain: 4, swelling: 2, stiffness: 3 }, 'better', 'Can climb stairs with little pain.')),
          sess(4, D(-17), { knee_pain: 3, swelling: 1, stiffness: 3 }, 'Plyometric intro, single-leg control', 'Start light jogging.', null)
        ]
      },
      {
        id: 'c2', patientId: 'p1', doctorId: 'd3', status: 'active', startDate: appointments[2].date,
        title: 'Mechanical low back pain with cervicogenic headache',
        symptoms: [S('low_back_pain', 8), S('spasm', 7), S('headache', 6), S('neck_pain', 5)],
        exam: {
          complaint: 'Lower back pain after long sitting at work, with headaches starting from the neck by the end of the day.',
          history: 'Desk job 9 hours daily. Poor posture. No trauma.',
          findings: 'Paraspinal spasm L3–L5, forward head posture, tender upper trapezius and suboccipitals. SLR negative.',
          rom: 'Lumbar flexion limited 50%. Cervical rotation 60° both sides.',
          notes: 'Ergonomic advice given.'
        },
        tests: [
          { id: 't3', type: 'mri', name: 'MRI — lumbar spine', date: D(-14), result: 'Mild L4–L5 disc bulge without nerve root compression.' }
        ],
        sessions: [
          sess(1, D(-9), { low_back_pain: 8, spasm: 7, headache: 6, neck_pain: 5 }, 'Manual therapy, TENS, suboccipital release', '', fb(D(-8), { low_back_pain: 6, spasm: 6, headache: 5, neck_pain: 4 }, 'better', 'Headache was lighter today.')),
          sess(2, D(-5), { low_back_pain: 6, spasm: 4, headache: 4, neck_pain: 4 }, 'Mobilisation, core activation, chin tucks', 'Home exercise sheet given.', fb(D(-4), { low_back_pain: 5, spasm: 4, headache: 3, neck_pain: 3 }, 'better', '')),
          sess(3, D(-2), { low_back_pain: 4, spasm: 3, headache: 2, neck_pain: 3 }, 'Dry needling upper trapezius, core progression', '', null)
        ]
      },
      {
        id: 'c3', patientId: 'p2', doctorId: 'd2', status: 'active', startDate: appointments[6].date,
        title: 'Peripheral neuropathy — balance deficit',
        symptoms: [S('balance', 7), S('numbness', 8), S('dizziness', 5), S('walking', 6)],
        exam: {
          complaint: 'Unsteady walking and tingling in both feet for 6 months, occasional dizziness when standing up.',
          history: 'Vitamin B12 deficiency diagnosed 8 months ago.',
          findings: 'Reduced light-touch sensation both feet (stocking pattern). Romberg positive. Berg balance 44/56.',
          rom: 'Full.', notes: 'Fall-risk education.'
        },
        tests: [
          { id: 't4', type: 'lab', name: 'Vitamin B12 level', date: D(-20), result: '180 pg/mL (low).' },
          { id: 't5', type: 'other', name: 'Nerve conduction study', date: D(-18), result: 'Mild sensory axonal polyneuropathy.' }
        ],
        sessions: [
          sess(1, D(-13), { balance: 7, numbness: 8, dizziness: 5, walking: 6 }, 'Balance board, gait training, sensory stimulation', '', fb(D(-12), { balance: 7, numbness: 8, dizziness: 4, walking: 6 }, 'same', 'Tired after the session.')),
          sess(2, D(-8), { balance: 6, numbness: 7, dizziness: 3, walking: 5 }, 'Tandem walking, proprioception drills', 'Berg 47/56.', fb(D(-7), { balance: 5, numbness: 7, dizziness: 3, walking: 5 }, 'better', 'I feel more confident walking.'))
        ]
      },
      {
        id: 'c4', patientId: 'p3', doctorId: 'd5', status: 'active', startDate: appointments[7].date,
        title: 'Post total knee replacement (left)',
        symptoms: [S('knee_pain', 6), S('limited_rom', 8), S('walking', 8), S('swelling', 6)],
        exam: {
          complaint: 'Pain and stiffness 3 weeks after left total knee replacement; walking with a walker.',
          history: 'TKR 3 weeks ago. Type 2 diabetes controlled on tablets.',
          findings: 'Healed wound, moderate swelling, quadriceps lag 10°.',
          rom: 'Flexion 85°, extension −5°.', notes: 'Check blood sugar before sessions.'
        },
        tests: [
          { id: 't6', type: 'xray', name: 'X-ray — left knee post-op', date: D(-25), result: 'Well-positioned prosthesis.' },
          { id: 't7', type: 'lab', name: 'HbA1c', date: D(-25), result: '6.9%.' }
        ],
        sessions: [
          sess(1, D(-19), { knee_pain: 6, limited_rom: 8, walking: 8, swelling: 6 }, 'ROM exercises, quads sets, cryotherapy', 'Flexion 85°.', fb(D(-18), { knee_pain: 6, limited_rom: 8, walking: 7, swelling: 6 }, 'same', '')),
          sess(2, D(-12), { knee_pain: 5, limited_rom: 6, walking: 6, swelling: 4 }, 'Stationary bike, step-ups, gait with cane', 'Flexion 98°.', fb(D(-11), { knee_pain: 4, limited_rom: 6, walking: 5, swelling: 4 }, 'better', 'Walking with a cane now.')),
          sess(3, D(-5), { knee_pain: 3, limited_rom: 4, walking: 4, swelling: 3 }, 'Strengthening, balance, stairs practice', 'Flexion 110°.', null)
        ]
      },
      {
        id: 'c5', patientId: 'p2', doctorId: 'd3', status: 'closed', startDate: D(-90),
        title: 'Tension-type headache with neck strain',
        symptoms: [S('headache', 7), S('neck_pain', 6), S('stiffness', 5)],
        exam: {
          complaint: 'Daily band-like headache with neck stiffness after long hours on the laptop.',
          history: 'Office work, stress. Neurologist excluded migraine.',
          findings: 'Tender upper trapezius & levator scapulae, forward head posture.',
          rom: 'Cervical rotation 55° both sides.', notes: ''
        },
        tests: [{ id: 't8', type: 'xray', name: 'X-ray — cervical spine', date: D(-92), result: 'Straightening of cervical lordosis.' }],
        sessions: [
          sess(1, D(-85), { headache: 7, neck_pain: 6, stiffness: 5 }, 'Soft tissue release, posture correction', '', fb(D(-84), { headache: 6, neck_pain: 5, stiffness: 5 }, 'better', '')),
          sess(2, D(-78), { headache: 4, neck_pain: 4, stiffness: 3 }, 'Dry needling, deep neck flexor training', '', fb(D(-77), { headache: 4, neck_pain: 3, stiffness: 3 }, 'better', 'Headaches only twice this week.')),
          sess(3, D(-71), { headache: 1, neck_pain: 1, stiffness: 1 }, 'Home program review, discharge', 'Discharged — goals achieved.', fb(D(-70), { headache: 1, neck_pain: 1, stiffness: 0 }, 'better', 'Thank you, almost no headaches now!'))
        ]
      }
    ];

    const messages = [
      { id: 'm1', name: 'Mona Adel', email: 'mona@example.com', phone: '01011112222', subject: 'Home visits', message: 'Do you offer home physiotherapy sessions for elderly patients?', createdAt: addDays(-2).toISOString() }
    ];

    /* ---------- Billing: prices, packages, history ---------- */
    const settings = {
      consultFee: 300,
      prices: { ortho: 250, sports: 300, neuro: 300, pediatric: 250, spine: 250, postop: 300, manual: 250, electro: 200 },
      packages: [
        { id: 'pk6', name: { en: '6-session package', ar: 'باقة ٦ جلسات' }, sessions: 6, price: 1350, days: 60 },
        { id: 'pk12', name: { en: '12-session package', ar: 'باقة ١٢ جلسة' }, sessions: 12, price: 2520, days: 90 },
        { id: 'pk24', name: { en: '24-session package', ar: 'باقة ٢٤ جلسة' }, sessions: 24, price: 4560, days: 150 }
      ]
    };

    // deterministic pseudo-random so the demo looks the same on every reset
    let s0 = 20241006;
    const rnd = () => { s0 = (s0 * 1103515245 + 12345) % 2147483648; return s0 / 2147483648; };
    const pick = arr => arr[Math.floor(rnd() * arr.length)];

    const extraNames = ['Ahmed Samir', 'Mona Fathy', 'Hany Adel', 'Reem Tarek', 'Mostafa Gamal', 'Dina Ashraf', 'Omar Salah', 'Heba Lotfy', 'Tamer Hosny', 'Nada Sherif', 'Islam Magdy', 'Yasmin Fouad',
      'Mahmoud Ragab', 'Salma Ezzat', 'Karim Wagdy', 'Aya Hamdy', 'Sherif Mounir', 'Laila Nasser', 'Hassan Barakat', 'Noha Kamal', 'Adel Sabry', 'Rana Hegazy', 'Walid Zaki', 'Marwa Saad'];
    extraNames.forEach((name, i) => users.push({
      id: 'p' + (i + 4), role: 'patient', password: 'patient123', email: name.split(' ')[0].toLowerCase() + (i + 4) + '@example.com', name,
      phone: '010' + String(20000000 + i * 734521).slice(0, 8), dob: `${1960 + Math.floor(rnd() * 45)}-0${1 + (i % 9)}-1${i % 9}`,
      gender: i % 2 ? 'female' : 'male', bloodType: '', address: 'Nasr City, Cairo', conditions: '', allergies: '', emergency: '',
      createdAt: ymd(addDays(-178 + i * 2))
    }));
    const docServices = { d1: ['sports', 'ortho', 'electro'], d2: ['neuro'], d3: ['spine', 'manual'], d4: ['pediatric'], d5: ['postop', 'ortho'] };
    const taken = new Set(appointments.map(a => `${a.doctorId}|${a.date}|${a.time}`));
    for (let off = -175; off <= -1; off++) {
      const day = addDays(off);
      doctors.forEach(d => {
        const sch = d.doctor.schedule;
        if (!sch.days.includes(day.getDay())) return;
        const n = 1 + Math.floor(rnd() * 4); // 1-4 visits per doctor per day
        for (let k = 0; k < n; k++) {
          const slots = Math.floor((toMin(sch.end) - toMin(sch.start)) / sch.slot);
          const time = toTime(toMin(sch.start) + Math.floor(rnd() * slots) * sch.slot);
          const key = `${d.id}|${ymd(day)}|${time}`;
          if (taken.has(key)) continue;
          taken.add(key);
          const pid = 'p' + (4 + Math.floor(rnd() * extraNames.length));
          if (ymd(day) < users.find(u => u.id === pid).createdAt) continue;
          appointments.push({ id: 'g' + appointments.length, patientId: pid, doctorId: d.id, date: ymd(day), time, service: pick(docServices[d.id]),
            status: rnd() < 0.08 ? 'cancelled' : 'completed', notes: '', createdAt: now });
        }
      });
    }

    // package subscriptions (bought at reception)
    const sub = (id, patientId, packageId, offset) => {
      const pk = settings.packages.find(p => p.id === packageId);
      return { id, patientId, packageId, name: pk.name, sessions: pk.sessions, price: pk.price, purchasedAt: D(offset), expiresAt: D(offset + pk.days) };
    };
    const subscriptions = [
      sub('sub1', 'p1', 'pk12', -45), sub('sub2', 'p3', 'pk24', -25),
      sub('sub3', 'p5', 'pk6', -150), sub('sub4', 'p7', 'pk12', -110), sub('sub5', 'p9', 'pk6', -70),
      sub('sub6', 'p11', 'pk12', -40), sub('sub7', 'p13', 'pk24', -130), sub('sub8', 'p6', 'pk6', -20)
    ];

    // price every visit chronologically: first visit with a doctor = consultation, then sessions;
    // visits inside a valid package are prepaid.
    appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const today = ymd(new Date());
    appointments.forEach(a => {
      const seen = appointments.some(x => x !== a && x.patientId === a.patientId && x.doctorId === a.doctorId && x.status !== 'cancelled' && (x.date + x.time) < (a.date + a.time));
      a.kind = seen ? 'session' : 'consult';
      a.price = seen ? settings.prices[a.service] : settings.consultFee;
      const s = a.status !== 'cancelled' && subscriptions.find(x => x.patientId === a.patientId && x.purchasedAt <= a.date && x.expiresAt >= a.date &&
        appointments.filter(y => y.subscriptionId === x.id).length < x.sessions);
      if (s) { a.payment = 'package'; a.subscriptionId = s.id; a.price = 0; a.paid = true; a.paidAt = s.purchasedAt; }
      else {
        a.payment = 'cash';
        // a few recent visits are left unpaid to show outstanding balances
        a.paid = a.status === 'completed' && !(a.date >= D(-12) && rnd() < 0.35);
        a.paidAt = a.paid ? a.date : null;
      }
      if (a.date >= today && a.status === 'confirmed' && a.payment === 'cash') { a.paid = false; a.paidAt = null; }
    });

    const expenses = [];
    for (let m = 5; m >= 0; m--) {
      const first = new Date(); first.setMonth(first.getMonth() - m, 1);
      const day = n => { const d = new Date(first); d.setDate(n); return d > new Date() ? null : ymd(d); };
      const E = (n, category, amount, note) => { const date = day(n); if (date) expenses.push({ id: 'e' + expenses.length, date, category, amount, note }); };
      E(1, 'rent', 10000, 'Clinic rent');
      E(5, 'utilities', 1800 + Math.round(rnd() * 600), 'Electricity & water');
      E(25, 'salaries', 18000, 'Staff salaries');
      E(12, 'supplies', 2500 + Math.round(rnd() * 2000), 'Medical consumables');
      if (m % 2 === 0) E(18, 'marketing', 3000, 'Social media ads');
      if (m === 3) E(9, 'equipment', 18000, 'Shockwave device maintenance');
    }

    return { version: DB_VERSION, users, appointments, records, messages, cases, settings, subscriptions, expenses };
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
    SYMPTOMS,
    symptom: key => SYMPTOMS.find(x => x.key === key),
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
        const q = Store.billing.quote({ patientId, doctorId, service, date });
        const a = {
          id: uid('a'), patientId, doctorId, date, time, service, notes: notes || '', status: 'confirmed', createdAt: new Date().toISOString(),
          kind: q.kind, price: q.due, payment: q.payment, subscriptionId: q.subscription ? q.subscription.id : null,
          paid: q.payment === 'package', paidAt: q.payment === 'package' ? q.subscription.purchasedAt : null
        };
        db.appointments.push(a);
        persist();
        return clone(a);
      },
      setStatus(id, status) {
        const a = db.appointments.find(x => x.id === id);
        if (!a) throw err('not_found');
        a.status = status;
        // cash is collected at the visit; a cancelled package visit frees its session automatically
        if (status === 'completed' && a.payment === 'cash' && !a.paid) { a.paid = true; a.paidAt = ymd(new Date()); }
        if (status === 'cancelled' && a.payment === 'cash') { a.paid = false; a.paidAt = null; }
        persist();
        return clone(a);
      },
      setPaid(id, paid) {
        const a = db.appointments.find(x => x.id === id);
        if (!a) throw err('not_found');
        a.paid = !!paid;
        a.paidAt = paid ? ymd(new Date()) : null;
        persist();
        return clone(a);
      }
    },

    /* ---------- Billing ---------- */
    billing: {
      settings: () => clone(db.settings),
      updateSettings(patch) { Object.assign(db.settings, patch); persist(); return clone(db.settings); },
      package: id => clone(db.settings.packages.find(p => p.id === id) || null),
      /** Sessions already booked/used from a subscription (cancelled visits don't count). */
      used: subId => db.appointments.filter(a => a.subscriptionId === subId && isActive(a)).length,
      subscriptions(filter = {}) {
        return clone(db.subscriptions.filter(s => !filter.patientId || s.patientId === filter.patientId)
          .map(s => Object.assign({}, s, { used: Store.billing.used(s.id) }))
          .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt)));
      },
      /** Subscription that can cover a visit on `date` (still valid and has sessions left). */
      activeSubscription(patientId, date = ymd(new Date())) {
        const s = db.subscriptions
          .filter(x => x.patientId === patientId && x.purchasedAt <= date && x.expiresAt >= date && Store.billing.used(x.id) < x.sessions)
          .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0];
        return s ? Object.assign(clone(s), { used: Store.billing.used(s.id) }) : null;
      },
      /** What a patient will pay for a visit: consultation on the first visit with a doctor, then per-service session price. */
      quote({ patientId, doctorId, service, date }) {
        const seen = !!patientId && db.appointments.some(a => a.patientId === patientId && a.doctorId === doctorId && isActive(a));
        const kind = seen ? 'session' : 'consult';
        const price = kind === 'consult' ? db.settings.consultFee : (db.settings.prices[service] || 0);
        const subscription = patientId ? Store.billing.activeSubscription(patientId, date) : null;
        return { kind, price, due: subscription ? 0 : price, payment: subscription ? 'package' : 'cash', subscription };
      },
      sell(patientId, packageId) {
        const pk = db.settings.packages.find(p => p.id === packageId);
        if (!pk || !Store.patients.get(patientId)) throw err('not_found');
        const today = new Date();
        const s = { id: uid('sub'), patientId, packageId, name: pk.name, sessions: pk.sessions, price: pk.price, purchasedAt: ymd(today), expiresAt: ymd(addDays(pk.days, today)) };
        db.subscriptions.push(s);
        // upcoming unpaid visits of this patient are now covered by the package
        db.appointments.filter(a => a.patientId === patientId && a.status === 'confirmed' && a.payment === 'cash' && !a.paid && a.date >= s.purchasedAt && a.date <= s.expiresAt)
          .forEach(a => { if (Store.billing.used(s.id) < s.sessions) Object.assign(a, { payment: 'package', subscriptionId: s.id, price: 0, paid: true, paidAt: s.purchasedAt }); });
        persist();
        return clone(s);
      },
      removeSubscription(id) {
        db.appointments.forEach(a => {
          if (a.subscriptionId !== id) return;
          a.subscriptionId = null; a.payment = 'cash';
          a.price = a.kind === 'consult' ? db.settings.consultFee : (db.settings.prices[a.service] || 0);
          a.paid = false; a.paidAt = null;
        });
        db.subscriptions = db.subscriptions.filter(s => s.id !== id);
        persist();
      },
      expenses: () => clone(db.expenses).sort((a, b) => b.date.localeCompare(a.date)),
      addExpense(e) { const x = Object.assign({ id: uid('e') }, e); db.expenses.push(x); persist(); return clone(x); },
      removeExpense(id) { db.expenses = db.expenses.filter(e => e.id !== id); persist(); }
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

    /* ---------- Case files ---------- */
    cases: {
      list(filter = {}) {
        return clone(db.cases
          .filter(c => (!filter.patientId || c.patientId === filter.patientId) && (!filter.doctorId || c.doctorId === filter.doctorId))
          .sort((a, b) => b.startDate.localeCompare(a.startDate)));
      },
      get: id => clone(db.cases.find(c => c.id === id) || null),
      save(data) {
        let c = db.cases.find(x => x.id === data.id);
        if (c) Object.assign(c, data);
        else { c = Object.assign({ status: 'active', tests: [], sessions: [], exam: {} }, data, { id: uid('c') }); db.cases.push(c); }
        persist();
        return clone(c);
      },
      remove(id) { db.cases = db.cases.filter(c => c.id !== id); persist(); },
      _mut(id, fn) {
        const c = db.cases.find(x => x.id === id);
        if (!c) throw err('not_found');
        fn(c);
        persist();
        return clone(c);
      },
      addTest: (id, test) => Store.cases._mut(id, c => { c.tests.push(Object.assign({}, test, { id: uid('t') })); }),
      removeTest: (id, testId) => Store.cases._mut(id, c => { c.tests = c.tests.filter(x => x.id !== testId); }),
      /** Adds or updates a session; sessions stay ordered by date and renumbered. */
      saveSession: (id, s) => Store.cases._mut(id, c => {
        const cur = s.id && c.sessions.find(x => x.id === s.id);
        if (cur) Object.assign(cur, s);
        else c.sessions.push(Object.assign({ feedback: null }, s, { id: uid('s') }));
        c.sessions.sort((a, b) => a.date.localeCompare(b.date)).forEach((x, i) => { x.no = i + 1; });
      }),
      removeSession: (id, sid) => Store.cases._mut(id, c => {
        c.sessions = c.sessions.filter(x => x.id !== sid);
        c.sessions.forEach((x, i) => { x.no = i + 1; });
      }),
      /** Patient's own report for a session. */
      feedback: (id, sid, fbk) => Store.cases._mut(id, c => {
        const s = c.sessions.find(x => x.id === sid);
        if (!s) throw err('not_found');
        s.feedback = Object.assign({ date: ymd(new Date()) }, fbk);
      })
    },

    messages: {
      list: () => clone(db.messages).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      add(m) { db.messages.push(Object.assign({ id: uid('m'), createdAt: new Date().toISOString() }, m)); persist(); },
      remove(id) { db.messages = db.messages.filter(m => m.id !== id); persist(); }
    }
  };

  window.Store = Store;
})();
