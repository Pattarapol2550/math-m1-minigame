"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconSword, IconPlay } from "@/components/Icon";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { username, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "linear-gradient(160deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 12, color: "#f5a623", display: "flex", justifyContent: "center" }}><IconSword size={56} /></div>
          <h1 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(14px,4vw,20px)", color: "#f5a623", marginBottom: 6 }}>
            Math Quest
          </h1>
          <p style={{ color: "#64748b", fontSize: "clamp(12px,3vw,14px)" }}>เกมคณิตศาสตร์ผจญภัย</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "clamp(20px,5vw,32px)", backdropFilter: "blur(12px)" }}>
          <h2 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(10px,2.5vw,12px)", color: "#e2e8f0", textAlign: "center", marginBottom: 24 }}>
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={onSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "clamp(11px,2.5vw,13px)", marginBottom: 6 }}>เลขประจำตัวนักเรียน</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="เลขประจำตัวนักเรียน"
                required
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: "clamp(13px,3vw,15px)", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#60a5fa")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "clamp(11px,2.5vw,13px)", marginBottom: 6 }}>รหัสผ่าน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                required
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: "12px 14px", color: "#e2e8f0", fontSize: "clamp(13px,3vw,15px)", outline: "none", boxSizing: "border-box" }}
                onFocus={e => (e.target.style.borderColor = "#60a5fa")}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.15)")}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(248,65,24,0.15)", border: "1px solid rgba(248,65,24,0.4)", borderRadius: 8, padding: "10px 12px", marginBottom: 16, color: "#fca5a5", fontSize: "clamp(11px,2.5vw,13px)", textAlign: "center" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: loading ? "#7a6010" : "#f5a623", color: "#1a1a2e",
                border: "none", borderRadius: 10, padding: "14px", fontFamily: "var(--font-pixel), monospace",
                fontSize: "clamp(10px,2.5vw,12px)", cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><IconPlay size={12} /> เริ่มผจญภัย</span>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "#334155", fontSize: "clamp(10px,2.2vw,12px)", marginTop: 8 }}>
          ยังไม่มีบัญชี? <Link href="/register" style={{ color: "#60a5fa" }}>ลงทะเบียน</Link>
        </p>
        <p style={{ textAlign: "center", color: "#334155", fontSize: "clamp(9px,2vw,11px)", marginTop: 6 }}>
          <Link href="/privacy" style={{ color: "#475569" }}>นโยบายความเป็นส่วนตัว</Link>
        </p>
      </div>
    </div>
  );
}
