export type AiAction =
  | "expand"
  | "simplify"
  | "translate"
  | "tone"
  | "explain" // 划词
  | "continue"
  | "outline"
  | "summary"
  | "brainstorm"; // 写作

export function buildMessages(action: AiAction, text: string, title?: string) {
  const system =
    "你是专业中文写作助手。所有输出必须使用标准 Markdown（GFM），禁止输出 HTML 标签。直接输出结果，不要解释、不要加引号。若是列表/标题/代码等内容，必须使用正确 Markdown 语法。";
  const map: Record<AiAction, string> = {
    expand: `扩写下面内容，使其更丰富：\n${text}`,
    simplify: `精简下面内容，更简洁清晰：\n${text}`,
    translate: `把下面内容翻译成英文：\n${text}`,
    tone: `把下面内容改写为更专业正式的语气：\n${text}`,
    explain: `解释下面内容的含义：\n${text}`,
    continue: `文档标题「${title ?? ""}」。基于以下内容续写一段：\n${text}`,
    outline: `根据标题「${title ?? ""}」和内容生成结构化大纲：\n${text}`,
    summary: `为下面内容生成简短摘要：\n${text}`,
    brainstorm: `围绕「${title ?? ""}」头脑风暴 5 个要点：\n${text}`,
  };
  return [
    { role: "system" as const, content: system },
    { role: "user" as const, content: map[action] },
  ];
}
