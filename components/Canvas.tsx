'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react'
import StickyNote from './StickyNote'
import YouTubeEmbed from './YouTubeEmbed'
import ImageElement from './ImageElement'
import CPUInfo from './CPUInfo'
import { v4 as uuidv4 } from 'uuid'; // You'll need to install this package: npm install uuid @types/uuid
import { openDB } from 'idb'
import YouTubeUrlPopup from './YouTubeUrlPopup'

interface CanvasObject {
  id: string
  type: 'sticky' | 'youtube' | 'image'
  x: number
  y: number
  content: string
  color?: string
  zIndex: number
}

export interface CanvasRef {
  addStickyNote: () => void
  addYouTubeEmbed: (url: string) => void
  addImage: (file: File) => void
}

interface CanvasProps {
  darkMode: boolean
}

const MAX_OBJECTS = 100 // Batasi jumlah objek yang disimpan

const Canvas = forwardRef<CanvasRef, CanvasProps>(({ darkMode }, ref) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [objects, setObjects] = useState<CanvasObject[]>([])
  const [maxZIndex, setMaxZIndex] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [showYouTubePopup, setShowYouTubePopup] = useState(false)

  const initDB = async () => {
    return openDB('CanvasDB', 1, {
      upgrade(db) {
        db.createObjectStore('canvasObjects')
      },
    })
  }

  const saveObjects = async (objectsToSave: CanvasObject[]) => {
    try {
      const db = await initDB()
      await db.put('canvasObjects', objectsToSave, 'objects')
    } catch (error) {
      console.error('Failed to save objects:', error)
    }
  }

  const loadObjects = async () => {
    try {
      const db = await initDB()
      const savedObjects = await db.get('canvasObjects', 'objects')
      if (savedObjects) {
        setObjects(savedObjects)
        setMaxZIndex(Math.max(...savedObjects.map((obj: CanvasObject) => obj.zIndex), 0))
      }
    } catch (error) {
      console.error('Failed to load objects:', error)
    }
  }

  useEffect(() => {
    loadObjects()
  }, [])

  useEffect(() => {
    if (objects.length > 0) {
      saveObjects(objects.slice(-MAX_OBJECTS)) // Simpan hanya MAX_OBJECTS terakhir
    }
  }, [objects])

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.offsetWidth,
          height: canvasRef.current.offsetHeight
        })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  useImperativeHandle(ref, () => ({
    addStickyNote,
    addYouTubeEmbed: () => setShowYouTubePopup(true),
    addImage
  }))

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    bringToFront(id)
  }

  const handleDrag = (id: string, x: number, y: number) => {
    const updatedObjects = objects.map(obj => {
      if (obj.id === id) {
        return { ...obj, x, y }
      }
      return obj
    })
    setObjects(updatedObjects)
  }

  const bringToFront = (id: string) => {
    setMaxZIndex(prevMax => prevMax + 1)
    setObjects(prevObjects =>
      prevObjects.map(obj =>
        obj.id === id ? { ...obj, zIndex: maxZIndex + 1 } : obj
      )
    )
  }

  const addStickyNote = () => {
    const newZIndex = maxZIndex + 1
    setMaxZIndex(newZIndex)
    const newNote: CanvasObject = {
      id: uuidv4(),
      type: 'sticky',
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 - 100,
      content: 'New note',
      color: '#ffff88',
      zIndex: newZIndex
    }
    setObjects(prevObjects => [...prevObjects, newNote].slice(-MAX_OBJECTS))
  }

  const addYouTubeEmbed = (url: string) => {
    const newZIndex = maxZIndex + 1
    setMaxZIndex(newZIndex)
    const newEmbed: CanvasObject = {
      id: uuidv4(),
      type: 'youtube',
      x: canvasSize.width / 2 - 280,
      y: canvasSize.height / 2 - 157,
      content: url,
      zIndex: newZIndex
    }
    setObjects(prevObjects => [...prevObjects, newEmbed].slice(-MAX_OBJECTS))
    setShowYouTubePopup(false)
  }

  const addImage = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        const newZIndex = maxZIndex + 1
        setMaxZIndex(newZIndex)
        const newImage: CanvasObject = {
          id: uuidv4(),
          type: 'image',
          x: canvasSize.width / 2 - 100,
          y: canvasSize.height / 2 - 100,
          content: e.target.result,
          zIndex: newZIndex
        }
        setObjects(prevObjects => [...prevObjects, newImage].slice(-MAX_OBJECTS))
      }
    }
    reader.readAsDataURL(file)
  }, [canvasSize, maxZIndex])

  const handleClose = useCallback((id: string) => {
    setObjects(prevObjects => prevObjects.filter(obj => obj.id !== id))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        addImage(file)
      }
    })
  }, [addImage])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            addImage(file)
          }
        }
      }
    }
  }, [addImage])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => {
      window.removeEventListener('paste', handlePaste)
    }
  }, [handlePaste])

  const handleUpdateImage = useCallback((id: string, newSrc: string) => {
    setObjects(prevObjects =>
      prevObjects.map(obj =>
        obj.id === id ? { ...obj, content: newSrc } : obj
      )
    )
  }, [])

  const handleYouTubeSubmit = (url: string) => {
    const newZIndex = maxZIndex + 1
    setMaxZIndex(newZIndex)
    const newEmbed: CanvasObject = {
      id: uuidv4(),
      type: 'youtube',
      x: canvasSize.width / 2 - 280,
      y: canvasSize.height / 2 - 157,
      content: url,
      zIndex: newZIndex
    }
    setObjects(prevObjects => [...prevObjects, newEmbed].slice(-MAX_OBJECTS))
    setShowYouTubePopup(false)
  }

  return (
    <div
      ref={canvasRef}
      className={`relative w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {objects.map(obj => {
        switch (obj.type) {
          case 'sticky':
            return (
              <StickyNote
                key={obj.id}
                id={obj.id}
                x={obj.x}
                y={obj.y}
                content={obj.content}
                color={obj.color}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onClose={handleClose}
                darkMode={darkMode}
                zIndex={obj.zIndex}
                canvasSize={canvasSize}
              />
            )
          case 'youtube':
            return (
              <YouTubeEmbed
                key={obj.id}
                id={obj.id}
                x={obj.x}
                y={obj.y}
                url={obj.content}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onClose={handleClose}
                zIndex={obj.zIndex}
                darkMode={darkMode}
                canvasSize={canvasSize}
              />
            )
          case 'image':
            return (
              <ImageElement
                key={obj.id}
                id={obj.id}
                x={obj.x}
                y={obj.y}
                src={obj.content}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onClose={handleClose}
                onUpdateImage={handleUpdateImage}
                zIndex={obj.zIndex}
                canvasSize={canvasSize}
              />
            )
          default:
            return null
        }
      })}
      {showYouTubePopup && (
        <YouTubeUrlPopup
          onSubmit={handleYouTubeSubmit}
          onClose={() => setShowYouTubePopup(false)}
          darkMode={darkMode}
        />
      )}
      <div className={`absolute top-4 right-4 p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'} shadow-md`}>
        <CPUInfo darkMode={darkMode} />
      </div>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
