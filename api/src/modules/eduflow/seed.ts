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
    name: "Ms. Sara",
    email: "sara.teacher@school.eduflow.local",
    role: "teacher",
    grade: "Grade 5",
  });

  const parent = await models.EduflowMembers.create({
    name: "Mrs. Tuya",
    email: "tuya.parent@example.com",
    role: "parent",
    phone: "+976 9911 2233",
  });

  const anu = await models.EduflowMembers.create({
    name: "Anu",
    email: "anu.5a@school.eduflow.local",
    role: "student",
    grade: "Grade 5A",
    parentId: String(parent._id),
    streak: 6,
    longestStreak: 9,
    points: 480,
    lastCompletedDate: daysFromNow(-1),
  });

  const bilguun = await models.EduflowMembers.create({
    name: "Bilguun",
    email: "bilguun.5a@school.eduflow.local",
    role: "student",
    grade: "Grade 5A",
    parentId: String(parent._id),
    streak: 2,
    longestStreak: 4,
    points: 160,
    lastCompletedDate: daysFromNow(-2),
  });

  const sarnai = await models.EduflowMembers.create({
    name: "Sarnai",
    email: "sarnai.5a@school.eduflow.local",
    role: "student",
    grade: "Grade 5A",
    parentId: String(parent._id),
    streak: 0,
    longestStreak: 1,
    points: 40,
  });

  const classroom = await models.EduflowClasses.create({
    name: "Grade 5A",
    code: "5A-MATH",
    subject: "Mathematics",
    teacherId: String(teacher._id),
    studentIds: [String(anu._id), String(bilguun._id), String(sarnai._id)],
  });

  await models.EduflowLessonPlans.create([
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Fractions: equivalent fractions",
      subject: "Mathematics",
      objectives:
        "Students can identify and generate equivalent fractions using models.",
      content:
        "Warm-up on halves and quarters, guided practice with fraction strips, pair work on the worksheet, exit ticket.",
      materials: "Fraction strips, whiteboard, worksheet 5A-12",
      assessment: "Exit ticket with 3 equivalent-fraction problems",
      status: "approved",
      approvedAt: daysFromNow(-2),
    },
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Reading: finding the main idea",
      subject: "Reading",
      objectives:
        "Students can state the main idea and two supporting details of a short text.",
      content:
        "Read a short fable together, annotate key sentences, complete a main-idea graphic organiser.",
      materials: "Fable handout, highlighters, graphic organiser",
      assessment: "Main-idea organiser and one-paragraph summary",
      status: "review",
    },
    {
      classId: String(classroom._id),
      teacherId: String(teacher._id),
      title: "Science: observing plant growth",
      subject: "Science",
      objectives:
        "Students record daily observations of a bean plant and describe change over time.",
      content:
        "Set up bean cups, measure the stem, record day 1 observations in the science journal.",
      materials: "Bean seeds, cups, soil, rulers, science journals",
      assessment: "Labelled drawing and three-sentence observation",
      status: "draft",
    },
  ]);

  const fractions = await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Fractions worksheet",
    description:
      "Complete questions 1–6 on worksheet 5A-12. Show the working for each equivalent fraction.",
    subject: "Mathematics",
    dueDate: daysFromNow(1),
    points: 20,
  });

  const reading = await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Reading comprehension",
    description:
      "Read the fable on page 14 and write the main idea plus two supporting details.",
    subject: "Reading",
    dueDate: daysFromNow(3),
    points: 15,
  });

  await models.EduflowHomework.create({
    classId: String(classroom._id),
    teacherId: String(teacher._id),
    title: "Science observation",
    description:
      "Draw your bean plant and write three sentences about what changed since yesterday.",
    subject: "Science",
    dueDate: daysFromNow(-1),
    points: 10,
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(fractions._id),
    studentId: String(anu._id),
    imageData: demoPage("Fractions — Anu", [
      "1) 1/2 = 2/4 = 4/8",
      "2) 2/3 = 4/6 = 8/12",
      "3) 3/4 = 6/8 = 9/12",
      "4) 4/5 = 8/10",
      "5) 5/6 = 10/12",
      "6) 6/8 = 3/4 ✓",
    ]),
    status: "approved",
    aiScore: 92,
    aiFeedback:
      "All six answers are correct, and the working is easy to follow. Great job simplifying question 6!",
    submittedAt: daysFromNow(-1),
    completedAt: daysFromNow(-1),
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(fractions._id),
    studentId: String(bilguun._id),
    imageData: demoPage("Fractions — Bilguun", [
      "1) 1/2 = 2/4",
      "2) 2/3 = 4/6",
      "3) 3/4 = 6/8",
      "4) 4/5 = 8/10",
      "5) 5/6 = 10/12",
      "6) 6/8 = ?",
    ]),
    status: "ai_checked",
    aiScore: 78,
    aiFeedback:
      "Questions 1–5 look good. Question 6 is unfinished — simplify 6/8 by dividing both numbers by 2.",
    submittedAt: daysFromNow(0),
  });

  await models.EduflowSubmissions.create({
    homeworkId: String(reading._id),
    studentId: String(anu._id),
    imageData: demoPage("Reading — Anu", [
      "Main idea: A clever fox teaches a crow a lesson.",
      "Detail 1: The crow had a piece of cheese.",
      "Detail 2: The fox flattered the crow to make it sing.",
    ]),
    status: "needs_work",
    aiScore: 72,
    aiFeedback:
      "Your main idea is close, but detail 2 retells the story instead of supporting the main idea. Try explaining how the fox's flattery solved the problem.",
    submittedAt: daysFromNow(-1),
  });

  await models.EduflowNotifications.create({
    parentId: String(parent._id),
    studentId: String(anu._id),
    homeworkId: String(fractions._id),
    channel: "sms",
    message:
      "Edu Flow: Anu completed Fractions worksheet with 92% and is on a 6-day streak. 🔥",
    status: "sent_dummy",
    createdAt: daysFromNow(-1),
  });

  return true;
};
