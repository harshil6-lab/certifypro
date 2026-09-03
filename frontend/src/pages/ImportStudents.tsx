import { useEffect, useRef, useState, type DragEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader2, FileDown, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [dragActive, setDragActive] = useState(false);
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
    setDragActive(false);
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

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await parseFile(file);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
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

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageHeader
        title="Import students"
        description="Upload an Excel file with student_name, email, and certificate_id columns."
        actions={
          <>
            {rows.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <XCircle className="h-4 w-4" /> Clear session
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
              <FileDown className="h-4 w-4" /> Download sample template
            </Button>
          </>
        }
      />

      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload an Excel file: drag and drop here, or activate to browse files"
            className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {parsing ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileSpreadsheet className="h-8 w-8" />}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {excelFile ? excelFile.name : "Drag and drop your Excel file here"}
            </h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
              {parsing ? "Parsing file…" : "Supports .xlsx and .xls files with student_name, email, and certificate_id columns."}
            </p>
            <Button size="lg" tabIndex={-1} aria-hidden="true" className="pointer-events-none gap-2">
              <Upload className="h-4 w-4" /> Browse files
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
          {parseError && <p className="mt-3 text-sm text-destructive">{parseError}</p>}
        </CardContent>
      </Card>

      {/* Summary — only after parsing */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid records</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">{summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors found</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="h-5 w-5 text-warning" />
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Certificate ID</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.row}
                      className={
                        row.status === "error"
                          ? "bg-destructive/5"
                          : row.status === "duplicate"
                            ? "bg-warning/5"
                            : ""
                      }
                    >
                      <TableCell className="font-mono text-xs">{row.row}</TableCell>
                      <TableCell className={`font-medium ${!row.student_name ? "text-destructive italic" : ""}`}>
                        {row.student_name || "Missing name"}
                      </TableCell>
                      <TableCell className="text-sm">{row.email || <span className="italic text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm font-mono">{row.certificate_id || <span className="italic text-muted-foreground">auto</span>}</TableCell>
                      <TableCell className="text-right">
                        {row.status === "valid" && (
                          <Badge variant="success">Valid</Badge>
                        )}
                        {row.status === "error" && (
                          <Badge variant="destructive" title={row.error}>Error</Badge>
                        )}
                        {row.status === "duplicate" && (
                          <Badge variant="warning" title={row.error}>Duplicate</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Save to Database */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Database className="h-4 w-4 text-muted-foreground" /> Save to database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.valid === 0 && (
                <p className="text-xs text-destructive">No valid rows found. Fix errors in your Excel file and re-upload.</p>
              )}

              {saveError && <p className="text-sm text-destructive">{saveError}</p>}

              {saveSuccess > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {saveSuccess} student(s) saved to the database successfully.
                </div>
              )}

              {saveRejected.length > 0 && (
                <div className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  <p className="font-semibold">{saveRejected.length} row(s) rejected during save:</p>
                  <ul className="list-inside list-disc space-y-0.5">
                    {saveRejected.map((r, i) => (
                      <li key={i}>
                        Row {r.row}{r.student_name ? ` (${r.student_name})` : ""} —{" "}
                        {r.missing ? `missing: ${r.missing.join(", ")}` : r.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                className="w-full gap-2"
                onClick={saveStudents}
                disabled={summary.valid === 0 || saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
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
