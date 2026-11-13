import { resetLinkPath } from '@/utils/passwordReset';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return resetLinkPath(path);
}
