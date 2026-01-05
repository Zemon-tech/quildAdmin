"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { Plugin } from "@tiptap/pm/state"
import { Extension } from "@tiptap/core"
import { Markdown } from "@tiptap/markdown"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"

// Paste markdown detection extension using Tiptap Markdown
let editorInstance: any = null

const PasteMarkdown = Extension.create({
  name: 'pasteMarkdown',
  onCreate({ editor }) {
    editorInstance = editor
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')
            if (!text) {
              return false
            }

            console.log('Paste detected, text:', text.substring(0, 100))
            console.log('Editor instance:', editorInstance)

            // Check if text looks like Markdown
            if (looksLikeMarkdown(text)) {
              // Get the editor instance from closure
              const editor = editorInstance
              if (!editor) {
                console.error('Editor instance not available')
                return false
              }

              console.log('Inserting markdown content')
              // Insert the Markdown content directly with contentType option
              editor.commands.insertContent(text, { contentType: 'markdown' })
              return true
            }

            return false
          },
        },
      }),
    ]
  },
})

// Simple heuristic to check if text looks like Markdown
function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,6}\s/.test(text) || // Headings
    /\*\*[^*]+\*\*/.test(text) || // Bold
    /\*[^*]+\*/.test(text) || // Italic
    /\[.+\]\(.+\)/.test(text) || // Links
    /^[-*+]\s/.test(text) || // Lists
    /^\d+\.\s/.test(text) || // Numbered lists
    /`[^`]+`/.test(text) || // Inline code
    /^```/.test(text) // Code blocks
  )
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export type SimpleEditorProps = {
  initialContent?: string
  onUpdate?: (html: string) => void
}

export function SimpleEditor({ initialContent, onUpdate }: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState("")
  const [slashPos, setSlashPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [slashIndex, setSlashIndex] = useState(0)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      Markdown.configure({
        indentation: {
          style: 'space',
          size: 2,
        },
        markedOptions: {
          gfm: true,
          breaks: false,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      PasteMarkdown,
    ],
    content: initialContent ?? content,
  })

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      try {
        onUpdate?.(editor.getHTML())
      } catch {}
    }
    editor.on("update", handler)
    return () => {
      editor.off("update", handler)
    }
  }, [editor, onUpdate])

  // Slash command handling: detect "/" and show menu with filtered items
  const slashItems = useMemo(
    () => [
      { label: "Text", action: () => editor?.chain().focus().setParagraph().run() },
      { label: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run() },
      { label: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "Heading 3", action: () => editor?.chain().focus().toggleHeading({ level: 3 }).run() },
      { label: "Bulleted list", action: () => editor?.chain().focus().toggleBulletList().run() },
      { label: "Numbered list", action: () => editor?.chain().focus().toggleOrderedList().run() },
      { label: "Task list", action: () => editor?.chain().focus().toggleTaskList().run() },
      { label: "Quote", action: () => editor?.chain().focus().toggleBlockquote().run() },
      { label: "Code block", action: () => editor?.chain().focus().toggleCodeBlock().run() },
      { label: "Divider", action: () => editor?.chain().focus().setHorizontalRule().run() },
      { label: "Link", action: () => {
          const url = window.prompt("Enter URL")
          if (!url) return
          editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
        }
      },
      { label: "Image", action: () => {
          const url = window.prompt("Enter image URL")
          if (!url) return
          editor?.chain().focus().setImage({ src: url }).run()
        }
      },
    ],
    [editor]
  )

  const filteredSlashItems = useMemo(() => {
    const q = slashQuery.trim().toLowerCase()
    if (!q) return slashItems
    return slashItems.filter((i) => i.label.toLowerCase().includes(q))
  }, [slashItems, slashQuery])

  useEffect(() => {
    if (!editor) return
    const onKeydown = (e: KeyboardEvent) => {
      if (!slashOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((v) => (v + 1) % Math.max(1, filteredSlashItems.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((v) => (v - 1 + Math.max(1, filteredSlashItems.length)) % Math.max(1, filteredSlashItems.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        filteredSlashItems[slashIndex]?.action()
        setSlashOpen(false)
        setSlashQuery("")
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setSlashOpen(false)
        setSlashQuery("")
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [editor, slashOpen, filteredSlashItems, slashIndex])

  useEffect(() => {
    if (!editor) return
    const onTransaction = () => {
      const state = editor.state
      const { from } = state.selection
      const $from = state.doc.resolve(from)
      const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\uFFFC')
      const match = /(?:^|\s)\/(\w*)$/.exec(textBefore)
      if (match) {
        setSlashOpen(true)
        setSlashQuery(match[1] || "")
        setSlashIndex(0)
        const rect = editor.view.coordsAtPos(from)
        const wrapperRect = wrapperRef.current?.getBoundingClientRect()
        setSlashPos({
          x: rect.left - (wrapperRect?.left ?? 0),
          y: rect.bottom - (wrapperRect?.top ?? 0),
        })
      } else if (slashOpen) {
        setSlashOpen(false)
        setSlashQuery("")
      }
    }
    editor.on('transaction', onTransaction)
    return () => {
      editor.off('transaction', onTransaction)
    }
  }, [editor, slashOpen])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper" ref={wrapperRef}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />

        {slashOpen && (
          <div
            style={{
              position: 'absolute',
              left: slashPos.x,
              top: slashPos.y + 6,
              zIndex: 50,
              width: 280,
              maxHeight: 280,
              overflowY: 'auto',
              background: 'var(--tt-bg-color)',
              border: '1px solid var(--tt-gray-dark-200)',
              borderRadius: 8,
              boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {filteredSlashItems.length === 0 ? (
              <div style={{ padding: 12, opacity: 0.6 }}>No results</div>
            ) : (
              filteredSlashItems.map((item, i) => (
                <div
                  key={item.label}
                  onMouseEnter={() => setSlashIndex(i)}
                  onClick={() => {
                    item.action()
                    setSlashOpen(false)
                    setSlashQuery("")
                  }}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: i === slashIndex ? 'var(--tt-gray-dark-100)' : 'transparent',
                  }}
                >
                  {item.label}
                </div>
              ))
            )}
          </div>
        )}
      </EditorContext.Provider>
    </div>
  )
}
