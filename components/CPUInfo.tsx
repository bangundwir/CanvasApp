'use client'

import React, { useState, useEffect } from 'react'

interface CPUInfoProps {
  darkMode: boolean
}

const CPUInfo: React.FC<CPUInfoProps> = ({ darkMode }) => {
  const [cpuInfo, setCPUInfo] = useState<string>('Loading...')

  useEffect(() => {
    const fetchCPUInfo = async () => {
      try {
        const response = await fetch('/api/cpu-info')
        const data = await response.json()
        
        // Get browser CPU info
        const browserCPUInfo = navigator.hardwareConcurrency 
          ? `${navigator.hardwareConcurrency} cores`
          : 'Not available'

        setCPUInfo(`Server: ${data.cpuUsage.toFixed(2)}% | Browser: ${browserCPUInfo}`)
      } catch (error) {
        console.error('Failed to fetch CPU info:', error)
        setCPUInfo('Failed to load CPU info')
      }
    }

    fetchCPUInfo()
    const interval = setInterval(fetchCPUInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`text-sm ${darkMode ? 'text-white' : 'text-black'}`}>
      CPU Info: {cpuInfo}
    </div>
  )
}

export default CPUInfo