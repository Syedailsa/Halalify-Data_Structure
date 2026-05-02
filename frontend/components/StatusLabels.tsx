"use client";
import { useEffect, useRef } from "react";

const LABELS = [
  {
    name: "Halal", nameBg: "#f0fdf4", border: "#86efac",
    titleColor: "#14532d", descColor: "#166534",
    desc: "Verified safe and permissible for consumption according to Islamic law",
    sealRing: "#16a34a", sealFill: "rgba(34,197,94,0.08)", arabic: "حلال", sub: "100% HALAL PRODUCTS",
  },
  {
    name: "Haram", nameBg: "#fff1f2", border: "#fecaca",
    titleColor: "#7f1d1d", descColor: "#991b1b",
    desc: "Contains prohibited ingredients or substances not allowed in Islam",
    sealRing: "#dc2626", sealFill: "rgba(239,68,68,0.07)", arabic: "حرام", sub: "100% HARAM PRODUCTS",
  },
  {
    name: "Mashbooh", nameBg: "#fffbeb", border: "#fed7aa",
    titleColor: "#78350f", descColor: "#92400e",
    desc: "Doubtful status — requires verification from local certifying bodies",
    sealRing: "#ea580c", sealFill: "rgba(249,115,22,0.07)", arabic: "مشبوه", sub: "100% MASHBOOH",
  },
];

function Seal({ label }: { label: typeof LABELS[0] }) {
  const r = label.sealRing;
  return (
    <svg viewBox="0 0 130 130" style={{ width: 130, height: 130, flexShrink: 0 }}>
      {/* outer ring */}
      <circle cx="65" cy="65" r="61" fill="none" stroke={r} strokeWidth="1.5" opacity="0.3"/>
      {/* ticks */}
      {Array.from({length:32}).map((_,i) => {
        const a = (i*360/32)*Math.PI/180;
        return <line key={i} x1={65+57*Math.cos(a)} y1={65+57*Math.sin(a)} x2={65+62*Math.cos(a)} y2={65+62*Math.sin(a)} stroke={r} strokeWidth="1.5" opacity="0.45"/>;
      })}
      {/* dashed inner */}
      <circle cx="65" cy="65" r="53" fill="none" stroke={r} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4"/>
      {/* fill */}
      <circle cx="65" cy="65" r="48" fill={label.sealFill}/>
      <circle cx="65" cy="65" r="48" fill="none" stroke={r} strokeWidth="1" opacity="0.25"/>
      {/* arabic text */}
      <text x="65" y="60" textAnchor="middle" fill={r} fontSize="20" fontWeight="700" fontFamily="serif">{label.arabic}</text>
      <text x="65" y="75" textAnchor="middle" fill={r} fontSize="5.5" fontWeight="600" letterSpacing="0.5" fontFamily="sans-serif">100%</text>
      <text x="65" y="84" textAnchor="middle" fill={r} fontSize="4.8" fontWeight="600" letterSpacing="0.3" fontFamily="sans-serif">{label.sub}</text>
    </svg>
  );
}

export default function StatusLabels() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((el,i) => setTimeout(()=>el.classList.add("visible"), i*110)); });
    }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="status-section">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 999,
            padding: "5px 14px", display: "inline-block", marginBottom: 16
          }}>
            Halal Status at a Glance with Clear, Reliable Labels
          </span>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#111", letterSpacing: "-0.02em" }}>
            Understanding Status Labels
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
          {LABELS.map((l, i) => (
            <div
              key={l.name}
              className="status-card reveal"
              style={{ background: l.nameBg, borderColor: l.border, transitionDelay: `${i*100}ms` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 40px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
            >
              <Seal label={l} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 900, color: l.titleColor, marginTop: "1rem", marginBottom: "0.5rem" }}>{l.name}</h3>
              <p style={{ fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.65 }}>{l.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
