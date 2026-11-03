# Gestor de Bases de Datos

El **Gestor de Bases de Datos** permite organizar, respaldar, restaurar y alternar entre bases de datos SQLite independientes en Race Coordinator. Cada base de datos mantiene una colección aislada de pilotos, equipos, pistas, carreras, eventos, temporadas, diseños de interfaz y recursos multimedia.

---

## Resumen {: #overview }

La pantalla del Gestor de Bases de Datos se organiza en dos secciones principales:

1. **Lista de Bases de Datos (Barra lateral izquierda)**: Muestra todos los archivos de bases de datos disponibles almacenados en su directorio local. La base de datos activa se resalta con la etiqueta **ACTIVA**. Al seleccionar cualquier base de datos de la lista, sus detalles y estadísticas se cargan en el panel derecho.
2. **Panel de Detalles (Lado derecho)**: Muestra estadísticas completas, métricas de almacenamiento y el control de activación de la base de datos seleccionada.
3. **Barra de Herramientas del Gestor (Encabezado superior)**: Proporciona acciones para crear, importar, exportar, duplicar, restablecer o eliminar bases de datos.

---

## Estadísticas de la Base de Datos {: #database-statistics }

Cuando se selecciona una base de datos de la lista, el panel **Resumen de la Base de Datos** muestra estadísticas en tiempo real y el uso del espacio en disco:

| Métrica | Descripción |
| :--- | :--- |
| **Pilotos** | Número total de perfiles de piloto configurados. |
| **Equipos** | Número total de equipos de carreras. |
| **Pistas** | Número total de configuraciones de pistas e interfaces de hardware. |
| **Carreras** | Número total de formatos de carreras y rotaciones de tandas. |
| **Eventos** | Número total de eventos multironda. |
| **Temporadas** | Número total de campeonatos de temporada y configuraciones de puntuación. |
| **Recursos** | Número total de imágenes, audios, conjuntos de imágenes, conjuntos de audio y rotaciones. |
| **Registros de Carreras** | Número de registros de resultados de carreras completadas y su tamaño en disco (en MB). |
| **Carreras Guardadas** | Número de sesiones de carrera guardadas en curso o en pausa y su tamaño en disco (en MB). |
| **Tamaño Total** | El tamaño físico del archivo de la base de datos SQLite en disco (en MB). |

---

## Cambio de Bases de Datos {: #switching-databases }

Race Coordinator opera con una base de datos activa a la vez. El estado de la base de datos seleccionada se muestra junto a su nombre en el encabezado de detalles:

- <span class="material-icons" style="color: #4ade80; vertical-align: middle;">check_circle</span> **Base de Datos Activa (Marca verde)**: Indica la base de datos actualmente en uso por el sistema para cronometraje en vivo, operaciones de carrera y almacenamiento.
- <span class="material-icons" style="color: #94a3b8; vertical-align: middle;">check_circle_outline</span> **Base de Datos Inactiva (Marca gris)**: Indica una base de datos alternativa que no está activa en este momento.

### Cómo cambiar de base de datos

1. Haga clic en cualquier base de datos inactiva en la lista lateral izquierda.
2. En el encabezado de detalles, haga clic en el botón de **Marca Gris**.
3. Confirme el cambio en el cuadro de diálogo.

> [!WARNING]
> Cambiar de base de datos restablece inmediatamente el estado de la sesión de carrera activa y recarga todos los recursos, pilotos y configuraciones desde la base de datos recién activada.

---

## Creación de una Base de Datos {: #creating-a-database }

Para crear una nueva base de datos:

1. Haga clic en el botón **Añadir** (<span class="material-icons" style="vertical-align: middle;">add</span>) en la barra de herramientas superior.
2. Introduzca un nombre único para la nueva base de datos en el diálogo modal.
3. Haga clic en **Aceptar**. Race Coordinator creará una nueva base de datos SQLite con el esquema estándar y recursos predeterminados.

---

## Copia de una Base de Datos {: #copying-a-database }

Para duplicar una base de datos existente:

1. Seleccione la base de datos que desea copiar en la lista lateral.
2. Haga clic en el botón **Copiar** (<span class="material-icons" style="vertical-align: middle;">content_copy</span>) en la barra de herramientas.
3. Introduzca un nombre único para la copia.
4. Haga clic en **Aceptar**. Todos los pilotos, pistas, carreras, temporadas, recursos e historiales se clonarán en el nuevo archivo.

---

## Eliminación de una Base de Datos {: #deleting-a-database }

Para eliminar permanentemente una base de datos:

1. Seleccione la base de datos que desea eliminar en la lista lateral.
2. Haga clic en el botón **Eliminar** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">delete</span>) en la barra de herramientas.
3. Confirme la eliminación en el diálogo modal.

> [!NOTE]
> La base de datos actualmente activa no se puede eliminar. Para eliminarla, primero cambie a otra base de datos.

---

## Restablecimiento de Fábrica {: #factory-reset }

La acción **Restablecer** (<span class="material-icons" style="color: #ef4444; vertical-align: middle;">restart_alt</span>) borra todos los datos personalizados de la base de datos activa y restaura los valores predeterminados de fábrica:

1. Seleccione la base de datos activa y haga clic en el botón **Restablecer** en la barra de herramientas.
2. Revise los avisos de advertencia y confirme el restablecimiento.
3. Todos los pilotos, pistas, carreras y recursos personalizados se sustituirán por los valores limpios de fábrica.

---

## Copia de Seguridad y Restauración / Importación y Exportación {: #import-and-export }

### Exportación (Copia de seguridad)

Para crear un archivo de respaldo portátil de una base de datos:

1. Seleccione la base de datos que desea exportar.
2. Haga clic en el botón **Exportar** (<span class="material-icons" style="vertical-align: middle;">file_download</span>) en la barra de herramientas.
3. Race Coordinator generará un archivo `.zip` con marca de tiempo que contiene el archivo de base de datos SQLite y todos los recursos binarios almacenados.

### Importación (Restauración)

Para importar un archivo de base de datos exportado previamente:

1. Haga clic en el botón **Importar** (<span class="material-icons" style="vertical-align: middle;">file_upload</span>) en la barra de herramientas.
2. Seleccione un archivo `.zip` de su equipo.
3. Introduzca un nombre único para la base de datos importada.
4. Race Coordinator extraerá y registrará la base de datos en su instalación local.
