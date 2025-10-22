/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOCODB_BASE_URL: string;
  readonly VITE_NOCODB_API_TOKEN: string;
  readonly VITE_USE_MOCK_DATA: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
