export {};

declare global {
  interface WebMCPToolAnnotations {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  }

  interface WebMCPTool {
    name: string;
    title?: string;
    description: string;
    inputSchema?: Record<string, unknown>;
    annotations?: WebMCPToolAnnotations;
    execute: (
      input: Record<string, unknown>,
      options: { signal: AbortSignal },
    ) => string | Promise<string>;
  }

  interface WebMCPRegisterOptions {
    signal?: AbortSignal;
    exposedTo?: string[];
  }

  interface ModelContext {
    registerTool(tool: WebMCPTool, options?: WebMCPRegisterOptions): Promise<void>;
  }

  interface Document {
    readonly modelContext?: ModelContext;
  }
}
