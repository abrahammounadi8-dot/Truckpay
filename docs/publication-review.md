# Publicación de estadísticas: revisión pendiente

Fecha: 29 de septiembre de 2026. Seguimiento: issue #7.

## Estado comprobado

Actualización del 30 de septiembre: la decisión de permitir publicación desde un participante sustituye la pausa descrita en este documento histórico. Véase `public-single-contributor.md`. Las reglas siguientes siguen describiendo el proceso de revisión interna, separado de la publicación con permiso explícito.

El calculador interno `calculateCompanyPayStats` conserva las reglas históricas, incluido un mínimo de un conductor. Sus pruebas verifican cálculos, **no autorización para publicar**. Ninguna ruta pública debe llamarlo directamente.

Las pruebas de `tenure-stats.test.ts` comparan la salida pública con 0, 1, 9, 10 y 30 conductores, con permiso, sin él y retirado. La salida es idéntica. `scripts/test-account-routes.cjs` comprueba además que guardar datos privados o retirar el permiso no cambia el catálogo público ni los resultados de sus empresas.

## Por qué cambiar un número no resuelve el problema

Estos son escenarios sintéticos de revisión, no datos de usuarios:

| Escenario | Riesgo | Condición necesaria antes de publicar |
| --- | --- | --- |
| Un conductor aporta 30 nóminas | Confundir documentos con personas | Contar personas distintas por métrica; limitar cada aportación personal |
| Diez conductores, nueve semanales y uno mensual | El neto mensual describe a uno solo | Verificar cada frecuencia y cada métrica por separado |
| Diez conductores, pero solo uno tiene tarifa u horas válidas | El tamaño del grupo no protege todas las cifras | Contar solo contribuciones válidas para la cifra concreta |
| Nueve conductores en una banda y uno en otra | Bandas y cruces permiten aislar personas | Suprimir grupos pequeños y sus complementos; no publicar cruces detallados inicialmente |
| Se publica un resultado nuevo tras un alta, corrección o retirada | Comparar versiones puede revelar información | Diseñar y probar una política de versiones; no recalcular públicamente tras cada evento individual |
| Desaparece un empleado del directorio al retirar permiso | La existencia de la empresa revela participación | Mantener el directorio independiente de datos privados |
| Muchas cuentas pertenecen a la misma persona | Cuenta distinta no garantiza conductor distinto | Resolver duplicidad sin publicar identidades ni añadir datos personales innecesarios |

## Implementación interna, aún sin activar

El propietario eligió incluir antigüedad desde la primera versión. `publication-policy.ts` prepara únicamente propuestas para revisión: neto por nómina, separado por frecuencia semanal/quincenal/mensual y por antigüedad histórica (menos de 1 año, 1–3, 3–5, 5 o más). La antigüedad sigue siendo declarada, no verificada documentalmente. No hay medianas exactas, tamaños de muestra, totales de empresa ni cruces por turno o vehículo en la propuesta.

Reglas implementadas:

- Trimestre natural cerrado según fecha de pago, empresa del catálogo público, documentos de Irlanda en EUR y anteriores al cierre de la revisión.
- Tres nóminas consecutivas válidas por persona, una sola contribución y una sola combinación de frecuencia/antigüedad. Una secuencia que atraviesa un límite de antigüedad se excluye. Las cantidades netas ausentes, no finitas o negativas y los importes de prueba corregidos manualmente no cuentan.
- Hipótesis de evaluación: mínimo de 10 personas revisadas **en cada combinación**, intervalos de 100 EUR para la mediana. Estos valores no son una garantía de anonimato ni una política de lanzamiento aprobada.
- Un correo verificado no equivale a una persona distinta: se requiere una correspondencia revisada por un proceso de confianza. Si falta, hay duplicados o una misma persona tiene varias cuentas, se excluye la aportación. No existe aún una interfaz de producción para emitir esas correspondencias.
- Se exige el aviso `tenure-review-2026-09-29`, con aceptación fechada válida. Autoriza únicamente revisión interna, no publicación. Mi cuenta presenta el aviso, una casilla desmarcada y una acción explícita. La preferencia antigua no activa este permiso; la publicación requeriría otro aviso y autorización aparte.
- Una huella interna vincula documentos, aportaciones, permisos, antigüedad y antecedentes. Una corrección o retirada invalida la revisión aunque no cambie el intervalo propuesto.
- Sin reeditar un periodo anterior ni reutilizar personas en otra revisión reservada. Esta prohibición es conservadora: no implementa estadísticas longitudinales recurrentes.

`publication-journal.ts` conserva reservas internas en PostgreSQL. Lee el historial completo desde la base, serializa las reservas y bloquea escrituras de documentos durante la revalidación; una transacción guarda la propuesta y las claves de participantes. Una invalidación conserva la propuesta original y el historial. No hay operación que marque estas reservas como publicadas ni un endpoint para servirlas.

`publication-source.ts` carga documentos y correspondencias vigentes de PostgreSQL, verifica el propietario de cada payload y usa únicamente empresas del catálogo estático. La reserva vuelve a leer esta fuente en la misma conexión, bloqueando temporalmente las escrituras de documentos y correspondencias.

Las migraciones `003-publication-review.sql` y `004-publication-source.sql` forman parte del comando de despliegue. La segunda registra invalidaciones mediante triggers: retirada de permiso, cambios de documentos, borrados y cambios de identidad revisada invalidan las reservas afectadas dentro de la misma transacción. No se recalculan resultados. Borrar un perfil elimina su correspondencia de cuenta; las claves opacas de cohortes reservadas permanecen en el historial, sin permitir reutilizar la cohorte. Una transacción revertida revierte también la invalidación.

`truckpay_publication_identities` es un registro exclusivo del operador. No lo rellena un formulario, el inicio de sesión ni la aceptación del aviso. `person_key` debe ser una clave opaca estable por persona, nunca regenerada para eludir antecedentes; `reviewer_reference` debe ser una referencia de revisión, sin copiar documentos de identidad. Sigue pendiente definir y operar la verificación de personas y el acceso del operador; no se ha acreditado automáticamente a ningún usuario. Las claves internas necesitan una política explícita de acceso, conservación y solicitudes de supresión antes del piloto con participantes.

CI incorpora PostgreSQL 17 con conexiones independientes y datos ficticios. Prueba retirada antes de reserva, retirada después de reserva, dos reservas simultáneas y revocación concurrente de una identidad. El programa `scripts/test-publication-postgres.cjs` solo admite `MTP_TEST_DATABASE_URL` apuntando a la base `truckpay_test` en localhost. Las pruebas de rutas reales verifican además que retirar el permiso por HTTP invalida la reserva y que aceptar un aviso nunca acredita una persona distinta.

ESLint impide importar el calculador bruto o los módulos de revisión desde páginas, componentes y rutas. Las pruebas ejercitan esa barrera y verifican que `companyPayStats` sigue pausado incluso con una propuesta interna válida.

Ejecutar `node scripts/preview-publication-policy.cjs` produce una demostración sintética con dos bandas de antigüedad, un grupo mensual oculto y una retirada que invalida la revisión sin cambiar los intervalos. No consulta servicios ni datos reales.

## Trabajo necesario antes de activar

1. Revisar el conjunto elegido: neto por frecuencia y antigüedad, sin otros cruces ni recuentos exactos. Validar el riesgo residual de cada combinación, incluyendo conocimientos externos sobre empleados.
2. Para publicar, preparar un aviso separado que explique el producto aprobado y recoger otra autorización: el nuevo aviso de revisión interna no autoriza publicar.
3. Aprobar o cambiar las hipótesis de diez personas e intervalos de cien euros. No añadir totales de empresa que permitan reconstruir grupos ocultos por resta.
4. Diseñar publicaciones por lotes y evaluar ataques por diferencia entre versiones, datos auxiliares y retiradas. El calendario por sí solo no elimina estos riesgos. Considerar un mecanismo formal de privacidad si los requisitos de publicación lo necesitan.
5. Definir la retirada: excluir nuevas contribuciones y futuras publicaciones; una cifra ya copiada por terceros no puede recuperarse. Resolver cómo retirar una publicación sin crear un canal de inferencia.
6. Definir la verificación de personas y el acceso del operador. Implementar la publicación de snapshots aprobados, incluyendo invalidación, cachés y exportaciones, sin servir nunca una reserva interna como resultado público.
7. Registrar la revisión del riesgo residual y la decisión de lanzamiento. Mantener #7 abierto hasta entonces.

Esta propuesta es una conclusión de la revisión del código; no una certificación. Como referencia metodológica, [NIST SP 800-188](https://csrc.nist.gov/pubs/sp/800/188/final) recomienda evaluar objetivos y riesgos de publicación, definir el modelo de intercambio y comprobar el riesgo de reidentificación. No prescribe aquí un umbral seguro de diez personas.

Los bloqueos usados siguen la [documentación de PostgreSQL 17](https://www.postgresql.org/docs/17/explicit-locking.html): SHARE permite lecturas y entra en conflicto con las escrituras. Las reservas deben ser operaciones breves; las llamadas de revisión no deben realizar red externa dentro de la transacción.
