import { Image } from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { EnhancedImageNode } from "./enhanced-image-node"

export const EnhancedImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute("width")
          return width ? parseInt(width, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {}
          return { width: attributes.width }
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const height = element.getAttribute("height")
          return height ? parseInt(height, 10) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {}
          return { height: attributes.height }
        },
      },
      "data-align": {
        default: "center",
        parseHTML: (element) => {
          return element.getAttribute("data-align") || "center"
        },
        renderHTML: (attributes) => {
          if (!attributes["data-align"]) return {}
          return { "data-align": attributes["data-align"] }
        },
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(EnhancedImageNode)
  },
})

export default EnhancedImage
