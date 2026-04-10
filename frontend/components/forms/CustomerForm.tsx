"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CustomerPayload } from "../../types/customer.types";

interface CustomerFormProps {
  onSubmit: (payload: CustomerPayload) => void;
}

export const CustomerForm = ({ onSubmit }: CustomerFormProps) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ fullName, email, phone: phone || undefined });
      }}
    >
      <Input
        placeholder="Full name"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
      />
      <Input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        placeholder="Phone (optional)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
      />
      <Button type="submit">Save Customer</Button>
    </form>
  );
};
