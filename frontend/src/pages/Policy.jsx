import React from "react";

function Policy() {
  return (
    <div className="policy-main">
      <ol className="policies-container">
        {/* Privacy Policy */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Privacy Policy</h1>
          <ol className="policies-list">
            <li className="policy">
              <strong>Data collected: </strong>We only collect email addresses,
              bookmarks, searches, and other site interaction data (e.g., words
              you look up, saved notes). We do not collect names, IP addresses,
              location, device information, or other personal identifiers.
            </li>
            <li className="policy">
              <strong>How we use data: </strong>Your data is used to save and
              restore your account, bookmarks, and learning progress, and to
              provide the dictionary features you interact with.
            </li>
            <li className="policy">
              <strong>Sharing: </strong>Your data is not shared with third
              parties except in rare critical situations (e.g., security
              issues).
            </li>
            <li className="policy">
              <strong>Ads: </strong>The site displays ads provided by{" "}
              <strong>Google Ads</strong>. Ad providers may collect anonymous
              usage data for ad delivery; we do not share your personal
              information with advertisers.
            </li>
            <li className="policy">
              <strong>Your rights: </strong>You may delete your account and all
              associated data at any time. You may request an export of your own
              data; you may not access or export another user’s data.
            </li>
          </ol>
        </li>

        {/* Terms of Service */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Terms of Service</h1>
          <ol className="policies-list">
            <li className="policy">
              <strong>Acceptance: </strong>By using the site you agree to these
              policies and to use the service responsibly.
            </li>
            <li className="policy">
              <strong>Account rules: </strong>One account per email address.
              Users may create multiple accounts using different email
              addresses.
            </li>
            <li className="policy">
              <strong>Acceptable use: </strong>Do not attempt unauthorized
              access, scraping of other users’ data, spamming, or misuse of the
              service.
            </li>
            <li className="policy">
              <strong>Accuracy & liability: </strong>The site aims to be
              helpful, but minor inaccuracies can occur. We are not responsible
              for any consequences of relying on a definition or example
              provided here.
            </li>
            <li className="policy">
              <strong>Enforcement: </strong>Accounts that violate these terms
              may be suspended or terminated.
            </li>
          </ol>
        </li>

        {/* AI & Content Disclaimer */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">AI & Content Disclaimer</h1>
          <ol className="policies-list">
            <li className="policy">
              The dictionary’s definitions and example sentences are created to
              be simple and useful for ELS learners (including students and
              children). While they are generally accurate, small errors may
              occur.
            </li>
            <li className="policy">
              If you need highly technical, professional, legal, or medical
              explanations, those may be outside the scope of this site.
            </li>
          </ol>
        </li>

        {/* Cookies & Ads Notice */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Cookies & Ads Notice</h1>
          <ol className="policies-list">
            <li className="policy">
              The site uses cookies and scripts required for functionality and
              to display ads. Ads are served by <strong>Google Ads</strong> and
              may involve standard ad cookies or anonymous signals used by ad
              networks. We do not use cookies to collect personal identifiers.
            </li>
          </ol>
        </li>

        {/* Security */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Security</h1>
          <ol className="policies-list">
            <li className="policy">
              User accounts and data are stored securely using industry-standard
              services (e.g., <strong>Supabase</strong>). Passwords are stored
              in hashed form and all connections use HTTPS.
            </li>
            <li className="policy">
              In the event of a security incident, appropriate steps will be
              taken to secure data and notify affected users if required.
            </li>
          </ol>
        </li>

        {/* Content Ownership */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Content Ownership</h1>
          <ol className="policies-list">
            <li className="policy">
              The site owns the dictionary content and examples provided to
              users. Users do not own the site’s generated content. Users retain
              control over actions on their own account (deleting or requesting
              export of their own data).
            </li>
          </ol>
        </li>

        {/* Policy Changes & Notice */}
        <li className="policies-item-wrapper">
          <h1 className="policy-title">Policy Changes & Notice</h1>
          <ol className="policies-list">
            <li className="policy">
              These policies may be updated from time to time. When we update
              them, we will post a notice on the site. Continued use after the
              notice indicates acceptance of the updated policies.
            </li>
          </ol>
        </li>
      </ol>
    </div>
  );
}

export default Policy;
