import { request } from "./client";

export interface SettingsOut {
  name: string;
  tax_id: string | null;
  address: string;
  ticket_footer: string;
  tax_enabled: boolean;
  tax_rate: string;
  takeaway_surcharge_enabled: boolean;
  takeaway_surcharge: string;
  require_transfer_receipt: boolean;
  card_payment_enabled: boolean;
}

export type SettingsPatch = Partial<SettingsOut>;

export async function getSettings(): Promise<SettingsOut> {
  return request<SettingsOut>("/settings");
}

export async function updateSettings(patch: SettingsPatch): Promise<SettingsOut> {
  return request<SettingsOut>("/settings", { method: "PATCH", body: patch });
}
