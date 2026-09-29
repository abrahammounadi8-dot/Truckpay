# Publicación de estadísticas: revisión pendiente

Fecha: 29 de septiembre de 2026. Seguimiento: issue #7.

## Estado comprobado

La publicación de estadísticas salariales permanece pausada por código, sin variable que permita activarla. `companyPayStats` devuelve un resultado vacío independiente de las nóminas y perfiles. El directorio público usa el catálogo estático. La API privada sigue requiriendo sesión verificada y conserva el análisis del titular.

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

## Propuesta de trabajo, aún sin activar

1. Definir qué cifras son útiles y publicar el conjunto mínimo. Empezar sin cruces por turno, vehículo, jornada o antigüedad y sin recuentos exactos.
2. Diseñar la participación voluntaria con un aviso específico de las cifras y frecuencias de publicación; no convertir automáticamente una preferencia antigua en permiso para un producto diferente.
3. Evaluar diez personas distintas por métrica como punto de partida de pruebas, **no como garantía de anonimato ni mínimo aprobado**. Definir además límites de contribución, redondeo y supresión complementaria.
4. Diseñar publicaciones por lotes y evaluar ataques por diferencia entre versiones, datos auxiliares y retiradas. El calendario por sí solo no elimina estos riesgos. Considerar un mecanismo formal de privacidad si los requisitos de publicación lo necesitan.
5. Definir la retirada: excluir nuevas contribuciones y futuras publicaciones; una cifra ya copiada por terceros no puede recuperarse. Resolver cómo retirar una publicación sin crear un canal de inferencia.
6. Implementar las reglas en una capa única con pruebas adversarias para todos los casos de la tabla. Revisar API, páginas, cachés y exportaciones, incluyendo pruebas con dos cuentas y datos sintéticos.
7. Registrar la revisión del riesgo residual y la decisión de lanzamiento. Mantener #7 abierto hasta entonces.

Esta propuesta es una conclusión de la revisión del código; no una certificación. Como referencia metodológica, [NIST SP 800-188](https://csrc.nist.gov/pubs/sp/800/188/final) recomienda evaluar objetivos y riesgos de publicación, definir el modelo de intercambio y comprobar el riesgo de reidentificación. No prescribe aquí un umbral seguro de diez personas.
