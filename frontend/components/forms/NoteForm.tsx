"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import type { NotePayload } from "../../types/note.types";

interface NoteFormProps {
  customerId: string;
  onSubmit: (payload: NotePayload) => void;
}

export const NoteForm = ({ customerId, onSubmit }: NoteFormProps) => {
  const [message, setMessage] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ customerId, message });
        setMessage("");
      }}
    >
      <textarea
        className="w-full rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-black"
        placeholder="Write a note..."
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />
      <Button type="submit">Add Note</Button>
    </form>
  );
};

