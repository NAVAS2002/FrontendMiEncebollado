import { API_BASE, ApiError, request } from "./client";
import { getSession } from "./session";
import type { CategoryOut, MenuOut, ModifierOut, ProductOut } from "./types";

export async function getMenu(onlyAvailable = false): Promise<MenuOut> {
  return request<MenuOut>("/catalog/menu", { query: { only_available: onlyAvailable } });
}

export async function listProducts(onlyAvailable = false): Promise<ProductOut[]> {
  return request<ProductOut[]>("/catalog/products", { query: { only_available: onlyAvailable } });
}

export async function listCategories(): Promise<CategoryOut[]> {
  return request<CategoryOut[]>("/catalog/categories");
}

export async function createCategory(name: string, sortOrder = 0): Promise<CategoryOut> {
  return request<CategoryOut>("/catalog/categories", {
    method: "POST",
    body: { name, sort_order: sortOrder },
  });
}

export async function renameCategory(
  categoryId: string,
  name: string,
  sortOrder: number,
): Promise<CategoryOut> {
  return request<CategoryOut>(`/catalog/categories/${categoryId}`, {
    method: "PATCH",
    body: { name, sort_order: sortOrder },
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await request<void>(`/catalog/categories/${categoryId}`, { method: "DELETE" });
}

export interface ProductInput {
  category_id: string;
  name: string;
  price: string;
  sku?: string | null;
  description?: string | null;
  sort_order?: number;
  prints_to_kitchen?: boolean;
  track_inventory?: boolean;
  stock_quantity?: number;
  custom_price_allowed?: boolean;
}

export async function createProduct(input: ProductInput): Promise<ProductOut> {
  return request<ProductOut>("/catalog/products", { method: "POST", body: input });
}

export async function updateProduct(
  productId: string,
  input: Partial<Omit<ProductInput, "sku" | "stock_quantity">>,
): Promise<ProductOut> {
  return request<ProductOut>(`/catalog/products/${productId}`, { method: "PATCH", body: input });
}

export async function setProductAvailability(productId: string, isAvailable: boolean): Promise<ProductOut> {
  return request<ProductOut>(`/catalog/products/${productId}/availability`, {
    method: "PUT",
    body: { is_available: isAvailable },
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await request<void>(`/catalog/products/${productId}`, { method: "DELETE" });
}

/** Sube (o reemplaza) la foto de un producto. Mismo patrón que
 * `uploadReceipt`: multipart, no pasa por `request()` porque eso solo
 * manda JSON. */
export async function uploadProductImage(productId: string, file: File): Promise<ProductOut> {
  const session = getSession();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/catalog/products/${productId}/image`, {
    method: "POST",
    headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "UNKNOWN", data?.error?.message ?? "Error al subir la foto");
  }
  return data as ProductOut;
}

export async function removeProductImage(productId: string): Promise<ProductOut> {
  return request<ProductOut>(`/catalog/products/${productId}/image`, { method: "DELETE" });
}

export async function setProductStock(
  productId: string,
  quantity: number,
  trackInventory: boolean,
): Promise<ProductOut> {
  return request<ProductOut>(`/catalog/products/${productId}/stock`, {
    method: "PUT",
    body: { quantity, track_inventory: trackInventory },
  });
}

// --- Opciones (grupos de modificadores: tamaño, sabor, etc.) ---
export interface ModifierInput {
  name: string;
  price_delta: string;
  is_default?: boolean;
  track_inventory?: boolean;
  stock_quantity?: number;
}

export async function addModifierGroup(
  productId: string,
  input: { name: string; min_select: number; max_select: number; modifiers: ModifierInput[] },
): Promise<{ id: string }> {
  return request<{ id: string }>(`/catalog/products/${productId}/modifier-groups`, {
    method: "POST",
    body: input,
  });
}

export async function deleteModifierGroup(groupId: string): Promise<void> {
  await request<void>(`/catalog/modifier-groups/${groupId}`, { method: "DELETE" });
}

export async function addModifier(groupId: string, input: ModifierInput): Promise<ModifierOut> {
  return request<ModifierOut>(`/catalog/modifier-groups/${groupId}/modifiers`, {
    method: "POST",
    body: input,
  });
}

export async function updateModifier(
  modifierId: string,
  input: { name?: string; price_delta?: string; is_default?: boolean },
): Promise<void> {
  await request<void>(`/catalog/modifiers/${modifierId}`, { method: "PATCH", body: input });
}

export async function setModifierStock(
  modifierId: string,
  quantity: number,
  trackInventory: boolean,
): Promise<void> {
  await request<void>(`/catalog/modifiers/${modifierId}/stock`, {
    method: "PUT",
    body: { quantity, track_inventory: trackInventory },
  });
}

export async function deleteModifier(modifierId: string): Promise<void> {
  await request<void>(`/catalog/modifiers/${modifierId}`, { method: "DELETE" });
}
