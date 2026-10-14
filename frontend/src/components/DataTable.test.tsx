import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { DataTable, type DataColumn } from "@/components/DataTable";

type Row = { id: string; name: string; score: number };

const ROWS: Row[] = [
  { id: "3", name: "Charlie", score: 70 },
  { id: "1", name: "Alice", score: 95 },
  { id: "2", name: "Bob", score: 80 },
];

const COLUMNS: DataColumn<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "score", header: "Score", accessor: (r) => r.score, sortable: true },
];

function cellTexts(container: HTMLElement): string[] {
  const table = container.querySelector("table");
  if (!table) return [];
  return Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
    tr.textContent ?? "",
  );
}

describe("DataTable", () => {
  it("renders an empty state when there are no rows", () => {
    render(
      <DataTable<Row>
        columns={COLUMNS}
        rows={[]}
        rowKey={(r) => r.id}
        emptyTitle="Nothing here"
      />,
    );

    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sorts ascending then descending when a sortable header is clicked", () => {
    const { container } = render(
      <DataTable<Row> columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    expect(cellTexts(container).map((t) => t.slice(0, 7))).toEqual([
      "Alice95",
      "Bob80",
      "Charlie",
    ].map((t) => t.slice(0, 7)));

    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    const firstRow = container.querySelector("tbody tr");
    expect(firstRow?.textContent).toContain("Charlie");
  });

  it("paginates and reports the visible range", () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `Row ${i}`,
      score: i,
    }));
    const { container } = render(
      <DataTable<Row> columns={COLUMNS} rows={many} rowKey={(r) => r.id} pageSize={10} />,
    );

    expect(screen.getByText(/showing 1–10 of 25/i)).toBeTruthy();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(10);

    const nav = screen.getByRole("navigation", { name: /pagination/i });
    fireEvent.click(within(nav).getByRole("link", { name: "3" }));
    expect(screen.getByText(/showing 21–25 of 25/i)).toBeTruthy();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
  });

  it("filters rows through the search input", () => {
    const { container } = render(
      <DataTable<Row> columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} searchPlaceholder="Search people…" />,
    );

    fireEvent.change(screen.getByLabelText("Search people…"), { target: { value: "bob" } });
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody tr")?.textContent).toContain("Bob");
  });

  it("shows a bulk-action bar with the selection count", () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <DataTable<Row>
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(r) => r.id}
        selectable
        bulkActions={<button type="button">Export</button>}
        onSelectionChange={onSelectionChange}
      />,
    );

    const checkboxes = within(container.querySelector("table")!).getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(screen.getByText("1 selected")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Export" })).toBeTruthy();
    expect(onSelectionChange).toHaveBeenCalledWith([ROWS[0]]);
  });
});
