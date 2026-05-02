// "use client";
// import { useEffect, useRef, useState } from "react";

// const WORDS = ["Instantly", "Immediately", "Right Now", "In Seconds", "Instantly"];

// export default function Hero() {
//   const [wordIdx, setWordIdx] = useState(0);
//   const [displayed, setDisplayed] = useState("");
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [showHighlight, setShowHighlight] = useState(false);
//   const sectionRef = useRef<HTMLElement>(null);
//   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

//   useEffect(() => {
//     const word = WORDS[wordIdx % WORDS.length];
//     const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };
//     clear();

//     if (!isDeleting) {
//       if (displayed.length < word.length) {
//         timerRef.current = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 85);
//       } else {
//         setShowHighlight(true);
//         timerRef.current = setTimeout(() => {
//           setShowHighlight(false);
//           setTimeout(() => setIsDeleting(true), 300);
//         }, 2200);
//       }
//     } else {
//       if (displayed.length > 0) {
//         timerRef.current = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 52);
//       } else {
//         setIsDeleting(false);
//         setWordIdx(i => i + 1);
//       }
//     }
//     return clear;
//   }, [displayed, isDeleting, wordIdx]);

//   useEffect(() => {
//     const obs = new IntersectionObserver(
//       es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
//       { threshold: 0.1 }
//     );
//     sectionRef.current?.querySelectorAll(".reveal").forEach(el => obs.observe(el));
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <section ref={sectionRef} className="hero-section" id="home">
//       <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 2.5rem" }}>
//         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>

//           {/* LEFT */}
//           <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
//             <div className="reveal" style={{ transitionDelay: "0ms" }}>
//               <span style={{
//                 fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
//                 textTransform: "uppercase", color: "#6b7280",
//                 border: "1px solid #d1d5db", borderRadius: 999, padding: "5px 13px",
//                 display: "inline-block",
//               }}>Finance Solution App</span>
//             </div>

//             <div className="reveal" style={{ transitionDelay: "80ms" }}>
//               <h1 style={{
//                 fontSize: "clamp(2.8rem, 5.2vw, 4.2rem)",
//                 fontWeight: 900, lineHeight: 1.06,
//                 letterSpacing: "-0.025em", color: "#0f172a",
//               }}>
//                 Know What You<br />
//                 Consume<br />
//                 <span className={`word-highlight ${showHighlight ? "active" : ""}`}>
//                   <span className="highlight-bg" />
//                   {displayed || "\u00A0"}
//                   <span className="typewriter-cursor" />
//                 </span>
//               </h1>
//             </div>

//             <div className="reveal" style={{ transitionDelay: "160ms" }}>
//               <p style={{ fontSize: "0.93rem", lineHeight: 1.78, color: "#4b5563", maxWidth: 460 }}>
//                 Verify whether products are <strong style={{ color: "#111" }}>Halal</strong>,{" "}
//                 <strong style={{ color: "#111" }}>Haram</strong>, or{" "}
//                 <strong style={{ color: "#111" }}>Mashbooh</strong> using AI-powered technology.{" "}
//                 Scan, search, or upload —{" "}
//                 <a href="#" style={{ color: "#111", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted" }}>
//                   get instant results
//                 </a>.
//               </p>
//             </div>

//             <div className="reveal" style={{ transitionDelay: "240ms", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
//               {[
//                 { label: "Start Checking", bg: "#fff", color: "#111", border: "2px solid #e5e7eb", shadow: "none", hoverBg: "#f9fafb" },
//                 { label: "Scan Product", bg: "#22c55e", color: "#fff", border: "2px solid #22c55e", shadow: "0 4px 16px rgba(34,197,94,0.35)", hoverBg: "#16a34a" },
//               ].map(btn => (
//                 <a
//                   key={btn.label}
//                   href="#"
//                   style={{
//                     display: "inline-flex", alignItems: "center", gap: 10,
//                     background: btn.bg, border: btn.border, borderRadius: 999,
//                     padding: "11px 22px", fontWeight: 600, fontSize: "0.9rem",
//                     color: btn.color, textDecoration: "none",
//                     boxShadow: btn.shadow,
//                     transition: "all 0.2s ease",
//                   }}
//                   onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.background = btn.hoverBg; }}
//                   onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.background = btn.bg; }}
//                 >
//                   {btn.label}
//                   <span style={{
//                     width: 28, height: 28,
//                     background: btn.label === "Start Checking" ? "#111" : "rgba(255,255,255,0.25)",
//                     borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
//                     color: "#fff",
//                   }}>→</span>
//                 </a>
//               ))}
//             </div>
//           </div>

//           {/* RIGHT */}
//           <div className="reveal from-right" style={{ transitionDelay: "100ms", display: "flex", justifyContent: "center", alignItems: "center" }}>
//             <div style={{ position: "relative", width: 380, height: 580 }}>
//               {/* Phone */}
//               <div style={{ position: "absolute", right: 20, top: 20 }}>

//               </div>

//               {/* Floating widgets */}
//               {/* Driving license - blue, top-left */}
//               <div className="fa" style={{ position: "absolute", top: 24, left: -30, width: 164, background: "rgba(186,230,253,0.88)", border: "1px solid rgba(147,197,253,0.5)", borderRadius: 16, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)", padding: "10px 12px" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
//                   <span style={{ fontSize: 10, fontWeight: 700, color: "#075985" }}>Driving license</span>
//                   <span style={{ fontSize: 9, color: "#0284c7" }}>In 45 days</span>
//                 </div>
//                 <div style={{ display: "flex", gap: 3 }}>
//                   {[1,2,3,4,5,6,7,8].map((_,i) => <div key={i} style={{ flex: 1, height: 20, background: `rgba(14,165,233,${0.2+i*0.08})`, borderRadius: 3 }} />)}
//                 </div>
//               </div>

//               {/* Memento mori - purple, left-mid */}
//               <div className="fb" style={{ position: "absolute", top: 185, left: -55, width: 174, background: "rgba(237,233,254,0.9)", border: "1px solid rgba(196,181,253,0.6)", borderRadius: 16, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)", padding: "10px 12px" }}>
//                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
//                   <span style={{ fontSize: 10, fontWeight: 700, color: "#5b21b6" }}>Memento mori</span>
//                   <span style={{ fontSize: 10, fontWeight: 800, color: "#7c3aed" }}>37%</span>
//                 </div>
//                 <div style={{ display: "flex", gap: 4 }}>
//                   {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 32, background: "rgba(139,92,246,0.42)", borderRadius: 6 }} />)}
//                 </div>
//               </div>

//               {/* The Matrix - dark, bottom-left */}
//               <div className="fc" style={{ position: "absolute", top: 376, left: -42, width: 148, background: "rgba(15,23,42,0.94)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.2)", padding: "10px 12px" }}>
//                 <div style={{ fontSize: 7.5, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>The Matrix Release</div>
//                 <div style={{ fontSize: 12, fontWeight: 800, color: "#22c55e", marginBottom: 5 }}>16%</div>
//                 <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
//                   <div style={{ width: "16%", height: "100%", background: "#22c55e", borderRadius: 2 }} />
//                 </div>
//               </div>

//               {/* Ser... - teal, right */}
//               <div className="fd" style={{ position: "absolute", top: 230, right: -62, width: 138, background: "rgba(204,251,241,0.9)", border: "1px solid rgba(110,231,183,0.5)", borderRadius: 14, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.1)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
//                 <div style={{ width: 28, height: 28, background: "#0891b2", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, flexShrink: 0 }}>✈</div>
//                 <div>
//                   <div style={{ fontSize: 10, fontWeight: 700, color: "#064e3b" }}>Ser...</div>
//                   <div style={{ fontSize: 9, color: "#047857" }}>84%</div>
//                   <div style={{ width: 60, height: 3, background: "rgba(0,0,0,0.1)", borderRadius: 2, marginTop: 3 }}>
//                     <div style={{ width: "84%", height: "100%", background: "#0891b2", borderRadius: 2 }} />
//                   </div>
//                 </div>
//               </div>

//               {/* Renew ID - white dots, bottom-right */}
//               <div className="fa" style={{ position: "absolute", bottom: 28, right: -50, width: 132, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(209,213,219,0.7)", borderRadius: 14, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.08)", padding: "10px 12px" }}>
//                 <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 2 }}>Renew ID</div>
//                 <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 7 }}>In 3 days</div>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 3 }}>
//                   {Array.from({ length: 12 }).map((_,i) => (
//                     <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < 5 ? "#22c55e" : "#e5e7eb" }} />
//                   ))}
//                 </div>
//               </div>

//               {/* Keeping it - yellow, bottom-left */}
//               <div className="fb" style={{ position: "absolute", bottom: 2, left: -22, width: 128, background: "rgba(254,252,232,0.92)", border: "1px solid rgba(253,224,71,0.5)", borderRadius: 14, backdropFilter: "blur(10px)", boxShadow: "0 8px 28px rgba(0,0,0,0.08)", padding: "10px 12px" }}>
//                 <div style={{ fontSize: 10, fontWeight: 700, color: "#78350f", marginBottom: 2 }}>Keeping lo...</div>
//                 <div style={{ fontSize: 9, color: "#b45309", marginBottom: 6 }}>19%</div>
//                 <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 3 }}>
//                   {Array.from({ length: 10 }).map((_,i) => (
//                     <div key={i} style={{ height: 6, borderRadius: 1, background: i < 2 ? "#f59e0b" : "#fef3c7" }} />
//                   ))}
//                 </div>
//               </div>

//               {/* Peach donut widget */}
//               <div className="fc" style={{ position: "absolute", top: 320, left: -68, width: 74, height: 74, background: "rgba(255,237,213,0.85)", border: "1px solid rgba(253,186,116,0.4)", borderRadius: 16, backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                 <svg viewBox="0 0 50 50" style={{ width: 44, height: 44 }}>
//                   <circle cx="25" cy="25" r="16" fill="none" stroke="#fed7aa" strokeWidth="7"/>
//                   <circle cx="25" cy="25" r="16" fill="none" stroke="#fb923c" strokeWidth="7"
//                     strokeDasharray={`${0.35*100} 100`} transform="rotate(-90 25 25)" strokeLinecap="round"/>
//                 </svg>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

































// "use client";

// import { useEffect, useState } from "react";
// import heroImg from "../assests/hero-img.webp";


// const WORDS = ["Instantly", "Immediately", "Right Now", "In Seconds"];

// export default function Hero() {
//   const [wordIdx, setWordIdx] = useState(0);
//   const [displayed, setDisplayed] = useState("");
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [showHighlight, setShowHighlight] = useState(false);

//   useEffect(() => {
//     const word = WORDS[wordIdx % WORDS.length];
//     let timeout: any;

//     if (!isDeleting) {
//       if (displayed.length < word.length) {
//         timeout = setTimeout(() => {
//           setDisplayed(word.slice(0, displayed.length + 1));
//         }, 80);
//       } else {
//         setShowHighlight(true);
//         timeout = setTimeout(() => {
//           setShowHighlight(false);
//           setIsDeleting(true);
//         }, 1800);
//       }
//     } else {
//       if (displayed.length > 0) {
//         timeout = setTimeout(() => {
//           setDisplayed((d) => d.slice(0, -1));
//         }, 50);
//       } else {
//         setIsDeleting(false);
//         setWordIdx((i) => i + 1);
//       }
//     }

//     return () => clearTimeout(timeout);
//   }, [displayed, isDeleting, wordIdx]);

//   return (
//     <section
//       className="relative min-h-screen flex items-center px-6"
//       style={{
//         backgroundImage:  `url(${heroImg.src})`, 
//         backgroundSize: "cover",
//         backgroundPosition: "right center",
//         backgroundRepeat: "no-repeat",
//       }}
//     >
//       {/* light overlay for readability */}
//       <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />

//       {/* CONTENT */}
//       <div className="relative z-10 max-w-6xl">
        
//         <span className="text-xs font-semibold tracking-wider uppercase text-gray-500 border border-gray-300 rounded-full px-4 py-1 inline-block mb-5">
//           Finance Solution App
//         </span>

//         <h1 className="text-[clamp(2.8rem,5vw,4rem)] font-black leading-tight text-gray-900">
//           Know What You <br />
//           Consume <br />

//           <span className="relative inline-block">
//             <span
//               className={`absolute inset-[-6px_-14px] bg-green-200 rounded-lg -z-10 origin-left transition-transform duration-500 ${
//                 showHighlight ? "scale-x-100" : "scale-x-0"
//               }`}
//             />

//             {displayed || "\u00A0"}

//             <span className="inline-block w-[3px] h-[0.9em] bg-black ml-1 animate-pulse" />
//           </span>
//         </h1>

//         <p className="mt-5 text-gray-600 max-w-md leading-relaxed">
//           Verify whether products are <b>Halal</b>, <b>Haram</b>, or <b>Mashbooh</b> using AI-powered technology.
//           Scan, search, or upload — get instant results.
//         </p>

//         <div className="mt-6 flex gap-4 flex-wrap">
//           <button className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 bg-white font-semibold hover:-translate-y-1 transition">
//             Start Checking
//             <span className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full">
//               →
//             </span>
//           </button>

//           <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:-translate-y-1 transition">
//             Scan Product
//             <span className="bg-white/30 w-6 h-6 flex items-center justify-center rounded-full">
//               →
//             </span>
//           </button>
//         </div>

//       </div>
//     </section>
//   );
// }








"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import heroImg from "../assests/main.png";
import Link from "next/link";

const WORDS = ["Instantly", "Immediately", "Right Now", "In Seconds"];

export default function Hero() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  useEffect(() => {
    const word = WORDS[wordIdx % WORDS.length];
    let timeout: any;

    if (!isDeleting) {
      if (displayed.length < word.length) {
        timeout = setTimeout(() => {
          setDisplayed(word.slice(0, displayed.length + 1));
        }, 80);
      } else {
        setShowHighlight(true);
        timeout = setTimeout(() => {
          setShowHighlight(false);
          setIsDeleting(true);
        }, 1800);
      }
    } else {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed((d) => d.slice(0, -1));
        }, 50);
      } else {
        setIsDeleting(false);
        setWordIdx((i) => i + 1);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIdx]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#eef2f8] pt-10">

      {/* DIAGONAL BACKGROUND */}
      <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[120%] bg-gradient-to-br from-white to-gray-200 skew-y-[-8deg]" />

      {/* IMAGE RIGHT SIDE */}
      <div className="absolute right-3 bottom-0 w-[1200px] z-10 top-[227px]">
        <Image
          src={heroImg}
          alt="UI"
          className="w-full h-auto object-contain"
          priority
        />
      </div>

      {/* FADE OVERLAY LEFT */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#eef2f8] via-[#eef2f8]/80 to-transparent z-10" />

      {/* CONTENT */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 flex items-center min-h-screen">

        <div className="max-w-xl">

          <span className="text-xs font-semibold tracking-wider uppercase text-gray-500 border border-gray-300 rounded-full px-4 py-1 inline-block mb-5">
            Finance Solution App
          </span>

          <h1 className="text-[clamp(2.8rem,5vw,4rem)] font-black leading-tight text-gray-900">
            Know What You <br />
            Consume <br />

            <span className="relative inline-block">
              <span
                className={`absolute inset-[-6px_-14px] bg-green-200 rounded-lg -z-10 origin-left transition-transform duration-500 ${
                  showHighlight ? "scale-x-100" : "scale-x-0"
                }`}
              />

              {displayed || "\u00A0"}

              <span className="inline-block w-[3px] h-[0.9em] bg-black ml-1 animate-pulse" />
            </span>
          </h1>

          <p className="mt-5 text-gray-600 max-w-md leading-relaxed">
            Verify whether products are <b>Halal</b>, <b>Haram</b>, or <b>Mashbooh</b> using AI-powered technology.
            Scan, search, or upload — get instant results.
          </p>

          <div className="mt-6 flex gap-4 flex-wrap">
            <button className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 bg-white font-semibold hover:-translate-y-1 transition">
               <Link href="/login">Start Checking</Link>
              <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full pb-1">
                →
              </span>
            </button>

           
           <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:-translate-y-1 transition">
               <Link href="/login">Scan Product</Link>
              <span className=" bg-white text-black w-6 h-6 flex items-center justify-center rounded-full pb-1">
                →
              </span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
