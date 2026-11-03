# Editor de Equipo

El **Editor de Equipo** le permite crear, ver y personalizar perfiles de equipo, asignar pilotos, subir logotipos de equipo y gestionar las alineaciones.

## Descripción General

El Editor de Equipo integra la selección y edición de equipos en una interfaz unificada:

- **Selector de Equipo**: Ubicado en el encabezado superior junto al título de la página, este menú desplegable enumera todos los equipos existentes y permite cambiar rápidamente entre ellos.
- **Modo de Solo Lectura**: De forma predeterminada, al abrir el editor se muestran los detalles del equipo y los pilotos asignados en modo de solo lectura. Los campos del formulario, la selección del logotipo y las acciones de asignación están bloqueados para evitar cambios accidentales.
- **Modo de Edición**: Al hacer clic en el icono **Editar** (lápiz) de la barra de herramientas, se desbloquean los campos de entrada y los controles de asignación. En el modo de edición, el selector de equipo permanece bloqueado para evitar salir accidentalmente con cambios no guardados.
- **Guardado Automático Continuo**: A medida que realiza cambios (editar el nombre, seleccionar un logotipo o reordenar/asignar pilotos), sus ediciones se guardan automáticamente en segundo plano sin salir del modo de edición.
- **Finalizar Edición**: Al hacer clic en el icono **Finalizar Edición** (marca de verificación), se validan los cambios, se asegura su persistencia en el servidor y se regresa al modo de solo lectura.
- **Descartar Cambios**: Si intenta salir del editor con cambios no guardados o no válidos, el cuadro de diálogo de cambios sin guardar le pedirá confirmación. Al descartar, se restablecen todas las modificaciones a la última versión guardada.

## Acciones de la Barra de Herramientas

La barra de herramientas superior proporciona las siguientes acciones:

- **Atrás**: Regresa a la vista anterior o a Configuración del Día de Carrera.
- **Agregar Equipo (+)**: Crea una nueva plantilla de equipo y entra en el modo de edición.
- **Duplicar Equipo**: Duplica el equipo actualmente seleccionado con un nombre único.
- **Editar / Finalizar Edición**: Alterna entre el modo de solo lectura y el modo de edición (atajo de teclado: Cmd/Ctrl+E).
- **Eliminar Equipo**: Elimina el equipo seleccionado tras confirmación.
- **Deshacer / Rehacer**: Revierte o vuelve a aplicar ediciones recientes realizadas durante la sesión.
- **Ayuda (?)**: Abre la guía interactiva que destaca cada sección del editor.

## Perfil del Equipo {: #team-profile }

El panel izquierdo contiene los ajustes principales de identidad y categorización del equipo:

- **Nombre del Equipo**: El nombre único del equipo que se muestra en clasificaciones, tablas de líderes y pantallas de carrera.
- **Imagen / Logotipo del Equipo**: Seleccione un icono preestablecido o suba una imagen personalizada para representar al equipo.
- **Etiquetas de Equipo**: Asigne etiquetas codificadas por colores (similares a las etiquetas de GitHub) para organizar a los equipos en conjuntos o categorías personalizados (como "GT3", "Pro" o "Amateur"). Los equipos pueden pertenecer a cualquier cantidad de etiquetas. En el modo de edición, haga clic en **Administrar Etiquetas** para crear, editar, cambiar el color, eliminar o asignar etiquetas. En la pantalla Configuración del Día de Carrera, puede filtrar los equipos disponibles por etiqueta para completar rápidamente las alineaciones de carreras.

## Miembros del Equipo y Alineación {: #team-members }

La sección superior del panel derecho muestra los pilotos actualmente asignados a este equipo:

- **Gestión de la Alineación**: En el modo de edición, puede arrastrar y soltar pilotos usando el tirador (`☰`) para reordenar la secuencia del equipo, o hacer clic en el botón eliminar (<span class="material-icons">delete</span>) para quitar a un piloto del equipo.
- **Rotación Round-Robin**: Cuando un equipo participa en una carrera, los pilotos asignados rotan automáticamente por las mangas asignadas al equipo en orden round-robin según esta lista.
- **Cambios de Piloto en Manga**: Según la configuración de la carrera para equipos, los pilotos de un equipo también pueden intercambiarse a mitad de manga, ya sea durante una parada en boxes o en cualquier punto de la pista.
- **Etiquetas de Piloto**: Cada piloto muestra sus etiquetas asignadas como insignias junto a su nombre para verificar fácilmente calificaciones y niveles de habilidad.

## Pilotos Disponibles {: #available-drivers }

La sección inferior del panel derecho enumera todos los pilotos registrados que actualmente no están asignados a este equipo:

- **Agregar Pilotos**: En el modo de edición, haga clic en la tarjeta de cualquier piloto o en el botón de agregar (<span class="material-icons">add</span>) para agregarlo inmediatamente a la alineación del equipo.
- **Pertenencia a Múltiples Equipos**: Un piloto puede ser miembro de más de un equipo en su base de datos.
- **Prevención de Conflictos en Carrera**: Aunque un piloto pertenezca a varios equipos, ningún piloto puede participar en la misma carrera más de una vez, ya sea representando a dos equipos rivales o compitiendo individualmente y en equipo al mismo tiempo.
