/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  DB?: D1Database;
  MEDIA?: R2Bucket;
  CACHE?: KVNamespace;
  SITE_URL?: string;
  APP_NAME?: string;
}
