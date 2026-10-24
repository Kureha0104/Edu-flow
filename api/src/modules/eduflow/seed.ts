import type { IModels } from "../../connectionResolvers.ts";

const DAY = 24 * 60 * 60 * 1000;

const daysFromNow = (days: number) => new Date(Date.now() + days * DAY);

const demoPage = (title: string, lines: string[]) => {
  const body = lines
    .map(
      (line, index) =>
        `<text x="70" y="${190 + index * 48}" font-size="26" fill="#3b3325">${line}</text>`,
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="840">
    <rect width="640" height="840" fill="#fffdf5"/>
    <rect x="28" y="28" width="584" height="784" fill="none" stroke="#d8c9a3" stroke-width="2"/>
    <text x="70" y="95" font-size="30" font-weight="bold" fill="#4c3b12">${title}</text>
    ${body}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
};

/**
 * Seeds the demo school once. Safe to call on every request: it does nothing
 * after the first member exists.
 */
export const ensureDemoData = async (models: IModels) => {
  if ((await models.EduflowMembers.countDocuments()) > 0) {
    return false;
  }

  const teacher = await models.EduflowMembers.create({
    name: "Сара багш",
    email: "sara.teacher@school.eduflow.local",
    role: "teacher",
    grade: "5А",
    leaderboardVisible: false,
  });

  const parent = await models.EduflowMembers.create({
    name: "Хатагтай Туяа",
    email: "tuya.parent@example.com",
    role: "parent",
    phone: "+976 9911 2233",
    leaderboardVisible: false,
  });

  const anu = await models.EduflowMembers.create({
    name: "Ану",
    email: "anu.5a@school.eduflow.local",
    role: "student",
    grade: "5А анги",
    parentId: String(parent._id),
    leaderboardVisible: true,
    streak: 6,
    longestStreak: 9,
    points: 480,
    lastCompletedDate: daysFromNow(-1),
  });

  const bilguun = await models.EduflowMembers.create({
    name: "Билгүүн",
    email: "bilguun.5a@school.eduflow.local",
    role: "student",
    grade: "5А анги",
    parentId: String(parent._id),
    leaderboardVisible: true,
    streak: 2,
    longestStreak: 4,
    points: 160,
    lastCompletedDate: daysFromNow(-2),
  });

  const sarnai = await models.EduflowMembers.create({
    name: "Сарнай",
    email: "sarnai.5a@school.eduflow.local",
    role: "student",
    grade: "5А анги",
    parentId: String(parent._id),
    leaderboardVisible: false,
    streak: 0,
    longestStreak: 1,
    points: 40,
  });

  const classroom = await models.EduflowClasses.create({
    name: "5А анги",
    code: "5А-МАТ",
    subject: "Математик",
    teacherId: String(teacher._id),
    studentIds: [String(anu._id), String(bilguun._id), String(sarnai._id)],
  });

  await models.EduflowLessonPlans.create([
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Бутархай: тэнцүү бутархай",
      subject: "Математик",
      objectives:
        "Сурагчид загвар ашиглан тэнцүү бутархайг таньж, үүсгэж чадна.",
      content:
        "Хагас, дөрөвний нэгээр халаалт, бутархайн загвараар чиглэсэн дасгал, ажлын хуудсаар хосоор ажиллах, гарах тасалбар.",
      materials: "Бутархайн загвар, самбар, 5А-12 ажлын хуудас",
      assessment: "3 тэнцүү бутархайн бодлоготой гарах тасалбар",
      status: "approved",
      approvedAt: daysFromNow(-2),
    },
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Унших: гол санаа олох",
      subject: "Унших",
      objectives:
        "Сурагчид богино текстийн гол санаа болон хоёр дэмжих дэлгэрэнгүйг хэлж чадна.",
      content:
        "Богино үлгэрийг хамт уншиж, чухал өгүүлбэрийг тэмдэглэж, гол санааны график зохион байгуулагчийг бөглөнө.",
      materials: "Үлгэрийн хуудас, маркер, график зохион байгуулагч",
      assessment: "Гол санааны зохион байгуулагч, нэг догол мөрийн хураангуй",
      status: "review",
    },
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Байгаль: ургамлын өсөлтийг ажиглах",
      subject: "Байгаль",
      objectives:
        "Сурагчид шошны ургамлын өдөр тутмын ажиглалтыг бичиж, цаг хугацааны өөрчлөлтийг тайлбарлана.",
      content:
        "Шошны аяга бэлдэж, ишийг хэмжиж, 1 дэх өдрийн ажиглалтыг байгалийн өдрийн тэмдэглэлд бичнэ.",
      materials: "Шошны үр, аяга, хөрс, захирагч, байгалийн өдрийн тэмдэглэл",
      assessment: "Шошготой зураг, гурван өгүүлбэрийн ажиглалт",
      status: "draft",
    },
  ]);

  const fractions = await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Бутархайн дасгал",
    description:
      "5А-12 ажлын хуудасны 1–6 бодлогыг гүйцэтгэ. Тэнцүү бутархай бүрийн бодолтыг харуул.",
    subject: "Математик",
    dueDate: daysFromNow(1),
    points: 20,
  });

  const reading = await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Унших ойлголт",
    description:
      "14 дэх хуудасны үлгэрийг уншиж, гол санаа болон хоёр дэмжих дэлгэрэнгүйг бич.",
    subject: "Унших",
    dueDate: daysFromNow(3),
    points: 15,
  });

  await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Байгалийн ажиглалт",
    description:
      "Шошны ургамлаа зурж, өчигдрөөс хойш юу өөрчлөгдсөнийг гурван өгүүлбэрээр бич.",
    subject: "Байгаль",
    dueDate: daysFromNow(-1),
    points: 10,
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(fractions._id),
    studentId: String(anu._id),
    imageData: demoPage("Бутархай — Ану", [
      "1) 1/2 = 2/4 = 4/8",
      "2) 2/3 = 4/6 = 8/12",
      "3) 3/4 = 6/8 = 9/12",
      "4) 4/5 = 8/10",
      "5) 5/6 = 10/12",
      "6) 6/8 = 3/4 ✓",
    ]),
    status: "approved",
    aiScore: 92,
    aiProvider: "mock",
    earnedPoints: 18,
    gradePercent: 92,
    aiFeedback:
      "Зургаан хариулт бүгд зөв, бодолт нь ойлгомжтой. 6-р бодлогыг хялбарчилсан нь сайн байна!",
    submittedAt: daysFromNow(-1),
    completedAt: daysFromNow(-1),
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(fractions._id),
    studentId: String(bilguun._id),
    imageData: demoPage("Бутархай — Билгүүн", [
      "1) 1/2 = 2/4",
      "2) 2/3 = 4/6",
      "3) 3/4 = 6/8",
      "4) 4/5 = 8/10",
      "5) 5/6 = 10/12",
      "6) 6/8 = ?",
    ]),
    status: "ai_checked",
    aiScore: 78,
    aiProvider: "mock",
    earnedPoints: 0,
    gradePercent: 0,
    aiFeedback:
      "1–5 бодлого сайн байна. 6-р бодлого дуусаагүй — 6/8-ын хүртвэр, хуваарийг 2-оор хувааж хялбарчил.",
    submittedAt: daysFromNow(0),
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(reading._id),
    studentId: String(anu._id),
    imageData: demoPage("Унших — Ану", [
      "Гол санаа: Ухаант үнэг хэрээд сургамж өгдөг.",
      "Дэлгэрэнгүй 1: Хэрээнд нэг хэсэг бяслаг байв.",
      "Дэлгэрэнгүй 2: Үнэг хэрээг магтан дуулуулав.",
    ]),
    status: "needs_work",
    aiScore: 72,
    aiProvider: "mock",
    earnedPoints: 0,
    gradePercent: 0,
    aiFeedback:
      "Гол санаа чинь ойролцоо байна, гэхдээ 2-р дэлгэрэнгүй гол санааг дэмжихийн оронд түүхийг дахин өгүүлж байна. Үнэгний магтаал бодлогыг хэрхэн шийдсэнийг тайлбарлаж үзээрэй.",
    submittedAt: daysFromNow(-1),
  });

  await models.EduflowNotifications.create({
    parentId: String(parent._id),
    studentId: String(anu._id),
    homeworkId: String(fractions._id),
    channel: "sms",
    message:
      "Edu Flow: Ану Бутархайн дасгалыг 92% гүйцэтгэж, 6 өдрийн цуврал үргэлжлүүллээ. 🔥",
    status: "sent_dummy",
    createdAt: daysFromNow(-1),
  });

  await models.EduflowConcepts.create([
    {
      studentId: String(anu._id),
      subject: "Математик",
      topic: "Бутархай",
      mastery: 62,
      attempts: 12,
      correct: 8,
    },
    {
      studentId: String(anu._id),
      subject: "Унших",
      topic: "Унших ойлголт",
      mastery: 48,
      attempts: 9,
      correct: 4,
    },
    {
      studentId: String(anu._id),
      subject: "Байгаль",
      topic: "Ажиглалт",
      mastery: 70,
      attempts: 6,
      correct: 4,
    },
    {
      studentId: String(bilguun._id),
      subject: "Математик",
      topic: "Бутархай",
      mastery: 40,
      attempts: 10,
      correct: 4,
    },
    {
      studentId: String(bilguun._id),
      subject: "Унших",
      topic: "Унших ойлголт",
      mastery: 66,
      attempts: 8,
      correct: 5,
    },
    {
      studentId: String(bilguun._id),
      subject: "Байгаль",
      topic: "Ажиглалт",
      mastery: 55,
      attempts: 5,
      correct: 3,
    },
    {
      studentId: String(sarnai._id),
      subject: "Математик",
      topic: "Бутархай",
      mastery: 30,
      attempts: 7,
      correct: 2,
    },
    {
      studentId: String(sarnai._id),
      subject: "Унших",
      topic: "Унших ойлголт",
      mastery: 45,
      attempts: 6,
      correct: 3,
    },
    {
      studentId: String(sarnai._id),
      subject: "Байгаль",
      topic: "Ажиглалт",
      mastery: 60,
      attempts: 4,
      correct: 2,
    },
  ]);

  return true;
};
