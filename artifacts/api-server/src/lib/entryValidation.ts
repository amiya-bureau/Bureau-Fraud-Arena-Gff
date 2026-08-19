/**
 * Entry-form validation. This is a B2B booth, so lead quality matters more than
 * play count — but never at the cost of turning a real visitor away, which is
 * why the free-mail rule has an explicit override rather than a hard block.
 */

/** Rejected unless the visitor takes the "I don't have one" override. */
const FREE_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.in",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "outlook.in",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "rediffmail.com",
  "rediff.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "icloud.com",
  "me.com",
  "aol.com",
]);

// Deliberately conservative: a booth form is not the place for clever parsing.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export interface FieldError {
  field: string;
  message: string;
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1);
}

export function isFreeMail(email: string): boolean {
  return FREE_MAIL_DOMAINS.has(emailDomain(normalizeEmail(email)));
}

/** Strips formatting and an explicit Indian country/trunk prefix. */
export function normalizePhone(raw: string): string {
  const compact = raw.replace(/[\s\-()./]/g, "");
  const digits = compact.replace(/\D/g, "");

  if (compact.startsWith("+91")) return digits.slice(2);
  if (digits.length === 14 && digits.startsWith("0091")) return digits.slice(4);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);

  return digits;
}

export function isValidIndianMobile(normalized: string): boolean {
  return /^[6-9]\d{9}$/.test(normalized);
}

export function firstNameOf(workName: string): string {
  const [first] = workName.trim().split(/\s+/);
  return first && first.length > 0 ? first : workName.trim();
}

export interface EntryInput {
  workName: string;
  email: string;
  phone: string;
  company: string;
  noWorkEmail?: boolean;
}

export interface ValidatedEntry {
  workName: string;
  email: string;
  phone: string;
  company: string;
  noWorkEmail: boolean;
}

export function validateEntry(
  input: EntryInput,
): { ok: true; value: ValidatedEntry } | { ok: false; error: FieldError } {
  const workName = input.workName.trim();
  if (workName.length < 2) {
    return {
      ok: false,
      error: { field: "workName", message: "Please enter your name." },
    };
  }

  const email = normalizeEmail(input.email);
  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      error: { field: "email", message: "That doesn't look like a valid email." },
    };
  }

  const noWorkEmail = input.noWorkEmail === true;
  if (!noWorkEmail && isFreeMail(email)) {
    return {
      ok: false,
      error: { field: "email", message: "Please use your work email" },
    };
  }

  const phone = normalizePhone(input.phone);
  if (!isValidIndianMobile(phone)) {
    return {
      ok: false,
      error: {
        field: "phone",
        message: "Enter a 10-digit mobile number starting with 6, 7, 8 or 9.",
      },
    };
  }

  const company = input.company.trim();
  if (company.length === 0) {
    return {
      ok: false,
      error: { field: "company", message: "Please enter your company." },
    };
  }

  return { ok: true, value: { workName, email, phone, company, noWorkEmail } };
}
