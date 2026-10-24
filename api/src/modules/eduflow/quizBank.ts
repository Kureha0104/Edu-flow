export type BankQuestion = {
  topic: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

// Dummy question bank. The adaptive engine selects from here; a real model can
// replace this file without changing the quiz resolver or UI contract.
export const QUESTION_BANK: BankQuestion[] = [
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 1,
    prompt: "1/2-тай тэнцүү бутархайг сонго.",
    options: ["2/4", "2/3", "3/4", "1/3"],
    correctIndex: 0,
    explanation: "2/4-ийн хүртвэр, хуваарийг 2-оор хуваахад 1/2 болно.",
  },
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 1,
    prompt: "2/4-ийг хялбарчилбал ямар бутархай болох вэ?",
    options: ["1/4", "1/2", "2/3", "3/4"],
    correctIndex: 1,
    explanation: "2 ба 4-ийг 2-оор хуваахад 1/2 гарна.",
  },
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 2,
    prompt: "3/4 ба 6/8 нь тэнцүү юу?",
    options: [
      "Үгүй, 6/8 нь их",
      "Тийм, тэнцүү",
      "Үгүй, 3/4 нь их",
      "Харьцуулах боломжгүй",
    ],
    correctIndex: 1,
    explanation: "6/8-ийг 2-оор хялбарчилбал 3/4 болно.",
  },
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 2,
    prompt: "4/6-г 2-оор хувааж хялбарчилбал?",
    options: ["1/3", "3/4", "2/3", "2/4"],
    correctIndex: 2,
    explanation: "4/6-ийн хүртвэр, хуваарийг 2-оор хуваахад 2/3 гарна.",
  },
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 3,
    prompt: "6/8-тай тэнцүү бутархайг ол.",
    options: ["2/3", "4/5", "5/6", "3/4"],
    correctIndex: 3,
    explanation: "6/8-ийг 2-оор хуваахад 3/4 болно.",
  },
  {
    topic: "Бутархай",
    subject: "Математик",
    difficulty: 3,
    prompt: "5/6 ба 10/12-ын хооронд ямар харилцаа байна?",
    options: [
      "10/12 нь бага",
      "5/6 нь бага",
      "Тэнцүү бутархайнууд",
      "Харьцуулах боломжгүй",
    ],
    correctIndex: 2,
    explanation: "10/12-ыг 2-оор хуваахад 5/6 болно.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 1,
    prompt: "Гол санаа гэж юу вэ?",
    options: [
      "Зохиолын хамгийн чухал санаа",
      "Гол дүрийн нэр",
      "Хамгийн урт өгүүлбэр",
      "Зохиолын төгсгөл",
    ],
    correctIndex: 0,
    explanation: "Гол санаа нь зохиолын хамгийн чухал, төв санааг илэрхийлнэ.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 1,
    prompt: "Гол санааг дэмжих мэдээллийг юу гэдэг вэ?",
    options: ["Гарчиг", "Дэмжих дэлгэрэнгүй", "Зохиогч", "Хэвлэлийн газар"],
    correctIndex: 1,
    explanation: "Дэмжих дэлгэрэнгүй нь гол санааг батлах жишээ, баримт юм.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 2,
    prompt: "Гол санааг олохын тулд эхлээд юу хийх вэ?",
    options: [
      "Эхний өгүүлбэрийг л унших",
      "Бүх текстийг уншиж, давтагдсан санааг олох",
      "Зөвхөн гарчгийг харах",
      "Үгсийн тоог тоолох",
    ],
    correctIndex: 1,
    explanation: "Бүтэн текстийг уншиж, давтагдсан гол санааг тодорхойлно.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 2,
    prompt: "Аль нь гол санаа болохгүй вэ?",
    options: [
      "Бороо орсны дараа гудамж чийгтэй болов",
      "Уур амьсгалын өөрчлөлт хотын амьдралд нөлөөлж байна",
      "Хүмүүс шүхэр барив",
      "Гутал норлоо",
    ],
    correctIndex: 0,
    explanation:
      "Эхний өгүүлбэр нь дэлгэрэнгүй мэдээлэл; бусад нь санааг дэмжиж байна.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 3,
    prompt: "Зохиолын гол санааг нэг өгүүлбэрээр хэрхэн илэрхийлэх вэ?",
    options: [
      "Гол дүрийн бүх үйлдлийг жагсаах",
      "Хамгийн чухал санааг өөрийн үгээр товчлох",
      "Эхний догол мөрийг хуулах",
      "Төгсгөлийг л бичих",
    ],
    correctIndex: 1,
    explanation: "Гол санааг өөрийн үгээр товчлон нэг өгүүлбэрт багтаана.",
  },
  {
    topic: "Унших ойлголт",
    subject: "Унших",
    difficulty: 3,
    prompt: "Дэмжих дэлгэрэнгүй мэдээлэл аль вэ?",
    options: [
      "Зохиолын гарчиг",
      "Гол санааг батлах жишээ",
      "Зохиогчийн нэр",
      "Номын үнэ",
    ],
    correctIndex: 1,
    explanation: "Гол санааг батлах жишээ нь дэмжих дэлгэрэнгүй болно.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 1,
    prompt: "Ургамлын өсөлтийг хэмжихэд юу ашиглах вэ?",
    options: ["Захирагч", "Термометр", "Лупа", "Харандаа"],
    correctIndex: 0,
    explanation: "Ургамлын өндрийг захирагчаар хэмжинэ.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 1,
    prompt: "Ажиглалтын бичлэгээ хаана хөтлөх вэ?",
    options: ["Өдрийн тэмдэглэл", "Хаягийн дэвтэр", "Зурагны цомог", "Тооны машин"],
    correctIndex: 0,
    explanation: "Өдрийн тэмдэглэлд огноо, хэмжилт, өөрчлөлтийг бичнэ.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 2,
    prompt: "Өсөлтийг хэрхэн зөв харьцуулах вэ?",
    options: [
      "Нэг өдрийн дүнг л харах",
      "Ижил хугацаанд, ижил нэгжээр хэмжих",
      "Өөр ургамалтай харьцуулахгүй",
      "Зөвхөн өндрийг бичих",
    ],
    correctIndex: 1,
    explanation: "Ижил хугацаа, ижил нэгжээр хэмжсэн үед харьцуулалт зөв болно.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 2,
    prompt: "Ажиглалтад ямар мэдээлэл орох ёстой вэ?",
    options: [
      "Зөвхөн өнгө",
      "Огноо, хэмжилт, өөрчлөлт",
      "Зөвхөн зураг",
      "Зөвхөн нэр",
    ],
    correctIndex: 1,
    explanation: "Огноо, хэмжилт, ажиглагдсан өөрчлөлт бүгд чухал.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 3,
    prompt: "Ажиглалтын дүгнэлтийг хэрхэн бичих вэ?",
    options: [
      "Хэмжилтийн тоонуудыг л жагсаах",
      "Харсан зүйлээ нотолгоотойгоор дүгнэх",
      "Бусдын дүгнэлтийг хуулах",
      "Дүгнэлт бичихгүй",
    ],
    correctIndex: 1,
    explanation: "Харсан зүйлээ хэмжилтийн нотолгоотой хослуулан дүгнэнэ.",
  },
  {
    topic: "Ажиглалт",
    subject: "Байгаль",
    difficulty: 3,
    prompt: "Хэрэв ургамал өсөөгүй бол дараагийн алхам?",
    options: [
      "Ажиглалтаа орхих",
      "Шалтгааныг шалгаж, нөхцөлийг өөрчлөх",
      "Ургамлыг хаях",
      "Зөвхөн услах",
    ],
    correctIndex: 1,
    explanation:
      "Гэрэл, ус, хөрс зэрэг нөхцөлийг шалгаж, өөрчлөлт хийж үргэлжлүүлнэ.",
  },
];

const DIFFICULTY_SEQUENCE: (1 | 2 | 3)[] = [1, 1, 2, 2, 3];

export const topics = ["Бутархай", "Унших ойлголт", "Ажиглалт"];

export const buildQuizQuestions = (topic: string) => {
  const used = new Set<string>();

  return DIFFICULTY_SEQUENCE.map((difficulty) => {
    const pool = QUESTION_BANK.filter(
      (question) =>
        question.topic === topic &&
        question.difficulty === difficulty &&
        !used.has(question.prompt),
    );
    const question = pool[0];

    if (!question) {
      const fallback = QUESTION_BANK.find(
        (candidate) => candidate.topic === topic && !used.has(candidate.prompt),
      );
      if (!fallback) {
        throw new Error(`No quiz questions for topic ${topic}`);
      }
      used.add(fallback.prompt);
      return {
        prompt: fallback.prompt,
        options: fallback.options,
        correctIndex: fallback.correctIndex,
        difficulty: fallback.difficulty,
        explanation: fallback.explanation,
      };
    }

    used.add(question.prompt);
    return {
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      difficulty: question.difficulty,
      explanation: question.explanation,
    };
  });
};

export const pickQuestion = (
  topic: string,
  difficulty: number,
  usedPrompts: string[],
) => {
  const question = QUESTION_BANK.find(
    (candidate) =>
      candidate.topic === topic &&
      candidate.difficulty === difficulty &&
      !usedPrompts.includes(candidate.prompt),
  );

  if (!question) {
    return null;
  }

  return {
    prompt: question.prompt,
    options: question.options,
    correctIndex: question.correctIndex,
    difficulty: question.difficulty,
    explanation: question.explanation,
  };
};
