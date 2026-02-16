import {
  Shield,
  UserPlus,
  MoreHorizontal,
  Mail,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const admins = [
  { name: "Dr. Sarah Chen", email: "sarah.chen@university.edu", role: "Super Admin", initials: "SC", joined: "Jan 2023" },
  { name: "Prof. James Wilson", email: "j.wilson@university.edu", role: "Admin", initials: "JW", joined: "Mar 2023" },
  { name: "Maria Garcia", email: "m.garcia@university.edu", role: "Admin", initials: "MG", joined: "Jun 2023" },
  { name: "David Kim", email: "d.kim@university.edu", role: "Admin", initials: "DK", joined: "Sep 2023" },
  { name: "Emily Brown", email: "e.brown@university.edu", role: "Admin", initials: "EB", joined: "Jan 2024" },
];

const AccessControl = () => {
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Access Control</h1>
          <p className="text-muted-foreground mt-1">Manage administrator access and permissions</p>
        </div>
        <Button className="gold-gradient text-accent-foreground hover:opacity-90 gap-2">
          <UserPlus className="w-4 h-4" /> Invite Admin
        </Button>
      </div>

      {/* Invite card */}
      <Card className="card-shadow border-2 border-dashed border-accent/30">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[240px]">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Invite by Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="colleague@institution.edu" className="pl-10" />
              </div>
            </div>
            <div className="w-40">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option>Admin</option>
                <option>Super Admin</option>
              </select>
            </div>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" /> Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card className="card-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Approved Administrators ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Administrator</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                          {admin.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {admin.role === "Super Admin" ? (
                      <Badge className="gap-1 gold-gradient text-accent-foreground border-0">
                        <Crown className="w-3 h-3" /> Super Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{admin.joined}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Change Role</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Remove Access</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessControl;
