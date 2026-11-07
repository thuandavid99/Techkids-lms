import { Download, Eye, ExternalLink } from "lucide-react";
import { FileIcon } from "@/components/ui/Misc";
import { Pill } from "@/components/ui/Pill";
import { btnClass } from "@/components/ui/Button";
import { kichThuocDep, xemTrucTuyenDuoc } from "@/lib/domain/files";
import type { TaiLieu } from "@/lib/types";

/** Một dòng tài liệu: icon theo loại file, tên, phân loại, dung lượng, nút Xem / Tải về / Mở link */
export function MaterialRow({ m, phanLoai, moi = false }: { m: TaiLieu; phanLoai?: string; moi?: boolean }) {
  const href = `/api/tai-ve?loai=tai-lieu&id=${m.id}`;
  const coXem = m.nguon === "file" && xemTrucTuyenDuoc(m.mime ?? m.ten_goc);
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#eef3fb] py-3 last:border-0">
      <FileIcon ten={m.ten_goc ?? m.tieu_de} nguon={m.nguon} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{m.tieu_de} {moi && <Pill mau="green" className="ml-1">Mới</Pill>}</p>
        <p className="text-xs text-slate-500">{[phanLoai, m.nguon === "link" ? "Liên kết" : m.ten_goc, kichThuocDep(m.kich_thuoc)].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="flex gap-2">
        {m.nguon === "link" ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className={btnClass("outline", "sm")}><ExternalLink className="h-4 w-4" /> Mở link</a>
        ) : (
          <>
            {coXem && <a href={`${href}&xem=1`} target="_blank" rel="noopener noreferrer" className={btnClass("outline", "sm")}><Eye className="h-4 w-4" /> Xem</a>}
            {m.cho_phep_tai && <a href={href} className={btnClass("outlineOrange", "sm")}><Download className="h-4 w-4" /> Tải về</a>}
          </>
        )}
      </div>
    </div>
  );
}
