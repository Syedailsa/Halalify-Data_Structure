// "use client";
// import { useEffect } from "react";

// export default function GlobalEffects() {
//   useEffect(() => {
//     const dot = document.getElementById("cursor-dot")!;
//     const ring = document.getElementById("cursor-ring")!;
//     const scrollBtn = document.getElementById("scroll-top")!;

//     let ringX = 0, ringY = 0;
//     let dotX = 0, dotY = 0;
//     let raf: number;

//     const onMove = (e: MouseEvent) => {
//       dotX = e.clientX;
//       dotY = e.clientY;
//       dot.style.left = `${dotX}px`;
//       dot.style.top = `${dotY}px`;
//     };

//     const animateRing = () => {
//       ringX += (dotX - ringX) * 0.12;
//       ringY += (dotY - ringY) * 0.12;
//       ring.style.left = `${ringX}px`;
//       ring.style.top = `${ringY}px`;
//       raf = requestAnimationFrame(animateRing);
//     };

//     const onEnter = (e: MouseEvent) => {
//       const el = e.target as HTMLElement;
//       if (el.tagName === "A" || el.tagName === "BUTTON" || el.closest("a") || el.closest("button")) {
//         document.body.classList.add("cursor-hover");
//       }
//     };
//     const onLeave = () => document.body.classList.remove("cursor-hover");

//     const onScroll = () => {
//       if (window.scrollY > 400) {
//         scrollBtn.classList.add("visible");
//       } else {
//         scrollBtn.classList.remove("visible");
//       }
//     };

//     document.addEventListener("mousemove", onMove, { passive: true });
//     document.addEventListener("mouseover", onEnter, { passive: true });
//     document.addEventListener("mouseout", onLeave, { passive: true });
//     window.addEventListener("scroll", onScroll, { passive: true });
//     raf = requestAnimationFrame(animateRing);

//     return () => {
//       document.removeEventListener("mousemove", onMove);
//       document.removeEventListener("mouseover", onEnter);
//       document.removeEventListener("mouseout", onLeave);
//       window.removeEventListener("scroll", onScroll);
//       cancelAnimationFrame(raf);
//     };
//   }, []);

//   return (
//     <>
//       <div id="cursor-dot" />
//       <div id="cursor-ring" />
//       <button
//         id="scroll-top"
//         onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//         aria-label="Scroll to top"
//         style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 700, background: "#22c55e", border: "none" }}
//       >
//         ↑
//       </button>
//     </>
//   );
// }











"use client";
import { useEffect } from "react";

export default function GlobalEffects() {
  useEffect(() => {
    const dot = document.getElementById("cursor-dot")!;
    const ring = document.getElementById("cursor-ring")!;
    const scrollBtn = document.getElementById("scroll-top")!;

    let ringX = 0, ringY = 0;
    let dotX = 0, dotY = 0;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      dotX = e.clientX;
      dotY = e.clientY;
      dot.style.left = `${dotX}px`;
      dot.style.top = `${dotY}px`;
    };

    const animateRing = () => {
      ringX += (dotX - ringX) * 0.12;
      ringY += (dotY - ringY) * 0.12;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      raf = requestAnimationFrame(animateRing);
    };

    const onEnter = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "A" || el.tagName === "BUTTON" || el.closest("a") || el.closest("button")) {
        document.body.classList.add("cursor-hover");
      }
    };
    const onLeave = () => document.body.classList.remove("cursor-hover");

    const onScroll = () => {
      if (window.scrollY > 400) {
        scrollBtn.classList.add("visible");
      } else {
        scrollBtn.classList.remove("visible");
      }
    };

    document.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onEnter, { passive: true });
    document.addEventListener("mouseout", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(animateRing);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onEnter);
      document.removeEventListener("mouseout", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* CURSOR CSS — sirf yahan, globals.css mein nahi */}
      <style>{`
        #cursor-dot {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%, -50%);
          transition: transform 0.08s ease;
        }
        #cursor-ring {
          width: 36px;
          height: 36px;
          border: 1.5px solid rgba(34, 197, 94, 0.5);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%, -50%);
          transition: width 0.2s ease, height 0.2s ease,
                      background 0.2s ease, border-color 0.2s ease;
        }
        body.cursor-hover #cursor-ring {
          width: 54px;
          height: 54px;
          background: rgba(34, 197, 94, 0.08);
          border-color: rgba(34, 197, 94, 0.7);
        }
      `}</style>

      <div id="cursor-dot" />
      <div id="cursor-ring" />

      <button
        id="scroll-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Scroll to top"
        style={{
          color: "#fff",
          fontSize: "1.1rem",
          fontWeight: 700,
          background: "#22c55e",
          border: "none",
        }}
      >
        ↑
      </button>
    </>
  );
}