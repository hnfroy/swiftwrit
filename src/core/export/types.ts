import type { Doc, PageSettings } from "../document";
export interface Exporter {
  id: string;
  label: string;
  ext: string;
  mime: string;
  render(doc: Doc, settings: PageSettings): Promise<Blob>;
}
