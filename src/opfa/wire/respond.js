// Respond case management system — REST request and XML response builders.
//
// The bid states it plainly: "The Respond web application provides a number of
// REST based web services… The services are built using REST principles while
// returning and consuming XML."
//
// So these responses are XML strings, not JSON objects. That distinction is
// the whole point of showing them: a WhatsApp front end that assumes a modern
// JSON API has not looked at what it has to integrate with.
import { fundById, employerById } from "../data.js";
import { shortDate } from "../helpers.js";

const BASE = "https://respond.pfa.org.za/api/v2";
const NS = "http://schemas.pfa.org.za/respond/v2";

const esc = (s) => String(s ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const iso = (ts) => new Date(ts).toISOString();

// ─── Requests ─────────────────────────────────────────────────────────────────

export function getCase(ref) {
  return {
    system: "respond", dir: "out", contentType: "application/xml",
    label: `GET /api/v2/cases/${ref}`,
    endpoint: `${BASE}/cases/${encodeURIComponent(ref)}`,
    payload: [
      `GET ${BASE}/cases/${encodeURIComponent(ref)} HTTP/1.1`,
      "Accept: application/xml",
      "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…",
      "X-Channel: whatsapp",
      "X-Correlation-Id: 7f3c91e2-4a5b-4c8d-9e01-2b6f8a4d5c13",
    ].join("\n"),
  };
}

export function searchCases({ idNumber, msisdn }) {
  const q = idNumber ? `idNumber=${idNumber}` : `msisdn=${encodeURIComponent(msisdn)}`;
  return {
    system: "respond", dir: "out", contentType: "application/xml",
    label: `GET /api/v2/cases?${idNumber ? "idNumber" : "msisdn"}=…`,
    endpoint: `${BASE}/cases?${q}`,
    payload: [
      `GET ${BASE}/cases?${q} HTTP/1.1`,
      "Accept: application/xml",
      "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…",
      "X-Channel: whatsapp",
    ].join("\n"),
  };
}

export function postDocument({ ref, file, sha256 }) {
  return {
    system: "respond", dir: "out", contentType: "application/xml",
    label: `POST /api/v2/cases/${ref}/documents`,
    endpoint: `${BASE}/cases/${encodeURIComponent(ref)}/documents`,
    payload: `POST ${BASE}/cases/${encodeURIComponent(ref)}/documents HTTP/1.1
Content-Type: application/xml
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…

<?xml version="1.0" encoding="utf-8"?>
<DocumentRequest xmlns="${NS}">
  <CaseReference>${esc(ref)}</CaseReference>
  <FileName>${esc(file.name)}</FileName>
  <MimeType>${esc(file.mime)}</MimeType>
  <SizeBytes>${file.size}</SizeBytes>
  <Source>WhatsApp</Source>
  <Sha256>${esc(sha256)}</Sha256>
  <ScanResult>Clean</ScanResult>
</DocumentRequest>`,
  };
}

export function postCase({ persona, subject }) {
  return {
    system: "respond", dir: "out", contentType: "application/xml",
    label: "POST /api/v2/cases",
    endpoint: `${BASE}/cases`,
    payload: `POST ${BASE}/cases HTTP/1.1
Content-Type: application/xml
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…

<?xml version="1.0" encoding="utf-8"?>
<CaseRequest xmlns="${NS}">
  <Channel>WhatsApp</Channel>
  <Complainant>
    <FullName>${esc(persona.name)}</FullName>
    <IdNumber>${esc(persona.idNumber)}</IdNumber>
    <MobileNumber>${esc(persona.msisdn)}</MobileNumber>
    <EmailAddress>${esc(persona.email)}</EmailAddress>
  </Complainant>
  <Subject>${esc(subject)}</Subject>
</CaseRequest>`,
  };
}

export function patchContact({ persona, field, value }) {
  return {
    system: "respond", dir: "out", contentType: "application/xml",
    label: `PUT /api/v2/complainants/${persona.idNumber}/contact`,
    endpoint: `${BASE}/complainants/${persona.idNumber}/contact`,
    payload: `PUT ${BASE}/complainants/${esc(persona.idNumber)}/contact HTTP/1.1
Content-Type: application/xml
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9…

<?xml version="1.0" encoding="utf-8"?>
<ContactUpdate xmlns="${NS}">
  <IdNumber>${esc(persona.idNumber)}</IdNumber>
  <Field>${esc(field)}</Field>
  <Value>${esc(value)}</Value>
  <VerificationMethod>OTP</VerificationMethod>
  <Channel>WhatsApp</Channel>
</ContactUpdate>`,
  };
}

// ─── Responses ────────────────────────────────────────────────────────────────

export function caseResponse(c, latencyMs = 214) {
  const fund = fundById(c.fundId);
  const employer = employerById(c.employerId);
  return {
    system: "respond", dir: "in", contentType: "application/xml",
    label: `200 OK · CaseResponse (${latencyMs} ms)`,
    payload: `<?xml version="1.0" encoding="utf-8"?>
<CaseResponse xmlns="${NS}">
  <Reference>${esc(c.ref)}</Reference>
  <Subject>${esc(c.subject)}</Subject>
  <Category>${esc(c.category)}</Category>
  <Status>${esc(c.stage)}</Status>
  <LodgedDate>${iso(c.lodgedAt)}</LodgedDate>
  <Adjudicator>${esc(c.adjudicator)}</Adjudicator>
  <Fund>
    <Name>${esc(fund?.name)}</Name>
    <FscaNumber>${esc(fund?.fsca)}</FscaNumber>
  </Fund>
  <Employer>
    <Name>${esc(employer?.name)}</Name>
  </Employer>
  <AmountInDispute currency="ZAR">${Number(c.amount).toFixed(2)}</AmountInDispute>
  <History>
${c.timeline.map((t) => `    <Event date="${iso(t.at)}" stage="${esc(t.stage)}">${esc(t.note)}</Event>`).join("\n")}
  </History>
</CaseResponse>`,
  };
}

export function caseListResponse(cases) {
  return {
    system: "respond", dir: "in", contentType: "application/xml",
    label: `200 OK · CaseListResponse (${cases.length})`,
    payload: `<?xml version="1.0" encoding="utf-8"?>
<CaseListResponse xmlns="${NS}" count="${cases.length}">
${cases.map((c) => `  <Case reference="${esc(c.ref)}" status="${esc(c.stage)}" lodged="${shortDate(c.lodgedAt)}">${esc(c.subject)}</Case>`).join("\n")}
</CaseListResponse>`,
  };
}

export function documentResponse(doc) {
  return {
    system: "respond", dir: "in", contentType: "application/xml",
    label: `201 Created · ${doc.respondDocId}`,
    payload: `<?xml version="1.0" encoding="utf-8"?>
<DocumentResponse xmlns="${NS}">
  <DocumentId>${esc(doc.respondDocId)}</DocumentId>
  <CaseReference>${esc(doc.caseRef)}</CaseReference>
  <FileName>${esc(doc.name)}</FileName>
  <StoredAt>${iso(doc.storedAt)}</StoredAt>
  <StorageLocation>SharePointOnline</StorageLocation>
  <Status>Filed</Status>
</DocumentResponse>`,
  };
}

export function acknowledgement(label = "200 OK · Acknowledged") {
  return {
    system: "respond", dir: "in", contentType: "application/xml",
    label,
    payload: `<?xml version="1.0" encoding="utf-8"?>
<AcknowledgementResponse xmlns="${NS}">
  <Result>Success</Result>
  <ProcessedAt>${iso(Date.now())}</ProcessedAt>
</AcknowledgementResponse>`,
  };
}

// The failure the bot's E_BACKEND path is built around. Worth modelling: an
// integration that is only ever shown succeeding has not been shown at all.
export function faultResponse(ticket) {
  return {
    system: "respond", dir: "in", contentType: "application/xml",
    label: "503 Service Unavailable",
    payload: `<?xml version="1.0" encoding="utf-8"?>
<Fault xmlns="${NS}">
  <Code>SVC-503</Code>
  <Reason>Case management service temporarily unavailable</Reason>
  <RetryAfterSeconds>30</RetryAfterSeconds>
  <SupportTicket>${esc(ticket)}</SupportTicket>
</Fault>`,
  };
}

// ─── SharePoint Online ────────────────────────────────────────────────────────

// Uploads land in the case's document library as well as in Respond — the bid
// asks for SharePoint integration and for secure transfer into Respond, and
// these are two different systems.
export function sharePointUpload({ ref, file }) {
  const path = `/sites/Complaints/Shared Documents/${ref.replaceAll("/", "-")}/${file.name}`;
  return {
    system: "sharepoint", dir: "out", contentType: "application/json",
    label: `PUT /_api/web/GetFolderByServerRelativeUrl('…')/Files/add`,
    endpoint: `https://pfa.sharepoint.com${path}`,
    payload: {
      method: "PUT",
      path,
      headers: {
        Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJub25jZSI6…",
        "Content-Type": file.mime,
        "X-RequestDigest": "0x9A1F…",
      },
      metadata: {
        CaseReference: ref,
        Channel: "WhatsApp",
        Classification: "Confidential — POPIA personal information",
        RetentionLabel: "OPFA-Complaint-5yr",
      },
    },
  };
}
