"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import type { NotePayload } from "../../types/note.types";

interface NoteFormProps {
  customerId: string;
  isSubmitting?: boolean;
  onSubmit: (payload: NotePayload) => void | Promise<void>;
}

export const NoteForm = ({
  customerId,
  isSubmitting = false,
  onSubmit,
}: NoteFormProps) => {
  const [content, setContent] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const trimmedContent = content.trim();
        if (!trimmedContent) return;
        await onSubmit({ customerId, content: trimmedContent });
        setContent("");
      }}
    >
      <Textarea
        placeholder="Write a note..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Note"}
      </Button>
    </form>
  );
};

