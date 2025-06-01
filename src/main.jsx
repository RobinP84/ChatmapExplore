// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 1) Import QueryClient and QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'
import './Components/CustomInfoWindow.css'

// 2) Instantiate a QueryClient
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 3) Wrap <App /> with <QueryClientProvider> */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)