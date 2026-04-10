"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NoteForm } from "@/components/forms/NoteForm";
import { QueryState } from "@/components/reusable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiDelete, useApiGet, useApiPatch, useApiPost } from "@/hooks/api";
import type { Customer } from "@/types/customer.types";
import type { Note, NotePayload } from "@/types/note.types";

type CustomersResponse = {
  data: Customer[];
  meta: { total: number };
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const customersQuery = useApiGet<CustomersResponse>("/customers?page=1&limit=100", {
    queryKey: ["customers", "notes-options"],
  });

  const notesQuery = useApiGet<Note[]>(
    selectedCustomerId ? `/notes/customer/${selectedCustomerId}` : null,
    {
      queryKey: ["notes", "customer", selectedCustomerId],
    },
  );

  const addNoteMutation = useApiPost<Note, NotePayload>({
    path: "/notes",
  });
  const updateNoteMutation = useApiPatch<Note, { id: string; content: string }>({
    path: (variables) => `/notes/${variables.id}`,
    body: (variables) => ({ content: variables.content }),
  });
  const deleteNoteMutation = useApiDelete<{ message: string }, { id: string }>({
    path: (variables) => `/notes/${variables.id}`,
  });

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customersQuery.data?.data ?? [];

    return (customersQuery.data?.data ?? []).filter((customer) => {
      return (
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term)
      );
    });
  }, [customersQuery.data?.data, search]);

  const selectedCustomer = (customersQuery.data?.data ?? []).find(
    (customer) => customer.id === selectedCustomerId,
  );

  const handleAddNote = async (payload: NotePayload) => {
    await addNoteMutation.mutateAsync(payload);
    await queryClient.invalidateQueries({
      queryKey: ["notes", "customer", payload.customerId],
    });
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId) return;
    const trimmed = editingContent.trim();
    if (!trimmed) return;

    await updateNoteMutation.mutateAsync({
      id: editingNoteId,
      content: trimmed,
    });

    handleCancelEdit();
    if (selectedCustomerId) {
      await queryClient.invalidateQueries({
        queryKey: ["notes", "customer", selectedCustomerId],
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm("Kya aap is note ko delete karna chahte hain?");
    if (!confirmed) return;

    await deleteNoteMutation.mutateAsync({ id: noteId });

    if (editingNoteId === noteId) {
      handleCancelEdit();
    }
    if (selectedCustomerId) {
      await queryClient.invalidateQueries({
        queryKey: ["notes", "customer", selectedCustomerId],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Notes</h1>
        <p className="text-sm text-muted-foreground">
          Select a customer and add notes directly from one place.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Search Customer</p>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Select Customer</p>
          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose customer" />
            </SelectTrigger>
            <SelectContent>
              {filteredCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCustomerId ? (
        <div className="rounded-lg border p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Adding notes for <span className="font-medium text-foreground">{selectedCustomer?.name}</span>
          </p>
          <NoteForm
            customerId={selectedCustomerId}
            isSubmitting={addNoteMutation.isPending}
            onSubmit={handleAddNote}
          />
          {addNoteMutation.error?.message ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {addNoteMutation.error.message}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Select a customer to view and add notes.
        </p>
      )}

      {selectedCustomerId ? (
        <QueryState
          isLoading={notesQuery.isLoading}
          isError={notesQuery.isError}
          errorMessage={notesQuery.error?.message}
          isEmpty={(notesQuery.data ?? []).length === 0}
          emptyTitle="No notes yet"
          emptyDescription="Add your first note for this customer."
          onRetry={() => notesQuery.refetch()}
          loadingText="Loading notes..."
        >
          <div className="space-y-2 rounded-lg border p-3">
            {(notesQuery.data ?? []).map((note) => (
              <div key={note.id} className="rounded-md border p-3">
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(event) => setEditingContent(event.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleUpdateNote()}
                        disabled={updateNoteMutation.isPending || !editingContent.trim()}
                      >
                        {updateNoteMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updateNoteMutation.isPending}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">{note.content}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {note.user?.name ?? "Unknown"} - {formatDate(note.createdAt)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEdit(note)}
                    disabled={
                      updateNoteMutation.isPending ||
                      deleteNoteMutation.isPending
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDeleteNote(note.id)}
                    disabled={
                      updateNoteMutation.isPending ||
                      deleteNoteMutation.isPending
                    }
                  >
                    {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => {
            void customersQuery.refetch();
            if (selectedCustomerId) void notesQuery.refetch();
          }}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}
