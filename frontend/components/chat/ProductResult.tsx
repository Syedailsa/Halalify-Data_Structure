// export default function ProductResult() {
//   return (
//     <div className="bg-white rounded-2xl shadow max-w-2xl overflow-hidden">
//       <div className="bg-green-100 p-4">
//         <h3 className="font-semibold">KitKat Chocolate Bar</h3>
//         <p className="text-xs text-gray-500">Nestlé · Switzerland</p>
//       </div>

//       <div className="p-4 text-sm space-y-2">
//         <Row label="Category" value="Confectionery · Chocolate" />
//         <Row label="Sold In" value="Pakistan, UAE, Malaysia" />
//         <Row label="Certification" value="IFANCA, JAKIM" />
//         <Row label="Expiry" value="Dec 31, 2025" />
//         <Row label="Ingredients" value="Cocoa, Sugar, Milk Powder" />
//         <Row label="Barcode" value="8000500310427" />
//       </div>
//     </div>
//   )
// }

// function Row({ label, value }: any) {
//   return (
//     <div className="flex justify-between border-b pb-2">
//       <span className="text-gray-400">{label}</span>
//       <span>{value}</span>
//     </div>
//   )
// }








'use client'

import { useEffect, useState } from 'react'

interface ProductResultProps {
  delay?: number
}

const details = [
  { label: 'Category', value: 'Confectionery · Chocolate' },
  { label: 'Sold In', value: 'Pakistan, UAE, Malaysia' },
  { label: 'Certification', value: 'IFANCA, JAKIM', green: true },
  { label: 'Cert Number', value: 'IFANCA-2024-1234' },
  { label: 'Cert Expiry', value: 'Dec 31, 2025' },
  { label: 'Ingredients', value: 'Cocoa, Sugar, Milk Powder, Halal Lecithin' },
  { label: 'Source Count', value: '3 verified sources', green: true },
  { label: 'Barcode', value: '8000500310427' },
]

export default function ProductResult({ delay = 0 }: ProductResultProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  return (
    <div style={{
      margin: '4px 16px 4px 52px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #A7F3D0',
      }}>
        {/* Header */}
        <div style={{
          background: '#F0FBF4',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '10px',
            background: '#ffebee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', flexShrink: 0,
          }}>
            🍫
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0D1F17' }}>KitKat Chocolate Bar</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>Nestlé · Switzerland</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1.5px solid #00C853',
                color: '#00C853',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                ✓ Halal
              </span>
              <span style={{
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1.5px solid #e0e0e0',
                color: '#374151',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                ★ Verified Database
              </span>
            </div>
          </div>
        </div>

        {/* Details Table */}
        <div style={{ padding: '0 16px' }}>
          {details.map((row, i) => (
            <div key={i} style={{
              display: 'flex',
              // justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '11px 0',
              borderBottom: i < details.length - 1 ? '1px solid #f3f4f6' : 'none',
              gap: '16px',
              
            }}>
              <span style={{ fontSize: '13px', color: '#6B7280', flexShrink: 0, minWidth: '100px' }}>
                {row.label}
              </span>
              <span style={{
                fontSize: '13px',
                color: row.green ? '#00A846' : '#0D1F17',
                fontWeight: row.green ? 600 : 400,
                textAlign: 'right',
              }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Warning Footer */}
        <div style={{
          background: '#FFFBEB',
          padding: '10px 16px',
          borderTop: '1px solid #fef3c7',
          fontSize: '12px',
          color: '#92400e',
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start',
        }}>
          <span>⚠️</span>
          <span>This result is from our verified database. Always check local certifying bodies for region-specific information.</span>
        </div>
      </div>

      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>16:39</div>
    </div>
  )
}