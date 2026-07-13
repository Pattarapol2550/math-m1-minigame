import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding...");

  // Users
  const teacherPw = await bcrypt.hash("teacher123", 10);
  const studentPw = await bcrypt.hash("student123", 10);

  await prisma.user.upsert({
    where: { username: "teacher" },
    update: {},
    create: { username: "teacher", name: "คุณครู สมชาย", password: teacherPw, role: "TEACHER" },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.user.upsert({
      where: { username: `student${i}` },
      update: {},
      create: {
        username: `student${i}`,
        name: `นักเรียน คนที่ ${i}`,
        password: studentPw,
        role: "STUDENT",
        classroom: i <= 3 ? "ม.1/1" : "ม.1/2",
      },
    });
  }

  // Mode 1: จำนวนเต็ม
  const cat1 = await prisma.category.upsert({
    where: { id: "cat-integers" },
    update: {},
    create: { id: "cat-integers", name: "จำนวนเต็ม", mode: "integers", order: 0 },
  });

  const stages1 = [
    { id: "s1-compare", name: "การเปรียบเทียบ", order: 0, enemyName: "โกบลินเปรียบเทียบ", enemyEmoji: "👺" },
    { id: "s1-absolute", name: "ค่าสัมบูรณ์", order: 1, enemyName: "มังกรสัมบูรณ์", enemyEmoji: "🐲" },
    { id: "s1-addSub", name: "บวกและลบ", order: 2, enemyName: "ปีศาจบวกลบ", enemyEmoji: "👹" },
    { id: "s1-mulDiv", name: "คูณและหาร", order: 3, enemyName: "ซอมบี้คูณหาร", enemyEmoji: "🧟" },
    { id: "s1-apply", name: "การประยุกต์", order: 4, enemyName: "บอสจำนวนเต็ม", enemyEmoji: "💀" },
  ];

  for (const s of stages1) {
    await prisma.stage.upsert({ where: { id: s.id }, update: {}, create: { ...s, categoryId: cat1.id } });
  }

  // Mode 2: เลขยกกำลัง
  const cat2 = await prisma.category.upsert({
    where: { id: "cat-exponent" },
    update: {},
    create: { id: "cat-exponent", name: "เลขยกกำลัง", mode: "exponent", order: 1 },
  });

  const stages2 = [
    { id: "s2-meaning", name: "ความหมาย", order: 0, enemyName: "สัตว์ประหลาดยกกำลัง", enemyEmoji: "🦎" },
    { id: "s2-write", name: "การเขียน", order: 1, enemyName: "ปีศาจเขียน", enemyEmoji: "🧙" },
    { id: "s2-calc", name: "การคำนวณ", order: 2, enemyName: "มังกรคำนวณ", enemyEmoji: "🐉" },
    { id: "s2-rules", name: "กฎพื้นฐาน", order: 3, enemyName: "ราชาแห่งกฎ", enemyEmoji: "👑" },
    { id: "s2-apply", name: "โจทย์ประยุกต์", order: 4, enemyName: "บอสยกกำลัง", enemyEmoji: "💀" },
  ];

  for (const s of stages2) {
    await prisma.stage.upsert({ where: { id: s.id }, update: {}, create: { ...s, categoryId: cat2.id } });
  }

  // ── Mode 1: จำนวนเต็ม ──────────────────────────────────────────────

  const q_compare = [
    { body: "-3 กับ -5 อันไหนมากกว่า?", data: { choices: ["-3", "-5", "เท่ากัน", "บอกไม่ได้"], answer: "-3", hint: "บนเส้นจำนวน ขวาคือมากกว่า" } },
    { body: "|−7| เปรียบกับ |5|?", data: { choices: ["|−7| > |5|", "|−7| < |5|", "|−7| = |5|", "ไม่มีคำตอบ"], answer: "|−7| > |5|", hint: "7 > 5" } },
    { body: "จัดเรียง -2, 0, -5, 3 จากน้อยไปมาก", data: { choices: ["-5,-2,0,3", "-2,-5,0,3", "0,-2,-5,3", "3,0,-2,-5"], answer: "-5,-2,0,3", hint: "ตัวเลขที่อยู่ซ้ายสุดบนเส้นจำนวนน้อยที่สุด" } },
    { body: "-10 □ -3 ควรใส่สัญลักษณ์ใด?", data: { choices: ["<", ">", "=", "≥"], answer: "<", hint: "-10 อยู่ซ้ายของ -3" } },
    { body: "จำนวนใดมีค่ามากที่สุด?", data: { choices: ["-1", "-100", "0", "-50"], answer: "0", hint: "ศูนย์มากกว่าจำนวนลบทุกตัว" } },
    { body: "จำนวนใดมีค่าน้อยที่สุด?", data: { choices: ["-8", "-2", "0", "3"], answer: "-8", hint: "-8 อยู่ซ้ายสุดบนเส้นจำนวน" } },
    { body: "-6 □ -6 ควรใส่สัญลักษณ์ใด?", data: { choices: ["=", "<", ">", "≠"], answer: "=", hint: "จำนวนเดียวกันย่อมเท่ากัน" } },
    { body: "จำนวนเต็มลบที่มีค่ามากที่สุดคือ?", data: { choices: ["-1", "-100", "-10", "-50"], answer: "-1", hint: "-1 อยู่ใกล้ศูนย์ที่สุด จึงมากที่สุด" } },
    { body: "จัดเรียง 4, -1, -3, 2 จากมากไปน้อย", data: { choices: ["4,2,-1,-3", "4,-1,2,-3", "-3,-1,2,4", "2,4,-1,-3"], answer: "4,2,-1,-3", hint: "จากขวาไปซ้ายบนเส้นจำนวน" } },
    { body: "ข้อใดถูก?", data: { choices: ["-5 < -2", "-5 > -2", "-5 = -2", "-2 < -5"], answer: "-5 < -2", hint: "-5 อยู่ซ้ายของ -2 จึงน้อยกว่า" } },
  ];

  const q_absolute = [
    { body: "|−9| = ?", data: { choices: ["9", "-9", "0", "81"], answer: "9", hint: "ค่าสัมบูรณ์คือระยะห่างจากศูนย์ ไม่ติดลบ" } },
    { body: "|−15| = ?", data: { choices: ["15", "-15", "1/15", "150"], answer: "15", hint: "ระยะทางไม่มีลบ" } },
    { body: "|0| = ?", data: { choices: ["0", "1", "-0", "∞"], answer: "0", hint: "ระยะห่างจากศูนย์ถึงศูนย์คือ 0" } },
    { body: "|-3| + |4| = ?", data: { choices: ["7", "1", "-1", "-7"], answer: "7", hint: "3 + 4 = 7" } },
    { body: "ถ้า |x| = 6 แล้ว x = ?", data: { choices: ["6 หรือ -6", "6", "-6", "36"], answer: "6 หรือ -6", hint: "ระยะห่าง 6 อยู่ 2 ด้านของศูนย์" } },
    { body: "|−20| = ?", data: { choices: ["20", "-20", "2", "200"], answer: "20", hint: "ค่าสัมบูรณ์ตัดเครื่องหมายลบออก" } },
    { body: "|8| − |−3| = ?", data: { choices: ["5", "11", "-5", "-11"], answer: "5", hint: "8 - 3 = 5" } },
    { body: "จำนวนใดมีค่าสัมบูรณ์มากที่สุด?", data: { choices: ["-10", "7", "-3", "9"], answer: "-10", hint: "|-10| = 10 มากที่สุด" } },
    { body: "|-7| × |2| = ?", data: { choices: ["14", "-14", "5", "-5"], answer: "14", hint: "7 × 2 = 14" } },
    { body: "ถ้า |x| = 0 แล้ว x = ?", data: { choices: ["0", "1", "-1", "ไม่มีคำตอบ"], answer: "0", hint: "มีเพียง 0 ที่มีระยะห่างจากศูนย์เป็น 0" } },
  ];

  const q_addSub = [
    { body: "(-3) + (-5) = ?", data: { choices: ["-8", "8", "-2", "2"], answer: "-8", hint: "บวกเลขลบสองตัว ยิ่งเป็นลบมากขึ้น" } },
    { body: "(-7) - (-4) = ?", data: { choices: ["-3", "-11", "3", "11"], answer: "-3", hint: "ลบลบ = บวก → -7 + 4 = -3" } },
    { body: "5 + (-8) = ?", data: { choices: ["-3", "3", "13", "-13"], answer: "-3", hint: "8 - 5 = 3 ผลติดลบเพราะ -8 มากกว่า" } },
    { body: "(-6) - 4 = ?", data: { choices: ["-10", "10", "-2", "2"], answer: "-10", hint: "-6 - 4 = -(6+4) = -10" } },
    { body: "3 - (-9) = ?", data: { choices: ["12", "-6", "6", "-12"], answer: "12", hint: "ลบลบ = บวก → 3 + 9 = 12" } },
    { body: "(-12) + 5 = ?", data: { choices: ["-7", "7", "-17", "17"], answer: "-7", hint: "12 - 5 = 7 ผลติดลบเพราะ -12 มากกว่า" } },
    { body: "0 - (-4) = ?", data: { choices: ["4", "-4", "0", "1"], answer: "4", hint: "0 - (-4) = 0 + 4 = 4" } },
    { body: "(-8) + 8 = ?", data: { choices: ["0", "16", "-16", "1"], answer: "0", hint: "จำนวนบวกกับจำนวนตรงข้ามได้ 0" } },
    { body: "(-15) - (-15) = ?", data: { choices: ["0", "30", "-30", "-15"], answer: "0", hint: "-15 + 15 = 0" } },
    { body: "10 + (-3) - (-2) = ?", data: { choices: ["9", "5", "15", "-9"], answer: "9", hint: "10 - 3 + 2 = 9" } },
  ];

  const q_mulDiv = [
    { body: "(-4) × (-3) = ?", data: { choices: ["12", "-12", "7", "-7"], answer: "12", hint: "ลบ × ลบ = บวก" } },
    { body: "(-5) × 6 = ?", data: { choices: ["-30", "30", "-11", "11"], answer: "-30", hint: "ลบ × บวก = ลบ" } },
    { body: "(-24) ÷ (-6) = ?", data: { choices: ["4", "-4", "18", "-18"], answer: "4", hint: "ลบ ÷ ลบ = บวก" } },
    { body: "36 ÷ (-9) = ?", data: { choices: ["-4", "4", "-27", "27"], answer: "-4", hint: "บวก ÷ ลบ = ลบ" } },
    { body: "(-2) × (-3) × (-1) = ?", data: { choices: ["-6", "6", "-5", "5"], answer: "-6", hint: "สามตัวลบ ผลลัพธ์เป็นลบ" } },
    { body: "7 × (-8) = ?", data: { choices: ["-56", "56", "-15", "15"], answer: "-56", hint: "บวก × ลบ = ลบ" } },
    { body: "(-100) ÷ 25 = ?", data: { choices: ["-4", "4", "-75", "75"], answer: "-4", hint: "ลบ ÷ บวก = ลบ" } },
    { body: "(-3)³ = ?", data: { choices: ["-27", "27", "-9", "9"], answer: "-27", hint: "(-3)×(-3)×(-3) = 9×(-3) = -27" } },
    { body: "(-6) × 0 = ?", data: { choices: ["0", "-6", "6", "-1"], answer: "0", hint: "ทุกจำนวนคูณศูนย์ได้ศูนย์" } },
    { body: "(-48) ÷ (-8) ÷ (-2) = ?", data: { choices: ["-3", "3", "-12", "12"], answer: "-3", hint: "6 ÷ (-2) = -3" } },
  ];

  const q_apply1 = [
    { body: "อุณหภูมิ -5°C เพิ่ม 8°C เป็นเท่าไหร่?", data: { choices: ["3°C", "-3°C", "13°C", "-13°C"], answer: "3°C", hint: "-5 + 8 = 3" } },
    { body: "บัญชีมี -200 บาท ฝากอีก 500 บาท เหลือเท่าไหร่?", data: { choices: ["300", "-300", "700", "-700"], answer: "300", hint: "-200 + 500 = 300" } },
    { body: "ลิฟต์อยู่ชั้น -2 ขึ้น 5 ชั้น อยู่ชั้นไหน?", data: { choices: ["3", "-3", "7", "-7"], answer: "3", hint: "-2 + 5 = 3" } },
    { body: "คะแนน -10 แล้วโดนหัก 5 คะแนน เหลือเท่าไหร่?", data: { choices: ["-15", "15", "-5", "5"], answer: "-15", hint: "-10 - 5 = -15" } },
    { body: "หนี้ 300 บาท × 3 เดือน รวมหนี้เท่าไหร่?", data: { choices: ["-900", "900", "-100", "100"], answer: "-900", hint: "(-300) × 3 = -900" } },
    { body: "ดำน้ำลึก 12 เมตร แล้วขึ้นมา 7 เมตร อยู่ระดับไหน?", data: { choices: ["-5 เมตร", "5 เมตร", "-19 เมตร", "19 เมตร"], answer: "-5 เมตร", hint: "-12 + 7 = -5" } },
    { body: "อุณหภูมิ -8°C ลดลง 3°C เป็นเท่าไหร่?", data: { choices: ["-11°C", "-5°C", "11°C", "5°C"], answer: "-11°C", hint: "-8 - 3 = -11" } },
    { body: "กำไร 500 บาท ขาดทุน 800 บาท สุดท้ายเป็นอย่างไร?", data: { choices: ["ขาดทุน 300 บาท", "กำไร 300 บาท", "ขาดทุน 1300 บาท", "กำไร 1300 บาท"], answer: "ขาดทุน 300 บาท", hint: "500 - 800 = -300" } },
    { body: "รถยนต์ถอยหลัง 6 ครั้ง ครั้งละ 3 เมตร ระยะรวมจากจุดเริ่มต้น?", data: { choices: ["-18 เมตร", "18 เมตร", "-9 เมตร", "9 เมตร"], answer: "-18 เมตร", hint: "(-3) × 6 = -18" } },
    { body: "หุ้นราคา 100 บาท ลดลง 15% มีค่าเท่าไหร่?", data: { choices: ["85 บาท", "115 บาท", "15 บาท", "150 บาท"], answer: "85 บาท", hint: "100 - (100 × 15/100) = 100 - 15 = 85" } },
  ];

  // ── Mode 2: เลขยกกำลัง ─────────────────────────────────────────────

  const q_meaning = [
    { body: "2³ หมายถึงอะไร?", data: { choices: ["2×2×2", "2+3", "2×3", "3×3"], answer: "2×2×2", hint: "เลขฐานยกกำลังสามคือคูณกัน 3 ครั้ง" } },
    { body: "5² มีค่าเท่าไหร่?", data: { choices: ["25", "10", "52", "7"], answer: "25", hint: "5 × 5 = 25" } },
    { body: "ในนิพจน์ 4³ เลข 3 เรียกว่า?", data: { choices: ["เลขชี้กำลัง", "เลขฐาน", "ค่า", "ผลลัพธ์"], answer: "เลขชี้กำลัง", hint: "เลขบน/ขวาเล็กๆ คือเลขชี้กำลัง" } },
    { body: "ในนิพจน์ 7⁴ เลข 7 เรียกว่า?", data: { choices: ["เลขฐาน", "เลขชี้กำลัง", "ผลลัพธ์", "ตัวหาร"], answer: "เลขฐาน", hint: "เลขตัวใหญ่ด้านซ้ายคือเลขฐาน" } },
    { body: "3⁰ = ?", data: { choices: ["1", "0", "3", "∞"], answer: "1", hint: "จำนวนใดๆ ยกกำลัง 0 = 1" } },
    { body: "1¹⁰⁰ = ?", data: { choices: ["1", "100", "0", "10"], answer: "1", hint: "1 คูณกันกี่ครั้งก็ยังเป็น 1" } },
    { body: "10² หมายถึงอะไร?", data: { choices: ["10×10", "10+2", "10×2", "2×2×2×2×2×2×2×2×2×2"], answer: "10×10", hint: "10 ยกกำลัง 2 คือ 10 คูณ 10" } },
    { body: "เลขชี้กำลังในนิพจน์ 6⁵ คือ?", data: { choices: ["5", "6", "30", "11"], answer: "5", hint: "เลขที่อยู่ด้านบนขวาคือเลขชี้กำลัง" } },
    { body: "(-1)⁵ = ?", data: { choices: ["-1", "1", "5", "-5"], answer: "-1", hint: "ลบยกกำลังคี่ = ลบ" } },
    { body: "0⁵ = ?", data: { choices: ["0", "1", "5", "∞"], answer: "0", hint: "0 คูณกันกี่ครั้งก็ยังเป็น 0" } },
  ];

  const q_write = [
    { body: "3×3×3×3 เขียนในรูปยกกำลังคือ?", data: { choices: ["3⁴", "4³", "3×4", "12"], answer: "3⁴", hint: "คูณ 3 สี่ครั้ง = 3⁴" } },
    { body: "5×5×5 เขียนในรูปยกกำลังคือ?", data: { choices: ["5³", "3⁵", "15", "5+5+5"], answer: "5³", hint: "คูณ 5 สามครั้ง = 5³" } },
    { body: "a×a×a×a×a เขียนในรูปยกกำลังคือ?", data: { choices: ["a⁵", "5a", "a+5", "5⁰"], answer: "a⁵", hint: "นับจำนวนครั้งที่คูณ" } },
    { body: "2⁴ เขียนแบบขยายคือ?", data: { choices: ["2×2×2×2", "2+2+2+2", "4×4", "2×4"], answer: "2×2×2×2", hint: "ยกกำลัง 4 = คูณ 4 ครั้ง" } },
    { body: "(-2)³ = ?", data: { choices: ["-8", "8", "-6", "6"], answer: "-8", hint: "(-2)×(-2)×(-2) = -8" } },
    { body: "7×7 เขียนในรูปยกกำลังคือ?", data: { choices: ["7²", "2⁷", "7+7", "14"], answer: "7²", hint: "7 คูณ 2 ครั้ง = 7²" } },
    { body: "x×x×x เขียนในรูปยกกำลังคือ?", data: { choices: ["x³", "3x", "x+3", "3³"], answer: "x³", hint: "x คูณ 3 ครั้ง = x³" } },
    { body: "10⁴ เขียนแบบขยายคือ?", data: { choices: ["10×10×10×10", "10+10+10+10", "10×4", "4×4×4×4×4×4×4×4×4×4"], answer: "10×10×10×10", hint: "ยกกำลัง 4 = คูณ 4 ครั้ง" } },
    { body: "2×2×2×3×3 เขียนในรูปยกกำลังคือ?", data: { choices: ["2³×3²", "2²×3³", "6⁵", "5⁶"], answer: "2³×3²", hint: "แยกกลุ่ม 2 สามครั้ง และ 3 สองครั้ง" } },
    { body: "(-3)⁴ มีค่าเป็น + หรือ -?", data: { choices: ["บวก (+)", "ลบ (-)", "ศูนย์", "ขึ้นอยู่กับ x"], answer: "บวก (+)", hint: "ลบยกกำลังคู่ = บวก" } },
  ];

  const q_calc = [
    { body: "2³ = ?", data: { choices: ["8", "6", "9", "23"], answer: "8", hint: "2×2×2 = 8" } },
    { body: "3⁴ = ?", data: { choices: ["81", "12", "34", "64"], answer: "81", hint: "3×3×3×3 = 81" } },
    { body: "10³ = ?", data: { choices: ["1000", "30", "100", "10000"], answer: "1000", hint: "10×10×10 = 1000" } },
    { body: "(-3)² = ?", data: { choices: ["9", "-9", "6", "-6"], answer: "9", hint: "(-3)×(-3) = 9 (ลบ×ลบ=บวก)" } },
    { body: "4² + 3² = ?", data: { choices: ["25", "49", "7", "14"], answer: "25", hint: "16 + 9 = 25" } },
    { body: "2⁵ = ?", data: { choices: ["32", "16", "64", "10"], answer: "32", hint: "2×2×2×2×2 = 32" } },
    { body: "5³ = ?", data: { choices: ["125", "25", "15", "75"], answer: "125", hint: "5×5×5 = 125" } },
    { body: "(-2)⁴ = ?", data: { choices: ["16", "-16", "8", "-8"], answer: "16", hint: "ลบยกกำลังคู่ = บวก: 2⁴ = 16" } },
    { body: "6² - 2⁵ = ?", data: { choices: ["4", "68", "-4", "36"], answer: "4", hint: "36 - 32 = 4" } },
    { body: "2³ × 5² = ?", data: { choices: ["200", "40", "100", "80"], answer: "200", hint: "8 × 25 = 200" } },
  ];

  const q_rules = [
    { body: "a² × a³ = ?", data: { choices: ["a⁵", "a⁶", "2a⁵", "a"], answer: "a⁵", hint: "คูณ: บวกเลขชี้กำลัง 2+3=5" } },
    { body: "(2³)² = ?", data: { choices: ["2⁶", "2⁵", "4⁶", "6²"], answer: "2⁶", hint: "ยกกำลังซ้อน: คูณ 3×2=6" } },
    { body: "a⁶ ÷ a² = ?", data: { choices: ["a⁴", "a⁸", "a³", "a"], answer: "a⁴", hint: "หาร: ลบเลขชี้กำลัง 6-2=4" } },
    { body: "(ab)³ = ?", data: { choices: ["a³b³", "ab³", "a³b", "3ab"], answer: "a³b³", hint: "กระจายกำลังให้ทุกตัวในวงเล็บ" } },
    { body: "a⁰ = ?", data: { choices: ["1", "0", "a", "∞"], answer: "1", hint: "ทุกจำนวน(ยกเว้น 0) ยกกำลัง 0 = 1" } },
    { body: "3² × 3⁴ = ?", data: { choices: ["3⁶", "3⁸", "9⁶", "6³"], answer: "3⁶", hint: "ฐานเดียวกัน คูณกัน → บวกเลขชี้กำลัง: 2+4=6" } },
    { body: "(a³)⁴ = ?", data: { choices: ["a¹²", "a⁷", "4a³", "a³⁴"], answer: "a¹²", hint: "ยกกำลังซ้อน: 3×4=12" } },
    { body: "x⁵ ÷ x⁵ = ?", data: { choices: ["1", "0", "x", "x¹⁰"], answer: "1", hint: "x⁵ ÷ x⁵ = x⁰ = 1" } },
    { body: "(2a)² = ?", data: { choices: ["4a²", "2a²", "4a", "2a"], answer: "4a²", hint: "2² × a² = 4a²" } },
    { body: "2³ × 2⁴ ÷ 2² = ?", data: { choices: ["2⁵", "2⁴", "2⁹", "2¹"], answer: "2⁵", hint: "3+4-2 = 5" } },
  ];

  const q_apply2 = [
    { body: "พื้นที่สี่เหลี่ยมจัตุรัสด้าน 5 ซม. = ?", data: { choices: ["25 ซม²", "20 ซม²", "10 ซม²", "5 ซม²"], answer: "25 ซม²", hint: "พื้นที่ = ด้าน² = 5² = 25" } },
    { body: "1 กิโลเมตร = 10³ เมตร เท่ากับกี่เมตร?", data: { choices: ["1000", "100", "10000", "300"], answer: "1000", hint: "10³ = 1000" } },
    { body: "2¹⁰ = ?", data: { choices: ["1024", "512", "2048", "20"], answer: "1024", hint: "2¹⁰ = 1024 (ท่องจำ)" } },
    { body: "ปริมาตรลูกบาศก์ด้าน 3 ซม. = ?", data: { choices: ["27 ซม³", "9 ซม³", "3 ซม³", "18 ซม³"], answer: "27 ซม³", hint: "ปริมาตร = ด้าน³ = 3³ = 27" } },
    { body: "ไวรัสเพิ่มเป็น 2 เท่าทุก 1 ชั่วโมง เริ่มต้น 1 ตัว หลัง 4 ชั่วโมงมีกี่ตัว?", data: { choices: ["16", "8", "4", "2"], answer: "16", hint: "2⁴ = 16" } },
    { body: "กระดาษพับครึ่ง 3 ครั้ง มีกี่ชั้น?", data: { choices: ["8", "6", "9", "12"], answer: "8", hint: "2³ = 8" } },
    { body: "พื้นที่สี่เหลี่ยมจัตุรัสด้าน 12 ซม. = ?", data: { choices: ["144 ซม²", "48 ซม²", "24 ซม²", "12 ซม²"], answer: "144 ซม²", hint: "12² = 144" } },
    { body: "เซลล์แบ่งตัวทุก 1 ชั่วโมง เริ่ม 1 เซลล์ หลัง 5 ชั่วโมงมีกี่เซลล์?", data: { choices: ["32", "16", "64", "10"], answer: "32", hint: "2⁵ = 32" } },
    { body: "ปริมาตรลูกบาศก์ด้าน 4 ซม. = ?", data: { choices: ["64 ซม³", "16 ซม³", "12 ซม³", "48 ซม³"], answer: "64 ซม³", hint: "4³ = 64" } },
    { body: "คอมพิวเตอร์เก็บข้อมูล 1 GB = 2³⁰ bytes ประมาณกี่ล้าน bytes?", data: { choices: ["1,073 ล้าน", "30 ล้าน", "1,000 ล้าน", "100 ล้าน"], answer: "1,073 ล้าน", hint: "2¹⁰ ≈ 1,000 ดังนั้น 2³⁰ ≈ 10⁹ ≈ 1,000 ล้าน" } },
  ];

  // Insert all questions
  const allStageQuestions: [string, any[]][] = [
    ["s1-compare", q_compare],
    ["s1-absolute", q_absolute],
    ["s1-addSub", q_addSub],
    ["s1-mulDiv", q_mulDiv],
    ["s1-apply", q_apply1],
    ["s2-meaning", q_meaning],
    ["s2-write", q_write],
    ["s2-calc", q_calc],
    ["s2-rules", q_rules],
    ["s2-apply", q_apply2],
  ];

  for (const [stageId, qs] of allStageQuestions) {
    const existing = await prisma.question.findMany({ where: { stageId }, select: { id: true } });
    const ids = existing.map(q => q.id);
    if (ids.length > 0) {
      await prisma.questionAttempt.deleteMany({ where: { questionId: { in: ids } } });
      await prisma.question.deleteMany({ where: { stageId } });
    }
    await prisma.question.createMany({
      data: qs.map((q, i) => ({ ...q, stageId, order: i })),
    });
  }

  console.log("Seed complete!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
