"use client";

import { useState } from "react";

type Tab = "privacy" | "terms";

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<Tab>("privacy");

  return (
    <div className="min-h-screen" style={{ background: "#0d1117", color: "#e6edf3", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#161b22", borderBottom: "1px solid #30363d", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ width: 40, height: 40, background: "#f97316", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
          🎯
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>AirTac — Airsoft Tactical Hub</div>
          <div style={{ fontSize: 12, color: "#8b949e", marginTop: 2 }}>com.duyts.android.airtac · airtac.app</div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ background: "#161b22", borderBottom: "1px solid #30363d", display: "flex", padding: "0 24px", gap: 4 }}>
        {(["privacy", "terms"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "14px 20px",
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === tab ? "#f97316" : "#8b949e",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #f97316" : "2px solid transparent",
              cursor: "pointer",
              transition: "color .2s, border-color .2s",
            }}
          >
            {tab === "privacy" ? "Privacy Policy" : "Terms of Service"}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        {activeTab === "privacy" ? <PrivacyPolicy /> : <TermsOfService />}
      </main>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: "1px solid #30363d", color: "#8b949e", fontSize: 13 }}>
        <p>© 2026 AirTac — Airsoft Tactical Hub</p>
        <p style={{ marginTop: 6 }}>com.duyts.android.airtac · airtac.app</p>
      </footer>
    </div>
  );
}

/* ─────────────────────────────────────────── */
/*  Shared primitives                          */
/* ─────────────────────────────────────────── */

function SectionHero({ badge, title, updated }: { badge: string; title: string; updated: string }) {
  return (
    <div style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 12, padding: "28px 32px", marginBottom: 40 }}>
      <div style={{ display: "inline-block", background: "#f97316", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 12, letterSpacing: ".5px", textTransform: "uppercase" }}>
        {badge}
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "#8b949e", fontSize: 14 }}>{updated}</p>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#161b22", border: "1px solid #30363d", borderLeft: "3px solid #f97316", borderRadius: 8, padding: "16px 20px", margin: "20px 0", fontSize: 14, color: "#8b949e" }}>
      {children}
    </div>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#fff", marginTop: 36, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #30363d" }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, marginBottom: 12, color: "#e6edf3" }}>{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ paddingLeft: 20, marginBottom: 14, fontSize: 15, color: "#e6edf3" }}>{children}</ul>;
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#f97316", textDecoration: "none" }}>
      {children}
    </a>
  );
}

/* ─────────────────────────────────────────── */
/*  Privacy Policy                             */
/* ─────────────────────────────────────────── */

function PrivacyPolicy() {
  return (
    <>
      <SectionHero badge="Privacy Policy" title="Your Privacy Matters" updated="Last updated: June 23, 2026 · Effective: June 23, 2026" />

      <InfoBox>
        This Privacy Policy applies to the <strong style={{ color: "#fff" }}>AirTac</strong> mobile application
        (Android &amp; iOS), operated by the AirTac team. It explains how we collect,
        use, store, and protect your information.
      </InfoBox>

      <H3>1. Who We Are</H3>
      <P>
        AirTac (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is an airsoft tactical coordination app that helps
        players join matches, view field information, and coordinate tactics in real time.
        Our app is available on Android (Google Play) and iOS (App Store).
      </P>
      <P>
        Questions? Contact us at: <A href="mailto:duytruong0702.us@gmail.com">duytruong0702.us@gmail.com</A>
      </P>

      <H3>2. Information We Collect</H3>
      <P><strong style={{ color: "#fff" }}>a) Account &amp; Identity Information</strong></P>
      <UL>
        <li>Your name, email address, and profile photo — obtained from your Google account when you sign in with Google.</li>
        <li>We do not store your Google password.</li>
      </UL>

      <P><strong style={{ color: "#fff" }}>b) Location Data</strong></P>
      <UL>
        <li><strong style={{ color: "#fff" }}>Precise GPS coordinates</strong> are collected while you are actively participating in a match (approximately every 3 seconds).</li>
        <li>Location data is shared in real time with your teammates within the same match to enable the tactical map feature.</li>
        <li>Location is only transmitted while the app is in the foreground and you have joined an active match.</li>
        <li>We do not track your location outside of active match sessions.</li>
      </UL>

      <P><strong style={{ color: "#fff" }}>c) Usage &amp; Match Data</strong></P>
      <UL>
        <li>Match participation history, team membership, hit events, and ping activity within matches.</li>
        <li>In-game events such as player positions, hit confirmations, and match results.</li>
      </UL>

      <P><strong style={{ color: "#fff" }}>d) Device Information</strong></P>
      <UL>
        <li>Device token for push notifications (Firebase Cloud Messaging), collected only if you grant notification permission.</li>
        <li>Basic device identifiers for app functionality (platform, OS version).</li>
      </UL>

      <H3>3. How We Use Your Information</H3>
      <UL>
        <li>To authenticate you and manage your account.</li>
        <li>To display your real-time location on the tactical map to teammates during a match.</li>
        <li>To power match coordination features: ping alerts, hit reporting, team management.</li>
        <li>To send push notifications about match events (if you opt in).</li>
        <li>To improve app stability and performance.</li>
      </UL>
      <P>We do <strong style={{ color: "#fff" }}>not</strong> sell your personal information to third parties.</P>

      <H3>4. Data Sharing</H3>
      <P>We share your data only in the following limited cases:</P>
      <UL>
        <li><strong style={{ color: "#fff" }}>Teammates in the same match:</strong> Your display name, avatar, and GPS location are visible to players on your team during an active match.</li>
        <li><strong style={{ color: "#fff" }}>Field/event administrators:</strong> Match metadata (team rosters, scores) may be visible to the organizer of the field or event.</li>
        <li>
          <strong style={{ color: "#fff" }}>Service providers:</strong> We use the following third-party services:
          <ul style={{ paddingLeft: 20, marginTop: 6 }}>
            <li><A href="https://supabase.com/privacy">Supabase</A> — database and backend infrastructure</li>
            <li><A href="https://firebase.google.com/support/privacy">Google Firebase</A> — push notifications (FCM)</li>
            <li><A href="https://www.mapbox.com/legal/privacy">Mapbox</A> — map rendering on Android</li>
            <li><A href="https://policies.google.com/privacy">Google Sign-In</A> — authentication</li>
          </ul>
        </li>
        <li><strong style={{ color: "#fff" }}>Legal requirements:</strong> We may disclose information if required by law or to protect our legal rights.</li>
      </UL>

      <H3>5. Data Retention</H3>
      <UL>
        <li>Account data is retained while your account is active.</li>
        <li>Real-time location data during a match is used only for the duration of the match and is not stored long-term.</li>
        <li>Match history and statistics may be retained to display past performance in your profile.</li>
        <li>You may request deletion of your account and data by contacting us at <A href="mailto:duytruong0702.us@gmail.com">duytruong0702.us@gmail.com</A>.</li>
      </UL>

      <H3>6. Your Rights</H3>
      <P>Depending on your location, you may have the right to:</P>
      <UL>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion of your account and data.</li>
        <li>Withdraw consent for location access at any time via your device settings.</li>
        <li>Opt out of push notifications via your device settings.</li>
      </UL>
      <P>To exercise any of these rights, contact: <A href="mailto:duytruong0702.us@gmail.com">duytruong0702.us@gmail.com</A></P>

      <H3>7. Children&apos;s Privacy</H3>
      <P>
        AirTac is not directed at children under 13 years of age. We do not knowingly collect
        personal information from children under 13. If you believe a child under 13 has provided
        us with personal information, please contact us and we will delete it promptly.
      </P>

      <H3>8. Security</H3>
      <P>
        We use industry-standard security measures including JWT-based authentication (HS512),
        encrypted communications (HTTPS/WSS), and access controls. However, no system is perfectly
        secure and we cannot guarantee absolute security.
      </P>

      <H3>9. Changes to This Policy</H3>
      <P>
        We may update this Privacy Policy from time to time. We will notify users of significant
        changes via the app or by email. Continued use of the app after changes constitutes
        acceptance of the updated policy.
      </P>

      <H3>10. Contact Us</H3>
      <P>
        AirTac Team<br />
        Email: <A href="mailto:duytruong0702.us@gmail.com">duytruong0702.us@gmail.com</A><br />
        App: AirTac — Airsoft Tactical Hub<br />
        Package: com.duyts.android.airtac
      </P>
    </>
  );
}

/* ─────────────────────────────────────────── */
/*  Terms of Service                           */
/* ─────────────────────────────────────────── */

function TermsOfService() {
  return (
    <>
      <SectionHero badge="Terms of Service" title="Terms & Conditions" updated="Last updated: June 23, 2026 · Effective: June 23, 2026" />

      <InfoBox>
        By downloading or using <strong style={{ color: "#fff" }}>AirTac</strong>, you agree to these Terms of Service.
        Please read them carefully. If you disagree, do not use the app.
      </InfoBox>

      <H3>1. Acceptance of Terms</H3>
      <P>
        These Terms of Service (&quot;Terms&quot;) govern your use of the AirTac mobile application
        (&quot;App&quot;), operated by the AirTac team (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By creating an account
        or using the App, you accept these Terms in full.
      </P>

      <H3>2. Description of Service</H3>
      <P>AirTac is a tactical coordination application for airsoft players. The App provides:</P>
      <UL>
        <li>A directory of airsoft fields and events.</li>
        <li>Real-time match coordination via tactical maps and GPS sharing with teammates.</li>
        <li>Match management including team formation, lobby, and in-game hit reporting.</li>
        <li>Player profiles and match history.</li>
      </UL>

      <H3>3. Eligibility</H3>
      <UL>
        <li>You must be at least 13 years old to use AirTac.</li>
        <li>If you are under 18, you must have parental consent.</li>
        <li>You must comply with all applicable local laws regarding airsoft activities.</li>
      </UL>

      <H3>4. User Accounts</H3>
      <UL>
        <li>You must sign in using a valid Google account.</li>
        <li>You are responsible for maintaining the security of your account.</li>
        <li>You may not create accounts for other people without their permission.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
      </UL>

      <H3>5. Acceptable Use</H3>
      <P>You agree <strong style={{ color: "#fff" }}>not</strong> to:</P>
      <UL>
        <li>Use the App for any unlawful purpose or in violation of any laws.</li>
        <li>Harass, threaten, or abuse other players.</li>
        <li>Cheat, exploit, or manipulate App features to gain unfair advantages.</li>
        <li>Transmit false GPS location data or impersonate other players.</li>
        <li>Attempt to reverse-engineer, hack, or disrupt the App or its servers.</li>
        <li>Use the App in any manner that could damage, disable, or impair the service.</li>
      </UL>

      <H3>6. Location Services</H3>
      <P>
        The App requests access to your device&apos;s precise location to enable the tactical map
        during active matches. By joining a match, you consent to sharing your real-time GPS
        coordinates with your teammates. You may revoke location permission at any time through
        your device settings, but this will limit core App functionality during matches.
      </P>

      <H3>7. Safety Disclaimer</H3>
      <P>
        AirTac is a digital coordination tool. <strong style={{ color: "#fff" }}>We are not responsible for real-world
        airsoft activities, injuries, accidents, or damages</strong> that occur during gameplay.
        Users participate in airsoft activities at their own risk and must comply with all field
        rules, local regulations, and safety guidelines. Always wear appropriate protective equipment.
      </P>

      <H3>8. Intellectual Property</H3>
      <P>
        All content, design, trademarks, and software in the App are owned by the AirTac team
        or its licensors. You may not copy, reproduce, modify, or distribute any part of the
        App without our written permission.
      </P>
      <P>
        By submitting any content (e.g., profile information), you grant us a non-exclusive,
        royalty-free license to use that content to operate the App.
      </P>

      <H3>9. Third-Party Services</H3>
      <P>
        The App integrates third-party services including Google Sign-In, Mapbox, Supabase,
        and Firebase. Your use of these services is governed by their respective terms and
        privacy policies. We are not responsible for the conduct of third-party services.
      </P>

      <H3>10. Disclaimers &amp; Limitation of Liability</H3>
      <P>
        The App is provided <strong style={{ color: "#fff" }}>&quot;as is&quot;</strong> without warranties of any kind, express
        or implied. We do not guarantee uninterrupted or error-free operation.
      </P>
      <P>
        To the maximum extent permitted by applicable law, we shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages arising from your
        use of or inability to use the App.
      </P>

      <H3>11. Termination</H3>
      <P>
        We may suspend or terminate your access to the App at any time, with or without notice,
        for conduct that we believe violates these Terms or is harmful to other users, us, or
        third parties. You may stop using the App at any time.
      </P>

      <H3>12. Changes to Terms</H3>
      <P>
        We reserve the right to update these Terms. We will notify you of material changes
        through the App or by email. Continued use after the effective date constitutes
        acceptance of the revised Terms.
      </P>

      <H3>13. Governing Law</H3>
      <P>
        These Terms are governed by applicable law. Any disputes shall be resolved through
        good-faith negotiation, and if unresolved, through the courts of competent jurisdiction.
      </P>

      <H3>14. Contact</H3>
      <P>
        AirTac Team<br />
        Email: <A href="mailto:duytruong0702.us@gmail.com">duytruong0702.us@gmail.com</A><br />
        App: AirTac — Airsoft Tactical Hub<br />
        Package: com.duyts.android.airtac
      </P>
    </>
  );
}
