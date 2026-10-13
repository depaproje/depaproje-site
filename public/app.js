const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const IMG=id=>"/api/img/"+id;
const $=(s,r=document)=>r.querySelector(s);
const PH='<svg viewBox="0 0 64 64"><path d="M8 56V20l24-12 24 12v36M8 56h48M20 56V34h24v22M20 34l24 22M44 34L20 56"/></svg>';
const SVG=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;

function merge(d,s){
  if(Array.isArray(d))return Array.isArray(s)&&s.length?s:d;
  if(d&&typeof d==="object"){const o={};for(const k in d)o[k]=merge(d[k],s&&s[k]);return o}
  return typeof s==="string"?s:d;
}
async function getJSON(u,ms=2500){
  const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
  try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}catch(e){return null}finally{clearTimeout(t)}
}

/* reveal + counters */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;io.unobserve(e.target);e.target.classList.add("in");
  e.target.querySelectorAll("[data-n]").forEach(count);if(e.target.dataset.n)count(e.target);
}),{threshold:.12});
function observe(){document.querySelectorAll(".rv:not(.in)").forEach(el=>io.observe(el))}
function count(el){
  const n=+el.dataset.n,t0=performance.now(),D=1400;
  const f=t=>{const p=Math.min(1,(t-t0)/D);el.textContent=Math.round(n*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)};
  requestAnimationFrame(f);
}

/* header */
const hd=document.querySelector("header");
if(hd){
  const fixed=hd.hasAttribute("data-fixed");
  const upd=()=>hd.classList.toggle("solid",fixed||scrollY>30);upd();addEventListener("scroll",upd,{passive:true});
  const mb=$(".menu"),nv=$("header nav");
  if(mb){mb.onclick=()=>{const o=nv.classList.toggle("open");hd.classList.toggle("open",o);mb.setAttribute("aria-expanded",o)};
    nv.addEventListener("click",e=>{if(e.target.closest("a")){nv.classList.remove("open");hd.classList.remove("open")}})}
}

/* modal */
function modal(html){
  let d=$("#pm");
  if(!d){d=document.createElement("dialog");d.id="pm";document.body.appendChild(d);d.addEventListener("click",e=>{if(e.target===d)d.close()})}
  d.innerHTML=html;d.querySelector(".x").onclick=()=>d.close();
  d.querySelectorAll("[data-close]").forEach(a=>a.onclick=()=>d.close());
  d.querySelectorAll(".thumbs img").forEach(t=>t.onclick=()=>{$("#big",d).src=IMG(t.dataset.k);d.querySelectorAll(".thumbs img").forEach(x=>x.classList.toggle("on",x===t))});
  d.showModal();d.scrollTop=0;
}
const list=a=>a&&a.length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";

/* content sections */
let C=null;
function renderContent(c){
  C=c;
  const h=$('[data-c="hero"]');
  if(h)h.innerHTML=`<h1 class="hi" style="--d:.15s">${esc(c.hero.title)}</h1><p class="hi" style="--d:.35s">${esc(c.hero.text)}</p><div class="hero-actions hi" style="--d:.55s"><a class="btn btn-gold" href="projeler.html">${esc(c.hero.cta1)}</a><a class="btn btn-line" href="#iletisim">${esc(c.hero.cta2)}</a></div>`;
  const a=$('[data-c="about"]');
  if(a)a.innerHTML=`<div><h2 class="rv">${esc(c.about.title)}</h2><p class="rv" style="--d:.1s">${esc(c.about.p1)}</p><p class="rv" style="--d:.2s">${esc(c.about.p2)}</p></div><aside class="pr rv" style="--d:.15s"><h3>${esc(c.about.principlesTitle)}</h3><ul>${c.about.principles.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></aside>`;
  const s=$('[data-c="services"]');
  if(s)s.innerHTML=`<div class="sec-head"><div class="rv"><h2>${esc(c.servicesTitle)}</h2><p class="lead">${esc(c.servicesText)}</p></div></div><div class="sg">${c.services.map((v,i)=>`<button class="sc rv" style="--d:${(i%4)*.08}s" data-i="${i}"><div class="ic">${SVG(ICONS[v.icon]||ICONS.proje)}</div><h3>${esc(v.title)}</h3><p>${esc(v.text)}</p><span class="more">Detaylar <i>→</i></span></button>`).join("")}</div>`;
  if(s)s.querySelectorAll(".sc").forEach(b=>b.onclick=()=>{const v=c.services[+b.dataset.i];
    modal(`<div class="dg one"><button class="x" aria-label="Kapat">×</button><div class="tx"><div class="cat">Hizmetlerimiz</div><h3>${esc(v.title)}</h3><p>${esc(v.detail||v.text)}</p>${v.items&&v.items.length?`<h4>Kapsam</h4>${list(v.items)}`:""}<a class="btn btn-gold" href="#iletisim" data-close>Bu hizmet için bize ulaşın</a></div></div>`)});
  const k=c.contact,tel="+90"+k.phone.replace(/\D/g,"").replace(/^0/,"");
  const ct=$('[data-c="contact"]');
  if(ct)ct.innerHTML=`<div class="cw"><div><h2 class="rv">${esc(k.title)}</h2><p class="lead rv" style="--d:.1s">${esc(k.text)}</p><div class="acts rv" style="--d:.2s"><a class="btn btn-gold" href="tel:${esc(tel)}">Hemen arayın</a><a class="btn btn-line" href="mailto:${esc(k.email1)}">E-posta gönderin</a></div></div><div class="cl">
   <div class="cc rv"><div class="i">${SVG('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>')}</div><div><h3>Telefon</h3><a href="tel:${esc(tel)}">${esc(k.phone)}</a></div></div>
   <div class="cc rv"><div class="i">${SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>')}</div><div><h3>E-posta</h3>${[k.email1,k.email2].filter(Boolean).map(m=>`<a href="mailto:${esc(m)}">${esc(m)}</a>`).join("")}</div></div>
   <div class="cc rv"><div class="i">${SVG('<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>')}</div><div><h3>Adres</h3><p>${esc(k.address)}</p>${k.mapUrl?`<a href="${esc(k.mapUrl)}" target="_blank" rel="noopener" style="color:var(--gold);font-size:15px;font-weight:600">Haritada aç</a>`:""}</div></div>
   ${k.instagram?`<div class="cc rv"><div class="i">${SVG('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>')}</div><div><h3>Instagram</h3><a href="${esc(k.instagramUrl)}" target="_blank" rel="noopener">${esc(k.instagram)}</a></div></div>`:""}</div></div>`;
  const rf=$('[data-c="refs"]');
  if(rf){
    const base=c.references.length<8?[...c.references,...c.references]:c.references;
    const set=h=>`<div class="ms"${h?' aria-hidden="true"':""}>${base.map(x=>`<div class="rf${x.logo?"":" t"}" title="${esc(x.name)}">${x.logo?`<img src="${IMG(x.logo)}" alt="${esc(x.name)}">`:`<span>${esc(x.name)}</span>`}</div>`).join("")}</div>`;
    rf.hidden=!c.references.length;
    rf.innerHTML=`<div class="wrap"><div class="sec-head"><div class="rv"><h2>${esc(c.refsTitle)}</h2><p class="lead">${esc(c.refsText)}</p></div></div></div><div class="mq rv"><div class="mt" style="--dur:${Math.max(40,base.length*4.5)}s">${set(0)}${set(1)}</div></div>`;
  }
  const f=$('[data-c="foot"]');
  if(f)f.innerHTML=`<h4>İletişim</h4><p>${esc(k.address)}</p><p><a href="tel:${esc(tel)}">${esc(k.phone)}</a><br><a href="mailto:${esc(k.email1)}">${esc(k.email1)}</a></p>`;
  document.documentElement.classList.remove("wait");observe();
}

/* projects */
function card(p,i){
  const on=p.status!=="Tamamlandı",meta=[p.location,p.year].filter(Boolean).join(", ");
  return `<button class="pc rv" style="--d:${(i%3)*.08}s" data-id="${esc(p.id)}">${p.images[0]?`<img src="${IMG(p.images[0])}" alt="${esc(p.title)}" loading="lazy">`:`<div class="np">${PH}</div>`}<span class="badge${on?" on":""}">${esc(p.status)}</span><div class="ov"><div class="cat">${esc(p.category)}</div><h3>${esc(p.title)}</h3>${meta?`<div class="meta">${esc(meta)}</div>`:""}</div></button>`;
}
function openProject(p){
  const spec=[["Kategori",p.category],["Durum",p.status],["Konum",p.location],["Yıl",p.year],["Alan / kat",p.area]].filter(r=>r[1]);
  modal(`<div class="dg${p.images.length?"":" one"}"><button class="x" aria-label="Kapat">×</button>${p.images.length?`<div class="gal"><img id="big" src="${IMG(p.images[0])}" alt="${esc(p.title)}">${p.images.length>1?`<div class="thumbs">${p.images.map((k,i)=>`<img src="${IMG(k)}" data-k="${k}" class="${i?"":"on"}" alt="">`).join("")}</div>`:""}</div>`:""}<div class="tx"><div class="cat">${esc(p.category)}</div><h3>${esc(p.title)}</h3>${p.description?`<p>${esc(p.description)}</p>`:""}${p.scope&&p.scope.length?`<h4>Yapılan işler</h4>${list(p.scope)}`:""}<dl class="spec">${spec.map(r=>`<dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd>`).join("")}</dl><a class="btn btn-gold" href="index.html#iletisim" data-close>Benzer bir proje için bize ulaşın</a></div></div>`);
}
function renderStats(all){
  const el=$("#stats");if(!el)return;
  const done=all.filter(p=>p.status==="Tamamlandı").length,on=all.length-done;
  const it=[[done,"Tamamlanan proje"],[on,"Devam eden proje"],[(C?C.services.length:8),"Hizmet alanı"]].filter(x=>x[0]>0);
  if(!all.length||!it.length){el.hidden=true;return}
  el.querySelector(".wrap").innerHTML=it.map((x,i)=>`<div class="st rv" style="--d:${i*.1}s"><b data-n="${x[0]}">0</b><span>${x[1]}</span></div>`).join("");
  el.hidden=false;observe();
}
async function initProjects(){
  const root=$("[data-projects]");if(!root)return;
  const limit=+root.dataset.limit||0,fbox=$("[data-filters]");
  const all=await getJSON("/api/projects",6000);
  renderStats(all||[]);
  if(all===null){if(limit)root.closest("section").hidden=true;else root.innerHTML='<div class="empty">Projeler şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.</div>';return}
  if(limit&&!all.length){root.closest("section").hidden=true;return}
  let cat="";
  const draw=()=>{
    let l=all.filter(p=>!cat||p.category===cat);if(limit)l=l.slice(0,limit);
    root.innerHTML=l.length?l.map(card).join(""):'<div class="empty">Bu kategoride henüz proje yok.</div>';
    root.querySelectorAll(".pc").forEach(b=>b.onclick=()=>openProject(all.find(p=>p.id===b.dataset.id)));observe();
  };
  if(fbox){
    const cats=[...new Set(all.map(p=>p.category))];
    fbox.innerHTML=[["","Tümü"],...cats.map(c=>[c,c])].map(([v,t])=>`<button aria-pressed="${v===cat}" data-v="${esc(v)}">${esc(t)}</button>`).join("");
    fbox.onclick=e=>{const b=e.target.closest("button");if(!b)return;cat=b.dataset.v;fbox.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()};
    if(!cats.length)fbox.hidden=true;
  }
  draw();
}

/* start */
(async()=>{
  const saved=await getJSON("/api/content");
  renderContent(merge(DEFAULTS,saved));
  initProjects();observe();
})();
