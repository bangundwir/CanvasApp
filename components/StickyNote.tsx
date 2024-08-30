import React, { useState, useRef, useEffect, useCallback } from 'react'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  content: string
  color?: string
  onDragStart: (e: React.MouseEvent, id: string) => void
  onDrag: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
  darkMode: boolean
  zIndex: number
  canvasSize: { width: number; height: number }
}

const StickyNote: React.FC<StickyNoteProps> = ({ id, x, y, content, color = '#ffff88', onDragStart, onDrag, onClose, darkMode, zIndex, canvasSize }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState(content)
  const [position, setPosition] = useState({ x, y })
  const [size, setSize] = useState({ width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandles, setShowResizeHandles] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, startY: 0 })
  const resizeRef = useRef({ startWidth: 0, startHeight: 0, startX: 0, startY: 0, direction: '' })

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value)
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
      direction
    }
  }, [size.width, size.height])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = Math.max(0, Math.min(e.clientX - dragRef.current.startX, canvasSize.width - size.width))
      const newY = Math.max(0, Math.min(e.clientY - dragRef.current.startY, canvasSize.height - size.height))
      setPosition({ x: newX, y: newY })
      onDrag(id, newX, newY)
    } else if (isResizing) {
      const { direction, startWidth, startHeight, startX, startY } = resizeRef.current
      let newWidth = size.width
      let newHeight = size.height
      let newX = position.x
      let newY = position.y

      if (direction.includes('e')) {
        newWidth = Math.max(100, startWidth + e.clientX - startX)
      }
      if (direction.includes('s')) {
        newHeight = Math.max(100, startHeight + e.clientY - startY)
      }
      if (direction.includes('w')) {
        const deltaX = startX - e.clientX
        newWidth = Math.max(100, startWidth + deltaX)
        newX = position.x - deltaX
      }
      if (direction.includes('n')) {
        const deltaY = startY - e.clientY
        newHeight = Math.max(100, startHeight + deltaY)
        newY = position.y - deltaY
      }

      // Ensure the note stays within canvas bounds
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

  const getTextColor = useCallback((bgColor: string) => {
    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 125 ? '#000000' : '#ffffff'
  }, [])

  const textColor = getTextColor(color)

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
      className={`absolute shadow-md rounded-md overflow-hidden`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        backgroundColor: color,
        zIndex: zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
        boxShadow: isDragging || isResizing ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setShowResizeHandles(true)}
      onMouseLeave={() => setShowResizeHandles(false)}
    >
      <div
        className={`w-full h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} cursor-move flex items-center justify-between px-2`}
        onMouseDown={handleMouseDown}
      >
        <span className="font-medium text-sm" style={{ color: textColor }}>Sticky Note</span>
        <button
          className="text-red-500 hover:text-red-700 font-bold"
          onClick={() => onClose(id)}
        >
          ×
        </button>
      </div>
      <div
        className="w-full h-[calc(100%-24px)] p-2"
        onDoubleClick={handleDoubleClick}
      >
        {isEditing ? (
          <textarea
            className="w-full h-full bg-transparent resize-none focus:outline-none"
            style={{ color: textColor }}
            value={noteContent}
            onChange={handleChange}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <p className="w-full h-full font-medium overflow-auto" style={{ color: textColor }}>
            {noteContent}
          </p>
        )}
      </div>
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

export default React.memo(StickyNote)
