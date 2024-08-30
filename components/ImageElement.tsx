import React, { useState, useRef, useCallback, useEffect } from 'react'
import { FaTrash, FaMagic, FaExpand, FaCompress, FaDownload, FaCopy, FaPalette, FaUndo, FaEdit, FaTimes, FaSave } from 'react-icons/fa'

interface ImageElementProps {
  id: string
  x: number
  y: number
  src: string
  onDragStart: (e: React.MouseEvent, id: string) => void
  onDrag: (id: string, x: number, y: number) => void
  onClose: (id: string) => void
  onUpdateImage: (id: string, newSrc: string) => void
  zIndex: number
  canvasSize: { width: number; height: number }
}

const ImageElement: React.FC<ImageElementProps> = ({ id, x, y, src, onDragStart, onDrag, onClose, onUpdateImage, zIndex, canvasSize }) => {
  const [position, setPosition] = useState({ x, y })
  const [size, setSize] = useState({ width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [showResizeHandles, setShowResizeHandles] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const dragRef = useRef({ startX: 0, startY: 0 })
  const resizeRef = useRef({ startWidth: 0, startHeight: 0, startX: 0, startY: 0, aspectRatio: 1, direction: '' })

  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [rotation, setRotation] = useState(0)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [backgroundColor, setBackgroundColor] = useState('transparent')

  const [showEditOptions, setShowEditOptions] = useState(false)

  const [editedSrc, setEditedSrc] = useState(src)
  const [removedBgSrc, setRemovedBgSrc] = useState<string | null>(null)

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        resizeRef.current.aspectRatio = aspectRatio;
        setSize({ width: 200, height: 200 / aspectRatio });
      };
    }
  }, [src]);

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
        newWidth = Math.max(50, direction.includes('e') ? startWidth + e.clientX - startX : startWidth - (e.clientX - startX))
        newHeight = newWidth / aspectRatio
      } else if (direction.includes('s') || direction.includes('n')) {
        newHeight = Math.max(50, direction.includes('s') ? startHeight + e.clientY - startY : startHeight - (e.clientY - startY))
        newWidth = newHeight * aspectRatio
      }

      if (direction.includes('w')) {
        newX = position.x - (newWidth - size.width)
      }
      if (direction.includes('n')) {
        newY = position.y - (newHeight - size.height)
      }

      // Ensure the image stays within canvas bounds
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

  const handleRemoveBackground = async () => {
    setIsProcessing(true)
    const apiKey = process.env.NEXT_PUBLIC_REMOVE_BG_API_KEY
    const apiUrl = 'https://api.remove.bg/v1.0/removebg'

    if (!apiKey) {
      console.error('Remove.bg API key is not set')
      alert('Remove.bg API key is not configured. Please check your environment variables.')
      setIsProcessing(false)
      return
    }

    try {
      const imageResponse = await fetch(editedSrc)
      const imageBlob = await imageResponse.blob()

      const formData = new FormData()
      formData.append('image_file', imageBlob, 'image.png')
      formData.append('size', 'auto')

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to remove background')
      }

      const blob = await response.blob()
      const newImageUrl = URL.createObjectURL(blob)
      setRemovedBgSrc(newImageUrl)
      setEditedSrc(newImageUrl)
    } catch (error) {
      console.error('Error removing background:', error)
      alert('Failed to remove background. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleFullscreen = () => {
    if (isFullscreen) {
      setSize({ width: 200, height: 200 / resizeRef.current.aspectRatio })
      setPosition({ x: Math.min(x, canvasSize.width - 200), y: Math.min(y, canvasSize.height - 200 / resizeRef.current.aspectRatio) })
    } else {
      setSize({ width: canvasSize.width, height: canvasSize.height })
      setPosition({ x: 0, y: 0 })
    }
    setIsFullscreen(!isFullscreen)
  }

  const applyEdits = useCallback(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx && imageRef.current) {
      canvas.width = imageRef.current.naturalWidth
      canvas.height = imageRef.current.naturalHeight

      // Apply background color
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the image
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(imageRef.current, -canvas.width / 2, -canvas.height / 2)

      return canvas
    }
    return null
  }, [brightness, contrast, rotation, backgroundColor])

  const handleSaveEdits = useCallback(() => {
    const editedCanvas = applyEdits()
    if (editedCanvas) {
      editedCanvas.toBlob((blob) => {
        if (blob) {
          const newImageUrl = URL.createObjectURL(blob)
          setEditedSrc(newImageUrl)
          onUpdateImage(id, newImageUrl)
          setShowEditOptions(false)
        }
      }, 'image/png')
    }
  }, [id, onUpdateImage, applyEdits])

  const handleDownload = useCallback(() => {
    const editedCanvas = applyEdits()
    if (editedCanvas) {
      editedCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `edited-image-${id}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }
      }, 'image/png')
    }
  }, [id, applyEdits])

  const handleCopy = useCallback(() => {
    const editedCanvas = applyEdits()
    if (editedCanvas) {
      editedCanvas.toBlob((blob) => {
        if (blob) {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(() => {
            alert('Image copied to clipboard!')
          }).catch(err => {
            console.error('Failed to copy image: ', err)
            alert('Failed to copy image. Please try again.')
          })
        }
      }, 'image/png')
    }
  }, [applyEdits])

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360)
  }, [])

  const handleBrightnessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBrightness(Number(e.target.value))
  }, [])

  const handleContrastChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setContrast(Number(e.target.value))
  }, [])

  const handleBackgroundColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setBackgroundColor(e.target.value)
  }, [])

  const toggleEditOptions = useCallback(() => {
    setShowEditOptions(prev => !prev)
  }, [])

  return (
    <div
      ref={elementRef}
      className="absolute shadow-lg rounded-lg overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s ease, width 0.3s ease, height 0.3s ease',
        boxShadow: isDragging || isResizing ? '0 8px 16px rgba(0,0,0,0.2)' : '0 4px 8px rgba(0,0,0,0.1)',
        backgroundColor: backgroundColor,
      }}
      onMouseEnter={() => setShowResizeHandles(true)}
      onMouseLeave={() => setShowResizeHandles(false)}
    >
      <div
        className="w-full h-10 bg-gray-200 cursor-move flex items-center justify-between px-2"
        onMouseDown={handleMouseDown}
      >
        <span className="font-medium text-sm">Image</span>
        <div className="flex items-center space-x-2">
          <button
            className="text-blue-500 hover:text-blue-700 font-bold p-1 rounded transition-colors duration-200"
            onClick={toggleEditOptions}
            title={showEditOptions ? "Close Edit Options" : "Edit Image"}
          >
            {showEditOptions ? <FaTimes size={16} /> : <FaEdit size={16} />}
          </button>
          <button
            className="text-green-500 hover:text-green-700 font-bold p-1 rounded transition-colors duration-200"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
          </button>
          <button
            className="text-red-500 hover:text-red-700 font-bold p-1 rounded transition-colors duration-200"
            onClick={() => onClose(id)}
            title="Delete"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
      <div className="relative w-full h-[calc(100%-40px)]">
        <img
          ref={imageRef}
          src={editedSrc}
          alt="Uploaded image"
          className="w-full h-full object-contain"
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: `brightness(${brightness}%) contrast(${contrast}%)`,
          }}
        />
        {showEditOptions && (
          <div className="absolute top-0 left-0 right-0 bg-gray-200 bg-opacity-75 p-2 overflow-y-auto max-h-full">
            <div className="flex flex-wrap justify-center gap-2 mb-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                onClick={handleRemoveBackground}
                disabled={isProcessing}
              >
                <FaMagic className="inline mr-1" /> {removedBgSrc ? 'Restore BG' : 'Remove BG'}
              </button>
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                onClick={handleSaveEdits}
              >
                <FaSave className="inline mr-1" /> Save Edits
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                onClick={handleDownload}
              >
                <FaDownload className="inline mr-1" /> Download
              </button>
              <button
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                onClick={handleCopy}
              >
                <FaCopy className="inline mr-1" /> Copy
              </button>
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200"
                onClick={handleRotate}
              >
                <FaUndo className="inline mr-1" /> Rotate
              </button>
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Brightness</label>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={handleBrightnessChange}
                className="w-full"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-700">Contrast</label>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={handleContrastChange}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Background Color</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={handleBackgroundColorChange}
                className="w-full h-8 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
      {showResizeHandles && !isFullscreen && resizeHandles.map((handle, index) => (
        <div
          key={index}
          className={`absolute w-3 h-3 bg-white border border-gray-300 ${handle.className}`}
          style={{ cursor: handle.cursor }}
          onMouseDown={(e) => handleResizeStart(e, handle.direction)}
        />
      ))}
      {isProcessing && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white font-bold">Processing...</div>
        </div>
      )}
    </div>
  )
}

export default React.memo(ImageElement)