"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-inner">
        <a href="#" style={{ fontWeight: 800, fontSize: "1.2rem", color: "#111", textDecoration: "none", letterSpacing: "-0.01em" }}>
          Halalify
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Trust", "#trust"]].map(([label, href]) => (
            <a key={label} href={href} className="nav-link">
              <span className="nav-glow" />
              {label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", backgroundColor:'white',padding:'5px',borderRadius:'30px' }}>
          <div className="nav-link" style={{ fontSize: "0.875rem", color: "#374151", padding:'12px' }}>
            <span className="nav-glow" />
              <Link href="/login"> Start Checking</Link>
           
          </div>
          <a href="#" style={{
            width: 30, height: 30, background: "#22c55e", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
            transition: "background 0.2s, transform 0.2s",
            flexShrink: 0, marginRight:'5px'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#16a34a"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#22c55e"; }}>
            →
          </a>
        </div>
      </div>
    </nav>
  );
}
