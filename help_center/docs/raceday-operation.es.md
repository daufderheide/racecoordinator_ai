# Operación en el Día de Carrera

## Ajustes de Vueltas y Tiempo

Los directores de carrera pueden ajustar manualmente el recuento de vueltas y los tiempos de manga de los pilotos directamente desde la pantalla de carrera para resolver incidentes en pista, fallos de detección de sensores o penalizaciones:

### Cómo abrir el diálogo de ajuste
- **Clic en celda**: Haga clic izquierdo en cualquier celda o tarjeta de **Vueltas** (`lapCount`, `physicalLapCount`) o **Tiempo Total** (`totalTime`, `overallTotalTime`) para ese carril.
- **Menú del Director de Carrera**: Abra el **Menú del Director de Carrera** y seleccione **Ajustar secciones de vuelta/tiempo** para modificar cualquier piloto en cualquier manga actual, previa o no iniciada en lote.
- **Pantallas de Resultados**: También accesible desde las pantallas de **Resultados de Manga** y **Resultados de Carrera** para editar mangas ya disputadas.

### Atajos rápidos (Vueltas)
Al hacer clic sobre una celda interactiva de vueltas:
- **`Shift + Clic Izquierdo`**: Añade +0.25 vueltas (+1/4 de vuelta) inmediatamente sin abrir el diálogo.
- **`Alt + Clic Izquierdo`**: Quita -0.25 vueltas (-1/4 de vuelta) inmediatamente sin abrir el diálogo.

### Controles del Diálogo
1. **Secciones de Vuelta**: Ingrese secciones de pista (por ejemplo, sobre 100 secciones por vuelta) para ajustar el número de vueltas. Una vista previa en vivo indica la fracción equivalente (ej. 25 secciones = 0.25 vueltas).
2. **Ajuste de Tiempo**: Ingrese segundos positivos (penalización, ej. `+5.000`) o negativos (compensación de tiempo, ej. `-2.500`) con precisión de milisegundos (`0.001s`).
3. **Vista previa de Tiempo Total**: El diálogo calcula y muestra el tiempo total ajustado del piloto en tiempo real antes de aplicar los cambios.

### Efecto en Clasificaciones y Métricas
- **Vueltas Ajustadas**: Modifica directamente la posición en clasificaciones por **Mayor Número de Vueltas** y actualiza las diferencias de vuelta (`gapLeader`, `gapPosition`). No modifica las vueltas físicas reales, la mejor vuelta, la vuelta mediana ni el ritmo promedio de vueltas físicas.
- **Tiempo Total Ajustado**: Modifica la posición en clasificaciones por **Tiempo Total Más Rápido**, actúa como desempate principal entre pilotos con las mismas vueltas, y actualiza el **Tiempo Promedio de Vuelta** ($\text{Tiempo Total Ajustado} / \text{Vueltas Físicas}$) y los márgenes de tiempo.
- **Métricas Protegidas**: La **Mejor Vuelta** y la **Vuelta Mediana** se preservan estrictamente en función de las vueltas físicas reales y nunca son modificadas por ajustes de tiempo.
