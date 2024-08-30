import React, { useState, useRef, useEffect, useCallback } from 'react'

interface YouTubeEmbedProps {
  id: string
  x: number
  y: number
  url: string
  onDragStart: (e: React.MouseEvent, id: string) => void
  onDrag: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
  zIndex: number
  darkMode: boolean
  canvasSize: { width: number; height: number }
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ id, x, y, url, onDragStart, onDrag, onClose, zIndex, darkMode, canvasSize }) => {
  const [position, setPosition] = useState({ x, y })
  const [size, setSize] = useState({ width: 560, height: 315 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandles, setShowResizeHandles] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, startY: 0 })
  const resizeRef = useRef({ startWidth: 0, startHeight: 0, startX: 0, startY: 0, aspectRatio: 16 / 9, direction: '' })

  const getEmbedUrl = useCallback((url: string) => {
    const videoId = url.split('v=')[1]
    return `https://www.youtube.com/embed/${videoId}`
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y }
    onDragStart(e, id)
  }, [id, onDragStart, position.x, position.y])

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = { 
      startWidth: size.width, 
      startHeight: size.height, 
      startX: e.clientX, 
      startY: e.clientY,
      direction,
      aspectRatio: size.width / size.height
    }
  }, [size.width, size.height])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragRef.current.startX, canvasSize.width - size.width))
      const newY = Math.max(0, Math.min(e.clientY - dragRef.current.startY, canvasSize.height - size.height))
      setPosition({ x: newX, y: newY })
      onDrag(id, newX, newY)
    } else if (isResizing) {
      const { direction, startWidth, startHeight, startX, startY, aspectRatio } = resizeRef.current
      let newWidth = size.width
      let newHeight = size.height
      let newX = position.x
      let newY = position.y

      if (direction.includes('e') || direction.includes('w')) {
        newWidth = Math.max(280, direction.includes('e') ? startWidth + e.clientX - startX : startWidth - (e.clientX - startX))
        newHeight = newWidth / aspectRatio
      } else if (direction.includes('s') || direction.includes('n')) {
        newHeight = Math.max(157, direction.includes('s') ? startHeight + e.clientY - startY : startHeight - (e.clientY - startY))
        newWidth = newHeight * aspectRatio
      }

      if (direction.includes('w')) {
        newX = position.x - (newWidth - size.width)
      }
      if (direction.includes('n')) {
        newY = position.y - (newHeight - size.height)
      }

      // Ensure the embed stays within canvas bounds
      newWidth = Math.min(newWidth, canvasSize.width - newX)
      newHeight = Math.min(newHeight, canvasSize.height - newY)
      newX = Math.max(0, newX)
      newY = Math.max(0, newY)

      setSize({ width: newWidth, height: newHeight })
      setPosition({ x: newX, y: newY })
    }
  }, [isDragging, isResizing, id, onDrag, position.x, position.y, size.width, size.height, canvasSize])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const resizeHandles = [
    { cursor: 'nw-resize', direction: 'nw', className: 'top-0 left-0' },
    { cursor: 'n-resize', direction: 'n', className: 'top-0 left-1/2 -translate-x-1/2' },
    { cursor: 'ne-resize', direction: 'ne', className: 'top-0 right-0' },
    { cursor: 'w-resize', direction: 'w', className: 'top-1/2 left-0 -translate-y-1/2' },
    { cursor: 'e-resize', direction: 'e', className: 'top-1/2 right-0 -translate-y-1/2' },
    { cursor: 'sw-resize', direction: 'sw', className: 'bottom-0 left-0' },
    { cursor: 's-resize', direction: 's', className: 'bottom-0 left-1/2 -translate-x-1/2' },
    { cursor: 'se-resize', direction: 'se', className: 'bottom-0 right-0' },
  ]

  return (
    <div
      ref={elementRef}
      className="absolute shadow-lg rounded-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: zIndex,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
        boxShadow: isDragging || isResizing ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setShowResizeHandles(true)}
      onMouseLeave={() => setShowResizeHandles(false)}
    >
      <div
        className={`w-full h-8 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'} cursor-move flex items-center justify-between px-2`}
        onMouseDown={handleMouseDown}
      >
        <span className="font-medium">YouTube Video</span>
        <button
          className="text-red-500 hover:text-red-700 font-bold"
          onClick={() => onClose(id)}
        >
          ×
        </button>
      </div>
      <iframe
        className="w-full h-[calc(100%-32px)]"
        src={getEmbedUrl(url)}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
      {showResizeHandles && resizeHandles.map((handle, index) => (
        <div
          key={index}
          className={`absolute w-3 h-3 bg-white border border-gray-300 ${handle.className}`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleResizeStart(e, handle.direction)}
        />
      ))}
    </div>
  )
}

export default React.memo(YouTubeEmbed)
