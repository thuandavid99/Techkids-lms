import { SubNavCaiDat } from "@/components/teacher/SubNavCaiDat";
import { getProfile, laQuanTri } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui/Card";
import { HuongDan } from "@/components/shared/HuongDan";
import { HD_GIAO_VIEN } from "@/lib/huong-dan";

export const metadata = { title: "Hướng dẫn giáo viên" };

export default async function Page() {
  const qt = laQuanTri(await getProfile());
  return <><SubNavCaiDat qt={qt} /><Card><PageHeader title="Hướng dẫn cho giáo viên" /><HuongDan muc={HD_GIAO_VIEN} /></Card></>;
}
