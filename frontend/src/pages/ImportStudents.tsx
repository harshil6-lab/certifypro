import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, XCircle, Loader2, FileDown, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageContainer, PageToolbar } from "@/components/layout/PageContainer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { FileDropzone } from "@/components/FileDropzone";
import { addSessionActivity } from "@/services/sessionActivity";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const IMPORT_SESSION_KEY = "certifypro_import_students_session";

interface PreviewRow {
  row: number;
  student_name: string;
  email: string;
  certificate_id: string;
  status: "valid" | "error" | "duplicate";
  error: string;
}

const ImportStudents = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File + parse state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [summary, setSummary] = useState({ valid: 0, errors: 0, duplicates: 0, total: 0 });

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(0);
  const [saveRejected, setSaveRejected] = useState<{ row: number; student_name?: string; missing?: string[]; error?: string }[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(IMPORT_SESSION_KEY);
      if (!raw) {
        return;
      }
      const cached = JSON.parse(raw);
      setExcelFile(cached.excelFileName ? { name: cached.excelFileName } as File : null);
      setRows(Array.isArray(cached.rows) ? cached.rows : []);
      setSummary(cached.summary ?? { valid: 0, errors: 0, duplicates: 0, total: 0 });
      setParseError(cached.parseError ?? "");
      setSaveError(cached.saveError ?? "");
      setSaveSuccess(cached.saveSuccess ?? 0);
      setSaveRejected(Array.isArray(cached.saveRejected) ? cached.saveRejected : []);
    } catch {
      sessionStorage.removeItem(IMPORT_SESSION_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = {
      excelFileName: excelFile?.name ?? null,
      rows,
      summary,
      parseError,
      saveError,
      saveSuccess,
      saveRejected,
    };
    sessionStorage.setItem(IMPORT_SESSION_KEY, JSON.stringify(payload));
  }, [excelFile, rows, summary, parseError, saveError, saveSuccess, saveRejected]);

  const clearImportedSession = () => {
    setExcelFile(null);
    setParsing(false);
    setParseError("");
    setRows([]);
    setSummary({ valid: 0, errors: 0, duplicates: 0, total: 0 });
    setSaving(false);
    setSaveError("");
    setSaveSuccess(0);
    setSaveRejected([]);
    sessionStorage.removeItem(IMPORT_SESSION_KEY);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parseFile = async (file: File) => {
    setExcelFile(file);
    setRows([]);
    setSummary({ valid: 0, errors: 0, duplicates: 0, total: 0 });
    setParseError("");
    setSaveError("");
    setSaveSuccess(0);
    setSaveRejected([]);
    setParsing(true);

    try {
      const form = new FormData();
      form.append("excel_file", file);
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch(`${API_BASE}/api/generate/preview`, {
        method: "POST",
        headers,
        body: form
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Parse failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setRows(data.rows ?? []);
      setSummary(data.summary ?? { valid: 0, errors: 0, duplicates: 0, total: 0 });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    } finally {
      setParsing(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (file) await parseFile(file);
  };

  const saveStudents = async () => {
    const validRows = rows.filter((r) => r.status === "valid");
    if (!validRows.length) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(0);
    setSaveRejected([]);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/import-students/save`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rows: validRows }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Save failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setSaveSuccess(data.saved ?? validRows.length);
      if (data.rejected_rows?.length) setSaveRejected(data.rejected_rows);
      addSessionActivity(
        "students_imported",
        `${data.saved ?? validRows.length} students saved${data.rejected_rows?.length ? `, ${data.rejected_rows.length} rejected` : ""}`,
        {
          saved: data.saved ?? validRows.length,
          rejected: data.rejected_rows?.length ?? 0,
        },
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  // Download a sample Excel template as CSV (no xlsx lib needed)
  const downloadSampleTemplate = () => {
    const csv = "student_name,email,certificate_id\nAlice Johnson,alice@example.com,CERT001\nBob Smith,bob@example.com,CERT002\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certifypro_student_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewColumns: DataColumn<PreviewRow>[] = [
    {
      key: "row",
      header: "#",
      accessor: (row) => row.row,
      sortable: true,
      render: (row) => <span className="font-mono text-xs">{row.row}</span>,
    },
    {
      key: "student_name",
      header: "Student name",
      accessor: (row) => row.student_name,
      sortable: true,
      render: (row) => (
        <span className={`font-medium ${!row.student_name ? "text-destructive italic" : ""}`}>
          {row.student_name || "Missing name"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      accessor: (row) => row.email,
      sortable: true,
      render: (row) =>
        row.email ? <span className="text-sm">{row.email}</span> : <span className="italic text-muted-foreground">—</span>,
    },
    {
      key: "certificate_id",
      header: "Certificate ID",
      accessor: (row) => row.certificate_id,
      sortable: true,
      render: (row) =>
        row.certificate_id ? (
          <span className="text-sm font-mono">{row.certificate_id}</span>
        ) : (
          <span className="italic text-muted-foreground">auto</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => row.status,
      sortable: true,
      className: "text-right",
      render: (row) => <StatusBadge status={row.status} label={row.status === "valid" ? "Valid" : row.status === "error" ? "Error" : "Duplicate"} title={row.error || undefined} />,
    },
  ];

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageToolbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Import students" }]}
        title="Import students"
        description="Upload an Excel file with student_name, email, and certificate_id columns."
        actions={
          <>
            {rows.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <XCircle className="h-4 w-4" aria-hidden="true" /> Clear session
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear imported student session?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the current uploaded sheet preview, validation summary, and unsaved session data from this browser session.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearImportedSession}>Clear session</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="outline" className="gap-2" onClick={downloadSampleTemplate}>
              <FileDown className="h-4 w-4" aria-hidden="true" /> Download sample template
            </Button>
          </>
        }
      />

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <FileDropzone
            accept=".xlsx,.xls"
            acceptList={[".xlsx", ".xls"]}
            label={parsing ? "Parsing file…" : excelFile ? excelFile.name : "Drag and drop your Excel file here"}
            hint="Supports .xlsx and .xls files with student_name, email, and certificate_id columns."
            inputRef={fileInputRef}
            onFiles={(files) => void handleFiles(files)}
          />
          {parsing ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Parsing file…
            </p>
          ) : null}
          {parseError && (
            <Alert variant="destructive" className="mt-3">
              <AlertTitle>Parse failed</AlertTitle>
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary — only after parsing */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid records</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors found</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Validation preview ({summary.total} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable<PreviewRow>
                columns={previewColumns}
                rows={rows}
                rowKey={(row) => String(row.row)}
                searchPlaceholder="Search rows…"
                rowClassName={(row) =>
                  row.status === "error"
                    ? "bg-destructive/5"
                    : row.status === "duplicate"
                      ? "bg-warning/5"
                      : undefined
                }
                emptyTitle="No rows to preview"
                emptyDescription="Upload an Excel file to validate student records."
                caption="Validation preview"
              />
            </CardContent>
          </Card>

          {/* Save to Database */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> Save to database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.valid === 0 && (
                <Alert variant="destructive">
                  <AlertDescription>No valid rows found. Fix errors in your Excel file and re-upload.</AlertDescription>
                </Alert>
              )}

              {saveError && (
                <Alert variant="destructive">
                  <AlertTitle>Save failed</AlertTitle>
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {saveSuccess > 0 && (
                <Alert variant="success">
                  <AlertDescription>
                    {saveSuccess} student(s) saved to the database successfully.
                  </AlertDescription>
                </Alert>
              )}

              {saveRejected.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>{saveRejected.length} row(s) rejected during save:</AlertTitle>
                  <AlertDescription>
                    <ul className="list-inside list-disc space-y-0.5">
                      {saveRejected.map((r, i) => (
                        <li key={i}>
                          Row {r.row}{r.student_name ? ` (${r.student_name})` : ""} —{" "}
                          {r.missing ? `missing: ${r.missing.join(", ")}` : r.error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <Button
                className="w-full gap-2"
                onClick={saveStudents}
                disabled={summary.valid === 0 || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Database className="h-4 w-4" aria-hidden="true" />}
                {saving ? `Saving ${summary.valid} student(s)…` : `Save ${summary.valid} valid student(s)`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default ImportStudents;
