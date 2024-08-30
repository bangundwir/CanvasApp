import React from 'react'

interface YouTubeEmbedProps {
  id: string
  x: number
  y: number
  url: string
  onDragStart: (e: React.DragEvent, id: string) => void
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ id, x, y, url, onDragStart }) => {
  const getEmbedUrl = (url: string) => {
    const videoId = url.split('v=')[1]
    return `https://www.youtube.com/embed/${videoId}`
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        cursor: 'move',
      }}
      draggable
      onDragStart={(e) => onDragStart(e, id)}
    >
      <iframe
        width="560"
        height="315"
        src={getEmbedUrl(url)}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  )
}

export default YouTubeEmbed
