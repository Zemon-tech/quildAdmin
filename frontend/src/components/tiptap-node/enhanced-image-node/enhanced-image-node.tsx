import { NodeViewWrapper } from "@tiptap/react"
import { useState, useRef, useCallback } from "react"
import type { NodeViewProps } from "@tiptap/react"
import "@/components/tiptap-node/enhanced-image-node/enhanced-image-node.scss"

const MIN_WIDTH = 50
const MIN_HEIGHT = 50

export const EnhancedImageNode = ({ node, updateAttributes, getPos, editor }: NodeViewProps) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const { src, alt, width, height, "data-align": align } = node.attrs

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      e.stopPropagation()
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      startPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: rect.width,
        height: rect.height,
      }

      setResizeDirection(direction)
      setIsResizing(true)

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startPosRef.current.x
        const deltaY = moveEvent.clientY - startPosRef.current.y

        let newWidth = startPosRef.current.width
        let newHeight = startPosRef.current.height

        if (direction.includes("right")) {
          newWidth = Math.max(MIN_WIDTH, startPosRef.current.width + deltaX)
        }
        if (direction.includes("left")) {
          newWidth = Math.max(MIN_WIDTH, startPosRef.current.width - deltaX)
        }
        if (direction.includes("bottom")) {
          newHeight = Math.max(MIN_HEIGHT, startPosRef.current.height + deltaY)
        }
        if (direction.includes("top")) {
          newHeight = Math.max(MIN_HEIGHT, startPosRef.current.height - deltaY)
        }

        if (containerRef.current) {
          containerRef.current.style.width = `${newWidth}px`
          containerRef.current.style.height = `${newHeight}px`
        }
      }

      const handleMouseUp = () => {
        const rect = containerRef.current?.getBoundingClientRect()
        if (rect) {
          updateAttributes({
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          })
        }

        setIsResizing(false)
        setResizeDirection(null)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [updateAttributes]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const pos = getPos()
        if (typeof pos === "number" && editor) {
          e.preventDefault()
          editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
        }
      }
    },
    [node, getPos, editor]
  )

  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : "auto",
    height: height ? `${height}px` : "auto",
    maxWidth: "100%",
  }

  const containerStyle: React.CSSProperties = {
    display: "block",
    textAlign: align || "center",
    position: "relative",
  }

  return (
    <NodeViewWrapper
      className="enhanced-image-node"
      style={containerStyle}
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={`enhanced-image-wrapper ${isResizing ? "is-resizing" : ""}`}>
        <img
          src={src}
          alt={alt || "Image"}
          style={imageStyle}
          draggable={false}
        />
        
        {/* Resize Handles */}
        <div className="resize-handles">
          <div
            className="resize-handle resize-handle-nw"
            onMouseDown={(e) => handleMouseDown(e, "top-left")}
          />
          <div
            className="resize-handle resize-handle-ne"
            onMouseDown={(e) => handleMouseDown(e, "top-right")}
          />
          <div
            className="resize-handle resize-handle-sw"
            onMouseDown={(e) => handleMouseDown(e, "bottom-left")}
          />
          <div
            className="resize-handle resize-handle-se"
            onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
