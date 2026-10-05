import { RELEASE_GUARDIAN_MODES, type ReleaseGuardianMode } from '@release-guardian/shared';
import { InputValidationError } from './errors.js';

/**
 * The only place (together with the future container.ts) that interprets the mode.
 * Application code depends on interfaces and never branches on mode (MASTER_SPEC.md 7.1).
 */
export const MODE_ENV_VAR = 'RELEASE_GUARDIAN_MODE';

/** Pure: the caller passes the environment in, core never touches process.env. Defaults to demo. */
export function resolveMode(env: Readonly<Record<string, string | undefined>>): ReleaseGuardianMode {
  const raw = env[MODE_ENV_VAR]?.trim().toLowerCase();
  if (raw === undefined || raw === '') {
    return 'demo';
  }
  const mode = RELEASE_GUARDIAN_MODES.find((m) => m === raw);
  if (mode === undefined) {
    throw new InputValidationError(
      `Invalid ${MODE_ENV_VAR} "${raw}". Expected one of: ${RELEASE_GUARDIAN_MODES.join(', ')}`,
    );
  }
  return mode;
}
