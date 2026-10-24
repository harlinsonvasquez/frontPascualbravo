# Gestión académica CRUD con Firebase

Aplicación de consola en Python y panel web adaptable para administrar los nodos `estudiantes`, `cursos` y `matriculas` de Firebase Realtime Database.

## Panel web

1. Comprueba que `config.js` apunte al proyecto de Firebase correcto y que Realtime Database esté habilitada.
2. Desde la carpeta del proyecto inicia un servidor web local:

   ```powershell
   python -m http.server 8000
   ```

3. Abre [http://localhost:8000/index.html](http://localhost:8000/index.html).

El panel muestra las tres colecciones, permite filtrar por texto, buscar un ID exacto y actualizar manualmente el listado. También ofrece altas con ID generado, edición (los campos de texto vacíos conservan su valor) y eliminación con confirmación. La aplicación valida los campos, verifica manualmente las referencias de matrículas y bloquea la eliminación de estudiantes o cursos asociados. Si una referencia no existe, muestra el error y deja abierto el formulario para corregirla. La opción lateral permite volver a preparar los ejemplos de forma idempotente.

Al abrir el panel, este prepara automáticamente los registros de ejemplo con IDs fijos. Solo agrega los que falten y no reemplaza ni borra registros existentes; puedes volver a ejecutar la opción lateral **Cargar datos de ejemplo** si borras alguno. El navegador se conecta con la configuración web de `config.js`; Firebase aplica las reglas de Realtime Database también a esta interfaz. La base debe permitir al cliente leer los nodos y crear los registros de ejemplo. Si aparece permiso denegado, revisa las reglas y la autenticación requerida por tu proyecto. No publiques credenciales de cuenta de servicio ni habilites acceso abierto en una base con datos sensibles.

## Aplicación de consola

Requiere Python 3.9 o posterior y `firebase-admin` instalado:

```powershell
python -m pip install firebase-admin
python main.py
```

Guarda la clave de servicio local como `firebase_key.json` en la raíz. El archivo está excluido por `.gitignore`; no lo publiques ni incluyas en entregas. La conexión y la URL están configuradas en `conexion.py`.

## Archivos

- `index.html`, `styles.css`, `app.js`: interfaz web.
- `config.js`: configuración del SDK web de Firebase.
- `conexion.py`: inicialización del SDK Admin de Python.
- `esquemas.py`: campos y validaciones compartidos por la aplicación de consola.
- `crud.py`: operaciones CRUD de consola, comprobaciones referenciales y carga de ejemplos.
- `main.py`: menú de consola.
- `firebase_key.json`: credencial local, no incluida en Git.

## Campos y verificaciones

- **Estudiantes:** nombre y correo obligatorios, formato básico de correo, edad entera de 1 a 120.
- **Cursos:** nombre y docente obligatorios, créditos enteros de 1 a 10.
- **Matrículas:** estudiante y curso existentes, periodo obligatorio y nota de 0.0 a 5.0.

Para evidenciar la actividad, crea dos estudiantes y dos cursos, registra una matrícula con sus IDs, intenta una referencia inexistente, comprueba la validación de edad y nota, busca y actualiza una matrícula, intenta borrar un estudiante asociado y finalmente elimina la matrícula antes del estudiante o curso.

## Datos de ejemplo

En el panel web los ejemplos se preparan automáticamente al abrir la página; en la consola selecciona la opción 4. Ambas cargas usan IDs fijos, omiten registros que ya existan y no sobrescriben ni eliminan datos. La matrícula de ejemplo se agrega si faltaba y sus referencias de estudiante y curso están disponibles.

## Problemas frecuentes

- **La página no carga los módulos:** abre el HTML desde `http://localhost`, no directamente como archivo; los navegadores bloquean módulos ES desde `file://`.
- **No hay conexión a Firebase:** verifica internet, proyecto, URL y disponibilidad de Realtime Database.
- **Permiso denegado:** revisa las reglas de Realtime Database y la autenticación configurada.
- **Falta `firebase_key.json`:** colócalo en la raíz para ejecutar la consola; la interfaz web usa `config.js`.
