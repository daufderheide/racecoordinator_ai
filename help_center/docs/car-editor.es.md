# Editor de coches de slot

El **editor de coches de slot** lleva una lista de tus coches de slot: qué son, la clase en la que corren, su escala y su configuración. Ábrelo desde Race Day Setup con **Administrar → Coches de slot**.

!!! note
    Elige un coche para cada piloto en Race Day Setup y cambia coches entre mangas. Cada manga guarda el coche tal como estaba en la pista, así que los resultados conservan el coche correcto aunque lo edites después.

    La insignia **Vista previa** junto al título indica que esta función aún está tomando forma. Puede cambiar mucho, o incluso desaparecer, mientras recogemos opiniones. Dinos lo que piensas en GitHub o SlotForum.

## Resumen

El editor de coches de slot funciona como el editor de equipos:

- **Selector de coche**: la lista junto al título de la página muestra todos tus coches, ordenados por nombre.
- **Modo solo lectura**: al abrirlo, el coche elegido se muestra con todos los campos bloqueados.
- **Modo edición**: haz clic en el icono **Editar** (lápiz) para desbloquear los campos. Mientras editas, el selector queda bloqueado.
- **Guardado automático**: los cambios se guardan en segundo plano a medida que los haces.
- **Descartar cambios**: si sales con cambios sin guardar o no válidos, se te pide confirmación. Descartar devuelve el coche a su última versión guardada.

## Acciones de la barra de herramientas

- **Atrás**: vuelve a Race Day Setup.
- **Añadir coche (+)**: crea un coche nuevo y lo abre para editar.
- **Duplicar**: copia el coche elegido con un nombre nuevo y único. Útil para un segundo coche del mismo tipo.
- **Editar / Listo**: cambia entre solo lectura y edición.
- **Eliminar**: elimina el coche elegido tras confirmarlo.
- **Deshacer / Rehacer**: retrocede o avanza por tus cambios recientes.
- **Ayuda (?)**: inicia la visita guiada.

## El coche {: #car-profile }

El panel izquierdo recoge qué es el coche:

- **Foto**: elige una imagen o sube una foto del coche.
- **Nombre**: obligatorio y único entre tus coches (por ejemplo «Porsche 911 RSR #92»).
- **Marca / fabricante**: por ejemplo Scalextric, Carrera, Slot.it o NSR.
- **Clase**: la clase en la que corre el coche, como GT3 o Classic. Mientras escribes se sugieren las clases de tus otros coches, para que la misma clase se escriba siempre igual.
- **Escala**: 1/24, 1/32, 1/43, 1/64 (HO), Otra o Sin definir.

## Configuración {: #car-setup }

El panel derecho recoge cómo está preparado el coche. Cada campo es texto libre, para describirlo como lo hace tu club:

- **Motor**: por ejemplo «Slot.it V12/4 21.5k», o pancake / inline en HO.
- **Imán**: tipo y fuerza, o «ninguno» para carreras sin imán.
- **Chasis**, **Relación** (por ejemplo 9/27) y **Neumáticos**.
- **Modificado**: márcalo si el coche se ha cambiado respecto a la versión de fábrica; déjalo vacío para un coche de serie.
- **Notas**: cualquier otra cosa sobre el coche.

## Tus campos {: #car-custom-fields }

Debajo de la configuración puedes añadir tus propios campos, para todo lo que lleve tu club (por ejemplo el peso, el piñón o la guía). En el modo edición, pulsa **Gestionar campos**:

- **Nuevo campo**: ponle un nombre y elige un tipo: **Texto**, **Número**, **Sí / no** o **Elección de una lista** (una opción por línea).
- **Editar**: renombra un campo o cambia sus opciones. El tipo no se puede cambiar una vez añadido el campo.
- **Subir / bajar**: cambia el orden de los campos.
- **Eliminar**: quita el campo, y su valor de todos los coches, tras confirmarlo.

Todos los coches tienen los mismos campos y guardan sus propios valores. Un campo que dejas vacío se queda vacío.

## Coches de slot en una carrera {: #car-in-race }

- **Race Day Setup**: en la lista de pilotos que corren, haz clic en el icono del coche de una fila para elegir un coche de slot. Un equipo elige **Un coche para el equipo** o **Un coche por piloto**. RC AI recuerda tu elección para la próxima carrera.
- **Cambiar entre mangas**: el día de carrera, abre **Director de Carrera → Coches de slot…**. Muestra la próxima manga carril por carril; elige otro coche y cambia al instante. Mientras una manga está en curso, las listas están bloqueadas.
- **Modificar mangas**: el icono del coche de un piloto cambia su coche para todas las mangas que aún no se han corrido.
- **Resultados**: cada manga guarda una copia del coche tal como corrió, así que editar o borrar un coche después no cambia los resultados anteriores.

El icono del coche y la opción Coches de slot… solo aparecen cuando hay coches de slot en la base de datos.

## Los coches se quedan en su carril (IROC) {: #cars-in-lanes }

En una carrera IROC los coches se quedan en su carril toda la carrera y los pilotos rotan por los carriles, así cada piloto corre con cada coche.

- **Editor de carreras**: marca **Los coches se quedan en su carril (IROC)** en la sección **Mangas**.
- **Configuración del Día de Carrera**: bajo la lista **Pilotos en Carrera** aparece un cuadro **Coches por carril**. Haz clic para elegir el coche de cada carril. RC AI recuerda los coches por pista. Los iconos de coche de los pilotos se ocultan, porque el coche va con el carril.
- **Cambiar entre mangas**: **Director de Carrera → Coches de slot…** muestra cada carril con su coche. Un coche nuevo cuenta desde la siguiente manga que no se ha corrido.
- **Resultados**: cada manga guarda el coche de cada carril, así ves qué piloto corrió con qué coche.
