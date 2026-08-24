import React from 'react';

/**
 * The four invoice header treatments offered under Branding → Invoice Layout.
 *
 * Each one owns the whole top block of the document — including the divider
 * that follows it, where the design has one — so `InvoiceDocument` stays a
 * single shared body no matter which layout is selected. Everything below the
 * header is the same markup; the per-layout alignment differences are handled
 * by the `invoice-doc--<layout>` modifier in the stylesheet.
 */

/** Uploaded logo when Branding has one, otherwise the company's initial. */
export const BrandMark = ({ issuer, size }) => (
  <span className={`invoice-doc__brand-mark${size ? ` invoice-doc__brand-mark--${size}` : ''}`}>
    {issuer.logo ? (
      <img className="invoice-doc__brand-logo" src={issuer.logo} alt="" />
    ) : (
      issuer.name.trim().charAt(0)
    )}
  </span>
);

const LeftAlignedMasthead = ({ issuer, number, created }) => (
  <div className="invoice-doc__section">
    <header className="invoice-doc__masthead">
      <div className="invoice-doc__brand">
        <BrandMark issuer={issuer} />
        <div className="invoice-doc__brand-body">
          <span className="invoice-doc__brand-name">{issuer.name}</span>
          <span className="invoice-doc__brand-line">{issuer.address}</span>
          <span className="invoice-doc__brand-line">{issuer.contact}</span>
        </div>
      </div>

      <div className="invoice-doc__ref">
        <span className="invoice-doc__number">{number}</span>
        <span className="invoice-doc__ref-caption">Set {created}</span>
      </div>
    </header>
  </div>
);

/* Full-bleed dark band across the top of the paper. */
const BoldHeaderMasthead = ({ issuer, number, created }) => (
  <header className="invoice-doc__band">
    <div className="invoice-doc__band-top">
      <div className="invoice-doc__brand">
        <BrandMark issuer={issuer} size="lg" />
        <span className="invoice-doc__brand-name">{issuer.name}</span>
      </div>

      <div className="invoice-doc__ref">
        <span className="invoice-doc__number">{number}</span>
        <span className="invoice-doc__ref-caption">Set {created}</span>
      </div>
    </div>

    <p className="invoice-doc__band-contact">
      {[issuer.address, issuer.contact].filter(Boolean).join('  ·  ')}
    </p>
  </header>
);

/* No logo mark; an "Invoice" eyebrow sits above the number. */
const ClassicMasthead = ({ issuer, number, created }) => (
  <>
    <div className="invoice-doc__section">
      <header className="invoice-doc__masthead">
        <div className="invoice-doc__brand-body">
          <span className="invoice-doc__brand-name">{issuer.name}</span>
          <span className="invoice-doc__brand-line">{issuer.address}</span>
          <span className="invoice-doc__brand-line">{issuer.contact}</span>
        </div>

        <div className="invoice-doc__ref">
          <span className="invoice-doc__eyebrow">Invoice</span>
          <span className="invoice-doc__number">{number}</span>
          <span className="invoice-doc__ref-caption">{created}</span>
        </div>
      </header>
    </div>
    <span className="invoice-doc__rule" />
  </>
);

const CenteredMasthead = ({ issuer, number, created }) => (
  <>
    <div className="invoice-doc__section">
      <header className="invoice-doc__masthead">
        <BrandMark issuer={issuer} size="lg" />

        <div className="invoice-doc__brand-body">
          <span className="invoice-doc__brand-name">{issuer.name}</span>
          <span className="invoice-doc__brand-line">
            {[issuer.address, issuer.contact].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div className="invoice-doc__ref">
          <span className="invoice-doc__number">{number}</span>
          <span className="invoice-doc__ref-caption">Set {created}</span>
        </div>
      </header>
    </div>
    <span className="invoice-doc__rule" />
  </>
);

const MASTHEADS = {
  'left-aligned': LeftAlignedMasthead,
  'bold-header': BoldHeaderMasthead,
  classic: ClassicMasthead,
  centered: CenteredMasthead,
};

export const InvoiceMasthead = ({ layout, ...props }) => {
  const Masthead = MASTHEADS[layout] ?? MASTHEADS['left-aligned'];
  return <Masthead {...props} />;
};
