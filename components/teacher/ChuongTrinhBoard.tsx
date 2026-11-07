"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { LoaiPill } from "@/components/ui/Pill";
import { Button, btnClass } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { diChuyenBuoi, themBuoi, nhanBanBuoi, gopBuoi, tachBuoi, anBuoi, xoaBuoi, suaModule, diChuyenModule, xoaModule } from "@/lib/actions/gv/ct";
import type { KQ } from "@/lib/types";

export interface BuoiCT { id: string; nhan: string; ten: string; tomTat: string; loaiTen: string; loaiMau: string; noiBat: boolean; soTL: number; soBT: number; soBaiNop: number; chuDe: string | null; rieng: string | null }
export interface ModuleCT { id: string; ten: string; buoi: BuoiCT[] }

type Item = { kind: "m"; id: string; m: ModuleCT } | { kind: "l"; id: string; b: BuoiCT; moduleId: string };
const flat = (ms: ModuleCT[]): Item[] => ms.flatMap((m) => [{ kind: "m" as const, id: `m:${m.id}`, m }, ...m.buoi.map((b) => ({ kind: "l" as const, id: b.id, b, moduleId: m.id }))]);

/** Bảng chương trình (PPCT): kéo thả đổi thứ tự / chuyển module; menu ⋯ cho từng buổi */
export function ChuongTrinhBoard({ ctId, modules }: { ctId: string; modules: ModuleCT[] }) {
  const [items, setItems] = useState<Item[]>(() => flat(modules));
  useEffect(() => setItems(flat(modules)), [modules]);
  const [dong, setDong] = useState<Record<string, boolean>>({});
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const run = (fn: () => Promise<KQ>, sau?: (kq: KQ) => void) => start(async () => {
    const kq = await fn();
    if (kq.ok) { if (kq.tb) toast(kq.tb); sau?.(kq); router.refresh(); } else toast(kq.loi ?? "Lỗi", "loi");
  });

  const hien = items.filter((it) => it.kind === "m" || !dong[it.moduleId]);
  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = hien.findIndex((x) => x.id === e.active.id);
    let to = hien.findIndex((x) => x.id === e.over!.id);
    if (to <= 0) to = 1; // không đặt trên module đầu tiên
    const moi = arrayMove(hien, from, to);
    let moduleId = "", sauId: string | null = null;
    for (let i = to; i >= 0; i--) {
      const it = moi[i];
      if (it.kind === "m") { moduleId = it.m.id; break; }
      if (i < to && sauId === null) sauId = it.id;
    }
    const lessonId = String(e.active.id);
    setItems((cu) => {
      const t = arrayMove(cu, cu.findIndex((x) => x.id === lessonId), cu.findIndex((x) => x.id === e.over!.id) || 1);
      return t.map((x) => (x.id === lessonId && x.kind === "l" ? { ...x, moduleId } : x));
    });
    run(() => diChuyenBuoi(lessonId, moduleId, sauId));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={hien.map((x) => x.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5" aria-busy={pending}>
          <div className="hidden grid-cols-[28px_70px_minmax(0,1.4fr)_minmax(0,1.6fr)_130px_60px_60px_100px] gap-2 px-3 pb-1 text-xs font-bold uppercase text-slate-500 md:grid">
            <span /><span>Buổi</span><span>Tên bài</span><span>Nội dung</span><span>Loại</span><span className="text-center">Tài liệu</span><span className="text-center">Bài tập</span><span />
          </div>
          {hien.map((it) => it.kind === "m"
            ? <ModuleHead key={it.id} item={it} ctId={ctId} soBuoi={items.filter((x) => x.kind === "l" && x.moduleId === it.m.id).length} thuGon={!!dong[it.m.id]} onToggle={() => setDong((d) => ({ ...d, [it.m.id]: !d[it.m.id] }))} run={run} />
            : <LessonRow key={it.id} item={it} ctId={ctId} run={run} />)}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ModuleHead({ item, ctId, soBuoi, thuGon, onToggle, run }: { item: Extract<Item, { kind: "m" }>; ctId: string; soBuoi: number; thuGon: boolean; onToggle: () => void; run: (fn: () => Promise<KQ>) => void }) {
  const { setNodeRef } = useSortable({ id: item.id, disabled: true });
  const [sua, setSua] = useState(false);
  const [ten, setTen] = useState(item.m.ten);
  const [xoa, setXoa] = useState(false);
  return (
    <div ref={setNodeRef} className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-navy-800 px-3 py-2.5 text-white first:mt-0">
      <button onClick={onToggle} aria-expanded={!thuGon} className="flex items-center gap-2 text-left">
        {thuGon ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        <span className="text-lg font-extrabold">{item.m.ten}</span>
        <span className="rounded-full bg-white/15 px-2 text-xs">{soBuoi} buổi</span>
      </button>
      {item.m.id && <div className="ml-auto flex gap-1">
        <button title="Thêm buổi vào module" onClick={() => run(() => themBuoi(ctId, item.m.id))} className="rounded-lg p-1.5 hover:bg-white/15"><Plus className="h-4 w-4" /></button>
        <button title="Đổi tên module" onClick={() => setSua(true)} className="rounded-lg p-1.5 hover:bg-white/15"><Pencil className="h-4 w-4" /></button>
        <button title="Lên" onClick={() => run(() => diChuyenModule(item.m.id, "len"))} className="rounded-lg p-1.5 hover:bg-white/15"><ArrowUp className="h-4 w-4" /></button>
        <button title="Xuống" onClick={() => run(() => diChuyenModule(item.m.id, "xuong"))} className="rounded-lg p-1.5 hover:bg-white/15"><ArrowDown className="h-4 w-4" /></button>
        <button title="Xóa module" onClick={() => setXoa(true)} className="rounded-lg px-2 text-sm hover:bg-white/15">Xóa</button>
      </div>}
      <Modal open={sua} onClose={() => setSua(false)} title="Đổi tên module">
        <input className="input" value={ten} onChange={(e) => setTen(e.target.value)} />
        <div className="mt-4 flex justify-end"><Button onClick={() => { setSua(false); run(() => suaModule(item.m.id, ten)); }}>Lưu</Button></div>
      </Modal>
      <Modal open={xoa} onClose={() => setXoa(false)} title={`Xóa ${item.m.ten}?`}>
        <p>Module có <b>{soBuoi} buổi</b>{item.m.buoi.some((b) => b.soBaiNop) && <> (có buổi <b>đã có bài nộp</b> — nên ẩn buổi thay vì xóa)</>}. Module và các buổi sẽ vào Thùng rác, khôi phục được trong 30 ngày.</p>
        <div className="mt-4 flex justify-end gap-2"><Button variant="outlineGray" onClick={() => setXoa(false)}>Hủy</Button><Button variant="danger" onClick={() => { setXoa(false); run(() => xoaModule(item.m.id)); }}>Chuyển vào thùng rác</Button></div>
      </Modal>
    </div>
  );
}

function LessonRow({ item, ctId, run }: { item: Extract<Item, { kind: "l" }>; ctId: string; run: (fn: () => Promise<KQ>) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [menu, setMenu] = useState(false);
  const [xoa, setXoa] = useState(false);
  const b = item.b;
  const router = useRouter();
  const mi = "block w-full px-3 py-2 text-left text-sm hover:bg-xanh-50";
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative grid grid-cols-[28px_1fr_auto] items-center gap-2 rounded-2xl border px-3 py-2.5 md:grid-cols-[28px_70px_minmax(0,1.4fr)_minmax(0,1.6fr)_130px_60px_60px_100px] ${b.noiBat ? "border-cam-400 bg-cam-50" : "border-vien bg-white"} ${isDragging ? "z-20 shadow-xl" : ""}`}>
      <button {...attributes} {...listeners} aria-label={`Kéo để sắp xếp ${b.ten}`} className="cursor-grab touch-none rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"><GripVertical className="h-5 w-5" /></button>
      {/* Điện thoại: dạng thẻ */}
      <div className="min-w-0 md:hidden">
        <p className="font-bold">{b.nhan && `Buổi ${b.nhan}: `}{b.ten}</p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-slate-600">{b.loaiTen && <LoaiPill ten={b.loaiTen} mau={b.loaiMau} />}<span>{b.soTL} tài liệu · {b.soBT} bài tập</span></div>
      </div>
      <span className="hidden font-extrabold md:block">{b.nhan || "—"}</span>
      <div className="hidden min-w-0 md:block">
        <p className="truncate font-semibold" title={b.ten}>{b.ten}</p>
        {(b.chuDe || b.rieng) && <p className="truncate text-xs text-slate-500">{b.chuDe && `Chủ đề: ${b.chuDe}`}{b.rieng && ` · Riêng lớp ${b.rieng}`}</p>}
      </div>
      <p className="hidden line-clamp-2 text-sm text-slate-600 md:block" title={b.tomTat}>{b.tomTat}</p>
      <span className="hidden md:block">{b.loaiTen && <LoaiPill ten={b.loaiTen} mau={b.loaiMau} />}</span>
      <span className="hidden text-center md:block">{b.soTL}</span>
      <span className="hidden text-center md:block">{b.soBT}</span>
      <div className="flex items-center justify-end gap-1">
        <Link href={`/gv/chuong-trinh/buoi/${b.id}`} className={btnClass("outline", "sm", "!h-8 !px-3")}>Sửa</Link>
        <button onClick={() => setMenu((x) => !x)} aria-label={`Thao tác cho ${b.ten}`} aria-expanded={menu} className="rounded-lg p-1.5 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button>
      </div>
      {menu && (
        <div className="card absolute right-2 top-12 z-30 w-56 py-1" onMouseLeave={() => setMenu(false)} role="menu">
          <button className={mi} onClick={() => { setMenu(false); run(() => themBuoi(ctId, item.moduleId, { truocId: b.id })); }}>Chèn buổi phía trước</button>
          <button className={mi} onClick={() => { setMenu(false); run(() => themBuoi(ctId, item.moduleId, { sauId: b.id })); }}>Chèn buổi phía sau</button>
          <button className={mi} onClick={() => { setMenu(false); run(() => nhanBanBuoi(b.id)); }}>Nhân bản</button>
          <button className={mi} onClick={() => { setMenu(false); run(() => gopBuoi(b.id)); }}>Gộp với buổi sau</button>
          {/[–-]/.test(b.nhan) && <button className={mi} onClick={() => { setMenu(false); run(() => tachBuoi(b.id)); }}>Tách buổi ({b.nhan})</button>}
          <button className={mi} onClick={() => { setMenu(false); router.push(`/gv/chuong-trinh/buoi/${b.id}`); }}>Đổi loại / chủ đề / nhãn…</button>
          <button className={mi} onClick={() => { setMenu(false); run(() => anBuoi(b.id, true)); }}>Ẩn với mọi lớp</button>
          <button className={mi} onClick={() => { setMenu(false); run(() => anBuoi(b.id, false)); }}>Hiện với mọi lớp</button>
          <button className={`${mi} text-do-600`} onClick={() => { setMenu(false); setXoa(true); }}>Xóa…</button>
        </div>
      )}
      <Modal open={xoa} onClose={() => setXoa(false)} title={`Xóa buổi ${b.nhan}: ${b.ten}?`}>
        <p>Buổi này có <b>{b.soTL} tài liệu, {b.soBT} bài tập, {b.soBaiNop} bài nộp</b>.</p>
        {b.soBaiNop > 0 && <p className="mt-2 rounded-xl bg-cam-50 px-3 py-2 text-sm text-cam-600">Đã có bài nộp: nên bấm <b>Ẩn</b> thay vì xóa. Buổi đã có bài nộp không thể xóa vĩnh viễn.</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outlineGray" onClick={() => setXoa(false)}>Hủy</Button>
          <Button variant="outline" onClick={() => { setXoa(false); run(() => anBuoi(b.id, true)); }}>Ẩn thay vì xóa</Button>
          <Button variant="danger" onClick={() => { setXoa(false); run(() => xoaBuoi(b.id)); }}>Chuyển vào thùng rác</Button>
        </div>
      </Modal>
    </div>
  );
}
