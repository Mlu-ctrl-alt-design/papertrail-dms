// FAQ corpus and keyword retrieval (6.1.5: "FAQ and keyword-based assistance").
//
// This is the tier below intent recognition. When the NLU tier cannot place a
// message against a self-service journey with any confidence, the question is
// matched against this corpus before the bot admits defeat — which is what
// stops an unrecognised message from always becoming an escalation.
//
// The answers are drawn from the OPFA's own published process: the Pension
// Funds Act, the section 30F procedure and the six-week review period.

export const FAQS = [
  {
    id: "faq-what",
    q: "What does the Pension Funds Adjudicator do?",
    kw: ["what", "who", "does", "adjudicator", "opfa", "do", "role", "purpose"],
    a: "The Office of the Pension Funds Adjudicator investigates and determines complaints about pension funds, in terms of the Pension Funds Act, 1956.\n\nOur service is *free*. We are independent of the funds and of the employers.",
  },
  {
    id: "faq-cost",
    q: "How much does it cost to lodge a complaint?",
    kw: ["cost", "fee", "pay", "price", "free", "charge", "money", "expensive"],
    a: "Nothing. Lodging a complaint with the OPFA is *free of charge*, and you do not need a lawyer.\n\nBe careful of anyone who offers to lodge a complaint on your behalf for a fee.",
  },
  {
    id: "faq-duration",
    q: "How long does a complaint take?",
    kw: ["long", "how", "take", "time", "duration", "wait", "waiting", "when", "months", "slow"],
    a: "It depends on the complexity of the matter and how quickly the fund responds.\n\nThe fund is given *30 days* to respond to your complaint. Most matters are determined within *six to nine months* of being lodged.\n\nYou can check your complaint's status here at any time.",
  },
  {
    id: "faq-jurisdiction",
    q: "What complaints can the OPFA deal with?",
    kw: ["can", "jurisdiction", "complaints", "type", "kind", "handle", "deal", "eligible", "accept"],
    a: "We deal with complaints about the administration of a fund, the investment of its assets, or the interpretation and application of its rules — for example:\n\n• Withdrawal benefits not paid\n• Contributions an employer did not pay over\n• Death benefit allocations (section 37C)\n• Transfers between funds\n• Pension interest on divorce\n\nWe *cannot* deal with employment disputes — those go to the CCMA.",
  },
  {
    id: "faq-time-limit",
    q: "Is there a time limit?",
    kw: ["time", "limit", "late", "prescription", "old", "years", "deadline", "expired"],
    a: "Yes. A complaint must be lodged within *three years* of the date on which the act or omission you are complaining about occurred, or of the date you became aware of it.\n\nIf you are outside that period, the Adjudicator may still condone the delay in certain circumstances.",
  },
  {
    id: "faq-determination",
    q: "What happens after a determination is issued?",
    kw: ["determination", "after", "outcome", "decision", "ruling", "judgment", "happens", "next"],
    a: "The determination is sent to you and to the fund at the same time. It has the effect of a *civil court judgment*.\n\nEither party may apply to the High Court to have it set aside, within *six weeks* of the date of the determination. If no application is made, the fund must comply.",
  },
  {
    id: "faq-not-paid",
    q: "The fund still hasn't paid after the determination",
    kw: ["not", "paid", "still", "comply", "ignore", "refuse", "enforce", "after"],
    a: "A determination may be enforced as if it were a judgment of a civil court. You can have it made an order of court and then enforce it through the sheriff.\n\nTell us the fund has not paid and we will follow up.",
  },
  {
    id: "faq-documents",
    q: "What documents do I need?",
    kw: ["documents", "need", "require", "proof", "papers", "id", "payslip", "attach", "send"],
    a: "To investigate a complaint we usually need:\n\n• A copy of your *ID*\n• Your *last payslip* or benefit statement\n• Any *correspondence* with the fund or your employer\n• Your *banking details*, if the complaint is about a payment\n\nYou can send documents to us right here in this chat.",
  },
  {
    id: "faq-fund-first",
    q: "Must I complain to the fund first?",
    kw: ["first", "fund", "before", "must", "complain", "approach", "contact", "directly"],
    a: "Yes. You must first lodge your complaint in writing with the *fund or your employer* and give them *30 days* to respond.\n\nIf they do not respond, or you are not satisfied with the response, you may then bring the complaint to us.",
  },
  {
    id: "faq-withdrawal",
    q: "Why hasn't my withdrawal benefit been paid?",
    kw: ["withdrawal", "benefit", "resigned", "resignation", "left", "job", "payout", "pension", "provident"],
    a: "Common reasons for a delay are:\n\n• The employer has not sent the fund your withdrawal claim form\n• Your tax affairs are not in order, so SARS has not issued a tax directive\n• The fund is holding the benefit against a housing loan or an employer claim\n• Your banking details could not be verified\n\nIf the delay is unreasonable, that is a matter we can investigate.",
  },
  {
    id: "faq-death",
    q: "How are death benefits allocated?",
    kw: ["death", "died", "deceased", "benefit", "beneficiary", "allocate", "37c", "dependant", "nominee"],
    a: "Death benefits are allocated by the *board of the fund* in terms of section 37C of the Act — not by the beneficiary nomination form alone.\n\nThe board must identify all dependants and nominees, and distribute the benefit equitably. The nomination form is a guide, not an instruction. The board has 12 months to trace dependants.",
  },
  {
    id: "faq-contact",
    q: "How else can I contact the OPFA?",
    kw: ["contact", "phone", "email", "address", "office", "call", "visit", "number", "reach"],
    a: "• *Telephone:* 012 346 1738\n• *Email:* enquiries@pfa.org.za\n• *Website:* www.pfa.org.za\n• *Office:* 4th Floor, Riverwalk Office Park, Block A, 41 Matroosberg Road, Ashlea Gardens, Pretoria\n\nOur consultants are available Monday to Friday, 08:00–16:30.",
  },
];

// Stop words carry no signal and, left in, let a long question out-score a
// precise one purely on length.
const STOP = new Set([
  "the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "or", "in",
  "on", "at", "for", "with", "my", "me", "i", "you", "it", "that", "this",
  "be", "been", "have", "has", "had", "do", "did", "will", "would", "can",
  "please", "hi", "hello", "thanks", "thank", "am", "so", "but", "if", "we",
]);

export const tokenise = (text) =>
  String(text || "").toLowerCase()
    .replace(/[^\w\s/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));

// Returns the best FAQ match with a normalised score, or null. The threshold
// is deliberately conservative: answering the wrong question confidently is
// worse than saying you did not understand.
export function searchFaq(text, { threshold = 0.28 } = {}) {
  const toks = tokenise(text);
  if (!toks.length) return null;

  const scored = FAQS.map((f) => {
    const hits = toks.filter((t) => f.kw.includes(t));
    // Normalise by the question's own keyword count so a long keyword list is
    // not an advantage, then by query length so a rambling message is not one
    // either.
    const score = hits.length / Math.sqrt(f.kw.length * Math.max(toks.length, 2));
    return { faq: f, score, hits };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < threshold) return null;
  return {
    id: top.faq.id,
    question: top.faq.q,
    answer: top.faq.a,
    score: +top.score.toFixed(2),
    matched: top.hits,
  };
}
