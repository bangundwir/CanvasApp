'use client'

import { useEffect, useRef, useState } from 'react'
import Canvas from '../components/Canvas'
import YouTubeUrlPopup from '../components/YouTubeUrlPopup'

type CanvasRef = HTMLCanvasElement & {
  addYouTubeEmbed: (url: string) => void;
  addStickyNote: () => void;
  addImage: (file: File) => void;
};

export default function Home() {
  const canvasRef = useRef<CanvasRef>(null)
  const [showYouTubePopup, setShowYouTubePopup] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

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

  const handleAddYouTubeVideo = (url: string) => {
    canvasRef.current?.addYouTubeEmbed(url)
    setShowYouTubePopup(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          canvasRef.current?.addImage(file)
        }
      })
    }
  }

  return (
    <main className={`w-screen h-screen overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} shadow-md p-4 flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <button
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
            onClick={() => setShowYouTubePopup(true)}
          >
            Add YouTube Video
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
            onClick={() => canvasRef.current?.addStickyNote()}
          >
            Add Sticky Note
          </button>
          <label className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded cursor-pointer">
            Add Images
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
        <button
          className={`${darkMode ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-white'} font-bold py-1 px-3 rounded`}
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <Canvas ref={canvasRef} darkMode={darkMode} />
      {showYouTubePopup && (
        <YouTubeUrlPopup
          onSubmit={handleAddYouTubeVideo}
          onClose={() => setShowYouTubePopup(false)}
          darkMode={darkMode}
        />
      )}
    </main>
  )
}
