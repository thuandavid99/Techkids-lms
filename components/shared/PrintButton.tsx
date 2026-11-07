"use client";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <>
      <Button variant="outlineGray" onClick={() => history.back()}>Quay lại</Button>
      <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> In / Lưu PDF</Button>
    </>
  );
}
