"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QueryState } from "@/components/reusable";
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
import type { User } from "@/types/user.types";

type UserCreatePayload = {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MEMBER";
};

type UserUpdatePayload = {
  id: string;
  name: string;
  role: "ADMIN" | "MEMBER";
  password?: string;
};

function formatDate(value?: string): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [password, setPassword] = useState("");

  const usersQuery = useApiGet<User[]>("/users", {
    queryKey: ["users"],
  });

  const createUserMutation = useApiPost<User, UserCreatePayload>({
    path: "/users",
  });

  const updateUserMutation = useApiPatch<User, UserUpdatePayload>({
    path: (variables) => `/users/${variables.id}`,
    body: (variables) => ({
      name: variables.name,
      role: variables.role,
      ...(variables.password ? { password: variables.password } : {}),
    }),
  });

  const deleteUserMutation = useApiDelete<{ message: string }, { id: string }>({
    path: (variables) => `/users/${variables.id}`,
  });

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usersQuery.data ?? [];
    return (usersQuery.data ?? []).filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term),
    );
  }, [usersQuery.data, search]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("MEMBER");
    setPassword("");
    setEditingUser(null);
  };

  const refreshUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword("");
    setIsDialogOpen(true);
  };

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingUser) {
      await updateUserMutation.mutateAsync({
        id: editingUser.id,
        name: name.trim(),
        role,
        password: password.trim() || undefined,
      });
    } else {
      await createUserMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role,
        password: password.trim(),
      });
    }

    setIsDialogOpen(false);
    resetForm();
    await refreshUsers();
  };

  const handleDeleteUser = async (user: User) => {
    const confirmed = window.confirm(`Delete "${user.name}"?`);
    if (!confirmed) return;
    await deleteUserMutation.mutateAsync({ id: user.id });
    await refreshUsers();
  };

  const mutationError =
    createUserMutation.error?.message ||
    updateUserMutation.error?.message ||
    deleteUserMutation.error?.message;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage organization users and roles.
          </p>
        </div>
        <Button onClick={openCreateDialog}>Add User</Button>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name or email..."
        className="max-w-xs"
      />

      {mutationError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {mutationError}
        </p>
      ) : null}

      <QueryState
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        errorMessage={usersQuery.error?.message}
        isEmpty={filteredUsers.length === 0}
        emptyTitle="No users found"
        emptyDescription="Create a user or adjust your search."
        onRetry={() => usersQuery.refetch()}
        loadingText="Loading users..."
      >
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned Customers</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "ADMIN" ? "secondary" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count?.assignments ?? 0}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDeleteUser(user)}
                        disabled={deleteUserMutation.isPending}
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
      </QueryState>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and role."
                : "Create a new organization user."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={(event) => void handleSaveUser(event)}>
            <Input
              placeholder="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={Boolean(editingUser)}
            />
            <Select value={role} onValueChange={(value) => setRole(value as "ADMIN" | "MEMBER")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
                <SelectItem value="MEMBER">MEMBER</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={
                editingUser
                  ? "New password (optional, min 6)"
                  : "Password (min 6)"
              }
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required={!editingUser}
              minLength={6}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
              >
                {createUserMutation.isPending || updateUserMutation.isPending
                  ? "Saving..."
                  : editingUser
                    ? "Update User"
                    : "Create User"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

