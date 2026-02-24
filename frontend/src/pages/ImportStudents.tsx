import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const sampleData = [
  { id: 1, name: "Alice Johnson", email: "alice@university.edu", course: "B.Sc. Computer Science", status: "valid" },
  { id: 2, name: "Bob Smith", email: "bob@university.edu", course: "M.A. Economics", status: "valid" },
  { id: 3, name: "", email: "charlie@university.edu", course: "B.Tech. Engineering", status: "error" },
  { id: 4, name: "Diana Prince", email: "diana@university.edu", course: "Ph.D. Physics", status: "valid" },
  { id: 5, name: "Eve Williams", email: "eve@university.edu", course: "B.Sc. Computer Science", status: "duplicate" },
  { id: 6, name: "Frank Miller", email: "frank@university.edu", course: "M.B.A.", status: "valid" },
];

const ImportStudents = () => {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Import Student Data</h1>
          <p className="text-lg text-muted-foreground mt-1">Upload an Excel file containing the list of students for certification.</p>
        </div>
        <Button variant="outline" size="lg" className="gap-2 h-11 px-6 text-base shadow-sm hover:bg-background hover:text-foreground hover:border-foreground/40 transition-all">
          <Download className="w-5 h-5" /> Download Excel Template
        </Button>
      </div>

      {/* Upload Area */}
      <Card className="card-shadow hover:card-shadow-lg transition-all duration-300 border-2 border-transparent hover:border-accent/20">
        <CardContent className="p-8">
          <div className="border-3 border-dashed border-border rounded-xl p-16 text-center hover:border-accent/60 hover:bg-accent/5 transition-all duration-300 cursor-pointer seal-pattern group">
            <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:bg-accent/20">
              <FileSpreadsheet className="w-10 h-10 text-accent" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Drag & drop your Excel file here
            </h3>
            <p className="text-base text-muted-foreground mb-8 max-w-sm mx-auto">
              Supports .xlsx and .csv files. Ensure your file matches the template structure.
            </p>
            <Button size="lg" className="gap-2 gold-gradient text-accent-foreground font-semibold shadow-md hover:opacity-90 transition-all">
              <Upload className="w-5 h-5" /> Browse System Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-shadow border-l-4 border-l-success hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">4</p>
              <p className="text-xs text-muted-foreground">Valid Records</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow border-l-4 border-l-destructive hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-destructive" />
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Errors Found</p>
            </div>
          </CardContent>
        </Card>
        <Card className="card-shadow border-l-4 border-l-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-accent" />
            <div>
              <p className="text-2xl font-heading font-bold text-foreground">1</p>
              <p className="text-xs text-muted-foreground">Duplicates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Validation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.status === "error"
                      ? "bg-destructive/5"
                      : row.status === "duplicate"
                        ? "bg-accent/5"
                        : ""
                  }
                >
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell className={`font-medium ${!row.name ? "text-destructive italic" : ""}`}>
                    {row.name || "Missing name"}
                  </TableCell>
                  <TableCell className="text-sm">{row.email}</TableCell>
                  <TableCell className="text-sm">{row.course}</TableCell>
                  <TableCell className="text-right">
                    {row.status === "valid" && (
                      <Badge variant="outline" className="text-success border-success/30 bg-success/5">Valid</Badge>
                    )}
                    {row.status === "error" && (
                      <Badge variant="destructive">Error</Badge>
                    )}
                    {row.status === "duplicate" && (
                      <Badge variant="outline" className="text-accent border-accent/30 bg-accent/5">Duplicate</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="gold-gradient text-accent-foreground hover:opacity-90 gap-2">
          <CheckCircle2 className="w-4 h-4" /> Import Valid Records
        </Button>
      </div>
    </div>
  );
};

export default ImportStudents;
