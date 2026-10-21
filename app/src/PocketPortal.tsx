import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
export const POCKET_URL = 'https://fieldwork-pocket-island.jc3785.chatgpt.site/'
export default function PocketPortal() {
  const [open, setOpen] = useState(false), [qr, setQr] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { QRCode.toDataURL(POCKET_URL, { width: 300, margin: 3, errorCorrectionLevel: 'M', color: { dark: '#2c483e', light: '#fffdf5' } }).then(setQr).catch(() => setQr('')) }, [])
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close() }, [open])
  return <><button className="pocket-link" onClick={() => setOpen(true)}>Try on your phone ↗</button><dialog className="pocket-share" ref={dialog} onCancel={() => setOpen(false)} onClick={e => { if (e.target === dialog.current) setOpen(false) }}><button className="pocket-share-close" aria-label="Close phone invitation" onClick={() => setOpen(false)}>×</button><small>FIELDWORK / POCKET ISLAND</small><h2>A world in<br/>your hands.</h2><p>Scan. Make a breeze.<br/>See where a seed finds home.</p>{qr && <img width="240" height="240" src={qr} alt="Scan to open the interactive island on your phone"/>}<a href={POCKET_URL} target="_blank" rel="noreferrer">Open the island ↗</a><p className="pocket-share-foot">Each visitor grows their own island.</p></dialog></>
}
