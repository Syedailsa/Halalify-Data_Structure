// import type { Metadata } from 'next'
// import './globals.css'

// export const metadata: Metadata = {
//   title: 'Halalify – AI-Powered Halal Verification',
//   description: 'Verify whether products are Halal, Haram, or Mashbooh using AI-powered technology.',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body>{children}</body>
//     </html>
//   )
// }









import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>

        {/* 👇 GLOBAL CURSOR ELEMENTS (ONLY ONCE) */}
        <div id="cursor-dot"></div>
        <div id="cursor-ring"></div>

        {children}
      </body>
    </html>
  )
}
