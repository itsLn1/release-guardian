export const RELEASE_GUARDIAN_MODES = ['demo', 'live'] as const;

export type ReleaseGuardianMode = (typeof RELEASE_GUARDIAN_MODES)[number];
