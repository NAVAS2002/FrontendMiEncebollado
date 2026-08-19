import { request } from "./client";
import type { DashboardOut } from "./types";

export async function getDashboard(businessDate?: string): Promise<DashboardOut> {
  return request<DashboardOut>("/reports/dashboard", { query: { business_date: businessDate } });
}
