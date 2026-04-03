import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "../styles/policy.css";

const SITE_NAME = "Grasperr";
const SITE_URL = "grasperr.com";
const CONTACT_EMAIL = "contact@grasperr.com";
const LAST_UPDATED = "2025";

function Section({ title, children }) {
  return (
    <section className="policy-section">
      <h2 className="policy-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Policy() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <div className="policy-main">
      <div className="policy-wrapper">

        <div className="policy-hero">
          <h1 className="policy-hero-title">Privacy Policy & Terms of Service</h1>
          <p className="policy-hero-sub">
            Last updated: {LAST_UPDATED} &nbsp;·&nbsp; {SITE_NAME} &nbsp;·&nbsp;{" "}
            <a href={`https://${SITE_URL}`} className="policy-link">{SITE_URL}</a>
          </p>
          <p className="policy-intro">
            This page explains how {SITE_NAME} collects, uses, and protects your
            information, and the terms you agree to when using the site. We have
            written this in plain language so it is easy to understand. If you
            have any questions, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="policy-link">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        {/* ── PRIVACY POLICY ────────────────────────────────────── */}
        <div className="policy-block">
          <h2 className="policy-block-title">Privacy Policy</h2>

          <Section title="1. What Information We Collect">
            <p>We collect only the minimum information needed to provide the service:</p>
            <ul className="policy-list">
              <li><strong>Email address</strong> — when you create an account, used to identify your account and send essential service emails.</li>
              <li><strong>Password</strong> — stored in hashed (encrypted) form. We never see or store your plain-text password.</li>
              <li><strong>Words you look up</strong> — saved to power your search history, dashboard streak, and word-of-the-day experience.</li>
              <li><strong>Bookmarks and Collections</strong> — words you choose to save or organize, stored against your account.</li>
              <li><strong>Site interaction data</strong> — general usage patterns used to improve the service (e.g., which features are used).</li>
            </ul>
            <p className="policy-note">
              We do <strong>not</strong> collect your name, phone number, location,
              IP address, or device information. We do not build advertising profiles
              on individual users.
            </p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="policy-list">
              <li>To create and maintain your account.</li>
              <li>To save your bookmarks, collections, and search history across sessions.</li>
              <li>To calculate your daily learning streak and display dashboard stats.</li>
              <li>To send essential service emails (e.g., account verification). We do not send marketing emails.</li>
              <li>To improve the site based on general usage trends.</li>
            </ul>
            <p className="policy-note">
              We do <strong>not</strong> sell your data. We do <strong>not</strong> use
              your data to target you with personalised ads. We do not share your
              personal information with advertisers.
            </p>
          </Section>

          <Section title="3. Google Ads & Third-Party Advertising">
            <p>
              {SITE_NAME} displays advertisements served by <strong>Google AdSense</strong>.
              Google and its partners may use cookies and similar technologies to
              show you ads based on your visits to this and other websites.
            </p>
            <ul className="policy-list">
              <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visits to {SITE_NAME} and/or other sites on the internet.</li>
              <li>You can opt out of personalised advertising by visiting{" "}
                <a href="https://www.google.com/settings/ads" className="policy-link" target="_blank" rel="noopener noreferrer">
                  Google Ads Settings
                </a>.
              </li>
              <li>You can also opt out via the{" "}
                <a href="https://optout.networkadvertising.org/" className="policy-link" target="_blank" rel="noopener noreferrer">
                  Network Advertising Initiative opt-out page
                </a>.
              </li>
              <li>Google's privacy policy is available at{" "}
                <a href="https://policies.google.com/privacy" className="policy-link" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>.
              </li>
            </ul>
            <p className="policy-note">
              We have no control over the cookies placed by Google AdSense. The ads
              shown are selected by Google, not by us.
            </p>
          </Section>

          <Section title="4. Cookies">
            <p>We use the following types of cookies:</p>
            <ul className="policy-list">
              <li><strong>Essential cookies</strong> — required for login sessions and basic site functionality. The site cannot work without these.</li>
              <li><strong>Advertising cookies</strong> — placed by Google AdSense to deliver and measure advertisements. These are third-party cookies controlled by Google.</li>
            </ul>
            <p>
              We do not use tracking cookies for our own analytics or marketing.
              You can control cookie settings through your browser preferences,
              though disabling essential cookies will prevent you from logging in.
            </p>
          </Section>

          <Section title="5. Data Storage & Security">
            <ul className="policy-list">
              <li>Your data is stored securely using <strong>Supabase</strong>, an industry-standard database and authentication service.</li>
              <li>All passwords are hashed using bcrypt — they are never stored in plain text.</li>
              <li>All connections between your browser and our servers use <strong>HTTPS</strong> encryption.</li>
              <li>We follow security best practices to protect your data from unauthorised access.</li>
              <li>In the event of a data breach that affects your personal information, we will notify affected users as soon as reasonably possible.</li>
            </ul>
          </Section>

          <Section title="6. Data Retention & Account Deletion">
            <p>
              Your data is retained for as long as your account is active. You can
              permanently delete your account and all associated data (bookmarks,
              collections, search history) at any time from your account settings.
              Deletion is immediate and irreversible.
            </p>
            <p>
              If you need help deleting your account, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="policy-link">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="7. Children's Privacy">
            <p>
              {SITE_NAME} is intended for users aged <strong>13 and older</strong>.
              We do not knowingly collect personal information from children under 13.
              If you are under 13, please do not create an account or provide any
              personal information.
            </p>
            <p>
              If we become aware that a child under 13 has provided us with personal
              information, we will delete that account and its data promptly. If you
              believe a child under 13 has created an account, please contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="policy-link">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Regardless of where you are located, you have the right to:</p>
            <ul className="policy-list">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — request correction of inaccurate data.</li>
              <li><strong>Deletion</strong> — delete your account and all associated data at any time.</li>
              <li><strong>Portability</strong> — request an export of your own data.</li>
              <li><strong>Objection</strong> — object to how your data is being used.</li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="policy-link">{CONTACT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="9. International Users">
            <p>
              {SITE_NAME} is operated from Sri Lanka and serves users globally.
              If you are located in the European Union, United Kingdom, or California,
              you have additional rights under GDPR and CCPA respectively. We apply
              the same data protection standards to all users regardless of location.
              By using the site you consent to your information being processed as
              described in this policy.
            </p>
          </Section>
        </div>

        {/* ── TERMS OF SERVICE ──────────────────────────────────── */}
        <div id="terms" className="policy-block">
          <h2 className="policy-block-title">Terms of Service</h2>

          <Section title="1. Acceptance">
            <p>
              By accessing or using {SITE_NAME} you agree to be bound by these
              Terms of Service and our Privacy Policy. If you do not agree, please
              do not use the site.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 13 years old to use {SITE_NAME}. By creating
              an account, you confirm that you are 13 or older. If you are between
              13 and 18, you should review these terms with a parent or guardian.
            </p>
          </Section>

          <Section title="3. Account Rules">
            <ul className="policy-list">
              <li>One account per email address.</li>
              <li>You are responsible for keeping your password secure. Do not share your account.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide a valid email address when registering.</li>
            </ul>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="policy-list">
              <li>Attempt to gain unauthorised access to any part of the site or other users' accounts.</li>
              <li>Scrape, crawl, or copy the site's content in bulk without permission.</li>
              <li>Use the site for any illegal purpose.</li>
              <li>Abuse, harass, or attempt to harm other users.</li>
              <li>Attempt to overload or disrupt the site's infrastructure.</li>
            </ul>
          </Section>

          <Section title="5. Content & Accuracy">
            <p>
              Dictionary definitions and example sentences on {SITE_NAME} are
              created to be clear and useful for ESL learners. While we aim for
              accuracy, minor errors can occur. {SITE_NAME} is not a substitute
              for professional, legal, medical, or academic reference materials.
              We are not liable for any consequences resulting from reliance on
              content provided on this site.
            </p>
          </Section>

          <Section title="6. AI-Generated Content">
            <p>
              Some definitions, examples, and explanations on {SITE_NAME} are
              generated or assisted by artificial intelligence. All AI-generated
              content is reviewed for quality and appropriateness. However, AI
              can occasionally produce errors — please use your judgement,
              especially for technical or formal contexts.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The dictionary content, design, and features of {SITE_NAME} are
              owned by the site operator. You may not reproduce, distribute, or
              create derivative works from the site's content without written
              permission. You retain ownership of any data you personally create
              (e.g., your bookmarks and collections).
            </p>
          </Section>

          <Section title="8. Service Availability">
            <p>
              We aim to keep {SITE_NAME} available at all times but cannot
              guarantee uninterrupted access. The service may be temporarily
              unavailable due to maintenance, updates, or circumstances beyond
              our control. We are not liable for any loss caused by downtime.
            </p>
          </Section>

          <Section title="9. Enforcement">
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these terms without prior notice. In serious cases (e.g., attempted
              hacking), we may also report the activity to relevant authorities.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms of Service from time to time. When we do,
              we will update the "Last updated" date at the top of this page and
              may post a notice on the site. Continued use of {SITE_NAME} after
              changes are posted constitutes your acceptance of the updated terms.
            </p>
          </Section>
        </div>

        {/* ── CONTACT ───────────────────────────────────────────── */}
        <div className="policy-contact">
          <h2 className="policy-section-title">Contact</h2>
          <p>
            If you have any questions, concerns, or requests regarding this
            policy or your data, please reach out:
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="policy-contact-link">
            {CONTACT_EMAIL}
          </a>
        </div>

      </div>
    </div>
  );
}

export default Policy;
