"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusVariant, titleCase } from "@/lib/labels";

export type VideoRow = {
  id: string;
  title: string;
  hook: string | null;
  status: string;
  approvalStatus: string;
};

export function VideoManager({
  campaignId,
  videos,
}: {
  campaignId: string;
  videos: VideoRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function addVideo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!res.ok) {
        toast.error("Failed to add video post");
        return;
      }
      setTitle("");
      toast.success("Video post added");
      router.refresh();
    } finally {
      setAdding(false);
    }
  }

  async function removeVideo(id: string) {
    const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete video post");
      return;
    }
    toast.success("Video post deleted");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addVideo} className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New video post title…"
          className="max-w-md"
        />
        <Button type="submit" disabled={adding || !title.trim()}>
          {adding ? "Adding…" : "Add video post"}
        </Button>
      </form>

      {videos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No video posts yet. Add one manually, or generate them in a later
          phase.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="w-px text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <Link href={`/videos/${v.id}`} className="hover:underline">
                      {v.title}
                    </Link>
                    {v.hook && (
                      <div className="text-xs text-muted-foreground">
                        {v.hook}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(v.status)}>
                      {titleCase(v.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(v.approvalStatus)}>
                      {titleCase(v.approvalStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVideo(v.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
