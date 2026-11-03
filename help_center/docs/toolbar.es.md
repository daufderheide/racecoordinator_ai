# Acciones de la Barra de Herramientas

La **Barra de Herramientas del Editor** proporciona controles estandarizados y unificados en todas las pantallas de edición de Race Coordinator AI, incluidos los editores de Pilotos, Equipos, Pistas, Carreras, Diseños, Temas y Bases de Datos.

## Resumen {: #overview }

La barra de herramientas estandariza el flujo de trabajo en todos los editores:

- **Modo de Solo Lectura**: Por defecto, al abrir un editor los campos permanecen bloqueados para evitar cambios accidentales mientras se inspeccionan opciones y sonidos.
- **Modo de Edición**: Al pulsar el icono de **Editar** (lápiz), se desbloquean los controles. El selector superior queda bloqueado para proteger los cambios sin guardar.
- **Guardar y Salir**: Al pulsar **Listo** (marca de verificación), se validan los cambios, se guardan en la base de datos SQLite y se regresa al modo de solo lectura.

## Referencia de Iconos {: #icons }

A continuación se detalla cada icono de acción disponible en la barra de herramientas:

### Editar / Listo {: #edit }
- **Iconos**: `edit` (lápiz) / `check` (marca de verificación)
- **Atajo**: `Cmd+E` (macOS) / `Ctrl+E` (Windows/Linux)
- **Descripción**: Alterna entre el modo de solo lectura y el modo de edición. Guarda cambios al finalizar.

### Crear Nuevo {: #add }
- **Icono**: `add` (más)
- **Descripción**: Crea un nuevo elemento en blanco e ingresa directamente en modo de edición.

### Duplicar / Guardar como Nuevo {: #copy }
- **Icono**: `content_copy` (documentos superpuestos)
- **Descripción**: Duplica el elemento seleccionado con un nuevo nombre para agilizar la edición.

### Eliminar {: #delete }
- **Icono**: `delete` (papelera)
- **Descripción**: Elimina permanentemente el elemento seleccionado tras solicitar confirmación.

### Deshacer {: #undo }
- **Icono**: `undo` (flecha hacia la izquierda)
- **Atajo**: `Cmd+Z` (macOS) / `Ctrl+Z` (Windows/Linux)
- **Descripción**: Revierte el último cambio realizado durante la sesión de edición activa.

### Rehacer {: #redo }
- **Icono**: `redo` (flecha hacia la derecha)
- **Atajo**: `Cmd+Shift+Z` (macOS) / `Ctrl+Shift+Z` o `Ctrl+Y` (Windows/Linux)
- **Descripción**: Vuelve a aplicar el cambio revertido con Deshacer.

### Expandir / Contraer Todo {: #expand-collapse }
- **Icono**: `unfold_more` / `unfold_less` (flechas verticales)
- **Descripción**: Expande o contrae todas las secciones acordeón del editor al mismo tiempo.

### Activar {: #activate }
- **Icono**: `check_circle` (círculo con marca)
- **Descripción**: Establece el tema seleccionado como el tema activo para las sesiones de carrera.

### Importar {: #import }
- **Icono**: `download` / `file_upload` (flecha hacia abajo)
- **Descripción**: Abre un diálogo para importar perfiles o bases de datos desde archivos externos (`.json`, `.zip`, `.csv`).

### Exportar {: #export }
- **Icono**: `upload` / `file_download` (flecha hacia arriba)
- **Descripción**: Exporta la configuración o base de datos a un archivo comprimido (`.zip`, `.xlsx`, `.csv`).

### Restaurar Valores de Fábrica {: #reset }
- **Icono**: `restart_alt` (flecha de reinicio)
- **Descripción**: Restaura la base de datos o ajustes a su estado original de fábrica.

### Limpiar Diseño {: #clear }
- **Icono**: `delete_sweep` (escoba)
- **Descripción**: Vacía completamente el lienzo de trabajo en el Editor de Diseños.

### Regenerar Mangas {: #regenerate }
- **Icono**: `sync` (flechas circulares)
- **Descripción**: Vuelve a calcular y generar las rotaciones de mangas y asignación de pistas.

### Verificación de Carriles {: #lane-check }
- **Icono**: `check` (marca / balanza)
- **Descripción**: Comprueba que todos los carriles estén distribuidos equitativamente en las mangas.

### Control de Zoom {: #zoom }
- **Iconos**: `zoom_in` / `zoom_out` con deslizador
- **Descripción**: Ajusta el nivel de aumento del lienzo de diseño entre el 50% y el 150%.

### Métricas de Uso (Analytics) {: #analytics }
- **Icono**: `analytics` (gráfico de barras)
- **Descripción**: Activa o desactiva el envío anónimo de estadísticas de uso y fallos.

### Ayuda Guiada {: #help }
- **Icono**: `lightbulb` (bombilla)
- **Descripción**: Inicia un recorrido interactivo paso a paso por las secciones de la página.

