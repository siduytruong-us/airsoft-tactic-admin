import MatchAreasClient from "./MatchAreasClient";

// Required for `output: "export"` — generates a single placeholder shell.
// The real match id is read client-side from the URL (see MatchAreasClient).
export async function generateStaticParams() {
  return [{ matchId: "placeholder" }];
}
// Note: `dynamicParams` export must be a static literal (Next.js can't parse
// expressions here), so we omit it and rely on the default (`true`). In
// `next dev` this allows any id to render. In the static export build, only
// the "placeholder" shell is generated; other ids resolve client-side via
// MatchAreasClient reading the id from the URL at runtime.

export default function MatchAreasPage() {
  return <MatchAreasClient />;
}
