







// "use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
// import heroImg from "../assests/main.png";
// import Link from "next/link";

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
//     <section className="relative min-h-screen overflow-hidden bg-[#eef2f8] pt-10">

//       {/* DIAGONAL BACKGROUND */}
//       <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[120%] bg-gradient-to-br from-white to-gray-200 skew-y-[-8deg]" />

//       {/* IMAGE RIGHT SIDE */}
//       <div className="absolute right-3 bottom-0 w-[1200px] z-10 top-[227px]">
//         <Image
//           src={heroImg}
//           alt="UI"
//           className="w-full h-auto object-contain"
//           priority
//         />
//       </div>

//       {/* FADE OVERLAY LEFT */}
//       <div className="absolute inset-0 bg-gradient-to-r from-[#eef2f8] via-[#eef2f8]/80 to-transparent z-10" />

//       {/* CONTENT */}
//       <div className="relative z-20 max-w-6xl mx-auto px-6 flex items-center min-h-screen">

//         <div className="max-w-xl">

//           {/* <span className="text-xs font-semibold tracking-wider uppercase text-gray-500 border border-gray-300 rounded-full px-4 py-1 inline-block mb-5">
//             Finance Solution App
//           </span> */}

//           <h1 className="text-[clamp(2.8rem,5vw,4rem)] font-black leading-tight text-gray-900">
//             Know What You <br />
//             Consume <br />

//             <span className="relative inline-block">
//               <span
//                 className={`absolute inset-[-6px_-14px] bg-green-200 rounded-lg -z-10 origin-left transition-transform duration-500 ${
//                   showHighlight ? "scale-x-100" : "scale-x-0"
//                 }`}
//               />

//               {displayed || "\u00A0"}

//               <span className="inline-block w-[3px] h-[0.9em] bg-black ml-1 animate-pulse" />
//             </span>
//           </h1>

//           <p className="mt-5 text-gray-600 max-w-md leading-relaxed">
//             Verify whether products are <b>Halal</b>, <b>Haram</b>, or <b>Mashbooh</b> using AI-powered technology.
//             Scan, search, or upload — get instant results.
//           </p>

//           <div className="mt-6 flex gap-4 flex-wrap">
//             <button className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 bg-white font-semibold hover:-translate-y-1 transition">
//                <Link href="/login">Start Checking</Link>
//               <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full pb-1">
//                 →
//               </span>
//             </button>

           
//            <button className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:-translate-y-1 transition">
//                <Link href="/login">Scan Product</Link>
//               <span className=" bg-white text-black w-6 h-6 flex items-center justify-center rounded-full pb-1">
//                 →
//               </span>
//             </button>
//           </div>

//         </div>
//       </div>
//     </section>
//   );
// }









// "use client";

// import { useEffect, useState } from "react";
// import Image from "next/image";
// import heroImg from "../assests/main.png";
// import Link from "next/link";

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
//     <section className="relative min-h-screen overflow-hidden bg-[#eef2f8] pt-10">

//       {/* DIAGONAL BACKGROUND */}
//       <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[120%] bg-gradient-to-br from-white to-gray-200 skew-y-[-8deg]" />

//       {/* IMAGE RIGHT SIDE */}
//       <div className="absolute right-3 bottom-0 w-[1200px] z-10 top-[227px]">
//         <Image
//           src={heroImg}
//           alt="UI"
//           className="w-full h-auto object-contain"
//           priority
//         />
//       </div>

//       {/* FADE OVERLAY LEFT */}
//       <div className="absolute inset-0 bg-gradient-to-r from-[#eef2f8] via-[#eef2f8]/80 to-transparent z-10" />

//       {/* CONTENT */}
//       <div className="relative z-20 max-w-6xl mx-auto px-6 flex items-center min-h-screen">

//         <div className="max-w-xl">

//           <h1 className="text-[clamp(2.8rem,5vw,4rem)] font-black leading-tight text-gray-900">
//             Know What You <br />
//             Consume <br />

//             <span className="relative inline-block">
//               <span
//                 className={`absolute inset-[-6px_-14px] bg-green-200 rounded-lg -z-10 origin-left transition-transform duration-500 ${
//                   showHighlight ? "scale-x-100" : "scale-x-0"
//                 }`}
//               />
//               {displayed || "\u00A0"}
//               <span className="inline-block w-[3px] h-[0.9em] bg-black ml-1 animate-pulse" />
//             </span>
//           </h1>

//           <p className="mt-5 text-gray-600 max-w-md leading-relaxed">
//             Verify whether products are <b>Halal</b>, <b>Haram</b>, or <b>Mashbooh</b> using AI-powered technology.
//             Scan, search, or upload — get instant results.
//           </p>

//           <div className="mt-6 flex gap-4 flex-wrap">

//             {/* FIXED BUTTON 1 */}
//             <Link href="/login" className="flex items-center gap-2 px-5 py-3 rounded-full border border-gray-300 bg-white font-semibold hover:-translate-y-1 transition">
//               Start Checking
//               <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full pb-1">→</span>
//             </Link>

//             {/* FIXED BUTTON 2 */}
//             <Link href="/login" className="flex items-center gap-2 px-5 py-3 rounded-full bg-green-500 text-white font-semibold shadow-lg hover:-translate-y-1 transition">
//               Scan Product
//               <span className="bg-white text-black w-6 h-6 flex items-center justify-center rounded-full pb-1">→</span>
//             </Link>

//           </div>

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
      {/* <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[120%] bg-gradient-to-br from-white to-gray-200 skew-y-[-8deg]" /> */}

      {/* IMAGE RIGHT SIDE */}
      {/* <div className="absolute right-3 bottom-0 w-[1200px] z-10 top-[227px]">
        <Image
          src={heroImg}
          alt="UI"
          className="w-full h-auto object-contain"
          priority
        />
      </div> */}

      {/* <div className="absolute inset-0 z-10 pointer-events-none">
  <div className="relative w-full max-w-[1400px] h-full mx-auto">

    <div className="absolute right-0 top-[227px] w-[1200px]">
      <Image
        src={heroImg}
        alt="UI"
        className="w-full h-auto object-contain"
        priority
      />
    </div>

  </div>
</div> */}


{/* <div className="absolute inset-0 z-10 pointer-events-none"> */}
<div className="absolute inset-0 z-10 pointer-events-none hero-image-wrapper">
  <div className="relative w-full max-w-[1280px] h-full mx-auto px-6">

    <div className="absolute right-0 top-[227px] w-[1050px]">
      <Image
        src={heroImg}
        alt="UI"
        className="w-full h-auto object-contain"
        priority
      />
    </div>

  </div>
</div>

      {/* FADE OVERLAY LEFT */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#eef2f8] via-[#eef2f8]/80 to-transparent z-10" />

      {/* CONTENT */}
      {/* <div className="relative z-20 max-w-6xl mx-auto px-6 flex items-center min-h-screen"> */}
      <div className="relative z-20 max-w-[1280px] mx-auto px-6 lg:px-10 flex items-center min-h-screen">

        <div className="max-w-xl">

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

          {/* ✅ BUTTONS — All Breakpoints Fixed */}
          <div className="hero-btn-group">

            {/* Button 1 — Outline */}
            <Link href="/login" className="hero-btn hero-btn--outline">
              Start Checking
              <span className="hero-btn__icon hero-btn__icon--green">→</span>
            </Link>

            {/* Button 2 — Filled */}
            <Link href="/login" className="hero-btn hero-btn--filled">
              Scan Product
              <span className="hero-btn__icon hero-btn__icon--white">→</span>
            </Link>

          </div>
     
        </div>
      </div>

    </section>
  );
}










