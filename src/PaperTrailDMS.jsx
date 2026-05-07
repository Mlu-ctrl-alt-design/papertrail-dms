import { useState, useReducer, useContext, createContext, useRef, useEffect, useCallback, Fragment } from "react";
import {
  FolderOpen20Regular, Folder20Regular, Document20Regular, ClipboardTextLtr20Regular,
  Pin20Regular, Send20Regular, Archive20Regular, Calendar20Regular, ArrowDownload20Regular,
  Chat20Regular, Save20Regular, Search20Regular, Key20Regular, LockClosed20Regular,
  ShieldLock20Regular, Alert20Regular, Bookmark20Regular, Link20Regular, Delete20Regular,
  History20Regular, Settings20Regular, Warning20Regular, Flag20Regular, ArrowUp20Regular,
  Share20Regular, ChevronDown20Regular, ArrowCounterclockwise20Regular, Timer20Regular,
  CheckmarkCircle20Filled, Checkmark20Regular, Dismiss20Regular, Edit20Regular, Star20Filled,
  LineHorizontal320Regular, Grid20Regular, ArrowSwap20Regular, Fingerprint20Regular,
  Phone20Regular, Info20Regular, MoreVertical20Regular,
  ChevronLeft20Regular, ChevronRight20Regular, ChevronUp20Regular,
  ArrowSortDown20Regular, ArrowSortUp20Regular, Filter20Regular, Filter20Filled,
  Mail20Regular, Building20Regular, ContactCard20Regular, Location20Regular,
  HeartPulse20Regular, PersonAvailable20Regular, BriefcaseMedical20Regular,
  CalendarLtr20Regular, Clock20Regular,
  Scan20Regular, Print20Regular, Server20Regular, DataHistogram20Regular,
  Hourglass20Regular, Receipt20Regular, BarcodeScanner20Regular, DocumentArrowUp20Regular,
  PlugConnected20Regular, CloudSync20Regular, CloudArchive20Regular, Database20Regular,
  Money20Regular, Add20Regular, ArrowLeft20Regular,
} from "@fluentui/react-icons";

// ─── Icon Helper ──────────────────────────────────────────────────────────────
// Fluent icons render with width/height = 1em + fill=currentColor, so size via fontSize
// and color via the `color` style prop on the wrapping element.
const I = ({as:Cmp,size=16,color,style={}}) => (
  <Cmp style={{fontSize:size,color,verticalAlign:"middle",lineHeight:0,flexShrink:0,...style}}/>
);

// ─── Constants & Mock Data ────────────────────────────────────────────────────
const FOLDERS = ["Finance","HR","Legal","Product","Marketing","Engineering","Operations"];
const DEPARTMENTS = ["Finance","Human Resources","Legal","Product","Marketing","Engineering","Operations","Executive"];
const DOC_TYPES = ["Contract","Invoice","Report","Policy","Proposal","Memo","NDA","Specification","Handbook","Budget"];
const MOCK_USERS = [
  {id:"u1",name:"Sarah K.",initials:"SK",role:"Admin",color:"#219CD6"},
  {id:"u2",name:"James M.",initials:"JM",role:"Editor",color:"#107c10"},
  {id:"u3",name:"Anna L.",initials:"AL",role:"Viewer",color:"#8764b8"},
  {id:"u4",name:"You",initials:"YO",role:"Admin",color:"#005a9e"},
  {id:"u5",name:"Priya S.",initials:"PS",role:"Editor",color:"#c8a116"},
  {id:"u6",name:"Tom R.",initials:"TR",role:"Guest",color:"#a4262c"},
];
const INIT_DOCS = [
  {id:1,name:"Q1 Financial Report 2026.pdf",type:"pdf",size:"2.4 MB",sizeBytes:2516582,modified:"Today, 09:14",owner:"Sarah K.",ownerId:"u1",folder:"Finance",tags:["finance","quarterly"],version:4,status:"approved",starred:true,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-01-15",description:"Quarterly financial summary for board review.",tier:"hot",tieredAt:"2026-01-15"},
  {id:2,name:"Employee Handbook v3.docx",type:"docx",size:"1.1 MB",sizeBytes:1153433,modified:"Yesterday, 14:30",owner:"HR Team",ownerId:"u2",folder:"HR",tags:["hr","policy"],version:3,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:"2025-09-01",description:"Company-wide employee handbook.",tier:"hot",tieredAt:"2025-09-01"},
  {id:3,name:"Client Contract — Acme Corp.pdf",type:"pdf",size:"890 KB",sizeBytes:911360,modified:"Mar 17, 11:00",owner:"Legal",ownerId:"u2",folder:"Legal",tags:["contract","client"],version:2,status:"pending",starred:true,checkedOut:true,checkedOutBy:"u2",retentionYears:10,created:"2026-03-01",description:"Service agreement with Acme Corp.",tier:"hot",tieredAt:"2026-03-01"},
  {id:4,name:"Product Roadmap Q2.xlsx",type:"xlsx",size:"540 KB",sizeBytes:552960,modified:"Mar 16, 16:45",owner:"Product",ownerId:"u5",folder:"Product",tags:["roadmap","planning"],version:1,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:3,created:"2026-03-10",description:"Q2 product feature planning.",tier:"hot",tieredAt:"2026-03-10"},
  {id:5,name:"Brand Guidelines 2026.pdf",type:"pdf",size:"8.2 MB",sizeBytes:8600166,modified:"Mar 15, 10:22",owner:"Design",ownerId:"u3",folder:"Marketing",tags:["brand","design"],version:6,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:"2026-01-01",description:"Visual identity standards.",tier:"hot",tieredAt:"2026-01-01"},
  {id:6,name:"Server Architecture Diagram.png",type:"img",size:"3.7 MB",sizeBytes:3880550,modified:"Mar 14, 09:50",owner:"DevOps",ownerId:"u2",folder:"Engineering",tags:["infra","technical"],version:2,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:3,created:"2026-02-20",description:"Infrastructure diagram v2.",tier:"hot",tieredAt:"2026-02-20"},
  {id:7,name:"NDA — Beta Partners.docx",type:"docx",size:"210 KB",sizeBytes:215040,modified:"Mar 12, 13:10",owner:"Legal",ownerId:"u1",folder:"Legal",tags:["nda","legal"],version:1,status:"pending",starred:true,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-03-12",description:"NDA for external beta programme.",tier:"hot",tieredAt:"2026-03-12"},
  {id:8,name:"Marketing Budget 2026.xlsx",type:"xlsx",size:"320 KB",sizeBytes:327680,modified:"Mar 10, 11:30",owner:"Finance",ownerId:"u4",folder:"Finance",tags:["budget","marketing"],version:2,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:7,created:"2026-01-20",description:"Full year marketing budget allocation.",tier:"hot",tieredAt:"2026-01-20"},
  {id:9,name:"Personnel File — N. Mthembu.pdf",type:"pdf",size:"4.6 MB",sizeBytes:4823654,modified:"Aug 12, 2024",owner:"HR Team",ownerId:"u2",folder:"HR",tags:["personnel","retired"],version:8,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:30,created:"1998-04-01",description:"Full personnel file. Owner retired Q3 2023; auto-tiered to Cold per lifecycle policy.",tier:"cold",tieredAt:"2023-09-30"},
  {id:10,name:"Disciplinary — J. Botha (1996).pdf",type:"pdf",size:"1.2 MB",sizeBytes:1258291,modified:"Mar 04, 2019",owner:"Legal",ownerId:"u1",folder:"Legal",tags:["legal","disciplinary","historic"],version:1,status:"archived",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:50,created:"1996-11-22",description:"Historic disciplinary record. Auto-tiered to Archive 5 yr after employment cessation.",tier:"archive",tieredAt:"2018-05-15"},
  {id:11,name:"Pension File — P. Khoza.pdf",type:"pdf",size:"6.1 MB",sizeBytes:6396968,modified:"Jan 28, 2018",owner:"Finance",ownerId:"u4",folder:"Finance",tags:["pension","deceased"],version:3,status:"archived",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:30,created:"1989-01-15",description:"Pension file. Auto-tiered to Archive after employee deceased, per lifecycle policy.",tier:"archive",tieredAt:"2014-08-04"},
  {id:12,name:"Z83 Application Batch — 2019.pdf",type:"pdf",size:"22.4 MB",sizeBytes:23488102,modified:"Feb 14, 2020",owner:"HR Team",ownerId:"u2",folder:"HR",tags:["z83","onboarding","batch"],version:1,status:"approved",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:10,created:"2019-12-31",description:"Bulk-scanned Z83 application forms (auto-feeder ingestion job 2019/Q4).",tier:"cold",tieredAt:"2024-12-31"},
];
const INIT_WORKFLOWS = [
  {id:1,docId:3,doc:"Client Contract — Acme Corp.pdf",step:"Legal Review",assigneeId:"u2",due:"Tomorrow",priority:"high",submitted:"Mar 17",comments:[{id:1,userId:"u1",text:"Please review clause 4.2 carefully.",time:"Mar 17 11:30"}],reviewers:[{userId:"u1",status:"approved",time:"Mar 17 14:00"},{userId:"u2",status:"pending",time:null}]},
  {id:2,docId:7,doc:"NDA — Beta Partners.docx",step:"Director Approval",assigneeId:"u4",due:"Today",priority:"urgent",submitted:"Mar 12",comments:[],reviewers:[{userId:"u4",status:"pending",time:null}]},
  {id:3,docId:2,doc:"Employee Handbook v3.docx",step:"HR Sign-off",assigneeId:"u1",due:"Mar 22",priority:"normal",submitted:"Mar 15",comments:[{id:2,userId:"u5",text:"Section 3 needs updating per new legislation.",time:"Mar 16 09:00"}],reviewers:[{userId:"u1",status:"pending",time:null},{userId:"u5",status:"approved",time:"Mar 16 09:05"}]},
];
const INIT_AUDIT = [
  {id:1,userId:"u1",user:"Sarah K.",action:"Uploaded",doc:"Q1 Financial Report 2026.pdf",time:"Today 09:14",ip:"196.25.x.x"},
  {id:2,userId:"u4",user:"You",action:"Viewed",doc:"Client Contract — Acme Corp.pdf",time:"Today 08:55",ip:"196.25.x.x"},
  {id:3,userId:"u2",user:"James M.",action:"Edited",doc:"Employee Handbook v3.docx",time:"Yesterday 14:30",ip:"196.25.x.x"},
  {id:4,userId:"system",user:"System",action:"OCR Indexed",doc:"Brand Guidelines 2026.pdf",time:"Mar 15 10:23",ip:"internal"},
  {id:5,userId:"u3",user:"Anna L.",action:"Downloaded",doc:"Product Roadmap Q2.xlsx",time:"Mar 16 16:46",ip:"10.0.x.x"},
  {id:6,userId:"system",user:"Legal Bot",action:"Workflow Created",doc:"NDA — Beta Partners.docx",time:"Mar 12 13:10",ip:"internal"},
  {id:7,userId:"u4",user:"You",action:"Shared",doc:"Marketing Budget 2026.xlsx",time:"Mar 10 11:35",ip:"196.25.x.x"},
];
const INIT_RETENTION = [
  {id:1,name:"Financial Records",condition:"Age > 7 years",action:"Archive",docTypes:["Invoice","Budget","Report"],nextRun:"Apr 1, 2026"},
  {id:2,name:"Legal Contracts",condition:"Contract terminated + 10 years",action:"Archive",docTypes:["Contract","NDA"],nextRun:"Dec 31, 2026"},
  {id:3,name:"Temp Drafts",condition:"Status = Draft AND Age > 180 days",action:"Delete",docTypes:["Memo","Proposal"],nextRun:"Apr 15, 2026"},
];

// ─── Registry: Public-Servant Records ─────────────────────────────────────────
const GOVT_DEPARTMENTS = ["Human Resources","Finance","Legal","Engineering","Health","Education","Justice","Public Works"];
const SALARY_LEVELS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
const INIT_EMPLOYEES = [
  {id:"e1",persalNo:"30049182",idNumber:"8505125000080",firstName:"Thandiwe",lastName:"Mokoena",knownAs:"Thandi",dob:"1985-05-12",gender:"Female",race:"African",department:"Human Resources",jobTitle:"Senior HR Officer",salaryLevel:9,salaryNotch:8,employmentDate:"2014-03-01",status:"Active",biometric:"Verified · NIIS · 2026-04-12",aesAccredited:true,color:"#219CD6"},
  {id:"e2",persalNo:"30121847",idNumber:"7811045000089",firstName:"Sibusiso",lastName:"Khumalo",knownAs:"Sbu",dob:"1978-11-04",gender:"Male",race:"African",department:"Finance",jobTitle:"Deputy Director: Budget",salaryLevel:11,salaryNotch:5,employmentDate:"2008-06-15",status:"Active",biometric:"Verified · NIIS · 2026-04-08",aesAccredited:true,color:"#107c10"},
  {id:"e3",persalNo:"30087294",idNumber:"9203176000182",firstName:"Lerato",lastName:"Dlamini",knownAs:"Lee",dob:"1992-03-17",gender:"Female",race:"African",department:"Legal",jobTitle:"Legal Advisor",salaryLevel:10,salaryNotch:3,employmentDate:"2019-09-01",status:"Active",biometric:"Pending NIIS sync",aesAccredited:false,color:"#8764b8"},
  {id:"e4",persalNo:"30199031",idNumber:"6709195000088",firstName:"Pieter",lastName:"van der Merwe",knownAs:"Piet",dob:"1967-09-19",gender:"Male",race:"White",department:"Engineering",jobTitle:"Chief Director: ICT",salaryLevel:14,salaryNotch:7,employmentDate:"1998-02-01",status:"Active",biometric:"Verified · NIIS · 2026-03-22",aesAccredited:true,color:"#c8a116"},
  {id:"e5",persalNo:"30203954",idNumber:"8408215000084",firstName:"Naledi",lastName:"Mthembu",dob:"1984-08-21",gender:"Female",race:"African",department:"Health",jobTitle:"Director: Hospital Services",salaryLevel:13,salaryNotch:4,employmentDate:"2011-04-01",status:"On Leave",biometric:"Verified · NIIS · 2026-02-14",aesAccredited:true,color:"#a4262c"},
];
const INIT_TOUCHPOINTS = [
  {id:1,employeeId:"e1",type:"Leave",category:"Annual Leave",date:"2026-04-15",details:"5 days approved · ref AL-2026-0412",status:"approved"},
  {id:2,employeeId:"e1",type:"Training",category:"DPSA Compliance Workshop",date:"2026-03-08",details:"Certificate issued · 2 CPD points",status:"approved"},
  {id:3,employeeId:"e1",type:"Performance",category:"Annual Performance Review",date:"2026-02-28",details:"Rating: 4 (Significantly above expectations)",status:"approved"},
  {id:4,employeeId:"e1",type:"Promotion",category:"Salary Notch Increment",date:"2025-11-15",details:"Notch 7 → Notch 8 · Salary Level 9",status:"approved",highStakes:true,ledgerHash:"0x4f7a8c"},
  {id:5,employeeId:"e1",type:"Leave",category:"Sick Leave",date:"2025-09-22",details:"3 days · medical certificate filed",status:"approved"},
  {id:6,employeeId:"e1",type:"Training",category:"Public Finance Management Act",date:"2024-07-10",details:"Mandatory · passed assessment",status:"approved"},
  {id:7,employeeId:"e1",type:"Inception",category:"Z83 Onboarding",date:"2014-03-01",details:"Initial appointment to PERSAL · Z83 form filed",status:"approved",highStakes:true,ledgerHash:"0x9b2e1f"},
  {id:8,employeeId:"e2",type:"Inception",category:"Z83 Onboarding",date:"2008-06-15",details:"Initial appointment · transferred from Treasury",status:"approved",highStakes:true,ledgerHash:"0x7a3d2c"},
  {id:9,employeeId:"e2",type:"Promotion",category:"Vertical Promotion",date:"2022-04-01",details:"Salary Level 10 → 11 · Deputy Director",status:"approved",highStakes:true,ledgerHash:"0x1e9f8b"},
  {id:10,employeeId:"e3",type:"Inception",category:"Z83 Onboarding",date:"2019-09-01",details:"Initial appointment · graduate intake",status:"approved",highStakes:true,ledgerHash:"0x5c8e2a"},
];
const INIT_LEDGER = [
  {id:1,employeeId:"e1",txHash:"0x9b2e1f",prevHash:"genesis",event:"Inception · Z83 Onboarding",actor:"PERSAL Migration",actorId:"system",timestamp:"2014-03-01T08:00:00Z",policyRef:"DPSA Directive · Z83 (2014)",aesSigned:true,threeFA:false},
  {id:2,employeeId:"e1",txHash:"0xa1c4e2",prevHash:"0x9b2e1f",event:"Touchpoint · PFMA Training",actor:"Anna L.",actorId:"u3",timestamp:"2024-07-10T11:20:00Z",policyRef:"Treasury Reg 8.4 (PFMA)",aesSigned:false,threeFA:false},
  {id:3,employeeId:"e1",txHash:"0x4f7a8c",prevHash:"0xa1c4e2",event:"Salary Notch Increment",actor:"Sarah K. (HR Director)",actorId:"u1",timestamp:"2025-11-15T14:23:00Z",policyRef:"PSCBC Resolution 1 of 2007",aesSigned:true,threeFA:true},
  {id:4,employeeId:"e1",txHash:"0x2c5d9a",prevHash:"0x4f7a8c",event:"Touchpoint · Performance Review",actor:"James M. (Line Manager)",actorId:"u2",timestamp:"2026-02-28T16:45:00Z",policyRef:"PMDS Framework (2018)",aesSigned:false,threeFA:false},
  {id:5,employeeId:"e1",txHash:"0x6e3b71",prevHash:"0x2c5d9a",event:"Touchpoint · DPSA Workshop",actor:"Anna L.",actorId:"u3",timestamp:"2026-03-08T09:30:00Z",policyRef:"DPSA CPD Mandate",aesSigned:false,threeFA:false},
  {id:6,employeeId:"e1",txHash:"0x8d4a09",prevHash:"0x6e3b71",event:"Touchpoint · Annual Leave",actor:"You",actorId:"u4",timestamp:"2026-04-15T07:55:00Z",policyRef:"Public Service Act §38",aesSigned:false,threeFA:false},
];
const VERSION_HISTORY = {
  1:[{v:4,user:"Sarah K.",userId:"u1",date:"Today",note:"Updated Q4 actuals",delta:"+12KB"},{v:3,user:"You",userId:"u4",date:"Mar 10",note:"Added footnotes",delta:"+3KB"},{v:2,user:"James M.",userId:"u2",date:"Feb 28",note:"Initial draft review",delta:"+890KB"},{v:1,user:"Sarah K.",userId:"u1",date:"Feb 20",note:"Created",delta:"+1.5MB"}],
  2:[{v:3,user:"James M.",userId:"u2",date:"Yesterday",note:"Policy updates per HR",delta:"+45KB"},{v:2,user:"Anna L.",userId:"u3",date:"Oct 5",note:"Minor edits",delta:"+2KB"},{v:1,user:"HR Team",userId:"u2",date:"Sep 1",note:"Created",delta:"+1.1MB"}],
};

// ─── Global State ─────────────────────────────────────────────────────────────
const AppContext = createContext(null);
const initialState = {
  documents: INIT_DOCS,
  workflows: INIT_WORKFLOWS,
  auditLog: INIT_AUDIT,
  retentionPolicies: INIT_RETENTION,
  notifications: [
    {id:1,type:"approval",text:"NDA — Beta Partners awaits your approval",time:"2m ago",read:false},
    {id:2,type:"comment",text:"James M. commented on Employee Handbook",time:"1h ago",read:false},
    {id:3,type:"system",text:"Scheduled OCR indexing completed (24 docs)",time:"3h ago",read:true},
  ],
  toasts: [],
  activityFeed: [
    {id:1,user:"Sarah K.",action:"uploaded",target:"Q1 Financial Report 2026.pdf",time:"09:14"},
    {id:2,user:"System",action:"indexed",target:"Brand Guidelines 2026.pdf",time:"09:10"},
    {id:3,user:"James M.",action:"commented on",target:"Employee Handbook v3.docx",time:"Yesterday"},
    {id:4,user:"You",action:"shared",target:"Marketing Budget 2026.xlsx",time:"Mar 10"},
  ],
  offline: false,
  currentUser: MOCK_USERS[3],
  employees: INIT_EMPLOYEES,
  touchpoints: INIT_TOUCHPOINTS,
  ledger: INIT_LEDGER,
  rehydrations: [],   // [{docId, priority, etaText, requestedAt, totalCost}]
  scanJobs: [
    {id:9001,name:"Z83 Batch — 2024/Q4",scanner:"Fujitsu fi-7600 (Lobby)",operator:"Sarah K.",pages:412,documentsCreated:78,status:"completed",startedAt:"2026-04-12 09:14",finishedAt:"2026-04-12 11:47",separator:true},
    {id:9002,name:"Personnel Files — Pre-2010",scanner:"Epson DS-32000 (Archive Rm)",operator:"James M.",pages:1840,documentsCreated:212,status:"completed",startedAt:"2026-03-28 08:00",finishedAt:"2026-03-28 17:22",separator:true},
    {id:9003,name:"Disciplinary Records — Re-scan",scanner:"Fujitsu fi-7600 (Lobby)",operator:"Anna L.",pages:96,documentsCreated:0,status:"failed",startedAt:"2026-04-08 14:02",finishedAt:"2026-04-08 14:09",separator:false,error:"Paper jam at page 47 — operator intervention required"},
  ],
  printJobs: [
    {id:5001,doc:"Z83 — Inception Pack (Mokoena)",pages:8,printer:"HR Office (Brother MFC-L8900)",status:"completed",sentAt:"Today 09:14",sentBy:"Sarah K."},
    {id:5002,doc:"Certified Copy — Disciplinary 1996",pages:12,printer:"Legal Office (HP LaserJet)",status:"printing",sentAt:"Today 11:32",sentBy:"You"},
    {id:5003,doc:"Retention Schedule — Q1 Report",pages:4,printer:"Reception (Canon imageRUNNER)",status:"queued",sentAt:"Today 11:40",sentBy:"You"},
  ],
};
let touchpointCounter = 1000;
let ledgerCounter = 1000;
const shortHash = () => "0x"+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,"0");
let toastCounter = 100;
let auditCounter = INIT_AUDIT.length + 1;
function appReducer(state, action) {
  switch(action.type) {
    case "ADD_DOC": return {...state, documents:[action.doc,...state.documents], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Uploaded",doc:action.doc.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "UPDATE_DOC": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,...action.patch}:d)};
    case "DELETE_DOC": {
      const doc = state.documents.find(d=>d.id===action.id);
      return {...state, documents:state.documents.filter(d=>d.id!==action.id), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"[DELETED]",doc:doc?.name||"",time:"Just now",ip:"196.25.x.x",deleted:true},...state.auditLog]};
    }
    case "CHECKOUT": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,checkedOut:true,checkedOutBy:"u4"}:d), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Checked Out",doc:action.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "CHECKIN": return {...state, documents:state.documents.map(d=>d.id===action.id?{...d,checkedOut:false,checkedOutBy:null,version:action.major?d.version+1:d.version,modified:"Just now"}:d), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Checked In",doc:action.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "APPROVE_WF": return {...state, workflows:state.workflows.filter(w=>w.id!==action.id), auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Approved",doc:action.doc,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "ADD_COMMENT": return {...state, workflows:state.workflows.map(w=>w.id===action.wfId?{...w,comments:[...w.comments,{id:Date.now(),userId:"u4",text:action.text,time:"Just now"}]}:w)};
    case "ADD_TOAST": return {...state, toasts:[...state.toasts,{id:toastCounter++,...action.toast}]};
    case "REMOVE_TOAST": return {...state, toasts:state.toasts.filter(t=>t.id!==action.id)};
    case "MARK_NOTIF_READ": return {...state, notifications:state.notifications.map(n=>n.id===action.id?{...n,read:true}:n)};
    case "ADD_ACTIVITY": return {...state, activityFeed:[action.item,...state.activityFeed].slice(0,20)};
    case "TOGGLE_OFFLINE": return {...state, offline:!state.offline};
    case "ADD_RETENTION": return {...state, retentionPolicies:[...state.retentionPolicies,action.policy]};
    case "ADD_EMPLOYEE": return {...state, employees:[action.employee,...state.employees], touchpoints:[{id:touchpointCounter++,employeeId:action.employee.id,type:"Inception",category:"Z83 Onboarding",date:new Date().toISOString().split("T")[0],details:"Initial appointment · Z83 form captured",status:"approved",highStakes:true,ledgerHash:action.ledgerHash},...state.touchpoints], ledger:[...state.ledger,{id:ledgerCounter++,employeeId:action.employee.id,txHash:action.ledgerHash,prevHash:"genesis",event:"Inception · Z83 Onboarding",actor:"You",actorId:"u4",timestamp:new Date().toISOString(),policyRef:"DPSA Directive · Z83 (2014)",aesSigned:true,threeFA:false}], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Z83 Inception",doc:`${action.employee.firstName} ${action.employee.lastName} (${action.employee.persalNo})`,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "ADD_TOUCHPOINT": return {...state, touchpoints:[action.touchpoint,...state.touchpoints], ledger:[...state.ledger,action.ledgerEntry], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:`Touchpoint · ${action.touchpoint.type}`,doc:action.employeeName,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "PROMOTE_EMPLOYEE": return {...state, employees:state.employees.map(e=>e.id===action.employeeId?{...e,salaryLevel:action.newLevel,salaryNotch:action.newNotch,jobTitle:action.newTitle||e.jobTitle}:e), touchpoints:[action.touchpoint,...state.touchpoints], ledger:[...state.ledger,action.ledgerEntry], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Promotion (3FA)",doc:action.employeeName,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "REQUEST_REHYDRATE": return {...state, rehydrations:[...state.rehydrations.filter(r=>r.docId!==action.docId),{docId:action.docId,priority:action.priority,etaText:action.etaText,requestedAt:Date.now(),totalCost:action.totalCost}], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:`Rehydrate (${action.priority})`,doc:action.docName,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    case "REHYDRATE_COMPLETE": return {...state, rehydrations:state.rehydrations.filter(r=>r.docId!==action.docId), documents:state.documents.map(d=>d.id===action.docId?{...d,tier:"hot",tieredAt:new Date().toISOString().split("T")[0]}:d)};
    case "ADD_SCAN_JOB": return {...state, scanJobs:[action.job,...state.scanJobs], auditLog:[{id:auditCounter++,userId:"u4",user:"You",action:"Scanner Ingestion",doc:action.job.name,time:"Just now",ip:"196.25.x.x"},...state.auditLog]};
    default: return state;
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const fileColor = t=>({pdf:"#e05c5c",docx:"#219CD6",xlsx:"#107c10",img:"#8764b8"}[t]||"#605e5c");
const fileIcon = t=>({pdf:"PDF",docx:"DOC",xlsx:"XLS",img:"IMG"}[t]||"FILE");
const statusStyle = s=>({approved:{bg:"#dff6dd",text:"#107c10"},pending:{bg:"#fff4ce",text:"#7a5700"},draft:{bg:"#f3f3f3",text:"#605e5c"},archived:{bg:"#f0f0f0",text:"#a19f9d"}}[s]||{bg:"#f3f3f3",text:"#323130"});
const prioStyle = p=>({urgent:{bg:"#fde7e9",text:"#a4262c"},high:{bg:"#fff4ce",text:"#7a5700"},normal:{bg:"#f3f3f3",text:"#323130"}}[p]||{bg:"#f3f3f3",text:"#323130"});
const userById = id => MOCK_USERS.find(u=>u.id===id)||{name:"Unknown",initials:"??",color:"#a19f9d"};
const genId = () => Math.floor(Math.random()*90000)+10000;

// ─── Azure Storage Tiers (realistic ZAR pricing, SA North) ────────────────────
const TIER_META = {
  hot:    {label:"Hot",     icon:Server20Regular,        color:"#107c10", storagePerGBmo:0.42, readPerGB:0,    txPerReq:0,    desc:"Frequent access. Reads are free; storage costs more."},
  cold:   {label:"Cold",    icon:CloudSync20Regular,     color:"#0078d4", storagePerGBmo:0.05, readPerGB:0.27, txPerReq:0.08, desc:"Infrequent access. Cheaper to keep, small fee on retrieval."},
  archive:{label:"Archive", icon:CloudArchive20Regular,  color:"#605e5c", storagePerGBmo:0.02, readPerGB:0.36, txPerReq:0.42, desc:"Long-term cold storage. Cheapest; rehydration takes hours."},
};
const formatZAR = (v) => "R" + (v<1?v.toFixed(4):v<100?v.toFixed(2):v.toFixed(0)).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const rehydrationCost = (doc, priority="standard") => {
  const t=TIER_META[doc.tier||"hot"];
  const sizeGB=doc.sizeBytes/(1024*1024*1024);
  const base=t.txPerReq + sizeGB*t.readPerGB;
  return priority==="high" ? base*3.5 : base;
};
const rehydrationWait = (doc, priority="standard") => {
  if(doc.tier==="cold") return priority==="high" ? "instant" : "<30 sec";
  if(doc.tier==="archive") return priority==="high" ? "<1 hour" : "8–15 hours";
  return "instant";
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const GS = `
@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:3px;}
input,textarea,select{font-family:inherit;}input:focus,textarea:focus,select:focus{outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@keyframes slideRight{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:none;}}
@keyframes slideLeft{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:none;}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
@keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes loadbar{0%{transform:translateX(-100%);}50%{transform:translateX(160%);}100%{transform:translateX(420%);}}
@keyframes pulse2{0%,100%{opacity:1;}50%{opacity:0.4;}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.95);}to{opacity:1;transform:none;}}
@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(0.95);}}
.fade-up{animation:fadeUp 0.28s ease both;}
.slide-right{animation:slideRight 0.22s ease both;}
.slide-left{animation:slideLeft 0.22s ease both;}
.scale-in{animation:scaleIn 0.2s ease both;}
.shimmer{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;}
`;

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Avatar({userId,size=28}){
  const u=userById(userId);
  return <div style={{width:size,height:size,borderRadius:"50%",background:u.color,display:"grid",placeItems:"center",color:"#fff",fontSize:size*0.35,fontWeight:700,flexShrink:0}}>{u.initials}</div>;
}
function Badge({count,color="#219CD6"}){
  if(!count)return null;
  return <div style={{minWidth:16,height:16,background:color,color:"#fff",borderRadius:100,fontSize:10,fontWeight:700,display:"grid",placeItems:"center",padding:"0 4px"}}>{count}</div>;
}
function Btn({children,variant="primary",size="md",onClick,disabled,loading,style={}}){
  const isDisabled=disabled||loading;
  const base={border:"none",borderRadius:6,cursor:isDisabled?"not-allowed":"pointer",fontWeight:600,fontFamily:"inherit",transition:"all 0.15s",opacity:isDisabled?0.5:1,whiteSpace:"nowrap",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,flexShrink:0,...style};
  const sz={sm:{fontSize:11,padding:"4px 10px"},md:{fontSize:13,padding:"7px 14px"},lg:{fontSize:14,padding:"9px 18px"}}[size];
  const v={
    primary:{background:"#219CD6",color:"#fff"},
    secondary:{background:"#f3f2f1",color:"#323130"},
    danger:{background:"#a4262c",color:"#fff"},
    success:{background:"#107c10",color:"#fff"},
    ghost:{background:"transparent",color:"#219CD6",border:"1px solid #219CD6"},
  }[variant];
  return <button onClick={isDisabled?undefined:onClick} style={{...base,...sz,...v}}>{loading?<><Spinner size={size==="sm"?11:13} color={variant==="primary"||variant==="danger"||variant==="success"?"#fff":"#0078d4"}/>{typeof children==="string"?children:null}</>:children}</button>;
}
function Input({label,value,onChange,placeholder,type="text",style={}}){
  return <div style={{marginBottom:12,...style}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",color:"#323130",transition:"border-color 0.15s"}} onFocus={e=>e.target.style.borderColor="#219CD6"} onBlur={e=>e.target.style.borderColor="#e0dede"} />
  </div>;
}
function FluentSelect({value,onChange,options,placeholder,size="md",direction="down",disabled,style={}}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    if(!open)return;
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    const k=(e)=>{if(e.key==="Escape")setOpen(false);};
    document.addEventListener("mousedown",h);
    document.addEventListener("keydown",k);
    return()=>{document.removeEventListener("mousedown",h);document.removeEventListener("keydown",k);};
  },[open]);
  const norm=options.map(o=>(typeof o==="string"||typeof o==="number")?{value:o,label:String(o)}:o);
  const current=norm.find(o=>String(o.value)===String(value));
  const sz=size==="sm"?{fontSize:12,padding:"4px 8px",minHeight:26}:{fontSize:13,padding:"7px 10px",minHeight:32};
  return <div ref={ref} style={{position:"relative",...style}}>
    <button type="button" onClick={()=>!disabled&&setOpen(o=>!o)} disabled={disabled} style={{...sz,width:"100%",border:`1px solid ${open?"#219CD6":"#e1dfdd"}`,borderRadius:4,background:disabled?"#f3f2f1":"#fff",color:"#201f1e",fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:6,whiteSpace:"nowrap",textAlign:"left",opacity:disabled?0.6:1,transition:"border-color 0.15s",boxSizing:"border-box"}}>
      <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",color:current?"#201f1e":"#a19f9d"}}>{current?current.label:(placeholder||"Select…")}</span>
      <span style={{display:"inline-flex",color:"#605e5c",transform:open?"rotate(180deg)":"none",transition:"transform 0.15s"}}><I as={ChevronDown20Regular} size={14}/></span>
    </button>
    {open&&<div className="scale-in" style={{position:"absolute",[direction==="up"?"bottom":"top"]:"calc(100% + 4px)",left:0,right:0,minWidth:"100%",background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:5000,padding:4,maxHeight:260,overflow:"auto"}}>
      {norm.length===0&&<div style={{padding:"8px 10px",fontSize:12,color:"#a19f9d"}}>No options</div>}
      {norm.map(o=>{
        const sel=String(o.value)===String(value);
        return <div key={String(o.value)} onClick={()=>{onChange&&onChange({target:{value:o.value}});setOpen(false);}} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",cursor:"pointer",fontSize:12,color:sel?"#219CD6":"#201f1e",fontWeight:sel?600:400,background:sel?"#deecf9":"transparent",borderRadius:2}} onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="#f3f2f1";}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}>
          <span style={{width:14,display:"inline-flex"}}>{sel&&<I as={Checkmark20Regular} size={12}/>}</span>
          <span style={{flex:1}}>{o.label}</span>
        </div>;
      })}
    </div>}
  </div>;
}
function Select({label,value,onChange,options,placeholder,style={}}){
  return <div style={{marginBottom:12,...style}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>{label}</div>}
    <FluentSelect value={value} onChange={onChange} options={options} placeholder={placeholder}/>
  </div>;
}
function Tag({label,onRemove,color="#219CD6"}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${color}18`,color,borderRadius:100,fontSize:11,fontWeight:600,padding:"2px 8px",marginRight:4,marginBottom:4}}>
    #{label}{onRemove&&<span onClick={onRemove} style={{cursor:"pointer",opacity:0.7,display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={11}/></span>}
  </span>;
}
function Skeleton({w="100%",h=14,r=4,style={}}){
  return <div className="shimmer" style={{width:w,height:h,borderRadius:r,...style}} />;
}
function Divider({my=16}){return <div style={{height:1,background:"rgba(0,0,0,0.07)",margin:`${my}px 0`}} />;}
function Spinner({size=14,color="currentColor"}){
  return <span style={{display:"inline-flex",flexShrink:0}}><span style={{width:size,height:size,borderRadius:"50%",border:`2px solid ${color}33`,borderTopColor:color,animation:"spin 0.7s linear infinite",display:"inline-block",boxSizing:"border-box"}}/></span>;
}
function TopProgressBar({active}){
  if(!active) return null;
  return <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"transparent",overflow:"hidden",zIndex:6000,pointerEvents:"none"}}>
    <div style={{height:"100%",width:"25%",background:"linear-gradient(90deg,transparent,#219CD6 40%,#219CD6 60%,transparent)",animation:"loadbar 0.9s ease-in-out infinite"}}/>
  </div>;
}
function useSimulatedLoad(deps,durationMs=400){
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    setLoading(true);
    const t=setTimeout(()=>setLoading(false),durationMs);
    return ()=>clearTimeout(t);
  },deps); // eslint-disable-line react-hooks/exhaustive-deps
  return loading;
}
function simulateLatency(ms=700){return new Promise(r=>setTimeout(r,ms));}

// ─── Toast System ─────────────────────────────────────────────────────────────
function ToastContainer(){
  const {state,dispatch}=useContext(AppContext);
  useEffect(()=>{
    state.toasts.forEach(t=>{
      const timer=setTimeout(()=>dispatch({type:"REMOVE_TOAST",id:t.id}),4000);
      return ()=>clearTimeout(timer);
    });
  },[state.toasts]);
  return <div style={{position:"fixed",bottom:20,right:20,display:"flex",flexDirection:"column",gap:8,zIndex:9999,pointerEvents:"none"}}>
    {state.toasts.map(t=>(
      <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,background:"#fff",border:"1px solid rgba(0,0,0,0.1)",borderLeft:`3px solid ${t.color||"#219CD6"}`,borderRadius:8,padding:"11px 14px",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:260,maxWidth:340,animation:"toastIn 0.2s ease",pointerEvents:"all"}}>
        <span style={{display:"inline-flex",alignItems:"center"}}>{t.icon||<I as={Info20Regular} size={16} color={t.color||"#219CD6"}/>}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:"#323130"}}>{t.title}</div>
          {t.msg&&<div style={{fontSize:11,color:"#605e5c",marginTop:1}}>{t.msg}</div>}
        </div>
        <button onClick={()=>dispatch({type:"REMOVE_TOAST",id:t.id})} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={14}/></button>
      </div>
    ))}
  </div>;
}
function useToast(){
  const {dispatch}=useContext(AppContext);
  return useCallback((title,msg,opts={})=>dispatch({type:"ADD_TOAST",toast:{title,msg,...opts}}),[dispatch]);
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({x,y,items,onClose}){
  const ref=useRef();
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  return <div ref={ref} className="scale-in" style={{position:"fixed",left:x,top:y,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:5000,minWidth:200,padding:4,overflow:"hidden"}}>
    {items.map((item,i)=>item.divider
      ? <div key={i} style={{height:1,background:"rgba(0,0,0,0.07)",margin:"4px 0"}}/>
      : <div key={i} onClick={()=>{item.action();onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderRadius:4,fontSize:13,color:item.danger?"#a4262c":"#323130",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=item.danger?"#fde7e9":"#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <span style={{width:16,textAlign:"center"}}>{item.icon}</span>{item.label}
      </div>
    )}
  </div>;
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────
function Modal({title,onClose,children,width=480}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)",display:"grid",placeItems:"center",zIndex:4000}} onClick={onClose}>
    <div className="scale-in" onClick={e=>e.stopPropagation()} style={{width,maxWidth:"95vw",maxHeight:"90vh",background:"#fff",borderRadius:12,boxShadow:"0 32px 80px rgba(0,0,0,0.2)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(0,0,0,0.08)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:700,color:"#201f1e"}}>{title}</span>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",padding:"2px 4px",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={18}/></button>
      </div>
      <div style={{overflow:"auto",flex:1}}>{children}</div>
    </div>
  </div>;
}

// ─── File Type Icon ───────────────────────────────────────────────────────────
function FileIcon({type,size=40}){
  return <div style={{width:size,height:Math.round(size*1.1),background:fileColor(type),borderRadius:Math.round(size*0.15),display:"grid",placeItems:"center",color:"#fff",fontSize:Math.round(size*0.22),fontWeight:700,flexShrink:0,position:"relative"}}>
    {fileIcon(type)}
    <div style={{position:"absolute",bottom:-1,right:-1,width:Math.round(size*0.28),height:Math.round(size*0.28),background:"rgba(255,255,255,0.9)",borderRadius:`${Math.round(size*0.1)}px 0 ${Math.round(size*0.15)}px 0`}}/>
  </div>;
}

// ─── Flow 1: Upload Wizard ────────────────────────────────────────────────────
const OCR_STAGES = ["Uploading","Virus Scan","OCR Processing","Indexing","Complete"];
const MOCK_OCR = {docType:"Contract",client:"Acme Corp",department:"Legal",tags:["contract","client","2026"],description:"Service agreement covering software licensing and support for FY2026. Parties: Ezra360 Ltd and Acme Corp."};
function UploadWizard({onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [step,setStep]=useState(1);
  const [files,setFiles]=useState([]);
  const [dragging,setDragging]=useState(false);
  const [errors,setErrors]=useState([]);
  const [meta,setMeta]=useState({docType:"",client:"",department:"",tags:[],tagInput:"",description:""});
  const [ocrLoading,setOcrLoading]=useState(false);
  const [ocrDone,setOcrDone]=useState(false);
  const [stageIdx,setStageIdx]=useState(-1);
  const VALID = ["pdf","docx","xlsx","png","jpg"];
  const validate = (name) => { const ext=name.split(".").pop().toLowerCase(); return VALID.includes(ext)?null:`Invalid type: .${ext}`; };
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const dropped=[...e.dataTransfer.files];
    const errs=[]; const valid=[];
    dropped.forEach(f=>{ const err=validate(f.name); if(err)errs.push(err); else valid.push({name:f.name,size:(f.size/1024/1024).toFixed(1)+" MB",type:f.name.split(".").pop().toLowerCase()}); });
    setFiles(v=>[...v,...valid]); setErrors(errs);
  };
  const triggerOCR = () => {
    setOcrLoading(true);
    setTimeout(()=>{ setMeta({...meta,...MOCK_OCR,tagInput:""}); setOcrLoading(false); setOcrDone(true); }, 2000);
  };
  const addTag = (e) => {
    if(e.key==="Enter"||e.key===","){ const t=meta.tagInput.trim().replace(",",""); if(t&&!meta.tags.includes(t))setMeta({...meta,tags:[...meta.tags,t],tagInput:""}); }
  };
  const runIndexing = () => {
    setStep(3); setStageIdx(0);
    OCR_STAGES.forEach((_,i)=>setTimeout(()=>setStageIdx(i),i*700));
    setTimeout(()=>{
      const newDoc={id:genId(),name:files[0]?.name||"Uploaded Document.pdf",type:(files[0]?.type)||"pdf",size:files[0]?.size||"1.2 MB",sizeBytes:1200000,modified:"Just now",owner:"You",ownerId:"u4",folder:meta.department||"Finance",tags:meta.tags,version:1,status:"draft",starred:false,checkedOut:false,checkedOutBy:null,retentionYears:5,created:new Date().toISOString().split("T")[0],description:meta.description,isNew:true};
      dispatch({type:"ADD_DOC",doc:newDoc});
      toast("Document uploaded","OCR indexing complete — document is now searchable",{icon:<I as={CheckmarkCircle20Filled} size={18} color="#107c10"/>,color:"#107c10"});
      setTimeout(()=>onClose(),2500);
    },OCR_STAGES.length*700+600);
  };
  return <Modal title="Upload Document" onClose={onClose} width={540}>
    {/* Progress steps */}
    <div style={{display:"flex",padding:"12px 20px",gap:0,borderBottom:"1px solid rgba(0,0,0,0.07)",background:"#faf9f8"}}>
      {["Drop Files","Metadata","Indexing"].map((s,i)=>(
        <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:0}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:step>i+1?"#107c10":step===i+1?"#219CD6":"#e8e6e4",color:"#fff",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,marginBottom:4}}>{step>i+1?<I as={Checkmark20Regular} size={12}/>:i+1}</div>
            <span style={{fontSize:10,fontWeight:600,color:step===i+1?"#219CD6":"#a19f9d"}}>{s}</span>
          </div>
          {i<2&&<div style={{width:40,height:2,background:step>i+1?"#107c10":"#e8e6e4",marginBottom:16,flexShrink:0}}/>}
        </div>
      ))}
    </div>
    <div style={{padding:20}}>
    {step===1&&<>
      <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={handleDrop}
        style={{border:`2px dashed ${dragging?"#219CD6":"#c8c6c4"}`,borderRadius:10,padding:"32px 20px",textAlign:"center",background:dragging?"#deecf9":"#faf9f8",transition:"all 0.2s",cursor:"pointer",marginBottom:12}}
        onClick={()=>{ const mock=[{name:"Q1_Report_Draft.pdf",size:"2.1 MB",type:"pdf"},{name:"Appendix_A.docx",size:"340 KB",type:"docx"}]; setFiles(mock); }}>
        <div style={{marginBottom:8,color:dragging?"#219CD6":"#605e5c"}}><I as={FolderOpen20Regular} size={36}/></div>
        <div style={{fontSize:14,fontWeight:600,color:dragging?"#219CD6":"#323130",marginBottom:4}}>Drop files here or click to select</div>
        <div style={{fontSize:12,color:"#a19f9d"}}>PDF, DOCX, XLSX, PNG, JPG · Max 25 MB per file</div>
      </div>
      {errors.map((e,i)=><div key={i} style={{fontSize:12,color:"#a4262c",background:"#fde7e9",borderRadius:4,padding:"4px 10px",marginBottom:4,display:"flex",alignItems:"center",gap:6}}><I as={Warning20Regular} size={14}/> {e}</div>)}
      {files.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
        {files.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"rgba(33,156,214,0.04)",border:"1px solid rgba(33,156,214,0.15)",borderRadius:6}}>
          <FileIcon type={f.type} size={28}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{f.name}</div><div style={{fontSize:11,color:"#605e5c"}}>{f.size}</div></div>
          <span onClick={()=>setFiles(files.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:"#a19f9d",display:"inline-flex"}}><I as={Dismiss20Regular} size={14}/></span>
        </div>)}
      </div>}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
        <Btn onClick={()=>{if(files.length)setStep(2);}} disabled={!files.length}>Next: Add Metadata →</Btn>
      </div>
    </>}
    {step===2&&<>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,padding:"8px 12px",background:"#f3f2f1",borderRadius:8}}>
        <span style={{fontSize:12,color:"#605e5c",display:"inline-flex",alignItems:"center",gap:6}}><I as={Search20Regular} size={14}/> Auto-extract from OCR</span>
        <div onClick={ocrLoading?undefined:triggerOCR} style={{width:40,height:22,borderRadius:100,background:ocrDone?"#107c10":"#219CD6",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:ocrDone?20:2,transition:"left 0.2s"}}/>
        </div>
      </div>
      {ocrLoading&&<div style={{marginBottom:12}}><Skeleton h={36} r={6}/><div style={{marginTop:8}}><Skeleton h={36} r={6}/></div></div>}
      {!ocrLoading&&<>
        <Select label="Document Type" value={meta.docType} onChange={e=>setMeta({...meta,docType:e.target.value})} options={[{value:"",label:"Select type…"},...DOC_TYPES.map(t=>({value:t,label:t}))]}/>
        <Input label="Client / Project Name" value={meta.client} onChange={e=>setMeta({...meta,client:e.target.value})} placeholder="e.g. Acme Corp"/>
        <Select label="Department" value={meta.department} onChange={e=>setMeta({...meta,department:e.target.value})} options={[{value:"",label:"Select department…"},...DEPARTMENTS.map(d=>({value:d,label:d}))]}/>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Tags</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{meta.tags.map(t=><Tag key={t} label={t} onRemove={()=>setMeta({...meta,tags:meta.tags.filter(x=>x!==t)})}/>)}</div>
          <input value={meta.tagInput} onChange={e=>setMeta({...meta,tagInput:e.target.value})} onKeyDown={addTag} placeholder="Type tag, press Enter…" style={{width:"100%",padding:"7px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8"}}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Description</div>
          <textarea value={meta.description} onChange={e=>setMeta({...meta,description:e.target.value})} rows={3} placeholder="Brief description…" style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",resize:"vertical"}}/>
        </div>
      </>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
        <Btn onClick={runIndexing}>Upload & Index →</Btn>
      </div>
    </>}
    {step===3&&<div style={{padding:"8px 0"}}>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
        {OCR_STAGES.map((s,i)=>(
          <div key={s} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:stageIdx>i?"#107c10":stageIdx===i?"#219CD6":"#e8e6e4",display:"grid",placeItems:"center",flexShrink:0,transition:"background 0.3s"}}>
              {stageIdx>i?<span style={{color:"#fff",display:"inline-flex"}}><I as={Checkmark20Regular} size={12}/></span>:stageIdx===i?<div style={{width:10,height:10,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.5)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/>:<span style={{width:8,height:8,borderRadius:"50%",background:"#c8c6c4",display:"block"}}/>}
            </div>
            <div style={{flex:1,height:4,background:stageIdx>i?"#107c10":stageIdx===i?"#219CD6":"#f3f2f1",borderRadius:100,transition:"background 0.3s"}}/>
            <span style={{fontSize:12,fontWeight:600,color:stageIdx>=i?"#323130":"#a19f9d",minWidth:100}}>{s}</span>
          </div>
        ))}
      </div>
      {stageIdx>=4&&<div className="fade-up" style={{background:"#dff6dd",border:"1px solid #107c10",borderRadius:10,padding:16,textAlign:"center"}}>
        <div style={{marginBottom:6,color:"#107c10"}}><I as={CheckmarkCircle20Filled} size={28}/></div>
        <div style={{fontSize:14,fontWeight:700,color:"#107c10",marginBottom:4}}>Upload Complete</div>
        <div style={{fontSize:12,color:"#237021"}}>Extracted 1,284 words · Language: English · Tagged with {meta.tags.length} tags</div>
      </div>}
    </div>}
    </div>
  </Modal>;
}

// ─── Flow 2: Metadata Editor ──────────────────────────────────────────────────
function MetadataEditor({doc,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({name:doc.name,docType:doc.tags[0]||"",description:doc.description||"",tags:[...doc.tags],tagInput:""});
  const [saving,setSaving]=useState(false);
  const save=async ()=>{ setSaving(true); await simulateLatency(1800); dispatch({type:"UPDATE_DOC",id:doc.id,patch:{name:form.name,tags:form.tags,description:form.description}}); toast("Metadata updated","Changes saved successfully",{icon:<I as={Edit20Regular} size={16} color="#219CD6"/>,color:"#219CD6"}); setSaving(false); onClose(); };
  return <Modal title="Edit Metadata" onClose={onClose} width={440}>
    <div style={{padding:20}}>
      <Input label="Document Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <Select label="Document Type" value={form.docType} onChange={e=>setForm({...form,docType:e.target.value})} options={[{value:"",label:"Select…"},...DOC_TYPES.map(t=>({value:t,label:t}))]}/>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Tags</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{form.tags.map(t=><Tag key={t} label={t} onRemove={()=>setForm({...form,tags:form.tags.filter(x=>x!==t)})}/>)}</div>
        <input value={form.tagInput} onChange={e=>setForm({...form,tagInput:e.target.value})} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){const t=form.tagInput.trim().replace(",","");if(t&&!form.tags.includes(t))setForm({...form,tags:[...form.tags,t],tagInput:""});}}} placeholder="Add tag, press Enter…" style={{width:"100%",padding:"7px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8"}}/>
      </div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Description</div>
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={save} loading={saving}>{saving?"Saving…":"Save Changes"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Flow 2: RBAC Panel ───────────────────────────────────────────────────────
function RBACPanel({doc,onClose}){
  const [perms,setPerms]=useState({Admin:true,Editor:true,Viewer:false,Guest:false});
  const [saving,setSaving]=useState(false);
  const toast=useToast();
  const savePerms=async ()=>{ setSaving(true); await simulateLatency(1800); toast("Permissions updated","Access controls saved",{icon:<I as={LockClosed20Regular} size={16} color="#107c10"/>,color:"#107c10"}); setSaving(false); onClose(); };
  return <Modal title="Access Permissions" onClose={onClose} width={400}>
    <div style={{padding:20}}>
      <div style={{fontSize:12,color:"#605e5c",marginBottom:16}}>Control which roles can access <strong>{doc.name}</strong></div>
      {Object.entries(perms).map(([role,enabled])=>(
        <div key={role} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"#faf9f8",borderRadius:8,marginBottom:8,border:"1px solid rgba(0,0,0,0.07)"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600}}>{role}</div>
            <div style={{fontSize:11,color:"#a19f9d"}}>{({Admin:"Full access",Editor:"Can edit & comment",Viewer:"Read only",Guest:"Preview only"})[role]}</div>
          </div>
          <div onClick={()=>setPerms({...perms,[role]:!enabled})} style={{width:40,height:22,borderRadius:100,background:enabled?"#219CD6":"#c8c6c4",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:enabled?20:2,transition:"left 0.2s"}}/>
          </div>
        </div>
      ))}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={savePerms} loading={saving}>{saving?"Saving…":"Save Permissions"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Flow 4: Version Control Panel ───────────────────────────────────────────
function VersionPanel({doc,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [showCheckin,setShowCheckin]=useState(false);
  const [showDiff,setShowDiff]=useState(false);
  const [checkinNote,setCheckinNote]=useState("");
  const [major,setMajor]=useState(false);
  const [restoreConfirm,setRestoreConfirm]=useState(null);
  const versions=VERSION_HISTORY[doc.id]||[{v:doc.version,user:"You",userId:"u4",date:"Today",note:"Current version",delta:doc.size}];
  const isCheckedOutByMe=doc.checkedOut&&doc.checkedOutBy==="u4";
  const isCheckedOutByOther=doc.checkedOut&&doc.checkedOutBy!=="u4";
  const checkout=()=>{ dispatch({type:"CHECKOUT",id:doc.id,name:doc.name}); toast("Document checked out","File is locked for editing",{icon:<I as={LockClosed20Regular} size={16} color="#c8a116"/>,color:"#c8a116"}); };
  const checkin=()=>{ dispatch({type:"CHECKIN",id:doc.id,name:doc.name,major}); toast("Checked in successfully",`Version ${major?doc.version+1:doc.version} saved`,{icon:<I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>,color:"#107c10"}); setShowCheckin(false); onClose(); };
  return <Modal title="Version Control" onClose={onClose} width={520}>
    <div style={{padding:20}}>
      {isCheckedOutByMe&&<div className="fade-up" style={{background:"#fff4ce",border:"1px solid #c8a116",borderRadius:8,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,fontSize:13}}>
        <I as={Warning20Regular} size={16} color="#c8a116"/><span><strong>Checked out by You</strong> — other users cannot edit</span>
        <Btn variant="secondary" size="sm" onClick={()=>setShowCheckin(true)} style={{marginLeft:"auto"}}>Check In</Btn>
      </div>}
      {isCheckedOutByOther&&<div style={{background:"#fde7e9",border:"1px solid #a4262c",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,display:"flex",alignItems:"center",gap:8}}>
        <I as={LockClosed20Regular} size={16} color="#a4262c"/> Checked out by <strong>{userById(doc.checkedOutBy).name}</strong>
      </div>}
      {!doc.checkedOut&&<div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn onClick={checkout}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><I as={ArrowDownload20Regular} size={14}/> Check Out</span></Btn>
        <Btn variant="secondary" onClick={()=>setShowDiff(!showDiff)}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><I as={ArrowSwap20Regular} size={14}/> View Diff</span></Btn>
      </div>}
      {showDiff&&<DiffViewer onClose={()=>setShowDiff(false)}/>}
      {showCheckin&&<div className="fade-up" style={{background:"#f3f2f1",borderRadius:8,padding:14,marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>Check In Document</div>
        <Input label="What changed?" value={checkinNote} onChange={e=>setCheckinNote(e.target.value)} placeholder="Describe your changes…"/>
        <div style={{display:"flex",gap:12,marginBottom:12}}>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="radio" checked={!major} onChange={()=>setMajor(false)}/> Minor (v{doc.version})</label>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:13,cursor:"pointer"}}><input type="radio" checked={major} onChange={()=>setMajor(true)}/> Major (v{doc.version+1})</label>
        </div>
        <div style={{display:"flex",gap:8}}><Btn onClick={checkin} disabled={!checkinNote}>Confirm Check In</Btn><Btn variant="secondary" onClick={()=>setShowCheckin(false)}>Cancel</Btn></div>
      </div>}
      <div style={{fontSize:12,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Version History</div>
      <div style={{display:"flex",flexDirection:"column",gap:0}}>
        {versions.map((v,i)=>(
          <div key={v.v} style={{display:"flex",gap:12,position:"relative"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20,flexShrink:0}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:i===0?"#219CD6":"#c8c6c4",border:"2px solid #fff",boxShadow:`0 0 0 2px ${i===0?"#219CD6":"#c8c6c4"}`,marginTop:4,flexShrink:0}}/>
              {i<versions.length-1&&<div style={{width:2,flex:1,background:"#e8e6e4",margin:"3px 0"}}/>}
            </div>
            <div style={{paddingBottom:16,flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <Avatar userId={v.userId} size={22}/>
                <span style={{fontSize:12,fontWeight:700}}>v{v.v}</span>
                <span style={{fontSize:11,color:"#605e5c"}}>{v.user}</span>
                <span style={{fontSize:11,color:"#a19f9d",marginLeft:"auto"}}>{v.date}</span>
              </div>
              <div style={{fontSize:12,color:"#323130",marginBottom:4}}>{v.note}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:10,color:"#605e5c",background:"#f3f2f1",borderRadius:4,padding:"1px 6px"}}>{v.delta}</span>
                {i>0&&<button onClick={()=>setRestoreConfirm(v.v)} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#219CD6",padding:0,fontFamily:"inherit"}}>Restore →</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {restoreConfirm&&<div className="scale-in" style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",display:"grid",placeItems:"center",zIndex:5500}} onClick={()=>setRestoreConfirm(null)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:12,padding:24,width:360,boxShadow:"0 24px 60px rgba(0,0,0,0.2)"}}>
          <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Restore to v{restoreConfirm}?</div>
          <div style={{fontSize:13,color:"#605e5c",marginBottom:16,display:"flex",alignItems:"flex-start",gap:6}}><I as={Warning20Regular} size={14} color="#c8a116" style={{marginTop:2}}/><span>3 users currently have this document open. This will create a new version from the restored content.</span></div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setRestoreConfirm(null)}>Cancel</Btn><Btn onClick={()=>{toast("Version restored",`Restored to v${restoreConfirm}`,{icon:<I as={ArrowCounterclockwise20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});setRestoreConfirm(null);onClose();}}>Restore</Btn></div>
        </div>
      </div>}
    </div>
  </Modal>;
}

function DiffViewer({onClose}){
  const oldLines=["Section 1: Parties","This agreement is entered into as of January 1, 2026","between Ezra360 Ltd (\"Company\")","and Acme Corp (\"Client\").","","Section 2: Services","The Company shall provide software services","as outlined in Schedule A.","Support hours: 9am-5pm weekdays."];
  const newLines=["Section 1: Parties","This agreement is entered into as of March 1, 2026","between Ezra360 Ltd (\"Company\")","and Acme Corp (\"Client\"), a registered entity.","","Section 2: Services","The Company shall provide premium software services","as outlined in Schedule A and Schedule B.","Support hours: 8am-6pm weekdays and Saturdays.","Emergency support: 24/7 via dedicated hotline."];
  return <div style={{background:"#1e1e1e",borderRadius:8,padding:12,marginBottom:14,fontFamily:"monospace",fontSize:11,overflow:"auto",maxHeight:220}}>
    <div style={{color:"#a19f9d",marginBottom:8,fontSize:10}}>← v3 (prev)  /  v4 (current) →</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1}}>
      <div>{oldLines.map((l,i)=><div key={i} style={{padding:"2px 6px",background:!newLines[i]?"rgba(164,38,44,0.3)":l!==newLines[i]?"rgba(164,38,44,0.2)":"transparent",color:l!==newLines[i]?"#f1a5a8":"#c8c6c4",fontSize:10}}>{l||" "}</div>)}</div>
      <div>{newLines.map((l,i)=><div key={i} style={{padding:"2px 6px",background:!oldLines[i]?"rgba(16,124,16,0.3)":l!==oldLines[i]?"rgba(16,124,16,0.2)":"transparent",color:l!==oldLines[i]?"#a3d9a5":"#c8c6c4",fontSize:10}}>{l||" "}</div>)}</div>
    </div>
  </div>;
}

// ─── Flow 3: Search ───────────────────────────────────────────────────────────
function SearchView(){
  const {state}=useContext(AppContext);
  const [preview,setPreview]=useState(null);
  const [accessRequest,setAccessRequest]=useState(false);
  const toast=useToast();
  const RESTRICTED_ID=5;
  // Provide each doc with a stable mock match score for visual richness
  const rows=state.documents.map((d,i)=>({...d,_match:85-(i*7)%50}));
  const cols=[
    {id:"name",label:"Name",get:d=>d.name,minWidth:280,renderCell:d=>{const restricted=d.id===RESTRICTED_ID;return <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}><FileIcon type={d.type} size={24}/><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#201f1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>{restricted&&<I as={LockClosed20Regular} size={12} color="#a4262c"/>}{d.name}</div><div style={{fontSize:10,color:"#a19f9d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.tags.slice(0,3).map(t=>"#"+t).join(" ")}</div></div></div>;}},
    {id:"folder",label:"Folder",get:d=>d.folder,filterable:true,width:140},
    {id:"owner",label:"Owner",get:d=>d.owner,filterable:true,width:140,renderCell:d=><div style={{display:"flex",alignItems:"center",gap:6}}><Avatar userId={d.ownerId} size={20}/><span style={{whiteSpace:"nowrap"}}>{d.owner}</span></div>},
    {id:"status",label:"Status",get:d=>d.status,filterable:true,width:108,renderCell:d=><span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${statusStyle(d.status).text}55`,color:statusStyle(d.status).text,whiteSpace:"nowrap"}}>{d.status}</span>},
    {id:"_match",label:"Match",get:d=>d._match,width:120,align:"left",renderCell:d=><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{height:4,width:60,background:"#f3f2f1",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",width:`${d._match}%`,background:"#219CD6"}}/></div><span style={{fontSize:10,color:"#605e5c"}}>{d._match}%</span></div>},
    {id:"size",label:"Size",get:d=>d.sizeBytes,width:90,renderCell:d=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{d.size}</span>},
    {id:"modified",label:"Modified",get:d=>d.modified,width:140,renderCell:d=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{d.modified}</span>},
  ];
  const onClickRow=(d)=>{ if(d.id===RESTRICTED_ID) setAccessRequest(true); else setPreview(d); };
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="Search" subtitle="Full-text search across documents · OCR + tags + metadata" commandView="search"/>
    <DataTable rows={rows} columns={cols} getKey={d=>d.id} defaultSort={{col:"_match",dir:"desc"}} searchPlaceholder="Search by name, tag, owner, folder…" searchKeys={["name","folder","owner","status"]} onRowClick={onClickRow} selectedKey={preview?.id} emptyMessage="No documents match this search."/>
    {preview&&<Drawer onClose={()=>setPreview(null)} width={520}>
      <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #e1dfdd",display:"flex",alignItems:"flex-start",gap:12}}>
          <FileIcon type={preview.type} size={40}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#201f1e",marginBottom:2}}>{preview.name}</div>
            <div style={{fontSize:11,color:"#605e5c"}}>{preview.folder} · {preview.size} · v{preview.version} · {preview.modified}</div>
          </div>
          <button onClick={()=>setPreview(null)} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={18}/></button>
        </div>
        <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Description</div>
          <div style={{fontSize:13,color:"#201f1e",marginBottom:18,lineHeight:1.55}}>{preview.description||"No description."}</div>
          <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Preview</div>
          {preview.type==="pdf"?<div style={{display:"flex",flexDirection:"column",gap:6,padding:14,background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4}}>
            {[90,60,80,45,70,50,85,40,60,75].map((w,i)=><div key={i} style={{height:6,width:`${w}%`,background:i===2||i===5?"#e8e6e4":"#c8c6c4",borderRadius:2}}/>)}
          </div>:<div style={{padding:14,background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4,fontSize:12,color:"#605e5c",lineHeight:1.7}}>{preview.description||"Preview not available."}</div>}
          <div style={{display:"flex",gap:8,marginTop:18}}>
            <Btn size="sm"><I as={ArrowDownload20Regular} size={13}/> Download</Btn>
            <Btn size="sm" variant="secondary" onClick={()=>toast("Link copied","",{icon:<I as={Link20Regular} size={16} color="#219CD6"/>})}><I as={Share20Regular} size={13}/> Share Link</Btn>
          </div>
        </div>
      </div>
    </Drawer>}
    {accessRequest&&<Modal title="Request Access" onClose={()=>setAccessRequest(false)} width={380}>
      <div style={{padding:20}}>
        <div style={{fontSize:13,color:"#605e5c",marginBottom:14}}>You don't have permission to view <strong>Brand Guidelines 2026.pdf</strong>. Submit a request to the document owner.</div>
        <Input label="Reason for access" placeholder="e.g. Required for marketing campaign review"/>
        <Select label="Access level needed" options={["View only","Edit","Full access"]}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <Btn variant="secondary" onClick={()=>setAccessRequest(false)}>Cancel</Btn>
          <Btn onClick={()=>{toast("Access requested","Document owner will be notified",{icon:<I as={Send20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});setAccessRequest(false);}}>Submit Request</Btn>
        </div>
      </div>
    </Modal>}
  </div>;
}

// ─── Flow 5: Workflow View ────────────────────────────────────────────────────
function WorkflowView(){
  const {state}=useContext(AppContext);
  const [selectedId,setSelectedId]=useState(null);
  const [showBuilder,setShowBuilder]=useState(false);
  const [showAnnotation,setShowAnnotation]=useState(null);
  const cols=[
    {id:"doc",label:"Document",get:w=>w.doc,minWidth:240,renderCell:w=><div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}><FileIcon type="pdf" size={24}/><span style={{fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{w.doc}</span></div>},
    {id:"step",label:"Step",get:w=>w.step,filterable:true,width:170},
    {id:"assignee",label:"Assignee",get:w=>userById(w.assigneeId).name,filterable:true,width:160,renderCell:w=>{const u=userById(w.assigneeId);return <div style={{display:"flex",alignItems:"center",gap:6}}><Avatar userId={w.assigneeId} size={20}/><span style={{whiteSpace:"nowrap"}}>{u.name}</span></div>;}},
    {id:"priority",label:"Priority",get:w=>w.priority,filterable:true,width:110,renderCell:w=><span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${prioStyle(w.priority).text}55`,color:prioStyle(w.priority).text,whiteSpace:"nowrap"}}>{w.priority}</span>},
    {id:"due",label:"Due",get:w=>w.due,width:110,renderCell:w=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{w.due}</span>},
    {id:"submitted",label:"Submitted",get:w=>w.submitted,width:110,renderCell:w=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{w.submitted}</span>},
    {id:"comments",label:"Comments",get:w=>w.comments.length,width:100,renderCell:w=><span style={{display:"inline-flex",alignItems:"center",gap:5,color:"#605e5c"}}><I as={Chat20Regular} size={12}/>{w.comments.length}</span>},
  ];
  const selected=selectedId?state.workflows.find(w=>w.id===selectedId):null;
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="Approval Workflows" subtitle={`${state.workflows.length} active · ${state.workflows.filter(w=>w.assigneeId==="u4").length} assigned to you`} action={<Btn onClick={()=>setShowBuilder(true)}>+ New Workflow</Btn>} commandView="workflow"/>
    <DataTable rows={state.workflows} columns={cols} getKey={w=>w.id} defaultSort={{col:"due",dir:"asc"}} searchPlaceholder="Search by document, step, or assignee…" searchKeys={["doc","step"]} onRowClick={w=>setSelectedId(w.id)} selectedKey={selectedId} emptyMessage="No workflows match this filter."/>
    {selected&&<Drawer onClose={()=>setSelectedId(null)} width={560}><WorkflowDrawer wf={selected} onClose={()=>setSelectedId(null)} onAnnotate={()=>setShowAnnotation(selected)}/></Drawer>}
    {showBuilder&&<WorkflowBuilder onClose={()=>setShowBuilder(false)}/>}
    {showAnnotation&&<DocumentAnnotation wf={showAnnotation} onClose={()=>setShowAnnotation(null)}/>}
  </div>;
}

function WorkflowDrawer({wf,onClose,onAnnotate}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [commentText,setCommentText]=useState("");
  const [showMention,setShowMention]=useState(false);
  const [busy,setBusy]=useState(null);
  const post=async ()=>{ if(!commentText.trim())return; setBusy("post"); await simulateLatency(1800); dispatch({type:"ADD_COMMENT",wfId:wf.id,text:commentText}); setCommentText(""); toast("Comment added","",{icon:<I as={Chat20Regular} size={16} color="#219CD6"/>}); setBusy(null); };
  const approve=async ()=>{ setBusy("approve"); await simulateLatency(1800); dispatch({type:"APPROVE_WF",id:wf.id,doc:wf.doc}); toast("Approved","Document approved and moved to final state",{icon:<I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>,color:"#107c10"}); setBusy(null); onClose(); };
  const reject=async ()=>{ setBusy("reject"); await simulateLatency(1800); toast("Rejected","Document sent back to creator",{icon:<I as={Dismiss20Regular} size={16} color="#a4262c"/>,color:"#a4262c"}); setBusy(null); onClose(); };
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"16px 20px",borderBottom:"1px solid #e1dfdd",display:"flex",alignItems:"flex-start",gap:12}}>
      <FileIcon type="pdf" size={36}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:"#201f1e",marginBottom:2}}>{wf.doc}</div>
        <div style={{fontSize:11,color:"#605e5c"}}>Step: <strong>{wf.step}</strong> · Submitted {wf.submitted} · Due {wf.due}</div>
        <div style={{display:"flex",gap:6,marginTop:6}}>
          <span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${prioStyle(wf.priority).text}55`,color:prioStyle(wf.priority).text}}>{wf.priority}</span>
        </div>
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={18}/></button>
    </div>
    <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>
      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Reviewers</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:18}}>
        {wf.reviewers.map((r,j)=>{
          const u=userById(r.userId);
          return <div key={j} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4}}>
            <Avatar userId={r.userId} size={24}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>{u.name}</div>
              <div style={{fontSize:10,color:r.status==="approved"?"#107c10":r.status==="rejected"?"#a4262c":"#605e5c",display:"inline-flex",alignItems:"center",gap:3}}>
                {r.status==="approved"?<><I as={Checkmark20Regular} size={11}/> Approved</>:r.status==="rejected"?<><I as={Dismiss20Regular} size={11}/> Rejected</>:<><I as={Timer20Regular} size={11}/> Pending</>}{r.time?" · "+r.time:""}
              </div>
            </div>
          </div>;
        })}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        <Btn variant="success" size="sm" onClick={approve} loading={busy==="approve"}>{busy==="approve"?"Approving…":<><I as={Checkmark20Regular} size={13}/> Approve</>}</Btn>
        <Btn variant="danger" size="sm" onClick={reject} loading={busy==="reject"}>{busy==="reject"?"Rejecting…":<><I as={Dismiss20Regular} size={13}/> Reject</>}</Btn>
        <Btn variant="secondary" size="sm" onClick={()=>toast("Escalated","Reassigned to director",{icon:<I as={ArrowUp20Regular} size={16} color="#c8a116"/>,color:"#c8a116"})}><I as={ArrowUp20Regular} size={13}/> Escalate</Btn>
        <Btn variant="secondary" size="sm" onClick={onAnnotate}><I as={Document20Regular} size={13}/> View Doc</Btn>
      </div>
      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Comments</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}>
        {wf.comments.map(c=>(
          <div key={c.id} style={{display:"flex",gap:8}}>
            <Avatar userId={c.userId} size={24}/>
            <div style={{flex:1,background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4,padding:"8px 10px"}}>
              <div style={{fontSize:11,fontWeight:600,marginBottom:2}}>{userById(c.userId).name} <span style={{fontWeight:400,color:"#a19f9d"}}>· {c.time}</span></div>
              <div style={{fontSize:12,color:"#323130"}}>{c.text}</div>
            </div>
          </div>
        ))}
        {wf.comments.length===0&&<div style={{fontSize:12,color:"#a19f9d",fontStyle:"italic"}}>No comments yet</div>}
      </div>
    </div>
    <div style={{padding:"12px 20px",borderTop:"1px solid #e1dfdd",display:"flex",gap:8,alignItems:"flex-end"}}>
      <div style={{flex:1,position:"relative"}}>
        <textarea value={commentText} onChange={e=>{setCommentText(e.target.value);if(e.target.value.endsWith("@"))setShowMention(true);}} placeholder="Add a comment… (type @ to mention)" rows={2} style={{width:"100%",padding:"8px 10px",border:"1px solid #e1dfdd",borderRadius:4,fontSize:12,resize:"none",fontFamily:"inherit"}}/>
        {showMention&&<div style={{position:"absolute",bottom:"100%",left:0,background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,boxShadow:"0 8px 20px rgba(0,0,0,0.12)",padding:4,zIndex:100,minWidth:180}}>
          {MOCK_USERS.map(u=><div key={u.id} onClick={()=>{setCommentText(commentText.replace("@","@"+u.name+" "));setShowMention(false);}} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",cursor:"pointer",borderRadius:2,fontSize:12}} onMouseEnter={e=>e.currentTarget.style.background="#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Avatar userId={u.id} size={20}/>{u.name}
          </div>)}
        </div>}
      </div>
      <Btn size="sm" onClick={post} loading={busy==="post"}>{busy==="post"?"Posting…":"Post"}</Btn>
    </div>
  </div>;
}

function WorkflowBuilder({onClose}){
  const toast=useToast();
  const [stages,setStages]=useState([{id:1,assigneeId:"u2",sla:48,type:"any"},{id:2,assigneeId:"u4",sla:24,type:"all"}]);
  const addStage=()=>setStages([...stages,{id:Date.now(),assigneeId:"u1",sla:24,type:"any"}]);
  const removeStage=(id)=>setStages(stages.filter(s=>s.id!==id));
  return <Modal title="New Workflow" onClose={onClose} width={560}>
    <div style={{padding:20}}>
      <div style={{fontSize:12,color:"#605e5c",marginBottom:16}}>Build an approval chain. Drag to reorder stages.</div>
      <div style={{display:"flex",flexDirection:"column",gap:0,marginBottom:16}}>
        {stages.map((stage,i)=>(
          <div key={stage.id}>
            <div style={{display:"flex",gap:10,padding:"12px 14px",background:"rgba(33,156,214,0.04)",border:"1px solid rgba(33,156,214,0.15)",borderRadius:8,marginBottom:4}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#219CD6",color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:700}}>{i+1}</div>
              </div>
              <div style={{flex:1,display:"flex",gap:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:140}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>ASSIGNEE</div>
                  <FluentSelect size="sm" value={stage.assigneeId} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,assigneeId:e.target.value}:s))} options={MOCK_USERS.map(u=>({value:u.id,label:u.name}))}/>
                </div>
                <div style={{width:100}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>SLA (HOURS)</div>
                  <input type="number" value={stage.sla} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,sla:e.target.value}:s))} style={{width:"100%",padding:"6px 8px",border:"1px solid #e0dede",borderRadius:5,fontSize:12,background:"#fff"}}/>
                </div>
                <div style={{width:130}}>
                  <div style={{fontSize:10,fontWeight:600,color:"#605e5c",marginBottom:3}}>APPROVAL TYPE</div>
                  <FluentSelect size="sm" value={stage.type} onChange={e=>setStages(stages.map(s=>s.id===stage.id?{...s,type:e.target.value}:s))} options={[{value:"any",label:"Any one approver"},{value:"all",label:"All must approve"}]}/>
                </div>
              </div>
              {stages.length>1&&<button onClick={()=>removeStage(stage.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#a4262c",alignSelf:"center",display:"inline-flex"}}><I as={Dismiss20Regular} size={16}/></button>}
            </div>
            {i<stages.length-1&&<div style={{display:"flex",justifyContent:"center",margin:"2px 0"}}><div style={{width:2,height:16,background:"#219CD6"}}/></div>}
          </div>
        ))}
      </div>
      <button onClick={addStage} style={{width:"100%",padding:"8px",border:"2px dashed #c8c6c4",borderRadius:8,background:"none",cursor:"pointer",fontSize:12,color:"#605e5c",fontFamily:"inherit"}}>+ Add Stage</button>
      {/* Preview diagram */}
      <div style={{marginTop:16,padding:14,background:"#f3f2f1",borderRadius:8}}>
        <div style={{fontSize:10,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Flow Preview</div>
        <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
          <div style={{textAlign:"center",padding:"8px 12px",background:"#219CD6",borderRadius:8,color:"#fff",fontSize:11,fontWeight:600,flexShrink:0}}>Submit</div>
          {stages.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center"}}>
              <div style={{width:24,height:2,background:"#219CD6"}}/>
              <div style={{textAlign:"center",padding:"8px 12px",background:"rgba(33,156,214,0.12)",border:"1px solid #219CD6",borderRadius:8,fontSize:11,flexShrink:0}}>
                <div style={{fontWeight:700,color:"#219CD6"}}>{userById(s.assigneeId).name}</div>
                <div style={{color:"#605e5c",fontSize:10}}>{s.sla}h SLA</div>
              </div>
            </div>
          ))}
          <div style={{width:24,height:2,background:"#107c10"}}/>
          <div style={{padding:"8px 12px",background:"#107c10",borderRadius:8,color:"#fff",fontSize:11,fontWeight:600,flexShrink:0}}>Approved</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={()=>{toast("Workflow created","New approval chain activated",{icon:<I as={Share20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});onClose();}}>Create Workflow</Btn>
      </div>
    </div>
  </Modal>;
}

function DocumentAnnotation({wf,onClose}){
  const [pins,setPins]=useState([{x:30,y:25,text:"Please review clause 4.2"},{x:65,y:60,text:"Signature required here"}]);
  const [addMode,setAddMode]=useState(false);
  const docRef=useRef();
  const handleDocClick=(e)=>{
    if(!addMode)return;
    const r=docRef.current.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width*100).toFixed(1);
    const y=((e.clientY-r.top)/r.height*100).toFixed(1);
    setPins([...pins,{x:parseFloat(x),y:parseFloat(y),text:"New comment"}]);
    setAddMode(false);
  };
  return <Modal title={"Document: "+wf.doc} onClose={onClose} width={640}>
    <div style={{padding:16}}>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <Btn size="sm" variant={addMode?"success":"secondary"} onClick={()=>setAddMode(!addMode)}>{addMode?"Click doc to place pin":<span style={{display:"inline-flex",alignItems:"center",gap:5}}><I as={Pin20Regular} size={13}/> Add Comment Pin</span>}</Btn>
        {addMode&&<span style={{fontSize:12,color:"#c8a116",alignSelf:"center"}}>Click anywhere on the document to place a pin</span>}
      </div>
      <div ref={docRef} onClick={handleDocClick} style={{background:"#fff",border:"1px solid #e0dede",borderRadius:8,padding:24,position:"relative",cursor:addMode?"crosshair":"default",minHeight:300}}>
        {[100,70,90,50,80,60,85,40,75,55,90,65].map((w,i)=><div key={i} style={{height:8,width:`${w}%`,background:i%5===0?"#f0f0f0":"#e8e6e4",borderRadius:100,marginBottom:i%3===0?12:6}}/>)}
        {pins.map((pin,i)=>(
          <div key={i} style={{position:"absolute",left:`${pin.x}%`,top:`${pin.y}%`,transform:"translate(-50%,-100%)",zIndex:10}}>
            <div style={{background:"#c8a116",color:"#fff",borderRadius:"50% 50% 50% 0",width:24,height:24,display:"grid",placeItems:"center",fontSize:11,fontWeight:700,boxShadow:"0 2px 8px rgba(0,0,0,0.2)",cursor:"pointer"}} title={pin.text}>{i+1}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12}}>
        {pins.map((pin,i)=><div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.05)"}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#c8a116",color:"#fff",display:"grid",placeItems:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
          <span style={{fontSize:12,flex:1}}>{pin.text}</span>
          <button onClick={()=>setPins(pins.filter((_,j)=>j!==i))} style={{background:"none",border:"none",cursor:"pointer",color:"#a19f9d",display:"inline-flex"}}><I as={Dismiss20Regular} size={14}/></button>
        </div>)}
      </div>
    </div>
  </Modal>;
}

// ─── Flow 6: Retention View ───────────────────────────────────────────────────
function RetentionView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [selected,setSelected]=useState([]);
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [deleteInput,setDeleteInput]=useState("");
  const [showPolicyModal,setShowPolicyModal]=useState(false);
  const [lifecycle,setLifecycle]=useState(null);
  const toggleSelect=(id)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const handleBulkDelete=()=>{
    if(deleteInput!=="DELETE")return;
    selected.forEach(id=>dispatch({type:"DELETE_DOC",id}));
    toast(`${selected.length} document(s) permanently deleted`,"Deletion stub added to audit log",{icon:<I as={Delete20Regular} size={16} color="#a4262c"/>,color:"#a4262c"});
    setSelected([]); setDeleteConfirm(false); setDeleteInput("");
  };
  const metrics=[{label:"Due for review",val:3,icon:ClipboardTextLtr20Regular,color:"#219CD6"},{label:"Flagged for deletion",val:2,icon:Delete20Regular,color:"#a4262c"},{label:"Archived this year",val:14,icon:Archive20Regular,color:"#c8a116"},{label:"Storage saved",val:"2.4 GB",icon:Save20Regular,color:"#107c10"}];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="Retention & Archiving" subtitle="Manage document lifecycle, policies, and scheduled purges" commandView="retention"/>
    <div style={{padding:24,overflow:"auto",flex:1}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      {metrics.map(m=><div key={m.label} style={{background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,padding:"16px",textAlign:"center",boxShadow:"0 2px 6px rgba(0,0,0,0.05)"}}>
        <div style={{marginBottom:6,color:m.color}}><I as={m.icon} size={28}/></div>
        <div style={{fontSize:26,fontWeight:700,color:m.color,lineHeight:1,marginBottom:4}}>{m.val}</div>
        <div style={{fontSize:11,color:"#605e5c",fontWeight:500}}>{m.label}</div>
      </div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:700}}>Retention Policies</div>
          <Btn size="sm" onClick={()=>setShowPolicyModal(true)}>+ New Policy</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.retentionPolicies.map((p,i)=>(
            <div key={p.id} className="fade-up" style={{animationDelay:`${i*0.06}s`,background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:8,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700}}>{p.name}</span>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:100,background:p.action==="Delete"?"#fde7e9":"#fff4ce",color:p.action==="Delete"?"#a4262c":"#7a5700"}}>{p.action}</span>
              </div>
              <div style={{fontSize:11,color:"#605e5c",marginBottom:4}}>{p.condition}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4}}>{p.docTypes.map(t=><Tag key={t} label={t} color="#605e5c"/>)}</div>
              <div style={{fontSize:10,color:"#a19f9d"}}>Next run: {p.nextRun}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Document Lifecycle</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {state.documents.slice(0,4).map((doc,i)=>(
            <div key={doc.id} onClick={()=>setLifecycle(lifecycle===doc.id?null:doc.id)} className="fade-up" style={{animationDelay:`${i*0.05}s`,background:"rgba(255,255,255,0.85)",border:`1px solid ${lifecycle===doc.id?"#219CD6":"rgba(0,0,0,0.07)"}`,borderRadius:8,padding:"10px 12px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:lifecycle===doc.id?10:0}}>
                <FileIcon type={doc.type} size={24}/><span style={{fontSize:12,fontWeight:600,flex:1}}>{doc.name}</span><span style={{fontSize:10,color:"#a19f9d"}}>{doc.retentionYears}yr retention</span>
              </div>
              {lifecycle===doc.id&&<div style={{overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:0,marginTop:6}}>
                  {[{label:"Created",date:doc.created,color:"#219CD6"},{label:"Modified",date:doc.modified,color:"#219CD6"},{label:"Policy",date:"Mar 2026",color:"#c8a116"},{label:"Archive",date:`${2026+Math.floor(doc.retentionYears/2)}`,color:"#c8a116"},{label:"Purge",date:`${2026+doc.retentionYears}`,color:"#a4262c"}].map((m,j,arr)=>(
                    <div key={m.label} style={{display:"flex",alignItems:"center",flex:j<arr.length-1?1:0}}>
                      <div style={{textAlign:"center",flexShrink:0}}>
                        <div style={{width:10,height:10,borderRadius:"50%",background:m.color,margin:"0 auto 4px"}}/>
                        <div style={{fontSize:9,fontWeight:700,color:m.color,whiteSpace:"nowrap"}}>{m.label}</div>
                        <div style={{fontSize:8,color:"#a19f9d",whiteSpace:"nowrap"}}>{m.date}</div>
                      </div>
                      {j<arr.length-1&&<div style={{flex:1,height:2,background:`linear-gradient(90deg,${m.color},${arr[j+1].color})`}}/>}
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          ))}
        </div>
      </div>
    </div>
    {/* Bulk actions */}
    <div style={{background:"rgba(255,255,255,0.85)",border:"1px solid rgba(0,0,0,0.07)",borderRadius:10,overflow:"hidden"}}>
      <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(0,0,0,0.06)",display:"flex",alignItems:"center",gap:10,background:"#faf9f8"}}>
        <span style={{fontSize:13,fontWeight:700}}>Bulk Actions</span>
        {selected.length>0&&<><Badge count={selected.length}/><span style={{fontSize:12,color:"#605e5c"}}>selected</span>
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <Btn size="sm" variant="secondary" onClick={()=>{selected.forEach(id=>dispatch({type:"UPDATE_DOC",id,patch:{status:"archived"}}));toast(`${selected.length} archived`,"",{icon:<I as={Archive20Regular} size={16} color="#c8a116"/>,color:"#c8a116"});setSelected([]);}}><span style={{display:"inline-flex",alignItems:"center",gap:5}}><I as={Archive20Regular} size={13}/> Archive</span></Btn>
            <Btn size="sm" variant="secondary" onClick={()=>{selected.forEach(id=>dispatch({type:"UPDATE_DOC",id,patch:{retentionYears:(state.documents.find(d=>d.id===id)?.retentionYears||5)+1}}));toast("Retention extended by 1 year","",{icon:<I as={Calendar20Regular} size={16} color="#219CD6"/>});setSelected([]);}}>+1yr Retention</Btn>
            <Btn size="sm" variant="danger" onClick={()=>setDeleteConfirm(true)}><span style={{display:"inline-flex",alignItems:"center",gap:5}}><I as={Delete20Regular} size={13}/> Delete Selected</span></Btn>
          </div>
        </>}
      </div>
      <div>
        {state.documents.map((doc,i)=>{
          const deleted=doc.status==="archived";
          return <div key={doc.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",background:selected.includes(doc.id)?"#deecf9":"transparent",opacity:deleted?0.5:1,transition:"all 0.15s"}}>
            <input type="checkbox" checked={selected.includes(doc.id)} onChange={()=>toggleSelect(doc.id)} style={{accentColor:"#219CD6",width:14,height:14}}/>
            <FileIcon type={doc.type} size={28}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
              <div style={{fontSize:10,color:"#a19f9d"}}>{doc.folder} · {doc.size} · Retention: {doc.retentionYears}yr</div>
            </div>
            <span style={{fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:100,...statusStyle(doc.status)}}>{doc.status}</span>
          </div>;
        })}
        {/* Ghost rows for deleted docs in audit */}
        {state.auditLog.filter(a=>a.deleted).map(a=>(
          <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",borderBottom:"1px solid rgba(0,0,0,0.05)",opacity:0.4}}>
            <input type="checkbox" disabled style={{width:14,height:14}}/>
            <div style={{width:28,height:31,background:"#e0dede",borderRadius:5,display:"grid",placeItems:"center",fontSize:9,color:"#a19f9d"}}>DEL</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#a19f9d",textDecoration:"line-through"}}>{a.doc}</div>
              <div style={{fontSize:10,color:"#c8c6c4"}}>[DELETED] · Purged by {a.user} · {a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    {deleteConfirm&&<Modal title="Confirm Permanent Deletion" onClose={()=>setDeleteConfirm(false)} width={400}>
      <div style={{padding:20}}>
        <div style={{background:"#fde7e9",border:"1px solid #a4262c",borderRadius:8,padding:12,marginBottom:14,fontSize:13,color:"#a4262c",display:"flex",alignItems:"flex-start",gap:8}}><I as={Warning20Regular} size={16} style={{marginTop:1}}/><span>This action is <strong>irreversible</strong>. {selected.length} document(s) will be permanently removed.</span></div>
        <div style={{fontSize:13,marginBottom:10}}>Type <strong>DELETE</strong> to confirm:</div>
        <Input value={deleteInput} onChange={e=>setDeleteInput(e.target.value)} placeholder="Type DELETE here"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setDeleteConfirm(false)}>Cancel</Btn>
          <Btn variant="danger" disabled={deleteInput!=="DELETE"} onClick={handleBulkDelete}>Permanently Delete</Btn>
        </div>
      </div>
    </Modal>}
    {showPolicyModal&&<PolicyBuilder onClose={()=>setShowPolicyModal(false)}/>}
    </div>
  </div>;
}

function PolicyBuilder({onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({name:"",condition:"",action:"Archive",docTypes:[],typeInput:""});
  return <Modal title="New Retention Policy" onClose={onClose} width={440}>
    <div style={{padding:20}}>
      <Input label="Policy Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Financial Records 7yr"/>
      <Input label="Condition" value={form.condition} onChange={e=>setForm({...form,condition:e.target.value})} placeholder="e.g. Age > 7 years AND type = Invoice"/>
      <Select label="Action" value={form.action} onChange={e=>setForm({...form,action:e.target.value})} options={["Archive","Delete"]}/>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Document Types</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>{form.docTypes.map(t=><Tag key={t} label={t} color="#605e5c" onRemove={()=>setForm({...form,docTypes:form.docTypes.filter(x=>x!==t)})}/>)}</div>
        <FluentSelect value="" onChange={e=>{const v=e.target.value;if(v&&!form.docTypes.includes(v))setForm({...form,docTypes:[...form.docTypes,v]});}} placeholder="Add document type…" options={DOC_TYPES.filter(t=>!form.docTypes.includes(t))}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!form.name||!form.condition} onClick={()=>{dispatch({type:"ADD_RETENTION",policy:{id:Date.now(),...form,nextRun:"Apr 1, 2026"}});toast("Policy created","",{icon:<I as={ClipboardTextLtr20Regular} size={16} color="#107c10"/>,color:"#107c10"});onClose();}}>Create Policy</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Audit View ───────────────────────────────────────────────────────────────
function AuditView(){
  const {state}=useContext(AppContext);
  const actionColor={"Uploaded":"#107c10","Viewed":"#219CD6","Edited":"#c8a116","Downloaded":"#005a9e","Shared":"#8764b8","OCR Indexed":"#a19f9d","Workflow Created":"#005a9e","Checked Out":"#c8a116","Checked In":"#107c10","Approved":"#107c10","[DELETED]":"#a4262c","Z83 Inception":"#219CD6","Touchpoint · Leave":"#a4262c","Touchpoint · Training":"#c8a116","Touchpoint · Performance":"#8764b8","Promotion (3FA)":"#107c10"};
  const cols=[
    {id:"user",label:"User",get:e=>e.user,filterable:true,minWidth:180,renderCell:e=><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar userId={e.userId||"system"} size={22}/><span style={{fontWeight:600}}>{e.user}</span></div>},
    {id:"action",label:"Action",get:e=>e.action,filterable:true,width:170,renderCell:e=><span style={{fontSize:11,fontWeight:700,color:actionColor[e.action]||"#323130",whiteSpace:"nowrap"}}>{e.action}</span>},
    {id:"doc",label:"Subject",get:e=>e.doc,minWidth:240,renderCell:e=><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block",color:e.deleted?"#a4262c":"#323130",textDecoration:e.deleted?"line-through":"none"}}>{e.doc}</span>},
    {id:"time",label:"Timestamp",get:e=>e.time,width:160,renderCell:e=><span style={{color:"#605e5c",whiteSpace:"nowrap"}}>{e.time}</span>},
    {id:"ip",label:"IP",get:e=>e.ip,width:110,sortable:false,renderCell:e=><span style={{color:"#a19f9d",fontFamily:"ui-monospace,SFMono-Regular,monospace",fontSize:10}}>{e.ip}</span>},
  ];
  const exportBtns=<><Btn size="sm"><I as={ArrowDownload20Regular} size={13}/> Export CSV</Btn><Btn size="sm" variant="secondary"><I as={ArrowDownload20Regular} size={13}/> Export PDF</Btn></>;
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="Audit Log" subtitle={`Immutable activity record · ${state.auditLog.length} entries · 7yr retention`} action={<div style={{display:"flex",gap:8}}>{exportBtns}</div>} commandView="audit"/>
    <DataTable rows={state.auditLog} columns={cols} getKey={e=>e.id} defaultSort={{col:"time",dir:"desc"}} searchPlaceholder="Search by user, action, or document…" searchKeys={["user","action","doc"]} emptyMessage="No audit entries match this filter."/>
  </div>;
}

// ─── Documents View ───────────────────────────────────────────────────────────
function StorageSummary({docs,rehydrations}){
  const counts={hot:0,cold:0,archive:0};
  const bytes={hot:0,cold:0,archive:0};
  docs.forEach(d=>{const t=d.tier||"hot";counts[t]++;bytes[t]+=d.sizeBytes;});
  const totalBytes=bytes.hot+bytes.cold+bytes.archive;
  const monthlyCost=Object.entries(bytes).reduce((s,[t,b])=>s+(b/(1024*1024*1024))*TIER_META[t].storagePerGBmo,0);
  const hotEquivCost=(totalBytes/(1024*1024*1024))*TIER_META.hot.storagePerGBmo;
  const saving=hotEquivCost-monthlyCost;
  const fmtSize=(b)=>b<1024*1024?`${(b/1024).toFixed(0)} KB`:b<1024*1024*1024?`${(b/(1024*1024)).toFixed(1)} MB`:`${(b/(1024*1024*1024)).toFixed(2)} GB`;
  const cards=[
    {tier:"hot",label:"Hot tier",sub:"Frequent access · reads free"},
    {tier:"cold",label:"Cold tier",sub:"Lifecycle-tiered · small read fee"},
    {tier:"archive",label:"Archive tier",sub:"Long-term · multi-hour rehydrate"},
  ];
  return <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,padding:"12px 20px 0 20px"}}>
    {cards.map(c=>{
      const t=TIER_META[c.tier];
      return <div key={c.tier} style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"10px 12px"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <span style={{display:"inline-flex",color:t.color}}><I as={t.icon} size={14}/></span>
          <span style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.4px"}}>{c.label}</span>
        </div>
        <div style={{fontSize:18,fontWeight:700,color:"#201f1e",lineHeight:1.1}}>{counts[c.tier]} <span style={{fontSize:11,color:"#a19f9d",fontWeight:500}}>· {fmtSize(bytes[c.tier])}</span></div>
        <div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{c.sub}</div>
      </div>;
    })}
    <div style={{background:"linear-gradient(135deg,#deecf9 0%,#f0f6fb 100%)",border:"1px solid rgba(33,156,214,0.2)",borderRadius:4,padding:"10px 12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
        <span style={{display:"inline-flex",color:"#219CD6"}}><I as={Money20Regular} size={14}/></span>
        <span style={{fontSize:11,fontWeight:600,color:"#219CD6",textTransform:"uppercase",letterSpacing:"0.4px"}}>Est. monthly</span>
      </div>
      <div style={{fontSize:18,fontWeight:700,color:"#219CD6",lineHeight:1.1}}>{formatZAR(monthlyCost)}</div>
      <div style={{fontSize:10,color:"#605e5c",marginTop:2}}>Saving {formatZAR(saving)}/mo vs all-Hot · {rehydrations.length} active rehydration{rehydrations.length!==1?"s":""}</div>
    </div>
  </div>;
}
function DocsView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [folder,setFolder]=useState("All Files");
  const [selected,setSelected]=useState(null);
  const [showUpload,setShowUpload]=useState(false);
  const [ctxMenu,setCtxMenu]=useState(null);
  const [modal,setModal]=useState(null);
  const [rehydrateDoc,setRehydrateDoc]=useState(null);
  const filtered=state.documents.filter(d=>folder==="All Files"||d.folder===folder);
  const isRehydrating=(docId)=>state.rehydrations.some(r=>r.docId===docId);
  const selectedDoc=state.documents.find(d=>d.id===selected);
  const handleCtx=(e,doc)=>{ e.preventDefault(); setCtxMenu({x:e.clientX,y:e.clientY,doc}); };
  const ctxItems=(doc)=>[
    {icon:<I as={Edit20Regular} size={14}/>,label:"Edit Metadata",action:()=>setModal({type:"meta",doc})},
    {icon:<I as={LockClosed20Regular} size={14}/>,label:"Set Permissions",action:()=>setModal({type:"rbac",doc})},
    {icon:<I as={History20Regular} size={14}/>,label:"Version History",action:()=>setModal({type:"version",doc})},
    {icon:<I as={Folder20Regular} size={14}/>,label:"Move to Folder",action:()=>{const f=FOLDERS.find(x=>x!==doc.folder)||FOLDERS[0];dispatch({type:"UPDATE_DOC",id:doc.id,patch:{folder:f}});toast("Moved to "+f,"",{icon:<I as={Folder20Regular} size={16} color="#219CD6"/>});}},
    {icon:<I as={Key20Regular} size={14}/>,label:"Generate Unique ID",action:()=>{navigator.clipboard?.writeText?.(`DMS-${Date.now()}`);toast("ID copied to clipboard","",{icon:<I as={Key20Regular} size={16} color="#219CD6"/>});}},
    {divider:true},
    {icon:<I as={Delete20Regular} size={14}/>,label:"Delete",danger:true,action:()=>{dispatch({type:"DELETE_DOC",id:doc.id});toast("Document deleted","Deletion stub in audit log",{icon:<I as={Delete20Regular} size={16} color="#a4262c"/>,color:"#a4262c"});if(selected===doc.id)setSelected(null);}},
  ];
  const cols=[
    {id:"name",label:"Name",get:d=>d.name,minWidth:280,renderCell:d=><div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}><FileIcon type={d.type} size={24}/><div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:"#201f1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>{d.name}{d.starred&&<I as={Star20Filled} size={11} color="#c8a116"/>}{d.checkedOut&&<I as={LockClosed20Regular} size={11} color="#c8a116"/>}{d.isNew&&<span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:2,background:"#219CD6",color:"#fff"}}>NEW</span>}</div><div style={{fontSize:10,color:"#a19f9d",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.tags.slice(0,3).map(t=>"#"+t).join(" ")}</div></div></div>},
    {id:"folder",label:"Folder",get:d=>d.folder,filterable:true,width:130,renderCell:d=><span style={{display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}><I as={Folder20Regular} size={12} color="#605e5c"/>{d.folder}</span>},
    {id:"type",label:"Type",get:d=>d.type,filterable:true,width:80,renderCell:d=><span style={{textTransform:"uppercase",fontSize:10,fontWeight:600,color:"#605e5c",letterSpacing:"0.3px"}}>{d.type}</span>},
    {id:"owner",label:"Owner",get:d=>d.owner,filterable:true,width:160,renderCell:d=><div style={{display:"flex",alignItems:"center",gap:6}}><Avatar userId={d.ownerId} size={20}/><span style={{whiteSpace:"nowrap"}}>{d.owner}</span></div>},
    {id:"size",label:"Size",get:d=>d.sizeBytes,width:90,renderCell:d=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{d.size}</span>},
    {id:"tier",label:"Tier",get:d=>d.tier||"hot",filterable:true,width:120,renderCell:d=>isRehydrating(d.id)?<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:"1px solid #c8a11655",color:"#7a5700",background:"#fff4ce",whiteSpace:"nowrap"}}><I as={Hourglass20Regular} size={11}/>Rehydrating</span>:<TierBadge tier={d.tier||"hot"} size="sm"/>},
    {id:"status",label:"Status",get:d=>d.status,filterable:true,width:108,renderCell:d=><span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${statusStyle(d.status).text}55`,color:statusStyle(d.status).text,whiteSpace:"nowrap"}}>{d.status}</span>},
    {id:"modified",label:"Modified",get:d=>d.modified,width:140,renderCell:d=><span style={{whiteSpace:"nowrap",color:"#605e5c"}}>{d.modified}</span>},
  ];
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="Documents" subtitle={`${filtered.length} document${filtered.length!==1?"s":""} in ${folder} · Azure Blob Storage (SA North)`} action={<Btn onClick={()=>setShowUpload(true)}>+ Upload</Btn>} commandView="docs"/>
    <StorageSummary docs={state.documents} rehydrations={state.rehydrations}/>
    <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0,marginTop:12}}>
      <div style={{width:170,borderRight:"1px solid #e1dfdd",padding:"12px 8px",background:"#fff",flexShrink:0,overflow:"auto"}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:"#a19f9d",padding:"4px 8px",marginBottom:4}}>Folders</div>
        {["All Files",...FOLDERS].map(f=>(
          <div key={f} onClick={()=>{setFolder(f);setSelected(null);}} style={{padding:"6px 8px",borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:folder===f?600:400,color:folder===f?"#219CD6":"#323130",background:folder===f?"#deecf9":"transparent",marginBottom:1,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>{if(folder!==f)e.currentTarget.style.background="#f3f2f1";}} onMouseLeave={e=>{if(folder!==f)e.currentTarget.style.background="transparent";}}>
            <I as={f==="All Files"?FolderOpen20Regular:Folder20Regular} size={12}/>{f}
          </div>
        ))}
      </div>
      <DataTable rows={filtered} columns={cols} getKey={d=>d.id} defaultSort={{col:"modified",dir:"desc"}} searchPlaceholder="Search documents, tags, owner…" searchKeys={["name","folder","owner","status","type"]} onRowClick={d=>setSelected(d.id)} selectedKey={selected} emptyMessage={`No documents in ${folder}.`}/>
    </div>
    {selectedDoc&&<Drawer onClose={()=>setSelected(null)} width={520}><DocumentDetailDrawer doc={selectedDoc} onClose={()=>setSelected(null)} onCtxAction={(action)=>{const items=ctxItems(selectedDoc);const it=items.find(x=>x.label===action);if(it)it.action();}} onVersionOpen={()=>setModal({type:"version",doc:selectedDoc})} onRehydrate={()=>setRehydrateDoc(selectedDoc)} isRehydrating={isRehydrating(selectedDoc.id)}/></Drawer>}
    {rehydrateDoc&&<RehydrationModal doc={rehydrateDoc} onClose={()=>setRehydrateDoc(null)}/>}
    {ctxMenu&&<ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems(ctxMenu.doc)} onClose={()=>setCtxMenu(null)}/>}
    {showUpload&&<UploadWizard onClose={()=>setShowUpload(false)}/>}
    {modal?.type==="meta"&&<MetadataEditor doc={modal.doc} onClose={()=>setModal(null)}/>}
    {modal?.type==="rbac"&&<RBACPanel doc={modal.doc} onClose={()=>setModal(null)}/>}
    {modal?.type==="version"&&<VersionPanel doc={modal.doc} onClose={()=>setModal(null)}/>}
  </div>;
}

function DocumentDetailDrawer({doc,onClose,onCtxAction,onVersionOpen,onRehydrate,isRehydrating}){
  const toast=useToast();
  const versions=VERSION_HISTORY[doc.id]||[{v:doc.version,user:"You",userId:"u4",date:"Today",note:"Current version",delta:doc.size}];
  const tier=doc.tier||"hot";
  const needsRehydrate=tier!=="hot"&&!isRehydrating;
  const handleDownload=()=>{
    if(needsRehydrate) onRehydrate&&onRehydrate();
    else if(isRehydrating) toast("Rehydration in progress","Document will be available once it returns to Hot tier",{icon:<I as={Hourglass20Regular} size={16} color="#c8a116"/>,color:"#c8a116"});
    else toast("Downloaded","",{icon:<I as={ArrowDownload20Regular} size={16} color="#219CD6"/>});
  };
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"16px 20px",borderBottom:"1px solid #e1dfdd",display:"flex",alignItems:"flex-start",gap:12}}>
      <FileIcon type={doc.type} size={44}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:"#201f1e",marginBottom:2}}>{doc.name}</div>
        <div style={{fontSize:11,color:"#605e5c"}}>{doc.size} · v{doc.version} · {doc.folder}</div>
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${statusStyle(doc.status).text}55`,color:statusStyle(doc.status).text}}>{doc.status}</span>
          <TierBadge tier={tier} size="sm"/>
          {doc.tags.map(t=><Tag key={t} label={t}/>)}
        </div>
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",display:"inline-flex"}}><I as={Dismiss20Regular} size={18}/></button>
    </div>
    <div style={{flex:1,overflow:"auto",padding:"16px 20px"}}>
      {isRehydrating&&<div style={{padding:"10px 14px",background:"#fff4ce",border:"1px solid #f0c000",borderRadius:4,marginBottom:14,fontSize:12,color:"#7a5700",display:"flex",alignItems:"flex-start",gap:8}}>
        <I as={Hourglass20Regular} size={16}/>
        <span><strong>Rehydration in progress.</strong> Document is being moved from {TIER_META[tier].label} back to Hot tier. You'll be notified once it's available.</span>
      </div>}
      {needsRehydrate&&<div style={{padding:"10px 14px",background:"#deecf9",border:"1px solid rgba(33,156,214,0.25)",borderRadius:4,marginBottom:14,fontSize:12,color:"#0f4d6b",display:"flex",alignItems:"flex-start",gap:8}}>
        <I as={TIER_META[tier].icon} size={16} color="#219CD6"/>
        <span>This document is in <strong>{TIER_META[tier].label}</strong> storage. Retrieving it incurs a small Azure fee {tier==="archive"?"and takes several hours to rehydrate":"and takes a few seconds"}. Estimated cost: <strong>{formatZAR(rehydrationCost(doc,"standard"))}</strong> standard / <strong>{formatZAR(rehydrationCost(doc,"high"))}</strong> high priority.</span>
      </div>}
      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Description</div>
      <div style={{fontSize:13,color:"#201f1e",marginBottom:18,lineHeight:1.55}}>{doc.description||"No description."}</div>
      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Properties</div>
      <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,marginBottom:18}}>
        {[["Owner",doc.owner],["Modified",doc.modified],["Created",doc.created],["Version",`v${doc.version}`],["Retention",`${doc.retentionYears} years`],["Storage tier",TIER_META[tier].label],["Tiered at",doc.tieredAt||"—"],["Status",doc.status]].map(([k,v],i,a)=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderBottom:i<a.length-1?"1px solid #f3f2f1":"none",fontSize:12}}>
            <span style={{color:"#605e5c"}}>{k}</span><span style={{fontWeight:600,color:"#201f1e"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Recent Versions</div>
      <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,marginBottom:18}}>
        {versions.slice(0,4).map((v,i,a)=>(
          <div key={v.v} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:i<a.length-1?"1px solid #f3f2f1":"none"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:i===0?"#219CD6":"#f3f2f1",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,color:i===0?"#fff":"#605e5c",flexShrink:0}}>v{v.v}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.user} · <span style={{fontWeight:400,color:"#605e5c"}}>{v.note}</span></div>
              <div style={{fontSize:10,color:"#a19f9d"}}>{v.date} · {v.delta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{padding:"12px 20px",borderTop:"1px solid #e1dfdd",display:"flex",gap:8,flexWrap:"wrap"}}>
      <Btn size="sm" onClick={handleDownload} disabled={isRehydrating}>{needsRehydrate?<><I as={CloudSync20Regular} size={13}/> Retrieve · {formatZAR(rehydrationCost(doc,"standard"))}</>:isRehydrating?<><I as={Hourglass20Regular} size={13}/> Rehydrating…</>:<><I as={ArrowDownload20Regular} size={13}/> Download</>}</Btn>
      <Btn size="sm" variant="secondary" onClick={onVersionOpen}><I as={History20Regular} size={13}/> Versions</Btn>
      <Btn size="sm" variant="secondary" onClick={()=>onCtxAction("Edit Metadata")}><I as={Edit20Regular} size={13}/> Edit</Btn>
      <Btn size="sm" variant="secondary" onClick={()=>onCtxAction("Set Permissions")}><I as={LockClosed20Regular} size={13}/> Permissions</Btn>
      <Btn size="sm" variant="secondary" onClick={()=>toast("Link copied","",{icon:<I as={Link20Regular} size={16} color="#219CD6"/>})}><I as={Share20Regular} size={13}/> Share</Btn>
    </div>
  </div>;
}

// ─── Command Palette ──────────────────────────────────────────────────────────
function CommandPalette({onClose,setActive}){
  const {state}=useContext(AppContext);
  const [q,setQ]=useState("");
  const ref=useRef();
  useEffect(()=>ref.current?.focus(),[]);
  const allItems=[
    ...state.documents.slice(0,8).map(d=>({label:d.name,type:"doc",icon:<I as={Document20Regular} size={16}/>,action:()=>{setActive("docs");}})),
    {label:"Upload Document",type:"action",icon:<I as={ArrowUp20Regular} size={16}/>,action:()=>setActive("docs")},
    {label:"Search Documents",type:"action",icon:<I as={Search20Regular} size={16}/>,action:()=>setActive("search")},
    {label:"View Workflows",type:"action",icon:<I as={Share20Regular} size={16}/>,action:()=>setActive("workflow")},
    {label:"Audit Log",type:"action",icon:<I as={Checkmark20Regular} size={16}/>,action:()=>setActive("audit")},
    {label:"Retention Settings",type:"action",icon:<I as={Archive20Regular} size={16}/>,action:()=>setActive("retention")},
  ];
  const results=q?allItems.filter(i=>i.label.toLowerCase().includes(q.toLowerCase())):allItems;
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",backdropFilter:"blur(6px)",display:"flex",justifyContent:"center",paddingTop:"18vh",zIndex:8000}} onClick={onClose}>
    <div className="scale-in" onClick={e=>e.stopPropagation()} style={{width:520,maxWidth:"92vw",background:"rgba(255,255,255,0.97)",borderRadius:14,boxShadow:"0 40px 80px rgba(0,0,0,0.25)",overflow:"hidden",height:"fit-content"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
        <SearchIco size={16} color="#219CD6"/>
        <input ref={ref} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search documents, actions, navigation…" style={{border:"none",background:"none",fontSize:15,color:"#201f1e",flex:1}}/>
        <kbd style={{fontSize:11,background:"#f3f2f1",border:"1px solid #e0dede",borderRadius:4,padding:"2px 6px",color:"#605e5c"}}>ESC</kbd>
      </div>
      <div style={{maxHeight:360,overflow:"auto",padding:6}}>
        {results.length===0&&<div style={{padding:24,textAlign:"center",color:"#a19f9d",fontSize:13}}>No results</div>}
        {results.map((item,i)=>(
          <div key={i} onClick={()=>{item.action();onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#deecf9"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{width:24,display:"inline-flex",justifyContent:"center",color:"#605e5c"}}>{item.icon}</span>
            <span style={{fontSize:13,flex:1}}>{item.label}</span>
            <span style={{fontSize:10,color:"#a19f9d",background:"#f3f2f1",borderRadius:4,padding:"1px 6px"}}>{item.type}</span>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

// ─── Notification Centre ──────────────────────────────────────────────────────
function NotifDropdown({onClose}){
  const {state,dispatch}=useContext(AppContext);
  const ref=useRef();
  useEffect(()=>{ const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h); },[]);
  return <div ref={ref} className="scale-in" style={{position:"absolute",right:0,top:"calc(100% + 6px)",width:320,background:"rgba(255,255,255,0.97)",border:"1px solid rgba(0,0,0,0.1)",borderRadius:10,boxShadow:"0 16px 40px rgba(0,0,0,0.15)",zIndex:3000,overflow:"hidden"}}>
    <div style={{padding:"10px 14px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,fontWeight:700}}>Notifications</span>
      <span style={{fontSize:11,color:"#219CD6",cursor:"pointer"}} onClick={()=>state.notifications.forEach(n=>dispatch({type:"MARK_NOTIF_READ",id:n.id}))}>Mark all read</span>
    </div>
    {state.notifications.map(n=>(
      <div key={n.id} onClick={()=>dispatch({type:"MARK_NOTIF_READ",id:n.id})} style={{display:"flex",gap:10,padding:"10px 14px",borderBottom:"1px solid rgba(0,0,0,0.05)",background:n.read?"transparent":"rgba(33,156,214,0.04)",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="#deecf9"} onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":"rgba(33,156,214,0.04)"}>
        <span style={{display:"inline-flex",color:"#219CD6"}}>{n.type==="approval"?<I as={Share20Regular} size={18}/>:n.type==="comment"?<I as={Chat20Regular} size={18}/>:<I as={Settings20Regular} size={18}/>}</span>
        <div><div style={{fontSize:12,fontWeight:n.read?400:600,color:"#323130"}}>{n.text}</div><div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{n.time}</div></div>
        {!n.read&&<div style={{width:7,height:7,borderRadius:"50%",background:"#219CD6",flexShrink:0,marginTop:4,marginLeft:"auto"}}/>}
      </div>
    ))}
    {state.notifications.length===0&&<div style={{padding:24,textAlign:"center",color:"#a19f9d",fontSize:13}}>All clear</div>}
  </div>;
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({onClose}){
  const {state}=useContext(AppContext);
  return <div className="slide-left" style={{width:280,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(30px)",borderLeft:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",position:"fixed",right:0,top:0,bottom:0,zIndex:2000,boxShadow:"-8px 0 24px rgba(0,0,0,0.1)"}}>
    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(0,0,0,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:13,fontWeight:700}}>Activity Feed</span>
      <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={16}/></button>
    </div>
    <div style={{flex:1,overflow:"auto",padding:12}}>
      {state.activityFeed.map((a,i)=>(
        <div key={a.id} className="fade-up" style={{animationDelay:`${i*0.04}s`,display:"flex",gap:8,marginBottom:12}}>
          <Avatar userId={a.userId||"u1"} size={26}/>
          <div><div style={{fontSize:12}}><strong>{a.user}</strong> {a.action} <span style={{color:"#219CD6"}}>{a.target}</span></div><div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{a.time}</div></div>
        </div>
      ))}
    </div>
  </div>;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const ic=(w=16)=>({width:w,height:w,display:"block"});
function SearchIco({size=16,color="currentColor"}){return <svg style={{...ic(size),flexShrink:0}} fill="none" stroke={color} strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;}
function DocIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;}
function WfIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;}
function AuditIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;}
function RetentionIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="1,4 1,10 7,10"/><path d="M3.51 15a9 9 0 1 0 .49-3.84"/></svg>;}
function RegistryIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;}
function IngestIco(){return <svg style={ic()} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>;}

// ─── Drawer (Fluent 2 slide-over) ─────────────────────────────────────────────
function Drawer({onClose,width=620,children}){
  useEffect(()=>{
    const h=(e)=>{if(e.key==="Escape")onClose();};
    document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);
  },[onClose]);
  return <div style={{position:"fixed",inset:0,zIndex:4500}}>
    <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.32)",backdropFilter:"blur(2px)"}}/>
    <div className="slide-left" style={{position:"absolute",right:0,top:0,bottom:0,width,maxWidth:"95vw",background:"#fff",boxShadow:"-12px 0 32px rgba(0,0,0,0.18)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {children}
    </div>
  </div>;
}

// ─── Column Filter Popover ────────────────────────────────────────────────────
function ColumnFilterPopover({options,selected,onToggle,onClose,onClear}){
  const ref=useRef();
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))onClose();};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[onClose]);
  return <div ref={ref} className="scale-in" style={{position:"absolute",top:"calc(100% + 4px)",left:0,minWidth:180,background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,boxShadow:"0 8px 24px rgba(0,0,0,0.15)",zIndex:50,padding:6,maxHeight:280,overflow:"auto"}}>
    {options.length===0&&<div style={{padding:"8px 10px",fontSize:11,color:"#a19f9d"}}>No values</div>}
    {options.map(v=>(
      <label key={String(v)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",cursor:"pointer",fontSize:12,color:"#201f1e",borderRadius:2}} onMouseEnter={e=>e.currentTarget.style.background="#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <input type="checkbox" checked={selected.has(v)} onChange={()=>onToggle(v)} style={{margin:0,cursor:"pointer"}}/>
        <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{String(v)}</span>
      </label>
    ))}
    {selected.size>0&&<div style={{padding:"4px 6px",borderTop:"1px solid #e1dfdd",marginTop:4}}><button onClick={onClear} style={{background:"none",border:"none",color:"#219CD6",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:"2px 4px"}}>Clear</button></div>}
  </div>;
}

// ─── ViewHeader (Fluent 2 page header) ────────────────────────────────────────
function ViewHeader({title,subtitle,action,commandView,canBack,onBack}){
  return <Fragment>
    <div style={{padding:"14px 20px",borderBottom:"1px solid #e1dfdd",background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:18,fontWeight:700,color:"#201f1e"}}>{title}</div>
        {subtitle&&<div style={{fontSize:12,color:"#605e5c",marginTop:1}}>{subtitle}</div>}
      </div>
      {action}
    </div>
    {commandView&&<CommandBar active={commandView} canBack={!!canBack} onBack={onBack}/>}
  </Fragment>;
}

// ─── DataTable (Fluent 2: search + sort + col filters + pagination + sticky) ──
function DataTable({rows,columns,getKey,searchPlaceholder="Search…",searchKeys,defaultSort,defaultPageSize=10,pageSizeOptions=[10,25,50],onRowClick,selectedKey,emptyMessage="No records.",toolbarRight}){
  const [query,setQuery]=useState("");
  const [sort,setSort]=useState(defaultSort||{col:columns[0].id,dir:"asc"});
  const [filters,setFilters]=useState({});
  const [filterOpen,setFilterOpen]=useState(null);
  const [page,setPage]=useState(1);
  const [pageSize,setPageSize]=useState(defaultPageSize);
  const initialLoading=useSimulatedLoad([],1500);
  const filterLoading=useSimulatedLoad([query,JSON.stringify(filters),sort.col,sort.dir,page,pageSize],760);
  const showShimmer=initialLoading||filterLoading;

  const filterOptions=(col)=>Array.from(new Set(rows.map(col.get))).sort((a,b)=>typeof a==="number"&&typeof b==="number"?a-b:String(a).localeCompare(String(b)));

  let filtered=rows;
  if(query){
    const q=query.toLowerCase();
    if(searchKeys){
      filtered=filtered.filter(r=>searchKeys.some(k=>{
        const col=columns.find(c=>c.id===k);
        const v=col?col.get(r):r[k];
        return v!=null&&String(v).toLowerCase().includes(q);
      }));
    } else {
      filtered=filtered.filter(r=>columns.some(c=>String(c.get(r)).toLowerCase().includes(q)));
    }
  }
  Object.entries(filters).forEach(([colId,vals])=>{
    if(vals&&vals.size>0){const col=columns.find(c=>c.id===colId);if(col)filtered=filtered.filter(r=>vals.has(col.get(r)));}
  });
  const sortCol=columns.find(c=>c.id===sort.col);
  if(sortCol&&sortCol.sortable!==false){
    filtered=[...filtered].sort((a,b)=>{
      const av=sortCol.get(a),bv=sortCol.get(b);
      const cmp=typeof av==="number"&&typeof bv==="number"?av-bv:String(av).localeCompare(String(bv));
      return sort.dir==="asc"?cmp:-cmp;
    });
  }
  const total=filtered.length;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  const cur=Math.min(page,totalPages);
  const paged=filtered.slice((cur-1)*pageSize,cur*pageSize);

  const toggleSort=(col)=>{if(col.sortable===false)return;if(sort.col===col.id)setSort({col:col.id,dir:sort.dir==="asc"?"desc":"asc"});else setSort({col:col.id,dir:"asc"});};
  const toggleFilterValue=(colId,v)=>setFilters(f=>{const c=new Set(f[colId]||[]);if(c.has(v))c.delete(v);else c.add(v);return{...f,[colId]:c};});
  const clearAll=()=>{setFilters({});setQuery("");setPage(1);};
  const hasFilters=query||Object.values(filters).some(v=>v&&v.size>0);

  return <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,overflow:"hidden",background:"#faf9f8"}}>
    <div style={{padding:"10px 20px",borderBottom:"1px solid #e1dfdd",background:"#fff",flexShrink:0,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
      <div style={{flex:"1 1 280px",maxWidth:420,position:"relative"}}>
        <input value={query} onChange={e=>{setQuery(e.target.value);setPage(1);}} placeholder={searchPlaceholder} style={{width:"100%",padding:"6px 10px 6px 32px",border:"1px solid #e1dfdd",borderRadius:4,fontSize:13,background:"#fff"}}/>
        <div style={{position:"absolute",left:10,top:7,color:"#605e5c",display:"inline-flex"}}><I as={Search20Regular} size={14}/></div>
      </div>
      {hasFilters&&<Btn variant="ghost" size="sm" onClick={clearAll}>Clear filters</Btn>}
      <span style={{marginLeft:"auto",fontSize:12,color:"#605e5c",whiteSpace:"nowrap"}}>{total} of {rows.length} records</span>
      {toolbarRight}
    </div>
    <div style={{flex:1,overflow:"auto",background:"#fff",minHeight:0}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr>
            {columns.map(c=>{
              const isSort=sort.col===c.id;
              const hasFilter=filters[c.id]&&filters[c.id].size>0;
              const sortable=c.sortable!==false;
              return <th key={c.id} style={{textAlign:c.align||"left",padding:"10px 12px",fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e1dfdd",background:"#faf9f8",position:"sticky",top:0,zIndex:2,whiteSpace:"nowrap",width:c.width,minWidth:c.minWidth}}>
                <div style={{display:"flex",alignItems:"center",gap:4,position:"relative",justifyContent:c.align==="right"?"flex-end":"flex-start"}}>
                  {sortable?<span onClick={()=>toggleSort(c)} style={{cursor:"pointer",display:"inline-flex",alignItems:"center",gap:4,userSelect:"none"}}>
                    {c.label}
                    {isSort?<span style={{color:"#219CD6",display:"inline-flex"}}><I as={sort.dir==="asc"?ArrowSortUp20Regular:ArrowSortDown20Regular} size={12}/></span>:<span style={{opacity:0.3,display:"inline-flex"}}><I as={ArrowSortDown20Regular} size={12}/></span>}
                  </span>:<span>{c.label}</span>}
                  {c.filterable&&<button onClick={()=>setFilterOpen(filterOpen===c.id?null:c.id)} style={{background:"none",border:"none",cursor:"pointer",padding:2,marginLeft:2,color:hasFilter?"#219CD6":"#a19f9d",display:"inline-flex",alignItems:"center",borderRadius:2}}><I as={hasFilter?Filter20Filled:Filter20Regular} size={12}/></button>}
                  {filterOpen===c.id&&c.filterable&&<ColumnFilterPopover options={filterOptions(c)} selected={filters[c.id]||new Set()} onToggle={v=>{toggleFilterValue(c.id,v);setPage(1);}} onClose={()=>setFilterOpen(null)} onClear={()=>{setFilters(f=>({...f,[c.id]:new Set()}));setPage(1);}}/>}
                </div>
              </th>;
            })}
          </tr>
        </thead>
        <tbody>
          {showShimmer ? Array.from({length:Math.min(pageSize,Math.max(paged.length||5,5))}).map((_,i)=>(
            <tr key={"sk"+i} style={{background:i%2===0?"#fff":"#fafaf9"}}>
              {columns.map((c,ci)=>(
                <td key={c.id} style={{padding:"8px 12px",borderBottom:"1px solid #f3f2f1",verticalAlign:"middle"}}>
                  <Skeleton w={ci===0?"75%":["55%","40%","60%","45%","50%"][ci%5]} h={12}/>
                </td>
              ))}
            </tr>
          )) : paged.map((r,i)=>{
            const k=getKey(r);
            const sel=selectedKey===k;
            return <tr key={k} onClick={()=>onRowClick&&onRowClick(r)} className="fade-up" style={{cursor:onRowClick?"pointer":"default",animationDelay:`${i*0.02}s`,background:sel?"#deecf9":i%2===0?"#fff":"#fafaf9",transition:"background 0.1s"}} onMouseEnter={ev=>{if(!sel&&onRowClick)ev.currentTarget.style.background="#f3f2f1";}} onMouseLeave={ev=>{if(!sel)ev.currentTarget.style.background=i%2===0?"#fff":"#fafaf9";}}>
              {columns.map(c=>(
                <td key={c.id} style={{padding:"8px 12px",borderBottom:"1px solid #f3f2f1",verticalAlign:"middle",textAlign:c.align||"left"}}>
                  {c.renderCell?c.renderCell(r):c.get(r)}
                </td>
              ))}
            </tr>;
          })}
          {!showShimmer&&paged.length===0&&<tr><td colSpan={columns.length} style={{padding:48,textAlign:"center",color:"#a19f9d",fontSize:13}}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px",borderTop:"1px solid #e1dfdd",background:"#fff",flexShrink:0,fontSize:12,color:"#605e5c",gap:12,flexWrap:"wrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span>Rows per page:</span>
        <FluentSelect size="sm" direction="up" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}} options={pageSizeOptions} style={{minWidth:64}}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{whiteSpace:"nowrap"}}>Page {cur} of {totalPages} · {total} records</span>
        <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={cur<=1} style={{padding:"4px 8px",border:"1px solid #e1dfdd",borderRadius:4,background:cur<=1?"#f3f2f1":"#fff",cursor:cur<=1?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",color:cur<=1?"#a19f9d":"#201f1e"}}><I as={ChevronLeft20Regular} size={14}/></button>
        <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={cur>=totalPages} style={{padding:"4px 8px",border:"1px solid #e1dfdd",borderRadius:4,background:cur>=totalPages?"#f3f2f1":"#fff",cursor:cur>=totalPages?"not-allowed":"pointer",display:"inline-flex",alignItems:"center",color:cur>=totalPages?"#a19f9d":"#201f1e"}}><I as={ChevronRight20Regular} size={14}/></button>
      </div>
    </div>
  </div>;
}

// ─── Registry: Helpers ────────────────────────────────────────────────────────
const employeeById = (state,id) => state.employees.find(e=>e.id===id);
const employeeInitials = (e) => `${(e.firstName||"?")[0]}${(e.lastName||"?")[0]}`.toUpperCase();
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-ZA",{year:"numeric",month:"short",day:"numeric"}); } catch { return iso; } };
const touchpointAccent = (t) => ({Inception:"#219CD6",Promotion:"#107c10",Performance:"#8764b8",Training:"#c8a116",Leave:"#a4262c"})[t]||"#605e5c";
const touchpointIcon = (t) => ({Inception:Flag20Regular,Promotion:ArrowUp20Regular,Performance:Star20Filled,Training:Edit20Regular,Leave:Timer20Regular})[t]||Document20Regular;

// ─── Registry View ─────────────────────────────────────────────────────────────
function RegistryView(){
  const {state}=useContext(AppContext);
  const [selectedId,setSelectedId]=useState(null);
  const [showZ83,setShowZ83]=useState(false);
  const cols=[
    {id:"persalNo",label:"PERSAL",get:e=>e.persalNo,width:96},
    {id:"lastName",label:"Name",get:e=>e.lastName,minWidth:200,renderCell:(e)=>(
      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
        <div style={{width:28,height:28,borderRadius:"50%",background:e.color,color:"#fff",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{employeeInitials(e)}</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:"#201f1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.firstName} {e.lastName}</div>
          <div style={{fontSize:10,color:"#a19f9d"}}>ID {e.idNumber}</div>
        </div>
      </div>)},
    {id:"department",label:"Department",get:e=>e.department,filterable:true,width:170},
    {id:"jobTitle",label:"Job Title",get:e=>e.jobTitle,minWidth:180},
    {id:"salaryLevel",label:"Level",get:e=>e.salaryLevel,filterable:true,width:90,renderCell:e=><span style={{whiteSpace:"nowrap"}}>L{e.salaryLevel}/N{e.salaryNotch}</span>},
    {id:"status",label:"Status",get:e=>e.status,filterable:true,width:108,renderCell:e=>{const ok=e.status==="Active";return <span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,border:`1px solid ${ok?"#107c1055":"#c8a11655"}`,color:ok?"#107c10":"#7a5700",letterSpacing:"0.3px",textTransform:"uppercase",whiteSpace:"nowrap"}}>{e.status}</span>;}},
    {id:"aes",label:"AES",get:e=>e.aesAccredited?"Accredited":"Pending",filterable:true,width:118,renderCell:e=>e.aesAccredited?<span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,color:"#219CD6",fontWeight:600,whiteSpace:"nowrap"}}><I as={Checkmark20Regular} size={12}/>Accredited</span>:<span style={{fontSize:11,color:"#a19f9d"}}>Pending</span>},
  ];
  const selected=selectedId?employeeById(state,selectedId):null;
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <ViewHeader title="The Registry" subtitle={`Public-servant records · Z83 compliant · ${state.employees.length} active records`} action={<Btn onClick={()=>setShowZ83(true)}>+ New Z83 Inception</Btn>} commandView="registry"/>
    <DataTable rows={state.employees} columns={cols} getKey={e=>e.id} defaultSort={{col:"lastName",dir:"asc"}} searchPlaceholder="Search by name, PERSAL, ID, job title, or department…" searchKeys={["persalNo","idNumber","firstName","lastName","department","jobTitle"]} onRowClick={e=>setSelectedId(e.id)} selectedKey={selectedId} emptyMessage="No records match this filter."/>
    {selected&&<Drawer onClose={()=>setSelectedId(null)} width={680}><EmployeeProfile employee={selected} onClose={()=>setSelectedId(null)}/></Drawer>}
    {showZ83&&<Z83InceptionModal onClose={()=>setShowZ83(false)}/>}
  </div>;
}

// ─── Registry: Employee Profile (Slice 1 + 3 + 6 + 7) ─────────────────────────
function EmployeeProfile({employee,onClose}){
  const {state,openProfile}=useContext(AppContext);
  const [tab,setTab]=useState("profile");
  const [showPromote,setShowPromote]=useState(false);
  const [showLedger,setShowLedger]=useState(false);
  const [showTouchpoint,setShowTouchpoint]=useState(false);
  const myTouchpoints=state.touchpoints.filter(t=>t.employeeId===employee.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const myLedger=state.ledger.filter(l=>l.employeeId===employee.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#faf9f8",width:"100%"}}>
    {/* Profile header */}
    <div style={{padding:"18px 24px",background:"#fff",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
        <div style={{width:64,height:64,borderRadius:"50%",background:employee.color,color:"#fff",display:"grid",placeItems:"center",fontSize:22,fontWeight:700,flexShrink:0}}>{employeeInitials(employee)}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:20,fontWeight:700,color:"#201f1e"}}>{employee.firstName} {employee.lastName}</div>
            {employee.knownAs&&<span style={{fontSize:12,color:"#a19f9d",fontStyle:"italic"}}>"{employee.knownAs}"</span>}
          </div>
          <div style={{fontSize:13,color:"#605e5c",marginTop:2}}>{employee.jobTitle} · {employee.department}</div>
          <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap"}}>
            <div style={{fontSize:11,color:"#605e5c"}}><strong style={{color:"#323130"}}>PERSAL:</strong> {employee.persalNo}</div>
            <div style={{fontSize:11,color:"#605e5c"}}><strong style={{color:"#323130"}}>ID:</strong> {employee.idNumber}</div>
            <div style={{fontSize:11,color:"#605e5c"}}><strong style={{color:"#323130"}}>Salary:</strong> Level {employee.salaryLevel} / Notch {employee.salaryNotch}</div>
            <div style={{fontSize:11,color:"#605e5c"}}><strong style={{color:"#323130"}}>Tenure:</strong> Since {fmtDate(employee.employmentDate)}</div>
          </div>
          <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,background:employee.aesAccredited?"#dff6dd":"#fff4ce",color:employee.aesAccredited?"#107c10":"#7a5700",textTransform:"uppercase",letterSpacing:"0.5px",display:"inline-flex",alignItems:"center",gap:4}}>{employee.aesAccredited&&<I as={Checkmark20Regular} size={11}/>}{employee.aesAccredited?"AES Accredited":"AES Pending"}</span>
            <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,background:"#deecf9",color:"#219CD6",textTransform:"uppercase",letterSpacing:"0.5px"}}>NIIS · {employee.biometric.includes("Verified")?"Verified":"Pending"}</span>
            <span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:100,background:"#f3f2f1",color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px"}}>POPIA · Anonymised</span>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexShrink:0}}>
          <Btn variant="secondary" size="sm" onClick={()=>{onClose();openProfile&&openProfile(employee.id);}}>Open full profile →</Btn>
          <Btn size="sm" onClick={()=>setShowPromote(true)}>+ Promotion (3FA)</Btn>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#605e5c",padding:"2px 6px",display:"inline-flex",alignItems:"center"}}><I as={Dismiss20Regular} size={18}/></button>
        </div>
      </div>
      <div style={{display:"flex",gap:0,marginTop:18,borderBottom:"1px solid rgba(0,0,0,0.06)",marginLeft:-24,marginRight:-24,paddingLeft:24,paddingRight:24}}>
        {[{id:"profile",label:"Z83 Profile"},{id:"timeline",label:"Archival Timeline"},{id:"ledger",label:"Append-Only Ledger"}].map(t=>(
          <div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:tab===t.id?"#219CD6":"#605e5c",borderBottom:tab===t.id?"2px solid #219CD6":"2px solid transparent",marginBottom:-1,transition:"all 0.15s"}}>{t.label}</div>
        ))}
      </div>
    </div>
    <div style={{flex:1,overflow:"auto",padding:"20px 24px"}}>
      {tab==="profile"&&<Z83Profile employee={employee}/>}
      {tab==="timeline"&&<>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:11,color:"#605e5c"}}>{myTouchpoints.length} touchpoint{myTouchpoints.length!==1?"s":""} on record</div>
          <Btn size="sm" onClick={()=>setShowTouchpoint(true)}>+ Touchpoint</Btn>
        </div>
        <ArchivalTimeline touchpoints={myTouchpoints} onLedgerOpen={(hash)=>{setShowLedger(true);}}/>
      </>}
      {tab==="ledger"&&<LedgerView entries={myLedger}/>}
    </div>
    {showPromote&&<PromotionEventModal employee={employee} onClose={()=>setShowPromote(false)}/>}
    {showTouchpoint&&<TouchpointModal employee={employee} onClose={()=>setShowTouchpoint(false)}/>}
  </div>;
}

// ─── Registry: Z83 Profile Pane ───────────────────────────────────────────────
function Z83Profile({employee}){
  const sections=[
    {title:"Personal Particulars",rows:[["First Name(s)",employee.firstName],["Surname",employee.lastName],["Known As",employee.knownAs||"—"],["Date of Birth",fmtDate(employee.dob)],["Gender",employee.gender],["Race (EE Reporting)",employee.race]]},
    {title:"Identity & Verification",rows:[["RSA ID Number",employee.idNumber],["PERSAL Number",employee.persalNo],["NIIS Biometric",employee.biometric],["AES Accreditation",employee.aesAccredited?"Verified · Class A":"Not yet accredited"]]},
    {title:"Appointment Details",rows:[["Department",employee.department],["Job Title",employee.jobTitle],["Salary Level",`Level ${employee.salaryLevel}`],["Notch",`Notch ${employee.salaryNotch}`],["Date of Appointment",fmtDate(employee.employmentDate)],["Status",employee.status]]},
  ];
  return <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
    {sections.map(s=>(
      <div key={s.title} className="fade-up" style={{background:"#fff",borderRadius:10,border:"1px solid rgba(0,0,0,0.06)",padding:"14px 18px"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#219CD6",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>{s.title}</div>
        {s.rows.map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.04)",fontSize:12}}>
            <span style={{color:"#605e5c"}}>{k}</span>
            <span style={{color:"#201f1e",fontWeight:600,textAlign:"right"}}>{v}</span>
          </div>
        ))}
      </div>
    ))}
    <div className="fade-up" style={{background:"linear-gradient(135deg,#deecf9 0%,#f0f6fb 100%)",borderRadius:10,border:"1px solid rgba(33,156,214,0.2)",padding:"14px 18px"}}>
      <div style={{fontSize:11,fontWeight:700,color:"#219CD6",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Compliance Anchors</div>
      <div style={{fontSize:12,color:"#323130",lineHeight:1.6}}>
        <div>● <strong>Z83 (2014)</strong> · DPSA prescribed application form</div>
        <div>● <strong>POPIA §14</strong> · Lawful processing — public service exemption</div>
        <div>● <strong>PSA §38</strong> · Conditions of service applied</div>
        <div>● <strong>NIIS Trust Anchor</strong> · DHA biometric handshake</div>
      </div>
    </div>
  </div>;
}

// ─── Registry: Archival Timeline (Slice 3) ────────────────────────────────────
// Fluent 2 pattern: no native Timeline — composed from Avatar, Icon, and layout
// containers. Flat rows on a 1px rail, monthly date headers, hover-only background.
function ArchivalTimeline({touchpoints,onLedgerOpen}){
  if(!touchpoints.length)return <div style={{padding:40,textAlign:"center",color:"#a19f9d",fontSize:13}}>No touchpoints recorded yet.</div>;
  const groups = touchpoints.reduce((acc,t)=>{
    const d = new Date(t.date);
    const key = d.toLocaleDateString("en-ZA",{year:"numeric",month:"long"});
    (acc[key]=acc[key]||[]).push(t);
    return acc;
  },{});
  let counter=0;
  return <div>
    {Object.entries(groups).map(([month,items])=>(
      <div key={month} style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px"}}>{month}</span>
          <div style={{flex:1,height:1,background:"#e1dfdd"}}/>
        </div>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:14,top:14,bottom:14,width:1,background:"#e1dfdd"}}/>
          {items.map((t)=>{
            const accent=touchpointAccent(t.type);
            const idx=counter++;
            return <div key={t.id} className="fade-up" style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16,padding:"10px 12px 10px 44px",animationDelay:`${idx*0.03}s`,transition:"background 0.15s",cursor:t.ledgerHash?"pointer":"default"}} onMouseEnter={e=>e.currentTarget.style.background="#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"} onClick={()=>t.ledgerHash&&onLedgerOpen(t.ledgerHash)}>
              <div style={{position:"absolute",left:0,top:8,width:28,height:28,borderRadius:4,background:`${accent}14`,color:accent,display:"grid",placeItems:"center",border:`1px solid ${accent}33`,boxSizing:"border-box"}}><I as={touchpointIcon(t.type)} size={14}/></div>
              <div style={{flex:1,minWidth:0,paddingTop:2}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3}}>
                  <span style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{t.category}</span>
                  <span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:2,color:accent,border:`1px solid ${accent}55`,letterSpacing:"0.3px",textTransform:"uppercase"}}>{t.type}</span>
                  {t.highStakes&&<span style={{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:2,color:"#7a5700",border:"1px solid #f0c000",letterSpacing:"0.3px",textTransform:"uppercase"}}>High-Stakes</span>}
                </div>
                <div style={{fontSize:12,color:"#605e5c",lineHeight:1.45}}>{t.details}</div>
                {t.ledgerHash&&<div style={{marginTop:6,fontSize:11,color:"#219CD6",fontFamily:"ui-monospace,SFMono-Regular,monospace",display:"inline-flex",alignItems:"center",gap:5}}><I as={Link20Regular} size={12}/> Ledger {t.ledgerHash}</div>}
              </div>
              <div style={{fontSize:11,color:"#a19f9d",paddingTop:5,whiteSpace:"nowrap",flexShrink:0}}>{fmtDate(t.date)}</div>
            </div>;
          })}
        </div>
      </div>
    ))}
  </div>;
}

// ─── Registry: Ledger View (Slice 7) ──────────────────────────────────────────
function LedgerView({entries}){
  if(!entries.length)return <div style={{padding:40,textAlign:"center",color:"#a19f9d",fontSize:13}}>Ledger is empty.</div>;
  return <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,padding:"10px 14px",background:"#fff4ce",border:"1px solid #f0c000",borderRadius:8}}>
      <I as={LockClosed20Regular} size={16} color="#7a5700"/>
      <div style={{fontSize:12,color:"#7a5700"}}><strong>Append-only ledger.</strong> Records cannot be edited or deleted — corrections create a new linked entry preserving the original.</div>
    </div>
    <div style={{background:"#fff",borderRadius:10,border:"1px solid rgba(0,0,0,0.06)",overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"110px 1fr 150px 130px 100px",padding:"10px 16px",background:"#faf9f8",fontSize:10,fontWeight:700,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div>TX Hash</div><div>Event · Policy</div><div>Actor</div><div>Timestamp</div><div>Signed</div>
      </div>
      {entries.map((l,i)=>(
        <div key={l.id} className="fade-up" style={{display:"grid",gridTemplateColumns:"110px 1fr 150px 130px 100px",padding:"12px 16px",borderBottom:i<entries.length-1?"1px solid rgba(0,0,0,0.04)":"none",fontSize:12,alignItems:"center",animationDelay:`${i*0.03}s`}}>
          <div>
            <div style={{fontFamily:"ui-monospace,SFMono-Regular,monospace",color:"#219CD6",fontSize:11,fontWeight:600}}>{l.txHash}</div>
            <div style={{fontSize:9,color:"#a19f9d",marginTop:2}}>← {l.prevHash}</div>
          </div>
          <div>
            <div style={{fontWeight:600,color:"#201f1e"}}>{l.event}</div>
            <div style={{fontSize:10,color:"#605e5c",marginTop:1}}>{l.policyRef}</div>
          </div>
          <div style={{color:"#605e5c"}}>{l.actor}</div>
          <div style={{color:"#605e5c",fontSize:11}}>{new Date(l.timestamp).toLocaleString("en-ZA",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {l.aesSigned&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:100,background:"#dff6dd",color:"#107c10"}}>AES</span>}
            {l.threeFA&&<span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:100,background:"#deecf9",color:"#219CD6"}}>3FA</span>}
            {!l.aesSigned&&!l.threeFA&&<span style={{fontSize:9,color:"#a19f9d"}}>—</span>}
          </div>
        </div>
      ))}
    </div>
  </div>;
}

// ─── Registry: Z83 Inception Modal (Slice 1) ──────────────────────────────────
function Z83InceptionModal({onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({firstName:"",lastName:"",knownAs:"",idNumber:"",dob:"",gender:"Female",race:"African",persalNo:"",department:"",jobTitle:"",salaryLevel:1,salaryNotch:1});
  const [busy,setBusy]=useState(false);
  const submit=async ()=>{
    if(!form.firstName||!form.lastName||!form.idNumber||!form.persalNo||!form.department){
      toast("Missing required fields","First name, surname, ID, PERSAL number, and department are required",{icon:<I as={Warning20Regular} size={16} color="#a4262c"/>,color:"#a4262c"});
      return;
    }
    setBusy(true);
    await simulateLatency(1800);
    const id="e"+genId();
    const colors=["#219CD6","#107c10","#8764b8","#c8a116","#a4262c","#005a9e"];
    const newEmp={...form,id,salaryLevel:Number(form.salaryLevel),salaryNotch:Number(form.salaryNotch),employmentDate:new Date().toISOString().split("T")[0],status:"Active",biometric:"Pending NIIS sync",aesAccredited:false,color:colors[Math.floor(Math.random()*colors.length)]};
    const hash=shortHash();
    dispatch({type:"ADD_EMPLOYEE",employee:newEmp,ledgerHash:hash});
    toast("Z83 inception recorded",`${form.firstName} ${form.lastName} added to The Registry · ledger ${hash}`,{icon:<I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>,color:"#107c10"});
    setBusy(false);
    onClose();
  };
  return <Modal title="Z83 Inception · New Public Servant" onClose={onClose} width={600}>
    <div style={{padding:20}}>
      <div style={{padding:"10px 14px",background:"#deecf9",border:"1px solid rgba(33,156,214,0.2)",borderRadius:8,marginBottom:16,fontSize:12,color:"#219CD6",display:"flex",alignItems:"center",gap:8}}><I as={ClipboardTextLtr20Regular} size={16}/><span>Form Z83 (DPSA prescribed) · Captures core particulars and creates the genesis entry in the append-only ledger.</span></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Input label="First Name(s) *" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/>
        <Input label="Surname *" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/>
        <Input label="Known As" value={form.knownAs} onChange={e=>setForm({...form,knownAs:e.target.value})}/>
        <Input label="Date of Birth" type="date" value={form.dob} onChange={e=>setForm({...form,dob:e.target.value})}/>
        <Input label="RSA ID Number *" value={form.idNumber} onChange={e=>setForm({...form,idNumber:e.target.value})} placeholder="13-digit"/>
        <Input label="PERSAL Number *" value={form.persalNo} onChange={e=>setForm({...form,persalNo:e.target.value})} placeholder="8-digit"/>
        <Select label="Gender" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} options={["Female","Male","Other","Prefer not to say"]}/>
        <Select label="Race (EE Reporting)" value={form.race} onChange={e=>setForm({...form,race:e.target.value})} options={["African","Coloured","Indian","White","Other"]}/>
        <Select label="Department *" value={form.department} onChange={e=>setForm({...form,department:e.target.value})} options={[{value:"",label:"Select department…"},...GOVT_DEPARTMENTS.map(d=>({value:d,label:d}))]}/>
        <Input label="Job Title" value={form.jobTitle} onChange={e=>setForm({...form,jobTitle:e.target.value})}/>
        <Select label="Salary Level" value={form.salaryLevel} onChange={e=>setForm({...form,salaryLevel:e.target.value})} options={SALARY_LEVELS.map(l=>({value:l,label:`Level ${l}`}))}/>
        <Select label="Notch" value={form.salaryNotch} onChange={e=>setForm({...form,salaryNotch:e.target.value})} options={[1,2,3,4,5,6,7,8,9,10].map(n=>({value:n,label:`Notch ${n}`}))}/>
      </div>
      <Divider my={12}/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} loading={busy}>{busy?"Anchoring to ledger…":"Create Inception Record"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Registry: Touchpoint Modal ───────────────────────────────────────────────
function TouchpointModal({employee,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [form,setForm]=useState({type:"Leave",category:"Annual Leave",details:""});
  const [busy,setBusy]=useState(false);
  const submit=async ()=>{
    if(!form.details.trim()){toast("Details required","Provide the touchpoint details",{icon:<I as={Warning20Regular} size={16} color="#a4262c"/>,color:"#a4262c"});return;}
    setBusy(true);
    await simulateLatency(1800);
    const hash=shortHash();
    const tp={id:touchpointCounter++,employeeId:employee.id,type:form.type,category:form.category,date:new Date().toISOString().split("T")[0],details:form.details,status:"approved"};
    const ledgerEntry={id:ledgerCounter++,employeeId:employee.id,txHash:hash,prevHash:"latest",event:`Touchpoint · ${form.type}`,actor:"You",actorId:"u4",timestamp:new Date().toISOString(),policyRef:({Leave:"Public Service Act §38",Training:"DPSA CPD Mandate",Performance:"PMDS Framework (2018)"})[form.type]||"DPSA General",aesSigned:false,threeFA:false};
    dispatch({type:"ADD_TOUCHPOINT",touchpoint:tp,ledgerEntry,employeeName:`${employee.firstName} ${employee.lastName}`});
    toast("Touchpoint recorded",`${form.type} added to timeline · ledger ${hash}`,{icon:<I as={Checkmark20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});
    setBusy(false);
    onClose();
  };
  return <Modal title="Add Touchpoint" onClose={onClose} width={440}>
    <div style={{padding:20}}>
      <Select label="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value,category:({Leave:"Annual Leave",Training:"Workshop",Performance:"Quarterly Check-in"})[e.target.value]||""})} options={["Leave","Training","Performance"]}/>
      <Input label="Category / Title" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:600,color:"#605e5c",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>Details</div>
        <textarea value={form.details} onChange={e=>setForm({...form,details:e.target.value})} rows={3} placeholder="e.g. 5 days · approved by line manager" style={{width:"100%",padding:"8px 10px",border:"1px solid #e0dede",borderRadius:6,fontSize:13,background:"#faf9f8",resize:"vertical"}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:10}}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} loading={busy}>{busy?"Saving…":"Record Touchpoint"}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Registry: Promotion Event Modal (Slice 6) ────────────────────────────────
function PromotionEventModal({employee,onClose}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({newLevel:employee.salaryLevel+1,newNotch:1,newTitle:employee.jobTitle,reason:"Vertical Promotion"});
  const [factors,setFactors]=useState({password:false,otp:false,biometric:false});
  const [busy,setBusy]=useState(false);
  const allFactors=factors.password&&factors.otp&&factors.biometric;
  const commit=()=>{
    setBusy(true);
    setTimeout(()=>{
      const hash=shortHash();
      const tp={id:touchpointCounter++,employeeId:employee.id,type:"Promotion",category:form.reason,date:new Date().toISOString().split("T")[0],details:`L${employee.salaryLevel}/N${employee.salaryNotch} → L${form.newLevel}/N${form.newNotch}${form.newTitle!==employee.jobTitle?` · ${form.newTitle}`:""}`,status:"approved",highStakes:true,ledgerHash:hash};
      const ledgerEntry={id:ledgerCounter++,employeeId:employee.id,txHash:hash,prevHash:"latest",event:`Promotion · ${form.reason}`,actor:"You (HR Director)",actorId:"u4",timestamp:new Date().toISOString(),policyRef:"PSCBC Resolution 1 of 2007",aesSigned:true,threeFA:true};
      dispatch({type:"PROMOTE_EMPLOYEE",employeeId:employee.id,newLevel:Number(form.newLevel),newNotch:Number(form.newNotch),newTitle:form.newTitle,touchpoint:tp,ledgerEntry,employeeName:`${employee.firstName} ${employee.lastName}`});
      toast("Promotion committed",`AES-signed · 3FA verified · ledger ${hash}`,{icon:<I as={ShieldLock20Regular} size={16} color="#107c10"/>,color:"#107c10"});
      onClose();
    },1800);
  };
  return <Modal title="High-Stakes Event · Promotion" onClose={onClose} width={520}>
    <div style={{padding:20}}>
      {/* Steps */}
      <div style={{display:"flex",padding:"4px 0 16px 0",gap:0,borderBottom:"1px solid rgba(0,0,0,0.07)",marginBottom:18}}>
        {["Change Detail","3FA Verification","Commit"].map((s,i)=>(
          <div key={s} style={{flex:1,display:"flex",alignItems:"center",gap:0}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:step>i+1?"#107c10":step===i+1?"#219CD6":"#e8e6e4",color:"#fff",display:"grid",placeItems:"center",fontSize:11,fontWeight:700,marginBottom:4}}>{step>i+1?<I as={Checkmark20Regular} size={12}/>:i+1}</div>
              <span style={{fontSize:10,fontWeight:600,color:step===i+1?"#219CD6":"#a19f9d"}}>{s}</span>
            </div>
            {i<2&&<div style={{width:40,height:2,background:step>i+1?"#107c10":"#e8e6e4",marginBottom:16,flexShrink:0}}/>}
          </div>
        ))}
      </div>
      {step===1&&<>
        <div style={{padding:"10px 14px",background:"#fff4ce",border:"1px solid #f0c000",borderRadius:8,marginBottom:14,fontSize:12,color:"#7a5700",display:"flex",alignItems:"center",gap:8}}><I as={Warning20Regular} size={16}/><span>This is a high-stakes event. It will be cryptographically anchored to the ledger and require 3-factor authentication.</span></div>
        <Select label="Reason" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} options={["Vertical Promotion","Salary Notch Increment","Re-grading","OSD Translation"]}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <Select label="New Salary Level" value={form.newLevel} onChange={e=>setForm({...form,newLevel:e.target.value})} options={SALARY_LEVELS.map(l=>({value:l,label:`Level ${l}`}))}/>
          <Select label="New Notch" value={form.newNotch} onChange={e=>setForm({...form,newNotch:e.target.value})} options={[1,2,3,4,5,6,7,8,9,10].map(n=>({value:n,label:`Notch ${n}`}))}/>
        </div>
        <Input label="New Job Title" value={form.newTitle} onChange={e=>setForm({...form,newTitle:e.target.value})}/>
        <div style={{padding:"10px 14px",background:"#faf9f8",border:"1px solid rgba(0,0,0,0.07)",borderRadius:8,fontSize:12,color:"#605e5c",marginTop:6}}>
          <div><strong style={{color:"#323130"}}>Before:</strong> {employee.jobTitle} · L{employee.salaryLevel}/N{employee.salaryNotch}</div>
          <div style={{marginTop:4}}><strong style={{color:"#107c10"}}>After:</strong> {form.newTitle} · L{form.newLevel}/N{form.newNotch}</div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={()=>setStep(2)}>Next: 3FA →</Btn>
        </div>
      </>}
      {step===2&&<>
        <div style={{fontSize:13,color:"#605e5c",marginBottom:14}}>Confirm three independent factors. Each is recorded in the ledger entry.</div>
        {[{key:"password",label:"Password",icon:Key20Regular,hint:"Confirms your account credentials"},{key:"otp",label:"OTP from authenticator",icon:Phone20Regular,hint:"Time-based one-time password"},{key:"biometric",label:"Fingerprint via NIIS",icon:Fingerprint20Regular,hint:"DHA biometric handshake"}].map(f=>(
          <div key={f.key} onClick={()=>setFactors({...factors,[f.key]:!factors[f.key]})} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:factors[f.key]?"#dff6dd":"#faf9f8",border:`1px solid ${factors[f.key]?"#107c10":"rgba(0,0,0,0.07)"}`,borderRadius:8,marginBottom:8,cursor:"pointer",transition:"all 0.15s"}}>
            <span style={{display:"inline-flex",color:factors[f.key]?"#107c10":"#605e5c"}}><I as={f.icon} size={20}/></span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{f.label}</div>
              <div style={{fontSize:11,color:"#605e5c"}}>{f.hint}</div>
            </div>
            <div style={{width:22,height:22,borderRadius:"50%",background:factors[f.key]?"#107c10":"#fff",border:`2px solid ${factors[f.key]?"#107c10":"#c8c6c4"}`,display:"grid",placeItems:"center",color:"#fff"}}>{factors[f.key]&&<I as={Checkmark20Regular} size={13}/>}</div>
          </div>
        ))}
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
          <Btn variant="secondary" onClick={()=>setStep(1)}>← Back</Btn>
          <Btn disabled={!allFactors} onClick={()=>setStep(3)}>{allFactors?"Verified · Continue →":"Confirm all factors"}</Btn>
        </div>
      </>}
      {step===3&&<>
        <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#dff6dd 0%,#f0fff0 100%)",border:"1px solid #107c10",borderRadius:10,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:700,color:"#107c10",marginBottom:4,display:"flex",alignItems:"center",gap:6}}><I as={Checkmark20Regular} size={16}/> Ready to commit</div>
          <div style={{fontSize:12,color:"#237021",lineHeight:1.6}}>
            <div>● Promotion: <strong>{employee.firstName} {employee.lastName}</strong></div>
            <div>● Change: L{employee.salaryLevel}/N{employee.salaryNotch} → L{form.newLevel}/N{form.newNotch}</div>
            <div>● Policy anchor: PSCBC Resolution 1 of 2007</div>
            <div>● 3FA: Password + OTP + NIIS Biometric</div>
            <div>● AES signature will be applied on commit</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setStep(2)} disabled={busy}>← Back</Btn>
          <Btn variant="success" onClick={commit} disabled={busy}>{busy?"Anchoring to ledger…":<span style={{display:"inline-flex",alignItems:"center",gap:6}}><I as={ShieldLock20Regular} size={14}/> Sign & Commit</span>}</Btn>
        </div>
      </>}
    </div>
  </Modal>;
}

// ─── Registry: Employee Profile Screen (full-page) ────────────────────────────
const ATTENDANCE_COLORS = {ontime:"#107c10",late:"#c8a116",absent:"#a4262c",leave:"#219CD6",weekend:"#a19f9d"};
function dayStatusFor(employee,year,month,day){
  const d=new Date(year,month,day);
  if(d.getDay()===0||d.getDay()===6) return "weekend";
  const today=new Date(); today.setHours(0,0,0,0);
  if(d>today) return null;
  const seed=(day*7+month*3+(employee.id.charCodeAt(employee.id.length-1)||0))%20;
  if(seed<14) return "ontime";
  if(seed<17) return "late";
  if(seed<19) return "leave";
  return "absent";
}
function MonthCalendar({employee,year,month,onChangeMonth}){
  const monthName=new Date(year,month,1).toLocaleString("en-ZA",{month:"long"});
  const first=new Date(year,month,1).getDay(); // 0=Sun
  const offset=(first+6)%7; // make Mon=0
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=new Date();
  const isThisMonth=today.getFullYear()===year&&today.getMonth()===month;
  const cells=[];
  for(let i=0;i<offset;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const weeks=[];
  for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  return <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"14px 16px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{monthName} {year}</div>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>onChangeMonth(-1)} style={{background:"none",border:"1px solid #e1dfdd",borderRadius:4,padding:3,cursor:"pointer",display:"inline-flex",color:"#605e5c"}}><I as={ChevronLeft20Regular} size={14}/></button>
        <button onClick={()=>onChangeMonth(1)} style={{background:"none",border:"1px solid #e1dfdd",borderRadius:4,padding:3,cursor:"pointer",display:"inline-flex",color:"#605e5c"}}><I as={ChevronRight20Regular} size={14}/></button>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
      {["M","T","W","T","F","S","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontSize:10,fontWeight:600,color:"#a19f9d",letterSpacing:"0.3px"}}>{d}</div>)}
      {weeks.flat().map((d,i)=>{
        if(d===null) return <div key={i} style={{height:30}}/>;
        const status=dayStatusFor(employee,year,month,d);
        const isToday=isThisMonth&&d===today.getDate();
        const bg=status?ATTENDANCE_COLORS[status]+"22":"transparent";
        const dot=status&&status!=="weekend"?ATTENDANCE_COLORS[status]:null;
        return <div key={i} style={{height:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:4,background:bg,border:isToday?"1.5px solid #219CD6":"1px solid transparent",cursor:status?"pointer":"default",position:"relative"}}>
          <span style={{fontSize:11,fontWeight:isToday?700:500,color:status==="absent"?"#a4262c":status==="late"?"#7a5700":"#201f1e"}}>{d}</span>
          {dot&&<div style={{width:4,height:4,borderRadius:"50%",background:dot,position:"absolute",bottom:3}}/>}
        </div>;
      })}
    </div>
  </div>;
}
function YearGlance({year,activeMonth,onPickMonth}){
  const months=Array.from({length:12},(_,i)=>new Date(year,i,1).toLocaleString("en-ZA",{month:"short"}));
  return <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"14px 16px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{year}</div>
      <span style={{fontSize:11,color:"#a19f9d"}}>Year at a glance</span>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
      {months.map((m,i)=>{
        const sel=activeMonth===i;
        return <div key={m} onClick={()=>onPickMonth(i)} style={{textAlign:"center",padding:"8px 4px",borderRadius:4,fontSize:11,fontWeight:sel?600:500,cursor:"pointer",background:sel?"#deecf9":"transparent",color:sel?"#219CD6":"#201f1e",border:`1px solid ${sel?"#219CD6":"transparent"}`,transition:"background 0.15s"}} onMouseEnter={e=>{if(!sel)e.currentTarget.style.background="#f3f2f1";}} onMouseLeave={e=>{if(!sel)e.currentTarget.style.background="transparent";}}>{m}</div>;
      })}
    </div>
    <div style={{marginTop:10,fontSize:11,color:"#219CD6",fontWeight:600,cursor:"pointer",textAlign:"right"}}>Go to today</div>
  </div>;
}
function StatCard({label,value,sub,color}){
  return <div style={{flex:1,background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"12px 14px"}}>
    <div style={{fontSize:11,color:"#605e5c",marginBottom:4,fontWeight:500}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color,letterSpacing:"-0.3px"}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:"#a19f9d",marginTop:2}}>{sub}</div>}
  </div>;
}
function OvertimeChart({data}){
  const w=540,h=130,pad={l:30,r:10,t:14,b:24};
  const innerW=w-pad.l-pad.r, innerH=h-pad.t-pad.b;
  const max=Math.max(...data.map(d=>d.hours),25);
  const min=Math.min(...data.map(d=>d.hours),0);
  const x=(i)=>pad.l+(innerW*i/(data.length-1));
  const y=(v)=>pad.t+innerH-(innerH*(v-min)/(max-min));
  const path=data.map((d,i)=>(i===0?"M":"L")+x(i)+" "+y(d.hours)).join(" ");
  const areaPath=path+" L "+x(data.length-1)+" "+(pad.t+innerH)+" L "+x(0)+" "+(pad.t+innerH)+" Z";
  const lastIdx=data.length-1;
  return <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{display:"block"}}>
    {[0,0.25,0.5,0.75,1].map((p,i)=>{
      const yy=pad.t+innerH*p;
      return <line key={i} x1={pad.l} x2={w-pad.r} y1={yy} y2={yy} stroke="#f3f2f1" strokeWidth="1"/>;
    })}
    <path d={areaPath} fill="#219CD6" fillOpacity="0.08"/>
    <path d={path} fill="none" stroke="#219CD6" strokeWidth="2"/>
    {data.map((d,i)=>(
      <circle key={i} cx={x(i)} cy={y(d.hours)} r={i===lastIdx?5:3} fill="#fff" stroke="#219CD6" strokeWidth={i===lastIdx?2.5:2}/>
    ))}
    {data.map((d,i)=>(
      <text key={"l"+i} x={x(i)} y={y(d.hours)-9} textAnchor="middle" fontSize="10" fill="#605e5c" fontWeight="600">{d.hours}</text>
    ))}
    {data.map((d,i)=>(
      <text key={"m"+i} x={x(i)} y={h-8} textAnchor="middle" fontSize="10" fill="#a19f9d">{d.month}</text>
    ))}
  </svg>;
}

function EmployeeProfileScreen({employee,onClose}){
  const {state}=useContext(AppContext);
  const toast=useToast();
  const today=new Date();
  const [calMonth,setCalMonth]=useState(today.getMonth());
  const [calYear,setCalYear]=useState(today.getFullYear());
  const [tab,setTab]=useState("application");
  const [showPromote,setShowPromote]=useState(false);
  const [showTouchpoint,setShowTouchpoint]=useState(false);
  const [essOn,setEssOn]=useState(true);
  const [active,setActive]=useState("attendance");

  const stats=[
    {label:"On time",value:"72.7%",sub:"60 working days",color:"#107c10"},
    {label:"Late",value:"13.6%",sub:"This year",color:"#c8a116"},
    {label:"Absent",value:"13.6%",sub:"This year",color:"#a4262c"},
  ];
  const leaveBalance=[
    {type:"Annual Leave",total:22,used:5,remaining:17},
    {type:"Sick Leave",total:30,used:3,remaining:27},
    {type:"Family Resp.",total:5,used:0,remaining:5},
    {type:"Study Leave",total:14,used:0,remaining:14},
  ];
  const clockIns=Array.from({length:7},(_,i)=>{
    const d=new Date(today); d.setDate(today.getDate()-i);
    if(d.getDay()===0||d.getDay()===6) return null;
    const status=["ontime","ontime","ontime","late","ontime","ontime","ontime"][i%7];
    return {date:d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"}),clockIn:status==="late"?"08:23 AM":"07:54 AM",clockOut:"05:02 PM",status:status==="late"?"Late":"On time",hours:status==="late"?"08:39 hr":"09:08 hr"};
  }).filter(Boolean);
  const applications=[
    {type:"Annual Leave",dates:"15 Apr 2026 – 19 Apr 2026",reason:"Family vacation in the Eastern Cape.",status:"Pending approval",statusColor:"#c8a116"},
    {type:"Study Leave",dates:"22 May 2026 – 24 May 2026",reason:"DPSA Compliance Workshop attendance.",status:"Pending approval",statusColor:"#c8a116"},
  ];
  const history=[
    {type:"Sick Leave",dates:"22 Sep 2025 – 24 Sep 2025",reason:"Medical certificate filed.",status:"Approved",statusColor:"#107c10"},
    {type:"Annual Leave",dates:"02 Dec 2024 – 13 Dec 2024",reason:"December break.",status:"Approved",statusColor:"#107c10"},
  ];
  const overtime=[{month:"May",hours:21.5},{month:"Jun",hours:18.5},{month:"Jul",hours:18.0},{month:"Aug",hours:15.5},{month:"Sep",hours:21.5},{month:"Oct",hours:13.0}];

  const supervisor=userById("u1");

  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden",background:"#faf9f8"}}>
    {/* Header */}
    <div style={{padding:"12px 24px",borderBottom:"1px solid #e1dfdd",background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#219CD6",fontWeight:600,padding:0,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:4}}><I as={ChevronLeft20Regular} size={14}/> The Registry</button>
        <span style={{color:"#c8c6c4"}}>/</span>
        <span style={{color:"#605e5c"}}>{employee.firstName} {employee.lastName}</span>
      </div>
      <div style={{display:"flex",gap:6}}>
        {[{id:"attendance",label:"Attendance"},{id:"profile",label:"Profile"},{id:"history",label:"Activity"}].map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)} style={{background:active===t.id?"#deecf9":"transparent",border:"1px solid "+(active===t.id?"#219CD6":"#e1dfdd"),borderRadius:4,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:active===t.id?"#219CD6":"#605e5c",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t.label}</button>
        ))}
      </div>
    </div>
    <CommandBar active="profile" canBack onBack={onClose}/>

    {/* Body — two-column */}
    <div style={{flex:1,overflow:"auto",padding:"20px 24px"}}>
      <div style={{display:"grid",gridTemplateColumns:"300px 1fr",gap:20,maxWidth:1280,margin:"0 auto"}}>
        {/* LEFT — profile sidebar */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"20px 18px",textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:employee.color,color:"#fff",display:"grid",placeItems:"center",fontSize:26,fontWeight:700,margin:"0 auto 10px"}}>{employeeInitials(employee)}</div>
            <div style={{fontSize:16,fontWeight:700,color:"#201f1e",marginBottom:2}}>{employee.firstName} {employee.lastName}</div>
            <div style={{fontSize:12,color:"#605e5c",marginBottom:12}}>{employee.jobTitle}</div>
            <Btn size="sm" style={{width:"100%"}} onClick={()=>toast("Message sent","Internal message dispatched",{icon:<I as={Mail20Regular} size={16} color="#219CD6"/>})}><I as={Mail20Regular} size={13}/> Message</Btn>
          </div>

          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Professional Info</div>
            {[
              {ic:Mail20Regular,label:"Email",value:`${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase().replace(/\s/g,"")}@gov.za`},
              {ic:Phone20Regular,label:"Mobile",value:"068 555 0142"},
              {ic:ContactCard20Regular,label:"PERSAL",value:employee.persalNo},
              {ic:PersonAvailable20Regular,label:"Status",value:employee.status==="Active"?"Active employee":employee.status},
              {ic:Building20Regular,label:"Department",value:employee.department},
              {ic:Clock20Regular,label:"Service length",value:`${new Date().getFullYear()-new Date(employee.employmentDate).getFullYear()} yrs since ${fmtDate(employee.employmentDate)}`},
              {ic:PersonAvailable20Regular,label:"Supervisor",value:supervisor.name},
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:i<6?"1px solid #f3f2f1":"none"}}>
                <span style={{color:"#605e5c",display:"inline-flex",marginTop:2}}><I as={row.ic} size={13}/></span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:"#a19f9d",lineHeight:1.2}}>{row.label}</div>
                  <div style={{fontSize:12,color:"#201f1e",fontWeight:500,wordBreak:"break-word"}}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Other Info</div>
            {[
              {ic:CalendarLtr20Regular,label:"Date of birth",value:fmtDate(employee.dob)},
              {ic:PersonAvailable20Regular,label:"Gender",value:employee.gender},
              {ic:HeartPulse20Regular,label:"Race",value:employee.race},
              {ic:ContactCard20Regular,label:"ID number",value:employee.idNumber},
              {ic:Location20Regular,label:"Office",value:`${employee.department} · Pretoria`},
            ].map((row,i,a)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"6px 0",borderBottom:i<a.length-1?"1px solid #f3f2f1":"none"}}>
                <span style={{color:"#605e5c",display:"inline-flex",marginTop:2}}><I as={row.ic} size={13}/></span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:10,color:"#a19f9d",lineHeight:1.2}}>{row.label}</div>
                  <div style={{fontSize:12,color:"#201f1e",fontWeight:500,wordBreak:"break-word"}}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:"#201f1e"}}>Self-Service Portal</div>
              <div style={{fontSize:10,color:"#a19f9d"}}>{essOn?"On":"Off"}</div>
            </div>
            <div onClick={()=>setEssOn(v=>!v)} style={{width:36,height:20,borderRadius:100,background:essOn?"#219CD6":"#c8c6c4",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:essOn?18:2,transition:"left 0.2s"}}/>
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <Btn size="sm" variant="secondary" onClick={()=>setShowTouchpoint(true)}>+ Touchpoint</Btn>
            <Btn size="sm" onClick={()=>setShowPromote(true)}>+ Promotion (3FA)</Btn>
          </div>
        </div>

        {/* RIGHT — main content */}
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Section: Employee Attendance */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:"#201f1e"}}>Employee Attendance</div>
                <div style={{fontSize:11,color:"#605e5c",marginTop:1}}>Today is {today.toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:14,marginBottom:14}}>
              <MonthCalendar employee={employee} year={calYear} month={calMonth} onChangeMonth={(d)=>{let m=calMonth+d,y=calYear;if(m<0){m=11;y--;}if(m>11){m=0;y++;}setCalMonth(m);setCalYear(y);}}/>
              <YearGlance year={calYear} activeMonth={calMonth} onPickMonth={(i)=>setCalMonth(i)}/>
            </div>
            {/* Legend */}
            <div style={{display:"flex",gap:14,marginBottom:14,fontSize:11,color:"#605e5c",flexWrap:"wrap"}}>
              {[["On time","#107c10"],["Late","#c8a116"],["Absent","#a4262c"],["On leave","#219CD6"]].map(([l,c])=>(
                <span key={l} style={{display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}</span>
              ))}
            </div>
          </div>

          {/* Attendance Board */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700,color:"#201f1e"}}>Attendance Board <span style={{fontSize:11,color:"#a19f9d",fontWeight:400,marginLeft:6}}>· Total 22 working days</span></div>
              <Btn size="sm" variant="secondary" onClick={()=>toast("Adjustment requested","Time adjustment submitted to line manager",{icon:<I as={Clock20Regular} size={16} color="#219CD6"/>})}><I as={Clock20Regular} size={13}/> Time Adjustment Request</Btn>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              {stats.map(s=><StatCard key={s.label} {...s}/>)}
            </div>
          </div>

          {/* Clock-ins table */}
          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"130px 110px 110px 1fr 110px",padding:"10px 14px",background:"#faf9f8",fontSize:10,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e1dfdd"}}>
              <div>Date</div><div>Clock in</div><div>Clock out</div><div>Att. status</div><div>Req. AM</div>
            </div>
            {clockIns.map((c,i)=>(
              <div key={i} className="fade-up" style={{display:"grid",gridTemplateColumns:"130px 110px 110px 1fr 110px",padding:"10px 14px",borderBottom:i<clockIns.length-1?"1px solid #f3f2f1":"none",fontSize:12,alignItems:"center",animationDelay:`${i*0.03}s`}}>
                <div style={{whiteSpace:"nowrap"}}>{c.date}</div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,color:"#605e5c"}}><I as={Clock20Regular} size={12}/>{c.clockIn}</div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,color:"#605e5c"}}><I as={Clock20Regular} size={12}/>{c.clockOut}</div>
                <div><span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${c.status==="Late"?"#c8a11655":"#107c1055"}`,color:c.status==="Late"?"#7a5700":"#107c10",whiteSpace:"nowrap"}}>{c.status}</span></div>
                <div style={{color:"#605e5c"}}>{c.hours}</div>
              </div>
            ))}
          </div>

          {/* Leave Balance */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:700,color:"#201f1e"}}>Leave Balance <span style={{fontSize:11,color:"#a19f9d",fontWeight:400,marginLeft:6}}>· Days taken vs remaining</span></div>
              <Btn size="sm" onClick={()=>toast("Leave application","Form opened",{icon:<I as={CalendarLtr20Regular} size={16} color="#219CD6"/>})}>+ Leave Application</Btn>
            </div>
            <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 130px",padding:"10px 14px",background:"#faf9f8",fontSize:10,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e1dfdd"}}>
                <div>Leave type</div><div>Total</div><div>Used</div><div>Remaining</div>
              </div>
              {leaveBalance.map((l,i)=>(
                <div key={l.type} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 130px",padding:"10px 14px",borderBottom:i<leaveBalance.length-1?"1px solid #f3f2f1":"none",fontSize:12,alignItems:"center"}}>
                  <div style={{fontWeight:600,color:"#201f1e"}}>{l.type}</div>
                  <div style={{color:"#605e5c"}}>{l.total} days</div>
                  <div style={{color:"#605e5c"}}>{l.used} days</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1,height:4,background:"#f3f2f1",borderRadius:100,overflow:"hidden"}}><div style={{height:"100%",width:`${(l.remaining/l.total)*100}%`,background:"#219CD6"}}/></div>
                    <span style={{fontSize:11,color:"#201f1e",fontWeight:600}}>{l.remaining}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application / History */}
          <div>
            <div style={{display:"flex",borderBottom:"1px solid #e1dfdd",marginBottom:12}}>
              {[{id:"application",label:"Application"},{id:"history",label:"History"}].map(t=>(
                <div key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?"#219CD6":"#605e5c",borderBottom:tab===t.id?"2px solid #219CD6":"2px solid transparent",marginBottom:-1}}>{t.label}</div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {(tab==="application"?applications:history).map((a,i)=>(
                <div key={i} className="fade-up" style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"12px 14px",display:"flex",alignItems:"center",gap:12,animationDelay:`${i*0.04}s`}}>
                  <div style={{width:36,height:36,borderRadius:4,background:a.statusColor+"18",color:a.statusColor,display:"grid",placeItems:"center",flexShrink:0}}><I as={CalendarLtr20Regular} size={18}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{a.type}</div>
                    <div style={{fontSize:11,color:"#605e5c"}}>{a.dates} · {a.reason}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${a.statusColor}55`,color:a.statusColor,whiteSpace:"nowrap"}}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Overtime chart */}
          <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:"#201f1e"}}>Last 6 months overtime</div>
                <div style={{fontSize:11,color:"#a19f9d"}}>Hours captured per remotely scheduled rostered period</div>
              </div>
              <span style={{fontSize:11,color:"#605e5c"}}>Total {overtime.reduce((s,d)=>s+d.hours,0).toFixed(1)} hr</span>
            </div>
            <OvertimeChart data={overtime}/>
          </div>
        </div>
      </div>
    </div>
    {showPromote&&<PromotionEventModal employee={employee} onClose={()=>setShowPromote(false)}/>}
    {showTouchpoint&&<TouchpointModal employee={employee} onClose={()=>setShowTouchpoint(false)}/>}
  </div>;
}

// ─── Rehydration Cost Modal ───────────────────────────────────────────────────
function TierBadge({tier,size="md"}){
  const t=TIER_META[tier]||TIER_META.hot;
  const sz=size==="sm"?{fontSize:9,padding:"1px 6px",iconSize:11}:{fontSize:10,padding:"2px 8px",iconSize:12};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:sz.fontSize,fontWeight:600,padding:sz.padding,borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${t.color}55`,color:t.color,whiteSpace:"nowrap",background:`${t.color}0c`}}>
    <I as={t.icon} size={sz.iconSize}/>{t.label}
  </span>;
}
function RehydrationModal({doc,action,onClose,onComplete}){
  const {dispatch}=useContext(AppContext);
  const toast=useToast();
  const [priority,setPriority]=useState(doc.tier==="archive"?"standard":"standard");
  const [busy,setBusy]=useState(false);
  const t=TIER_META[doc.tier];
  const sizeMB=(doc.sizeBytes/(1024*1024)).toFixed(1);
  const standardCost=rehydrationCost(doc,"standard");
  const highCost=rehydrationCost(doc,"high");
  const standardWait=rehydrationWait(doc,"standard");
  const highWait=rehydrationWait(doc,"high");
  const cost=priority==="high"?highCost:standardCost;
  const wait=priority==="high"?highWait:standardWait;
  const monthlySaved=(doc.sizeBytes/(1024*1024*1024))*(TIER_META.hot.storagePerGBmo-t.storagePerGBmo)*12;
  const submit=()=>{
    setBusy(true);
    setTimeout(()=>{
      dispatch({type:"REQUEST_REHYDRATE",docId:doc.id,priority,etaText:wait,totalCost:cost,docName:doc.name});
      toast(`Rehydration requested · ${formatZAR(cost)}`,`${doc.name} · ETA ${wait}`,{icon:<I as={Hourglass20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});
      onClose();
      if(onComplete) onComplete();
    },1800);
  };
  return <Modal title="Rehydrate from Cold Storage" onClose={onClose} width={520}>
    <div style={{padding:20}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 14px",background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4,marginBottom:14}}>
        <FileIcon type={doc.type} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"#201f1e",marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{doc.name}</div>
          <div style={{fontSize:11,color:"#605e5c",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span>{doc.size}</span>
            <span style={{color:"#c8c6c4"}}>·</span>
            <TierBadge tier={doc.tier} size="sm"/>
            <span style={{color:"#c8c6c4"}}>·</span>
            <span>Tiered {doc.tieredAt}</span>
          </div>
        </div>
      </div>
      <div style={{padding:"10px 14px",background:"#fff4ce",border:"1px solid #f0c000",borderRadius:4,marginBottom:14,fontSize:12,color:"#7a5700",display:"flex",alignItems:"flex-start",gap:8}}>
        <I as={Receipt20Regular} size={16}/>
        <span>This document is in <strong>{t.label}</strong> storage. Retrieval incurs a transaction fee plus per-GB egress (Azure Blob, SA North). Rehydrated documents return to <strong>Hot</strong> tier and re-tier automatically per lifecycle policy.</span>
      </div>

      <div style={{fontSize:11,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Choose retrieval priority</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[{key:"standard",label:"Standard",cost:standardCost,wait:standardWait,desc:doc.tier==="archive"?"Cheapest. Multi-hour wait.":"Default retrieval."},{key:"high",label:"High Priority",cost:highCost,wait:highWait,desc:doc.tier==="archive"?"Sub-hour rehydration at premium.":"Skip the queue."}].map(opt=>(
          <div key={opt.key} onClick={()=>setPriority(opt.key)} style={{padding:"12px 14px",border:`1px solid ${priority===opt.key?"#219CD6":"#e1dfdd"}`,borderRadius:4,cursor:"pointer",background:priority===opt.key?"#deecf9":"#fff",transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:600,color:priority===opt.key?"#219CD6":"#201f1e"}}>{opt.label}</span>
              <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${priority===opt.key?"#219CD6":"#c8c6c4"}`,background:priority===opt.key?"#219CD6":"#fff",display:"grid",placeItems:"center"}}>{priority===opt.key&&<div style={{width:5,height:5,borderRadius:"50%",background:"#fff"}}/>}</div>
            </div>
            <div style={{fontSize:18,fontWeight:700,color:priority===opt.key?"#219CD6":"#201f1e",marginBottom:2}}>{formatZAR(opt.cost)}</div>
            <div style={{fontSize:10,color:"#605e5c",display:"inline-flex",alignItems:"center",gap:4}}><I as={Hourglass20Regular} size={11}/>{opt.wait}</div>
            <div style={{fontSize:10,color:"#a19f9d",marginTop:4}}>{opt.desc}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"10px 14px",background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4,marginBottom:14,fontSize:11}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",color:"#605e5c"}}><span>Read transaction fee</span><span>{formatZAR(t.txPerReq*(priority==="high"?3.5:1))}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",color:"#605e5c"}}><span>Data egress · {sizeMB} MB @ {formatZAR(t.readPerGB*(priority==="high"?3.5:1))}/GB</span><span>{formatZAR((doc.sizeBytes/(1024*1024*1024))*t.readPerGB*(priority==="high"?3.5:1))}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0 3px",borderTop:"1px solid #e1dfdd",color:"#201f1e",fontWeight:700,marginTop:4}}><span>Total charge</span><span>{formatZAR(cost)}</span></div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",color:"#a19f9d",fontSize:10}}><span>Annual storage saving (vs Hot tier)</span><span>{formatZAR(monthlySaved)}/yr</span></div>
      </div>

      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="secondary" onClick={onClose} disabled={busy}>Cancel</Btn>
        <Btn onClick={submit} disabled={busy}>{busy?"Submitting…":<><I as={CloudSync20Regular} size={14}/> Approve · {formatZAR(cost)}</>}</Btn>
      </div>
    </div>
  </Modal>;
}

// ─── Ingest View ──────────────────────────────────────────────────────────────
const SCANNERS = [
  {id:"sc1",name:"Fujitsu fi-7600",location:"Lobby (Pretoria HQ)",status:"online",lastSeen:"Just now",speed:"100 ppm",adf:true,agent:"v2.4.1"},
  {id:"sc2",name:"Epson DS-32000",location:"Archive Room — Floor 3",status:"online",lastSeen:"2 min ago",speed:"90 ppm",adf:true,agent:"v2.4.1"},
  {id:"sc3",name:"Brother MFC-L8900 (MFP)",location:"HR Office",status:"offline",lastSeen:"4 hr ago",speed:"42 ppm",adf:true,agent:"v2.3.0 (update available)"},
];
function ScannerCard({scanner,selected,onSelect}){
  const ok=scanner.status==="online";
  return <div onClick={()=>onSelect(scanner.id)} style={{padding:"12px 14px",border:`1px solid ${selected?"#219CD6":"#e1dfdd"}`,borderRadius:4,cursor:"pointer",background:selected?"#deecf9":"#fff",transition:"all 0.15s"}}>
    <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
      <div style={{width:36,height:36,borderRadius:4,background:ok?"#dff6dd":"#fde7e9",color:ok?"#107c10":"#a4262c",display:"grid",placeItems:"center",flexShrink:0}}><I as={Scan20Regular} size={20}/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
          <span style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{scanner.name}</span>
          <span style={{fontSize:9,fontWeight:600,padding:"1px 6px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${ok?"#107c1055":"#a4262c55"}`,color:ok?"#107c10":"#a4262c"}}>{scanner.status}</span>
        </div>
        <div style={{fontSize:11,color:"#605e5c",marginBottom:4}}>{scanner.location}</div>
        <div style={{fontSize:10,color:"#a19f9d",display:"flex",gap:10,flexWrap:"wrap"}}>
          <span>{scanner.speed}</span>
          {scanner.adf&&<span style={{display:"inline-flex",alignItems:"center",gap:3}}><I as={DocumentArrowUp20Regular} size={11}/>ADF</span>}
          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><I as={PlugConnected20Regular} size={11}/>Agent {scanner.agent}</span>
        </div>
      </div>
    </div>
  </div>;
}
function ScanProgressStream({onDone}){
  const [step,setStep]=useState(0);
  const events=[
    {label:"Establishing connection to local agent",icon:PlugConnected20Regular,detail:"Handshake · TLS · agent v2.4.1"},
    {label:"Scanning page 1 of 8",icon:Scan20Regular,detail:"A4 · 300 dpi · Colour"},
    {label:"Scanning page 5 of 8",icon:Scan20Regular,detail:"OCR running on local agent · 32 pps"},
    {label:"Detected separator sheet · splitting batch",icon:BarcodeScanner20Regular,detail:"3 documents identified by barcode"},
    {label:"Indexing OCR text · extracting metadata",icon:DataHistogram20Regular,detail:"Auto-classified · 3 docs"},
    {label:"Uploading to storage · Hot tier",icon:CloudSync20Regular,detail:"3 documents · 18.2 MB total"},
    {label:"Complete",icon:CheckmarkCircle20Filled,detail:"3 documents created · indexed · searchable"},
  ];
  useEffect(()=>{
    if(step>=events.length-1){if(onDone)setTimeout(onDone,800);return;}
    const t=setTimeout(()=>setStep(s=>s+1),900);
    return ()=>clearTimeout(t);
  },[step]);
  return <div style={{padding:"12px 14px",background:"#faf9f8",border:"1px solid #e1dfdd",borderRadius:4}}>
    {events.slice(0,step+1).map((e,i)=>{
      const done=i<step;
      const active=i===step&&i<events.length-1;
      const final=i===events.length-1&&i===step;
      return <div key={i} className="fade-up" style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<step?"1px solid #f3f2f1":"none"}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:done||final?"#107c10":"#219CD6",color:"#fff",display:"grid",placeItems:"center",flexShrink:0}}>
          {done||final?<I as={Checkmark20Regular} size={12}/>:active?<div style={{width:8,height:8,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.5)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/>:<I as={e.icon} size={12}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:600,color:"#201f1e"}}>{e.label}</div>
          <div style={{fontSize:10,color:"#a19f9d"}}>{e.detail}</div>
        </div>
      </div>;
    })}
  </div>;
}
function ScanView(){
  const {state,dispatch}=useContext(AppContext);
  const toast=useToast();
  const [selectedScanner,setSelectedScanner]=useState("sc1");
  const [config,setConfig]=useState({size:"A4",color:"colour",dpi:"300",separator:true,destination:"HR",ocrLang:"English",naming:"{date}-{batch}-{seq}"});
  const [scanning,setScanning]=useState(false);
  const onlineScanners=state.scanJobs;
  const startScan=()=>{
    if(SCANNERS.find(s=>s.id===selectedScanner)?.status!=="online"){
      toast("Scanner offline","The selected scanner is not reachable. Try another device.",{icon:<I as={Warning20Regular} size={16} color="#a4262c"/>,color:"#a4262c"});
      return;
    }
    setScanning(true);
  };
  const finishScan=()=>{
    setScanning(false);
    dispatch({type:"ADD_SCAN_JOB",job:{id:Date.now(),name:`${config.destination} Batch — ${new Date().toISOString().split("T")[0]}`,scanner:SCANNERS.find(s=>s.id===selectedScanner)?.name,operator:"You",pages:8,documentsCreated:3,status:"completed",startedAt:"Just now",finishedAt:"Just now",separator:config.separator}});
    toast("Scan complete","3 documents created · indexed · searchable",{icon:<I as={CheckmarkCircle20Filled} size={16} color="#107c10"/>,color:"#107c10"});
  };
  return <div style={{padding:"20px 24px",overflow:"auto",height:"100%",display:"flex",flexDirection:"column",gap:18}}>
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#201f1e"}}>Connected scanners</div>
          <div style={{fontSize:11,color:"#605e5c"}}>{SCANNERS.filter(s=>s.status==="online").length} online · {SCANNERS.filter(s=>s.status==="offline").length} offline · agent runs locally for offline-capable OCR</div>
        </div>
        <Btn size="sm" variant="secondary"><I as={PlugConnected20Regular} size={13}/> Add device</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:10}}>
        {SCANNERS.map(s=><ScannerCard key={s.id} scanner={s} selected={selectedScanner===s.id} onSelect={setSelectedScanner}/>)}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,padding:"16px 18px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#201f1e",marginBottom:10}}>Job configuration</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>
          <Select label="Paper size" value={config.size} onChange={e=>setConfig({...config,size:e.target.value})} options={["A4","A3","Legal","Letter"]}/>
          <Select label="Colour mode" value={config.color} onChange={e=>setConfig({...config,color:e.target.value})} options={[{value:"colour",label:"Colour"},{value:"gray",label:"Greyscale"},{value:"bw",label:"Black & white"}]}/>
          <Select label="Resolution" value={config.dpi} onChange={e=>setConfig({...config,dpi:e.target.value})} options={[{value:"200",label:"200 dpi"},{value:"300",label:"300 dpi (recommended)"},{value:"600",label:"600 dpi"}]}/>
          <Select label="Destination folder" value={config.destination} onChange={e=>setConfig({...config,destination:e.target.value})} options={FOLDERS}/>
          <Select label="OCR language" value={config.ocrLang} onChange={e=>setConfig({...config,ocrLang:e.target.value})} options={["English","Afrikaans","isiZulu","isiXhosa","Sesotho","Setswana"]}/>
          <Input label="Naming pattern" value={config.naming} onChange={e=>setConfig({...config,naming:e.target.value})}/>
        </div>
        <div onClick={()=>setConfig({...config,separator:!config.separator})} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:config.separator?"#deecf9":"#faf9f8",border:`1px solid ${config.separator?"#219CD6":"#e1dfdd"}`,borderRadius:4,cursor:"pointer",marginTop:6,marginBottom:14,transition:"all 0.15s"}}>
          <I as={BarcodeScanner20Regular} size={18} color={config.separator?"#219CD6":"#605e5c"}/>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:600,color:config.separator?"#219CD6":"#201f1e"}}>Use barcode separator sheets</div>
            <div style={{fontSize:10,color:"#605e5c"}}>Auto-split batch into separate documents and route by barcode classification</div>
          </div>
          <div style={{width:34,height:18,borderRadius:100,background:config.separator?"#219CD6":"#c8c6c4",position:"relative",transition:"background 0.2s"}}><div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:config.separator?18:2,transition:"left 0.2s"}}/></div>
        </div>
        <Btn onClick={startScan} disabled={scanning} style={{width:"100%"}}>{scanning?<><I as={Hourglass20Regular} size={14}/> Scanning…</>:<><I as={Scan20Regular} size={14}/> Start scan</>}</Btn>
      </div>
      <div>
        <div style={{fontSize:13,fontWeight:700,color:"#201f1e",marginBottom:10}}>Live progress</div>
        {scanning?<ScanProgressStream onDone={finishScan}/>:<div style={{padding:"32px 14px",background:"#faf9f8",border:"1px dashed #e1dfdd",borderRadius:4,textAlign:"center",color:"#a19f9d",fontSize:12}}>
          <div style={{marginBottom:8,color:"#c8c6c4"}}><I as={Scan20Regular} size={32}/></div>
          <div>No active scan job. Configure and press <strong>Start scan</strong>.</div>
        </div>}
      </div>
    </div>

    <div>
      <div style={{fontSize:13,fontWeight:700,color:"#201f1e",marginBottom:10}}>Recent scan jobs</div>
      <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 1fr 110px 110px 130px",padding:"10px 14px",background:"#faf9f8",fontSize:10,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e1dfdd"}}>
          <div>Job</div><div>Scanner</div><div>Operator</div><div>Pages</div><div>Docs created</div><div>Status</div>
        </div>
        {state.scanJobs.map((j,i)=>(
          <div key={j.id} className="fade-up" style={{display:"grid",gridTemplateColumns:"1.6fr 1.4fr 1fr 110px 110px 130px",padding:"10px 14px",borderBottom:i<state.scanJobs.length-1?"1px solid #f3f2f1":"none",fontSize:12,alignItems:"center",animationDelay:`${i*0.03}s`}}>
            <div>
              <div style={{fontWeight:600,color:"#201f1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.name}</div>
              <div style={{fontSize:10,color:"#a19f9d",marginTop:1,display:"flex",gap:6,alignItems:"center"}}>{j.separator&&<><I as={BarcodeScanner20Regular} size={10}/>Separator sheets</>}{j.error&&<span style={{color:"#a4262c"}}>· {j.error}</span>}</div>
            </div>
            <div style={{color:"#605e5c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.scanner}</div>
            <div style={{color:"#605e5c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.operator}</div>
            <div style={{color:"#605e5c"}}>{j.pages}</div>
            <div style={{color:"#605e5c"}}>{j.documentsCreated}</div>
            <div>
              <span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${j.status==="completed"?"#107c1055":j.status==="failed"?"#a4262c55":"#c8a11655"}`,color:j.status==="completed"?"#107c10":j.status==="failed"?"#a4262c":"#7a5700",whiteSpace:"nowrap"}}>{j.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}
function PrintQueueView(){
  const {state}=useContext(AppContext);
  return <div style={{padding:"20px 24px",overflow:"auto",height:"100%"}}>
    <div style={{marginBottom:14}}>
      <div style={{fontSize:14,fontWeight:700,color:"#201f1e"}}>Outbound print queue</div>
      <div style={{fontSize:11,color:"#605e5c"}}>Documents sent to networked printers · certified copies, Z83 packs, retention reports</div>
    </div>
    <div style={{background:"#fff",border:"1px solid #e1dfdd",borderRadius:4,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"1.8fr 80px 1.4fr 1fr 130px 110px",padding:"10px 14px",background:"#faf9f8",fontSize:10,fontWeight:600,color:"#605e5c",textTransform:"uppercase",letterSpacing:"0.5px",borderBottom:"1px solid #e1dfdd"}}>
        <div>Document</div><div>Pages</div><div>Printer</div><div>Sent by</div><div>Sent at</div><div>Status</div>
      </div>
      {state.printJobs.map((j,i)=>(
        <div key={j.id} className="fade-up" style={{display:"grid",gridTemplateColumns:"1.8fr 80px 1.4fr 1fr 130px 110px",padding:"10px 14px",borderBottom:i<state.printJobs.length-1?"1px solid #f3f2f1":"none",fontSize:12,alignItems:"center",animationDelay:`${i*0.03}s`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}><I as={Print20Regular} size={14} color="#605e5c"/><span style={{fontWeight:600,color:"#201f1e",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.doc}</span></div>
          <div style={{color:"#605e5c"}}>{j.pages}</div>
          <div style={{color:"#605e5c",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{j.printer}</div>
          <div style={{color:"#605e5c"}}>{j.sentBy}</div>
          <div style={{color:"#605e5c",whiteSpace:"nowrap"}}>{j.sentAt}</div>
          <div><span style={{fontSize:10,fontWeight:600,padding:"1px 7px",borderRadius:2,letterSpacing:"0.3px",textTransform:"uppercase",border:`1px solid ${j.status==="completed"?"#107c1055":j.status==="printing"?"#219CD655":"#c8a11655"}`,color:j.status==="completed"?"#107c10":j.status==="printing"?"#219CD6":"#7a5700",whiteSpace:"nowrap"}}>{j.status}</span></div>
        </div>
      ))}
    </div>
  </div>;
}
function IngestView(){
  const [tab,setTab]=useState("scan");
  return <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
    <div style={{padding:"14px 24px",borderBottom:"1px solid #e1dfdd",background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:"#201f1e"}}>Ingest</div>
        <div style={{fontSize:12,color:"#605e5c",marginTop:1}}>Bring paper documents into the system · scanner intake & outbound print queue</div>
      </div>
      <div style={{display:"flex",gap:6,background:"#f3f2f1",borderRadius:4,padding:3}}>
        {[{id:"scan",label:"Scan",icon:Scan20Regular},{id:"print",label:"Print queue",icon:Print20Regular}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{background:tab===t.id?"#fff":"transparent",border:"none",borderRadius:3,padding:"5px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:tab===t.id?"#219CD6":"#605e5c",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",boxShadow:tab===t.id?"0 1px 3px rgba(0,0,0,0.08)":"none"}}><I as={t.icon} size={13}/>{t.label}</button>
        ))}
      </div>
    </div>
    <CommandBar active="ingest"/>
    <div style={{flex:1,overflow:"hidden"}}>
      {tab==="scan"?<ScanView/>:<PrintQueueView/>}
    </div>
  </div>;
}

// ─── Command Bar (Fluent contextual toolbar) ──────────────────────────────────
function CommandBtn({icon,label,onClick,danger,disabled}){
  return <button onClick={disabled?undefined:onClick} disabled={disabled} style={{background:"transparent",border:"none",padding:"0 12px",height:42,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontSize:13,color:disabled?"#a19f9d":danger?"#a4262c":"rgba(26,26,26,0.78)",display:"inline-flex",alignItems:"center",gap:7,whiteSpace:"nowrap",borderRadius:6,opacity:disabled?0.6:1,transition:"background 0.15s"}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.background=danger?"#fde7e9":"#f3f2f1";}} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
    <I as={icon} size={15}/>
    <span>{label}</span>
  </button>;
}
function CmdDivider(){return <div style={{width:1,alignSelf:"stretch",background:"#E1E1E2",margin:"0 4px"}}/>;}
function CommandBar({active,onBack,canBack}){
  const toast=useToast();
  const flash=(label)=>toast(label,"Command queued",{icon:<I as={Info20Regular} size={16} color="#219CD6"/>,color:"#219CD6"});
  const groups=(()=>{
    switch(active){
      case "docs": return [
        [{icon:DocumentArrowUp20Regular,label:"Upload",onClick:()=>flash("Upload document")},{icon:Folder20Regular,label:"New folder",onClick:()=>flash("New folder created")},{icon:Save20Regular,label:"Save as",onClick:()=>flash("Save as…")}],
        [{icon:Edit20Regular,label:"Edit",onClick:()=>flash("Edit metadata")},{icon:Folder20Regular,label:"Move",onClick:()=>flash("Move to folder")},{icon:Delete20Regular,label:"Delete",danger:true,onClick:()=>flash("Delete document")}],
        [{icon:Info20Regular,label:"Properties",onClick:()=>flash("Properties panel")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export PDF",onClick:()=>flash("Exporting PDF")},{right:true,icon:ArrowDownload20Regular,label:"Export CSV",onClick:()=>flash("Exporting CSV")}],
      ];
      case "ingest": return [
        [{icon:Scan20Regular,label:"Start scan",onClick:()=>flash("Starting scan job")},{icon:Print20Regular,label:"New print job",onClick:()=>flash("Print job queued")}],
        [{icon:PlugConnected20Regular,label:"Manage scanners",onClick:()=>flash("Scanner devices")},{icon:BarcodeScanner20Regular,label:"Test separator",onClick:()=>flash("Testing separator sheet")}],
        [{icon:Info20Regular,label:"Properties",onClick:()=>flash("Properties panel")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export job log",onClick:()=>flash("Exporting job log")}],
      ];
      case "registry": return [
        [{icon:Add20Regular,label:"New Z83",onClick:()=>flash("Open Z83 form")},{icon:DocumentArrowUp20Regular,label:"Bulk import",onClick:()=>flash("Bulk import Z83")}],
        [{icon:Edit20Regular,label:"Edit",onClick:()=>flash("Edit record")},{icon:Archive20Regular,label:"Archive",onClick:()=>flash("Archive record")}],
        [{icon:ContactCard20Regular,label:"Print roster",onClick:()=>flash("Printing roster")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export PDF",onClick:()=>flash("Exporting PDF")},{right:true,icon:ArrowDownload20Regular,label:"Export CSV",onClick:()=>flash("Exporting CSV")}],
      ];
      case "workflow": return [
        [{icon:Add20Regular,label:"New workflow",onClick:()=>flash("Open workflow builder")}],
        [{icon:Checkmark20Regular,label:"Bulk approve",onClick:()=>flash("Bulk approve queued")},{icon:Dismiss20Regular,label:"Bulk reject",danger:true,onClick:()=>flash("Bulk reject queued")}],
        [{icon:Info20Regular,label:"Properties",onClick:()=>flash("Properties panel")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export queue",onClick:()=>flash("Exporting workflow queue")}],
      ];
      case "search": return [
        [{icon:Bookmark20Regular,label:"Save search",onClick:()=>flash("Search saved")},{icon:Dismiss20Regular,label:"Clear",onClick:()=>flash("Cleared filters")}],
        [{icon:Info20Regular,label:"Search tips",onClick:()=>flash("Search syntax")}],
      ];
      case "audit": return [
        [{icon:CalendarLtr20Regular,label:"Date range",onClick:()=>flash("Date filter")},{icon:Filter20Regular,label:"Advanced filter",onClick:()=>flash("Advanced filter")}],
        [{icon:Info20Regular,label:"Retention policy",onClick:()=>flash("Audit retention: 7yr")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export PDF",onClick:()=>flash("Exporting PDF")},{right:true,icon:ArrowDownload20Regular,label:"Export CSV",onClick:()=>flash("Exporting CSV")}],
      ];
      case "retention": return [
        [{icon:Add20Regular,label:"New policy",onClick:()=>flash("New retention policy")},{icon:Hourglass20Regular,label:"Run now",onClick:()=>flash("Running retention job")}],
        [{icon:Edit20Regular,label:"Edit",onClick:()=>flash("Edit policy")},{icon:Delete20Regular,label:"Delete",danger:true,onClick:()=>flash("Delete policy")}],
        [{icon:Info20Regular,label:"Compliance log",onClick:()=>flash("Compliance log")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export schedule",onClick:()=>flash("Exporting schedule")}],
      ];
      case "profile": return [
        [{icon:Edit20Regular,label:"Edit profile",onClick:()=>flash("Edit profile")},{icon:Print20Regular,label:"Print record",onClick:()=>flash("Printing employee record")}],
        [{icon:Mail20Regular,label:"Message",onClick:()=>flash("Compose message")},{icon:CalendarLtr20Regular,label:"Schedule",onClick:()=>flash("Open scheduler")}],
        [{right:true,icon:ArrowDownload20Regular,label:"Export full record",onClick:()=>flash("Exporting full record")}],
      ];
      default: return [];
    }
  })();
  if(groups.length===0) return null;
  return <div style={{padding:"8px 16px 12px 16px",background:"transparent",flexShrink:0}}>
    <div style={{background:"#fff",borderRadius:4,border:"1px solid #E1E1E2",boxShadow:"0 1px 3px rgba(26,26,26,0.06)",height:46,display:"flex",alignItems:"center",padding:"0 8px",gap:0,overflowX:"auto"}}>
      <button onClick={canBack?onBack:undefined} disabled={!canBack} title={canBack?"Back":"Nothing to go back to"} style={{background:"transparent",border:"none",padding:"0 8px",height:42,cursor:canBack?"pointer":"not-allowed",color:canBack?"#52525B":"#c8c6c4",display:"inline-flex",alignItems:"center",borderRadius:6,opacity:canBack?1:0.5,transition:"background 0.15s"}} onMouseEnter={e=>{if(canBack)e.currentTarget.style.background="#f3f2f1";}} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <I as={ArrowLeft20Regular} size={18}/>
      </button>
      <CmdDivider/>
      {groups.filter(g=>!g[0]?.right).map((items,gi)=>(
        <Fragment key={"l"+gi}>
          {gi>0&&<CmdDivider/>}
          {items.map((item,ii)=><CommandBtn key={"l"+gi+"-"+ii} {...item}/>)}
        </Fragment>
      ))}
      <div style={{flex:1}}/>
      {groups.filter(g=>g[0]?.right).map((items,gi)=>(
        <Fragment key={"r"+gi}>
          {gi>0&&<CmdDivider/>}
          <CmdDivider/>
          {items.map((item,ii)=><CommandBtn key={"r"+gi+"-"+ii} {...item}/>)}
        </Fragment>
      ))}
    </div>
  </div>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({active,setActive,collapsed,setCollapsed}){
  const {state}=useContext(AppContext);
  const unread=state.notifications.filter(n=>!n.read).length;
  const pendingWf=state.workflows.filter(w=>w.assigneeId==="u4").length;
  const nav=[
    {id:"docs",label:"Documents",icon:<DocIco/>},
    {id:"ingest",label:"Ingest",icon:<IngestIco/>},
    {id:"registry",label:"The Registry",icon:<RegistryIco/>,badge:state.employees.length},
    {id:"workflow",label:"Workflows",icon:<WfIco/>,badge:pendingWf},
    {id:"search",label:"Search",icon:<SearchIco size={16}/>},
    {id:"audit",label:"Audit Log",icon:<AuditIco/>},
    {id:"retention",label:"Retention",icon:<RetentionIco/>},
  ];
  return <div style={{width:collapsed?52:215,background:"rgba(255,255,255,0.78)",backdropFilter:"blur(40px) saturate(180%)",borderRight:"1px solid rgba(0,0,0,0.08)",display:"flex",flexDirection:"column",transition:"width 0.25s ease",flexShrink:0,height:"100%",overflow:"hidden"}}>
    <nav style={{flex:1,padding:"10px 0"}}>
      {nav.map(item=>(
        <div key={item.id} onClick={()=>setActive(item.id)} style={{display:"flex",alignItems:"center",gap:8,padding:collapsed?"9px 14px":"9px 12px",cursor:"pointer",position:"relative",borderRadius:6,margin:"1px 5px",background:active===item.id?"#deecf9":"transparent",color:active===item.id?"#219CD6":"#323130",transition:"background 0.15s",fontWeight:active===item.id?600:400}} onMouseEnter={e=>{if(active!==item.id)e.currentTarget.style.background="rgba(0,0,0,0.04)";}} onMouseLeave={e=>{if(active!==item.id)e.currentTarget.style.background="transparent";}}>
          <div style={{flexShrink:0,color:active===item.id?"#219CD6":"#605e5c"}}>{item.icon}</div>
          {!collapsed&&<span style={{fontSize:13,whiteSpace:"nowrap",flex:1}}>{item.label}</span>}
          {!collapsed&&item.badge>0&&<Badge count={item.badge}/>}
          {collapsed&&item.badge>0&&<div style={{position:"absolute",top:5,right:5,width:7,height:7,background:"#219CD6",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.8)"}}/>}
        </div>
      ))}
    </nav>
    <div style={{padding:collapsed?"10px":"10px 12px",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Avatar userId="u4" size={26}/>
        {!collapsed&&<div><div style={{fontSize:11,fontWeight:700}}>You (Admin)</div><div style={{fontSize:10,color:"#a19f9d"}}>ezra360.co.za</div></div>}
      </div>
    </div>
  </div>;
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({active,dispatch,state,collapsed,setCollapsed,onCmdPalette,onActivity,setActive}){
  const [showNotif,setShowNotif]=useState(false);
  const [showQuickAdd,setShowQuickAdd]=useState(false);
  const [showUserMenu,setShowUserMenu]=useState(false);
  const qaRef=useRef(),umRef=useRef();
  useEffect(()=>{
    const h=(e)=>{
      if(showQuickAdd&&qaRef.current&&!qaRef.current.contains(e.target)) setShowQuickAdd(false);
      if(showUserMenu&&umRef.current&&!umRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[showQuickAdd,showUserMenu]);
  const unread=state.notifications.filter(n=>!n.read).length;
  const me=state.currentUser;
  const quickAddItems=[
    {label:"Upload document",sub:"Hot tier · Documents",icon:DocumentArrowUp20Regular,action:()=>setActive("docs")},
    {label:"Start scan job",sub:"Auto-feeder + barcode separator",icon:Scan20Regular,action:()=>setActive("ingest")},
    {label:"Z83 inception",sub:"New public-servant record",icon:PersonAvailable20Regular,action:()=>setActive("registry")},
    {label:"New workflow",sub:"Approval chain",icon:Share20Regular,action:()=>setActive("workflow")},
  ];
  const iconBtnStyle={background:"transparent",border:"1px solid rgba(255,255,255,0.28)",borderRadius:8,padding:"7px 9px",cursor:"pointer",color:"#fff",display:"inline-flex",alignItems:"center",fontFamily:"inherit",position:"relative",transition:"background 0.15s"};
  return <div style={{padding:"10px 18px",borderBottom:"2px solid #1D4FD7",background:"#219CD6",display:"flex",alignItems:"center",gap:14,flexShrink:0,position:"relative",zIndex:100,minHeight:64,boxSizing:"border-box"}}>
    {/* Sidebar toggle */}
    <button onClick={()=>setCollapsed(c=>!c)} title={collapsed?"Expand sidebar":"Collapse sidebar"} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.28)",borderRadius:8,padding:"7px 9px",cursor:"pointer",color:"#fff",display:"inline-flex",alignItems:"center",fontFamily:"inherit",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <I as={LineHorizontal320Regular} size={16}/>
    </button>
    {/* Logo */}
    <img src="/logo.svg" alt="Ezra360 DMS" style={{height:32,filter:"brightness(0) invert(1)",flexShrink:0}}/>

    {/* Search input — opens command palette */}
    <div style={{flex:1,maxWidth:560,position:"relative",margin:"0 auto"}}>
      <input
        readOnly
        onClick={onCmdPalette}
        placeholder="Search documents, employees, or jump to…"
        style={{width:"100%",padding:"10px 40px 10px 14px",border:"1px solid #E1E1E2",borderRadius:8,fontSize:13,background:"#F8FAFC",color:"#605e5c",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",fontFamily:"inherit",boxSizing:"border-box"}}
      />
      <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#605e5c",pointerEvents:"none",display:"inline-flex"}}><I as={Search20Regular} size={16}/></div>
      <kbd style={{position:"absolute",right:38,top:"50%",transform:"translateY(-50%)",fontSize:10,background:"#fff",border:"1px solid #e0dede",borderRadius:3,padding:"2px 5px",color:"#a19f9d",pointerEvents:"none"}}>⌘K</kbd>
    </div>

    {/* Right cluster */}
    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
      {/* Quick add */}
      <div ref={qaRef} style={{position:"relative"}}>
        <button onClick={()=>setShowQuickAdd(v=>!v)} style={{background:"#1D4FD7",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",color:"#fff",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6,fontFamily:"inherit",whiteSpace:"nowrap"}}>
          <I as={Add20Regular} size={14}/> Quick add <I as={ChevronDown20Regular} size={14} style={{transform:showQuickAdd?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
        </button>
        {showQuickAdd&&<div className="scale-in" style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:280,background:"#fff",border:"1px solid #e1dfdd",borderRadius:6,boxShadow:"0 12px 32px rgba(0,0,0,0.18)",zIndex:1000,padding:6}}>
          {quickAddItems.map(q=>(
            <div key={q.label} onClick={()=>{q.action();setShowQuickAdd(false);}} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 12px",cursor:"pointer",borderRadius:4,color:"#201f1e"}} onMouseEnter={e=>e.currentTarget.style.background="#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{display:"inline-flex",color:"#219CD6",marginTop:1}}><I as={q.icon} size={16}/></span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{q.label}</div>
                <div style={{fontSize:11,color:"#605e5c"}}>{q.sub}</div>
              </div>
            </div>
          ))}
        </div>}
      </div>

      {/* Activity feed */}
      <button onClick={onActivity} title="Activity feed" style={iconBtnStyle} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <I as={History20Regular} size={16}/>
      </button>

      {/* Notifications */}
      <div style={{position:"relative"}}>
        <button onClick={()=>setShowNotif(v=>!v)} title="Notifications" style={iconBtnStyle} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <I as={Alert20Regular} size={16}/>
          {unread>0&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,background:"#a4262c",borderRadius:"50%",display:"grid",placeItems:"center",fontSize:9,fontWeight:700,color:"#fff",border:"2px solid #219CD6"}}>{unread}</div>}
        </button>
        {showNotif&&<NotifDropdown onClose={()=>setShowNotif(false)}/>}
      </div>

      {/* Offline pill */}
      <button onClick={()=>dispatch({type:"TOGGLE_OFFLINE"})} title={state.offline?"Currently offline · click to go online":"Currently online"} style={{background:state.offline?"rgba(164,38,44,0.7)":"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.28)",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#fff",fontSize:11,fontWeight:600,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
        <span style={{width:6,height:6,borderRadius:"50%",background:state.offline?"#fde7e9":"#dff6dd",animation:state.offline?"pulse2 1.5s infinite":"none",display:"inline-block"}}/>
        {state.offline?"Offline":"Live"}
      </button>

      {/* User avatar + menu */}
      <div ref={umRef} style={{position:"relative"}}>
        <button onClick={()=>setShowUserMenu(v=>!v)} style={{background:"transparent",border:"none",borderRadius:100,cursor:"pointer",padding:"2px 6px 2px 2px",display:"inline-flex",alignItems:"center",gap:6,color:"#fff",fontFamily:"inherit"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:me.color,color:"#fff",display:"grid",placeItems:"center",fontSize:13,fontWeight:700,border:"2px solid #fff"}}>{me.initials}</div>
          <I as={ChevronDown20Regular} size={14} style={{transform:showUserMenu?"rotate(180deg)":"none",transition:"transform 0.15s"}}/>
        </button>
        {showUserMenu&&<div className="scale-in" style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:240,background:"#fff",border:"1px solid #e1dfdd",borderRadius:6,boxShadow:"0 12px 32px rgba(0,0,0,0.18)",zIndex:1000,padding:6}}>
          <div style={{padding:"10px 12px",borderBottom:"1px solid #f3f2f1",marginBottom:4,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:me.color,color:"#fff",display:"grid",placeItems:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{me.initials}</div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#201f1e"}}>{me.name}</div>
              <div style={{fontSize:11,color:"#a19f9d"}}>{me.role} · ezra360.co.za</div>
            </div>
          </div>
          {[{label:"Profile settings",icon:Settings20Regular},{label:"Help & support",icon:Info20Regular},{label:"Sign out",icon:Dismiss20Regular,danger:true}].map(item=>(
            <div key={item.label} onClick={()=>setShowUserMenu(false)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderRadius:4,fontSize:13,color:item.danger?"#a4262c":"#201f1e"}} onMouseEnter={e=>e.currentTarget.style.background=item.danger?"#fde7e9":"#f3f2f1"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <I as={item.icon} size={16} color={item.danger?"#a4262c":"#605e5c"}/>
              {item.label}
            </div>
          ))}
        </div>}
      </div>
    </div>
  </div>;
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App(){
  const [state,dispatch]=useReducer(appReducer,initialState);
  const [active,setActive]=useState("docs");
  const [collapsed,setCollapsed]=useState(false);
  const [showCmd,setShowCmd]=useState(false);
  const [showActivity,setShowActivity]=useState(false);

  // Simulate live activity
  useEffect(()=>{
    const activities=[
      {id:Date.now(),user:"Anna L.",userId:"u3",action:"viewed",target:"Q1 Financial Report 2026.pdf",time:"Just now"},
      {id:Date.now()+1,user:"System",userId:"system",action:"auto-indexed",target:"NDA — Beta Partners.docx",time:"Just now"},
      {id:Date.now()+2,user:"Priya S.",userId:"u5",action:"commented on",target:"Employee Handbook v3.docx",time:"Just now"},
    ];
    let idx=0;
    const t=setInterval(()=>{
      dispatch({type:"ADD_ACTIVITY",item:{...activities[idx%activities.length],id:Date.now()}});
      idx++;
    },10000);
    return ()=>clearInterval(t);
  },[]);

  // Cmd+K
  useEffect(()=>{
    const h=(e)=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setShowCmd(v=>!v);}if(e.key==="Escape"){setShowCmd(false);}};
    document.addEventListener("keydown",h);return()=>document.removeEventListener("keydown",h);
  },[]);

  const views={docs:DocsView,ingest:IngestView,registry:RegistryView,workflow:WorkflowView,search:SearchView,audit:AuditView,retention:RetentionView};
  const ActiveView=views[active]||DocsView;
  const [profileEmpId,setProfileEmpId]=useState(null);
  const profileEmp=profileEmpId?state.employees.find(e=>e.id===profileEmpId):null;
  const [navLoading,setNavLoading]=useState(false);
  useEffect(()=>{
    setNavLoading(true);
    const t=setTimeout(()=>setNavLoading(false),1800);
    return ()=>clearTimeout(t);
  },[active,profileEmpId]);

  return <AppContext.Provider value={{state,dispatch,openProfile:setProfileEmpId,closeProfile:()=>setProfileEmpId(null)}}>
    <style>{GS}</style>
    <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden",background:"linear-gradient(150deg,#e8f4fc 0%,#f3f3f1 45%,#faf9f8 100%)",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <TopBar active={active} dispatch={dispatch} state={state} collapsed={collapsed} setCollapsed={setCollapsed} onCmdPalette={()=>setShowCmd(true)} onActivity={()=>setShowActivity(v=>!v)} setActive={setActive}/>
      <div style={{display:"flex",flex:1,overflow:"hidden",position:"relative",minHeight:0}}>
        <Sidebar active={active} setActive={setActive} collapsed={collapsed} setCollapsed={setCollapsed}/>
        <main style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative",minWidth:0}}>
          <TopProgressBar active={navLoading}/>
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>{profileEmp?<EmployeeProfileScreen employee={profileEmp} onClose={()=>setProfileEmpId(null)}/>:<ActiveView/>}</div>
        </main>
        {showActivity&&<ActivityFeed onClose={()=>setShowActivity(false)}/>}
      </div>
    </div>
    {showCmd&&<CommandPalette onClose={()=>setShowCmd(false)} setActive={(v)=>{setActive(v);setShowCmd(false);}}/>}
    <ToastContainer/>
  </AppContext.Provider>;
}
