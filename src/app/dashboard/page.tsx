import { FileText } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <FileText className="text-muted-foreground/40 h-12 w-12" />
      <p className="text-muted-foreground text-sm">选择左侧文档或新建一个</p>
    </div>
  );
}
