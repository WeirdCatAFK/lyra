import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'vexflow'
import './index.css'
import App from './App.jsx'

async function bootstrap() {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try { await document.fonts.ready } catch {}
    try { await document.fonts.load('16px Bravura') } catch {}
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
