// Fetches the state (open / merged / closed) of each GitHub pull request
// linked inside a list marked with `data-pr-status`, and appends a badge.
// Uses the unauthenticated GitHub REST API (rate limit: 60 requests/hour/IP).

const PR_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

function badge(label, state) {
  const span = document.createElement("span");
  span.className = `pr-badge pr-badge--${state}`;
  span.textContent = label;
  return span;
}

function stateOf(pr) {
  if (pr.merged_at) return { label: "merged", state: "merged" };
  if (pr.state === "closed") return { label: "closed", state: "closed" };
  if (pr.draft) return { label: "draft", state: "draft" };
  return { label: "open", state: "open" };
}

async function annotate(link) {
  const m = link.href.match(PR_URL_RE);
  if (!m) return;
  const [, owner, repo, number] = m;

  const placeholder = badge("…", "loading");
  link.before(placeholder);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pr = await res.json();
    const { label, state } = stateOf(pr);
    placeholder.replaceWith(badge(label, state));
  } catch (err) {
    console.warn(`PR status fetch failed for ${link.href}:`, err);
    placeholder.remove();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll("[data-pr-status] a")
    .forEach((link) => annotate(link));
});
