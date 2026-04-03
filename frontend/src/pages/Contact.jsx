import "../styles/contact.css";

const CONTACT_EMAIL = "contact@grasperr.com";

export default function Contact() {
  return (
    <div className="contact-page">

      <div className="contact-header">
        <p className="contact-eyebrow">Contact</p>
        <h1 className="contact-title">Get in touch</h1>
        <p className="contact-lead">
          Have a question, found an issue, or want to share an idea?
          Reach out directly — every message gets read.
        </p>
      </div>

      <div className="contact-method">
        <p className="contact-method-label">Email</p>
        <a className="contact-method-value" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </div>

    </div>
  );
}
