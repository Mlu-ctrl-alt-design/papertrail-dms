// Fluent 2 DataTable: search + sort + per-column filters + pagination + sticky
// header. Columns are { id, label, get, renderCell?, sortable?, filterable?,
// align?, width?, minWidth? }. Search keys default to all columns; pass
// `searchKeys` to scope.
import { useState } from "react";
import {
  Search20Regular, ArrowSortDown20Regular, ArrowSortUp20Regular,
  Filter20Regular, Filter20Filled,
  ChevronLeft20Regular, ChevronRight20Regular,
} from "@fluentui/react-icons";
import { I } from "./Icon.jsx";
import { C } from "./tokens.js";
import { Btn, FluentSelect, Skeleton } from "./primitives.jsx";
import { ColumnFilterPopover } from "./overlays.jsx";
import { useSimulatedLoad } from "./loading.jsx";

export function DataTable({
  rows, columns, getKey,
  searchPlaceholder = "Search…",
  searchKeys, defaultSort,
  defaultPageSize = 10, pageSizeOptions = [10, 25, 50],
  onRowClick, selectedKey,
  emptyMessage = "No records.",
  toolbarRight,
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(defaultSort || { col: columns[0].id, dir: "asc" });
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const initialLoading = useSimulatedLoad([], 1500);
  const filterLoading = useSimulatedLoad(
    [query, JSON.stringify(filters), sort.col, sort.dir, page, pageSize],
    760
  );
  const showShimmer = initialLoading || filterLoading;

  const filterOptions = (col) =>
    Array.from(new Set(rows.map(col.get))).sort((a, b) =>
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b))
    );

  let filtered = rows;
  if (query) {
    const q = query.toLowerCase();
    if (searchKeys) {
      filtered = filtered.filter((r) =>
        searchKeys.some((k) => {
          const col = columns.find((c) => c.id === k);
          const v = col ? col.get(r) : r[k];
          return v != null && String(v).toLowerCase().includes(q);
        })
      );
    } else {
      filtered = filtered.filter((r) =>
        columns.some((c) => String(c.get(r)).toLowerCase().includes(q))
      );
    }
  }
  Object.entries(filters).forEach(([colId, vals]) => {
    if (vals && vals.size > 0) {
      const col = columns.find((c) => c.id === colId);
      if (col) filtered = filtered.filter((r) => vals.has(col.get(r)));
    }
  });
  const sortCol = columns.find((c) => c.id === sort.col);
  if (sortCol && sortCol.sortable !== false) {
    filtered = [...filtered].sort((a, b) => {
      const av = sortCol.get(a), bv = sortCol.get(b);
      const cmp = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(page, totalPages);
  const paged = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    if (sort.col === col.id) setSort({ col: col.id, dir: sort.dir === "asc" ? "desc" : "asc" });
    else setSort({ col: col.id, dir: "asc" });
  };
  const toggleFilterValue = (colId, v) =>
    setFilters((f) => {
      const c = new Set(f[colId] || []);
      if (c.has(v)) c.delete(v); else c.add(v);
      return { ...f, [colId]: c };
    });
  const clearAll = () => { setFilters({}); setQuery(""); setPage(1); };
  const hasFilters = query || Object.values(filters).some((v) => v && v.size > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflow: "hidden", background: C.surfaceAlt }}>
      <div style={{
        padding: "10px 20px", borderBottom: `1px solid ${C.hairline}`, background: "#fff",
        flexShrink: 0, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 280px", maxWidth: 420, position: "relative" }}>
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                 placeholder={searchPlaceholder}
                 style={{
                   width: "100%", padding: "6px 10px 6px 32px",
                   border: `1px solid ${C.hairline}`, borderRadius: 4,
                   fontSize: 13, background: "#fff",
                 }} />
          <div style={{ position: "absolute", left: 10, top: 7, color: C.muted, display: "inline-flex" }}>
            <I as={Search20Regular} size={14} />
          </div>
        </div>
        {hasFilters && <Btn variant="ghost" size="sm" onClick={clearAll}>Clear filters</Btn>}
        <span style={{ marginLeft: "auto", fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>
          {total} of {rows.length} records
        </span>
        {toolbarRight}
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "#fff", minHeight: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr>
              {columns.map((c) => {
                const isSort = sort.col === c.id;
                const hasFilter = filters[c.id] && filters[c.id].size > 0;
                const sortable = c.sortable !== false;
                return (
                  <th key={c.id} style={{
                    textAlign: c.align || "left", padding: "10px 12px",
                    fontSize: 11, fontWeight: 600, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.5px",
                    borderBottom: `1px solid ${C.hairline}`, background: C.surfaceAlt,
                    position: "sticky", top: 0, zIndex: 2,
                    whiteSpace: "nowrap", width: c.width, minWidth: c.minWidth,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, position: "relative",
                                  justifyContent: c.align === "right" ? "flex-end" : "flex-start" }}>
                      {sortable ? (
                        <span onClick={() => toggleSort(c)} style={{
                          cursor: "pointer", display: "inline-flex", alignItems: "center",
                          gap: 4, userSelect: "none",
                        }}>
                          {c.label}
                          {isSort
                            ? <span style={{ color: C.brand, display: "inline-flex" }}>
                                <I as={sort.dir === "asc" ? ArrowSortUp20Regular : ArrowSortDown20Regular} size={12} />
                              </span>
                            : <span style={{ opacity: 0.3, display: "inline-flex" }}>
                                <I as={ArrowSortDown20Regular} size={12} />
                              </span>}
                        </span>
                      ) : <span>{c.label}</span>}
                      {c.filterable && (
                        <button onClick={() => setFilterOpen(filterOpen === c.id ? null : c.id)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  padding: 2, marginLeft: 2,
                                  color: hasFilter ? C.brand : C.faint,
                                  display: "inline-flex", alignItems: "center", borderRadius: 2,
                                }}>
                          <I as={hasFilter ? Filter20Filled : Filter20Regular} size={12} />
                        </button>
                      )}
                      {filterOpen === c.id && c.filterable && (
                        <ColumnFilterPopover
                          options={filterOptions(c)}
                          selected={filters[c.id] || new Set()}
                          onToggle={(v) => { toggleFilterValue(c.id, v); setPage(1); }}
                          onClose={() => setFilterOpen(null)}
                          onClear={() => { setFilters((f) => ({ ...f, [c.id]: new Set() })); setPage(1); }}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {showShimmer
              ? Array.from({ length: Math.min(pageSize, Math.max(paged.length || 5, 5)) }).map((_, i) => (
                  <tr key={"sk" + i} style={{ background: i % 2 === 0 ? "#fff" : "#fafaf9" }}>
                    {columns.map((c, ci) => (
                      <td key={c.id} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.surfaceMute}`, verticalAlign: "middle" }}>
                        <Skeleton w={ci === 0 ? "75%" : ["55%", "40%", "60%", "45%", "50%"][ci % 5]} h={12} />
                      </td>
                    ))}
                  </tr>
                ))
              : paged.map((r, i) => {
                  const k = getKey(r);
                  const sel = selectedKey === k;
                  return (
                    <tr key={k}
                        onClick={() => onRowClick && onRowClick(r)}
                        className="fade-up"
                        style={{
                          cursor: onRowClick ? "pointer" : "default",
                          animationDelay: `${i * 0.02}s`,
                          background: sel ? C.brandTint : i % 2 === 0 ? "#fff" : "#fafaf9",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(ev) => { if (!sel && onRowClick) ev.currentTarget.style.background = C.surfaceMute; }}
                        onMouseLeave={(ev) => { if (!sel) ev.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#fafaf9"; }}>
                      {columns.map((c) => (
                        <td key={c.id} style={{
                          padding: "8px 12px", borderBottom: `1px solid ${C.surfaceMute}`,
                          verticalAlign: "middle", textAlign: c.align || "left",
                        }}>
                          {c.renderCell ? c.renderCell(r) : c.get(r)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            {!showShimmer && paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: 48, textAlign: "center", color: C.faint, fontSize: 13 }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", borderTop: `1px solid ${C.hairline}`, background: "#fff",
        flexShrink: 0, fontSize: 12, color: C.muted, gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>Rows per page:</span>
          <FluentSelect size="sm" direction="up" value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        options={pageSizeOptions} style={{ minWidth: 64 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ whiteSpace: "nowrap" }}>Page {cur} of {totalPages} · {total} records</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={cur <= 1}
                  style={{
                    padding: "4px 8px", border: `1px solid ${C.hairline}`, borderRadius: 4,
                    background: cur <= 1 ? C.surfaceMute : "#fff",
                    cursor: cur <= 1 ? "not-allowed" : "pointer",
                    display: "inline-flex", alignItems: "center",
                    color: cur <= 1 ? C.faint : C.ink,
                  }}>
            <I as={ChevronLeft20Regular} size={14} />
          </button>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={cur >= totalPages}
                  style={{
                    padding: "4px 8px", border: `1px solid ${C.hairline}`, borderRadius: 4,
                    background: cur >= totalPages ? C.surfaceMute : "#fff",
                    cursor: cur >= totalPages ? "not-allowed" : "pointer",
                    display: "inline-flex", alignItems: "center",
                    color: cur >= totalPages ? C.faint : C.ink,
                  }}>
            <I as={ChevronRight20Regular} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
