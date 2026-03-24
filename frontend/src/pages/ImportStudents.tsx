import { useEffect, useRef, useState, type DragEvent } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Download, Loader2, WandSparkles, FileDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_BASE = "http://127.0.0.1:8000";

interface PreviewRow {
  row: number;
  student_name: string;
  email: string;
  certificate_id: string;
  status: "valid" | "error" | "duplicate";
  error: string;
}

interface GeneratedCert {
  id: string;
  url: string;
  student_name: string;
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

  // Template selection
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generatedCerts, setGeneratedCerts] = useState<GeneratedCert[]>([]);

  // Load templates on mount
  useEffect(() => {
    const load = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch(`${API_BASE}/api/templates?official=true`);
        const data = res.ok ? await res.json() : [];
        setTemplates(Array.isArray(data) ? data : []);
      } catch {
        setTemplates([]);
      } finally {
        setLoadingTemplates(false);
      }
    };
    load();
  }, []);

  const parseFile = async (file: File) => {
    setExcelFile(file);
    setRows([]);
    setSummary({ valid: 0, errors: 0, duplicates: 0, total: 0 });
    setParseError("");
    setGeneratedCerts([]);
    setGenerateError("");
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

  const generateCertificates = async () => {
    if (!excelFile || !selectedTemplateId) return;
    setGenerating(true);
    setGenerateError("");
    setGeneratedCerts([]);

    try {
      const savedLayout = localStorage.getItem("certifypro_layout_config");
      const layoutConfig = savedLayout ?? "{}";

      const form = new FormData();
      form.append("excel_file", excelFile);
      form.append("layout_config", layoutConfig);
      form.append("template_id", selectedTemplateId);

      const res = await fetch(`${API_BASE}/api/generate/certificates`, { method: "POST", body: form });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Generation failed: ${res.status} ${txt}`);
      }
      const data = await res.json();
      setGeneratedCerts(data.certificates ?? []);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
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

  const canGenerate = summary.valid > 0 && !!selectedTemplateId && !generating;

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Import Student Data</h1>
          <p className="text-lg text-muted-foreground mt-1">Upload an Excel file containing the list of students for certification.</p>
        </div>
        <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-base shadow-sm hover:bg-background hover:text-foreground hover:border-foreground/40 transition-all" onClick={downloadSampleTemplate}>
          <FileDown className="w-5 h-5" /> Download Sample Template
        </Button>
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

          {/* Template Selector + Generate */}
          <Card className="card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <WandSparkles className="w-4 h-4 text-accent" /> Generate Certificates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Certificate Template</label>
                {loadingTemplates ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading templates…
                  </div>
                ) : (
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a template…" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title} {t.category ? `— ${t.category}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <p className="text-xs text-muted-foreground">Layout positions (name / QR / ID) are read from the Template Workspace settings.</p>
              </div>

              {!selectedTemplateId && (
                <p className="text-xs text-amber-600">Select a template to enable generation.</p>
              )}
              {summary.valid === 0 && (
                <p className="text-xs text-destructive">No valid rows found. Fix errors in your Excel file and re-upload.</p>
              )}

              {generateError && <p className="text-sm text-destructive">{generateError}</p>}

              <Button
                className="w-full gold-gradient text-accent-foreground gap-2 font-semibold"
                onClick={generateCertificates}
                disabled={!canGenerate}
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <WandSparkles className="w-4 h-4" />}
                {generating ? `Generating ${summary.valid} certificate(s)…` : `Generate ${summary.valid} Certificate(s)`}
              </Button>

              {generatedCerts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {generatedCerts.length} certificate(s) generated successfully
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {generatedCerts.map((cert) => (
                      <div key={cert.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm bg-muted/30">
                        <span className="text-foreground font-medium truncate mr-3">
                          {cert.student_name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">#{cert.id}</span>
                        </span>
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-accent underline text-xs shrink-0 hover:opacity-80"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ImportStudents;

