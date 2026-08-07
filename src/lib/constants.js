export const STATUSES = ["New", "Contacted", "Qualified", "Won", "Lost"];

// The lead columns we accept from a CSV, and the aliases we try to match
// against messy header names during upload.
export const LEAD_FIELDS = [
  { key: "name", label: "Name", aliases: ["name", "full name", "contact", "contact name", "lead"] },
  { key: "company", label: "Company", aliases: ["company", "organization", "org", "business", "account"] },
  { key: "email", label: "Email", aliases: ["email", "e-mail", "email address"] },
  { key: "phone", label: "Phone", aliases: ["phone", "mobile", "telephone", "phone number", "cell"] },
  { key: "source", label: "Source", aliases: ["source", "channel", "lead source", "campaign"] },
  { key: "value", label: "Value", aliases: ["value", "deal value", "amount", "revenue", "budget"] },
  { key: "designation", label: "Designation", aliases: ["designation", "title", "job title", "role", "position"] },
  { key: "website", label: "Website", aliases: ["website", "site", "url", "web", "company website"] },
  { key: "linkedin", label: "LinkedIn", aliases: ["linkedin", "linked in", "linkedin url", "li"] },
  { key: "location", label: "Location", aliases: ["location", "city", "country", "region", "address"] },
];

export function formatMoney(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
