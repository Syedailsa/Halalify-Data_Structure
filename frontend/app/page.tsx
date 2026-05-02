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
import CTASection from '@/components/CTASection'
import Link from 'next/link'
import GlobalEffects from '@/components/GlobalEffects'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
       <GlobalEffects />
      <Hero />
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
 