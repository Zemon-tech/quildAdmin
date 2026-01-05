import { Button } from "@/components/tiptap-ui-primitive/button"
import type { Editor } from "@tiptap/react"
import { AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from "@/components/tiptap-icons/align-icons"

export type ImageAlign = "left" | "center" | "right"

interface ImageAlignButtonProps {
  editor: Editor | null
  align: ImageAlign
  text?: string
  hideWhenUnavailable?: boolean
  onAligned?: () => void
}

export const ImageAlignButton = ({
  editor,
  align,
  text,
  hideWhenUnavailable = false,
  onAligned,
}: ImageAlignButtonProps) => {
  const canSetAlign = canSetImageAlign(editor, align)
  const isActive = isImageAlignActive(editor, align)

  if (hideWhenUnavailable && !canSetAlign) {
    return null
  }

  const handleClick = () => {
    if (canSetAlign && editor) {
      const success = setImageAlign(editor, align)
      if (success) {
        onAligned?.()
      }
    }
  }

  const icons = {
    left: <AlignLeftIcon className="tiptap-button-icon" />,
    center: <AlignCenterIcon className="tiptap-button-icon" />,
    right: <AlignRightIcon className="tiptap-button-icon" />,
  }

  return (
    <Button
      type="button"
      data-style={isActive ? "primary" : "ghost"}
      onClick={handleClick}
      disabled={!canSetAlign}
      title={`Align image ${align}`}
    >
      {icons[align]}
      {text && <span>{text}</span>}
    </Button>
  )
}

export function canSetImageAlign(
  editor: Editor | null,
  align: ImageAlign
): boolean {
  if (!editor) return false
  
  const { state } = editor
  const { selection } = state
  const { $from } = selection
  
  const node = state.doc.nodeAt($from.pos)
  if (!node) return false
  
  return node.type.name === "image"
}

export function isImageAlignActive(
  editor: Editor | null,
  align: ImageAlign
): boolean {
  if (!editor) return false
  
  const { state } = editor
  const { selection } = state
  const { $from } = selection
  
  const node = state.doc.nodeAt($from.pos)
  if (!node) return false
  
  if (node.type.name !== "image") return false
  
  return node.attrs["data-align"] === align
}

export function setImageAlign(
  editor: Editor,
  align: ImageAlign
): boolean {
  const { state } = editor
  const { selection } = state
  const { $from } = selection
  
  const node = state.doc.nodeAt($from.pos)
  if (!node || node.type.name !== "image") return false
  
  editor
    .chain()
    .focus()
    .updateAttributes("image", {
      "data-align": align,
    })
    .run()
  
  return true
}
