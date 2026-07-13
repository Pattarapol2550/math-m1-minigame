"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import HeroSprite from "@/components/sprites/HeroSprite";
import EnemySprite from "@/components/sprites/EnemySprite";

const MAX_HP = 5;
const TIMER_SECS = 100;

interface Question {
  id: string;
  body: string;
  data: { choices: string[]; answer: string; hint?: string };
}

type Phase = "loading" | "intro" | "question" | "feedback" | "win" | "dead";
type FeedbackType = "correct" | "wrong" | "timeout";

export default function BattlePage() {
  const { stageId } = useParams<{ stageId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stageInfo, setStageInfo] = useState<{ name: string; enemyName: string; enemyEmoji: string } | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [feedback, setFeedback] = useState<{ type: FeedbackType; msg: string; pts?: number } | null>(null);
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [heroAnim, setHeroAnim] = useState("");
  const [enemyAnim, setEnemyAnim] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECS);
  const [startTime, setStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [savedScore, setSavedScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef = useRef(false);
  const questionsRef = useRef<Question[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/game/stages/${stageId}/questions`).then(r => r.json()),
      fetch("/api/game/stages").then(r => r.json()),
    ]).then(([qs, cats]) => {
      questionsRef.current = qs;
      setQuestions(qs);
      for (const c of cats) {
        const s = c.stages.find((st: any) => st.id === stageId);
        if (s) { setStageInfo(s); break; }
      }
      setPhase("intro");
      setTimeout(() => beginQuestion(0), 1200);
    });
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

  function onTimeout(idx: number) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setChosenAnswer("");
    handleResult(idx, "", false, TIMER_SECS, "timeout");
  }

  function handleAnswer(chosen: string, idx: number) {
    if (lockedRef.current || phase !== "question") return;
    lockedRef.current = true;
    stopTimer();
    const spent = Math.round((Date.now() - startTime) / 1000);
    const q = questionsRef.current[idx];
    if (!q) return;
    const isCorrect = chosen === q.data.answer;
    setChosenAnswer(chosen);
    handleResult(idx, chosen, isCorrect, spent, isCorrect ? "correct" : "wrong");
  }

  function handleResult(idx: number, chosen: string, isCorrect: boolean, spent: number, type: FeedbackType) {
    const q = questionsRef.current[idx];
    if (!q) return;
    setTotalTime(t => t + spent);
    setAttempts(prev => [...prev, { questionId: q.id, answer: chosen, isCorrect, timeSpent: spent }]);

    if (isCorrect) {
      const pts = Math.max(10, 30 - spent * 2);
      setScore(s => { setSavedScore(s + pts); return s + pts; });
      setCorrectCount(c => c + 1);
      setFeedback({ type: "correct", msg: "ถูกต้อง!", pts });
      setHeroAnim("anim-hero-attack");
      setTimeout(() => { setEnemyAnim("anim-flash"); }, 350);
      setTimeout(() => { setEnemyAnim(""); setHeroAnim(""); }, 700);
    } else {
      const newHp = Math.max(0, hp - 1);
      setHp(newHp);
      const hint = q.data.hint ?? `คำตอบที่ถูก: ${q.data.answer}`;
      setFeedback({ type: type === "timeout" ? "timeout" : "wrong", msg: hint });
      setEnemyAnim("anim-enemy-attack");
      setTimeout(() => { setHeroAnim("anim-flash"); }, 350);
      setTimeout(() => { setEnemyAnim(""); setHeroAnim(""); }, 700);

      if (newHp <= 0) {
        setTimeout(() => { setHeroAnim("anim-die"); }, 900);
        setTimeout(() => { setPhase("dead"); saveSession(false, attempts, 0); }, 1800);
        return;
      }
    }

    setPhase("feedback");
    const next = idx + 1;
    if (next >= questionsRef.current.length) {
      setTimeout(() => { setEnemyAnim("anim-die"); }, 900);
      setTimeout(() => {
        setPhase("win");
        saveSession(true, [...attempts, { questionId: q.id, answer: chosen, isCorrect, timeSpent: spent }],
          isCorrect ? Math.max(10, 30 - spent * 2) : 0);
      }, 1800);
    } else {
      setTimeout(() => beginQuestion(next), 1600);
    }
  }

  async function saveSession(passed: boolean, finalAttempts: any[], lastPts: number) {
    if (!session?.user) return;
    const finalScore = passed ? savedScore : score;
    await fetch("/api/game/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stageId, score: finalScore,
        correct: correctCount + (passed && finalAttempts.at(-1)?.isCorrect ? 1 : 0),
        total: questions.length, hpLeft: passed ? hp : 0,
        passed, timeSpent: totalTime, attempts: finalAttempts,
      }),
    });
  }

  function restart() {
    stopTimer();
    setQIndex(0); setHp(MAX_HP); setScore(0); setCorrectCount(0);
    setAttempts([]); setTotalTime(0); setChosenAnswer(null); setFeedback(null);
    setHeroAnim(""); setEnemyAnim(""); lockedRef.current = false;
    setPhase("intro");
    setTimeout(() => beginQuestion(0), 800);
  }

  const q = questions[qIndex];
  const hpPct = (hp / MAX_HP) * 100;
  const enemyHpPct = Math.max(0, ((questions.length - correctCount) / Math.max(questions.length, 1)) * 100);
  const timerPct = (timeLeft / TIMER_SECS) * 100;
  const isUrgent = timeLeft <= 5;

  const hpColor = hpPct > 60 ? "#48d020" : hpPct > 25 ? "#f8c020" : "#f84018";
  const enemyHpColor = enemyHpPct > 60 ? "#48d020" : enemyHpPct > 25 ? "#f8c020" : "#f84018";

  return (
    <div style={{ minHeight: "100svh", display: "flex", flexDirection: "column", background: "#1a1a2e", maxWidth: 560, margin: "0 auto", position: "relative" }}>

      {/* ── BATTLE SCENE ── */}
      <div style={{ position: "relative", flexShrink: 0, height: "clamp(180px, 38vw, 260px)", overflow: "hidden", background: "linear-gradient(180deg, #5bb8f5 0%, #78c8f8 52%, #88d048 52%, #68b030 100%)" }}>

        {/* Clouds */}
        <div style={{ position: "absolute", top: 10, left: "10%", width: 60, height: 20, background: "rgba(255,255,255,0.7)", borderRadius: 20 }} />
        <div style={{ position: "absolute", top: 18, left: "15%", width: 80, height: 24, background: "rgba(255,255,255,0.6)", borderRadius: 20 }} />
        <div style={{ position: "absolute", top: 8, right: "20%", width: 50, height: 18, background: "rgba(255,255,255,0.7)", borderRadius: 20 }} />

        {/* Ground stripe */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "48%", background: "linear-gradient(180deg, #a8e060 0%, #78b830 100%)" }} />
        <div style={{ position: "absolute", bottom: "48%", left: 0, right: 0, height: 3, background: "#5a9020" }} />

        {/* Enemy platform + sprite */}
        <div style={{ position: "absolute", bottom: "47%", left: "62%", transform: "translateX(-50%)", width: "18%", height: 10, background: "rgba(0,0,0,0.18)", borderRadius: "50%" }} />
        <div className={enemyAnim} onAnimationEnd={() => setEnemyAnim("")}
          style={{ position: "absolute", bottom: "49%", left: "62%", transform: "translateX(-50%)", filter: phase === "dead" ? "grayscale(1)" : "none" }}>
          <EnemySprite type={stageInfo?.enemyName ?? ""} size={64} style={{ width: "clamp(48px,13vw,72px)", height: "clamp(48px,13vw,72px)" }} />
        </div>

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
          <div style={{ fontSize: "clamp(8px,1.8vw,11px)", letterSpacing: 1 }}>
            {Array.from({ length: MAX_HP }, (_, i) => i < hp ? "❤️" : "🖤").join("")}
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
            <p style={{ color: "#202820", fontSize: "clamp(11px, 2.5vw, 14px)", fontWeight: "bold", lineHeight: 1.8 }}>
              ▶ {stageInfo?.enemyEmoji} {stageInfo?.enemyName} ปรากฏตัว!
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
              <span style={{ fontFamily: "monospace", fontSize: "clamp(9px,2vw,11px)", color: "#c07800", fontWeight: "bold", whiteSpace: "nowrap" }}>
                ⭐ {score}
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
                <span>{feedback.type === "correct" ? "✓" : feedback.type === "timeout" ? "⏰" : "✗"}</span>
                <span style={{ flex: 1 }}>{feedback.msg}</span>
                {feedback.pts && <span style={{ color: "#2a7010" }}>+{feedback.pts}pt</span>}
              </div>
            )}

            {/* Choices */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              {q.data.choices.map((c, i) => {
                const isChosen = chosenAnswer === c;
                const isCorrectChoice = c === q.data.answer;
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
              <div style={{ fontSize: "clamp(24px,6vw,36px)" }}>🎉</div>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(12px,2.8vw,16px)", fontWeight: "bold", color: "#186010" }}>ชนะแล้ว!</p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(10px,2.2vw,13px)", color: "#405020" }}>
                ตอบถูก {correctCount}/{questions.length} ข้อ · {score} คะแนน
              </p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(9px,2vw,11px)", color: "#808060" }}>
                HP เหลือ {hp}/{MAX_HP} · Accuracy {Math.round(correctCount / questions.length * 100)}%
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2.5px solid #202820" }}>
              <button onClick={() => router.push("/map")}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", borderRight: "2px solid #202820", cursor: "pointer", color: "#404040" }}>
                ← แผนที่
              </button>
              <button onClick={restart}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", cursor: "pointer", color: "#186010" }}>
                ► เล่นอีกครั้ง
              </button>
            </div>
          </div>
        )}

        {/* DEAD */}
        {phase === "dead" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 20, background: "#f0e8c8" }}>
              <div style={{ fontSize: "clamp(24px,6vw,36px)" }}>💀</div>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(12px,2.8vw,16px)", fontWeight: "bold", color: "#801008" }}>หมดพลังชีวิต!</p>
              <p style={{ fontFamily: "monospace", fontSize: "clamp(10px,2.2vw,13px)", color: "#806040" }}>
                ตอบถูก {correctCount}/{questions.length} ข้อ · {score} คะแนน
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2.5px solid #202820" }}>
              <button onClick={() => router.push("/map")}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", borderRight: "2px solid #202820", cursor: "pointer", color: "#404040" }}>
                ← แผนที่
              </button>
              <button onClick={restart}
                style={{ padding: "clamp(12px,3vw,18px)", fontFamily: "monospace", fontSize: "clamp(11px,2.5vw,14px)", fontWeight: "bold", background: "#e8e0b8", border: "none", cursor: "pointer", color: "#801008" }}>
                ► ลองใหม่
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
