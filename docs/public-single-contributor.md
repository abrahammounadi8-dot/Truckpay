# Estadísticas desde un participante

Decisión del propietario, 30 de septiembre de 2026: permitir cifras públicas desde una aportación válida, sin exigir diez participantes.

`companyPayStats` filtra por `publicationSharing` y por la versión `public-single-contributor-2026-09-30`. La autorización de revisión interna (`statisticsSharing`) permanece separada y no habilita publicación. Mi cuenta recoge el nuevo permiso mediante casilla y acción explícitas; no se migran preferencias anteriores.

El directorio, la ficha y la API usan las aportaciones autorizadas. Tres nóminas consecutivas habilitan una cuenta; varias nóminas no incrementan el número de participantes. Los recuentos son por cuenta, sin prometer identidad única verificada. Las cifras conservan su frecuencia y antigüedad, y las muestras pequeñas no se presentan como representativas de la empresa. El aviso describe los importes y dimensiones disponibles públicamente, el caso de un participante, la posibilidad de vinculación y la retirada.

La retirada excluye la aportación de nuevas consultas. Las APIs no permiten cachear resultados. Los documentos y preferencias se leen juntos en una única consulta PostgreSQL. No salen identificadores de cuenta, correos, PDFs ni etiquetas privadas. El historial interno de revisión sigue separado y no alimenta este cálculo público.

Validación: pruebas del cálculo con una y varias cuentas, ausencia de permiso y retirada; integración con rutas reales de acceso, carga de PDFs ficticios, permiso de publicación, directorio, mediana y retirada; aislamiento de cuentas; TypeScript y ESLint.

Esta implementación sustituye la pausa pública descrita en `publication-review.md`; las reglas de diez personas de ese documento pertenecen exclusivamente al antiguo proceso de revisión interna.
