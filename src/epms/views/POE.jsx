// Module D — Portfolio of Evidence Vault.
// Tamper-evident document store linked to KPIs. SHA-256 hashed at upload.

import { useContext, useState } from "react";
import {
  Document20Regular, DocumentArrowUp20Regular, Fingerprint20Regular,
  CheckmarkCircle20Filled, Phone20Regular, Dismiss20Regular,
  ArrowDownload20Regular, Add20Regular, ShieldLock20Regular,
  Warning20Regular,
} from "@fluentui/react-icons";
import {
  I, C, Btn, Pill, Drawer, FormDrawer, DataTable,
  ViewHeader, CommandBar, Input, Select, useToast,
} from "../../components/index.js";
import { EPMSContext } from "../state.js";
import { Avatar } from "../Avatar.jsx";
import { userById } from "../data.js";
import { fmtDate } from "../helpers.js";

const randHash = () => {
  const hex = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < 4; i++) out += hex[Math.floor(Math.random() * 16)];
  out += "…";
  for (let i = 0; i < 4; i++) out += hex[Math.floor(Math.random() * 16)];
  return out;
};

function POEDrawer({ doc, onClose }) {
  const { dispatch, state } = useContext(EPMSContext);
  const toast = useToast();
  const uploader = userById(doc.uploader);
  const verifier = doc.verifiedBy ? userById(doc.verifiedBy) : null;
  const linkedKpi = state.sdbipTargets.find((t) => doc.kpiCode.startsWith(t.code));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                  background: C.surfaceAlt }}>
      <div style={{ padding: "18px 22px", background: "#fff", borderBottom: `1px solid ${C.hairline}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", gap: 14 }}>
            <div style={{
              width: 44, height: 50, background: C.brand, borderRadius: 4,
              display: "grid", placeItems: "center", color: "#fff",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>POE</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.brand, letterSpacing: "0.5px",
                            textTransform: "uppercase", marginBottom: 2 }}>{doc.kpiCode}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{doc.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{doc.size} · {doc.source}</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted,
            display: "inline-flex", padding: 2,
          }}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {doc.verified
            ? <Pill bg={C.successBg} fg={C.success}><I as={CheckmarkCircle20Filled} size={11}/> Verified</Pill>
            : <Pill bg={C.warningBg} fg={C.warning}>Pending verification</Pill>}
          <Pill bg={C.brandTint} fg={C.brand} uppercase={false}>Immutable</Pill>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "18px 22px" }}>
        {/* SHA-256 hash card */}
        <div style={{
          background: "#fff", border: `1px solid ${C.hairline}`,
          borderRadius: 4, padding: "12px 14px", marginBottom: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <I as={Fingerprint20Regular} size={18} color={C.brand}/>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted,
                          textTransform: "uppercase", letterSpacing: "0.5px" }}>
              SHA-256 tamper-evidence hash
            </div>
          </div>
          <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, color: C.ink, fontWeight: 600 }}>
            {doc.sha}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6, lineHeight: 1.4 }}>
            Document content is hashed at upload. Any modification produces a different hash, and
            re-uploads create a new immutable version. AGSA can verify integrity from this fingerprint alone.
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12, marginBottom: 18,
        }}>
          <Field label="Uploaded by">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar userId={doc.uploader} size={22}/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{uploader.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{uploader.role}</div>
              </div>
            </div>
          </Field>
          <Field label="Upload date">
            <span style={{ fontSize: 12 }}>{fmtDate(doc.uploaded)}</span>
          </Field>
          <Field label="Verified by">
            {verifier ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar userId={doc.verifiedBy} size={22}/>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{verifier.name}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{verifier.role}</div>
                </div>
              </div>
            ) : <span style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>Pending supervisor verification</span>}
          </Field>
          <Field label="Linked indicator">
            {linkedKpi
              ? <span style={{ fontSize: 12 }}>{linkedKpi.code} · {linkedKpi.indicator}</span>
              : <span style={{ fontSize: 12, color: C.faint }}>—</span>}
          </Field>
        </div>

        {!doc.verified && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="success" size="sm" onClick={() => {
              dispatch({ type: "VERIFY_POE", id: doc.id });
              toast("POE verified", "Recorded in audit trail",
                    { icon: <I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>, color: "#107c10" });
              onClose();
            }}><I as={CheckmarkCircle20Filled} size={13}/> Verify document</Btn>
            <Btn variant="ghost" size="sm" onClick={() => toast("Reject POE", "Returned to uploader")}>
              <I as={Warning20Regular} size={13}/> Reject
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function UploadPanel({ onClose }) {
  const { state, dispatch } = useContext(EPMSContext);
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [kpi, setKpi] = useState("");
  const [quarter, setQuarter] = useState("");
  const [source, setSource] = useState("Web upload");
  const submit = () => {
    if (!title.trim() || !kpi || !quarter) {
      toast("Missing details", "Title, KPI link, and quarter are required",
            { icon: <I as={Warning20Regular} size={16} color="#7a5700"/>, color: "#7a5700" });
      return;
    }
    const sha = randHash();
    dispatch({
      type: "ADD_POE",
      doc: {
        id: `poe_${Date.now()}`,
        kpiCode: `${kpi} / ${quarter}`,
        title,
        uploaded: "2026-05-10",
        uploader: state.currentUser.id,
        size: "1.2 MB",
        sha,
        verified: false,
        verifiedBy: null,
        source,
      },
    });
    toast("POE uploaded", `SHA-256: ${sha}`,
          { icon: <I as={Fingerprint20Regular} size={16} color="#219CD6"/>, color: "#219CD6" });
    onClose();
  };
  return (
    <FormDrawer title="Upload Portfolio of Evidence" onClose={onClose} width={520}
                footer={<>
                  <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                  <Btn onClick={submit}><I as={Fingerprint20Regular} size={14}/> Hash & Upload</Btn>
                </>}>
      <div style={{ padding: 20 }}>
        <div style={{
          background: C.brandTint, border: `1px solid ${C.brand}40`,
          borderRadius: 4, padding: "10px 12px", marginBottom: 14,
          fontSize: 12, color: C.ink, lineHeight: 1.5,
        }}>
          <strong>Tamper-evidence:</strong> a SHA-256 hash will be calculated at upload.
          The document becomes immutable. Re-uploads create a new version — they don't replace the original.
        </div>
        <Input label="Document title" value={title} onChange={(e) => setTitle(e.target.value)}
               placeholder="e.g. Substation install — site photographs"/>
        <Select label="Linked KPI / SDBIP target" value={kpi}
                onChange={(e) => setKpi(e.target.value)}
                placeholder="Select an indicator…"
                options={state.sdbipTargets.map((t) => ({
                  value: t.code,
                  label: `${t.code} · ${t.indicator}`,
                }))}/>
        <Select label="Reporting quarter" value={quarter}
                onChange={(e) => setQuarter(e.target.value)}
                placeholder="Select a quarter…"
                options={[
                  { value: "Q1", label: "Q1 (Jul–Sep)" },
                  { value: "Q2", label: "Q2 (Oct–Dec)" },
                  { value: "Q3", label: "Q3 (Jan–Mar)" },
                  { value: "Q4", label: "Q4 (Apr–Jun)" },
                ]}/>
        <Select label="Upload source" value={source}
                onChange={(e) => setSource(e.target.value)}
                options={["Web upload", "Mobile upload (field officer)", "Mobile upload"]}/>
        <div style={{
          border: `2px dashed ${C.hairlineSoft}`, borderRadius: 4,
          padding: "32px 16px", textAlign: "center", background: C.surfaceAlt,
          marginBottom: 12,
        }}>
          <I as={DocumentArrowUp20Regular} size={32} color={C.brand}/>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginTop: 8 }}>
            Drag PDF, PNG, or JPG here
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>or click to choose · max 20 MB</div>
        </div>
      </div>
    </FormDrawer>
  );
}

export function POEView() {
  const { state } = useContext(EPMSContext);
  const toast = useToast();
  const [selectedId, setSelectedId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const selected = selectedId ? state.poeDocuments.find((d) => d.id === selectedId) : null;

  const cols = [
    { id: "title", label: "Document", get: (d) => d.title, minWidth: 320,
      renderCell: (d) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <div style={{
            width: 32, height: 36, background: d.verified ? C.brand : C.faint,
            borderRadius: 4, display: "grid", placeItems: "center",
            color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>POE</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.ink,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{d.kpiCode}</div>
          </div>
        </div>
      ) },
    { id: "uploader", label: "Uploader", get: (d) => userById(d.uploader).name, filterable: true, width: 180,
      renderCell: (d) => {
        const u = userById(d.uploader);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar userId={d.uploader} size={22}/>
            <span style={{ fontSize: 11, fontWeight: 600 }}>{u.name}</span>
          </div>
        );
      } },
    { id: "uploaded", label: "Uploaded", get: (d) => d.uploaded, width: 120,
      renderCell: (d) => <span style={{ whiteSpace: "nowrap" }}>{fmtDate(d.uploaded)}</span> },
    { id: "size", label: "Size", get: (d) => d.size, width: 90, sortable: false },
    { id: "sha", label: "SHA-256", get: (d) => d.sha, width: 140, sortable: false,
      renderCell: (d) => (
        <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: C.brand }}>
          <I as={Fingerprint20Regular} size={11}/> {d.sha}
        </span>
      ) },
    { id: "source", label: "Source", get: (d) => d.source, filterable: true, width: 200,
      renderCell: (d) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: C.muted }}>
          {d.source.includes("Mobile") && <I as={Phone20Regular} size={11}/>}
          {d.source}
        </span>
      ) },
    { id: "verified", label: "Status", get: (d) => d.verified ? "Verified" : "Pending",
      filterable: true, width: 130,
      renderCell: (d) => d.verified
        ? <Pill bg={C.successBg} fg={C.success}><I as={CheckmarkCircle20Filled} size={11}/> Verified</Pill>
        : <Pill bg={C.warningBg} fg={C.warning}>Pending</Pill> },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <ViewHeader
        title="Portfolio of Evidence Vault"
        subtitle={`${state.poeDocuments.length} documents · all SHA-256 hashed at upload · immutable · 7-year AGSA retention`}
        action={<Btn onClick={() => setShowUpload(true)}><I as={DocumentArrowUp20Regular} size={14}/> Upload POE</Btn>}
        commandBar={<CommandBar groups={[
          [
            { icon: DocumentArrowUp20Regular, label: "Upload POE", onClick: () => setShowUpload(true) },
            { icon: Phone20Regular, label: "Mobile capture link",
              onClick: () => toast("Mobile link", "QR code emailed to field officers") },
          ],
          [
            { icon: CheckmarkCircle20Filled, label: "Verify selected",
              disabled: !selectedId, onClick: () => toast("Verify", "Document verified") },
            { icon: ShieldLock20Regular, label: "Hash audit",
              onClick: () => toast("Hash audit", "Cross-checking integrity of all 10 documents") },
          ],
          [
            { right: true, icon: ArrowDownload20Regular, label: "Export PDF",
              onClick: () => toast("Exporting", "PDF queued") },
            { right: true, icon: ArrowDownload20Regular, label: "Export CSV",
              onClick: () => toast("Exporting", "CSV queued") },
          ],
        ]}/>}
      />
      <DataTable
        rows={state.poeDocuments}
        columns={cols}
        getKey={(d) => d.id}
        searchPlaceholder="Search by title, KPI, uploader…"
        searchKeys={["title", "kpiCode"]}
        defaultSort={{ col: "uploaded", dir: "desc" }}
        onRowClick={(d) => setSelectedId(d.id)}
        selectedKey={selectedId}
      />
      {selected && (
        <Drawer onClose={() => setSelectedId(null)} width={620}>
          <POEDrawer doc={selected} onClose={() => setSelectedId(null)}/>
        </Drawer>
      )}
      {showUpload && <UploadPanel onClose={() => setShowUpload(false)}/>}
    </div>
  );
}
