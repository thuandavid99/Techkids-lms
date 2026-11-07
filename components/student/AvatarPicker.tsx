"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, DS_AVATAR } from "@/components/ui/Misc";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { doiAvatar } from "@/lib/actions/hs";

/** Đổi ảnh đại diện: chọn trong bộ avatar mẫu (không tải ảnh lên để bảo vệ quyền riêng tư) */
export function AvatarPicker({ name, avatar }: { name: string; avatar: string }) {
  const [chon, setChon] = useState(avatar);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar name={name} avatar={chon} size={128} />
      <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Chọn ảnh đại diện">
        {DS_AVATAR.map((a) => (
          <button key={a} role="radio" aria-checked={chon === a} onClick={() => setChon(a)}
            className={`rounded-full p-0.5 ${chon === a ? "ring-4 ring-xanh-500" : ""}`}>
            <Avatar name={name} avatar={a} size={36} />
          </button>
        ))}
      </div>
      <Button variant="secondary" size="sm" disabled={pending || chon === avatar}
        onClick={() => start(async () => { const kq = await doiAvatar(chon); if (kq.ok) { toast(kq.tb!); router.refresh(); } else toast(kq.loi!, "loi"); })}>
        {pending ? "Đang lưu…" : "Đổi ảnh đại diện"}
      </Button>
    </div>
  );
}
