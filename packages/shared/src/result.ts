import type { ErrorInfo } from './errors.js';

/** Standard result envelope for MCP tools (MASTER_SPEC.md section 18.3). */
export interface ToolResult<T> {
  ok: boolean;
  /** One or two sentences. */
  summary: string;
  data?: T;
  error?: ErrorInfo;
}
