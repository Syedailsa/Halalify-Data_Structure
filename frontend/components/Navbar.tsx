// "use client";
// import Link from "next/link";
// import { useEffect, useState } from "react";

// export default function Navbar() {
//   const [scrolled, setScrolled] = useState(false);

//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 50);
//     window.addEventListener("scroll", fn, { passive: true });
//     return () => window.removeEventListener("scroll", fn);
//   }, []);

//   return (
//     <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
//       <div className="navbar-inner">
//         <a href="#" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111", textDecoration: "none", letterSpacing: "-0.01em" }}>
//           Halalify
//         </a>

//         <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
//           {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Trust", "#trust"]].map(([label, href]) => (
//             <a key={label} href={href} className="nav-link">
//               <span className="nav-glow" />
//               {label}
//             </a>
//           ))}
//         </div>

//         <div style={{ display: "flex", alignItems: "center", backgroundColor:'white',padding:'5px',borderRadius:'30px' }}>
//           <div className="nav-link" style={{ fontSize: "0.875rem", color: "#374151", padding:'12px' }}>
//             <span className="nav-glow" />
//               <Link href="/login"> Start Checking</Link>
           
//           </div>
//           <a href="#" style={{
//             width: 30, height: 30, background: "#22c55e", borderRadius: "50%",
//             display: "flex", alignItems: "center", justifyContent: "center",
//             color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
//             transition: "background 0.2s, transform 0.2s",
//             flexShrink: 0, marginRight:'5px'
//           }}
//           onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
//           onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}>
//             →
//           </a>
//         </div>
//       </div>
//     </nav>
//   );
// }













"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks: [string, string][] = [
    ["Features", "#features"],
    ["How It Works", "#how-it-works"],
    ["Trust", "#trust"],
  ];

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <a href="#" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111", textDecoration: "none", letterSpacing: "-0.01em" }}>
            Halalify
          </a>

          {/* Desktop links */}
          <div className="nav-links-desktop" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            {navLinks.map(([label, href]) => (
              <a key={label} href={href} className="nav-link">
                <span className="nav-glow" />
                {label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="nav-cta-desktop" style={{ display: "flex", alignItems: "center", backgroundColor: "white", padding: "5px", borderRadius: "30px" }}>
            <div className="nav-link" style={{ fontSize: "0.875rem", color: "#374151", padding: "12px" }}>
              <span className="nav-glow" />
              <Link href="/login">Start Checking</Link>
            </div>
            <a href="#" style={{ width: 30, height: 30, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none", transition: "background 0.2s", flexShrink: 0, marginRight: "5px" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}>
              →
            </a>
          </div>

          {/* Hamburger */}
          <button className={`hamburger ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#111" }} aria-label="Close">✕</button>
        {navLinks.map(([label, href]) => (
          <a key={label} href={href} onClick={() => setMenuOpen(false)} style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111", textDecoration: "none", letterSpacing: "-0.02em" }}>{label}</a>
        ))}
        <Link href="/login" onClick={() => setMenuOpen(false)} style={{ marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: 10, background: "#22c55e", color: "#fff", padding: "14px 28px", borderRadius: "999px", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          Start Checking →
        </Link>
      </div>
    </>
  );
}