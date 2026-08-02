// Dichiarazione minima dei tipi per "pdf-parse" (non ha tipi ufficiali).
declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
  }
  function pdfParse(buffer: Buffer): Promise<PdfParseResult>;
  export = pdfParse;
}
