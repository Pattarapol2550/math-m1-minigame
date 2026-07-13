"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  totalScore: number;
  totalCorrect: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: number;
  recent: any[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/student/stats").then(r => r.json()).then(setStats);
  }, []);

  function fmt(sec: number) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m} นาที ${s} วินาที` : `${s} วินาที`;
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <header className="bg-slate-900/80 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Link href="/map" className="text-slate-400 hover:text-white text-sm">← แผนที่</Link>
        <span className="font-pixel text-yellow-400 text-xs">สถิติของฉัน</span>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {!stats ? (
          <div className="text-center text-slate-400 py-12 font-pixel text-xs">กำลังโหลด...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "คะแนนรวม", value: stats.totalScore, icon: "⭐" },
                { label: "Accuracy", value: stats.accuracy + "%", icon: "🎯" },
                { label: "ตอบถูก", value: `${stats.totalCorrect}/${stats.totalQuestions}`, icon: "✅" },
                { label: "เวลาทั้งหมด", value: fmt(stats.totalTime), icon: "⏱️" },
              ].map(card => (
                <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="font-pixel text-yellow-400 text-sm">{card.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{card.label}</div>
                </div>
              ))}
            </div>
            <h2 className="font-pixel text-slate-400 text-xs mb-3">เล่นล่าสุด</h2>
            <div className="space-y-2">
              {stats.recent.length === 0 && <p className="text-slate-500 text-sm text-center py-4">ยังไม่มีประวัติการเล่น</p>}
              {stats.recent.map((s: any) => (
                <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-bold">{s.stage?.category?.name} — {s.stage?.name}</div>
                    <div className="text-slate-400 text-xs">ตอบถูก {s.correct}/{s.total} · {s.passed ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}</div>
                  </div>
                  <div className="font-pixel text-yellow-400 text-xs">{s.score} pt</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
