'use client'

import { useEffect, useRef } from 'react'
import Canvas from '../components/Canvas'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <main className="w-screen h-screen overflow-hidden">
      <Canvas ref={canvasRef} />
    </main>
  )
}
