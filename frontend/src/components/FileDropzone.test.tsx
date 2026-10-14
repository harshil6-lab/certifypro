import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FileDropzone } from "@/components/FileDropzone";

function xlsx(name = "students.xlsx"): File {
  return new File(["data"], name, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("FileDropzone", () => {
  it("opens the file picker on Enter key", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileDropzone accept=".xlsx" acceptList={[".xlsx"]} onFiles={onFiles} label="Drop it" />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => undefined);

    fireEvent.keyDown(screen.getByRole("button", { name: "Drop it" }), { key: "Enter" });
    expect(clickSpy).toHaveBeenCalledOnce();

    fireEvent.keyDown(screen.getByRole("button", { name: "Drop it" }), { key: " " });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it("forwards dropped files that match the accept filter", () => {
    const onFiles = vi.fn();
    render(<FileDropzone accept=".xlsx" acceptList={[".xlsx"]} onFiles={onFiles} label="Drop it" />);

    const zone = screen.getByRole("button", { name: "Drop it" });
    fireEvent.dragOver(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [xlsx()] } });

    expect(onFiles).toHaveBeenCalledOnce();
    expect(onFiles.mock.calls[0][0]).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects files outside the accept filter with an inline error", () => {
    const onFiles = vi.fn();
    render(
      <FileDropzone
        accept=".xlsx,.xls"
        acceptList={[".xlsx", ".xls"]}
        onFiles={onFiles}
        label="Drop it"
        hint="Excel only"
      />,
    );

    const zone = screen.getByRole("button", { name: "Drop it" });
    const bad = new File(["x"], "notes.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: { files: [bad] } });

    expect(onFiles).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/unsupported file type/i);
  });

  it("is inert when disabled", () => {
    const onFiles = vi.fn();
    const { container } = render(
      <FileDropzone accept=".xlsx" onFiles={onFiles} label="Drop it" disabled />,
    );

    const zone = screen.getByRole("button", { name: "Drop it" });
    expect(zone).toHaveAttribute("aria-disabled", "true");

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => undefined);
    fireEvent.keyDown(zone, { key: "Enter" });
    fireEvent.drop(zone, { dataTransfer: { files: [xlsx()] } });

    expect(clickSpy).not.toHaveBeenCalled();
    expect(onFiles).not.toHaveBeenCalled();
  });
});
