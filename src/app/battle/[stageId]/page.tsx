"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import HeroSprite from "@/components/sprites/HeroSprite";
import EnemySprite, { resolveType } from "@/components/sprites/EnemySprite";
import {
  IconHeart, IconHeartOff, IconStar, IconCheck, IconX, IconClock,
  IconTrophy, IconSkull, IconArrowLeft, IconArrowRight, IconPlay,
} from "@/components/Icon";

import { MAX_HP, TIMER_SECS, scoreForAnswer } from "@/lib/game";

interface Question {
  id: string;
  body: string;
  data: { choices: string[] };
}

interface GradeResult {
  isCorrect: boolean;
  correctAnswer: string;
  hint: string | null;
}

async function gradeAnswer(questionId: string, answer: string): Promise<GradeResult> {
  try {
    const res = await fetch("/api/game/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, answer }),
    });
    if (!res.ok) throw new Error("grade failed");
    return await res.json();
  } catch {
    return { isCorrect: false, correctAnswer: "", hint: null };
  }
}

type Phase = "loading" | "intro" | "question" | "feedback" | "win" | "dead";
type FeedbackType = "correct" | "wrong" | "timeout";

// Battle-scene backdrop themed per enemy type, so each stage feels like its own place
// instead of the same plain sky+grass for every monster.
interface SceneTheme {
  sky: string;
  ground: string;
  groundLine: string;
  Decor: () => React.ReactElement;
}

const SCENE_THEMES: Record<string, SceneTheme> = {
  // Dragon → volcano at dusk
  dragon: {
    sky: "linear-gradient(180deg, #2b0f10 0%, #5c1a12 45%, #8a2e12 52%)",
    ground: "linear-gradient(180deg, #4a2a1e 0%, #2a1712 100%)",
    groundLine: "#c94a1f",
    Decor: () => (
      <>
        <div style={{ position: "absolute", top: 6, left: "8%", width: 26, height: 40, background: "linear-gradient(180deg,#3a1a10,#1a0d08)", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
        <div style={{ position: "absolute", top: 2, left: "22%", width: 34, height: 50, background: "linear-gradient(180deg,#3a1a10,#1a0d08)", clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
        <div style={{ position: "absolute", top: 14, right: "12%", width: 5, height: 5, borderRadius: "50%", background: "#ff8a3d", boxShadow: "0 0 8px 3px rgba(255,138,61,0.8)" }} />
        <div style={{ position: "absolute", top: 26, right: "22%", width: 4, height: 4, borderRadius: "50%", background: "#ffb35a", boxShadow: "0 0 6px 2px rgba(255,179,90,0.7)" }} />
      </>
    ),
  },
  // Goblin → dark forest
  goblin: {
    sky: "linear-gradient(180deg, #16241a 0%, #223d24 48%, #2c4a2a 52%)",
    ground: "linear-gradient(180deg, #2f4020 0%, #1c2814 100%)",
    groundLine: "#4a6b2a",
    Decor: () => (
      <>
        <div style={{ position: "absolute", top: -4, left: "6%", width: 30, height: 56, background: "#16210f", clipPath: "polygon(50% 0%, 90% 40%, 70% 40%, 100% 80%, 60% 80%, 60% 100%, 40% 100%, 40% 80%, 0% 80%, 30% 40%, 10% 40%)" }} />
        <div style={{ position: "absolute", top: -6, left: "18%", width: 24, height: 46, background: "#1a2712", clipPath: "polygon(50% 0%, 90% 40%, 70% 40%, 100% 80%, 60% 80%, 60% 100%, 40% 100%, 40% 80%, 0% 80%, 30% 40%, 10% 40%)" }} />
        <div style={{ position: "absolute", top: -2, right: "8%", width: 28, height: 52, background: "#16210f", clipPath: "polygon(50% 0%, 90% 40%, 70% 40%, 100% 80%, 60% 80%, 60% 100%, 40% 100%, 40% 80%, 0% 80%, 30% 40%, 10% 40%)" }} />
      </>
    ),
  },
  // Zombie → graveyard at night
  zombie: {
    sky: "linear-gradient(180deg, #10141f 0%, #1c2436 48%, #26314a 52%)",
    ground: "linear-gradient(180deg, #3a3d40 0%, #24262a 100%)",
    groundLine: "#5a5f66",
    Decor: () => (
      <>
        <div style={{ position: "absolute", top: 4, left: "10%", width: 4, height: 4, borderRadius: "50%", background: "#dfe6f0" }} />
        <div style={{ position: "absolute", top: 16, left: "30%", width: 3, height: 3, borderRadius: "50%", background: "#dfe6f0" }} />
        <div style={{ position: "absolute", top: 9, right: "18%", width: 3, height: 3, borderRadius: "50%", background: "#dfe6f0" }} />
        <div style={{ position: "absolute", bottom: "44%", left: "12%", width: 16, height: 22, background: "#6b6f75", borderRadius: "8px 8px 2px 2px" }} />
        <div style={{ position: "absolute", bottom: "44%", left: "36%", width: 14, height: 18, background: "#5c6066", borderRadius: "7px 7px 2px 2px" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "18%", background: "linear-gradient(180deg, rgba(200,210,230,0.12), transparent)" }} />
      </>
    ),
  },
  // Skeleton king → castle throne room (indoor)
  skeleton: {
    sky: "linear-gradient(180deg, #201c28 0%, #33293a 48%, #40324a 52%)",
    ground: "linear-gradient(180deg, #4a4250 0%, #2e2833 100%)",
    groundLine: "#8a6a3a",
    Decor: () => (
      <>
        <div style={{ position: "absolute", top: 6, left: "6%", width: 6, height: 26, background: "#7a5a2a", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: 4, left: "6%", width: 10, height: 10, marginLeft: -2, borderRadius: "50%", background: "#ff9a3d", boxShadow: "0 0 10px 4px rgba(255,154,61,0.8)" }} />
        <div style={{ position: "absolute", top: 6, right: "6%", width: 6, height: 26, background: "#7a5a2a", borderRadius: 2 }} />
        <div style={{ position: "absolute", top: 4, right: "6%", width: 10, height: 10, marginRight: -2, borderRadius: "50%", background: "#ff9a3d", boxShadow: "0 0 10px 4px rgba(255,154,61,0.8)" }} />
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 40, height: 16, background: "#3a2020", borderRadius: "0 0 8px 8px" }} />
      </>
    ),
  },
  // Lizard mage → misty swamp
  lizard: {
    sky: "linear-gradient(180deg, #3a4a2a 0%, #5a6a3a 48%, #6e7c42 52%)",
    ground: "linear-gradient(180deg, #46502a 0%, #2c3318 100%)",
    groundLine: "#7a8a44",
    Decor: () => (
      <>
        <div style={{ position: "absolute", top: 10, left: "8%", width: 70, height: 16, background: "rgba(210,225,180,0.35)", borderRadius: 20 }} />
        <div style={{ position: "absolute", top: 22, left: "30%", width: 50, height: 12, background: "rgba(210,225,180,0.28)", borderRadius: 20 }} />
        <div style={{ position: "absolute", bottom: "40%", right: "10%", width: 60, height: 14, background: "rgba(210,225,180,0.3)", borderRadius: 20 }} />
      </>
    ),
  },
};

// Shown only while stageInfo hasn't loaded yet — no monster/place implied.
const NEUTRAL_THEME: SceneTheme = {
  sky: "linear-gradient(180deg, #23283a 0%, #2c3346 100%)",
  ground: "linear-gradient(180deg, #23283a 0%, #181c28 100%)",
  groundLine: "#3a4258",
  Decor: () => <></>,
};

// Wrapper forces a full remount whenever the stage changes. Next.js reuses the
// same component instance for client-side navigations within /battle/[stageId],
// so without this the old stage's sprite/background/state would flash on screen
// for a frame before the reset effect below catches up.
export default function BattlePage() {
  const { stageId } = useParams<{ stageId: string }>();
  return <BattlePageInner key={stageId} />;
}

function BattlePageInner() {
  const { stageId } = useParams<{ stageId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stageInfo, setStageInfo] = useState<{ name: string; enemyName: string; enemyEmoji: string } | null>(null);
  const [nextStageId, setNextStageId] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [feedback, setFeedback] = useState<{ type: FeedbackType; msg: string; pts?: number; correctAnswer?: string } | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [heroAnim, setHeroAnim] = useState("");
  const [enemyAnim, setEnemyAnim] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [startTime, setStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [attempts, setAttempts] = useState<any[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef(false);
  const questionsRef = useRef<Question[]>([]);
  // Guards every delayed callback (setTimeout/async continuation) below from
  // touching state after the player has navigated away mid-battle — without
  // this, a pending timer could fire onTimeout/saveSession against an
  // unmounted instance and POST a stray/duplicate session.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    stopTimer();
    setPhase("loading");
    setQIndex(0); setHp(MAX_HP); setScore(0); setCorrectCount(0);
    setAttempts([]); setTotalTime(0);
    setChosenAnswer(null); setFeedback(null);
    setHeroAnim(""); setEnemyAnim(""); lockedRef.current = false;

    Promise.all([
      fetch(`/api/game/stages/${stageId}/questions`).then(r => r.json()),
      fetch("/api/game/stages").then(r => r.json()),
    ]).then(([qs, cats]) => {
      if (!mountedRef.current) return;
      questionsRef.current = qs;
      setQuestions(qs);
      for (const c of cats) {
        const idx = c.stages.findIndex((st: any) => st.id === stageId);
        if (idx !== -1) {
          setStageInfo(c.stages[idx]);
          setNextStageId(c.stages[idx + 1]?.id ?? null);
          break;
        }
      }
      setPhase("intro");
      setTimeout(() => { if (mountedRef.current) beginQuestion(0); }, 1200);
    });

    return () => {
      mountedRef.current = false;
      stopTimer();
    };
  }, [stageId]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  function beginQuestion(idx: number) {
    lockedRef.current = false;
    setChosenAnswer(null);
    setFeedback(null);
    setQIndex(idx);
    setPhase("question");
    setTimeLeft(TIMER_SECS);
    setStartTime(Date.now());
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { stopTimer(); onTimeout(idx); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  async function onTimeout(idx: number) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setChosenAnswer("");
    const q = questionsRef.current[idx];
    const graded = q ? await gradeAnswer(q.id, "") : { isCorrect: false, correctAnswer: "", hint: null };
    if (!mountedRef.current) return;
    handleResult(idx, "", false, TIMER_SECS, "timeout", graded.correctAnswer, graded.hint);
  }

  async function handleAnswer(chosen: string, idx: number) {
    if (lockedRef.current || phase !== "question") return;
    lockedRef.current = true;
    stopTimer();
    const spent = Math.round((Date.now() - startTime) / 1000);
    const q = questionsRef.current[idx];
    if (!q) return;
    setChosenAnswer(chosen);
    const graded = await gradeAnswer(q.id, chosen);
    if (!mountedRef.current) return;
    handleResult(idx, chosen, graded.isCorrect, spent, graded.isCorrect ? "correct" : "wrong", graded.correctAnswer, graded.hint);
  }

  function handleResult(idx: number, chosen: string, isCorrect: boolean, spent: number, type: FeedbackType, correctAnswer: string, hint: string | null) {
    const q = questionsRef.current[idx];
    if (!q) return;
    setTotalTime(t => t + spent);
    const newAttempt = { questionId: q.id, answer: chosen, isCorrect, timeSpent: spent };
    const allAttempts = [...attempts, newAttempt];
    setAttempts(allAttempts);

    if (isCorrect) {
      const pts = scoreForAnswer(spent);
      setScore(s => s + pts);
      setCorrectCount(c => c + 1);
      setFeedback({ type: "correct", msg: "ถูกต้อง!", pts, correctAnswer });
      setHeroAnim("anim-hero-attack");
      setTimeout(() => { if (mountedRef.current) setEnemyAnim("anim-flash"); }, 350);
      setTimeout(() => { if (mountedRef.current) { setEnemyAnim(""); setHeroAnim(""); } }, 700);
    } else {
      const newHp = Math.max(0, hp - 1);
      setHp(newHp);
      const msg = hint ?? (correctAnswer ? `คำตอบที่ถูก: ${correctAnswer}` : "ตอบผิด");
      setFeedback({ type: type === "timeout" ? "timeout" : "wrong", msg, correctAnswer });
      setEnemyAnim("anim-enemy-attack");
      setTimeout(() => { if (mountedRef.current) setHeroAnim("anim-flash"); }, 350);
      setTimeout(() => { if (mountedRef.current) { setEnemyAnim(""); setHeroAnim(""); } }, 700);

      if (newHp <= 0) {
        setTimeout(() => { if (mountedRef.current) setHeroAnim("anim-die"); }, 900);
        setTimeout(() => { if (mountedRef.current) setPhase("dead"); saveSession(allAttempts); }, 1800);
        return;
      }
    }

    setPhase("feedback");
    const next = idx + 1;
    if (next >= questionsRef.current.length) {
      setTimeout(() => { if (mountedRef.current) setEnemyAnim("anim-die"); }, 900);
      setTimeout(() => { if (mountedRef.current) setPhase("win"); saveSession(allAttempts); }, 1800);
    } else {
      setTimeout(() => { if (mountedRef.current) beginQuestion(next); }, 1600);
    }
  }

  async function saveSession(finalAttempts: { questionId: string; answer: string; timeSpent: number }[]) {
    if (!session?.user) return;
    try {
      await fetch("/api/game/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageId,
          attempts: finalAttempts.map(a => ({ questionId: a.questionId, answer: a.answer, timeSpent: a.timeSpent })),
        }),
      });
    } catch {
      // best-effort; the run already displayed locally
    }
  }

  function restart() {
    stopTimer();
    setQIndex(0); setHp(MAX_HP); setScore(0); setCorrectCount(0);
    setAttempts([]); setTotalTime(0); setChosenAnswer(null); setFeedback(null);
    setHeroAnim(""); setEnemyAnim(""); lockedRef.current = false;
    setPhase("intro");
    setTimeout(() => { if (mountedRef.current) beginQuestion(0); }, 800);
  }

  const q = questions[qIndex];
  const hpPct = (hp / MAX_HP) * 100;
  const enemyHpPct = Math.max(0, ((questions.length - correctCount) / Math.max(questions.length, 1)) * 100);
  const timerPct = (timeLeft / TIMER_SECS) * 100;
  const isUrgent = timeLeft <= 5;

  const hpColor = hpPct > 60 ? "#48d020" : hpPct > 25 ? "#f8c020" : "#f84018";
  const enemyHpColor = enemyHpPct > 60 ? "#48d020" : enemyHpPct > 25 ? "#f8c020" : "#f84018";

  // Don't resolve a theme/sprite until stageInfo actually loads — otherwise every
  // stage would briefly flash the "lizard" fallback (resolveType("") === "lizard")
  // before the real monster/background for that stage appears.
  const theme = stageInfo ? (SCENE_THEMES[resolveType(stageInfo.enemyName)] ?? SCENE_THEMES.lizard) : NEUTRAL_THEME;

  return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "#1a1a2e", maxWidth: 560, margin: "0 auto", position: "relative" }}>

      {/* ── BATTLE SCENE ── */}
      <div style={{ position: "relative", flexShrink: 0, height: "clamp(110px, min(38vw, 34vh), 260px)", overflow: "hidden", background: theme.sky }}>

        {/* Themed backdrop decorations */}
        <theme.Decor />

        {/* Ground stripe */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48%", background: theme.ground }} />
        <div style={{ position: "absolute", bottom: "48%", left: 0, right: 0, height: 3, background: theme.groundLine }} />

        {/* Enemy platform + sprite — only once we know which monster this stage is */}
        {stageInfo && (
          <>
            <div style={{ position: "absolute", bottom: "47%", left: "62%", transform: "translateX(-50%)", width: "18%", height: 10, background: "rgba(0,0,0,0.18)", borderRadius: "50%" }} />
            <div className={enemyAnim} onAnimationEnd={() => setEnemyAnim("")}
              style={{ position: "absolute", bottom: "49%", left: "62%", transform: "translateX(-50%)", filter: phase === "dead" ? "grayscale(1)" : "none" }}>
              <EnemySprite type={stageInfo.enemyName} size={64} style={{ width: "clamp(48px,13vw,72px)", height: "clamp(48px,13vw,72px)" }} />
            </div>
          </>
        )}

        {/* Hero platform + sprite */}
        <div style={{ position: "absolute", bottom: "22%", left: "24%", transform: "translateX(-50%)", width: "16%", height: 8, background: "rgba(0,0,0,0.15)", borderRadius: "50%" }} />
        <div className={heroAnim} onAnimationEnd={() => setHeroAnim("")}
          style={{ position: "absolute", bottom: "25%", left: "24%", transform: "translateX(-50%)" }}>
          <HeroSprite flip size={56} style={{ width: "clamp(44px,11vw,64px)", height: "clamp(44px,11vw,64px)" }} />
        </div>

        {/* Enemy HP box — top left */}
        <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(240,232,195,0.97)", border: "2.5px solid #202820", borderRadius: 4, padding: "5px 8px", minWidth: "clamp(130px, 30vw, 170px)", fontFamily: "monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(8px,1.8vw,11px)", fontWeight: "bold", color: "#202820", marginBottom: 2 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{stageInfo?.enemyName ?? "..."}</span>
            <span style={{ color: "#606060", fontSize: "0.85em" }}>Lv.12</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: "clamp(7px,1.5vw,9px)", color: "#606060", fontWeight: "bold" }}>HP</span>
            <div style={{ flex: 1, height: 7, background: "#888", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: enemyHpPct + "%", background: enemyHpColor, transition: "width 0.4s, background 0.4s", borderRadius: 2 }} />
            </div>
          </div>
        </div>

        {/* Hero HP box — bottom right */}
        <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(240,232,195,0.97)", border: "2.5px solid #202820", borderRadius: 4, padding: "5px 8px", minWidth: "clamp(140px, 32vw, 180px)", fontFamily: "monospace" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "clamp(8px,1.8vw,11px)", fontWeight: "bold", color: "#202820", marginBottom: 2 }}>
            <span>นักผจญภัย</span>
            <span style={{ color: "#606060", fontSize: "0.85em" }}>Lv.7</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
            <span style={{ fontSize: "clamp(7px,1.5vw,9px)", color: "#606060", fontWeight: "bold" }}>HP</span>
            <div style={{ flex: 1, height: 7, background: "#888", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: hpPct + "%", background: hpColor, transition: "width 0.4s, background 0.4s", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: "clamp(7px,1.5vw,9px)", color: "#202820", fontWeight: "bold" }}>{hp}/{MAX_HP}</span>
          </div>
          <div style={{ display: "flex", gap: 1 }}>
            {Array.from({ length: MAX_HP }, (_, i) => i < hp
              ? <IconHeart key={i} size={12} style={{ color: "#f84018" }} />
              : <IconHeartOff key={i} size={12} style={{ color: "#b0a890" }} />
            )}
          </div>
        </div>
      </div>

      {/* ── BOTTOM PANEL ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#e8ddb5", borderTop: "3px solid #202820" }}>

        {/* LOADING */}
        {phase === "loading" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f0e8c8", fontFamily: "monospace", color: "#606060", fontSize: 13 }}>
            กำลังโหลด...
          </div>
        )}

        {/* INTRO */}
        {phase === "intro" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "16px 20px", background: "#f0e8c8", fontFamily: "monospace" }}>
            <p style={{ color: "#202820", fontSize: "clamp(11px, 2.5vw, 14px)", fontWeight: "bold", lineHeight: 1.8, display: "flex", alignItems: "center", gap: 6 }}>
              <IconPlay size={12} />
              {stageInfo && <EnemySprite type={stageInfo.enemyName} size={22} style={{ flexShrink: 0 }} />}
              {stageInfo?.enemyName} ปรากฏตัว!
            </p>
          </div>
        )}

        {/* QUESTION */}
        {(phase === "question" || phase === "feedback") && q && (
          <>
            {/* Progress + Timer bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "#ddd3a0", borderBottom: "2px solid #b8a870" }}>
              <span style={{ fontFamily: "monospace", fontSize: "clamp(9px,2vw,11px)", color: "#605020", fontWeight: "bold", whiteSpace: "nowrap" }}>
                ข้อ {qIndex + 1}/{questions.length}
              </span>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 5, flex: 1, justifyContent: "center" }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: "clamp(8px,2vw,12px)", height: "clamp(8px,2vw,12px)", borderRadius: "50%",
                    background: i < qIndex ? "#48d020" : i === qIndex ? "#f8c020" : "#888",
                    border: i === qIndex ? "2px solid #202820" : "2px solid transparent",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              {/* Score */}
              <span style={{ fontFamily: "monospace", fontSize: "clamp(9px,2vw,11px)", color: "#c07800", fontWeight: "bold", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
                <IconStar size={13} /> {score}
              </span>
              {/* Timer circle */}
              <div style={{ position: "relative", width: "clamp(28px,6vw,36px)", height: "clamp(28px,6vw,36px)", flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#aaa" strokeWidth="3" />
                  <circle cx="18" cy="18" r="14" fill="none"
                    stroke={isUrgent ? "#f84018" : "#4090d0"}
                    strokeWidth="3"
                    strokeDasharray="87.96"
                    strokeDashoffset={87.96 * (1 - timerPct / 100)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: "clamp(8px,1.8vw,10px)", fontWeight: "bold", color: isUrgent ? "#f84018" : "#202820" }}>
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Question text */}
            <div style={{ padding: "14px 18px 10px", background: "#f0e8c8", borderBottom: "1.5px solid #c8b878" }}>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(13px, 3.5vw, 18px)", fontWeight: "bold", color: "#101010", textAlign: "center", lineHeight: 1.6 }}>
                {q.body}
              </p>
            </div>

            {/* Feedback banner */}
            {phase === "feedback" && feedback && (
              <div style={{
                padding: "8px 18px",
                background: feedback.type === "correct" ? "#d0f0c0" : "#f8d0c0",
                borderBottom: "2px solid " + (feedback.type === "correct" ? "#48a020" : "#c84018"),
                fontFamily: "monospace",
                fontSize: "clamp(10px, 2.2vw, 12px)",
                color: feedback.type === "correct" ? "#186010" : "#801008",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span style={{ display: "inline-flex" }}>{feedback.type === "correct" ? <IconCheck size={15} /> : feedback.type === "timeout" ? <IconClock size={15} /> : <IconX size={15} />}</span>
                <span style={{ flex: 1 }}>{feedback.msg}</span>
                {feedback.pts && <span style={{ color: "#2a7010" }}>+{feedback.pts}pt</span>}
              </div>
            )}

            {/* Choices */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {q.data.choices.map((c, i) => {
                const isChosen = chosenAnswer === c;
                const isCorrectChoice = phase === "feedback" && !!feedback?.correctAnswer && c === feedback.correctAnswer;
                let bg = "#f0e8c8";
                let border = "#909090";
                let color = "#202820";
                if (phase === "feedback") {
                  if (isCorrectChoice) { bg = "#c8f0b0"; border = "#48a020"; color = "#186010"; }
                  else if (isChosen && !isCorrectChoice) { bg = "#f8c8c0"; border = "#c84018"; color = "#801008"; }
                  else { bg = "#e0d8b8"; color = "#888"; }
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(c, qIndex)}
                    disabled={phase === "feedback"}
                    style={{
                      background: bg,
                      border: "none",
                      borderTop: i < 2 ? "none" : "2px solid #b8a870",
                      borderRight: i % 2 === 0 ? "2px solid #b8a870" : "none",
                      borderLeft: "none",
                      borderBottom: "none",
                      outline: "3px solid " + (phase === "feedback" && (isCorrectChoice || isChosen) ? border : "transparent"),
                      outlineOffset: -3,
                      padding: "clamp(10px, 2.5vw, 18px) clamp(8px, 2vw, 16px)",
                      fontFamily: "monospace",
                      fontSize: "clamp(12px, 3vw, 15px)",
                      fontWeight: "bold",
                      color,
                      cursor: phase === "feedback" ? "default" : "pointer",
                      textAlign: "center",
                      transition: "background 0.15s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onMouseEnter={e => { if (phase === "question") (e.currentTarget as HTMLButtonElement).style.background = "#e0d498"; }}
                    onMouseLeave={e => { if (phase === "question") (e.currentTarget as HTMLButtonElement).style.background = "#f0e8c8"; }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* WIN */}
        {phase === "win" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 20, background: "#f0e8c8" }}>
              <div style={{ color: "#e0a020", display: "flex" }}><IconTrophy size={36} /></div>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(12px,2.8vw,16px)", fontWeight: "bold", color: "#186010" }}>ชนะแล้ว!</p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(10px,2.2vw,13px)", color: "#405020" }}>
                ตอบถูก {correctCount}/{questions.length} ข้อ · {score} คะแนน
              </p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(9px,2vw,11px)", color: "#808060" }}>
                HP เหลือ {hp}/{MAX_HP} · Accuracy {Math.round(correctCount / questions.length * 100)}%
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: nextStageId ? "1fr 1fr 1fr" : "1fr 1fr", borderTop: "2.5px solid #202820" }}>
              <button onClick={() => router.push("/map")}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", borderRight: "2px solid #202820", cursor: "pointer", color: "#404040", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconArrowLeft size={15} /> แผนที่
              </button>
              <button onClick={restart}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", borderRight: nextStageId ? "2px solid #202820" : "none", cursor: "pointer", color: "#186010", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconPlay size={13} /> เล่นอีกครั้ง
              </button>
              {nextStageId && (
                <button onClick={() => router.push(`/battle/${nextStageId}`)}
                  style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#f5a623", border: "none", cursor: "pointer", color: "#1a1a2e", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  ด่านถัดไป <IconArrowRight size={15} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* DEAD */}
        {phase === "dead" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 20, background: "#f0e8c8" }}>
              <div style={{ color: "#801008", display: "flex" }}><IconSkull size={36} /></div>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(12px,2.8vw,16px)", fontWeight: "bold", color: "#801008" }}>หมดพลังชีวิต!</p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(10px,2.2vw,13px)", color: "#806040" }}>
                ตอบถูก {correctCount}/{questions.length} ข้อ · {score} คะแนน
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2.5px solid #202820" }}>
              <button onClick={() => router.push("/map")}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", borderRight: "2px solid #202820", cursor: "pointer", color: "#404040", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconArrowLeft size={15} /> แผนที่
              </button>
              <button onClick={restart}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", cursor: "pointer", color: "#801008", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconPlay size={13} /> ลองใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
