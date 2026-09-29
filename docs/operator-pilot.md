# Piloto privado del propietario

Estado: herramienta local de consulta preparada; acreditación y publicación desactivadas.
Decisión del propietario: solo él revisará, desde su portátil.

## Acceso

Ejecutar `node scripts/operator-review.cjs --demo` desde el repositorio e iniciar el enlace de la terminal. Solo escucha en `127.0.0.1`, con puerto aleatorio y una clave nueva por ejecución. La clave viaja en el fragmento del enlace y se borra de la barra al abrir; se conserva únicamente en memoria de la pestaña. Recargar requiere volver a abrir el enlace. No compartirlo. El proceso cierra a los 30 minutos; Ctrl+C permite cerrarlo antes. Bloquear panel vacía la vista, pero no invalida un enlace previamente copiado: para revocarlo, detener el proceso.

El acceso local supone una sesión de Windows de confianza: no protege frente a malware, otro proceso con privilegios del propietario o un usuario que acceda a su sesión desbloqueada. No exponer este servidor mediante proxy, túnel o red local. No se instala en Vercel.

Modo real: `node scripts/operator-review.cjs --database`, solo cuando se configure `MTP_OPERATOR_DATABASE_URL` con credenciales independientes de lectura, sin reutilizar las del despliegue. No lee `.env` ni `DATABASE_URL`, y no cambia automáticamente del modo demostración al real. Cada preparación usa una transacción `REPEATABLE READ READ ONLY`. Necesita SELECT en documentos, identidades y las dos tablas del historial; no necesita leer autenticación. No se han creado credenciales ni concedido permisos en producción.

El navegador recibe únicamente catálogo, bloqueos e intervalos candidatos: no claves personales, recuentos, huellas, perfiles, nombres, correos ni nóminas. La herramienta consulta las fuentes en memoria; no guarda exportaciones ni expedientes. No reserva cohortes ni escribe en PostgreSQL.

## Procedimiento propuesto antes de emitir acreditaciones

1. Participante con permiso de revisión vigente. Si no lo tiene o lo retira, detener el caso.
2. Vincular persona y cuenta en una interacción directa previamente acordada. Debe definirse cómo se comprueba ese vínculo y se detectan duplicados; aceptar el aviso, el correo verificado o marcar una casilla no demuestra que sea una persona distinta.
3. Buscar casos previos y cuentas duplicadas antes de asignar una clave. Una persona conserva su clave; si hay incertidumbre, caso pendiente. No recrear claves después de una retirada o eliminación para eludir el historial.
4. Conservar solo referencia opaca de caso, operador, fecha, método y resultado. No recoger copias de identificación, grabaciones ni nóminas adicionales para este expediente.
5. Emitir o revocar correspondencias únicamente después de aprobar el método y la política de conservación. Esta herramienta deliberadamente no ofrece esa operación.

El panel no verifica antigüedad: sigue siendo declarada por el conductor. La acreditación de persona tampoco certifica su salario.

## Conservación: decisión concreta pendiente

No hay nuevos expedientes persistentes en esta herramienta. Para el piloto real, propuesta a revisar con el propietario: cerrar los casos pendientes a los 30 días y revisar trimestralmente la necesidad de las correspondencias activas. Estos plazos no están aprobados ni se ejecutan automáticamente.

Antes de almacenar casos reales deben decidirse el plazo final, el canal para solicitudes y la custodia de las referencias. Las claves opacas del historial existente evitan reutilizar cohortes: no son anónimas por definición. No borrarlas mediante un temporizador sin resolver primero cómo impedir reutilizaciones. Una política que conserve indefinidamente ese historial requiere revisión expresa; esta herramienta no la aprueba.

## Comprobación y siguientes pasos

`node scripts/test-operator-review.cjs` prueba autorización, origen, Host, métodos de solo lectura, vencimiento, bandas sintéticas y ausencia de auditoría personal en respuestas.

Para iniciar el piloto con personas reales faltan: aprobar el método de verificación y conservación, crear un rol de lectura para el propietario, y preparar un registro auditable de acreditaciones/revocaciones con claves estables. La publicación requiere una autorización separada y sigue desactivada.
