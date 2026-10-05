// What the two period-end runs are runs *of*.
//
// Depreciation and amortisation are the same kind of thing done to different
// records, so describing them once keeps the three screens that can fire them
// (Fixed Assets, Deferred Expenses, Period Close) saying the same words about
// both. Kept out of the view file so that one exports components and nothing
// else.

// The two runs differ only in what they are a run *of*, so one description keeps
// the screens honest about them being the same kind of thing.
export const RUNS = {
  depreciation: {
    label: "Depreciation",
    noun: "asset",
    subject: (r) => r.asset,
    title: (r) => r.asset.name,
    sub: (r) => r.asset.tag,
    link: (r) => `assets/${r.asset.id}`,
    counter: "Charge",
    posting: "Dr Depreciation / Cr Accumulated depreciation",
    mappingId: "FA-DEP",
  },
  amortisation: {
    label: "Amortisation",
    noun: "deferral",
    subject: (r) => r.deferral,
    title: (r) => r.deferral.description,
    sub: (r) => r.deferral.supplier,
    link: (r) => `deferrals/${r.deferral.id}`,
    counter: "Release",
    posting: "Dr Expense / Cr Prepayment",
    mappingId: "PRE-AMO",
  },
};
