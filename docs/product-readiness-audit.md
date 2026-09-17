# TruckPay: auditoría previa a documentos reales

17 de septiembre de 2026. Resultado: apto para continuar pruebas con datos ficticios; no listo para incorporar nóminas reales de usuarios.

## Correcciones aplicadas en la vista local

- Registro personal: menú, título y estado vacío en español explican que se puede empezar con una nómina. La comparación exige tres y datos de empresa/periodo.
- Borrado: confirmación explícita y opción de cancelar. Solo informa de éxito cuando el servidor devuelve confirmación; captura errores de red/servidor y permite reintentar. Se aclara que elimina nóminas y perfil de la sesión.
- Guardado: la decisión de abrir el análisis usa la misma regla de acceso que las páginas protegidas; contar tres registros ya no basta.
- Fechas: rechaza días inexistentes y periodos invertidos. Conserva como ausentes los campos opcionales sin inventar fechas.
- Archivos: comprueba el límite de 8 MB antes de convertir el archivo completo a un segundo búfer. No sustituye límites de petición a nivel de servidor/proxy.
- Aviso visible en siete idiomas: versión de prueba, usar documentos ficticios, acceso ligado al navegador y datos almacenados en el servidor. Se aclara que perder la sesión no borra los datos.
- Texto de carga en español distingue originales temporales de cifras guardadas.

## Pruebas realizadas

- TypeScript y ESLint correctos para los archivos cambiados.
- 54 pruebas: 53 pasan y una OCR omitida por falta de Tesseract. Se utiliza el comprobador TypeScript en proceso ya existente en el proyecto.
- Casos nuevos: borrado confirmado, respuesta fallida, respuesta sin confirmación, fallo de red, días imposibles, periodos invertidos y fecha bisiesta válida.
- Navegador: portada, registro vacío y carga accesibles; Empresas sin nóminas redirige a bienvenida; el borrado abre confirmación y Cancelar vuelve al estado inicial. No se ejecutó un borrado real.
- Comprobación previa de comparación: menos de tres y duplicados no desbloquean; tres completas desbloquean; retirar una vuelve a bloquear; datos incompletos y mezcla de empresas bloquean.
- No se subieron nóminas reales ni se añadieron documentos ficticios al almacén de la aplicación en esta auditoría. Las pruebas de dominio usan datos sintéticos aislados.

## Pendientes antes de documentos reales

| Área | Hallazgo | Criterio de cierre |
|---|---|---|
| Acceso | Cookie anónima, sin cuenta recuperable ni acceso entre dispositivos | Autenticación, recuperación y cierre de sesión probados; no basta con tener tres nóminas |
| Persistencia | Adaptador PostgreSQL preparado; esta revisión no verifica proveedor, migración ni restauración de producción | Base configurada, migración y restauración desde copia probadas |
| Privacidad | Se describe agregación seudonimizada; faltan decisiones de publicación, retención, contacto y borrado verificable tras perder acceso | Flujo y textos acordes al tratamiento real; revisión especializada antes del lanzamiento |
| Comparación | El cotejo lado a lado usa reportes públicos declarados; las medianas de nóminas aparecen por otra vía | Unificar o diferenciar claramente ambos tipos de evidencia y mostrar tamaño de muestra |
| Navegación | Conviven registro privado, publicación pública y alta de empresas | Decidir qué ve un conductor y separar los flujos de empresa/publicación |
| Idiomas | Nueva bienvenida y confirmación de borrado usan español/inglés; otras pantallas conservan textos anteriores | Completar traducciones y revisión contextual de los siete idiomas |
| Móvil y accesibilidad | Estructura responsive en código; no se ha completado una prueba en móvil ni lector de pantalla | Verificar 320/375 px, zoom, teclado, foco, etiquetas y lectura de errores |
| Lectura documental | Falta OCR local, no hay prueba end-to-end nueva con tres archivos | Probar PDF y foto con datos sintéticos, errores, duplicados y desbloqueo completo |
| Resiliencia | La bienvenida depende de lecturas del almacén; no hay recuperación de error específica comprobada | Fallos de base/red muestran estado recuperable sin afirmar que los datos están vacíos |
| Seguridad/abuso | No se identificó limitación de peticiones en los handlers revisados; se parsea multipart antes del límite de archivo | Límites de petición, abuso, aislamiento y origen revisados y probados en despliegue |
| Elegibilidad | Tres registros completos no certifican autenticidad documental ni revisión humana; la regla depende de datos declarados | Definir exactamente qué significa desbloquear y no llamarlo certificación |
| Registro anual | Existe historial y cifras por nómina; no un informe anual agregado nuevo | Definir cálculo por periodo, monedas y tratamiento correcto de acumulados antes de implementarlo |

## Orden recomendado

1. Cerrar navegación y significado de las comparaciones; completar textos e idiomas.
2. Probar recorrido sintético completo y móvil, incluyendo fallos.
3. Implementar cuentas recuperables y cerrar almacenamiento, copias, privacidad y seguridad.
4. Verificar criterios de cierre antes de invitar usuarios a subir documentos reales.

Este documento es una revisión de producto y código con alcance limitado, no una certificación de seguridad o cumplimiento legal. Ningún servicio de pago se ha contratado ni se ha desplegado la aplicación.
