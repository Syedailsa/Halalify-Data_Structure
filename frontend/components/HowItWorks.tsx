// "use client";
// import { useEffect, useRef } from "react";

// const STEPS = [
//   { num: "01", title: "Input Product", desc: "Scan barcode, upload image, type name, or use voice search", icon: "📱" },
//   { num: "02", title: "System Check", desc: "Our database searches for verified halal certifications", icon: "🔍" },
//   { num: "03", title: "AI Analysis", desc: "If not found, AI performs web search and ingredient analysis", icon: "🤖" },
//   { num: "04", title: "Get Results", desc: "Receive instant halal, haram, or mashbooh status with details", icon: "✅" },
// ];

// export default function HowItWorks() {
//   const ref = useRef<HTMLElement>(null);

//   useEffect(() => {
//     const obs = new IntersectionObserver(entries => {
//       entries.forEach(e => {
//         if (e.isIntersecting) {
//           e.target.querySelectorAll(".reveal, .step-reveal").forEach((el, i) => {
//             setTimeout(() => el.classList.add("visible"), i * 100);
//           });
//         }
//       });
//     }, { threshold: 0.2 });
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <section ref={ref} className="hiw-section" id="how-it-works">
//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>
//         {/* Header */}
//         <div className="reveal" style={{ textAlign: "center", marginBottom: "3.5rem" }}>
//           <span style={{
//             fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
//             color: "#6b7280", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(255,255,255,0.6)",
//             borderRadius: 999, padding: "5px 14px", display: "inline-block", marginBottom: 16
//           }}>
//             A Seamless Process to Verify Halal Status
//           </span>
//           <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#111", marginBottom: 10, letterSpacing: "-0.02em" }}>
//             How It Works
//           </h2>
//           <p style={{ fontSize: "0.95rem", color: "#6b7280" }}>Simple, fast, and accurate verification in 4 easy steps</p>
//         </div>

//         {/* Steps */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem" }}>
//           {STEPS.map((s, i) => (
//             <div
//               key={s.num}
//               className="step-card reveal"
//               style={{ transitionDelay: `${i * 80}ms` }}
//             >
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
//                 <div className="step-num">{s.num}</div>
//                 <span style={{ fontSize: "1.6rem" }}>{s.icon}</span>
//               </div>
//               <div className="step-title">{s.title}</div>
//               <div className="step-desc">{s.desc}</div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }












// "use client";
// import { useEffect, useRef, useState } from "react";

// const STEPS = [
//   {
//     num: "01",
//     title: "Input Product",
//     desc: "Scan barcode, upload image, type name, or use voice search",
//   },
//   {
//     num: "02",
//     title: "System Check",
//     desc: "Our database searches for verified halal certifications",
//   },
//   {
//     num: "03",
//     title: "AI Analysis",
//     desc: "If not found, AI performs web search and ingredient analysis",
//   },
//   {
//     num: "04",
//     title: "Get Results",
//     desc: "Receive instant halal, haram, or mashbooh status with details",
//   },
// ];

// export default function HowItWorks() {
//   const ref = useRef<HTMLElement>(null);
//   const [started, setStarted] = useState(false);

//   useEffect(() => {
//     const obs = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((e) => {
//           if (e.isIntersecting) setStarted(true);
//         });
//       },
//       { threshold: 0.2 }
//     );
//     if (ref.current) obs.observe(ref.current);
//     return () => obs.disconnect();
//   }, []);

//   return (
//     <section
//       ref={ref}
//       id="how-it-works"
//       style={{
//         /*
//           IMAGE ANALYSIS:
//           - Top 70%: near-white #f8fffa center, barely-mint edges
//           - Bottom 30%: solid medium green #6abf7a left → #5db56a right
//           - Transition: smooth linear fade between them
//         */
//         background: `linear-gradient(
//           to bottom,
//           #f0faf3 0%,
//           #f0faf3 45%,
//           #9ed9ac 68%,
//           #6abf7a 80%,
//           #5cb86a 100%
//         )`,
//         padding: "5rem 0 6rem",
//       }}
//     >
//       <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>

//         {/* Header */}
//         <div
//           style={{
//             textAlign: "center",
//             marginBottom: "3.5rem",
//             opacity: started ? 1 : 0,
//             transform: started ? "translateY(0)" : "translateY(24px)",
//             transition: "opacity 0.6s ease, transform 0.6s ease",
//           }}
//         >
//           <span
//             style={{
//               fontSize: "0.68rem",
//               fontWeight: 700,
//               letterSpacing: "0.12em",
//               textTransform: "uppercase",
//               color: "#333",
//               border: "1px solid rgba(0,0,0,0.13)",
//               background: "rgba(255,255,255,0.7)",
//               borderRadius: 999,
//               padding: "6px 18px",
//               display: "inline-block",
//               marginBottom: 20,
//             }}
//           >
//             A Seamless Process to Verify Halal Status
//           </span>

//           <h2
//             style={{
//               fontSize: "clamp(2rem, 4vw, 3.2rem)",
//               fontWeight: 900,
//               color: "#111",
//               margin: "0 0 14px",
//               letterSpacing: "-0.02em",
//               lineHeight: 1.1,
//             }}
//           >
//             How It Works
//           </h2>

//           <p style={{ fontSize: "1rem", color: "#445", margin: 0 }}>
//             Simple, fast, and accurate verification in 4 easy steps
//           </p>
//         </div>

//         {/* Steps Grid */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(4, 1fr)",
//             gap: "1.25rem",
//             alignItems: "start",
//           }}
//         >
//           {STEPS.map((s, i) => (
//             <div
//               key={s.num}
//               style={{
//                 position: "relative",
//                 paddingTop: "22px",
//                 opacity: started ? 1 : 0,
//                 transform: started ? "translateY(0)" : "translateY(40px)",
//                 transition: `opacity 0.6s ease ${i * 110 + 200}ms, transform 0.6s ease ${i * 110 + 200}ms`,
//               }}
//             >
//               {/* Number bubble */}
//               <div
//                 style={{
//                   position: "absolute",
//                   top: 0,
//                   left: "1.4rem",
//                   width: 44,
//                   height: 44,
//                   borderRadius: "50%",
//                   background: "rgba(255,255,255,0.4)",
//                   backdropFilter: "blur(10px)",
//                   WebkitBackdropFilter: "blur(10px)",
//                   border: "1.5px solid rgba(255,255,255,0.6)",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   fontSize: "0.95rem",
//                   fontWeight: 900,
//                   color: "#1a6e2a",
//                   zIndex: 2,
//                 }}
//               >
//                 {s.num}
//               </div>

//               {/* Card — flat bright green, no gradient */}
//               <div
//                 style={{
//                   background: "#3dd95c",
//                   borderRadius: "18px",
//                   padding: "2.8rem 1.5rem 2rem",
//                   minHeight: "270px",
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "1.1rem",
//                 }}
//               >
//                 <div
//                   style={{
//                     fontSize: "1.25rem",
//                     fontWeight: 900,
//                     color: "#fff",
//                     letterSpacing: "-0.01em",
//                     lineHeight: 1.25,
//                   }}
//                 >
//                   {s.title}
//                 </div>

//                 <div
//                   style={{
//                     height: "1px",
//                     background: "rgba(255,255,255,0.3)",
//                     flexShrink: 0,
//                   }}
//                 />

//                 <div
//                   style={{
//                     fontSize: "0.9rem",
//                     color: "rgba(255,255,255,0.87)",
//                     lineHeight: 1.65,
//                   }}
//                 >
//                   {s.desc}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//       </div>
//     </section>
//   );
// }







"use client";
import { useEffect, useRef, useState } from "react";
import background from "../assests/Ellipse-31.svg";


const STEPS = [
  {
    num: "01",
    title: "Input Product",
    desc: "Scan barcode, upload image, type name, or use voice search",
  },
  {
    num: "02",
    title: "System Check",
    desc: "Our database searches for verified halal certifications",
  },
  {
    num: "03",
    title: "AI Analysis",
    desc: "If not found, AI performs web search and ingredient analysis",
  },
  {
    num: "04",
    title: "Get Results",
    desc: "Receive instant halal, haram, or mashbooh status with details",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setStarted(true);
        });
      },
      { threshold: 0.2 }
    );

    if (ref.current) obs.observe(ref.current);

    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="how-it-works"
      style={{
        position: "relative",
        overflow: "hidden",

        /* EXACT reference-style background */
        backgroundColor: "#f7fdf8",
        backgroundImage: `url(${background.src})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left top",
        backgroundSize: "cover",

        padding: "5rem 0 6rem",
      }}
    >
      {/* Soft mint glow overlay for premium reference match */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 12%, rgba(83,255,130,0.16), transparent 34%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 2.5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "3.5rem",
            opacity: started ? 1 : 0,
            transform: started ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#333",
              border: "1px solid rgba(0,0,0,0.13)",
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderRadius: 999,
              padding: "6px 18px",
              display: "inline-block",
              marginBottom: 20,
            }}
          >
            A Seamless Process to Verify Halal Status
          </span>

          <h2
            style={{
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              fontWeight: 900,
              color: "#111",
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            How It Works
          </h2>

          <p
            style={{
              fontSize: "1rem",
              color: "#445",
              margin: 0,
            }}
          >
            Simple, fast, and accurate verification in 4 easy steps
          </p>
        </div>

        {/* Steps Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              style={{
                position: "relative",
                paddingTop: "22px",
                opacity: started ? 1 : 0,
                transform: started ? "translateY(0)" : "translateY(40px)",
                transition: `opacity 0.6s ease ${
                  i * 110 + 200
                }ms, transform 0.6s ease ${i * 110 + 200}ms`,
              }}
            >
              {/* Number Bubble */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "1.4rem",
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.45)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  border: "1.5px solid rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.95rem",
                  fontWeight: 900,
                  color: "#1a6e2a",
                  zIndex: 2,
                  boxShadow: "0 8px 20px rgba(61,217,92,0.12)",
                }}
              >
                {s.num}
              </div>

              {/* Step Card */}
              <div
                style={{
                  background: "#22d95f",
                  borderRadius: "20px",
                  padding: "2.8rem 1.5rem 2rem",
                  minHeight: "270px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.1rem",
                  boxShadow:
                    "0 20px 45px rgba(61,217,92,0.18), 0 4px 14px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.25,
                  }}
                >
                  {s.title}
                </div>

                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.3)",
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.65,
                  }}
                >
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

