import Link from "next/link";
import { listCalendarEntries } from "@/server/calendar/service";
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
import { CalendarRowActions } from "@/components/calendar/row-actions";
import { statusVariant, titleCase, PLATFORM_LABELS } from "@/lib/labels";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null, time: string | null): string {
  if (!date) return "Unscheduled";
  const d = new Date(date).toISOString().slice(0, 10);
  return time ? `${d} ${time}` : d;
}

export default async function CalendarPage() {
  const entries = await listCalendarEntries();

  return (
    <div>
      <PageHeader
        title="Content Calendar"
        description="All video posts across campaigns. Calendar grid view comes in a later polish pass."
      />

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No video posts scheduled yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Platforms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(e.scheduledDate, e.scheduledTime)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/videos/${e.id}`} className="hover:underline">
                      {e.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/campaigns/${e.campaign.id}`}
                      className="text-sm hover:underline"
                    >
                      {e.campaign.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {e.targetPlatforms.map((p) => (
                        <Badge key={p} variant="outline">
                          {PLATFORM_LABELS[p] ?? p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(e.status)}>
                      {titleCase(e.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(e.approvalStatus)}>
                      {titleCase(e.approvalStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CalendarRowActions
                      videoId={e.id}
                      approvalStatus={e.approvalStatus}
                      hasVideo={Boolean(e.videoUrl)}
                    />
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
