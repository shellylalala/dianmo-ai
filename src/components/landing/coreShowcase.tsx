const modules = [
  {
    title: "AI 智能生成文本",
    description:
      "描述你的想法,AI 即刻生成高质量草稿。无论是报告、邮件还是创意内容,一句话启动写作,让灵感不再卡壳。",
    points: [
      "根据提示自动生成完整段落或全文",
      "支持多种写作风格与语气切换",
      "生成结果可直接插入文档继续编辑",
    ],
  },
  {
    title: "AI 优化文本",
    description:
      "选中任意内容,AI 帮你润色表达、修正语法、调整语气。让每一份输出都更精准、更专业。",
    points: [
      "一键润色、精简或扩写选中段落",
      "智能纠错语法与用词问题",
      "提供多版本改写供对比选择",
    ],
  },
  {
    title: "AI 聊天助手",
    description:
      "基于文档上下文与 AI 自由对话。提问、追问、头脑风暴,助手始终理解你的内容,给出贴合场景的回复。",
    points: [
      "理解当前文档内容作为对话背景",
      "支持多轮追问与深度分析",
      "随时调出,不打断写作心流",
    ],
  },
  {
    title: "分享 & 协同编辑",
    description:
      "邀请团队成员实时共同编辑,也可一键生成分享链接。权限灵活可控,协作从未如此顺畅。",
    points: [
      "多人实时同步编辑,光标可见",
      "细粒度权限:查看 / 评论 / 编辑",
      "一键生成公开或私密分享链接",
    ],
  },
];

const CoreShowcase = () => {
  return (
    <section id="core" className="mx-auto max-w-6xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          核心能力,逐一呈现
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          从生成到协作,点墨的每项核心功能都为高效创作而生。
        </p>
      </div>

      <div className="mt-20 space-y-24">
        {modules.map(({ title, description, points }, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={title}
              className={`grid items-center gap-12 lg:grid-cols-2 ${
                isEven ? "" : "lg:[&>*:first-child]:order-last"
              }`}
            >
              <div>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {title}
                </h3>
                <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                  {description}
                </p>
                <ul className="text-muted-foreground mt-6 space-y-3">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-muted ring-foreground/10 aspect-video w-full rounded-xl ring-1" />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CoreShowcase;
