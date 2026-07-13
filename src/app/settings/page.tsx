"use client";
import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { IconArrowLeft, IconKey, IconCheck, IconUser } from "@/components/Icon";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone(false);

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/student/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setLoading(false);

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      return;
    }

    setDone(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" }}>
      <header className="bg-slate-900/80 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
        <Link href="/map" className="flex items-center gap-1 text-slate-400 hover:text-white text-sm">
          <IconArrowLeft size={16} /> แผนที่
        </Link>
        <span className="font-pixel text-yellow-400 text-xs">ตั้งค่า</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
            <IconUser size={20} />
          </div>
          <div>
            <div className="text-white text-sm font-medium">{session?.user?.name}</div>
            <div className="text-slate-500 text-xs">บัญชีของฉัน</div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconKey size={16} className="text-blue-400" />
            <h2 className="text-white text-sm font-medium">เปลี่ยนรหัสผ่าน</h2>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">รหัสผ่านใหม่</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs mb-1.5">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-xs rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {done && (
              <div className="bg-green-900/30 border border-green-700/50 text-green-300 text-xs rounded-lg px-3 py-2 flex items-center gap-1.5">
                <IconCheck size={14} /> เปลี่ยนรหัสผ่านสำเร็จ
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl transition-colors"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
