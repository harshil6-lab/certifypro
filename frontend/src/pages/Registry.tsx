import { useState, useEffect } from "react";
import {
  Search,
  Download,
  XCircle,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Ban,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCertificates } from "@/services/apiService";

const statusConfig = {
  issued: { label: "Active", icon: CheckCircle2, className: "text-success border-success/30 bg-success/5" },
  pending: { label: "Pending", icon: Clock, className: "text-accent border-accent/30 bg-accent/5" },
  revoked: { label: "Revoked", icon: Ban, className: "text-destructive border-destructive/30 bg-destructive/5" },
};

const Registry = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCertificates = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCertificates();
        setCertificates(Array.isArray(data) ? data : data.certificates || []);
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
      (c.student_id?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (c.id?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Certificate Registry</h1>
          <p className="text-muted-foreground mt-1">View, manage, and track all issued certificates</p>
          <Badge variant="secondary" className="mt-2 text-xs">Connected to backend</Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by certificate ID or student..."
                className="pl-10 focus:ring-2 focus:ring-accent/20 transition-shadow"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 hover:border-accent/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="issued">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2 hover:bg-accent/5 hover:border-accent/50 transition-colors">
              <Filter className="w-4 h-4" /> More Filters
            </Button>
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
        <Card className="card-shadow">
          <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-muted-foreground">Loading certificates...</p>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!loading && (
        <Card className="card-shadow">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate ID</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((cert) => {
                    const status = statusConfig[cert.status as keyof typeof statusConfig] || statusConfig.pending;
                    const issuedDate = cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "N/A";
                    return (
                      <TableRow key={cert.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                        <TableCell className="font-mono text-sm">{cert.id.slice(0, 8)}...</TableCell>
                        <TableCell className="font-medium text-sm">{cert.student_id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cert.template_id ? cert.template_id.slice(0, 8) + "..." : "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{issuedDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${status.className}`}>
                            <status.icon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-accent/10 transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2">
                                <Download className="w-4 h-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive">
                                <XCircle className="w-4 h-4" /> Revoke
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {filtered.length} of {certificates.length} certificates</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="hover:bg-accent/5 transition-colors">Previous</Button>
            <Button variant="outline" size="sm" className="hover:bg-accent/5 hover:border-accent/50 transition-colors">Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registry;
