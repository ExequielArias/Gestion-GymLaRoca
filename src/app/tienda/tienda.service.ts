import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';

export interface ProductoDB {
    id: any;
    Nombre: string;
    Descripcion?: string;
    Precio?: any;
    Cantidad?: any;
    Imagen?: string;
    Categoria?: string;
    // imageUrl agregado por el servicio
    imageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class TiendaService {

    constructor() { }

    /**
     * Obtiene productos desde la tabla "Productos" y resuelve la URL pública
     * de la imagen (si existe) usando el bucket `imagenes` y la carpeta `Tienda`.
     */
    async getProductos(): Promise<ProductoDB[]> {
        // Intentar obtener desde 'Productos' (tabla con mayúsculas) y si no hay filas,
        // intentar desde 'productos' (nombre en minúsculas / vista).
        let rows: ProductoDB[] = [];
        let lastError: any = null;

        try {
            const { data, error } = await supabase.from('Productos').select('*');
            if (error) {
                console.warn('[TiendaService] warning leyendo Products (Productos):', error);
                lastError = error;
            } else {
                rows = (data || []) as ProductoDB[];
                console.debug('[TiendaService] fetched rows from Productos:', rows.length);
            }
        } catch (e) {
            console.warn('[TiendaService] exception reading Productos:', e);
            lastError = e;
        }

        if (!rows || rows.length === 0) {
            try {
                const { data, error } = await supabase.from('productos').select('*');
                if (error) {
                    console.warn('[TiendaService] warning leyendo products (productos):', error);
                    if (!rows || rows.length === 0) lastError = error;
                } else {
                    rows = (data || []) as ProductoDB[];
                    console.debug('[TiendaService] fetched rows from productos:', rows.length);
                }
            } catch (e) {
                console.warn('[TiendaService] exception reading productos:', e);
                if (!rows || rows.length === 0) lastError = e;
            }
        }

        if ((!rows || rows.length === 0) && lastError) {
            // No filas y algún error: loguear y continuar (retornamos [])
            console.warn('[TiendaService] no se obtuvieron filas de Productos/productos. ultimo error:', lastError);
        }

        // Mapear y resolver URLs (si el bucket es público getPublicUrl funcionará,
        // si no, intentamos signed URL como fallback)
        const mapped = await Promise.all(rows.map(async (p) => {
            // Soportar valores de Imagen que ya incluyan carpeta, sean solo filename o una URL completa
            let imageUrl = 'https://via.placeholder.com/300x300?text=Sin+imagen';

            if (p.Imagen) {
                const raw = String(p.Imagen).trim();

                // Si ya es una URL pública, úsala tal cual
                if (/^https?:\/\//i.test(raw)) {
                    imageUrl = raw;
                } else {
                    // Construir ruta dentro del bucket: si contiene barra asumimos que ya incluye carpeta
                    const imagenFile = (raw.startsWith('Tienda/') || raw.includes('/')) ? raw : `Tienda/${raw}`;

                    try {
                        const { data: pub } = supabase.storage.from('imagenes').getPublicUrl(imagenFile);
                        if (pub && pub.publicUrl) {
                            imageUrl = pub.publicUrl;
                        } else {
                            // fallback: intentar signed url
                            try {
                                const { data: signed } = await supabase.storage.from('imagenes').createSignedUrl(imagenFile, 60 * 60);
                                if (signed && signed.signedUrl) imageUrl = signed.signedUrl;
                            } catch (e) {
                                console.warn('[TiendaService] No se pudo generar signedUrl para', imagenFile, e);
                            }
                        }
                    } catch (e) {
                        console.warn('[TiendaService] Error resolviendo imagen en storage:', imagenFile, e);
                    }
                }
            }

            return {
                ...p,
                imageUrl
            } as ProductoDB;
        }));

        return mapped;
    }

    /**
     * Aplica la venta: decrementa el stock en la tabla Productos según el carrito.
     * Retorna { success: true } o { success: false, error }
     */
    async applySale(cart: Array<{ id: number; quantity: number }>) {
        // Realizar updates por producto
        const results: Array<{ id: number; error?: any }> = [];

        for (const item of cart) {
            try {
                // Obtener la fila actual (opcional, para garantizar base)
                const { data: currentRows, error: readErr } = await supabase.from('Productos').select('Cantidad').eq('id', item.id).limit(1).single();
                if (readErr) {
                    results.push({ id: item.id, error: readErr });
                    continue;
                }
                const current = (currentRows && (currentRows as any).Cantidad) ?? null;
                if (current === null) {
                    results.push({ id: item.id, error: 'Producto no encontrado' });
                    continue;
                }
                const newStock = Math.max(0, Number(current) - Number(item.quantity));

                const { error: updateErr } = await supabase.from('Productos').update({ Cantidad: newStock }).eq('id', item.id);
                if (updateErr) {
                    results.push({ id: item.id, error: updateErr });
                } else {
                    results.push({ id: item.id });
                }
            } catch (e) {
                results.push({ id: item.id, error: e });
            }
        }

        const failed = results.filter(r => r.error);
        if (failed.length > 0) {
            return { success: false, details: failed };
        }
        return { success: true };
    }

}
