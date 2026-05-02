// "use client";
// import { useEffect, useRef, useState } from "react";

// const STATS = [
//   { label: "Verified Products", end: 50000, suffix: "+", display: "50,000+", dark: false, icon: "🏆" },
//   { label: "Active Users",      end: 100,   suffix: "K+", display: "100K+",   dark: true,  icon: "🔗" },
//   { label: "Certification Bodies", end: 25, suffix: "+", display: "25+",    dark: false, icon: "🏆" },
//   { label: "Average Response",  end: 0,     suffix: "<1Sec", display: "<1Sec", dark: true,  icon: "🔗" },
// ];

// function useCounter(end: number, started: boolean, duration = 1800) {
//   const [val, setVal] = useState(0);
//   useEffect(() => {
//     if (!started || end === 0) return;
//     const start = Date.now();
//     const tick = () => {
//       const elapsed = Date.now() - start;
//       const progress = Math.min(elapsed / duration, 1);
//       const eased = 1 - Math.pow(1 - progress, 3);
//       setVal(Math.floor(eased * end));
//       if (progress < 1) requestAnimationFrame(tick);
//     };
//     requestAnimationFrame(tick);
//   }, [started, end, duration]);
//   return val;
// }

// function StatCard({ stat, started, idx }: { stat: typeof STATS[0]; started: boolean; idx: number }) {
//   const count = useCounter(stat.end, started);

//   const displayVal = () => {
//     if (stat.end === 0) return stat.display;
//     if (stat.suffix === "K+") return `${count}K+`;
//     if (stat.suffix === "+") {
//       if (stat.end >= 10000) return `${count.toLocaleString()}+`;
//       return `${count}+`;
//     }
//     return stat.display;
//   };

//   return (
//     <div
//       className={`stat-card ${stat.dark ? "black-card" : "green-card"}`}
//       style={{
//         opacity: started ? 1 : 0,
//         transform: started ? "translateY(0)" : "translateY(40px)",
//         transition: `opacity 0.6s ease ${idx*120}ms, transform 0.6s ease ${idx*120}ms`,
//       }}
//     >
//       <div className="stat-pill">{stat.label}</div>
//       <div className="stat-icon">{stat.icon}</div>
//       <div className="stat-num">{displayVal()}</div>
//     </div>
//   );
// }

// export default function TrustStats() {
//   const ref = useRef<HTMLElement>(null);
//   const [started, setStarted] = useState(false);

//   useEffect(() => {
//     const obs = new IntersectionObserver(es => {
//       es.forEach(e => { if (e.isIntersecting) { setStarted(true); e.target.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible")); }});
//     }, { threshold: 0.3 });
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <section ref={ref} className="trust-section" id="trust">
//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>
//         <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
//           <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#111", letterSpacing: "-0.02em" }}>
//             Trusted by{" "}
//             <span style={{ color: "rgba(17,17,17,0.2)" }}>Thousands</span>
//           </h2>
//         </div>
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
//           {STATS.map((s, i) => <StatCard key={s.label} stat={s} started={started} idx={i} />)}
//         </div>
//       </div>
//     </section>
//   );
// }














"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { label: "VERIFIED PRODUCTS", end: 50000, suffix: "+", display: "50,000+", dark: false },
  { label: "ACTIVE USERS",      end: 100,   suffix: "K+", display: "100K+",   dark: true  },
  { label: "CERTIFICATION BODIES", end: 25, suffix: "+", display: "25+",    dark: false },
  { label: "AVERAGE RESPONSE",  end: 0,     suffix: "",   display: "<1Sec",   dark: true  },
];

function useCounter(end: number, started: boolean, duration = 1800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!started || end === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);
  return val;
}

const TrophyIcon = ({ color }: { color: string }) => (
  <svg width="72" height="72" viewBox="-50 -45 100 90" fill="none">
    <path d="M-22,-32 L22,-32 L22,-4 Q22,18 0,24 Q-22,18 -22,-4 Z" fill={color}/>
    <path d="M-22,-24 L-34,-24 Q-42,-24 -42,-14 Q-42,-4 -32,-4 L-22,-4"
      fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    <path d="M22,-24 L34,-24 Q42,-24 42,-14 Q42,-4 32,-4 L22,-4"
      fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
    <rect x="-5" y="24" width="10" height="12" fill={color}/>
    <rect x="-18" y="36" width="36" height="7" rx="3.5" fill={color}/>
  </svg>
);

const TagIcon = ({ color }: { color: string }) => (
  <svg width="72" height="72" viewBox="-55 -38 100 76" fill="none">
    <path
      d="M-28,-28 L4,-28 Q12,-28 18,-22 L34,-6 Q40,0 34,6 L18,22 Q12,28 4,28 L-28,28 Q-36,28 -36,20 L-36,-20 Q-36,-28 -28,-28 Z"
      fill={color}
    />
    <circle cx="-20" cy="-16" r="5" fill="#111"/>
    <path d="M-38,-10 Q-46,-10 -46,0 Q-46,10 -38,10"
      fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

function StatCard({ stat, started, idx }: { stat: typeof STATS[0]; started: boolean; idx: number }) {
  const count = useCounter(stat.end, started);

  const displayVal = () => {
    if (stat.end === 0) return stat.display;
    if (stat.suffix === "K+") return `${count}K+`;
    if (stat.suffix === "+") {
      if (stat.end >= 10000) return `${count.toLocaleString()}+`;
      return `${count}+`;
    }
    return stat.display;
  };

  const bg = stat.dark ? "#111" : "#7ED957";
  const textColor = stat.dark ? "#fff" : "#111";
  const pillBg = stat.dark ? "#7ED957" : "#fff";
  const pillText = "#111";
  const iconColor = stat.dark ? "#7ED957" : "rgba(0,0,0,0.22)";

  return (
    <div
      style={{
        background: bg,
        borderRadius: "20px",
        padding: "2rem 1.75rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        opacity: started ? 1 : 0,
        transform: started ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.6s ease ${idx * 120}ms, transform 0.6s ease ${idx * 120}ms`,
        minHeight: "220px",
      }}
    >
      {/* Pill label */}
      <div style={{ display: "inline-flex", alignSelf: "flex-start" }}>
        <span style={{
          background: pillBg,
          color: pillText,
          borderRadius: "999px",
          padding: "0.35rem 1rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}>
          {stat.label}
        </span>
      </div>

      {/* Icon */}
      <div style={{ marginTop: "0.25rem" }}>
        {stat.dark
          ? <TagIcon color={iconColor} />
          : <TrophyIcon color={iconColor} />
        }
      </div>

      {/* Number */}
      <div style={{
        fontSize: "clamp(2.2rem, 3.5vw, 3rem)",
        fontWeight: 900,
        color: textColor,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        marginTop: "auto",
      }}>
        {displayVal()}
      </div>
    </div>
  );
}

export default function TrustStats() {
  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setStarted(true); });
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} style={{ background: "#f5f5f5", padding: "5rem 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            color: "#111",
            letterSpacing: "-0.02em",
            margin: 0,
          }}>
            Trusted by{" "}
            <span style={{ color: "rgba(17,17,17,0.18)" }}>Thousands</span>
          </h2>
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1.25rem",
        }}>
          {STATS.map((s, i) => (
            <StatCard key={s.label} stat={s} started={started} idx={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
