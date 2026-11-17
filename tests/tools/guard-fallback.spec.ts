/** The AI guard's database-down fallbacks: offline stand-in and in-memory limits. */
import { memoryLimit, memoryRecord, offlineDb } from "@/lib/ai/guard";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

await (async () => {
  const db = offlineDb("down");
  const a = await db.from("x").select("a").eq("b", 1).gte("c", 2).order("d").maybeSingle();
  t("offline: query chain resolves to an error result", a.data === null && a.error?.message === "down", a);
  const b = await db.from("x").select("id", { count: "exact", head: true });
  t("offline: count queries resolve too", b.count === null && !!b.error);
  const c = await db.rpc("anything", {});
  t("offline: rpc resolves", !!c.error);
  let caught = false; try { await db.from("x").insert({}).select("id").maybeSingle(); } catch { caught = true; }
  t("offline: never throws", !caught);
  const viaAsync = await (async () => offlineDb("down"))();
  t("offline: survives being returned from an async function", typeof viaAsync.from === "function");
  const d = await db.storage.from("bucket").upload("p", new Blob(["x"]));
  t("offline: storage resolves", !!d.error);
})();

const now = 1_000_000_000_000;
for (let i = 0; i < 3; i++) memoryRecord("plan", "v1", now + i);
t("memory: counts this visitor", memoryLimit("plan", "v1", 5, 100, now + 10).used === 3);
t("memory: other visitors separate", memoryLimit("plan", "v2", 5, 100, now + 10).used === 0);
t("memory: total across visitors", memoryLimit("plan", "v2", 5, 100, now + 10).total === 3);
t("memory: oldest for retry time", memoryLimit("plan", "v1", 5, 100, now + 10).oldest === now);
t("memory: forgets after an hour", memoryLimit("plan", "v1", 5, 100, now + 3_600_001 + 5).used === 0);
t("memory: kinds separate", memoryLimit("emails", "v1", 5, 100, now + 10).used === 0);

for (const [name, ok, info] of R) if (!ok) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
