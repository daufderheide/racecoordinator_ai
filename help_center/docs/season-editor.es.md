# Editor de Temporadas

El **Editor de Temporadas** le permite crear, gestionar y revisar temporadas de campeonatos. Una temporada realiza un seguimiento de las posiciones a lo largo de múltiples carreras y eventos, acumula puntos de campeonato para los pilotos, aplica reglas de carreras descartadas y calcula clasificaciones en tiempo real.

## Resumen

El Editor de Temporadas proporciona una interfaz completa para la gestión del campeonato:

- **Selector de Temporadas**: Ubicado en el encabezado superior junto al título de la página, este menú desplegable enumera todas las temporadas guardadas y permite alternar rápidamente entre ellas con los botones de anterior y siguiente.
- **Modo de Solo Lectura**: De forma predeterminada, el editor se abre en modo de solo lectura para evitar cambios accidentales en las clasificaciones y carreras registradas.
- **Modo de Edición**: Al hacer clic en el icono de **Editar** (lápiz) de la barra de herramientas, se desbloquean los campos y las opciones para agregar o eliminar carreras.
- **Guardado Automático Continuo**: Los cambios en nombres, descartes y asignación de carreras se guardan automáticamente en segundo plano.
- **Salir del Modo de Edición**: Al hacer clic en el icono de **Edición Completada** (marca de verificación), se valida la temporada, se persisten los cambios y se restaura el modo de solo lectura.

---

## Acciones de la Barra de Herramientas

La barra de herramientas superior proporciona acciones esenciales de gestión y edición:

- **Atrás**: Regresa a la pantalla anterior o a la Configuración del Día de Carrera.
- **Agregar Temporada (+)**: Crea una nueva plantilla de temporada con la configuración predeterminada y entra en Modo de Edición.
- **Duplicar Temporada**: Clona la temporada actual con un nuevo nombre único.
- **Editar / Edición Completada**: Alterna entre el Modo de Solo Lectura y el Modo de Edición (atajo de teclado: `Cmd/Ctrl+E`).
- **Eliminar Temporada**: Elimina de forma permanente la temporada de campeonato seleccionada tras una confirmación.
- **Deshacer / Rehacer**: Revierte o vuelve a aplicar los cambios recientes realizados durante la sesión.
- **Ayuda (?)**: Inicia el recorrido guiado interactivo que resalta cada sección del editor.

---

## Configuración de la Temporada {: #season-configuration }

El panel izquierdo configura las reglas generales del campeonato y los parámetros de puntuación:

- **Nombre de la Temporada**: Un nombre único para el campeonato que se muestra en clasificaciones, informes y en el Día de Carrera.
- **Carreras Descartadas (Drops)**: El número de carreras con menor puntuación que se descartan del total de puntos de campeonato de cada piloto.

---

## Información de Temporada y Gestión de Carreras {: #season-info-bar }

La barra superior sobre el panel derecho ofrece métricas de estado y controles para agregar carreras:

- **Carreras Disputadas**: Muestra el total de carreras y eventos finalizados incluidos en la temporada.
- **Insignia de Carreras Demo**: Indica si se han incluido carreras de entrenamiento o demostración en el historial.
- **Agregar Carrera**: En Modo de Edición, haga clic en el botón **+ Agregar Carrera** para abrir el cuadro de diálogo y añadir carreras finalizadas del historial a la temporada.

---

## Clasificación de la Temporada {: #season-standings }

La sección de clasificación calcula y muestra las posiciones del campeonato en tiempo real:

- **Posición y Podio**: Los pilotos se ordenan por puntos totales; las medallas de oro, plata y bronce destacan a los tres primeros competidores.
- **Nombre del Piloto**: Nombre completo de cada competidor participante.
- **Puntos Netos**: La puntuación oficial utilizada para la clasificación (puntos brutos menos deducciones por descartes).
- **Puntos Descartados**: La suma de puntos descartados según la configuración de carreras descartadas.
- **Puntos Brutos**: El total de puntos obtenidos en todas las carreras disputadas.
- **Carreras Disputadas**: Número de carreras individuales en las que participó el piloto.

---

## Desgloses de Carreras {: #race-breakdowns }

La sección de desglose ofrece tarjetas detalladas para cada carrera incluida en la temporada:

- **Tarjetas de Carreras Desplegables**: Haga clic en cualquier tarjeta para ver la tabla de resultados de los pilotos con puntos de posición y bonificaciones.
- **Eliminar Carreras**: En Modo de Edición, haga clic en el icono de papelera (<span class="material-icons">delete</span>) para quitar una carrera de la temporada.

