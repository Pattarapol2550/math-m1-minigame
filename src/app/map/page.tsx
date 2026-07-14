"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EnemySprite, { resolveType } from "@/components/sprites/EnemySprite";
import {
  IconSword, IconUser, IconChart, IconTreasureMap, IconPlay, IconSettings, IconCrown, IconMessage,
  IconFlame, IconTree, IconSkull, IconGem,
} from "@/components/Icon";

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

// Icon + accent color per monster type, matching the battle-scene themes —
// so a stage's card actually hints at what's waiting inside instead of
// cycling through unrelated icons in one flat color.
const STAGE_ICON_THEME: Record<string, { Icon: typeof IconFlame; color: string }> = {
  dragon: { Icon: IconFlame, color: "#ff7a45" },
  goblin: { Icon: IconTree, color: "#4ade80" },
  zombie: { Icon: IconSkull, color: "#a3e635" },
  skeleton: { Icon: IconCrown, color: "#fbbf24" },
  lizard: { Icon: IconGem, color: "#22d3ee" },
};

const BG = "linear-gradient(160deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)";

export default function MapPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeMode, setActiveMode] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch("/api/game/stages")
      .then(r => r.json())
      .then(data => { setCategories(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setLoadError(true); setLoading(false); });
  }, []);

  const cat = categories[activeMode];

  return (
    <div style={{ minHeight: "100svh", background: BG, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 8, position: "sticky", top: 0, zIndex: 20 }}>
        <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(9px,2.5vw,13px)", color: "#f5a623", letterSpacing: 1, display: "inline-flex", alignItems: "center", gap: 6 }}><IconSword size={16} /> Math Quest</span>
        <span style={{ color: "#c3ccdb", fontSize: "clamp(11px,2.5vw,14px)", display: "inline-flex", alignItems: "center", gap: 5 }}><IconUser size={15} /> {session?.user?.name}</span>
        <nav style={{ display: "flex", alignItems: "center", gap: "clamp(10px,2.5vw,16px)", flexWrap: "wrap", width: "100%", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
          <Link href="/leaderboard" style={{ color: "#f5c518", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", fontSize: "clamp(10px,2.3vw,12px)" }}><IconCrown size={16} /> อันดับ</Link>
          <Link href="/stats" style={{ color: "#60a5fa", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", fontSize: "clamp(10px,2.3vw,12px)" }}><IconChart size={16} /> สถิติ</Link>
          <Link href="/feedback" style={{ color: "#a78bfa", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", fontSize: "clamp(10px,2.3vw,12px)" }}><IconMessage size={16} /> แจ้งปัญหา</Link>
          <Link href="/settings" style={{ color: "#a3b0c2", display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none", fontSize: "clamp(10px,2.3vw,12px)" }}><IconSettings size={16} /> ตั้งค่า</Link>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ color: "#a3b0c2", fontSize: "clamp(10px,2.3vw,12px)", background: "none", border: "none", cursor: "pointer" }}>ออกจากระบบ</button>
        </nav>
      </header>

      <main style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "20px 16px 32px" }}>
        {/* Hero banner */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 8, color: "#f5a623", display: "flex", justifyContent: "center" }}><IconTreasureMap size={64} /></div>
          <h1 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(12px,3vw,18px)", color: "#f5a623", marginBottom: 4 }}>เลือกด่าน</h1>
          <p style={{ color: "#a3b0c2", fontSize: "clamp(11px,2.5vw,13px)" }}>เลือกโหมดและด่านที่ต้องการเล่น</p>
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
                color: i === activeMode ? "#f5a623" : "#a3b0c2",
              }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Stage list */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#a3b0c2", padding: 48, fontFamily: "var(--font-pixel), monospace", fontSize: 11 }}>กำลังโหลด...</div>
        ) : loadError ? (
          <div style={{ textAlign: "center", color: "#f87171", padding: 48, fontSize: 14 }}>โหลดข้อมูลไม่สำเร็จ กรุณารีเฟรชหน้า</div>
        ) : !cat ? (
          <div style={{ textAlign: "center", color: "#a3b0c2", padding: 48, fontSize: 14 }}>ยังไม่มีเนื้อหา</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cat.stages.map((stage, idx) => {
              const theme = STAGE_ICON_THEME[resolveType(stage.enemyName)] ?? STAGE_ICON_THEME.lizard;
              return (
              <button key={stage.id} onClick={() => router.push(`/battle/${stage.id}`)}
                aria-label={`ด่าน ${idx + 1}: ${stage.name}`}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.1)",
                  borderLeft: `3px solid ${theme.color}`,
                  borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", textAlign: "left", transition: "all 0.18s", position: "relative",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${theme.color}1f`; (e.currentTarget as HTMLButtonElement).style.borderColor = `${theme.color}80`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                {/* Stage icon */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: "clamp(44px,10vw,56px)", height: "clamp(44px,10vw,56px)", background: `${theme.color}22`, border: `1.5px solid ${theme.color}55`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: theme.color }}>
                    <theme.Icon size={26} />
                  </div>
                  <div style={{ position: "absolute", top: -6, left: -6, width: 20, height: 20, borderRadius: "50%", background: "#1a1a2e", border: `1.5px solid ${theme.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-pixel), monospace", fontSize: 9, color: theme.color }}>
                    {idx + 1}
                  </div>
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(9px,2.2vw,12px)", color: "#e2e8f0", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: "clamp(11px,2.5vw,13px)", color: "#c3ccdb", display: "flex", alignItems: "center", gap: 6 }}>
                    <EnemySprite type={stage.enemyName} size={20} style={{ flexShrink: 0 }} /> {stage.enemyName}
                  </div>
                  <div style={{ fontSize: "clamp(10px,2.2vw,12px)", color: "#8a97ab", marginTop: 2 }}>
                    {stage._count.questions} คำถาม
                  </div>
                </div>
                <div style={{ color: theme.color, flexShrink: 0, display: "flex" }}><IconPlay size={18} /></div>
              </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
