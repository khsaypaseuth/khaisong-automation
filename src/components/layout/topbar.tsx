"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function Topbar({ email }: { email: string }) {
  const router = useRouter();

  async function logout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      toast.success("Signed out");
      router.push("/login");
      router.refresh();
    } else {
      toast.error("Failed to sign out");
    }
  }

  return (
    <header className="h-16 shrink-0 border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{email}</span>
        <Button variant="outline" size="sm" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
