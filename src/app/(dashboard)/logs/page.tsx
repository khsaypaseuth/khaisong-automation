import Link from "next/link";
import { listApiLogs, listPostingLogs } from "@/server/logs/service";
import { PageHeader } from "@/components/page-header";
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

function fmt(date: Date): string {
  return new Date(date).toISOString().replace("T", " ").slice(0, 19);
}

export default async function LogsPage() {
  const [apiLogs, postingLogs] = await Promise.all([
    listApiLogs(100),
    listPostingLogs(50),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity log"
        description="Recent provider calls and posting attempts. Use this to debug failures."
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Provider calls
        </h2>
        {apiLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No provider activity yet.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">When</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {fmt(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm">{log.provider}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-xs">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === "error" ? "destructive" : "secondary"
                        }
                      >
                        {log.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] text-xs text-muted-foreground">
                      <span className="line-clamp-2">
                        {log.errorMessage ?? ""}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">
          Posting attempts
        </h2>
        {postingLogs.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No posting attempts yet.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">When</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {postingLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {fmt(log.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate text-sm">
                      <Link
                        href={`/videos/${log.videoPostId}`}
                        className="hover:underline"
                      >
                        {log.videoPost.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {PLATFORM_LABELS[log.platform] ?? log.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(log.status)}>
                        {titleCase(log.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] text-xs text-muted-foreground">
                      <span className="line-clamp-2">
                        {log.errorMessage ?? log.platformPostId ?? ""}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
