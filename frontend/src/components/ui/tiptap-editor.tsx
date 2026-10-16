import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
  className?: string;
}

export function TipTapEditor({
  content,
  onChange,
  editable = true,
  minHeight = '180px',
  className,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'tiptap-content max-w-none focus:outline-none p-3.5'
        ),
      },
    },
  });

  // Cập nhật trạng thái editable của editor khi prop editable thay đổi
  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  // Đồng bộ content từ ngoài vào editor nếu có sự thay đổi (ví dụ khi load detail)
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      const currentHTML = editor.getHTML();
      if (content !== currentHTML && !editor.isFocused) {
        editor.commands.setContent(content || '', { emitUpdate: false });
      }
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border/70 bg-[#0B1324] p-4 text-xs text-slate-400',
          className
        )}
        style={{ minHeight }}
      >
        Đang khởi tạo trình soạn thảo...
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-[#0B1324] overflow-hidden focus-within:border-[#a3e635]/60 focus-within:ring-1 focus-within:ring-[#a3e635]/30 transition-all flex flex-col',
        className
      )}
    >
      {/* Toolbar Document Docx-like */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#070D1A]/90 border-b border-border/60 text-slate-300">
          {/* Nhóm Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(
              'px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('paragraph') && !editor.isActive('heading')
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Đoạn văn bình thường"
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('heading', { level: 1 })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Tiêu đề 1 (H1)"
          >
            <Heading1 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('heading', { level: 2 })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Tiêu đề 2 (H2)"
          >
            <Heading2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('heading', { level: 3 })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Tiêu đề 3 (H3)"
          >
            <Heading3 className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Nhóm Text Style */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('bold') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('italic') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('underline') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Gạch chân (Ctrl+U)"
          >
            <UnderlineIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('strike') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Gạch ngang"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('highlight') ? 'bg-yellow-400/20 text-yellow-300' : 'text-slate-300'
            )}
            title="Bôi màu dạ quang"
          >
            <Highlighter className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('code') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Đoạn mã (Code inline)"
          >
            <Code className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Căn lề Text Align */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive({ textAlign: 'left' })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Căn trái"
          >
            <AlignLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive({ textAlign: 'center' })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Căn giữa"
          >
            <AlignCenter className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive({ textAlign: 'right' })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Căn phải"
          >
            <AlignRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive({ textAlign: 'justify' })
                ? 'bg-[#a3e635]/20 text-[#a3e635]'
                : 'text-slate-300'
            )}
            title="Căn đều 2 bên"
          >
            <AlignJustify className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Danh sách & Trích dẫn */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('bulletList') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Danh sách dấu chấm"
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('orderedList') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Danh sách số"
          >
            <ListOrdered className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer',
              editor.isActive('blockquote') ? 'bg-[#a3e635]/20 text-[#a3e635]' : 'text-slate-300'
            )}
            title="Khối trích dẫn"
          >
            <Quote className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Đường kẻ ngang phân cách"
          >
            <Minus className="size-3.5" />
          </button>

          <div className="h-4 w-px bg-border/60 mx-1" />

          {/* Undo / Redo / Clear format */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
            title="Xóa định dạng"
          >
            <RemoveFormatting className="size-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div
        className="flex-1 overflow-y-auto cursor-text"
        style={{ minHeight }}
        onClick={() => {
          if (editable && editor && !editor.isFocused) {
            editor.chain().focus().run();
          }
        }}
      >
        <EditorContent editor={editor} className="h-full min-h-[inherit]" />
      </div>
    </div>
  );
}
