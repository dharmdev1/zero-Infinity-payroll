import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './styles/index.css'

/* Register the "session expired" handler once the auth UI exists. */
import { registerUnauthorizedHandler } from '@/services/api/client'
import { demoSessionStrategy } from '@/services/auth/session'

registerUnauthorizedHandler(() => {
  demoSessionStrategy.save(null)
  window.location.assign('/login')
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
