import { UNI_NAME, UNI_SHORT } from "@/lib/course/types";

type Signature = {
  founderName: string;
  signatureText: string;
  signatureImage: string;
};

const SIGNATURE_FONT =
  '"Segoe Script", "Bradley Hand", "Snell Roundhand", cursive';

/**
 * A printable certificate. "Download" uses the browser's print dialog (Save as
 * PDF); print CSS isolates the certificate card. Signature is an uploaded image
 * when set, otherwise a script-font rendering of the founder's name.
 */
export function Certificate({
  recipientName,
  headline,
  subtitle,
  signature,
  dateStr,
}: {
  recipientName: string;
  headline: string;
  subtitle: string;
  signature: Signature;
  dateStr: string;
}) {
  const founder = signature.founderName || "The Founder";
  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-print, #certificate-print * { visibility: visible !important; }
          #certificate-print { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
          [data-noprint] { display: none !important; }
        }
      `}</style>
      <div
        id="certificate-print"
        className="md-card rounded-xl border border-border bg-surface px-6 py-12 text-center sm:px-14"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-muted">{UNI_NAME}</p>
        <h1 className="mt-8 font-display text-3xl tracking-tight sm:text-4xl">
          {headline}
        </h1>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted">
          Awarded to
        </p>
        <p className="mt-2 font-display text-3xl tracking-tight">{recipientName}</p>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted">
          {subtitle}
        </p>

        <div className="mt-12 flex items-end justify-between gap-6 text-left">
          <div>
            <div className="flex h-14 items-end">
              {signature.signatureImage ? (
                <img
                  src={signature.signatureImage}
                  alt={`${founder} signature`}
                  className="max-h-14 max-w-[16rem] object-contain"
                />
              ) : (
                <span
                  className="text-3xl leading-none"
                  style={{ fontFamily: SIGNATURE_FONT }}
                >
                  {signature.signatureText || founder}
                </span>
              )}
            </div>
            <div className="mt-1 w-56 border-t border-border pt-1">
              <p className="text-sm font-medium">{founder}</p>
              <p className="text-xs text-muted">Founder, {UNI_SHORT}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs text-faint">{dateStr}</p>
          </div>
        </div>
      </div>

      <div data-noprint className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="md-interactive inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-medium text-accent-fg"
        >
          Download / print certificate
        </button>
      </div>
    </div>
  );
}
