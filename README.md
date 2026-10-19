# Recursos docentes

Web de recursos docentes construida con MkDocs Material.

Repositorio principal: https://github.com/5n7t99rb9d-web/recursos-docentes

## Trabajar desde Mac o Windows

El repositorio principal de GitHub contiene la versión compartida. Cada ordenador conserva su propia copia local; para recibir los cambios hay que actualizarla antes de editar.

### Antes de trabajar

Desde la carpeta del repositorio:

```bash
git switch main
git pull --ff-only
```

En GitHub Desktop, selecciona `main`, pulsa **Fetch origin** y, si aparece, **Pull origin**.

Si Git avisa de cambios locales o de ramas divergentes, conserva esos cambios y resuelve la situación antes de continuar. No sobrescribas la copia local con una descarga ZIP.

### Preparación inicial en Windows (PowerShell)

Si todavía no tienes el repositorio:

```powershell
git clone https://github.com/5n7t99rb9d-web/recursos-docentes.git
cd recursos-docentes
```

Dentro de la carpeta del repositorio, prepara el entorno una sola vez:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Para ver la web localmente:

```powershell
.\.venv\Scripts\python.exe -m mkdocs serve
```

Para comprobarla antes de subir cambios:

```powershell
.\.venv\Scripts\python.exe -m mkdocs build
```

Estos comandos no requieren activar el entorno ni cambiar la política de ejecución de PowerShell.

### Preparación inicial en macOS

Desde la carpeta del repositorio:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m mkdocs serve
```

## Materiales y publicación

Los materiales y las páginas se guardan en `docs/`. La navegación se configura en `mkdocs.yml`.

Física de 2.º de Bachillerato está en `docs/fisica/2-bach/` y Física y Química de 1.º en `docs/fisica-quimica/1-bach/`.

Después de guardar y revisar una actualización, confirma y sube los cambios al repositorio principal. La acción **Publicar web** construye y publica GitHub Pages cuando se actualiza `main`. Comprueba que termine correctamente en la pestaña **Actions**.

Antes de cambiar de ordenador, sube los cambios pendientes; en el otro ordenador, actualiza la copia con **Pull origin** o `git pull --ff-only`. Los entornos `.venv/` y la web generada en `site/` son locales y no se sincronizan.
