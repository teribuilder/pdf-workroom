declare module 'bentopdf-pdfium' {
  /** Emscripten runtime exposed by the bundled PDFium engine. */
  const createModule: (options?: Record<string, unknown>) => Promise<any>;
  export default createModule;
}
