import { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  Ban,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabaseClient";
import { API_BASE } from "@/services/apiService";
import { addSessionActivity } from "@/services/sessionActivity";

const statusConfig = {
  issued: { label: "Active", icon: CheckCircle2, variant: "success" as const },
  active: { label: "Active", icon: CheckCircle2, variant: "success" as const },
  pending: { label: "Pending", icon: Clock, variant: "warning" as const },
  inactive: { label: "Inactive", icon: Clock, variant: "neutral" as const },
  "non-active": { label: "Inactive", icon: Clock, variant: "neutral" as const },
  revoked: { label: "Revoked", icon: Ban, variant: "destructive" as const },
  expired: { label: "Expired", icon: Clock, variant: "neutral" as const },
  archived: { label: "Archived", icon: Clock, variant: "neutral" as const },
};

type RegistryCertificate = {
  id: string;
  template_id?: string;
  full_name: string;
  email: string;
  external_id: string;
  created_at?: string | null;
  status?: string;
  download_url?: string | null;
  verification_url?: string | null;
  retention_note?: string | null;
};

const formatIssuedTimestamp = (value?: string | null) => {
  if (!value) return { date: "—", time: "" };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { date: "—", time: "" };
  }

  return {
    date: parsed.toLocaleDateString(),
    time: parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

const normalizeStatus = (value?: string | null) => {
  const normalized = (value ?? "issued").toLowerCase();
  if (normalized === "active") return "issued";
  if (normalized === "expired") return "archived";
  return normalized;
};

const Registry = () => {
  const [certificates, setCertificates] = useState<RegistryCertificate[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificates = async () => {
      setLoading(true);
      setError(null);
      try {
        let authHeader = "";
        if (supabase) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) authHeader = `Bearer ${token}`;
        }

        const response = await axios.get(`${API_BASE}/api/my-certificates`, {
          headers: authHeader ? { Authorization: authHeader } : {},
        });

        const rows = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.certificates)
            ? response.data.certificates
            : [];

        setCertificates(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load certificates");
        console.error("Error loading certificates:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, []);

  const filtered = certificates.filter((c) => {
    const matchesSearch =
      (c.full_name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.external_id?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const certificateStatus = normalizeStatus(c.status);
    const matchesStatus = statusFilter === "all" || certificateStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageHeader
        title="Certificate registry"
        description="View, manage, and track all issued certificates."
      />

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{certificates.length}</p>
                <p className="text-xs text-muted-foreground">Generated certificates</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by certificate ID or student…"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="issued">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading certificates…</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Issued At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((cert) => {
                    const certificateStatus = normalizeStatus(cert.status);
                    const status = statusConfig[certificateStatus as keyof typeof statusConfig] || statusConfig.pending;
                    const issuedAt = formatIssuedTimestamp(cert.created_at);
                    return (
                      <TableRow key={cert.id || cert.external_id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">{cert.external_id || "—"}</TableCell>
                        <TableCell className="font-medium text-sm">{cert.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cert.email || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>{issuedAt.date}</div>
                          {issuedAt.time ? <div className="text-xs text-muted-foreground/80">{issuedAt.time}</div> : null}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="gap-1">
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {cert.download_url ? (
                              <Button asChild variant="ghost" size="sm" className="gap-2">
                                <a
                                  href={cert.download_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => addSessionActivity("certificate_downloaded", cert.external_id || cert.full_name, {
                                    certificateId: cert.external_id,
                                  })}
                                >
                                  <Download className="h-4 w-4" /> Download
                                </a>
                              </Button>
                            ) : null}
                            <Button asChild variant="ghost" size="sm" className="gap-2">
                              <a
                                href={`/verify/${encodeURIComponent(cert.external_id)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => addSessionActivity("certificate_verified", cert.external_id || cert.full_name, {
                                  certificateId: cert.external_id,
                                })}
                              >
                                <ExternalLink className="h-4 w-4" /> Verify
                              </a>
                            </Button>
                          </div>
                          {cert.retention_note ? (
                            <p className="mt-2 text-xs text-muted-foreground">{cert.retention_note}</p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No certificates found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {certificates.length} certificates
        </p>
      )}
    </PageContainer>
  );
};

export default Registry;
