export interface IResolve {
  cli: (dir: string) => string;
  app: (dir: string) => string;
  src: (dir: string) => string;
  public: (dir: string) => string;
  pwa: (dir: string) => string;
  ssr: (dir: string) => string;
  cordova: (dir: string) => string;
  capacitor: (dir: string) => string;
  electron: (dir: string) => string;
  bex: (dir: string) => string;
}

export interface QuasarPathContext {
  /** True when the run-specific generated root, cache and config paths are configured. */
  readonly isolated: boolean;
  /** Generated entry points, tsconfig and declarations; defaults to appDir/.quasar. */
  readonly generatedRoot: string;
  /** Cache root before the dev/prod-mode prefix; defaults to appDir/node_modules/.q-cache. */
  readonly cacheRoot: string;
  /** Temporary compiled config location; defaults to appDir. */
  readonly configTempDir: string;
}

export interface QuasarAppPaths {
  cliDir: string;
  appDir: string;
  srcDir: string;
  publicDir: string;
  pwaDir: string;
  ssrDir: string;
  cordovaDir: string;
  capacitorDir: string;
  electronDir: string;
  bexDir: string;

  quasarConfigFilename: string;
  quasarConfigInputFormat: "esm" | "cjs" | "ts";
  quasarConfigOutputFormat: "esm" | "cjs";

  /** Immutable generated-path context captured before loading user configuration. */
  readonly pathContext: QuasarPathContext;

  resolve: IResolve;
}
