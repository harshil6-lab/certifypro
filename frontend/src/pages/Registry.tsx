import { useState } from "react";
import {
  Search,
  Download,
  XCircle,
  Filter,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  Ban,
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

const certificates = [
  { id: "CERT-2024-0001", name: "Alice Johnson", course: "B.Sc. Computer Science", date: "2024-06-15", status: "active" },
  { id: "CERT-2024-0002", name: "Bob Smith", course: "M.A. Economics", date: "2024-06-15", status: "active" },
  { id: "CERT-2024-0003", name: "Charlie Brown", course: "B.Tech. Engineering", date: "2024-06-14", status: "revoked" },
  { id: "CERT-2024-0004", name: "Diana Prince", course: "Ph.D. Physics", date: "2024-06-14", status: "active" },
  { id: "CERT-2024-0005", name: "Eve Williams", course: "M.B.A.", date: "2024-06-13", status: "pending" },
  { id: "CERT-2024-0006", name: "Frank Miller", course: "B.Sc. Mathematics", date: "2024-06-13", status: "active" },
  { id: "CERT-2024-0007", name: "Grace Lee", course: "B.A. Literature", date: "2024-06-12", status: "active" },
  { id: "CERT-2024-0008", name: "Henry Davis", course: "M.Sc. Chemistry", date: "2024-06-12", status: "active" },
];

const statusConfig = {
  active: { label: "Active", icon: CheckCircle2, className: "text-success border-success/30 bg-success/5" },
  pending: { label: "Pending", icon: Clock, className: "text-accent border-accent/30 bg-accent/5" },
  revoked: { label: "Revoked", icon: Ban, className: "text-destructive border-destructive/30 bg-destructive/5" },
};

const Registry = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = certificates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Certificate Registry</h1>
        <p className="text-muted-foreground mt-1">View, manage, and track all issued certificates</p>
      </div>

      {/* Filters */}
      <Card className="card-shadow">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or certificate ID..."
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
                <SelectItem value="active">Active</SelectItem>
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

      {/* Table */}
      <Card className="card-shadow">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date Issued</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((cert) => {
                const status = statusConfig[cert.status as keyof typeof statusConfig];
                return (
                  <TableRow key={cert.id} className="hover:bg-accent/5 transition-colors cursor-pointer">
                    <TableCell className="font-mono text-sm">{cert.id}</TableCell>
                    <TableCell className="font-medium">{cert.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cert.course}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cert.date}</TableCell>
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {certificates.length} certificates</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled className="hover:bg-accent/5 transition-colors">Previous</Button>
          <Button variant="outline" size="sm" className="hover:bg-accent/5 hover:border-accent/50 transition-colors">Next</Button>
        </div>
      </div>
    </div>
  );
};

export default Registry;
