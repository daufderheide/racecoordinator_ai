# Editor de Temas

El **Editor de Temas** proporciona una interfaz dedicada y simplificada para gestionar banderas visuales, secuencias de luces de cuenta regresiva, indicadores de combustible, avisos de audio de control de carrera y anulaciones de audio del piloto para Race Coordinator AI. Comparte la misma barra de herramientas unificada, selección de objetos, protección de solo lectura y ciclo de vida de modo de edición utilizados en los editores de Pilotos, Pistas, Carreras y Diseños.

---

## Descripción general y navegación

El Editor de Temas es accesible desde varias ubicaciones clave:

- **Barra de herramientas de configuración de jornada**: Seleccione **Config > Editor de Temas** (`/theme-editor` o `/theme-manager`).
- **Menú de opciones de carrera**: Haga clic en el menú de engranaje en la barra de herramientas de la jornada de carrera y seleccione **Editor de Temas** (`/theme-editor`). Navegar durante una carrera activa preserva la conexión y el estado.
- **Editor de interfaz de usuario (UI Editor)**: Haga clic en **Abrir Editor de Temas** desde la tarjeta de Temas en el Editor de UI (`/ui-editor`).

### Ciclo de vida de solo lectura y modo de edición

- **Modo de solo lectura (predeterminado)**: Las propiedades del tema, los espacios de imágenes, la configuración de audio y las anulaciones de audio del piloto están protegidos contra modificaciones accidentales.
- **Modo de edición**: Al hacer clic en el icono de **Editar** (lápiz) en la barra de herramientas, se desbloquea el tema para su edición.
- **Guardado automático y validación**: Al salir del modo de edición, los cambios se validan (asegurando un nombre único) y se guardan.
- **Descartar cambios**: Salir o navegar con cambios no guardados muestra el modal estándar de confirmación.
- **Deshacer / Rehacer**: Totalmente integrado con los controles estándar (<kbd>Ctrl</kbd>+<kbd>Z</kbd> y <kbd>Ctrl</kbd>+<kbd>Y</kbd>).

---

## Acciones de la barra de herramientas

- **Selector de temas**: Menú desplegable para seleccionar cualquier tema del sistema o definido por el usuario.
- **Editar / Terminar edición**: Alterna entre el modo de solo lectura y el modo de edición.
- **Expandir / Contraer todo**: Alterna todas las secciones configurables a la vez.
- **Añadir tema**: Crea una nueva plantilla de tema basada en el tema predeterminado.
- **Copiar tema**: Duplica el tema seleccionado con un nombre único.
- **Eliminar tema**: Elimina el tema personalizado actual tras confirmación.
- **Tour de ayuda**: Inicia una visita interactiva guiada.

