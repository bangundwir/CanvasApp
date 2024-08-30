import React, { useState, useEffect, useRef } from 'react'

interface YouTubeUrlPopupProps {
  onSubmit: (url: string) => void
  onClose: () => void
  darkMode: boolean
}

const YouTubeUrlPopup: React.FC<YouTubeUrlPopupProps> = ({ onSubmit, onClose, darkMode }) => {
  const [url, setUrl] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Focus input when popup opens
    inputRef.current?.focus()

    // Add event listener for Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim()) {
      onSubmit(url.trim())
      setUrl('') // Reset input after submission
    }
  }

  const handleClose = () => {
    setUrl('') // Reset input when closing
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="fixed inset-0 bg-black opacity-50" onClick={handleClose}></div>
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'} p-6 rounded-lg shadow-lg relative z-[10000]`}>
        <h2 className="text-xl font-bold mb-4">Add YouTube Video</h2>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className={`w-full border rounded px-2 py-1 mb-4 ${
              darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-white text-black placeholder-gray-500'
            }`}
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleClose}
              className={`${
                darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-300 hover:bg-gray-400 text-black'
              } font-bold py-1 px-3 rounded`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded"
            >
              Add Video
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default YouTubeUrlPopup