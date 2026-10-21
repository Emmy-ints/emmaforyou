import { supabase } from "@/integrations/supabase/client";

/**
 * The signed-in user's Ecommerce workspace (browser side). Rows are private: the database only
 * returns and accepts the owner's own workspaces and items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
export type ItemKind = "roadmap" | "research" | "product" | "audit" | "diagnosis" | "profit" | "competitors" | "experiment" | "task" | "import";
export interface Workspace { id: string; name: string; stage: "starting" | "growing"; store_url: string | null; profile: Record<string, unknown>; created_at: string; updated_at: string }
export interface Item<T = Record<string, unknown>> { id: string; workspace_id: string; kind: ItemKind; title: string; status: "open" | "in_progress" | "done" | "archived"; data: T; created_at: string; updated_at: string }

const err = (e: unknown) => new Error((e as { message?: string })?.message?.includes("full") ? (e as { message: string }).message : "Couldn't save. Please try again.");

export async function myWorkspaces(): Promise<Workspace[]> {
  const { data, error } = await db.from("ecom_workspaces").select("*").order("created_at", { ascending: true });
  if (error) throw err(error);
  return data ?? [];
}

/** The workspace to use: the one chosen before (remembered per browser), else the first, else a new one. */
export async function currentWorkspace(uid: string, stage?: Workspace["stage"]): Promise<Workspace> {
  const list = await myWorkspaces();
  let chosen: string | null = null;
  try { chosen = localStorage.getItem("efy_ecom_ws"); } catch { /* storage unavailable */ }
  const found = list.find((w) => w.id === chosen) ?? list[0];
  if (found) return found;
  const { data, error } = await db.from("ecom_workspaces").insert({ user_id: uid, name: "My business", stage: stage ?? "starting" }).select("*").single();
  if (error) throw err(error);
  return data;
}
export function rememberWorkspace(id: string) { try { localStorage.setItem("efy_ecom_ws", id); } catch { /* ignore */ } }

export async function createWorkspace(uid: string, name: string, stage: Workspace["stage"]): Promise<Workspace> {
  const { data, error } = await db.from("ecom_workspaces").insert({ user_id: uid, name: name.trim().slice(0, 80) || "My business", stage }).select("*").single();
  if (error) throw err(error);
  return data;
}
export async function updateWorkspace(id: string, patch: Partial<Pick<Workspace, "name" | "stage" | "store_url" | "profile">>): Promise<void> {
  const { error } = await db.from("ecom_workspaces").update(patch).eq("id", id);
  if (error) throw err(error);
}
export async function deleteWorkspace(id: string): Promise<void> {
  const { error } = await db.from("ecom_workspaces").delete().eq("id", id);
  if (error) throw err(error);
}

export async function listItems<T = Record<string, unknown>>(workspaceId: string, kind?: ItemKind | ItemKind[]): Promise<Item<T>[]> {
  let q = db.from("ecom_items").select("*").eq("workspace_id", workspaceId).order("updated_at", { ascending: false }).limit(300);
  if (kind) q = Array.isArray(kind) ? q.in("kind", kind) : q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw err(error);
  return data ?? [];
}
export async function saveItem<T>(uid: string, workspaceId: string, kind: ItemKind, title: string, data: T, id?: string, status?: Item["status"]): Promise<Item<T>> {
  const row = { title: title.trim().slice(0, 200) || "Untitled", data, ...(status ? { status } : {}) };
  const res = id
    ? await db.from("ecom_items").update(row).eq("id", id).select("*").single()
    : await db.from("ecom_items").insert({ ...row, user_id: uid, workspace_id: workspaceId, kind }).select("*").single();
  if (res.error) throw err(res.error);
  return res.data;
}
export async function setItemStatus(id: string, status: Item["status"]): Promise<void> {
  const { error } = await db.from("ecom_items").update({ status }).eq("id", id);
  if (error) throw err(error);
}
export async function deleteItem(id: string): Promise<void> {
  const { error } = await db.from("ecom_items").delete().eq("id", id);
  if (error) throw err(error);
}
export async function guideHistory(workspaceId: string): Promise<{ id: string; role: "user" | "assistant"; body: string; created_at: string }[]> {
  const { data } = await db.from("ecom_guide_messages").select("id,role,body,created_at").eq("workspace_id", workspaceId).order("created_at", { ascending: true }).limit(200);
  return data ?? [];
}
export async function clearGuide(workspaceId: string): Promise<void> { await db.from("ecom_guide_messages").delete().eq("workspace_id", workspaceId); }

/** Download everything in a workspace as JSON. */
export async function exportWorkspace(ws: Workspace): Promise<void> {
  const [items, guide] = await Promise.all([listItems(ws.id), guideHistory(ws.id)]);
  const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), workspace: ws, items, guide }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `emmaforyou-${ws.name.replace(/\W+/g, "-").toLowerCase()}.json`; a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** POST to an ecommerce API route with the session token (if signed in). */
export async function api<T>(path: string, body: unknown): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", ...(data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}) }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((j as { message?: string }).message || `Something went wrong (HTTP ${res.status}).`);
  return j as T;
}
