// 'use client'

// import { useEffect, useState } from 'react'
// import type { ProductPayload } from '@/lib/api'

// interface ProductResultProps {
//   product: ProductPayload
//   delay?: number
// }

// function statusColor(status: string) {
//   const s = status.toLowerCase()
//   if (s === 'halal') return { border: '#00C853', text: '#00C853', label: 'Halal', symbol: '✓' }
//   if (s === 'haraam') return { border: '#EF4444', text: '#EF4444', label: 'Haraam', symbol: '✗' }
//   return { border: '#F59E0B', text: '#F59E0B', label: 'Mushbooh', symbol: '?' }
// }

// function categoryEmoji(cat: string) {
//   const c = cat.toLowerCase()
//   if (c.includes('chocolate') || c.includes('confect')) return '🍫'
//   if (c.includes('beverage') || c.includes('drink')) return '🥤'
//   if (c.includes('dairy') || c.includes('milk')) return '🥛'
//   if (c.includes('meat') || c.includes('poultry')) return '🍖'
//   if (c.includes('pharma') || c.includes('medicine')) return '💊'
//   if (c.includes('cosmetic')) return '💄'
//   if (c.includes('additive')) return '🧪'
//   return '🍽️'
// }

// export default function ProductResult({ product, delay = 0 }: ProductResultProps) {
//   const [visible, setVisible] = useState(false)

//   useEffect(() => {
//     const t = setTimeout(() => setVisible(true), delay)
//     return () => clearTimeout(t)
//   }, [delay])

//   const status = statusColor(product.halal_status)

//   const details = [
//     { label: 'Category', value: [product.category_l1, product.category_l2].filter(Boolean).join(' · ') },
//     { label: 'Sold In', value: product.sold_in?.length ? product.sold_in.join(', ') : 'N/A' },
//     { label: 'Certification', value: product.cert_bodies?.length ? product.cert_bodies.join(', ') : 'N/A', green: true },
//     { label: 'Cert Expiry', value: product.cert_expiry || 'N/A' },
//     ...(product.health_info?.length ? [{ label: 'Health Info', value: product.health_info.join(', ') }] : []),
//     ...(product.typical_uses?.length ? [{ label: 'Typical Uses', value: product.typical_uses.join(', ') }] : []),
//     { label: 'Sources', value: `${product.source_count || 0} verified source${product.source_count === 1 ? '' : 's'}`, green: true },
//     ...(product.barcodes?.length ? [{ label: 'Barcode', value: product.barcodes.join(', ') }] : []),
//   ].filter(d => d.value && d.value !== 'N/A')

//   const emoji = categoryEmoji(product.category_l2 || product.category_l1 || '')

//   return (
//     <div style={{
//       opacity: visible ? 1 : 0,
//       transform: visible ? 'translateY(0)' : 'translateY(16px)',
//       transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
//     }}>
//       <div style={{
//         background: 'white',
//         borderRadius: '16px',
//         overflow: 'hidden',
//         border: '1px solid #A7F3D0',
//       }}>
//         {/* Header */}
//         <div style={{
//           background: '#F0FBF4',
//           padding: '16px',
//           display: 'flex',
//           alignItems: 'flex-start',
//           gap: '12px',
//         }}>
//           <div style={{
//             width: '40px', height: '40px',
//             borderRadius: '10px',
//             background: '#f3f4f6',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             fontSize: '20px', flexShrink: 0,
//           }}>
//             {emoji}
//           </div>
//           <div>
//             <div style={{ fontWeight: 700, fontSize: '16px', color: '#0D1F17' }}>
//               {product.norm_name}
//             </div>
//             <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
//               {product.companies?.length ? product.companies.join(', ') : 'Unknown manufacturer'}
//             </div>
//             <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
//               <span style={{
//                 padding: '4px 12px',
//                 borderRadius: '20px',
//                 border: `1.5px solid ${status.border}`,
//                 color: status.text,
//                 fontSize: '12px',
//                 fontWeight: 600,
//                 display: 'flex', alignItems: 'center', gap: '4px',
//               }}>
//                 {status.symbol} {status.label}
//               </span>
//               <span style={{
//                 padding: '4px 12px',
//                 borderRadius: '20px',
//                 border: '1.5px solid #e0e0e0',
//                 color: '#374151',
//                 fontSize: '12px',
//                 fontWeight: 500,
//                 display: 'flex', alignItems: 'center', gap: '4px',
//               }}>
//                 ★ Verified Database
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Details Table */}
//         <div style={{ padding: '0 16px' }}>
//           {details.map((row, i) => (
//             <div key={i} style={{
//               display: 'flex',
//               alignItems: 'flex-start',
//               padding: '11px 0',
//               borderBottom: i < details.length - 1 ? '1px solid #f3f4f6' : 'none',
//               gap: '16px',
//             }}>
//               <span style={{ fontSize: '13px', color: '#6B7280', flexShrink: 0, minWidth: '100px' }}>
//                 {row.label}
//               </span>
//               <span style={{
//                 fontSize: '13px',
//                 color: (row as any).green ? '#00A846' : '#0D1F17',
//                 fontWeight: (row as any).green ? 600 : 400,
//               }}>
//                 {row.value}
//               </span>
//             </div>
//           ))}
//         </div>

//         {/* Warning Footer */}
//         <div style={{
//           background: '#FFFBEB',
//           padding: '10px 16px',
//           borderTop: '1px solid #fef3c7',
//           fontSize: '12px',
//           color: '#92400e',
//           display: 'flex',
//           gap: '6px',
//           alignItems: 'flex-start',
//         }}>
//           <span>⚠️</span>
//           <span>This result is from our verified database. Always check local certifying bodies for region-specific information.</span>
//         </div>
//       </div>
//     </div>
//   )
// }




















'use client'

import { useEffect, useState } from 'react'
import type { ProductPayload } from '@/lib/api'

interface ProductResultProps {
  product: ProductPayload
  delay?: number
  fromWebSearch?: boolean   // 👈 ADD THIS
}

function getStatusTheme(status: string) {
  const s = status.toLowerCase()

  if (s === 'halal') return {
    // Badge
    badgeColor: '#00C853',
    badgeText: '#00C853',
    symbol: '✓',
    label: 'Halal',
    // Header section
    headerBg: '#F0FBF4',
    headerBorder: '#d1fae5',
    iconBg: '#dcfce7',
    // Card border
    cardBorder: '#A7F3D0',
    // Footer
    footerBg: '#FFFBEB',
    footerBorder: '#fef3c7',
    footerText: '#92400e',
    footerIcon: '⚠️',
    footerMsg: 'This result is from our verified database. Always check local certifying bodies for region-specific information.',
  }

  if (s === 'haraam') return {
    badgeColor: '#EF4444',
    badgeText: '#EF4444',
    symbol: '✗',
    label: 'Haraam',
    headerBg: '#FEF2F2',
    headerBorder: '#fecaca',
    iconBg: '#fee2e2',
    cardBorder: '#fca5a5',
    footerBg: '#FEF2F2',
    footerBorder: '#fecaca',
    footerText: '#991b1b',
    footerIcon: '🚫',
    footerMsg: 'This product contains ingredients not permissible in Islam. Avoid consumption.',
  }

  // Mashbooh / default
  return {
    badgeColor: '#F59E0B',
    badgeText: '#B45309',
    symbol: '?',
    label: 'Mashbooh',
    headerBg: '#FFFBEB',
    headerBorder: '#fde68a',
    iconBg: '#fef3c7',
    cardBorder: '#fcd34d',
    footerBg: '#FFFBEB',
    footerBorder: '#fde68a',
    footerText: '#92400e',
    footerIcon: '⚠️',
    footerMsg: 'Status is doubtful. Verify with your local certifying bodies before consuming.',
  }
}

function categoryEmoji(cat: string) {
  const c = cat.toLowerCase()
  if (c.includes('chocolate') || c.includes('confect')) return '🍫'
  if (c.includes('beverage') || c.includes('drink')) return '🥤'
  if (c.includes('dairy') || c.includes('milk')) return '🥛'
  if (c.includes('meat') || c.includes('poultry')) return '🍖'
  if (c.includes('pharma') || c.includes('medicine')) return '💊'
  if (c.includes('cosmetic')) return '💄'
  if (c.includes('additive')) return '🧪'
  if (c.includes('snack')) return '🍿'
  if (c.includes('baby') || c.includes('infant')) return '🍼'
  return '🍽️'
}

export default function ProductResult(
  {
    product, 
    delay = 0, 
    fromWebSearch = false 
  }: ProductResultProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  const theme = getStatusTheme(product.halal_status)
  const emoji = categoryEmoji(product.category_l2 || product.category_l1 || '')

  const details = [
    { label: 'Category', value: [product.category_l1, product.category_l2].filter(Boolean).join(' · ') },
    { label: 'Sold In', value: product.sold_in?.length ? product.sold_in.join(', ') : null },
    { label: 'Certification', value: product.cert_bodies?.length ? product.cert_bodies.join(', ') : null, green: true },
    { label: 'Cert Expiry', value: product.cert_expiry || null },
    ...(product.health_info?.length ? [{ label: 'Health Info', value: product.health_info.join(', ') }] : []),
    ...(product.typical_uses?.length ? [{ label: 'Typical Uses', value: product.typical_uses.join(', ') }] : []),
    { label: 'Sources', value: `${product.source_count || 0} verified source${product.source_count === 1 ? '' : 's'}`, green: true },
    ...(product.barcodes?.length ? [{ label: 'Barcode', value: product.barcodes.join(', ') }] : []),
  ].filter(d => d.value)

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        border: `1.5px solid ${theme.cardBorder}`,
      }}>

        {/* ── Header ── */}
        <div style={{
          background: theme.headerBg,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          borderBottom: `1px solid ${theme.headerBorder}`,
        }}>
          {/* Emoji icon */}
          <div style={{
            width: '42px', height: '42px',
            borderRadius: '10px',
            background: theme.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>
            {emoji}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#0D1F17', marginBottom: '2px' }}>
              {product.norm_name}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
              {product.companies?.length ? product.companies.join(', ') : 'Unknown manufacturer'}
            </div>
            <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
              {/* Status badge */}
              <span style={{
                padding: '3px 12px',
                borderRadius: '20px',
                border: `1.5px solid ${theme.badgeColor}`,
                color: theme.badgeText,
                fontSize: '12px',
                fontWeight: 600,
                background: 'white',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                {theme.symbol} {theme.label}
              </span>
              {/* Verified badge */}
              {/* <span style={{
                padding: '3px 12px',
                borderRadius: '20px',
                border: '1.5px solid #e0e0e0',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 500,
                background: 'white',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                ★ Verified Database
              </span> */}

              {/* Source badge */}
{fromWebSearch ? (
  <span style={{
    padding: '3px 12px',
    borderRadius: '20px',
    border: '1.5px solid #f59e0b',
    color: '#b45309',
    fontSize: '12px',
    fontWeight: 600,
    background: '#FFFBEB',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }}>
    🌐 Web Result (Unverified)
  </span>
) : (
  <span style={{
    padding: '3px 12px',
    borderRadius: '20px',
    border: '1.5px solid #00C853',
    color: '#00A846',
    fontSize: '12px',
    fontWeight: 600,
    background: '#F0FBF4',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }}>
    ✅ Verified Database
  </span>
)}

            </div>
          </div>
        </div>

        {/* ── Details Table ── */}
        <div style={{ padding: '0 16px' }}>
          {details.map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              padding: '10px 0',
              borderBottom: i < details.length - 1 ? '1px solid #f3f4f6' : 'none',
              gap: '16px',
            }}>
              <span style={{
                fontSize: '13px',
                color: '#6B7280',
                flexShrink: 0,
                minWidth: '100px',
              }}>
                {row.label}
              </span>
              <span style={{
                fontSize: '13px',
                color: (row as any).green ? '#00A846' : '#0D1F17',
                fontWeight: (row as any).green ? 600 : 400,
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        {/* <div style={{
          background: theme.footerBg,
          padding: '9px 14px',
          borderTop: `1px solid ${theme.footerBorder}`,
          fontSize: '12px',
          color: theme.footerText,
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>{theme.footerIcon}</span>
          <span>{theme.footerMsg}</span>
        </div> */}
{/* {fromWebSearch && (
  <div style={{
    background: theme.footerBg,
    padding: '9px 14px',
    borderTop: `1px solid ${theme.footerBorder}`,
    fontSize: '12px',
    color: theme.footerText,
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-start',
  }}>
    <span style={{ fontSize: '13px', flexShrink: 0 }}>
      {theme.footerIcon}
    </span>
    <span>{theme.footerMsg}</span>
  </div>
)} */}


<div style={{
  background: fromWebSearch ? '#FFFBEB' : theme.footerBg,
  padding: '9px 14px',
  borderTop: `1px solid ${fromWebSearch ? '#fde68a' : theme.footerBorder}`,
  fontSize: '12px',
  color: fromWebSearch ? '#92400e' : theme.footerText,
  display: 'flex',
  gap: '6px',
  alignItems: 'flex-start',
}}>
  <span style={{ fontSize: '13px', flexShrink: 0 }}>
    {fromWebSearch ? '🌐' : theme.footerIcon}
  </span>

  <span>
    {fromWebSearch
      ? 'This result is from web search and is NOT verified. Always confirm halal certification from trusted authorities.'
      : theme.footerMsg}
  </span>
</div>

      </div>
    </div>
  )
}