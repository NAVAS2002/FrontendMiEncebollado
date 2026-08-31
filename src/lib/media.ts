import { API_BASE } from "../api/client";

/** `image_url` del backend es una ruta relativa ("/catalog/products/{id}/image");
 * esto arma la URL completa para un <img src>. */
export function productImageSrc(imageUrl: string | null): string | null {
  return imageUrl ? `${API_BASE}${imageUrl}` : null;
}
