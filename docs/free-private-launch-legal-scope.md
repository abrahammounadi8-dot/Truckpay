# MyTruckPay — lanzamiento gratuito y funcional: alcance legal y datos

28 septiembre 2026. Borrador de trabajo. No publicar como aviso legal ni admitir nóminas reales hasta completar y verificar los puntos pendientes.

## Alcance de la primera versión

Servicio gratuito con datos reales, cuenta recuperable, análisis privado para el conductor y las funciones públicas anunciadas (directorio, reportes y estadísticas por empresa) cuando cada flujo haya superado sus pruebas y garantías de privacidad. Los originales se procesan para extracción y se descartan; los campos extraídos y corregidos se almacenan para la cuenta. No se activan cobros. La gratuidad no reduce las obligaciones de protección de datos. No lanzar una demo limitada como sustituto del producto solicitado.

## Mapa de datos comprobado en main

| Flujo | Datos y destino actual | Pendiente |
|---|---|---|
| Identidad | Cookie tp_uid con UUID aleatorio | Cuenta, recuperación, cierre de sesión y migración segura de datos anónimos. |
| Extracción | PDF/foto por HTTP; imagen temporal para OCR; original no guardado como nómina | Verificar límites, registros y eliminación en producción. |
| Nóminas | Empresa, fechas, importes, horas y deducciones; JSON local o PostgreSQL si DATABASE_URL | Retención, proveedor, ubicación, copias, restauración y borrado. |
| Perfil | Empresa, antigüedad declarada, trabajo, vehículo, turno y tarifa | Minimizar datos y documentar finalidad. |
| Estadísticas | Nóminas y perfiles de todos los usuarios calculados en /api/companies/[slug]/stats y /api/analysis | Mantener esta función como objetivo del lanzamiento; documentar finalidad y base jurídica, información previa al conductor, límites de muestra y resistencia a identificación. Bajo el umbral de tres se ocultan medianas pero se muestran recuentos: corregir antes de habilitarla. |
| Reportes públicos | Datos semanales declarados en /api/reports | Decidir moderación, retirada y aviso antes de aceptar aportaciones reales. |
| Solicitudes de empresas | Nombre y datos de contacto en /api/listings | Retención y aviso propios. |
| Borrado | DELETE /api/session elimina nóminas y perfil de la cookie presente | Recuperación tras pérdida de cookie; copias y otros flujos separados. |

Archivos revisados: src/lib/payroll/session.ts; src/app/api/payslips/extract/route.ts; src/lib/payroll/extract-document.ts; src/lib/payroll/store.ts; src/lib/payroll/profile-store.ts; src/app/api/companies/[slug]/stats/route.ts; src/lib/payroll/company-stats.ts; src/app/api/analysis/route.ts; src/app/api/reports/route.ts; src/app/api/listings/route.ts; src/app/api/session/route.ts.

## Criterios antes de recibir nóminas reales

1. Cuentas recuperables, cierre de sesión y prueba de aislamiento entre usuarios.
2. Diseñar y probar estadísticas públicas seguras: documentar finalidad y base jurídica, informar previamente a usuarios, decidir si el uso requiere consentimiento separado, suprimir recuentos pequeños y segmentos identificables, impedir inferencias por combinación de consultas y probar con empresas pequeñas. Si no supera esta revisión, no aceptar nóminas reales hasta definir un lanzamiento completo acordado con el usuario.
3. Base de datos persistente, copia y restauración probadas. Definir conservación y eliminación de copias.
4. Inventario de proveedores, región de tratamiento, contratos de encargado y transferencias.
5. Documentar responsable y contacto, finalidad y base jurídica por flujo, datos exactos, plazos, destinatarios, derechos y gestión de incidentes. Evaluar si se requiere evaluación de impacto.
6. Publicar aviso de privacidad y condiciones gratuitas fieles al sistema real. El análisis orienta; no certifica que el salario sea legal o correcto.
7. Probar alta, recuperación, extracción, acceso, borrado y errores con datos ficticios en el despliegue final.
8. Verificar reportes públicos y solicitudes de empresas como flujos propios, con información, moderación, retirada y conservación antes de lanzar todas las funciones anunciadas.

## Borrador de aviso para completar

**Responsable:** [IDENTIDAD LEGAL] · [CONTACTO DE PRIVACIDAD].

**Finalidades:** [DATOS DE CUENTA] para acceso y recuperación; [CAMPOS DE NÓMINA Y PERFIL] para análisis privado. El original se procesa para extraer campos y no se conserva como documento de la cuenta [VERIFICAR EN PRODUCCIÓN]. La persona revisa y corrige los campos extraídos.

**Base jurídica:** [DEFINIR POR FINALIDAD; NO SUPONER CONSENTIMIENTO PARA TODO].

**Conservación:** [PLAZO O CRITERIO POR CATEGORÍA], incluidas copias y excepciones. Solicitudes de acceso, corrección y borrado en [MÉTODO].

**Proveedores y transferencias:** [ALOJAMIENTO, BASE, EMAIL, REGIÓN Y GARANTÍAS].

**Derechos:** contacto en [EMAIL] y derecho a reclamar ante la Data Protection Commission de Irlanda.

**Límite:** el resultado ayuda a revisar nóminas y puede contener errores; no constituye determinación jurídica de pagos debidos.

No publicar los campos entre corchetes sin completar y verificar.

## Guías oficiales

- https://www.dataprotection.ie/en/dpc-guidance/guidance-for-smes
- https://www.dataprotection.ie/en/faqs/responsibilities-data-controllers/how-do-i-make-privacy-policy
- https://www.dataprotection.ie/en/dpc-guidance/data-processing-agreements
- https://www.dataprotection.ie/en/organisations/know-your-obligations/data-protection-impact-assessments
