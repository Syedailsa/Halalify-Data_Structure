"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";
import hero from "../assests/hero2.png";

export default function CTASection() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) e.target.querySelectorAll(".reveal").forEach((el,i)=>setTimeout(()=>el.classList.add("visible"),i*120)); });
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="cta-section relative">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 2rem", textAlign: "center", position: "relative", zIndex: 1 }}>
        {/* Badge */}
        <div className="reveal" style={{ transitionDelay: "0ms", marginBottom: "1.25rem" }}>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999,
            padding: "6px 16px", display: "inline-block"
          }}>Smart. Simple. Seamless.</span>
        </div>

        {/* Headline */}
        <div className="reveal" style={{ transitionDelay: "100ms", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "clamp(2.2rem, 5vw, 2.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
            Start Verifying Your Food Today
          </h2>
        </div>

        {/* Sub */}
        <div className="reveal" style={{ transitionDelay: "200ms", marginBottom: "2.5rem" }}>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem" }}>
            Join thousands of users making informed halal choices every day
          </p>
        </div>

        {/* App store buttons */}
        <div className="reveal" style={{ transitionDelay: "300ms", display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "4rem" }}>
          {[
            { icon: "🍎", top: "Download on the", bottom: "App Store" },
            { icon: "▶", top: "GET IT ON", bottom: "Google Play" },
          ].map(btn => (
            <a key={btn.bottom} href="#" className="store-btn">
              <span style={{ fontSize: btn.icon === "🍎" ? 22 : 18 }}>{btn.icon}</span>
              <div style={{ textAlign: "left" }}>
                <div className="store-btn-small">{btn.top}</div>
                <div className="store-btn-big">{btn.bottom}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Phone mockups */}
        <div className="reveal  " style={{ transitionDelay: "400ms", display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "1.5rem",  }}>
          <Image
  src={hero}
  alt="Halalify UI"
  priority
  className="hero-img "
/>
        </div>
      </div>
    </section>
  );
}
