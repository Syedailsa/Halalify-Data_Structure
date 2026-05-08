


// "use client";
// import { useEffect, useRef, useState } from "react";
// import type { StaticImageData } from "next/image";
// import Barcode from "../assests/scan.png";
// import VoiceAss from "../assests/VoiceAssestend.png";

// const FEATURES = [
//   {
//     id: "barcode",
//     label: "Barcode Scan",
//     icon: "▦",
//     badge: "BARCODE SCAN",
//     title: "Real-time halal status with a single scan",
//     desc: "Quickly scan any product barcode and get immediate halal verification. Our system analyzes product databases and ingredient information in real time, helping you make fast and confident decisions while shopping.",
//     bg: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
//     image: Barcode, // ✅ sirf Barcode — curly braces nahi
//   },
//   {
//     id: "image",
//     label: "Image Upload",
//     icon: "◫",
//     badge: "IMAGE UPLOAD",
//     title: "Upload product photos for smart ingredient detection",
//     desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
//     bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
//     image: Barcode, // ✅
//   },
//   {
//     id: "voice",
//     label: "Voice Assistent",
//     icon: "◎",
//     badge: "VOICE CHAT WITH AGENT",
//     title: "Hands-free halal checking with voice assistance",
//     desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
//     bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
//     image: VoiceAss, // ✅
//   },
// ];

// function PhoneBox({ bg, image }: { bg: string; image: StaticImageData | string }) {
//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "100%",
//         minHeight: 380,
//         background: bg,
//         borderRadius: 24,
//         overflow: "hidden",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: "32px 28px",
//       }}
//     >
//       {/* Sparkle corner decoration */}
//       <div
//         style={{
//           position: "absolute",
//           bottom: 16,
//           right: 18,
//           color: "rgba(255,255,255,0.4)",
//           fontSize: 22,
//           lineHeight: 1,
//           zIndex: 2,
//         }}
//       >
//         ✦
//       </div>

//       {/* Image */}
//       <img
//         src={typeof image === "string" ? image : image.src} // ✅ StaticImageData handle
//         alt="feature screenshot"
//         style={{
//           width: "100%",
//           height: "100%",
//           objectFit: "contain",
//           position: "absolute",
//           inset: 0,
//           padding: "20px 24px",
//         }}
//       />
//     </div>
//   );
// }

// export default function Features() {
//   const [activeTab, setActiveTab] = useState(0);
//   const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((e) => {
//           if (e.isIntersecting) {
//             e.target
//               .querySelectorAll(".reveal")
//               .forEach((el) => el.classList.add("visible"));
//             const idx = sectionRefs.current.findIndex((r) => r === e.target);
//             if (idx >= 0) setActiveTab(idx);
//           }
//         });
//       },
//       { threshold: 0.4 }
//     );
//     sectionRefs.current.forEach((r) => {
//       if (r) observer.observe(r);
//     });
//     return () => observer.disconnect();
//   }, []);

//   return (
//     <div id="features">
//       {/* Sticky tabs bar */}
//       <div className="tabs-sticky">
//         <div className="tabs-inner">
//           {FEATURES.map((f, i) => (
//             <button
//               key={f.id + i}
//               className={`tab-btn ${activeTab === i ? "active" : ""}`}
//               onClick={() => {
//                 setActiveTab(i);
//                 sectionRefs.current[i]?.scrollIntoView({
//                   behavior: "smooth",
//                   block: "center",
//                 });
//               }}
//             >
//               <span style={{ fontSize: 14 }}>{f.icon}</span>
//               {f.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Feature sections */}
//       {FEATURES.map((f, i) => (
//         <div
//           key={f.id + i}
//           ref={(el) => {
//             sectionRefs.current[i] = el;
//           }}
//           style={{
//             padding: "5rem 0",
//             background: "#fff",
//             borderBottom: "1px solid #f8f8f8",
//           }}
//         >
//           <div
//             style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}
//           >
//             <div
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 1fr",
//                 gap: "4rem",
//                 alignItems: "center",
//               }}
//             >
//               {/* Green box with image */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-left" : "from-right"}`}
//                 style={{ order: i % 2 === 0 ? 1 : 2 }}
//               >
//                 <PhoneBox bg={f.bg} image={f.image} />
//               </div>

//               {/* Text */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-right" : "from-left"}`}
//                 style={{
//                   order: i % 2 === 0 ? 2 : 1,
//                   display: "flex",
//                   flexDirection: "column",
//                   gap: "1rem",
//                 }}
//               >
//                 <span className="feat-badge">{f.badge}</span>
//                 <h2 className="feat-title">{f.title}</h2>
//                 <p className="feat-desc">{f.desc}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
















// "use client";
// import { useEffect, useRef, useState } from "react";
// import type { StaticImageData } from "next/image";
// import Barcode from "../assests/scan.png";
// import VoiceAss from "../assests/VoiceAssestend.png";

// const FEATURES = [
//   {
//     id: "barcode",
//     label: "Barcode Scan",
//     icon: "▦",
//     badge: "BARCODE SCAN",
//     title: "Real-time halal status with a single scan",
//     desc: "Quickly scan any product barcode and get immediate halal verification. Our system analyzes product databases and ingredient information in real time, helping you make fast and confident decisions while shopping.",
//     bg: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
//     image: Barcode,
//   },
//   {
//     id: "image",
//     label: "Image Upload",
//     icon: "◫",
//     badge: "IMAGE UPLOAD",
//     title: "Upload product photos for smart ingredient detection",
//     desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
//     bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
//     image: Barcode,
//   },
//   {
//     id: "voice",
//     label: "Voice Assistant",
//     icon: "◎",
//     badge: "VOICE CHAT WITH AGENT",
//     title: "Hands-free halal checking with voice assistance",
//     desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
//     bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
//     image: VoiceAss,
//   },
// ];

// function PhoneBox({ bg, image }: { bg: string; image: StaticImageData | string }) {
//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "100%",
//         minHeight: 280,
//         background: bg,
//         borderRadius: 24,
//         overflow: "hidden",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         padding: "32px 28px",
//       }}
//     >
//       <div style={{ position: "absolute", bottom: 16, right: 18, color: "rgba(255,255,255,0.4)", fontSize: 22, zIndex: 2 }}>✦</div>
//       <img
//         src={typeof image === "string" ? image : image.src}
//         alt="feature screenshot"
//         style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0, padding: "20px 24px" }}
//       />
//     </div>
//   );
// }

// export default function Features() {
//   const [activeTab, setActiveTab] = useState(0);
//   const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((e) => {
//           if (e.isIntersecting) {
//             e.target.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
//             const idx = sectionRefs.current.findIndex((r) => r === e.target);
//             if (idx >= 0) setActiveTab(idx);
//           }
//         });
//       },
//       { threshold: 0.4 }
//     );
//     sectionRefs.current.forEach((r) => { if (r) observer.observe(r); });
//     return () => observer.disconnect();
//   }, []);

//   return (
//     <div id="features">
//       {/* Sticky tabs */}
//       <div className="tabs-sticky">
//         <div className="tabs-inner">
//           {FEATURES.map((f, i) => (
//             <button
//               key={f.id + i}
//               className={`tab-btn ${activeTab === i ? "active" : ""}`}
//               onClick={() => {
//                 setActiveTab(i);
//                 sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
//               }}
//             >
//               <span style={{ fontSize: 14 }}>{f.icon}</span>
//               {f.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Feature sections */}
//       {FEATURES.map((f, i) => (
//         <div
//           key={f.id + i}
//           ref={(el) => { sectionRefs.current[i] = el; }}
//           style={{ padding: "clamp(3rem,6vw,5rem) 0", background: "#fff", borderBottom: "1px solid #f8f8f8" }}
//         >
//           <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,2.5rem)" }}>
//             <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2rem,5vw,4rem)", alignItems: "center" }}>
//               {/* Image box */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-left" : "from-right"} feat-img-col`}
//                 style={{ order: i % 2 === 0 ? 1 : 2 }}
//               >
//                 <PhoneBox bg={f.bg} image={f.image} />
//               </div>

//               {/* Text */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-right" : "from-left"} feat-text-col`}
//                 style={{ order: i % 2 === 0 ? 2 : 1, display: "flex", flexDirection: "column", gap: "1rem" }}
//               >
//                 <span className="feat-badge">{f.badge}</span>
//                 <h2 className="feat-title">{f.title}</h2>
//                 <p className="feat-desc">{f.desc}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       ))}

//       <style>{`
//         @media (max-width: 860px) {
//           .feat-grid {
//             grid-template-columns: 1fr !important;
//             gap: 2rem !important;
//           }
//           .feat-img-col,
//           .feat-text-col {
//             order: unset !important;
//           }
//         }
//         @media (max-width: 480px) {
//           .feat-title { font-size: 1.5rem !important; }
//         }
//       `}</style>
//     </div>
//   );
// }


























"use client";
import { useEffect, useRef, useState } from "react";
import type { StaticImageData } from "next/image";
import Barcode from "../assests/scan.png";
import VoiceAss from "../assests/VoiceAssestend.png";

const FEATURES = [
  {
    id: "barcode",
    label: "Barcode Scan",
    icon: "▦",
    badge: "BARCODE SCAN",
    title: "Real-time halal status with a single scan",
    desc: "Quickly scan any product barcode and get immediate halal verification. Our system analyzes product databases and ingredient information in real time, helping you make fast and confident decisions while shopping.",
    bg: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
    image: Barcode,
  },
  {
    id: "image",
    label: "Image Upload",
    icon: "◫",
    badge: "IMAGE UPLOAD",
    title: "Upload product photos for smart ingredient detection",
    desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
    bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    image: Barcode,
  },
  {
    id: "voice",
    label: "Voice Assistant",
    icon: "◎",
    badge: "VOICE CHAT WITH AGENT",
    title: "Hands-free halal checking with voice assistance",
    desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
    bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
    image: VoiceAss,
  },
];

function PhoneBox({ bg, image }: { bg: string; image: StaticImageData | string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 280,
        background: bg,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
      }}
    >
      <div style={{ position: "absolute", bottom: 16, right: 18, color: "rgba(255,255,255,0.4)", fontSize: 22, zIndex: 2 }}>✦</div>
      <img
        src={typeof image === "string" ? image : image.src}
        alt="feature screenshot"
        style={{ width: "100%", height: "100%", objectFit: "contain", position: "absolute", inset: 0, padding: "20px 24px" }}
      />
    </div>
  );
}

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
            const idx = sectionRefs.current.findIndex((r) => r === e.target);
            if (idx >= 0) setActiveTab(idx);
          }
        });
      },
      { threshold: 0.4 }
    );
    sectionRefs.current.forEach((r) => { if (r) observer.observe(r); });
    return () => observer.disconnect();
  }, []);

  return (
    <div id="features">
      {/* ✅ Sticky tabs — Fully Responsive */}
      <div className="tabs-sticky">
        <div className="tabs-inner">
          {FEATURES.map((f, i) => (
            <button
              key={f.id + i}
              className={`tab-btn ${activeTab === i ? "active" : ""}`}
              onClick={() => {
                setActiveTab(i);
                sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature sections */}
      {FEATURES.map((f, i) => (
        <div
          key={f.id + i}
          ref={(el) => { sectionRefs.current[i] = el; }}
          style={{ padding: "clamp(3rem,6vw,5rem) 0", background: "#fff", borderBottom: "1px solid #f8f8f8" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(1.25rem,4vw,2.5rem)" }}>
            <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(2rem,5vw,4rem)", alignItems: "center" }}>
              {/* Image box */}
              <div
                className={`reveal ${i % 2 === 0 ? "from-left" : "from-right"} feat-img-col`}
                style={{ order: i % 2 === 0 ? 1 : 2 }}
              >
                <PhoneBox bg={f.bg} image={f.image} />
              </div>

              {/* Text */}
              <div
                className={`reveal ${i % 2 === 0 ? "from-right" : "from-left"} feat-text-col`}
                style={{ order: i % 2 === 0 ? 2 : 1, display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <span className="feat-badge">{f.badge}</span>
                <h2 className="feat-title">{f.title}</h2>
                <p className="feat-desc">{f.desc}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        /* ===== STICKY TABS — FULLY RESPONSIVE ===== */
        .tabs-sticky {
          position: sticky;
          top: 0;
          z-index: 100;
          background: #fff;
          // border-bottom: 1px solid #e8e8e8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .tabs-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 8px clamp(1rem, 4vw, 2.5rem);

          /* KEY FIX: flex-wrap wraps tabs to next line on small screens */
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border: 1.5px solid #e2e8f0;
          border-radius: 999px;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;  /* tab text wrap nahi hoga */
          flex-shrink: 0;       /* tab squeeze nahi hoga */
        }

        .tab-btn:hover {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #16a34a;
        }

        .tab-btn.active {
          background: black;
          // border-color: #22c55e;
          color: #fff;
          font-weight: 600;
        }

        /* Mobile: tabs center ho jayen agar wrap hon */
        @media (max-width: 480px) {
          .tabs-inner {
            justify-content: center;
          }
          .tab-btn {
            padding: 7px 14px;
            font-size: 13px;
          }
        }

        /* ===== FEATURE GRID ===== */
        @media (max-width: 860px) {
          .feat-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .feat-img-col,
          .feat-text-col {
            order: unset !important;
          }
        }

        @media (max-width: 480px) {
          .feat-title { font-size: 1.5rem !important; }
        }
      `}</style>
    </div>
  );
}