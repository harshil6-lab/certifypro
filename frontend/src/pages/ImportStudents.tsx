import { useEffect, useRef, useState, type DragEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader2, FileDown, Database } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const API_BASE = "";
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
      const res = await fetch(`${API_BASE}/api/generate/preview`, { method: "POST", body: form });
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
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Import Student Data</h1>
          <p className="text-lg text-muted-foreground mt-1">Upload an Excel file containing the list of students for certification.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {rows.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 h-11 px-6 text-base shadow-sm"
                >
                  <XCircle className="w-5 h-5" /> Clear Imported Session
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
                  <AlertDialogAction onClick={clearImportedSession}>Clear Session</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-base shadow-sm hover:bg-background hover:text-foreground hover:border-foreground/40 transition-all" onClick={downloadSampleTemplate}>
            <FileDown className="w-5 h-5" /> Download Sample Template
          </Button>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="card-shadow hover:card-shadow-lg transition-all duration-300 border-2 border-transparent hover:border-accent/20">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-14 text-center transition-all duration-300 cursor-pointer seal-pattern group ${dragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/60 hover:bg-accent/5"}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:bg-accent/20">
              {parsing ? <Loader2 className="w-10 h-10 text-accent animate-spin" /> : <FileSpreadsheet className="w-10 h-10 text-accent" />}
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {excelFile ? excelFile.name : "Drag & drop your Excel file here"}
            </h3>
            <p className="text-base text-muted-foreground mb-6 max-w-sm mx-auto">
              {parsing ? "Parsing file…" : "Supports .xlsx and .xls files with student_name, email, certificate_id columns."}
            </p>
            <Button size="lg" className="gap-2 gold-gradient text-accent-foreground font-semibold shadow-md hover:opacity-90 transition-all pointer-events-none">
              <Upload className="w-5 h-5" /> Browse Files
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileInput} />
          </div>
          {parseError && <p className="mt-3 text-sm text-destructive">{parseError}</p>}
        </CardContent>
      </Card>

      {/* Summary — only after parsing */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="card-shadow border-l-4 border-l-green-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{summary.valid}</p>
                  <p className="text-xs text-muted-foreground">Valid Records</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-shadow border-l-4 border-l-destructive hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{summary.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors Found</p>
                </div>
              </CardContent>
            </Card>
            <Card className="card-shadow border-l-4 border-l-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{summary.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation Table */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Validation Preview ({summary.total} rows)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student Name</TableHead>
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
                            ? "bg-accent/5"
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
                          <Badge variant="outline" className="text-green-600 border-green-500/30 bg-green-500/5">Valid</Badge>
                        )}
                        {row.status === "error" && (
                          <Badge variant="destructive" title={row.error}>Error</Badge>
                        )}
                        {row.status === "duplicate" && (
                          <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5" title={row.error}>Duplicate</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Save to Database */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" /> Save to Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {summary.valid === 0 && (
                <p className="text-xs text-destructive">No valid rows found. Fix errors in your Excel file and re-upload.</p>
              )}

              {saveError && <p className="text-sm text-destructive">{saveError}</p>}

              {saveSuccess > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50/50 border border-green-200/50 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4" />
                  {saveSuccess} student(s) saved to database successfully.
                </div>
              )}

              {saveRejected.length > 0 && (
                <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1">
                  <p className="font-semibold">{saveRejected.length} row(s) rejected during save:</p>
                  <ul className="list-disc list-inside space-y-0.5">
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
                className="w-full gold-gradient text-accent-foreground gap-2 font-semibold"
                onClick={saveStudents}
                disabled={summary.valid === 0 || saving}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {saving ? `Saving ${summary.valid} student(s)…` : `Save ${summary.valid} Valid Student(s)`}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ImportStudents;

