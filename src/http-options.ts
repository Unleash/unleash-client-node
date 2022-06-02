import type { URL } from 'url';
import type { Agent } from 'http';

export interface HttpOptions {
  agent?: (url: URL) => Agent;
  rejectUnauthorized?: boolean;
}
