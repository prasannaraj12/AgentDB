import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyStartupRoute } from './lib/router'

// Decide the entry route before React renders (refreshing an app page opens the landing page).
applyStartupRoute()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
