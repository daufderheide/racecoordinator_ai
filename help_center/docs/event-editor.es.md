# Editor de Eventos

El **Editor de Eventos** le permite diseñar, configurar y administrar eventos con múltiples carreras. En Race Coordinator AI, un evento conecta múltiples configuraciones de carreras independientes en una progresión secuencial, como rondas clasificatorias que avanzan a semifinales y finales, o torneos por etapas.

## Resumen

El Editor de Eventos ofrece un diseño claro de dos paneles para estructurar competiciones por etapas:

- **Selector de Eventos**: Ubicado en el encabezado superior junto al título de la página, este menú desplegable enumera todos los eventos guardados y le permite cambiar rápidamente entre ellos con los botones de anterior y siguiente.
- **Modo de Solo Lectura**: De forma predeterminada, el editor se abre en modo de solo lectura para evitar cambios accidentales en la secuencia de carreras.
- **Modo de Edición**: Al hacer clic en el icono de **Editar** (lápiz) de la barra de herramientas, se desbloquean los campos de entrada y los controles de secuencia.
- **Guardado Automático Continuo**: Los cambios en el nombre del evento, la descripción, el tiempo de avance automático y la progresión se guardan automáticamente en segundo plano.
- **Salir del Modo de Edición**: Al hacer clic en el icono de **Edición Completada** (marca de verificación), se valida el evento, se persisten los cambios y se restaura el modo de solo lectura.

---

## Acciones de la Barra de Herramientas

La barra de herramientas superior proporciona acciones esenciales de edición y gestión:

- **Atrás**: Regresa a la pantalla anterior o a la Configuración del Día de Carrera.
- **Agregar Evento (+)**: Crea una nueva plantilla de evento con la configuración predeterminada y entra en Modo de Edición.
- **Duplicar Evento**: Clona el evento actual con un nuevo nombre único.
- **Editar / Edición Completada**: Alterna entre el Modo de Solo Lectura y el Modo de Edición (atajo de teclado: `Cmd/Ctrl+E`).
- **Eliminar Evento**: Elimina de forma permanente el evento seleccionado tras una confirmación.
- **Deshacer / Rehacer**: Revierte o vuelve a aplicar los cambios recientes realizados durante la sesión.
- **Ayuda (?)**: Inicia el recorrido guiado interactivo que resalta cada sección del editor.

---

## Configuración del Evento {: #event-configuration }

El panel izquierdo configura los metadatos generales y el comportamiento de transición automática entre etapas:

- **Nombre del Evento**: Un nombre identificativo único para el evento en toda la aplicación y tablas de clasificación.
- **Descripción**: Un área de texto opcional para notas, reglas de etapa, resúmenes de puntuación o instrucciones del torneo.
- **Tiempo de Avance Automático**: La duración de la cuenta regresiva (en segundos) que se debe esperar después de que concluye una carrera antes de cargar y avanzar automáticamente a la siguiente carrera de la secuencia. Establecer este valor en `0` desactiva el avance automático.

---

## Secuencia de Carreras {: #race-sequence }

El panel derecho gestiona la progresión ordenada de carreras que componen el evento:

- **Agregar Carrera**: En el Modo de Edición, haga clic en el botón **+ Agregar Carrera** para abrir el cuadro de diálogo de selección y añadir carreras guardadas a la secuencia.
- **Orden de Progresión de Etapas**: Las carreras se ejecutan secuencialmente de arriba hacia abajo (Etapa #1, Etapa #2, etc.). En Modo de Edición, arrastre el control (<span class="material-icons">drag_indicator</span>) de cualquier tarjeta para reordenar las etapas.
- **Límites Máximos de Pilotos**: Cada etapa puede restringir el número de pilotos participantes:
  - **Ilimitado (Todos los Pilotos)**: Todos los pilotos de la etapa anterior participan en esta carrera.
  - **Límite Numérico**: Especifique un número exacto de los mejores clasificados que avanzan a esta etapa (por ejemplo, los 8 mejores avanzan a semifinales). Haga clic en **Ilimitado** para alternar entre el límite numérico y todos los pilotos.
- **Eliminar Carrera**: En Modo de Edición, haga clic en el icono de papelera (<span class="material-icons">delete</span>) para quitar una etapa. Cada evento debe conservar al menos una carrera.

