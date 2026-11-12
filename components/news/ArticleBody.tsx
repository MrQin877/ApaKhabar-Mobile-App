import { Fragment, type ReactNode } from "react";
import { Text, View } from "react-native";
import type { Theme } from "@/constants/theme";

export function plainArticle(value: string) {
  return decode(value.replace(/<[^>]*>/g, " "));
}
function decode(value: string) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "\u2013", mdash: "\u2014", lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d", hellip: "\u2026" };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (original, key: string) => {
    if (key.startsWith("#")) {
      const code = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
      return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : original;
    }
    return entities[key] ?? original;
  });
}
// Render editorial HTML as native text; no scripts or embedded browser content.
function inline(value: string, key = "text"): ReactNode {
  const pattern = /<(strong|b|em|i|u|s|sup|sub)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
  const result: ReactNode[] = [];
  let last = 0;
  for (const match of value.matchAll(pattern)) {
    result.push(decode(value.slice(last, match.index).replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "")));
    const tag = match[1].toLowerCase();
    result.push(<Text key={`${key}-${match.index}`} style={{ fontWeight: /^(strong|b)$/.test(tag) ? "700" : undefined, fontStyle: /^(em|i)$/.test(tag) ? "italic" : undefined, textDecorationLine: tag === "u" ? "underline" : tag === "s" ? "line-through" : undefined }}>{inline(match[2], `${key}-${match.index}`)}</Text>);
    last = match.index! + match[0].length;
  }
  result.push(decode(value.slice(last).replace(/<br\s*\/?\s*>/gi, "\n").replace(/<[^>]*>/g, "")));
  return result;
}
export function ArticleBody({ content, theme }: { content: string; theme: Theme }) {
  const cleaned = content.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const numbered = cleaned.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, list: string) => {
    let number = 0;
    return list.replace(/<li[^>]*>/gi, () => `\n${++number}. `) + "\n\n";
  });
  const blocks = numbered.replace(/<li[^>]*>/gi, "\n\u2022 ").replace(/<\/(p|div|h[1-6]|blockquote|ul|ol)>/gi, "\n\n").split(/\n\s*\n/).filter(block => plainArticle(block).trim());
  return <View style={{ gap: 16 }}>{blocks.map((block, index) => <Fragment key={index}><Text selectable style={{ color: theme.text, fontSize: /<h[1-6]/i.test(block) ? 21 : 16, fontWeight: /<h[1-6]/i.test(block) ? "700" : "400", lineHeight: 27 }}>{inline(block.trim())}</Text></Fragment>)}</View>;
}
