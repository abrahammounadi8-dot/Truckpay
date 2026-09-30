# Verificación de persona, acceso y conservación

Fecha: 30 de septiembre de 2026. Seguimiento: issue #7.

## Objetivo

Definir un procedimiento mínimo y auditable para decidir cuándo dos cuentas corresponden a personas distintas antes de usar sus datos en una cohorte de revisión de estadísticas salariales.

Este procedimiento **no activa publicación pública**. Solo permite preparar revisiones internas. La publicación seguirá requiriendo un consentimiento separado, una decisión de lanzamiento y el resto de controles del issue #7.

## Principios

- Una cuenta, correo o sesión verificada no demuestra una persona distinta.
- No se almacenarán copias de pasaportes, DNI, PPSN, carnés de conducir ni otros documentos de identidad para este fin.
- No se pedirá información adicional salvo la estrictamente necesaria para resolver duplicidad.
- Cada persona aprobada recibe una clave opaca estable, `person_key`, que no contiene correo, nombre ni identificadores públicos.
- Varias cuentas de la misma persona deben apuntar a la misma `person_key`.
- Una cuenta dudosa, duplicada o no revisada queda excluida de cualquier cohorte.
- El consentimiento de revisión interna y la verificación de persona son controles distintos.
- Ninguna retirada de consentimiento debe borrar el historial técnico necesario para demostrar que una cohorte antigua fue invalidada.

## Procedimiento de verificación

### 1. Entrada a revisión

Una cuenta solo puede entrar en revisión si:

1. Tiene correo verificado.
2. Tiene al menos una nómina válida para el análisis privado.
3. Ha aceptado el aviso interno vigente.
4. No está ya vinculada a una `person_key` revocada o marcada como conflicto.

### 2. Comprobación de duplicidad

El operador revisa únicamente señales ya disponibles en el servicio y no visibles públicamente. El objetivo es decidir si la cuenta parece pertenecer a una persona ya revisada.

Se permite comparar, de forma minimizada:

- identificador interno de cuenta;
- historial de cuentas ya vinculadas;
- empresa normalizada;
- frecuencia salarial;
- ventanas temporales de empleo;
- huellas técnicas derivadas de los payloads, cuando existan y no expongan el contenido bruto.

No se debe usar una coincidencia aislada de empresa, salario, turno o fechas como prueba de identidad.

### 3. Resultado

Solo existen tres resultados:

- **Aprobada**: se crea o reutiliza una `person_key` estable.
- **Conflicto**: hay indicios de que corresponde a una persona ya existente; se vincula a la misma `person_key` o se excluye hasta resolverlo.
- **No verificada**: no hay información suficiente; la cuenta queda fuera de la cohorte.

No existe aprobación automática.

### 4. Registro mínimo

En `truckpay_publication_identities` se conserva:

- `account_id`;
- `person_key`;
- estado de revisión;
- fecha de revisión;
- referencia corta del operador (`reviewer_reference`);
- fecha y motivo de revocación, cuando exista.

`reviewer_reference` debe describir la decisión sin copiar datos personales, por ejemplo: `manual-duplicate-check-2026-09-30`.

## Acceso

- Acceso únicamente para el operador autorizado de MyTruckPay y procesos de backend que necesiten comprobar elegibilidad.
- No exponer `person_key`, `reviewer_reference` ni estados internos en rutas públicas, HTML, analítica de cliente o logs de aplicación.
- No permitir edición desde formularios de usuario.
- Todas las modificaciones deben ocurrir desde una ruta administrativa no pública o una operación de mantenimiento autenticada.
- Registrar quién hizo el cambio, cuándo y sobre qué cuenta, sin registrar nóminas ni payloads completos.

## Conservación

### Mientras exista una cuenta

Mantener la correspondencia `account_id -> person_key` mientras sea necesaria para impedir que una misma persona vuelva a contarse como nueva mediante otra cuenta.

### Tras borrar la cuenta

- Eliminar la relación directa con la cuenta y cualquier dato que ya no sea necesario.
- Conservar únicamente una clave opaca no reversible en el historial de cohortes cuando sea necesaria para evitar reutilización de una persona en una revisión ya reservada o para demostrar la invalidación de una cohorte.
- La clave histórica no debe permitir reconstruir nombre, correo ni nóminas.
- El borrado de cuenta debe invalidar cualquier reserva activa relacionada.

### Revisiones periódicas

Cada 12 meses se revisará si las claves históricas siguen siendo necesarias. Las que no estén ligadas a una reserva, auditoría o prevención de doble conteo deberán eliminarse.

## Solicitudes de supresión

Cuando una persona solicite borrar sus datos:

1. borrar datos personales y documentos conforme a la política general;
2. eliminar la relación directa de su cuenta con el registro de identidad;
3. invalidar revisiones o reservas afectadas;
4. conservar solo una clave histórica opaca cuando sea estrictamente necesaria para impedir doble conteo o mantener la integridad del registro de una cohorte ya invalidada;
5. registrar la razón de cualquier conservación residual sin copiar datos personales.

Antes de producción con participantes reales, esta retención residual debe reflejarse en la política de privacidad y revisarse jurídicamente como parte del análisis GDPR.

## Consentimiento separado para publicación

El aviso `tenure-review-2026-09-29` solo permite revisión interna.

Antes de publicar cualquier estadística se deberá crear un segundo consentimiento, distinto y revocable, que indique como mínimo:

- qué métricas podrán publicarse;
- que solo se publicarán grupos que superen el umbral aprobado;
- que no se publicarán nombres, correos, nóminas ni recuentos exactos;
- que retirar el permiso excluye futuras publicaciones y puede invalidar snapshots aún no publicados;
- que datos ya copiados por terceros no pueden recuperarse;
- la fecha y versión del aviso aceptado.

No debe existir migración automática desde el consentimiento interno al consentimiento de publicación.

## Criterio de cierre de esta parte del issue #7

Esta parte queda lista para implementación cuando:

- el esquema admite estado de revisión, referencia, fechas y revocación;
- existe una operación administrativa autenticada para aprobar, vincular, excluir y revocar;
- ninguna ruta pública puede leer esos campos;
- las pruebas demuestran que dos cuentas vinculadas a la misma `person_key` cuentan como una sola persona;
- una cuenta no verificada nunca cuenta;
- borrar o revocar una identidad invalida la reserva correspondiente;
- los logs no contienen payloads salariales ni datos de identidad;
- la política de privacidad describe la retención residual antes de usar participantes reales.

## No cambia todavía

- La publicación pública permanece desactivada.
- El umbral de 10 personas sigue siendo una hipótesis de revisión, no una garantía ni una decisión final.
- No se toca la producción de Vercel ni los datos reales almacenados.
- El issue #7 permanece abierto.
