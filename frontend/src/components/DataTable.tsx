import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/States";

export interface DataColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Plain value used for sorting and the default search text. */
  accessor?: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  searchPlaceholder?: string;
  /** Extra text per row included in search. Defaults to joined accessor values. */
  getSearchText?: (row: T) => string;
  /** Extra controls (e.g. status filter) rendered next to the search input. */
  filterSlot?: React.ReactNode;
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyTitle?: string;
  emptyDescription?: string;
  selectable?: boolean;
  bulkActions?: React.ReactNode;
  onSelectionChange?: (selected: T[]) => void;
  caption?: string;
  /** Extra class per row (e.g. error/duplicate tinting). */
  rowClassName?: (row: T, index: number) => string | undefined;
}

type SortDir = "asc" | "desc";

function compareValues(a: string | number | null | undefined, b: string | number | null | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function pageNumbers(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

/**
 * DataTable
 * Client-side search + sort + pagination + optional bulk selection, composed
 * from the existing table/pagination/checkbox/input primitives. Deliberately
 * not TanStack Table: the dependency is not installed, needs are fully met
 * by local state, and it keeps ~45KB out of the bundle. Revisit if
 * server-side paging or column virtualization is required.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchPlaceholder = "Search…",
  getSearchText,
  filterSlot,
  pageSize = 10,
  pageSizeOptions,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your search or filters.",
  selectable = false,
  bulkActions,
  onSelectionChange,
  caption,
  rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPage(1);
  }, [query, rows, perPage]);

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = !q
      ? rows
      : rows.filter((row) => {
          const text = getSearchText
            ? getSearchText(row)
            : columns
                .map((c) => c.accessor?.(row))
                .filter((v) => v != null)
                .join(" ");
          return text.toLowerCase().includes(q);
        });
    if (!sortKey) return searched;
    const column = columns.find((c) => c.key === sortKey);
    if (!column?.accessor) return searched;
    const sorted = [...searched].sort((a, b) =>
      compareValues(column.accessor?.(a), column.accessor?.(b)),
    );
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [rows, query, sortKey, sortDir, columns, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const selectedRows = useMemo(
    () => rows.filter((row, index) => selectedKeys.has(rowKey(row, index))),
    [rows, selectedKeys, rowKey],
  );

  useEffect(() => {
    onSelectionChange?.(selectedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKeys]);

  const toggleSort = (column: DataColumn<T>) => {
    if (!column.sortable || !column.accessor) return;
    if (sortKey !== column.key) {
      setSortKey(column.key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
  };

  const toggleRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const togglePage = () => {
    const keys = pageRows.map((row, i) => rowKey(row, i));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => next.has(k));
      if (allSelected) keys.forEach((k) => next.delete(k));
      else keys.forEach((k) => next.add(k));
      return next;
    });
  };

  const goTo = (event: React.MouseEvent, target: number) => {
    event.preventDefault();
    setPage(Math.min(Math.max(1, target), totalPages));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {filterSlot}
      </div>

      {selectable && selectedKeys.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2" role="toolbar" aria-label="Bulk actions">
          <span className="text-sm font-medium text-foreground">{selectedKeys.size} selected</span>
          {bulkActions}
          <Button variant="ghost" size="sm" onClick={() => setSelectedKeys(new Set())} className="ml-auto gap-1">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </Button>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {selectable ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={pageRows.length > 0 && pageRows.every((row, i) => selectedKeys.has(rowKey(row, i)))}
                      onCheckedChange={togglePage}
                      aria-label="Select all rows on this page"
                    />
                  </TableHead>
                ) : null}
                {columns.map((column) => {
                  const active = sortKey === column.key;
                  const SortIcon = !column.sortable ? null : !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
                  return (
                    <TableHead key={column.key} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined} className={column.className}>
                      {column.sortable && column.accessor ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(column)}
                          className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {column.header}
                          {SortIcon ? <SortIcon className="h-3 w-3" aria-hidden="true" /> : null}
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((row, index) => {
                const key = rowKey(row, index);
                const selected = selectedKeys.has(key);
                return (
                  <TableRow key={key} data-state={selected ? "selected" : undefined} className={rowClassName?.(row, index)}>
                    {selectable ? (
                      <TableCell>
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => toggleRow(key)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    ) : null}
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render ? column.render(row) : String(column.accessor?.(row) ?? "—")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {(safePage - 1) * perPage + 1}–{Math.min(safePage * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-3">
            {pageSizeOptions && pageSizeOptions.length > 0 ? (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Rows
                <select
                  value={perPage}
                  onChange={(event) => setPerPage(Number(event.target.value))}
                  className="h-8 rounded border border-input bg-background px-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {totalPages > 1 ? (
              <Pagination className={cn("mx-0 w-auto")}>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => goTo(e, safePage - 1)} aria-disabled={safePage === 1} className={safePage === 1 ? "pointer-events-none opacity-50" : undefined} />
                  </PaginationItem>
                  {pageNumbers(safePage, totalPages).map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink href="#" isActive={p === safePage} onClick={(e) => goTo(e, p)}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => goTo(e, safePage + 1)} aria-disabled={safePage === totalPages} className={safePage === totalPages ? "pointer-events-none opacity-50" : undefined} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
