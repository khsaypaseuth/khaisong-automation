import Link from "next/link";
import { listCampaigns } from "@/server/campaigns/service";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { statusVariant, titleCase, PLATFORM_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Create and manage video content campaigns."
        action={
          <Button render={<Link href="/campaigns/new" />}>New campaign</Button>
        }
      />

      {campaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No campaigns yet. Create your first campaign to get started.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead className="text-center">Posts</TableHead>
                <TableHead className="text-center">Videos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="cursor-default">
                  <TableCell className="font-medium">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="hover:underline"
                    >
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell>{c.language}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {c.platforms.map((p) => (
                        <Badge key={p} variant="outline">
                          {PLATFORM_LABELS[p] ?? p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{c.totalPosts}</TableCell>
                  <TableCell className="text-center">
                    {c._count.videoPosts}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>
                      {titleCase(c.status)}
                    </Badge>
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
