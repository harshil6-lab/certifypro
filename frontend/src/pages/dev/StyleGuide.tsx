import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { PageContainer, PageToolbar } from "@/components/layout/PageContainer";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { FileDropzone } from "@/components/FileDropzone";

type DemoRow = { id: string; name: string; email: string; score: number; status: string };

const DEMO_ROWS: DemoRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: `STU-${String(i + 1).padStart(3, "0")}`,
  name: `Student ${i + 1}`,
  email: `student${i + 1}@example.edu`,
  score: (i * 37) % 100,
  status: ["issued", "pending", "revoked", "expired"][i % 4],
}));

const DEMO_COLUMNS: DataColumn<DemoRow>[] = [
  { key: "id", header: "ID", accessor: (r) => r.id, sortable: true },
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "email", header: "Email", accessor: (r) => r.email },
  { key: "score", header: "Score", accessor: (r) => r.score, sortable: true },
  { key: "status", header: "Status", accessor: (r) => r.status, render: (r) => <StatusBadge status={r.status} /> },
];

function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-6 w-10 rounded border ${className}`} aria-hidden="true" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Dev-only component styleguide. Routed only when import.meta.env.DEV is true
 * (see App.tsx) so production builds exclude this page entirely.
 */
export default function StyleGuide() {
  const [dropped, setDropped] = useState<string[]>([]);

  return (
    <PageContainer className="space-y-8">
      <PageToolbar
        crumbs={[{ label: "Dev", href: "/dev/styleguide" }, { label: "Styleguide" }]}
        title="Component styleguide"
        description="Dev-only catalogue of enterprise primitives and their states."
      />

      <SectionCard title="Brand tokens">
        <div className="flex flex-wrap gap-4">
          <Swatch label="primary" className="bg-primary" />
          <Swatch label="accent" className="bg-accent" />
          <Swatch label="muted" className="bg-muted" />
          <Swatch label="success" className="bg-success" />
          <Swatch label="warning" className="bg-warning" />
          <Swatch label="destructive" className="bg-destructive" />
        </div>
      </SectionCard>

      <SectionCard title="Buttons">
        <div className="flex flex-wrap items-center gap-2">
          <Button>Default</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">XL</Button>
        </div>
      </SectionCard>

      <SectionCard title="Badges & status">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <StatusBadge status="issued" />
          <StatusBadge status="pending" />
          <StatusBadge status="revoked" />
          <StatusBadge status="expired" />
          <StatusBadge status="mystery-status" />
        </div>
      </SectionCard>

      <SectionCard title="Cards">
        <Card>
          <CardHeader>
            <CardTitle>Flat bordered panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No resting shadow; borders carry the structure.</p>
          </CardContent>
        </Card>
      </SectionCard>

      <SectionCard title="Forms">
        <div className="grid max-w-xl gap-3">
          <Input placeholder="Default input" aria-label="Default input" />
          <Input placeholder="Disabled input" disabled aria-label="Disabled input" />
          <Input placeholder="Invalid input" aria-invalid="true" aria-label="Invalid input" className="border-destructive" />
          <Select>
            <SelectTrigger aria-label="Demo select">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Option A</SelectItem>
              <SelectItem value="b">Option B</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Textarea" aria-label="Textarea" />
        </div>
      </SectionCard>

      <SectionCard title="Alerts">
        <div className="grid gap-2">
          <Alert>
            <AlertTitle>Default</AlertTitle>
            <AlertDescription>Neutral informational message.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Certificates generated.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Some rows were skipped.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertTitle>Info</AlertTitle>
            <AlertDescription>Retention window is 30 days.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Upload failed.</AlertDescription>
          </Alert>
        </div>
      </SectionCard>

      <SectionCard title="Dialog, tabs, dropdown">
        <div className="flex flex-wrap items-center gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>Compact enterprise dialog.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Tabs defaultValue="one" className="mt-4">
          <TabsList>
            <TabsTrigger value="one">First</TabsTrigger>
            <TabsTrigger value="two">Second</TabsTrigger>
            <TabsTrigger value="three" disabled>
              Disabled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="one">First panel.</TabsContent>
          <TabsContent value="two">Second panel.</TabsContent>
        </Tabs>
      </SectionCard>

      <SectionCard title="States">
        <div className="grid gap-3">
          <LoadingState rows={3} />
          <EmptyState title="No certificates yet" description="Import students and generate your first batch." />
          <ErrorState title="Could not load registry" description="Check your connection and retry." onRetry={() => undefined} />
        </div>
      </SectionCard>

      <SectionCard title="DataTable">
        <DataTable<DemoRow>
          columns={DEMO_COLUMNS}
          rows={DEMO_ROWS}
          rowKey={(row) => row.id}
          searchPlaceholder="Search students…"
          selectable
          pageSizeOptions={[5, 10, 25]}
          bulkActions={
            <>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                Export
              </Button>
              <Button variant="destructive" size="sm" className="gap-1">
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Revoke
              </Button>
            </>
          }
        />
      </SectionCard>

      <SectionCard title="FileDropzone">
        <FileDropzone
          accept=".xlsx,.xls"
          acceptList={[".xlsx", ".xls"]}
          hint="Excel workbooks only (.xlsx, .xls)"
          onFiles={(files) => setDropped(files.map((f) => f.name))}
        />
        {dropped.length > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Received: {dropped.join(", ")}</p>
        ) : null}
      </SectionCard>
    </PageContainer>
  );
}
