import { EventSource as moduleToPatch } from 'launchdarkly-eventsource';

export const EventSource = moduleToPatch; // Re-export from .js file, because the original module doesn't have types
