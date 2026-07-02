import {
  FileText,
  Pencil,
  Users,
  Sparkles,
  MousePointerClick,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const features = [
  {
    icon: FileText,
    title: "文档管理",
    description: "统一组织文档结构,快速检索与归档,让内容井然有序。",
  },
  {
    icon: Pencil,
    title: "富文本编辑",
    description: "所见即所得的编辑体验,支持丰富的排版与格式化能力。",
  },
  {
    icon: Users,
    title: "实时协同",
    description: "多人同时在线编辑,光标与改动实时同步,协作零延迟。",
  },
  {
    icon: Sparkles,
    title: "AI 写作",
    description: "智能续写、润色与总结,让灵感落笔更高效流畅。",
  },
  {
    icon: MousePointerClick,
    title: "划词处理",
    description: "选中文字即可翻译、解释或改写,操作即刻响应。",
  },
  {
    icon: MessageSquare,
    title: "AI 对话",
    description: "与文档上下文对话,随时提问获取精准的智能回复。",
  },
];

const Features = () => {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          一个空间,满足所有创作需求
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          从文档管理到 AI 协作,点墨为你提供完整的智能写作能力。
        </p>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="p-6">
            <CardHeader className="px-0">
              <div className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-lg">
                <Icon className="size-6" />
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default Features;
