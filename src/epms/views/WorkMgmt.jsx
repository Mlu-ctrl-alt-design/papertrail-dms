// Productivity Management Tool (§3.3) — work queue, service catalogue,
// workload dashboards and SLA tracking aligned to SDBIP KPIs.

import { useContext, useState } from "react";
import {
  Add20Regular, CheckmarkCircle20Filled, Warning20Regular,
  Dismiss20Regular, ArrowDownload20Regular, Edit20Regular,
  Clock20Regular, PersonAdd20Regular, DataHistogram20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, FormDrawer, DataTable,
  ViewHeader, CommandBar, Input, Select, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { DEPARTMENTS, WORK_CATALOGUE, DEMO_PERSONAS, userById } from "../data.js";
import { fmtDate, daysFrom } from "../helpers.js";

function catalogueLabel(typeId) {
  return WORK_CATALOGUE.find((c) => c.id === typeId)?.label || typeId;
}
function catalogueSla(typeId) {
  return WORK_CATALOGUE.find((c) => c.id === typeId)?.slaTarget || 5;
}
function deptLabel(id) {
  return DEPARTMENTS.find((d) => d.id === id)?.label || id;
}

function priorityColor(p) { return p === "High" ? C.danger : p === "Medium" ? "#7a5700" : C.success; }
function priorityBg(p)    { return p === "High" ? C.dangerBg : p === "Medium" ? "#fff4ce" : C.successBg; }
function statusColor(s)   { return s === "Closed" ? C.success : s === "In Progress" ? "#8764b8" : s === "Pending" ? "#7a5700" : C.brand; }
function statusBg(s)      { return s === "Closed" ? C.successBg : s === "In Progress" ? "#f4f0fb" : s === "Pending" ? "#fff4ce" : C.brandTint; }

function SlaCell({ item }) {
  if (item.status === "Closed") {
    return <span style={{ fontSize: 11, color: C.muted }}>{item.actualDays != null ? `${item.actualDays}d actual` : "—"}</span>;
  }
  const d = daysFrom(item.dueDate);
  const overdue = d < 0;
  const urgent = !overdue && d <= 2;
  const color = overdue ? C.danger : urgent ? "#7a5700" : C.text;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, display: "inline-flex", alignItems: "center", gap: 4 }}>
      <I as={overdue ? Warning20Regular : Clock20Regular} size={12}/>
      {overdue ? `${Math.abs(d)}d overdue` : d === 0 ? "Due today" : `${d}d left`}
    </span>
  );
}

function StatTile({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${C.hairline}`,
      borderRadius: 4, padding: "14px 16px", minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || C.ink, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
      {children}
    </div>
  );
}

function WorkItemDrawer({ item, onClose }) {
  const { dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const d = daysFrom(item.dueDate);
  const overdue = item.status !== "Closed" && d < 0;
  const assignee = userById(item.assignee);

  const complete = () => {
    dispatch({ type: "UPDATE_WORK_ITEM", id: item.id, patch: { status: "Closed", actualDays: Math.abs(d) || 1 } });
    toast("Closed", item.title, { color: C.success });
    onClose();
  };
  const setStatus = (status) => {
    dispatch({ type: "UPDATE_WORK_ITEM", id: item.id, patch: { status } });
    toast("Status updated", status);
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.brand,
                          letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>
              {catalogueLabel(item.type)}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{item.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Pill bg={priorityBg(item.priority)} fg={priorityColor(item.priority)}>{item.priority} priority</Pill>
          <Pill bg={statusBg(item.status)} fg={statusColor(item.status)}>{item.status}</Pill>
          {overdue && (
            <Pill bg={C.dangerBg} fg={C.danger}>
              <I as={Warning20Regular} size={11}/> {Math.abs(d)}d overdue
            </Pill>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        <div style={{
          background: "#fff", border: `1px solid ${overdue ? C.danger : C.hairline}`,
          borderRadius: 4, padding: "14px 16px", marginBottom: 18,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14,
        }}>
          {[
            {
              label: "Assignee",
              content: (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  <Avatar userId={item.assignee} size={22}/>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{assignee.name}</span>
                </div>
              ),
            },
            {
              label: "Department",
              content: <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 4 }}>{deptLabel(item.department)}</div>,
            },
            {
              label: "Due date",
              content: (
                <div style={{ fontSize: 12, fontWeight: 600, color: overdue ? C.danger : C.ink, marginTop: 4 }}>
                  {fmtDate(item.dueDate)}
                </div>
              ),
            },
            {
              label: "SLA target",
              content: <div style={{ fontSize: 12, fontWeight: 600, color: C.ink, marginTop: 4 }}>{catalogueSla(item.type)} working days</div>,
            },
          ].map((cell) => (
            <div key={cell.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.muted,
                            textTransform: "uppercase", letterSpacing: "0.5px" }}>{cell.label}</div>
              {cell.content}
            </div>
          ))}
        </div>

        {item.kpiRef && (
          <div style={{
            background: C.brandTint, border: `1px solid ${C.brand}40`,
            borderRadius: 4, padding: "10px 12px", marginBottom: 16,
            fontSize: 12, color: C.ink,
          }}>
            <strong>SDBIP KPI reference:</strong> {item.kpiRef}
          </div>
        )}

        {item.notes && (
          <div style={{ marginBottom: 18 }}>
            <SectionTitle>Notes</SectionTitle>
            <div style={{
              background: "#fff", border: `1px solid ${C.hairline}`,
              borderRadius: 4, padding: "12px 14px",
              fontSize: 12, color: C.text, lineHeight: 1.6,
            }}>{item.notes}</div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {item.status !== "Closed" && (
            <Btn variant="success" size="sm" onClick={complete}>
              <I as={CheckmarkCircle20Filled} size={13}/> Mark complete
            </Btn>
          )}
          {item.status === "Open" && (
            <Btn variant="secondary" size="sm" onClick={() => setStatus("In Progress")}>Start work</Btn>
          )}
          {item.status === "In Progress" && (
            <Btn variant="ghost" size="sm" onClick={() => setStatus("Pending")}>Set pending</Btn>
          )}
          <Btn variant="ghost" size="sm" onClick={() => toast("Reassign", "Reassignment workflow")}>
            <I as={PersonAdd20Regular} size={13}/> Reassign
          </Btn>
        </div>
      </div>
    </div>
  );
}

function NewWorkItemPanel({ onClose }) {
  const { dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [department, setDepartment] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [kpiRef, setKpiRef] = useState("");
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!type || !title.trim() || !assignee || !department || !dueDate) {
      toast("Missing details", "Type, title, assignee, department, and due date are required",
            { icon: <I as={Warning20Regular} size={16} color="#7a5700"/>, color: "#7a5700" });
      return;
    }
    dispatch({
      type: "ADD_WORK_ITEM",
      item: {
        id: `wi_${Date.now()}`,
        type, title: title.trim(), assignee, department, priority,
        status: "Open",
        dueDate, createdDate: "2026-05-10", createdBy: assignee,
        slaTarget: catalogueSla(type), actualDays: null,
        kpiRef: kpiRef.trim() || null,
        notes: notes.trim(),
      },
    });
    toast("Work item created", title.trim(), { color: C.brand });
    onClose();
  };

  return (
    <FormDrawer title="New Work Item" onClose={onClose} width={520}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn onClick={submit}><I as={Add20Regular} size={14}/> Create item</Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <div style={{
          background: C.brandTint, border: `1px solid ${C.brand}40`,
          borderRadius: 4, padding: "10px 12px", marginBottom: 14,
          fontSize: 12, color: C.ink, lineHeight: 1.5,
        }}>
          Work items are linked to the service catalogue and SDBIP KPIs.
          SLA targets are automatically applied per work type.
        </div>
        <Select label="Work type" value={type} onChange={(e) => setType(e.target.value)}
                placeholder="Select type…"
                options={WORK_CATALOGUE.map((c) => ({ value: c.id, label: `${c.label} (SLA: ${c.slaTarget}d)` }))}/>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="Brief description of the work item"/>
        <Select label="Assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}
                placeholder="Select assignee…"
                options={DEMO_PERSONAS.map((u) => ({ value: u.id, label: `${u.name} · ${u.role}` }))}/>
        <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}
                placeholder="Select department…"
                options={DEPARTMENTS.map((d) => ({ value: d.id, label: d.label }))}/>
        <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)}
                options={[
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}/>
        <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}/>
        <Input label="SDBIP KPI reference (optional)" value={kpiRef}
               onChange={(e) => setKpiRef(e.target.value)} placeholder="e.g. SD-T-005"/>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>
            Notes (optional)
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional context or instructions…" rows={3}
                    style={{
                      width: "100%", padding: "8px 10px", boxSizing: "border-box",
                      border: `1px solid ${C.hairlineSoft}`, borderRadius: 4,
                      fontSize: 13, fontFamily: "inherit", resize: "vertical",
                      background: C.surfaceAlt, color: C.text,
                    }}/>
        </div>
      </div>
    </FormDrawer>
  );
}

export function WorkMgmtView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const me = state.currentUser;
  const scope = me.readOnly ? "org" : me.level <= 2 ? "org" : me.level <= 4 ? "dept" : "self";
  const canCreate = !me.readOnly && scope !== "self";

  const allItems = state.workItems || [];
  const scopedItems = allItems.filter((item) => {
    if (scope === "dept") return item.department === me.department;
    if (scope === "self") return item.assignee === me.id;
    return true;
  });

  const openItems   = scopedItems.filter((i) => i.status !== "Closed");
  const overdueItems = scopedItems.filter((i) => i.status !== "Closed" && daysFrom(i.dueDate) < 0);
  const closedItems = scopedItems.filter((i) => i.status === "Closed" && i.actualDays != null);
  const avgTurnaround = closedItems.length > 0
    ? (closedItems.reduce((s, i) => s + i.actualDays, 0) / closedItems.length).toFixed(1)
    : null;

  const selected = selectedId ? scopedItems.find((i) => i.id === selectedId) : null;

  const cols = [
    {
      id: "type", label: "Type", get: (i) => catalogueLabel(i.type), width: 170, filterable: true,
      renderCell: (i) => (
        <span style={{
          fontSize: 11, fontWeight: 700, color: C.brand,
          background: C.brandTint, borderRadius: 4, padding: "2px 8px",
        }}>{catalogueLabel(i.type)}</span>
      ),
    },
    {
      id: "title", label: "Work item", get: (i) => i.title, minWidth: 260,
      renderCell: (i) => (
        <div style={{ fontSize: 12, fontWeight: 500, color: C.ink, lineHeight: 1.35 }}>{i.title}</div>
      ),
    },
    {
      id: "assignee", label: "Assignee", get: (i) => userById(i.assignee).name, width: 170, filterable: true,
      renderCell: (i) => {
        const u = userById(i.assignee);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={i.assignee} size={24}/>
            <span style={{ fontSize: 12, color: C.ink }}>{u.name.split(" ").slice(-1)[0]}</span>
          </div>
        );
      },
    },
    {
      id: "priority", label: "Priority", get: (i) => i.priority, width: 100, filterable: true,
      renderCell: (i) => <Pill bg={priorityBg(i.priority)} fg={priorityColor(i.priority)}>{i.priority}</Pill>,
    },
    {
      id: "status", label: "Status", get: (i) => i.status, width: 120, filterable: true,
      renderCell: (i) => <Pill bg={statusBg(i.status)} fg={statusColor(i.status)}>{i.status}</Pill>,
    },
    {
      id: "due", label: "Due", get: (i) => i.dueDate, width: 100, align: "right",
      renderCell: (i) => <span style={{ fontSize: 11, color: C.text }}>{fmtDate(i.dueDate)}</span>,
    },
    {
      id: "sla", label: "SLA", get: (i) => i.status === "Closed" ? 999 : daysFrom(i.dueDate),
      width: 115, align: "right",
      renderCell: (i) => <SlaCell item={i}/>,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="Productivity Management"
        subtitle={`Work queue · ${openItems.length} open · ${overdueItems.length} overdue`}
        action={canCreate ? <Btn onClick={() => setShowNew(true)}>+ New item</Btn> : null}
        commandBar={<CommandBar groups={[
          [
            { icon: Add20Regular, label: "New work item", disabled: !canCreate, onClick: () => setShowNew(true) },
            { icon: Edit20Regular, label: "Edit", disabled: !selectedId, onClick: () => {} },
          ],
          [
            { icon: DataHistogram20Regular, label: "Analytics", onClick: () => toast("Analytics", "Throughput & turnaround report") },
            { icon: CheckmarkCircle20Filled, label: "Service catalogue", onClick: () => toast("Service catalogue", `${WORK_CATALOGUE.length} work types · SLA targets defined`) },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export", onClick: () => toast("Export", "Work queue export queued") },
          ],
        ]}/>}
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
        gap: 12, padding: "12px 18px",
        borderBottom: `1px solid ${C.hairline}`,
        flexShrink: 0,
      }}>
        <StatTile label="Open items" value={openItems.length}
                  sub="Active work queue" accent={C.brand}/>
        <StatTile label="Overdue" value={overdueItems.length}
                  sub="Past SLA deadline" accent={overdueItems.length > 0 ? C.danger : C.success}/>
        <StatTile label="Avg turnaround" value={avgTurnaround ? `${avgTurnaround}d` : "—"}
                  sub="Completed items" accent={C.ink}/>
        <StatTile label="Completed" value={scopedItems.filter((i) => i.status === "Closed").length}
                  sub="This reporting cycle" accent={C.success}/>
      </div>

      <DataTable
        rows={scopedItems}
        columns={cols}
        getKey={(i) => i.id}
        searchPlaceholder="Search work items by title or assignee…"
        searchKeys={["title"]}
        defaultSort={{ col: "sla", dir: "asc" }}
        onRowClick={(i) => setSelectedId(i.id)}
        selectedKey={selectedId}
      />

      {selected && (
        <Drawer onClose={() => setSelectedId(null)} width={640}>
          <WorkItemDrawer item={selected} onClose={() => setSelectedId(null)}/>
        </Drawer>
      )}
      {showNew && <NewWorkItemPanel onClose={() => setShowNew(false)}/>}
    </div>
  );
}
