import * as Sentry from "@sentry/node";

import { sentryOptions } from "@/lib/monitoring/sentry-options";

Sentry.init(sentryOptions("server"));
