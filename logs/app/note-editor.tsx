"use client"

import type React from "react"

import { useCallback, useState, useEffect, useRef } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Image from "@tiptap/extension-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { createNote, updateNote } from "./actions/note-actions"
import {
  Bold,
  Italic,
  UnderlineIcon,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react"

interface NoteEditorProps {
  note: any | null
  isCreating: boolean
  onSaved: () => void
  onCancel: () => void
}

// Define the max file size constant
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function NoteEditor({ note, isCreating, onSaved, onCancel }: NoteEditorProps) {
  // Move the useRef hook inside the component
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  // Add state for tracking drag state
  const [isDragging, setIsDragging] = useState(false)

  // Update the Image extension configuration to ensure proper rendering of base64 images
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-md max-w-full",
        },
        allowBase64: true, // Explicitly allow base64 images
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none",
      },
    },
  })

  // Update the useEffect hook that loads note content to properly handle images
  useEffect(() => {
    if (note) {
      setTitle(note.title)
      if (editor) {
        // Add a small delay to ensure the editor is fully initialized
        setTimeout(() => {
          editor.commands.setContent(note.description)

          // Log for debugging
          console.log("Loaded note content:", note.description)

          // Force editor to update after content is set
          editor.commands.focus("end")
        }, 50)
      }
    } else {
      setTitle("")
      if (editor) {
        editor.commands.setContent("")
      }
    }
  }, [note, editor])

  // Add these handlers to the component
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Update the handleImageDrop function to include file size validation
  const handleImageDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      if (!editor) return

      const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

      if (files.length === 0) return

      files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Image "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          if (base64) {
            editor.chain().focus().setImage({ src: base64 }).run()
            toast.success(`Image "${file.name}" added successfully`)
          }
        }
        reader.readAsDataURL(file)
      })
    },
    [editor],
  )

  // Update the handleImagePaste function to include file size validation
  const handleImagePaste = useCallback(
    (event: React.ClipboardEvent) => {
      if (!editor) return

      const items = Array.from(event.clipboardData.items)
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length === 0) return

      event.preventDefault()

      imageItems.forEach((item) => {
        const file = item.getAsFile()
        if (!file) return

        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Pasted image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          if (base64) {
            editor.chain().focus().setImage({ src: base64 }).run()
            toast.success("Image pasted successfully")
          }
        }
        reader.readAsDataURL(file)
      })
    },
    [editor],
  )

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!editor) return

    const content = editor.getHTML()

    setIsSaving(true)
    try {
      if (isCreating) {
        await createNote({
          title: title.trim(),
          description: content,
        })
        toast.success("Note created successfully")
      } else {
        await updateNote({
          id: note.id,
          title: title.trim(),
          description: content,
        })
        toast.success("Note updated successfully")
      }
      onSaved()
    } catch (error) {
      toast.error(isCreating ? "Failed to create note" : "Failed to update note")
    } finally {
      setIsSaving(false)
    }
  }

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <div className="border rounded-md p-1">
          <div className="flex flex-wrap gap-1 p-1 mb-2 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-muted" : ""}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-muted" : ""}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "bg-muted" : ""}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = window.prompt("URL")
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                }
              }}
              className={editor.isActive("link") ? "bg-muted" : ""}
              title="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={editor.isActive({ textAlign: "left" }) ? "bg-muted" : ""}
              title="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={editor.isActive({ textAlign: "center" }) ? "bg-muted" : ""}
              title="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={editor.isActive({ textAlign: "right" }) ? "bg-muted" : ""}
              title="Align Right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-muted" : ""}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-muted" : ""}
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            {/* Replace the Image button with this improved version */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click()
                }
              }}
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? "bg-muted" : ""}
              title="Code"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "bg-muted" : ""}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          {/* Add this input element after the toolbar */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return

              if (file.size > MAX_FILE_SIZE) {
                toast.error(`Image is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
                return
              }

              const reader = new FileReader()
              reader.onload = (e) => {
                const base64 = e.target?.result as string
                if (base64 && editor) {
                  editor.chain().focus().setImage({ src: base64 }).run()
                  toast.success(`Image "${file.name}" added successfully`)
                }
              }
              reader.readAsDataURL(file)

              // Reset the input
              event.target.value = ""
            }}
          />
          <div
            className={`border-2 rounded-md transition-colors ${isDragging ? "border-primary border-dashed bg-primary/5" : "border-transparent"}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleImageDrop}
          >
            <EditorContent editor={editor} onPaste={handleImagePaste} className="p-4 min-h-[300px]" />
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-md pointer-events-none">
                <div className="bg-background p-4 rounded-md shadow-lg border border-primary">
                  <p className="text-center font-medium">Drop image here</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-3 w-3" />
            <span>Tip: Drag and drop images directly into the editor, or paste from clipboard</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Saving..." : isCreating ? "Create Note" : "Update Note"}
        </Button>
      </div>
    </div>
  )
}

