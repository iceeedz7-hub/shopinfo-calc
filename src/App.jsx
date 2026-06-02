import { useState } from "react";

const CANAIS = [
  { id: "kabum",        nome: "KaBuM!",         cor: "#FF6500" },
  { id: "shopee",       nome: "Shopee",          cor: "#EE4D2D" },
  { id: "casasbahia",   nome: "Casas Bahia",     cor: "#0066CC" },
  { id: "magalu",       nome: "Magazine Luiza",  cor: "#0086FF" },
  { id: "mercadolivre", nome: "Mercado Livre",   cor: "#FFE600" },
];

const initCanal = () => ({ comissao: "", taxaExtra: "", rebate: "" });
const initForm  = () => ({
  nomeProduto: "", custo: "", imposto: "", sga: "",
  canais: Object.fromEntries(CANAIS.map(c => [c.id, initCanal()])),
});

const C = {
  bg:"#0a0a0b", surface:"#111114", surface2:"#18181c",
  border:"#222228", borderHover:"#333340",
  red:"#e8192c", redGlow:"rgba(232,25,44,0.18)", redDim:"rgba(232,25,44,0.08)",
  text:"#f0f0f5", textMid:"#8888a0", textDim:"#333344",
  green:"#22d47a", yellow:"#ffd84d",
};

const fmt    = n => isNaN(n)||n===null ? "—" : n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const fmtPct = n => isNaN(n)||n===null ? "—" : `${n.toFixed(2).replace(".",",")}%`;

function Field({ label, value, onChange, placeholder, unit, hint, highlight }) {
  const [focused, setFocused] = useState(false);
  const active = focused || highlight;
  return (
    <div>
      <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:highlight?C.red:C.textMid, marginBottom:6, fontFamily:"'DM Sans',sans-serif" }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input type="number" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"0"}
          style={{ width:"100%", background:C.bg, border:`1px solid ${active?(highlight?"#e8192c":C.red):C.border}`, borderRadius:10, padding:"11px 14px", color:C.text, fontSize:14, fontFamily:"'JetBrains Mono',monospace", outline:"none", transition:"all 0.2s", boxSizing:"border-box", boxShadow:active?`0 0 0 3px ${C.redGlow}`:"none" }}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
        {unit && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace", pointerEvents:"none" }}>{unit}</span>}
      </div>
      {hint && <p style={{ fontSize:10, color:C.textDim, marginTop:4, fontFamily:"'DM Sans',sans-serif" }}>{hint}</p>}
    </div>
  );
}

function SectionTitle({ icon, label, title }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:30, height:30, borderRadius:8, background:C.redDim, border:"1px solid rgba(232,25,44,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:C.red }}>{icon}</div>
      <div>
        <div style={{ fontSize:9, letterSpacing:"0.2em", color:C.textDim, fontWeight:700 }}>PASSO {label}</div>
        <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{title}</div>
      </div>
    </div>
  );
}

// Modo 1: calcula preço a partir dos custos
function calcSugerido(form, canalId) {
  const custo    = parseFloat(form.custo)    || 0;
  const imposto  = parseFloat(form.imposto)  || 0;
  const sga      = parseFloat(form.sga)      || 0;
  const canal    = form.canais[canalId];
  const comissao = parseFloat(canal.comissao)  || 0;
  const taxaExtra= parseFloat(canal.taxaExtra) || 0;
  const rebate   = parseFloat(canal.rebate)    || 0;
  if (custo <= 0) return null;
  const totalPct = (imposto + sga + comissao - rebate) / 100;
  if (totalPct >= 1) return null;
  const preco = (custo + taxaExtra) / (1 - totalPct);
  return _montaResult(preco, custo, taxaExtra, comissao, imposto, sga, rebate, form, canalId);
}

// Modo 2: calcula MC/LL a partir do preço informado
function calcSimulado(form, canalId, precoVenda) {
  const custo    = parseFloat(form.custo)    || 0;
  const imposto  = parseFloat(form.imposto)  || 0;
  const sga      = parseFloat(form.sga)      || 0;
  const canal    = form.canais[canalId];
  const comissao = parseFloat(canal.comissao)  || 0;
  const taxaExtra= parseFloat(canal.taxaExtra) || 0;
  const rebate   = parseFloat(canal.rebate)    || 0;
  const preco    = parseFloat(precoVenda)      || 0;
  if (custo <= 0 || preco <= 0) return null;
  return _montaResult(preco, custo, taxaExtra, comissao, imposto, sga, rebate, form, canalId);
}

function _montaResult(preco, custo, taxaExtra, comissao, imposto, sga, rebate, form, canalId) {
  const valorComissao  = preco * (comissao / 100);
  const valorImposto   = preco * (imposto  / 100);
  const valorSGA       = preco * (sga      / 100);
  const valorRebate    = preco * (rebate   / 100);
  const custoTotal     = custo + taxaExtra + valorComissao + valorImposto + valorSGA;
  const receita        = preco + valorRebate;
  const mc             = receita - custoTotal;
  const mcPct          = preco > 0 ? (mc / preco) * 100 : 0;
  return { preco, custoTotal, mc, mcPct, lucroLiquido:mc, llPct:mcPct, valorComissao, valorImposto, valorSGA, valorRebate, taxaExtra, custo };
}

export default function App() {
  const [form, setForm]         = useState(initForm());
  const [abaCanal, setAbaCanal] = useState("kabum");
  const [calculado, setCalculado] = useState(false);
  const [modo, setModo]         = useState("sugerir"); // "sugerir" | "simular"
  const [precoSimulado, setPrecoSimulado] = useState("");

  const setGlobal = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const setCanal  = (cid, field, val) => setForm(f => ({ ...f, canais: { ...f.canais, [cid]: { ...f.canais[cid], [field]: val } } }));

  const canalAtual = CANAIS.find(c => c.id === abaCanal);
  const res = calculado
    ? (modo === "sugerir" ? calcSugerido(form, abaCanal) : calcSimulado(form, abaCanal, precoSimulado))
    : null;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',sans-serif", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:#0a0a0b;} ::-webkit-scrollbar-thumb{background:#e8192c;border-radius:2px;}
        input[type=number]::-webkit-inner-spin-button{opacity:0;} input[type=number]{-moz-appearance:textfield;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        .fade{animation:fadeUp .4s ease both;}
        .canal-tab:hover{border-color:var(--cor)!important;color:var(--cor)!important;}
        .calc-btn:hover{opacity:.88;transform:translateY(-1px);}
        .calc-btn:active{transform:translateY(0);}
        .result-row:hover{background:#18181c!important;}
        .modo-btn:hover{border-color:#e8192c!important;color:#f0f0f5!important;}
      `}</style>

      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:`radial-gradient(#222228 1px,transparent 1px)`, backgroundSize:"28px 28px", opacity:.5 }} />
      <div style={{ position:"fixed", top:0, left:0, right:0, height:300, pointerEvents:"none", zIndex:0, background:`radial-gradient(ellipse 80% 200px at 50% 0%,rgba(232,25,44,0.1) 0%,transparent 100%)` }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:740, margin:"0 auto", padding:"40px 20px 80px" }}>

        {/* HEADER */}
        <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:48 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#e8192c,#a00018)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:"0 4px 20px rgba(232,25,44,0.4)", fontSize:22, fontWeight:900, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>in</div>
          <div>
            <div style={{ fontSize:10, letterSpacing:"0.25em", color:C.red, fontWeight:700, marginBottom:2 }}>SHOPINFO</div>
            <h1 style={{ fontSize:"clamp(22px,5vw,34px)", fontWeight:800, color:C.text, letterSpacing:"-0.03em", lineHeight:1 }}>
              Calculadora de<br/><span style={{ color:C.red }}>Marketplace</span>
            </h1>
          </div>
          <div style={{ marginLeft:"auto", textAlign:"right" }}>
            <div style={{ fontSize:10, color:C.textDim, letterSpacing:"0.1em" }}>MARGEM & LUCRO</div>
            <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>KaBuM · Shopee · C.Bahia<br/>Magalu · Mercado Livre</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

          {/* BLOCO 1 — PRODUTO */}
          <div className="fade" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:24 }}>
            <SectionTitle icon="◉" label="01" title="Dados do Produto" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:20 }}>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={{ display:"block", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:C.textMid, marginBottom:6 }}>Nome do produto</label>
                <input type="text" value={form.nomeProduto} onChange={e=>setGlobal("nomeProduto",e.target.value)}
                  placeholder="ex: Headset Gamer XYZ..."
                  style={{ width:"100%", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, padding:"11px 14px", color:C.text, fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", transition:"all 0.2s", boxSizing:"border-box" }}
                  onFocus={e=>{e.target.style.borderColor=C.red;e.target.style.boxShadow=`0 0 0 3px ${C.redGlow}`;}}
                  onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none";}} />
              </div>
              <Field label="Custo do Produto" value={form.custo} onChange={v=>setGlobal("custo",v)} placeholder="0,00" unit="R$" />
              <Field label="Imposto" value={form.imposto} onChange={v=>setGlobal("imposto",v)} placeholder="0,00" unit="%" hint="% sobre o preço de venda" />
              <Field label="SG&A" value={form.sga} onChange={v=>setGlobal("sga",v)} placeholder="0,00" unit="%" hint="Despesas operacionais %" />
            </div>
          </div>

          {/* BLOCO 2 — CANAL */}
          <div className="fade" style={{ animationDelay:"0.06s" }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {CANAIS.map(c => (
                <button key={c.id} className="canal-tab" onClick={()=>{ setAbaCanal(c.id); setCalculado(false); }}
                  style={{ "--cor":c.cor, padding:"8px 16px", borderRadius:100, border:`1px solid ${abaCanal===c.id?c.cor:C.border}`, background:abaCanal===c.id?`${c.cor}18`:C.surface, color:abaCanal===c.id?c.cor:C.textMid, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.2s", fontFamily:"'DM Sans',sans-serif" }}>
                  {c.nome}
                </button>
              ))}
            </div>
            <div style={{ background:C.surface, border:`1px solid ${canalAtual.cor}33`, borderRadius:18, padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:canalAtual.cor, boxShadow:`0 0 8px ${canalAtual.cor}` }} />
                <span style={{ fontSize:13, fontWeight:700, color:canalAtual.cor }}>{canalAtual.nome}</span>
                <span style={{ fontSize:10, color:C.textDim, marginLeft:4, letterSpacing:"0.1em" }}>CONFIGURAÇÃO DO CANAL</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                <Field label="Comissão negociada" value={form.canais[abaCanal].comissao} onChange={v=>setCanal(abaCanal,"comissao",v)} placeholder="0,00" unit="%" hint="% sobre o preço de venda" />
                <Field label="Taxa extra do canal" value={form.canais[abaCanal].taxaExtra} onChange={v=>setCanal(abaCanal,"taxaExtra",v)} placeholder="0,00" unit="R$" hint="Valor fixo em reais" />
                <Field label="Rebate do canal" value={form.canais[abaCanal].rebate} onChange={v=>setCanal(abaCanal,"rebate",v)} placeholder="0,00" unit="%" hint="% de bonificação negociada" />
              </div>
            </div>
          </div>

          {/* BLOCO 3 — MODO DE CÁLCULO */}
          <div className="fade" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:18, padding:24, animationDelay:"0.12s" }}>
            <SectionTitle icon="⇄" label="03" title="Modo de Cálculo" />
            <div style={{ display:"flex", gap:8, marginTop:20, marginBottom: modo==="simular"?20:0 }}>
              {[
                { id:"sugerir", label:"Sugerir preço de venda",     desc:"Calcula o preço ideal a partir dos seus custos" },
                { id:"simular", label:"Simular preço de venda",      desc:"Insira um preço e veja a margem resultante" },
              ].map(m => (
                <button key={m.id} className="modo-btn" onClick={()=>{ setModo(m.id); setCalculado(false); }}
                  style={{ flex:1, padding:"14px 16px", borderRadius:14, border:`1px solid ${modo===m.id?C.red:C.border}`, background:modo===m.id?C.redDim:C.bg, cursor:"pointer", transition:"all 0.2s", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:modo===m.id?C.red:C.textMid, marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:C.textDim }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Campo preço de venda (só aparece no modo simular) */}
            {modo === "simular" && (
              <div style={{ marginTop:4 }}>
                <Field
                  label="Preço de venda"
                  value={precoSimulado}
                  onChange={setPrecoSimulado}
                  placeholder="0,00"
                  unit="R$"
                  hint="Digite o preço que você pratica ou deseja praticar"
                  highlight
                />
              </div>
            )}
          </div>

          {/* BOTÃO CALCULAR */}
          <button className="calc-btn" onClick={()=>setCalculado(true)} style={{ width:"100%", padding:"16px 32px", background:`linear-gradient(135deg,${C.red},#a00018)`, border:"none", borderRadius:14, color:"#fff", fontSize:14, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all 0.2s", boxShadow:`0 4px 24px ${C.redGlow}` }}>
            {modo==="sugerir" ? "Calcular Preço Sugerido →" : "Simular Margem e Lucro →"}
          </button>

          {/* RESULTADO */}
          {calculado && res && (
            <div className="fade" style={{ background:C.surface, border:`1px solid ${canalAtual.cor}44`, borderRadius:20, overflow:"hidden", boxShadow:`0 0 40px ${canalAtual.cor}15` }}>
              <div style={{ background:`linear-gradient(135deg,${canalAtual.cor}18,${canalAtual.cor}05)`, borderBottom:`1px solid ${canalAtual.cor}22`, padding:"24px 28px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:canalAtual.cor }} />
                  <span style={{ fontSize:10, letterSpacing:"0.2em", color:canalAtual.cor, fontWeight:700 }}>
                    {modo==="sugerir"?"PREÇO SUGERIDO":"SIMULAÇÃO"} — {canalAtual.nome.toUpperCase()}
                  </span>
                  {form.nomeProduto && <span style={{ fontSize:11, color:C.textMid, marginLeft:4 }}>· {form.nomeProduto}</span>}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10 }}>
                  {/* Preço de venda */}
                  <div style={{ background:C.bg, borderRadius:14, padding:"18px 20px", border:`1px solid ${C.border}`, gridColumn:"1/-1", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                    <div>
                      <div style={{ fontSize:10, letterSpacing:"0.15em", color:C.textMid, fontWeight:700, marginBottom:6 }}>
                        {modo==="sugerir"?"PREÇO DE VENDA SUGERIDO":"PREÇO DE VENDA SIMULADO"}
                      </div>
                      <div style={{ fontSize:36, fontWeight:800, color:"#fff", fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{fmt(res.preco)}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:10, color:C.textDim, marginBottom:4 }}>Custo total</div>
                      <div style={{ fontSize:18, fontWeight:700, color:C.textMid, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(res.custoTotal)}</div>
                    </div>
                  </div>

                  {/* MC */}
                  <div style={{ background:C.bg, borderRadius:14, padding:"16px 18px", border:`1px solid ${res.mc>=0?"rgba(34,212,122,0.2)":C.border}` }}>
                    <div style={{ fontSize:9, letterSpacing:"0.15em", color:C.textMid, fontWeight:700, marginBottom:8 }}>MARGEM DE CONTRIBUIÇÃO</div>
                    <div style={{ fontSize:28, fontWeight:800, color:res.mc>=0?C.green:C.red, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{fmtPct(res.mcPct)}</div>
                    <div style={{ fontSize:14, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>{fmt(res.mc)}</div>
                  </div>

                  {/* LL */}
                  <div style={{ background:C.bg, borderRadius:14, padding:"16px 18px", border:`1px solid ${res.lucroLiquido>=0?"rgba(34,212,122,0.2)":C.border}` }}>
                    <div style={{ fontSize:9, letterSpacing:"0.15em", color:C.textMid, fontWeight:700, marginBottom:8 }}>LUCRO LÍQUIDO</div>
                    <div style={{ fontSize:28, fontWeight:800, color:res.lucroLiquido>=0?C.green:C.red, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{fmtPct(res.llPct)}</div>
                    <div style={{ fontSize:14, color:C.textMid, fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>{fmt(res.lucroLiquido)}</div>
                  </div>
                </div>
              </div>

              {/* Detalhamento */}
              <div style={{ padding:"20px 28px" }}>
                <div style={{ fontSize:10, letterSpacing:"0.15em", color:C.textDim, fontWeight:700, marginBottom:14 }}>DETALHAMENTO DOS CUSTOS</div>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {[
                    { label:"Custo do produto",   value:res.custo,          pct:(res.custo/res.preco)*100,        color:"#3b82f6" },
                    { label:"Comissão do canal",   value:res.valorComissao,  pct:parseFloat(form.canais[abaCanal].comissao)||0, color:canalAtual.cor },
                    { label:"Taxa extra (R$)",     value:res.taxaExtra,      pct:(res.taxaExtra/res.preco)*100,    color:"#8b5cf6" },
                    { label:"Imposto",             value:res.valorImposto,   pct:parseFloat(form.imposto)||0,      color:"#f59e0b" },
                    { label:"SG&A",                value:res.valorSGA,       pct:parseFloat(form.sga)||0,          color:"#ec4899" },
                    { label:"Rebate (desconto)",   value:-res.valorRebate,   pct:-(parseFloat(form.canais[abaCanal].rebate)||0), color:C.green },
                  ].map(item => (
                    <div key={item.label} className="result-row" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:10, transition:"background 0.15s" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:8, height:8, borderRadius:2, background:item.color, flexShrink:0 }} />
                        <span style={{ fontSize:13, color:C.textMid }}>{item.label}</span>
                      </div>
                      <div style={{ display:"flex", gap:20, alignItems:"center" }}>
                        <span style={{ fontSize:11, color:C.textDim, fontFamily:"'JetBrains Mono',monospace" }}>{fmtPct(item.pct)}</span>
                        <span style={{ fontSize:14, fontWeight:600, color:item.value<0?C.green:C.text, fontFamily:"'JetBrains Mono',monospace", minWidth:90, textAlign:"right" }}>{fmt(Math.abs(item.value))}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Barra de saúde */}
                <div style={{ marginTop:20, padding:"14px 16px", borderRadius:12, background:C.bg, border:`1px solid ${res.mcPct>=15?C.green:res.mcPct>=5?C.yellow:C.red}33` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:C.textMid }}>Saúde da margem</span>
                    <span style={{ fontSize:13, fontWeight:700, color:res.mcPct>=15?C.green:res.mcPct>=5?C.yellow:C.red }}>
                      {res.mcPct>=15?"✦ Saudável":res.mcPct>=5?"⚠ Atenção":"✕ Margem baixa"}
                    </span>
                  </div>
                  <div style={{ marginTop:10, height:6, background:C.border, borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.min(Math.max(res.mcPct,0),40)/40*100}%`, background:res.mcPct>=15?C.green:res.mcPct>=5?C.yellow:C.red, borderRadius:3, transition:"width 1s cubic-bezier(.16,1,.3,1)" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                    <span style={{ fontSize:9, color:C.textDim }}>0%</span>
                    <span style={{ fontSize:9, color:C.textDim }}>15% ideal</span>
                    <span style={{ fontSize:9, color:C.textDim }}>40%+</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {calculado && !res && (
            <div style={{ background:C.surface, border:`1px solid ${C.red}33`, borderRadius:16, padding:24, textAlign:"center" }}>
              <p style={{ color:C.red, fontSize:14 }}>
                {modo==="simular" && !precoSimulado ? "Preencha o preço de venda para simular." : "Preencha o custo do produto para calcular."}
              </p>
            </div>
          )}
        </div>

        <p style={{ textAlign:"center", color:C.textDim, fontSize:11, marginTop:40, fontFamily:"'JetBrains Mono',monospace" }}>shopinfo · calculadora de marketplace</p>
      </div>
    </div>
  );
}
