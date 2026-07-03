"use client";

import { createContext, useContext, useRef } from "react";
import type { Editor } from "@tiptap/react";

// 用 ref 持有编辑器实例，避免 state 触发不必要的重渲染
type EditorContextValue = {
  editorRef: React.MutableRefObject<Editor | null>;
  persistNowRef: React.MutableRefObject<(() => Promise<void>) | null>;
};

const EditorContext = createContext<EditorContextValue>({
  editorRef: { current: null },
  persistNowRef: { current: null },
});

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const editorRef = useRef<Editor | null>(null);
  const persistNowRef = useRef<(() => Promise<void>) | null>(null);
  return (
    <EditorContext.Provider value={{ editorRef, persistNowRef }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  return useContext(EditorContext);
}
