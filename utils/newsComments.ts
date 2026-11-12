export interface PublicNewsComment {
  id: string;
  content?: string;
  body?: string;
  author?: string | { name?: string };
  user?: string | { name?: string };
  avatar?: string | null;
  parent_id?: string | number | null;
  date?: string;
  created_at?: string;
  likes_count?: number;
  reported_by_user?: boolean;
  status?: string;
}
export interface NewsCommentsSnapshot { comments: PublicNewsComment[]; total: number }
export interface CommentSubmission { status?: string; message?: string; remaining_quota?: number | null }
export function commenterName(comment: PublicNewsComment): string {
  const name = (value: PublicNewsComment["author"]) => typeof value === "string" ? value : value?.name;
  return name(comment.author) || name(comment.user) || "Pengguna";
}
export function commentInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0] || "").join("").toLocaleUpperCase();
}
export function readNewsComments(payload: unknown): NewsCommentsSnapshot {
  const wrapper = payload as { data?: unknown } | null;
  const data = (wrapper?.data ?? payload) as { comments?: number | PublicNewsComment[]; comments_count?: number; comments_list?: PublicNewsComment[] };
  if (!data || typeof data !== "object") throw new Error("Invalid news response");
  const list = Array.isArray(data.comments_list) ? data.comments_list : Array.isArray(data.comments) ? data.comments : [];
  const seen = new Set<string>();
  const comments = list.filter(comment => {
    if (!comment?.id || (comment.status && comment.status !== "published")) return false;
    const id = String(comment.id);
    if (seen.has(id)) return false;
    seen.add(id); return true;
  }).map(comment => ({ ...comment, id: String(comment.id) }));
  const count = data.comments_count ?? (typeof data.comments === "number" ? data.comments : comments.length);
  return { comments, total: Number.isFinite(count) ? Math.max(0, count) : comments.length };
}
export function threadNewsComments(comments: PublicNewsComment[]) {
  const children = new Map<string, PublicNewsComment[]>();
  for (const comment of comments) {
    const parent = comment.parent_id == null ? "root" : String(comment.parent_id);
    const siblings = children.get(parent);
    if (siblings) siblings.push(comment);
    else children.set(parent, [comment]);
  }
  const rows: { comment: PublicNewsComment; depth: number }[] = [];
  const seen = new Set<string>();
  // An iterative traversal preserves reply order without recursion limits.
  const stack = (children.get("root") || []).slice().reverse().map(comment => ({ comment, depth: 0 }));
  while (stack.length) {
    const row = stack.pop()!;
    if (seen.has(row.comment.id)) continue;
    seen.add(row.comment.id); rows.push(row);
    for (const child of (children.get(row.comment.id) || []).slice().reverse()) stack.push({ comment: child, depth: row.depth + 1 });
  }
  // Orphaned replies stay hidden, as they may belong to a moderated parent.
  return rows;
}
export function commentSubmissionMessage(result: CommentSubmission) {
  if (result.status === "rejected" || result.status === "hidden") return "Komen tidak diterbitkan selepas semakan moderator.";
  if (result.message) return result.message;
  return result.status === "published" ? "Komen diterbitkan." : "Komen dihantar dan sedang menunggu semakan moderator.";
}
export function commentErrorMessage(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[] | string> } } })?.response;
  const errors = response?.data?.errors;
  if (errors) {
    const first = errors.quota || errors.content || Object.values(errors)[0];
    if (typeof first === "string") return first;
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  }
  if (response?.status === 401) return "Sila log masuk untuk meneruskan.";
  if (response?.status === 429) return "Terlalu banyak permintaan. Tunggu sebentar sebelum mencuba lagi.";
  if (typeof response?.data?.message === "string") return response.data.message;
  return "Permintaan gagal. Cuba lagi; teks anda masih disimpan.";
}
