// CSV export. Everything the console shows can leave it as a file — a comms
// officer's next stop is usually a spreadsheet or a compliance pack.
//
// Written with a UTF-8 BOM so Excel opens Setswana names and the · separator
// correctly rather than as mojibake.

const escape = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

// columns: [{ header, get }]
export function toCsv(rows, columns) {
  const head = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(c.get(r))).join(","));
  return [head, ...body].join("\r\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next tick so Safari has taken the blob.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const exportCsv = (filename, rows, columns) =>
  downloadCsv(filename, toCsv(rows, columns));

// Filenames carry the subject and the date, so a folder of exports stays legible.
export const stamp = () => new Date().toISOString().slice(0, 10);
