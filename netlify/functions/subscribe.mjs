// netlify/functions/subscribe.mjs — newsletter signup → EmailOctopus.
//
// The site's newsletter band posts here (POST /api/subscribe). This function adds the
// email to the EmailOctopus list through the official v2 API, so the API key never
// reaches the browser.
//
// Required Netlify environment variables (Site configuration → Environment variables):
//   EMAILOCTOPUS_API_KEY   an EmailOctopus API key (Integrations & API → API keys)
//   EMAILOCTOPUS_LIST_ID   the HRJobsRemote list's ID (List → Settings)
//
// It uses EmailOctopus's *create* endpoint (POST), not the upsert (PUT): an address
// that is already on the list — including someone who unsubscribed — is left exactly as
// it is, so nobody is ever re-subscribed against their wishes.
//
// Works with and without JavaScript:
//   - fetch() with Accept: application/json  → JSON { ok, message }
//   - plain form post (no JS)                → 303 redirect to /subscribed (or /?subscribe=error)

const API = "https://api.emailoctopus.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const wantsJson = (req.headers.get("accept") || "").includes("application/json");
  const reply = (ok, message, status = ok ? 200 : 400) =>
    wantsJson
      ? Response.json({ ok, message }, { status })
      : new Response(null, { status: 303, headers: { Location: ok ? "/subscribed" : "/?subscribe=error#subscribe" } });

  let data;
  try {
    const type = req.headers.get("content-type") || "";
    data = type.includes("application/json") ? await req.json() : Object.fromEntries(await req.formData());
  } catch {
    return reply(false, "Something went wrong. Please try again.");
  }

  // Honeypot: real people never see or fill the "company" field; bots do. Pretend success.
  if (data.company) return reply(true, "Thanks! You're subscribed.");

  const email = String(data.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return reply(false, "Please enter a valid email address.");

  const key = process.env.EMAILOCTOPUS_API_KEY;
  const list = process.env.EMAILOCTOPUS_LIST_ID;
  if (!key || !list) {
    console.error("subscribe: EMAILOCTOPUS_API_KEY or EMAILOCTOPUS_LIST_ID is not set");
    return reply(false, "Signup is temporarily unavailable. Please try again later.", 500);
  }

  const source = String(data.source || "website").slice(0, 40).replace(/[^a-z0-9-]/gi, "") || "website";

  // The create endpoint takes tags as an array of strings (the upsert endpoint uses an object).
  const create = (body) =>
    fetch(`${API}/lists/${list}/contacts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
  const OK = "Thanks! You're subscribed. Watch your inbox for the next issue.";

  try {
    let res = await create({ email_address: email, status: "subscribed", tags: [source] });
    // If EmailOctopus ever rejects the tag itself (400/422), still subscribe the person, untagged.
    if (res.status === 400 || res.status === 422) {
      console.error("subscribe: rejected with tag, retrying without", res.status, (await res.text()).slice(0, 300));
      res = await create({ email_address: email, status: "subscribed" });
    }
    if (res.ok) return reply(true, OK);
    // 409 = already on the list. Treat as success, and don't reveal anything about the address.
    if (res.status === 409) return reply(true, OK);
    console.error("subscribe: EmailOctopus responded", res.status, (await res.text()).slice(0, 300));
    return reply(false, "Something went wrong. Please try again.", 502);
  } catch (err) {
    console.error("subscribe: request failed", err);
    return reply(false, "Something went wrong. Please try again.", 502);
  }
};

export const config = { path: "/api/subscribe" };
