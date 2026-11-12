# Conjuntos de Rotaciones Personalizadas

## Descripción General {: #overview }

El **Editor de Conjuntos de Rotaciones Personalizadas** le permite diseñar, editar y organizar esquemas de rotación de heats a medida para su pista. Mientras que Race Coordinator AI proporciona rotaciones algorítmicas estándar como **Round Robin**, **Round Robin Europeo**, **Heat Individual** y **Carreras Step Up**, los conjuntos de rotaciones personalizadas ofrecen a los directores de carrera un control manual total, carril por carril, sobre la programación de pilotos, el orden de los heats y las asignaciones de carriles.

Un **Activo de Conjunto de Rotaciones Personalizadas** representa una colección (o conjunto) de configuraciones de rotación individuales adaptadas específicamente al número de carriles físicos de una pista (como 2, 4, 6 u 8 carriles). Dentro de un único activo de conjunto de rotaciones personalizadas, puede definir múltiples patrones de rotación optimizados para diferentes cantidades de participantes.

Los conjuntos de rotaciones personalizadas son ideales para:

- **Configuraciones de Pistas Irregulares:** Pistas con características de carril específicas, configuraciones con hándicap o requisitos de calle de boxes.
- **Formatos de Club y Reglas Internas:** Cronogramas de rotación tradicionales de clubes donde deben mantenerse estrictamente emparejamientos de pilotos o secuencias de carriles específicas.
- **Secuencias de Etapas y Turnos Fijos:** Carreras de exhibición especiales, derbis o formatos por equipos donde las secuencias algorítmicas de Round Robin no se ajustan a las reglas del evento.

---

## Cómo Funcionan los Conjuntos de Rotaciones Personalizadas {: #how-custom-rotations-work }

### Capacidad Máxima de Pilotos por Rotación {: #maximum-driver-capacity }

Un activo de conjunto de rotaciones personalizadas no define solo un cronograma estático individual; contiene un **conjunto de rotaciones**, donde **cada rotación especifica una rotación para un número máximo de pilotos** (`numDrivers`).

Dentro de cada rotación:

- **Cabezas de Serie de Pilotos Virtuales:** Los pilotos se identifican mediante números de cabeza de serie: `Piloto 1`, `Piloto 2`, ... hasta `Piloto N` (donde `N` es la capacidad máxima de pilotos de la rotación).
- **Asignaciones de Carril:** Para cada heat, a cada carril físico se le asigna un piloto virtual específico (p. ej. Carril 1: Piloto 1, Carril 2: Piloto 2), o se deja vacío/sin asignar.
- **Siembra de Participantes:** Cuando comienza una carrera, los pilotos registrados se asignan a las cabezas de serie 1 a $M$ según su orden de siembra en la carrera (o un orden de clasificación aleatorio).

Por ejemplo, un activo "Sprint de Club de 4 Carriles" puede contener:

- Una **Rotación de 4 Pilotos:** Un cronograma de 4 heats donde 4 pilotos corren una vez en cada uno de los 4 carriles.
- Una **Rotación de 5 Pilotos:** Un cronograma de 5 heats donde 5 pilotos rotan a través de los 4 carriles, descansando un piloto en cada heat.
- Una **Rotación de 6 Pilotos:** Un cronograma de 6 heats que garantiza un tiempo de pista equilibrado.
- Una **Rotación de 8 Pilotos:** Un cronograma de 8 heats para una mayor concurrencia.

---

### Algoritmo de Selección de Rotación {: #rotation-selection-algorithm }

Cuando comienza una carrera configurada con un formato de rotación personalizada (o cuando el editor de carreras genera la vista previa en vivo de los heats), Race Coordinator AI determina automáticamente qué rotación del conjunto del activo debe utilizarse.

El sistema cuenta el número de pilotos activos participantes (`driverCount`) y selecciona la rotación óptima mediante una estricta **estrategia de priorización de tres niveles**:

#### 1. Nivel 1: Coincidencia Exacta {: #selection-tier-1 }
El sistema busca primero una rotación cuyo número máximo de pilotos configurado (`numDrivers`) **coincida exactamente** con el número de pilotos activos (`numDrivers == driverCount`).

- **Resultado:** Se selecciona la rotación con coincidencia exacta.
- **Mapeo de Carriles:** Cada piloto participante se asigna 1:1 a su cabeza de serie virtual correspondiente (el Piloto 1 corre como Cabeza de serie 1, el Piloto 2 como Cabeza de serie 2, etc.). No hay carriles vacíos a menos que la rotación se haya diseñado explícitamente con carriles desocupados.

#### 2. Nivel 2: Más Cercana por Encima (Rotación Menor Mayor que el Número de Pilotos) {: #selection-tier-2 }
Si ninguna rotación coincide con el recuento exacto, el sistema busca todas las rotaciones del conjunto cuya capacidad máxima de pilotos sea **mayor que** el recuento de pilotos activos (`numDrivers > driverCount`). Entre estas, selecciona la rotación con la **menor diferencia**:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Resultado:** Se selecciona la rotación más cercana por encima para garantizar que todos los pilotos participantes puedan competir.
- **Gestión de Carriles Vacíos:** Como hay menos pilotos presentes que para los que se diseñó la rotación, cualquier espacio de carril asignado a una cabeza de serie virtual que supere el número de pilotos activos (`Cabeza de serie > driverCount`) se llena automáticamente con un **espacio de piloto vacío** (`Driver.EMPTY_DRIVER`). Ese carril correrá desocupado en ese heat, mientras que todos los pilotos participantes competirán en sus posiciones programadas.

#### 3. Nivel 3: Más Cercana por Debajo (Rotación Mayor Menor que el Número de Pilotos) {: #selection-tier-3 }
Si el número de pilotos activos supera la capacidad máxima de **todas** las rotaciones definidas en el conjunto (por ejemplo, si participan 9 pilotos, pero la rotación más grande del conjunto solo admite 8 pilotos), el sistema recurre a la rotación con la **mayor capacidad inferior al número de pilotos activos**:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Resultado:** Se selecciona la rotación más cercana por debajo.
- **Limitación de Capacidad:** Solo los pilotos cuya cabeza de serie esté dentro de la capacidad de la rotación seleccionada (Pilotos 1 a `numDrivers`) serán programados para competir en esos heats. Los pilotos con índices de cabeza de serie superiores a `numDrivers` no recibirán asignaciones de heat.

!!! tip "Consejo de Diseño: Cubra Todos los Tamaños de Parrilla"
    Para garantizar que todos los pilotos compitan sin participantes no programados ni carriles vacíos imprevistos, cree una rotación para cada tamaño de parrilla esperado (p. ej., 4, 5, 6, 7 y 8 pilotos) dentro del mismo activo de conjunto de rotaciones personalizadas.

---

### Ejemplos Prácticos de Selección {: #selection-examples }

Suponga que tiene un activo de conjunto de rotaciones personalizadas con tres rotaciones definidas: **4 Pilotos**, **6 Pilotos** y **8 Pilotos**. La tabla siguiente muestra qué rotación selecciona Race Coordinator AI según la cantidad de participantes:

| Pilotos Registrados | Disponibles en Conjunto | Rotación Seleccionada | Regla de Selección | Comportamiento en Pista y Carriles Vacíos |
| :---: | :---: | :---: | :---: | :--- |
| **4 Pilotos** | 4, 6, 8 | **Rotación de 4 Pilotos** | **Nivel 1 (Coincidencia Exacta)** | Ajuste perfecto. Todos los carriles llenos; compiten los 4 pilotos. |
| **5 Pilotos** | 4, 6, 8 | **Rotación de 6 Pilotos** | **Nivel 2 (Más Cercana por Encima)** | Los puestos de cabeza de serie 6 corren vacíos. Compiten los pilotos 1–5. |
| **6 Pilotos** | 4, 6, 8 | **Rotación de 6 Pilotos** | **Nivel 1 (Coincidencia Exacta)** | Ajuste perfecto. Todos los carriles llenos; compiten los 6 pilotos. |
| **7 Pilotos** | 4, 6, 8 | **Rotación de 8 Pilotos** | **Nivel 2 (Más Cercana por Encima)** | Los puestos de cabeza de serie 8 corren vacíos. Compiten los pilotos 1–7. |
| **8 Pilotos** | 4, 6, 8 | **Rotación de 8 Pilotos** | **Nivel 1 (Coincidencia Exacta)** | Ajuste perfecto. Todos los carriles llenos; compiten los 8 pilotos. |
| **9 Pilotos** | 4, 6, 8 | **Rotación de 8 Pilotos** | **Nivel 3 (Más Cercana por Debajo)** | Compiten los pilotos 1–8. El piloto 9 queda sin programar. |

---

## Creación de un Conjunto de Rotaciones Personalizadas {: #creating-custom-rotations }

Para crear un nuevo activo de conjunto de rotaciones personalizadas:

1. Abra el **Gestor de Activos** desde el menú principal o la pantalla de configuración.
2. En el panel izquierdo, haga clic en el botón **Nuevo Conjunto de Rotaciones Personalizadas** (o filtre por **Conjuntos de Rotaciones Personalizadas** y haga clic en una tarjeta existente para editarla).
3. Se abrirá el **Editor de Rotaciones**:
   - Al crear un nuevo activo, el editor muestra inicialmente una tarjeta de estado vacío con orientación y un enlace **Más información sobre conjuntos de rotaciones personalizadas** hacia esta documentación.
   - Introduzca un **Nombre de Activo** único en el panel de configuración.
   - Seleccione su **Pista** de destino. La selección de pista configura automáticamente el número de carriles para todas las rotaciones del conjunto.

---

## Diseño de Heats y Carriles {: #designing-heats }

### Adición de Rotaciones al Conjunto {: #adding-rotations }

1. Haga clic en el botón **Añadir Rotación** (`+`) en la barra de herramientas superior para crear su primera tarjeta de rotación.
2. Defina el campo **Número de Pilotos** en el encabezado de la tarjeta. Esto determina la capacidad máxima de pilotos para esa rotación específica.
3. La tarjeta se completa automáticamente con un heat inicial que contiene espacios de carril para su pista.

### Adición y Reordenación de Heats {: #adding-heats }

- **Añadir Heat:** Haga clic en el icono `+` del encabezado de la rotación para agregar heats adicionales.
- **Reordenar Heats:** Arrastre y suelte las tarjetas de heat dentro de la cuadrícula para modificar la secuencia de carreras.
- **Eliminar Heat:** Haga clic en el icono de papelera de una tarjeta de heat individual para eliminarla.

### Asignación de Pilotos a Carriles {: #assigning-drivers }

- **Grupo de Pilotos Virtuales:** El panel izquierdo ofrece un grupo de pilotos virtuales (`Piloto 1`, `Piloto 2`, etc.). Puede ajustar el número de pilotos en el grupo para generar tantas cabezas de serie como necesite.
- **Arrastrar y Soltar:** Arrastre las fichas de piloto desde el grupo directamente a los espacios de carril de cualquier heat.
- **Intercambio de Carriles:** Arrastre la ficha de un piloto de un carril a otro para intercambiar sus asignaciones.
- **Vaciar Carril:** Arrastre un piloto fuera de un carril o retírelo para dejarlo desocupado.

### Asignaciones de Grupo {: #group-assignments }

Cada tarjeta de heat incluye un campo de entrada para el **Grupo**:

- Asigne heats a diferentes números de grupo (p. ej., Grupo 1, Grupo 2) al organizar carreras por grupos o fases.
- Los pilotos de diferentes grupos compiten de forma independiente, y las clasificaciones pueden separarse por grupo en la configuración de la carrera.

### Validación de la Igualdad de Carriles {: #lane-equality-validation }

La equidad es fundamental en el slot car racing. Race Coordinator AI valida continuamente la distribución de carriles en cada rotación:

- **Insignia de Verificación (Verde):** Indica que cada piloto corre el mismo número de veces en cada carril a lo largo de la rotación.
- **Insignia de Advertencia (Naranja):** Indica que las asignaciones de carril están desequilibradas (por ejemplo, el Piloto 1 corre dos veces en el Carril 1, pero nunca en el Carril 4).
- **Informe de Igualdad:** Haga clic en la insignia de igualdad para abrir el **Informe Detallado de Igualdad de Carriles**, que muestra una matriz con las apariciones exactas de cada piloto por carril.

### Ordenación de Rotaciones {: #sorting-rotations }

Haga clic en el botón **Ordenar Rotaciones** (`swap_vert`) en la barra de herramientas para organizar automáticamente todas las tarjetas de rotación en orden ascendente según su número máximo de pilotos.

---

## Importación y Exportación de Rotaciones {: #importing-exporting }

Puede compartir rotaciones entre equipos o archivarlas:

- **Exportar Activo Completo:** Haga clic en el botón **Exportar** de la barra de herramientas superior para descargar todo el activo de conjunto de rotaciones personalizadas como archivo `.json`.
- **Exportar Rotación Individual:** Haga clic en el icono de exportar (`upload`) en la tarjeta de una rotación individual para exportar únicamente esa configuración.
- **Importar Rotaciones:** Haga clic en **Importar** para cargar archivos `.json` o archivos heredados de Race Coordinator (`.txt` en formato RC1) en su activo.

---

## Uso de Conjuntos de Rotaciones Personalizadas en Carreras {: #using-in-races }

Una vez guardado su activo de conjunto de rotaciones personalizadas:

1. Abra el [Editor de Carreras](race-editor.md).
2. En la sección **Configuración de Carrera** del panel izquierdo, establezca el **Formato de Rotación de Heats** en **Conjunto de rotaciones personalizadas**.
3. Seleccione su activo de conjunto de rotaciones personalizadas en el menú desplegable **Conjunto de rotaciones personalizadas**.
4. Ajuste la configuración según lo deseado:
   - **Veces a Través de Heats:** Repite la secuencia completa de rotación personalizada $N$ veces.
   - **Invertir Heats:** Invierte el orden de los heats para correr la secuencia al revés.
5. Utilice el control deslizante de **Vista Previa de Pilotos** y examine la **Vista Previa de Heats en Vivo** en el panel derecho para comprobar las asignaciones antes del día de la carrera.
