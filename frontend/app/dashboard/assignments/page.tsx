"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QueryState } from "@/components/reusable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useApiDelete, useApiGet, useApiPost } from "@/hooks/api";
import { asArray, asPaginated } from "@/lib/api/normalize";
import type { Assignment } from "@/types/assignment.types";
import type { Customer } from "@/types/customer.types";
import type { User } from "@/types/user.types";

// Backend response for `/assignments/user/:userId/count`
type AssignmentCountResponse = {
  assigned: number;
  remaining: number;
  maxAllowed: number;
};

// Request payload for assign/unassign operations
type AssignPayload = {
  customerId: string;
  userId: string;
};

// Shared date formatter for table values
function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();

  // Local UI state for selected entities and customer search input
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Load all users for "Select User" dropdown
  const usersQuery = useApiGet<User[]>("/users", {
    queryKey: ["users"],
  });
  const users = asArray<User>(usersQuery.data);

  // Load customers list used as assign options
  const customersQuery = useApiGet<{ data: Customer[]; meta: { total: number } }>(
    "/customers?page=1&limit=100",
    {
      queryKey: ["customers", "assignment-options"],
    },
  );
  const customersPage = asPaginated<Customer>(customersQuery.data);

  // Load assignments only when a user is selected
  const assignmentsQuery = useApiGet<Assignment[]>(
    selectedUserId ? `/assignments/user/${selectedUserId}` : null,
    {
      queryKey: ["assignments", "user", selectedUserId],
    },
  );
  const assignments = asArray<Assignment>(assignmentsQuery.data);

  // Load assignment counters for selected user (assigned/remaining/max)
  const assignmentCountQuery = useApiGet<AssignmentCountResponse>(
    selectedUserId ? `/assignments/user/${selectedUserId}/count` : null,
    {
      queryKey: ["assignments", "count", selectedUserId],
    },
  );

  const assignMutation = useApiPost<Assignment, AssignPayload>({
    path: "/assignments",
  });

  const unassignMutation = useApiDelete<{ message: string }, AssignPayload>({
    path: "/assignments",
    body: (variables) => variables,
  });

  // Customer options = not already assigned to selected user + optional search filter
  const availableCustomers = useMemo(() => {
    const selectedCustomerIds = new Set(
      assignments.map((assignment) => assignment.customerId),
    );
    const term = customerSearch.trim().toLowerCase();

    return customersPage.data.filter((customer) => {
      const matchesSearch =
        !term ||
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term);
      const notAssigned = !selectedCustomerIds.has(customer.id);
      return matchesSearch && notAssigned;
    });
  }, [assignments, customerSearch, customersPage.data]);

  // Derive selected user details for header text
  const selectedUser = users.find((user) => user.id === selectedUserId);

  // Keep assignment-related screens in sync after mutations
  const refreshAssignmentData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["assignments", "user", selectedUserId] }),
      queryClient.invalidateQueries({ queryKey: ["assignments", "count", selectedUserId] }),
      queryClient.invalidateQueries({ queryKey: ["users"] }),
      queryClient.invalidateQueries({ queryKey: ["customers"] }),
    ]);
  };

  const handleAssign = async () => {
    if (!selectedUserId || !selectedCustomerId) return;

    // Create assignment for selected user/customer pair
    await assignMutation.mutateAsync({
      customerId: selectedCustomerId,
      userId: selectedUserId,
    });

    // Reset selected customer and refresh dependent data
    setSelectedCustomerId("");
    await refreshAssignmentData();
  };

  const handleUnassign = async (customerId: string) => {
    if (!selectedUserId) return;
    // Remove assignment for selected user/customer pair
    await unassignMutation.mutateAsync({
      customerId,
      userId: selectedUserId,
    });
    await refreshAssignmentData();
  };

  const mutationError = assignMutation.error?.message || unassignMutation.error?.message;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Assignments</h1>
        <p className="text-sm text-muted-foreground">
          Assign customers to users and track assignment limits.
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-medium">Select User</p>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Search Customer</p>
          <Input
            value={customerSearch}
            onChange={(event) => setCustomerSearch(event.target.value)}
            placeholder="Search by name/email"
            disabled={!selectedUserId}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Select Customer</p>
          <Select
            value={selectedCustomerId}
            onValueChange={setSelectedCustomerId}
            disabled={!selectedUserId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose customer" />
            </SelectTrigger>
            <SelectContent>
              {availableCustomers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedUser ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
          <div className="text-sm text-muted-foreground">
            Managing assignments for{" "}
            <span className="font-medium text-foreground">{selectedUser.name}</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Assigned: {assignmentCountQuery.data?.assigned ?? 0}
            </Badge>
            <Badge variant="outline">
              Remaining: {assignmentCountQuery.data?.remaining ?? 0}
            </Badge>
            <Badge variant="outline">
              Max: {assignmentCountQuery.data?.maxAllowed ?? 5}
            </Badge>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          onClick={() => void handleAssign()}
          disabled={!selectedUserId || !selectedCustomerId || assignMutation.isPending}
        >
          {assignMutation.isPending ? "Assigning..." : "Assign Customer"}
        </Button>
      </div>

      {mutationError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {mutationError}
        </p>
      ) : null}

      {!selectedUserId ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Select a user to view and manage assignments.
        </p>
      ) : (
        <QueryState
          isLoading={assignmentsQuery.isLoading}
          isError={assignmentsQuery.isError}
          errorMessage={assignmentsQuery.error?.message}
          isEmpty={assignments.length === 0}
          emptyTitle="No assignments yet"
          emptyDescription="Assign a customer to get started."
          onRetry={() => assignmentsQuery.refetch()}
          loadingText="Loading assignments..."
        >
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.customer?.name ?? assignment.customerId}
                    </TableCell>
                    <TableCell>{assignment.customer?.email ?? "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assignment.customer?.status === "ACTIVE" ? "secondary" : "outline"
                        }
                      >
                        {assignment.customer?.status ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleUnassign(assignment.customerId)}
                        disabled={unassignMutation.isPending}
                      >
                        Unassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      )}
    </div>
  );
}

