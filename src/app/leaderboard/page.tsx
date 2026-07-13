"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowLeft, IconCrown, IconStar } from "@/components/Icon";

interface Entry {
  id: string;
  nickname: string;
  classroom: string;
  totalScore: number;
  stagesCleared: number;
  isMe: boolean;
  rank: number;
}

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"class" | "all">("class");
  const [data, setData] = useState<{ leaderboard: Entry[]; myClassroom: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?scope=${scope}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [scope]);

  const rankColor = (rank: number) =>
    rank === 1 ? "#f5c518" : rank === 2 ? "#c0c7d1" : rank === 3 ? "#cd7f32" : "#64748b";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <header className="bg-slate-900/80 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Link href="/map" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <IconArrowLeft size={16} /> แผนที่
        </Link>
        <span className="font-pixel text-yellow-400 text-xs flex items-center gap-1.5">
          <IconCrown size={14} /> อันดับคะแนน
        </span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScope("class")}
            className={`flex-1 py-2 rounded-lg text-sm font-pixel transition-colors ${scope === "class" ? "bg-yellow-500/15 border-2 border-yellow-500 text-yellow-400" : "bg-white/5 border-2 border-white/10 text-slate-400"}`}
          >
            ห้องของฉัน
          </button>
          <button
            onClick={() => setScope("all")}
            className={`flex-1 py-2 rounded-lg text-sm font-pixel transition-colors ${scope === "all" ? "bg-yellow-500/15 border-2 border-yellow-500 text-yellow-400" : "bg-white/5 border-2 border-white/10 text-slate-400"}`}
          >
            ทั้งโรงเรียน
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 py-12 font-pixel text-xs">กำลังโหลด...</div>
        ) : !data || data.leaderboard.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-sm">ยังไม่มีข้อมูลคะแนน</div>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map(e => (
              <div
                key={e.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${e.isMe ? "bg-blue-500/15 border-blue-400/50" : "bg-white/5 border-white/10"}`}
              >
                <div className="w-8 text-center font-pixel text-sm flex items-center justify-center" style={{ color: rankColor(e.rank) }}>
                  {e.rank <= 3 ? <IconCrown size={20} /> : e.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {e.nickname} {e.isMe && <span className="text-blue-300 text-xs">(คุณ)</span>}
                  </div>
                  <div className="text-slate-500 text-xs">{e.classroom} · ผ่าน {e.stagesCleared} ด่าน</div>
                </div>
                <div className="flex items-center gap-1 text-yellow-400 font-pixel text-sm">
                  <IconStar size={14} /> {e.totalScore}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
