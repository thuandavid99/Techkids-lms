import { requireStudent } from "@/lib/auth";
import { IMG } from "@/lib/brand";
import { Card, PageGrid, RobotCard } from "@/components/ui/Card";
import { HuongDan } from "@/components/shared/HuongDan";
import { HD_HOC_SINH } from "@/lib/huong-dan";

export const metadata = { title: "Hướng dẫn" };

export default async function Page() {
  await requireStudent();
  return (
    <PageGrid
      main={<Card><h1 className="h-page mb-4">Hướng dẫn sử dụng</h1><HuongDan muc={HD_HOC_SINH} /></Card>}
      aside={<RobotCard img={IMG.laptopSmall} title="Cần giúp đỡ?" text="Không tìm thấy câu trả lời? Hỏi thầy trong giờ học nhé!" />}
    />
  );
}
