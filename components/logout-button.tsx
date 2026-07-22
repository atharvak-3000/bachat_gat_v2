"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/sign-in");
  };

  return <Button onClick={logout}>Logout</Button>;
}
