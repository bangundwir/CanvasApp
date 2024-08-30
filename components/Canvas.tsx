'use client'

import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import StickyNote from './StickyNote'
import YouTubeEmbed from './YouTubeEmbed'

interface CanvasObject {
  id: string
  type: 'sticky' | 'youtube'
  x: number
  y: number
  content: string
  color?: string
}

const Canvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [objects, setObjects] = useState<CanvasObject[]>([])

  useImperativeHandle(ref, () => canvasRef.current!)

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text')
    const updatedObjects = objects.map(obj => 
      obj.id === id ? { ...obj, x: e.clientX, y: e.clientY } : obj
    )
    setObjects(updatedObjects)
  }

  const addStickyNote = () => {
    const newNote: CanvasObject = {
      id: Date.now().toString(),
      type: 'sticky',
      x: 100,
      y: 100,
      content: 'New note',
      color: '#ffff88'
    }
    setObjects([...objects, newNote])
  }

  const addYouTubeEmbed = (url: string) => {
    const newEmbed: CanvasObject = {
      id: Date.now().toString(),
      type: 'youtube',
      x: 100,
      y: 100,
      content: url
    }
    setObjects([...objects, newEmbed])
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      />
      {objects.map(obj => (
        obj.type === 'sticky' ? (
          <StickyNote
            key={obj.id}
            id={obj.id}
            x={obj.x}
            y={obj.y}
            content={obj.content}
            color={obj.color}
            onDragStart={handleDragStart}
          />
        ) : (
          <YouTubeEmbed
            key={obj.id}
            id={obj.id}
            x={obj.x}
            y={obj.y}
            url={obj.content}
            onDragStart={handleDragStart}
          />
        )
      ))}
      <button onClick={addStickyNote}>Add Sticky Note</button>
      <button onClick={() => addYouTubeEmbed('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}>Add YouTube Video</button>
    </div>
  )
})

Canvas.displayName = 'Canvas'

export default Canvas
