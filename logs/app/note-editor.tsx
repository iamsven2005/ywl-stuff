"use client"

import { useState, useEffect } from "react"
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
import { createNote, updateNote } from "./note-actions"
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

export function NoteEditor({ note, isCreating, onSaved, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)

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
      Image,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none min-h-[200px] max-w-none",
      },
    },
  })

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      if (editor) {
        editor.commands.setContent(note.description)
      }
    } else {
      setTitle("")
      if (editor) {
        editor.commands.setContent("")
      }
    }
  }, [note, editor])

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = window.prompt("Image URL")
                if (url) {
                  editor.chain().focus().setImage({ src: url }).run()
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
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive("codeBlock") ? "bg-muted" : ""}
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "bg-muted" : ""}
              title="Blockquote"
            >
              <Quote className="h-4 w-4" />
            </Button>
            <div className="h-6 border-l mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : isCreating ? "Create Note" : "Update Note"}
        </Button>
      </div>
    </div>
  )
}

