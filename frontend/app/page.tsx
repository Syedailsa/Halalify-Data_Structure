// import Navbar from '@/components/Navbar'
// import Hero from '@/components/Hero'
// import Features from '@/components/Features'
// import HowItWorks from '@/components/HowItWorks'
// import StatusLabels from '@/components/StatusLabels'
// import TrustStats from '@/components/TrustStats'
// import CTASection, { Footer } from '@/components/CTASection'

// export default function Home() {
//   return (
//     <>
//       <Navbar />
//       <main>
//         <Hero />
//         <Features />
//         <HowItWorks />
//         <StatusLabels />
//         <TrustStats />
//         <CTASection />
//       </main>
//       <Footer />
//     </>
//   )
// }

















import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import StatusLabels from '@/components/StatusLabels'
import TrustStats from '@/components/TrustStats'
import CTASection, { Footer } from '@/components/CTASection'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />

        {/* LOGIN CTA */}
        {/* <div className="flex justify-center gap-4 mt-10">
          <Link href="/login">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl">
              Login / Signup
            </button>
          </Link>
        </div> */}

        <Features />
        <HowItWorks />
        <StatusLabels />
        <TrustStats />
        <CTASection />
      </main>

      <Footer />
    </>
  )
}
