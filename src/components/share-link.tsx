"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareLink({
  path,
  label = "Copy link",
}: {
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button variant="outline" className="h-11 rounded-xl px-4" onClick={() => void copy()}>
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
