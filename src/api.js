const CATS = ["Deprem Performans Analizi","Güçlendirme","İnşaat","Proje","Restorasyon","Emlak"];
const STATUS = ["Tamamlandı","Devam ediyor"];
const J = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const eq = (a, b) => a.length === b.length && [...a].reduce((r, c, i) => r | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;
async function hash(pw, salt) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 10000 }, k, 256));
}

export async function onRequest({ request: req, env }) {
  const kv = env.KV;
  if (!kv) return J({ error: "KV bağlantısı bulunamadı. GitHub'daki wrangler.jsonc dosyasında kv_namespaces bölümündeki id'nin Cloudflare'deki KV namespace ID'siyle aynı olduğunu kontrol edin." }, 500);
  const [route, id] = new URL(req.url).pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const m = req.method;
  const load = async () => (await kv.get("projects", { type: "json" })) || [];
  const save = (l) => kv.put("projects", JSON.stringify(l));

  /* herkese açık */
  if (route === "img" && id && m === "GET") {
    if (!/^[0-9a-f-]{8,40}$/.test(id)) return new Response("Not found", { status: 404 });
    const r = await kv.getWithMetadata("img:" + id, { type: "arrayBuffer", cacheTtl: 3600 });
    if (!r.value) return new Response("Not found", { status: 404 });
    return new Response(r.value, { headers: { "content-type": r.metadata?.type || "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  }
  if (route === "projects" && m === "GET") return J(await load());
  if (route === "content" && m === "GET") return J((await kv.get("site", { type: "json" })) || null);
  if (route === "auth" && id === "status" && m === "GET") return J({ configured: !!(await kv.get("auth")) });

  /* giriş ve ilk kurulum */
  const session = async () => { const t = rnd(32); await kv.put("s:" + t, "1", { expirationTtl: 604800 }); return t; };
  if (route === "auth" && (id === "setup" || id === "login") && m === "POST") {
    const p = String((await req.json().catch(() => ({}))).password || "");
    const a = await kv.get("auth", { type: "json" });
    if (id === "setup") {
      if (a) return J({ error: "Şifre zaten belirlenmiş." }, 403);
      if (p.length < 8) return J({ error: "Şifre en az 8 karakter olmalı." }, 400);
      const salt = rnd(16);
      await kv.put("auth", JSON.stringify({ salt, hash: await hash(p, salt) }));
      return J({ token: await session() });
    }
    if (!a) return J({ error: "Önce şifre belirlenmeli." }, 400);
    const f = (await kv.get("fails", { type: "json" })) || { n: 0, until: 0 };
    if (f.until > Date.now()) return J({ error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin." }, 429);
    if (!eq(await hash(p, a.salt), a.hash)) {
      const n = f.n + 1;
      await kv.put("fails", JSON.stringify(n >= 5 ? { n: 0, until: Date.now() + 900000 } : { n, until: 0 }), { expirationTtl: 900 });
      return J({ error: "Şifre hatalı." }, 401);
    }
    await kv.delete("fails");
    return J({ token: await session() });
  }

  /* buradan sonrası sadece giriş yapmış yönetici */
  const tok = req.headers.get("x-admin-token") || "";
  if (!/^[0-9a-f]{64}$/.test(tok) || !(await kv.get("s:" + tok))) return J({ error: "Oturum geçersiz. Lütfen tekrar giriş yapın." }, 401);
  if (route === "auth") { if (id === "logout") await kv.delete("s:" + tok); return J({ ok: true }); }

  if (route === "content" && m === "PUT") {
    const raw = await req.text();
    if (raw.length > 80000) return J({ error: "İçerik çok uzun." }, 400);
    let c; try { c = JSON.parse(raw); } catch { return J({ error: "Geçersiz içerik." }, 400); }
    if (!c || typeof c !== "object" || Array.isArray(c)) return J({ error: "Geçersiz içerik." }, 400);
    await kv.put("site", JSON.stringify(c));
    return J({ ok: true });
  }

  const saveImages = async (arr = []) => {
    const ids = [];
    for (const d of arr.slice(0, 12)) {
      const x = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(d || "");
      if (!x) continue;
      const k = crypto.randomUUID();
      await kv.put("img:" + k, Uint8Array.from(atob(x[2]), (c) => c.charCodeAt(0)), { metadata: { type: x[1] } });
      ids.push(k);
    }
    return ids;
  };
  const fields = (b) => ({
    title: String(b.title || "").trim().slice(0, 120),
    category: b.category,
    status: STATUS.includes(b.status) ? b.status : STATUS[0],
    year: String(b.year || "").trim().slice(0, 4),
    location: String(b.location || "").trim().slice(0, 80),
    description: String(b.description || "").trim().slice(0, 2000),
    area: String(b.area || "").trim().slice(0, 60),
    scope: (Array.isArray(b.scope) ? b.scope : []).map((x) => String(x).trim().slice(0, 160)).filter(Boolean).slice(0, 15),
  });

  if (route === "logo" && m === "POST") {
    const [k] = await saveImages([(await req.json().catch(() => ({}))).data]);
    return k ? J({ id: k }, 201) : J({ error: "Geçersiz görsel." }, 400);
  }
  if (route === "projects" && m === "POST") {
    const b = await req.json().catch(() => ({})), f = fields(b);
    if (!f.title || !CATS.includes(f.category)) return J({ error: "Başlık ve kategori zorunlu." }, 400);
    const p = { id: crypto.randomUUID(), ...f, images: await saveImages(b.addImages), created: Date.now() };
    const list = await load(); list.unshift(p); await save(list);
    return J(p, 201);
  }
  if (route === "projects" && id && m === "PUT") {
    const b = await req.json().catch(() => ({})), f = fields(b), list = await load(), p = list.find((x) => x.id === id);
    if (!p) return J({ error: "Proje bulunamadı." }, 404);
    if (!f.title || !CATS.includes(f.category)) return J({ error: "Başlık ve kategori zorunlu." }, 400);
    const rm = (b.removeImages || []).filter((x) => p.images.includes(x));
    for (const k of rm) await kv.delete("img:" + k);
    Object.assign(p, f, { images: [...p.images.filter((x) => !rm.includes(x)), ...(await saveImages(b.addImages))] });
    await save(list);
    return J(p);
  }
  if (route === "projects" && id && m === "DELETE") {
    const list = await load(), p = list.find((x) => x.id === id);
    if (!p) return J({ error: "Proje bulunamadı." }, 404);
    for (const k of p.images) await kv.delete("img:" + k);
    await save(list.filter((x) => x.id !== id));
    return J({ ok: true });
  }
  return J({ error: "Bulunamadı." }, 404);
}
