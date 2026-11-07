"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { btnClass, type Variant } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import type { KQ } from "@/lib/types";

/**
 * Tải file lên Storage bằng đường dẫn ký (không qua giới hạn 4.5MB của Vercel):
 *  1) xinLink(tên, cỡ) → {path, token}  2) tải thẳng lên  3) xacNhan(path, tên) để server kiểm tra nội dung.
 */
export function UploadButton({ bucket, xinLink, xacNhan, accept, children = "Tải file lên", variant = "outline", multiple = false }: {
  bucket: "materials" | "assignment-files"; xinLink: (ten: string, size: number) => Promise<KQ>; xacNhan: (path: string, ten: string) => Promise<KQ>;
  accept?: string; children?: React.ReactNode; variant?: Variant; multiple?: boolean;
}) {
  const [dang, setDang] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  async function tai(files: FileList | null) {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      setDang(f.name);
      try {
        const l = await xinLink(f.name, f.size);
        if (!l.ok) throw new Error(l.loi);
        const { path, token } = l.data as { path: string; token: string };
        const { error } = await createBrowserSupabase().storage.from(bucket).uploadToSignedUrl(path, token, f);
        if (error) throw new Error("Tải lên chưa được (" + error.message + ")");
        const x = await xacNhan(path, f.name);
        if (!x.ok) throw new Error(x.loi);
        toast(`Đã tải lên: ${f.name}`);
      } catch (e) { toast(`${f.name}: ${(e as Error).message}`, "loi"); }
    }
    setDang(null);
    if (ref.current) ref.current.value = "";
    router.refresh();
  }
  return (
    <label className={btnClass(variant, "sm", `cursor-pointer ${dang ? "pointer-events-none opacity-60" : ""}`)}>
      <Upload className="h-4 w-4" /> {dang ? `Đang tải ${dang.length > 18 ? dang.slice(0, 18) + "…" : dang}` : children}
      <input ref={ref} type="file" className="sr-only" accept={accept} multiple={multiple} onChange={(e) => tai(e.target.files)} />
    </label>
  );
}
