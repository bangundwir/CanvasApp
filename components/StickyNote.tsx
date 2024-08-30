import React, { useState } from 'react'

interface StickyNoteProps {
  id: string
  x: number
  y: number
  content: string
  color?: string
  onDragStart: (e: React.DragEvent, id: string) => void
}

const StickyNote: React.FC<StickyNoteProps> = ({ id, x, y, content, color = '#ffff88', onDragStart }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [noteContent, setNoteContent] = useState(content)

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value)
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        backgroundColor: color,
        padding: '10px',
        minWidth: '100px',
        minHeight: '100px',
        cursor: 'move',
      }}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={noteContent}
          onChange={handleChange}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <p>{noteContent}</p>
      )}
    </div>
  )
}

export default StickyNote
