import MapAreasClient from "./MapAreasClient";

// Required for `output: "export"` — generates a single placeholder shell.
// The real map id is read client-side from the URL (see MapAreasClient).
export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}
// Note: `dynamicParams` export must be a static literal (Next.js can't parse
// expressions here), so we omit it and rely on the default (`true`). In
// `next dev` this allows any id to render. In the static export build, only
// the "placeholder" shell is generated; other ids resolve client-side via
// MapAreasClient reading the id from the URL at runtime.

export default function MapAreasPage() {
  return <MapAreasClient />;
}
