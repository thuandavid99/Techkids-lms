import { redirect } from "next/navigation";

// Chuyển từ ô chọn học sinh sang trang phiếu in
export default async function Page({ searchParams }: { searchParams: Promise<{ hs?: string }> }) {
  const { hs } = await searchParams;
  redirect(hs && /^[0-9a-f-]{36}$/i.test(hs) ? `/phieu/${hs}` : "/gv/bao-cao");
}
