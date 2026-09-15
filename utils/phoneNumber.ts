export type PhoneCountry = 'MY' | 'ID';

export const PHONE_PREFIXES: Record<PhoneCountry, string> = {
  MY: '+60',
  ID: '+62',
};

export function getPhoneCountry(value: string): PhoneCountry | undefined {
  const normalized = value.trim();
  if (normalized.startsWith('+60')) return 'MY';
  if (normalized.startsWith('+62')) return 'ID';
  return undefined;
}

export function getNationalPhoneNumber(value: string): string {
  const country = getPhoneCountry(value);
  const national = country ? value.trim().slice(PHONE_PREFIXES[country].length) : value;
  return national.replace(/\D/g, '').replace(/^0+/, '');
}

export function formatPhoneNumber(value: string, country: PhoneCountry): string {
  const national = getNationalPhoneNumber(value);
  return national ? PHONE_PREFIXES[country] + national : '';
}
