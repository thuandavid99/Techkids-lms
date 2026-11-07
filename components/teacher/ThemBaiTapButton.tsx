"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { themBaiTap } from "@/lib/actions/gv/bt";

export function ThemBaiTapButton({ lessonId }: { lessonId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Button size="sm" disabled={pending} onClick={() => start(async () => {
      const kq = await themBaiTap(lessonId);
      if (kq.ok) router.push(`/gv/bai-tap/sua/${kq.data}`); else toast(kq.loi!, "loi");
    })}><Plus className="h-4 w-4" /> {pending ? "Đang thêm…" : "Thêm bài tập"}</Button>
  );
}
