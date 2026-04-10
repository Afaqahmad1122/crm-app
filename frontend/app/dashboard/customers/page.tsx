"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
// Feature forms and shared CRM UI.
import { CustomerForm } from "@/components/forms/CustomerForm";
import { NoteForm } from "@/components/forms/NoteForm";
import { CrmPagination, QueryState } from "@/components/reusable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiDelete, useApiGet, useApiPatch, useApiPost } from "@/hooks/api";
import { asArray, asPaginated } from "@/lib/api/normalize";
import type { Customer, CustomerPayload } from "@/types/customer.types";
import type { Note, NotePayload } from "@/types/note.types";
import type { User } from "@/types/user.types";

const PAGE_SIZE = 10;

/** Shape of GET /customers response: list + pagination meta from the backend. */
type CustomersListResponse = {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Create / edit customer modal.
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Assign customer to a user modal.
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningCustomer, setAssigningCustomer] = useState<Customer | null>(
    null,
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);

  // Notes modal: which customer’s notes we are viewing.
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [notesCustomer, setNotesCustomer] = useState<Customer | null>(null);

  // Debounce search: wait 350ms after typing stops, then trim + update searchTerm and reset to page 1.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  // Stable API URL string for the customers list (page, limit, optional search).
  const customersPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (searchTerm) {
      params.set("search", searchTerm);
    }

    return `/customers?${params.toString()}`;
  }, [page, searchTerm]);

  // Fetch paginated customers; placeholderData keeps previous page data while refetching (smoother UX).
  const customersQuery = useApiGet<CustomersListResponse>(customersPath, {
    queryKey: ["customers", page, searchTerm],
    placeholderData: (previousData) => previousData,
  });
  const customersPage = asPaginated<Customer>(customersQuery.data);

  // All users: populate the Assign dropdown.
  const usersQuery = useApiGet<User[]>("/users", {
    queryKey: ["users"],
  });
  const users = asArray<User>(usersQuery.data);

  // Notes for the currently opened customer; request disabled until notesCustomer is set (null URL).
  const notesQuery = useApiGet<Note[]>(
    notesCustomer ? `/notes/customer/${notesCustomer.id}` : null,
    {
      queryKey: ["customer-notes", notesCustomer?.id],
    },
  );
  const notes = asArray<Note>(notesQuery.data);

  // Mutations: POST/PATCH/DELETE/POST for server actions; hooks expose isPending, error, mutateAsync.
  const createCustomerMutation = useApiPost<Customer, CustomerPayload>({
    path: "/customers",
  });

  const updateCustomerMutation = useApiPatch<
    Customer,
    { id: string; payload: CustomerPayload }
  >({
    path: (variables) => `/customers/${variables.id}`,
    body: (variables) => variables.payload,
  });

  const deleteCustomerMutation = useApiDelete<
    { message: string },
    { id: string }
  >({
    path: (variables) => `/customers/${variables.id}`,
  });

  // Creates an assignment row linking customer ↔ user (backend /assignments).
  const assignCustomerMutation = useApiPost<
    unknown,
    { customerId: string; userId: string }
  >({
    path: "/assignments",
  });

  const addNoteMutation = useApiPost<Note, NotePayload>({
    path: "/notes",
  });

  // Normalized list + meta for the table and CrmPagination.
  const customers = customersPage.data;
  const paginationMeta = customersPage.meta as CustomersListResponse["meta"] | undefined;

  /** Refetch every query whose key starts with ["customers"] (all pages/searches). */
  const refreshCustomers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["customers"] });
  };

  // --- Customer CRUD (modal) ---
  const handleOpenCreateDialog = () => {
    setEditingCustomer(null);
    setIsCustomerDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsCustomerDialogOpen(true);
  };

  /** Create or update via API, close modal, then invalidate customer list. */
  const handleSaveCustomer = async (payload: CustomerPayload) => {
    if (editingCustomer) {
      await updateCustomerMutation.mutateAsync({
        id: editingCustomer.id,
        payload,
      });
    } else {
      await createCustomerMutation.mutateAsync(payload);
    }

    setIsCustomerDialogOpen(false);
    setEditingCustomer(null);
    await refreshCustomers();
  };

  /** Soft-delete after browser confirm; then refresh list. */
  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Delete "${customer.name}"? This is a soft delete and customer will be hidden from normal list.`,
    );
    if (!confirmed) return;

    await deleteCustomerMutation.mutateAsync({ id: customer.id });
    await refreshCustomers();
  };

  // --- Assign customer to a team member ---
  const handleOpenAssignDialog = (customer: Customer) => {
    setAssigningCustomer(customer);
    setSelectedUserId(customer.assignments?.[0]?.user.id ?? "");
    setAssignError(null);
    setIsAssignDialogOpen(true);
  };

  /** POST assignment, close modal, clear selection, refresh customers. */
  const handleAssignCustomer = async () => {
    if (!assigningCustomer || !selectedUserId) {
      setAssignError("Please select a user first.");
      return;
    }

    setAssignError(null);
    await assignCustomerMutation.mutateAsync({
      customerId: assigningCustomer.id,
      userId: selectedUserId,
    });

    setIsAssignDialogOpen(false);
    setAssigningCustomer(null);
    setSelectedUserId("");
    await refreshCustomers();
  };

  // --- Notes modal: list + add note ---
  const handleOpenNotesDialog = (customer: Customer) => {
    setNotesCustomer(customer);
    setIsNotesDialogOpen(true);
  };

  const handleAddNote = async (payload: NotePayload) => {
    await addNoteMutation.mutateAsync(payload);
    await queryClient.invalidateQueries({
      queryKey: ["customer-notes", payload.customerId],
    });
  };

  // UI: disable submit while either create or update is in flight; surface first error message.
  const isSavingCustomer =
    createCustomerMutation.isPending || updateCustomerMutation.isPending;
  const customerMutationError =
    createCustomerMutation.error?.message ||
    updateCustomerMutation.error?.message;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer records, assignments, and notes.
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog} className="w-full sm:w-auto">
          Add Customer
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or email..."
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Loading / error / empty / content wrapper around table + pagination */}
      <QueryState
        isLoading={customersQuery.isLoading}
        isError={customersQuery.isError}
        errorMessage={customersQuery.error?.message}
        isEmpty={customers.length === 0}
        emptyTitle="No customers found"
        emptyDescription="Create a customer or adjust your search."
        onRetry={() => customersQuery.refetch()}
        loadingText="Loading customers..."
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "ACTIVE" ? "secondary" : "outline"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {customer.assignments?.length
                      ? customer.assignments
                          .map((item) => item.user.name)
                          .join(", ")
                      : "Unassigned"}
                  </TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditDialog(customer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignDialog(customer)}
                      >
                        Assign
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNotesDialog(customer)}
                      >
                        Notes
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteCustomer(customer)}
                        disabled={deleteCustomerMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {paginationMeta ? (
          <CrmPagination
            className="mt-4"
            page={paginationMeta.page}
            pageSize={paginationMeta.limit}
            totalItems={paginationMeta.total}
            onPageChange={setPage}
          />
        ) : null}
      </QueryState>

      {/* Create or edit customer (shared CustomerForm) */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Create Customer"}
            </DialogTitle>
            <DialogDescription>
              Save customer details. You can assign and add notes from list
              actions.
            </DialogDescription>
          </DialogHeader>
          {customerMutationError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {customerMutationError}
            </p>
          ) : null}
          <CustomerForm
            initialValues={
              editingCustomer
                ? {
                    name: editingCustomer.name,
                    email: editingCustomer.email,
                    phone: editingCustomer.phone ?? undefined,
                    status: editingCustomer.status,
                  }
                : undefined
            }
            isSubmitting={isSavingCustomer}
            submitLabel={
              editingCustomer ? "Update Customer" : "Create Customer"
            }
            onSubmit={handleSaveCustomer}
          />
        </DialogContent>
      </Dialog>

      {/* Pick a user from /users and POST /assignments */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Customer</DialogTitle>
            <DialogDescription>
              Assign{" "}
              <span className="font-medium">{assigningCustomer?.name}</span> to
              a team member.
            </DialogDescription>
          </DialogHeader>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {assignError || assignCustomerMutation.error?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {assignError ?? assignCustomerMutation.error?.message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignCustomerMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleAssignCustomer()}
              disabled={assignCustomerMutation.isPending}
            >
              {assignCustomerMutation.isPending ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NoteForm + scrollable list from notesQuery */}
      <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Customer Notes</DialogTitle>
            <DialogDescription>
              Add and review notes for{" "}
              <span className="font-medium">{notesCustomer?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          {notesCustomer ? (
            <NoteForm
              customerId={notesCustomer.id}
              isSubmitting={addNoteMutation.isPending}
              onSubmit={handleAddNote}
            />
          ) : null}

          {addNoteMutation.error?.message ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {addNoteMutation.error.message}
            </p>
          ) : null}

          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border p-2">
            {notesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading notes...</p>
            ) : notesQuery.isError ? (
              <p className="text-sm text-red-700">
                {notesQuery.error?.message}
              </p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-md border p-2">
                  <p className="text-sm">{note.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.user?.name ?? "Unknown"} -{" "}
                    {formatDate(note.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
