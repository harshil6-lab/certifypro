import { useState, useEffect } from "react";
import axios from "axios";
import {
  Download,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageToolbar } from "@/components/layout/PageContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/components/States";
import { supabase } from "@/lib/supabaseClient";
import { API_BASE } from "@/services/apiService";
import { addSessionActivity } from "@/services/sessionActivity";

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

  const statusFiltered = certificates.filter((c) => {
    const certificateStatus = normalizeStatus(c.status);
    return statusFilter === "all" || certificateStatus === statusFilter;
  });

  const columns: DataColumn<RegistryCertificate>[] = [
    {
      key: "external_id",
      header: "Certificate ID",
      accessor: (cert) => cert.external_id,
      sortable: true,
      render: (cert) => <span className="font-mono text-[13px]">{cert.external_id || "—"}</span>,
    },
    {
      key: "full_name",
      header: "Recipient",
      accessor: (cert) => cert.full_name,
      sortable: true,
      render: (cert) => <span className="font-medium">{cert.full_name || "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      accessor: (cert) => cert.email,
      render: (cert) => <span className="text-muted-foreground">{cert.email || "—"}</span>,
    },
    {
      key: "created_at",
      header: "Issued At",
      accessor: (cert) => cert.created_at,
      sortable: true,
      render: (cert) => {
        const issuedAt = formatIssuedTimestamp(cert.created_at);
        return (
          <span className="text-muted-foreground">
            <span className="block">{issuedAt.date}</span>
            {issuedAt.time ? <span className="block text-xs text-muted-foreground/80">{issuedAt.time}</span> : null}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (cert) => normalizeStatus(cert.status),
      sortable: true,
      // Registry labels "issued" as Active; StatusBadge defaults match every other label.
      render: (cert) => {
        const certificateStatus = normalizeStatus(cert.status);
        return (
          <StatusBadge
            status={certificateStatus}
            label={certificateStatus === "issued" ? "Active" : undefined}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (cert) => (
        <div>
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
                  <Download className="h-4 w-4" aria-hidden="true" /> Download
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
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Verify
              </a>
            </Button>
          </div>
          {cert.retention_note ? (
            <p className="mt-2 text-xs text-muted-foreground">{cert.retention_note}</p>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageToolbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Registry" }]}
        title="Certificate registry"
        description="View, manage, and track all issued certificates."
      />

      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Download className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-foreground">{certificates.length}</p>
                <p className="text-xs text-muted-foreground">Generated certificates</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Could not load certificates"
          description={error}
        />
      )}

      {loading && <LoadingState rows={8} />}

      {!loading && (
        <DataTable<RegistryCertificate>
          columns={columns}
          rows={statusFiltered}
          rowKey={(cert, index) => cert.id || cert.external_id || String(index)}
          searchPlaceholder="Search by certificate ID or student…"
          getSearchText={(cert) =>
            `${cert.full_name ?? ""} ${cert.external_id ?? ""} ${cert.email ?? ""}`
          }
          filterSlot={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" aria-label="Filter by status">
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
          }
          emptyTitle="No certificates found"
          emptyDescription="Try adjusting your search or status filter."
          caption="Certificate registry"
        />
      )}
    </PageContainer>
  );
};

export default Registry;
