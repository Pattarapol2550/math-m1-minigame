"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconStar, IconTarget, IconCheck, IconX, IconClock } from "@/components/Icon";

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
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/student/stats")
      .then(r => r.json())
      .then(d => { if (d && !d.error) setStats(d); else setError(true); })
      .catch(() => setError(true));
  }, []);

  function fmt(sec: number) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? `${m} นาที ${s} วินาที` : `${s} วินาที`;
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <header className="bg-slate-900/80 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Link href="/map" className="flex items-center gap-1 text-slate-300 hover:text-white text-sm"><IconArrowLeft size={16} /> แผนที่</Link>
        <span className="font-pixel text-yellow-400 text-xs">สถิติของฉัน</span>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {error ? (
          <div className="text-center text-red-400 py-12 text-sm">โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า</div>
        ) : !stats ? (
          <div className="text-center text-slate-300 py-12 font-pixel text-xs">กำลังโหลด...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "คะแนนรวม", value: stats.totalScore, icon: <IconStar size={24} className="text-yellow-400" /> },
                { label: "Accuracy", value: stats.accuracy + "%", icon: <IconTarget size={24} className="text-blue-400" /> },
                { label: "ตอบถูก", value: `${stats.totalCorrect}/${stats.totalQuestions}`, icon: <IconCheck size={24} className="text-green-400" /> },
                { label: "เวลาทั้งหมด", value: fmt(stats.totalTime), icon: <IconClock size={24} className="text-purple-400" /> },
              ].map(card => (
                <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                  <div className="mb-2">{card.icon}</div>
                  <div className="font-pixel text-yellow-400 text-sm">{card.value}</div>
                  <div className="text-slate-300 text-xs mt-1">{card.label}</div>
                </div>
              ))}
            </div>
            <h2 className="font-pixel text-slate-300 text-xs mb-3">เล่นล่าสุด</h2>
            <div className="space-y-2">
              {stats.recent.length === 0 && <p className="text-slate-300 text-sm text-center py-4">ยังไม่มีประวัติการเล่น</p>}
              {stats.recent.map((s: any) => (
                <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-white text-sm font-bold">{s.stage?.category?.name} — {s.stage?.name}</div>
                    <div className="text-slate-300 text-xs flex items-center gap-1">ตอบถูก {s.correct}/{s.total} · {s.passed
                      ? <span className="inline-flex items-center gap-0.5 text-green-400"><IconCheck size={12} /> ผ่าน</span>
                      : <span className="inline-flex items-center gap-0.5 text-red-400"><IconX size={12} /> ไม่ผ่าน</span>}</div>
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
