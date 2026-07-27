// Payroll Detail — employee list with projected/actual salary, claims and
// payslip status. Tabs (all / included / excluded), search and pagination.
import { useMemo, useState } from "react";
import { Search20Regular, Filter20Regular, Add20Regular, ArrowRight20Regular } from "@fluentui/react-icons";
import { I, C, Pill, Btn, AvatarChip, ViewHeader } from "../../components/index.js";
import { usePayroll } from "../state.js";
import { EMPLOYEES, TOTAL_EMPLOYEE_COUNT } from "../data.js";
import { formatZAR } from "../helpers.js";

const TABS = [
  { id: "all", label: "View all" },
  { id: "included", label: "Employee Included" },
  { id: "excluded", label: "Employee Excluded" },
];

function payslip(e, phase) {
  if (!e.included) return { label: "Excluded", bg: C.surfaceMute, fg: C.muted, dot: true };
  if (phase === "completed") return e.failed ? { label: "Failed", bg: C.dangerBg, fg: C.danger, dot: true } : { label: "Generated", bg: C.successBg, fg: C.success, dot: true };
  if (phase === "processing") return { label: "Processing", bg: C.warningBg, fg: C.warning, dot: true };
  return { label: "Draft", bg: C.brandTint, fg: C.brand, draft: true };
}

function initials(name) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}

export function EmployeesView() {
  const { phase } = usePayroll();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => EMPLOYEES.filter((e) => {
    if (tab === "included" && !e.included) return false;
    if (tab === "excluded" && e.included) return false;
    if (q && !`${e.name} ${e.number} ${e.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tab, q]);

  const th = { padding: "10px 16px", fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: `1px solid ${C.hairline}`, whiteSpace: "nowrap" };
  const td = { padding: "12px 16px", fontSize: 13, color: C.text, whiteSpace: "nowrap" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <ViewHeader title="Payroll Detail" subtitle="Employee list, salaries, claims and payslip status for this run."
        action={<Btn variant="primary"><I as={Add20Regular} size={15} /> Add Employee</Btn>} />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
        <div style={{ background: "#fff", border: `1px solid ${C.hairline}`, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {/* controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", padding: 16, borderBottom: `1px solid ${C.hairline}` }}>
            <div style={{ display: "inline-flex", border: `1px solid ${C.hairline}`, borderRadius: 4, padding: 3, background: "#fff" }}>
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  border: "none", borderRadius: 3, padding: "5px 12px", cursor: "pointer",
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                  background: tab === t.id ? C.surfaceMute : "transparent",
                  color: tab === t.id ? C.ink : C.muted,
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.faint, display: "inline-flex" }}><I as={Search20Regular} size={15} /></span>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
                  style={{ width: 240, padding: "8px 10px 8px 32px", border: `1px solid ${C.hairlineSoft}`, borderRadius: 4, fontSize: 13, background: C.surfaceAlt, color: C.text, fontFamily: "inherit" }} />
              </div>
              <Btn variant="secondary"><I as={Filter20Regular} size={15} /> Filters</Btn>
            </div>
          </div>

          {/* table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 940, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: C.surfaceAlt, textAlign: "left" }}>
                  <th style={th}>Name</th>
                  <th style={th}>Employee Number</th>
                  <th style={th}>Department</th>
                  <th style={th}>Payslip</th>
                  <th style={{ ...th, textAlign: "right" }}>Projected Salary</th>
                  <th style={{ ...th, textAlign: "right" }}>Actual Salary</th>
                  <th style={{ ...th, textAlign: "right" }}>Claim</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => {
                  const p = payslip(e, phase);
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${C.surfaceMute}` }}>
                      <td style={td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <AvatarChip initials={initials(e.name)} color={e.color} size={30} />
                          <div>
                            <div style={{ fontWeight: 600, color: C.ink }}>{e.name}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>{e.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, color: C.muted }}>{e.number}</td>
                      <td style={{ ...td, color: C.muted }}>{e.department}</td>
                      <td style={td}>
                        {p.draft ? (
                          <span style={{ display: "inline-flex", alignItems: "center", border: `1px dashed ${C.brand}`, background: C.brandTint, color: C.brand, borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 8px", textTransform: "uppercase" }}>Draft</span>
                        ) : (
                          <Pill fg={p.fg} bg={p.bg}>{p.label}</Pill>
                        )}
                      </td>
                      <td style={{ ...td, textAlign: "right", color: C.muted }}>{formatZAR(e.projectedSalary)}</td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {e.included && phase === "completed" && e.actualSalary != null
                          ? <span style={{ fontWeight: 700, color: C.ink }}>{formatZAR(e.actualSalary)}</span>
                          : <span style={{ color: C.faint }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        {e.claim > 0 ? <Pill fg={C.warning} bg={C.warningBg}>{formatZAR(e.claim)}</Pill> : <span style={{ color: C.faint }}>—</span>}
                      </td>
                      <td style={{ ...td, textAlign: "right" }}>
                        <Btn variant="secondary" size="sm">View details <I as={ArrowRight20Regular} size={14} /></Btn>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", fontSize: 13, color: C.muted }}>No employees match this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, borderTop: `1px solid ${C.hairline}` }}>
            <span style={{ fontSize: 13, color: C.muted }}>Showing {rows.length} of {TOTAL_EMPLOYEE_COUNT} employees</span>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" size="sm">Previous</Btn>
              <Btn variant="secondary" size="sm">Next</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
