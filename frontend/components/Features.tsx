// "use client";
// import { useEffect, useRef, useState } from "react";

// const FEATURES = [
//   {
//     id: "barcode",
//     label: "Barcode Scan",
//     icon: "▦",
//     badge: "BARCODE SCAN",
//     title: "Real-time halal status with a single scan",
//     desc: "Quickly scan any product barcode and get immediate halal verification. Our system analyzes product databases and ingredient information in real time, helping you make fast and confident decisions while shopping.",
//     bg: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
//   },
//   {
//     id: "image",
//     label: "Image Upload",
//     icon: "◫",
//     badge: "IMAGE UPLOAD",
//     title: "Upload product photos for smart ingredient detection",
//     desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
//     bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
//   },
//   {
//     id: "voice",
//     label: "Voice Assistent",
//     icon: "◎",
//     badge: "VOICE CHAT WITH AGENT",
//     title: "Hands-free halal checking with voice assistance",
//     desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
//     bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
//   },
// ];

// function PhonePair({ bg }: { bg: string }) {
//   return (
//     <div style={{ position: "relative", width: "100%", minHeight: 380, background: bg, borderRadius: 24, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "32px 28px" }}>
//       {[
//         { mt: 0, title: "Your Journey\nContinues Here" },
//         { mt: 32, title: "Settings" },
//       ].map((p, pi) => (
//         <div key={pi} style={{
//           width: 150, background: "#0f172a", borderRadius: 30,
//           border: "2.5px solid rgba(255,255,255,0.1)",
//           boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
//           overflow: "hidden", marginTop: p.mt, flexShrink: 0,
//         }}>
//           {/* notch */}
//           <div style={{ height: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
//             <div style={{ width: 50, height: 4, background: "#1e293b", borderRadius: 2 }} />
//           </div>
//           {/* content */}
//           <div style={{ padding: "0 10px 10px" }}>
//             {pi === 0 ? (
//               <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
//                 <div style={{ width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg,#fde68a,#f59e0b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🧑‍💻</div>
//                 <div style={{ color: "#e2e8f0", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>Your Journey<br />Continues Here</div>
//                 <div style={{ width: "100%", background: "#7c3aed", borderRadius: 999, padding: "6px 0", textAlign: "center", color: "#fff", fontSize: 8, fontWeight: 700 }}>Sign in</div>
//               </div>
//             ) : (
//               <div>
//                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
//                   <div style={{ width: 30, height: 3, background: "#334155", borderRadius: 2 }} />
//                   <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ec4899)", overflow: "hidden" }} />
//                 </div>
//                 {["Invite settings","Notification","Change password","Help and support","Delete my account"].map((item, i) => (
//                   <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
//                     <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#334155" }} />
//                     <span style={{ fontSize: 7.5, color: "#94a3b8" }}>{item}</span>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//           {/* bottom nav */}
//           {pi === 0 && (
//             <div style={{ display: "flex", justifyContent: "space-around", padding: "6px 8px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
//               {["⊞","⊙","□","▣","◉"].map((ic,i) => (
//                 <span key={i} style={{ fontSize: 8, color: i === 4 ? "#22c55e" : "rgba(255,255,255,0.25)" }}>{ic}</span>
//               ))}
//             </div>
//           )}
//         </div>
//       ))}
//       {/* sparkle */}
//       <div style={{ position: "absolute", bottom: 16, right: 18, color: "rgba(255,255,255,0.4)", fontSize: 22 }}>✦</div>
//     </div>
//   );
// }

// export default function Features() {
//   const [activeTab, setActiveTab] = useState(0);
//   const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

//   useEffect(() => {
//     const observer = new IntersectionObserver(entries => {
//       entries.forEach(e => {
//         if (e.isIntersecting) {
//           e.target.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
//           const idx = sectionRefs.current.findIndex(r => r === e.target);
//           if (idx >= 0) setActiveTab(idx);
//         }
//       });
//     }, { threshold: 0.4 });
//     sectionRefs.current.forEach(r => { if (r) observer.observe(r); });
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
//           ref={el => { sectionRefs.current[i] = el; }}
//           style={{ padding: "5rem 0", background: "#fff", borderBottom: "1px solid #f8f8f8" }}
//         >
//           <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}>
//             <div style={{ display: "grid", gridTemplateColumns: i === 1 ? "1fr 1fr" : "1fr 1fr", gap: "4rem", alignItems: "center" }}>
//               {/* Image - alternates sides */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-left" : "from-right"}`}
//                 style={{ order: i === 1 ? 2 : 1 }}
//               >
//                 <PhonePair bg={f.bg} />
//               </div>

//               {/* Text */}
//               <div
//                 className={`reveal ${i % 2 === 0 ? "from-right" : "from-left"}`}
//                 style={{ order: i === 1 ? 1 : 2, display: "flex", flexDirection: "column", gap: "1rem" }}
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
// import Barcode from "../assests/wmremove-transformed.png";

// const FEATURES = [
//   {
//     id: "barcode",
//     label: "Barcode Scan",
//     icon: "▦",
//     badge: "BARCODE SCAN",
//     title: "Real-time halal status with a single scan",
//     desc: "Quickly scan any product barcode and get immediate halal verification. Our system analyzes product databases and ingredient information in real time, helping you make fast and confident decisions while shopping.",
//     bg: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
//     image: Barcode, // 👈 apni image path yahan lagao
//   },
//   {
//     id: "image",
//     label: "Image Upload",
//     icon: "◫",
//     badge: "IMAGE UPLOAD",
//     title: "Upload product photos for smart ingredient detection",
//     desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
//     bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
//     image: Barcode, // 👈 apni image path yahan lagao
//   },
//   {
//     id: "voice",
//     label: "Voice Assistent",
//     icon: "◎",
//     badge: "VOICE CHAT WITH AGENT",
//     title: "Hands-free halal checking with voice assistance",
//     desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
//     bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
//     image: Barcode, // 👈 apni image path yahan lagao
//   },
// ];

// function PhoneBox({ bg, image }: { bg: string; image: StaticImageData | string } ) {
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

//       {/* Your image goes here */}
//       <img
//         src={image}
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
//               {/* Green box with image — alternates left/right */}
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
    image: Barcode, // ✅ sirf Barcode — curly braces nahi
  },
  {
    id: "image",
    label: "Image Upload",
    icon: "◫",
    badge: "IMAGE UPLOAD",
    title: "Upload product photos for smart ingredient detection",
    desc: "Simply upload an image of a product label, and our AI will analyze ingredients, certifications, and packaging details to determine its halal status. Perfect for products without barcodes or unclear labeling.",
    bg: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    image: Barcode, // ✅
  },
  {
    id: "voice",
    label: "Voice Assistent",
    icon: "◎",
    badge: "VOICE CHAT WITH AGENT",
    title: "Hands-free halal checking with voice assistance",
    desc: "Just speak the product name, and our intelligent voice agent will instantly provide halal verification results. Designed for convenience, this feature makes checking products faster and more accessible than ever.",
    bg: "linear-gradient(135deg, #6ee7b7 0%, #22c55e 100%)",
    image: VoiceAss, // ✅
  },
];

function PhoneBox({ bg, image }: { bg: string; image: StaticImageData | string }) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: 380,
        background: bg,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 28px",
      }}
    >
      {/* Sparkle corner decoration */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 18,
          color: "rgba(255,255,255,0.4)",
          fontSize: 22,
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        ✦
      </div>

      {/* Image */}
      <img
        src={typeof image === "string" ? image : image.src} // ✅ StaticImageData handle
        alt="feature screenshot"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          position: "absolute",
          inset: 0,
          padding: "20px 24px",
        }}
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
            e.target
              .querySelectorAll(".reveal")
              .forEach((el) => el.classList.add("visible"));
            const idx = sectionRefs.current.findIndex((r) => r === e.target);
            if (idx >= 0) setActiveTab(idx);
          }
        });
      },
      { threshold: 0.4 }
    );
    sectionRefs.current.forEach((r) => {
      if (r) observer.observe(r);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div id="features">
      {/* Sticky tabs bar */}
      <div className="tabs-sticky">
        <div className="tabs-inner">
          {FEATURES.map((f, i) => (
            <button
              key={f.id + i}
              className={`tab-btn ${activeTab === i ? "active" : ""}`}
              onClick={() => {
                setActiveTab(i);
                sectionRefs.current[i]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
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
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
          style={{
            padding: "5rem 0",
            background: "#fff",
            borderBottom: "1px solid #f8f8f8",
          }}
        >
          <div
            style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4rem",
                alignItems: "center",
              }}
            >
              {/* Green box with image */}
              <div
                className={`reveal ${i % 2 === 0 ? "from-left" : "from-right"}`}
                style={{ order: i % 2 === 0 ? 1 : 2 }}
              >
                <PhoneBox bg={f.bg} image={f.image} />
              </div>

              {/* Text */}
              <div
                className={`reveal ${i % 2 === 0 ? "from-right" : "from-left"}`}
                style={{
                  order: i % 2 === 0 ? 2 : 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <span className="feat-badge">{f.badge}</span>
                <h2 className="feat-title">{f.title}</h2>
                <p className="feat-desc">{f.desc}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}