"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconEdit } from "@/components/Icon";

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1.5px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#e2e8f0",
  fontSize: "clamp(13px,3vw,15px)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "clamp(11px,2.5vw,13px)",
  marginBottom: 6,
};

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState("1");
  const [room, setRoom] = useState("");
  const [number, setNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const roomNum = Number(room);
    if (!Number.isInteger(roomNum) || roomNum < 1 || roomNum > 16) {
      setError("ห้องต้องเป็นตัวเลข 1-16");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        nickname,
        grade,
        room,
        number,
        studentId,
        password,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "ลงทะเบียนไม่สำเร็จ");
      return;
    }

    router.push("/login");
  }

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "linear-gradient(160deg, #0f0c29 0%, #1a1a4e 40%, #24243e 100%)" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ marginBottom: 12, color: "#f5a623", display: "flex", justifyContent: "center" }}><IconEdit size={56} /></div>
          <h1 style={{ fontFamily: "var(--font-pixel), monospace", fontSize: "clamp(14px,4vw,20px)", color: "#f5a623", marginBottom: 6 }}>
            Math Quest
          </h1>
          <p style={{ color: "#64748b", fontSize: "clamp(12px,3vw,14px)" }}>ลงทะเบียนนักเรียน</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "clamp(20px,5vw,32px)", backdropFilter: "blur(12px)" }}>
          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>ชื่อ</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>นามสกุล</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>ชื่อเล่น</label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>ชั้น</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} required style={{ ...inputStyle, padding: "12px 8px" }}>
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <option key={g} value={g}>ม.{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>ห้อง</label>
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={room}
                  onChange={e => setRoom(e.target.value)}
                  placeholder="1-16"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>เลขที่</label>
                <input
                  type="number"
                  min={1}
                  value={number}
                  onChange={e => setNumber(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>รหัสประจำตัวนักเรียน</label>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} required style={inputStyle} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>รหัสผ่าน</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ยืนยันรหัสผ่าน</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={inputStyle} />
              </div>
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
              {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", color: "#334155", fontSize: "clamp(10px,2.2vw,12px)", marginTop: 20 }}>
          มีบัญชีแล้ว? <Link href="/login" style={{ color: "#60a5fa" }}>เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
