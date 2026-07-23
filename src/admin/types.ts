export type QuoteStatus =
  | "Uusi"
  | "Käsittelyssä"
  | "Tarjous lähetetty"
  | "Sovittu pajalle"
  | "Hyväksytty"
  | "Hylätty"
  | "Valmis"
  | "Arkistoitu";

export type QuoteImage = {
  id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  file_size: number;
  sort_order: number;
  signed_url?: string;
};

export type QuoteRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  status: QuoteStatus;
  customer_name: string;
  email: string;
  phone: string;
  license_plate: string;
  damage_description: string;
  preferred_contact_method: "phone" | "email";
  internal_notes: string | null;
  source: string;
  quote_images: QuoteImage[];
};
