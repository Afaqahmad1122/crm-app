"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomerPayload } from "../../types/customer.types";

interface CustomerFormProps {
  initialValues?: CustomerPayload;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (payload: CustomerPayload) => void | Promise<void>;
}

export const CustomerForm = ({
  initialValues,
  isSubmitting = false,
  submitLabel = "Save Customer",
  onSubmit,
}: CustomerFormProps) => {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(
    initialValues?.status ?? "ACTIVE",
  );

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          status,
        });
      }}
    >
      <Input
        placeholder="Customer name"
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
      />
      <Input
        placeholder="Phone (optional)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <Select value={status} onValueChange={(value) => setStatus(value as "ACTIVE" | "INACTIVE")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
};
