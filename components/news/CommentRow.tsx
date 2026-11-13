import { Button } from "heroui-native/button";
import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Theme } from "@/constants/theme";
import { commentInitials, commenterName, type PublicNewsComment } from "@/utils/newsComments";
import { newsPostingTime } from "@/utils/newsFilters";
import { newsImage } from "./FeaturedCard";
import type { NewsItem } from "@/hooks/useNews";

type Props = { comment: PublicNewsComment; depth: number; theme: Theme; now: number; canReport: boolean; disabled: boolean; onReply: (comment: PublicNewsComment) => void; onReport: (comment: PublicNewsComment) => void };
export const CommentRow = memo(function CommentRow({ comment, depth, theme, now, canReport, disabled, onReply, onReport }: Props) {
  const name = commenterName(comment);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const time = comment.created_at ? newsPostingTime({ created_at: comment.created_at, date: comment.date || "" } as NewsItem, new Date(now)) : comment.date;
  return <View style={[styles.row, { borderBottomColor: theme.border, marginLeft: Math.min(depth, 2) * 24 }]}>
    {comment.avatar && failedAvatar !== comment.avatar ? <Image source={{ uri: newsImage(comment.avatar) }} onError={() => setFailedAvatar(comment.avatar || null)} resizeMode="cover" style={styles.avatar}/>
      : <View style={[styles.avatar, styles.initials, { backgroundColor: theme.communityBg }]}><Text style={{ color: theme.primary, fontSize: 11, fontWeight: "700" }}>{commentInitials(name)}</Text></View>}
    <View style={{ flex: 1, minWidth: 0 }}>
      <View style={styles.heading}><Text style={[styles.name, { color: theme.text }]}>{name}</Text>{!!time && <Text style={[styles.time, { color: theme.secondary }]}>{time}</Text>}</View>
      <Text selectable style={[styles.content, { color: theme.text }]}>{comment.content || comment.body}</Text>
      <View style={styles.actions}>
        <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`Balas kepada ${name}`} isDisabled={disabled} onPress={() => onReply(comment)} style={styles.action}><Text style={[styles.actionText, { color: theme.secondary }]}>Balas</Text></Button>
        {!!comment.likes_count && <View accessibilityLabel={`${comment.likes_count} suka`} style={styles.likeCount}><Ionicons name="heart-outline" size={14} color={theme.secondary}/><Text style={[styles.actionText, { color: theme.secondary }]}>{comment.likes_count}</Text></View>}
        {canReport && (comment.reported_by_user ? <Text style={[styles.actionText, { color: theme.secondary }]}>Dilaporkan</Text> : <Button variant="ghost" className="h-auto min-h-0 min-w-0 rounded-none p-0" accessibilityRole="button" accessibilityLabel={`Laporkan komen ${name}`} isDisabled={disabled} onPress={() => onReport(comment)} style={[styles.action, { marginLeft: "auto" }]}><Ionicons name="ellipsis-horizontal" size={18} color={theme.secondary}/></Button>)}
      </View>
    </View>
  </View>;
});
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 32, height: 32, borderRadius: 16 }, initials: { alignItems: "center", justifyContent: "center" },
  heading: { flexDirection: "row", alignItems: "baseline", gap: 8 }, name: { fontSize: 12, fontWeight: "700", lineHeight: 18, flex: 1 },
  time: { fontSize: 10, lineHeight: 16 }, content: { fontSize: 14, lineHeight: 20, marginTop: 3 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 32 }, action: { minHeight: 32, minWidth: 32, justifyContent: "center" },
  actionText: { fontSize: 11 }, likeCount: { flexDirection: "row", gap: 4, alignItems: "center" },
});
