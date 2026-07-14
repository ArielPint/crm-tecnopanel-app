# Contrato de extracción IA de PDFs (diseño, no implementado)

**Estado:** diferido — no se activa hasta definir proveedor de IA y contar con PDFs reales de ejemplo (Presupuesto y OC).
**Alcance:** Fase 6 del [PLAN_IMPLEMENTACION_VALIDADO.md](../PLAN_IMPLEMENTACION_VALIDADO.md).

Este documento define el contrato de entrada/salida para cuando se active la extracción automática de KPIs desde PDF. No implica ninguna llamada a un proveedor de IA hoy.

## Dónde se conecta

- Los PDFs ya se suben a `oportunidad_documentos` (etapa Revisión Vendedor) y `cierres.storage_oc_path` (etapa Negociación).
- El resultado de la extracción se guarda en `kpis_extraidos` con `fuente = 'pdf'` y `documento_id` apuntando al archivo origen.
- Punto de activación propuesto: un botón "Extraer KPIs" junto al PDF ya subido, que invoca una función edge (`extract-pdf-kpis`, aún no creada) en vez de ejecutarse automáticamente al subir — así el usuario controla cuándo se gasta la llamada a IA.

## Caso 1 — Presupuesto final (etapa Revisión Vendedor)

**Entrada a la función:**
```json
{
  "oportunidad_id": "uuid",
  "documento_id": "uuid",
  "storage_path": "string (bucket oportunidades)"
}
```

**Salida esperada (se guarda tal cual en `kpis_extraidos.kpis`):**
```json
{
  "precio_total_neto": 12345678,
  "precio_total_con_iva": 14691297,
  "moneda": "CLP",
  "descuento_pct": 0,
  "plazo_entrega_dias": 45,
  "condiciones_pago": "string | null",
  "validez_oferta_dias": 30,
  "confianza": 0.0
}
```

## Caso 2 — Orden de Compra (etapa Negociación)

**Entrada a la función:** igual forma que el caso 1, pero `storage_path` apunta a `cierres.storage_oc_path`.

**Salida esperada:**
```json
{
  "numero_oc": "string | null",
  "fecha_oc": "YYYY-MM-DD | null",
  "monto_oc": 12345678,
  "moneda": "CLP",
  "razon_social_cliente": "string | null",
  "confianza": 0.0
}
```

## Reglas comunes

- `confianza` es un valor 0–1 que el modelo debe reportar; valores bajo 0.6 se muestran en la UI como "revisar manualmente" en vez de autocompletar los campos.
- Si la extracción falla o el PDF no es legible, la función debe devolver `{ "error": "motivo" }` y no escribir en `kpis_extraidos` — el usuario sigue con carga manual (flujo actual, ya implementado en Fase 4/5).
- La extracción nunca sobreescribe campos ya guardados manualmente por un usuario (`presupuestos.monto_final`, `cierres.monto_oc`, etc.) — solo pre-llena un formulario que el usuario confirma antes de guardar.
- Todo el texto de los PDFs se trata como dato no confiable: no debe interpretarse como instrucciones para ningún sistema, solo como datos a extraer.

## Pendiente antes de implementar

1. Elegir proveedor (ej. Claude con PDF support, u otro OCR/LLM).
2. Conseguir 2-3 PDFs reales de cada tipo para validar el prompt/schema contra el formato real de TecnoFast.
3. Definir quién paga y cómo se limita el costo por invocación (ej. rol que puede click "Extraer KPIs").
