"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Stage {
  id: string;
  name: string;
  order: number;
  enemyName: string;
  enemyEmoji: string;
  _count: { questions: number };
}
interface Category {
  id: string;
  name: string;
  mode: string;
  stages: Stage[];
}

const STAGE_ICONS = ["🏕️", "🌲", "🏔️", "🏯", "🐲", "⚡", "🔮", "👑"];
const BG = "linear-gradient(160deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)";

export default function MapPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMode, setActiveMode] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/game/stages")
      .then(r => r.json())
      .then(data => { setCategories(data); setLoading(false); });
  }, []);

  const cat = categories[activeMode];

  return (
    <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
        <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(9px,2.5vw,13px)", color: "#f5a623", letterSpacing: 1 }}>⚔ Math Quest</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#94a3b8", fontSize: "clamp(11px,2.5vw,14px)" }}>👤 {session?.user?.name}</span>
          <Link href="/stats" style={{ color: "#60a5fa", fontSize: "clamp(11px,2.5vw,13px)", textDecoration: "none" }}>📊</Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ color: "#64748b", fontSize: "clamp(11px,2.5vw,13px)", background: "none", border: "none", cursor: "pointer" }}>ออก</button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "20px 16px 32px" }}>
        {/* Hero banner */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "clamp(40px,10vw,60px)", marginBottom: 8 }}>🗺️</div>
          <h1 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(12px,3vw,18px)", color: "#f5a623", marginBottom: 4 }}>เลือกด่าน</h1>
          <p style={{ color: "#64748b", fontSize: "clamp(11px,2.5vw,13px)" }}>เลือกโหมดและด่านที่ต้องการเล่น</p>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {categories.map((c, i) => (
            <button key={c.id} onClick={() => setActiveMode(i)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: "clamp(10px,2.5vw,13px)",
                fontFamily: "var(--font-pixel), monospace", cursor: "pointer", transition: "all 0.2s",
                background: i === activeMode ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)",
                border: i === activeMode ? "2px solid #f5a623" : "2px solid rgba(255,255,255,0.1)",
                color: i === activeMode ? "#f5a623" : "#64748b",
              }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Stage list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: 48, fontFamily: "var(--font-pixel), monospace", fontSize: 11 }}>กำลังโหลด...</div>
        ) : !cat ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: 48, fontSize: 14 }}>ยังไม่มีเนื้อหา</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cat.stages.map((stage, idx) => (
              <button key={stage.id} onClick={() => router.push(`/battle/${stage.id}`)}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(96,165,250,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(96,165,250,0.4)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {/* Stage icon */}
                <div style={{ width: "clamp(44px,10vw,56px)", height: "clamp(44px,10vw,56px)", background: "rgba(255,255,255,0.07)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(22px,5vw,30px)", flexShrink: 0 }}>
                  {STAGE_ICONS[idx] ?? "⚔️"}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(9px,2.2vw,12px)", color: "#e2e8f0", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    ด่าน {idx + 1}: {stage.name}
                  </div>
                  <div style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "#94a3b8" }}>
                    {stage.enemyEmoji} {stage.enemyName}
                  </div>
                  <div style={{ fontSize: "clamp(10px,2.2vw,12px)", color: "#475569", marginTop: 2 }}>
                    {stage._count.questions} คำถาม
                  </div>
                </div>
                <div style={{ color: "#60a5fa", fontSize: "clamp(16px,4vw,22px)", flexShrink: 0 }}>▶</div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
