# Temas

!!! note "Contenido en desarrollo"
    Este artículo está en desarrollo. El contenido completo estará disponible próximamente.

## Temas

Cada tema agrupa recursos visuales (banderas, luces de semáforo, medidores de combustible), avisos de audio y asignaciones de diseño:

- **Diseño de interfaz personalizado:** El diseño de pantalla vinculado que se carga durante la carrera.
- **Tema de estación de piloto:** El tema utilizado al abrir o escanear una ventana o dispositivo de estación de piloto de un solo carril.
- **Tema de vista de piloto:** El tema utilizado al abrir o escanear la ventana de programación o pantalla personal del piloto.

## Audio

Los temas le permiten personalizar los efectos de sonido y avisos de voz globales para eventos de carrera:

- **Cuenta atrás de salida:** Sonidos durante la secuencia de salida (`audio.countdown`).
- **Semáforo verde / SALIDA:** Tono al encenderse la luz verde (`audio.countdown.green`).
- **Bandera amarilla:** Sirenas o bocinas de aviso durante una precaución (`audio.yellowflag`).
- **Segundos restantes de inicio automático:** Avisos de cuenta regresiva para el tiempo restante antes del inicio automático de la manga (`audio.auto_start`).
- **Tiempo de manga (Segundos restantes):** Avisos con el tiempo restante de la manga (`audio.seconds_left`).
- **Vueltas del líder (Vueltas restantes):** Avisos con las vueltas restantes del líder de la manga (`audio.laps_left`).
- **Mitad de manga:** Notificación al alcanzar el punto medio de una serie — tanto para carreras por tiempo (mitad de la duración transcurrida) como para carreras por vueltas (cuando el líder completa la mitad de las vueltas requeridas) (`audio.seconds_left.halfway`).
- **Manga y carrera terminadas:** Señales acústicas de fin de manga (`audio.heat_over`) o fin de carrera (`audio.race_over`).
- **Segundos restantes de avance automático:** Avisos de cuenta regresiva para el tiempo restante antes del avance automático a la siguiente manga (`audio.auto_advance`).
- **Alertas de infracción:** Tonos por tiempo de vuelta inferior al mínimo (`audio.min_lap_time`).

Para más detalles sobre la atenuación de audio, niveles de prioridad y relevancia multipantalla, consulte la documentación del [Sistema de Audio](audio.md).

## Anulaciones de audio del conductor

Los temas pueden anular la configuración de audio individual de cada conductor para todos los participantes cuando el tema esté activo. De forma predeterminada, se reproducen los sonidos personalizados de cada conductor (configurados en el [Editor de conductores](driver-editor.md)). Sin embargo, un tema puede anular selectivamente cualquiera de los 13 eventos de audio del conductor:

- **Sonidos personales de vuelta:** Vuelta completada (`lapAudio`), Mejor vuelta personal (`bestLapAudio`).
- **Sonidos de vuelta de carrera:** Mejor vuelta de carrera (`raceBestLapAudio`), Mejor vuelta de carril de carrera (`raceLaneBestLapAudio`), Mejor vuelta de manga (`heatBestLapAudio`), Nuevo líder de carrera (`newRaceLeaderAudio`), Nuevo líder de manga (`newHeatLeaderAudio`).
- **Sonidos de mejor vuelta general:** Mejor vuelta general (`overallBestLapAudio`), Mejor vuelta de carril general (`overallLaneBestLapAudio`).
- **Sonidos de eventos:** Entrada a boxes (`pitInAudio`), Nivel de combustible (`fuelAudio`), Salida en falso / Sanción (`penaltyAudio`), Vuelta derrape (`driftLapAudio`).

### Jerarquía de anulación y configuración
- **Deshabilitado (Predeterminado):** El tema no modifica la ranura; se reproduce la configuración individual del conductor.
- **Anulación habilitada:** El tema tiene prioridad para ese evento de sonido específico en todos los conductores que utilicen este tema. Puede configurarlo como un **Sonido predeterminado**, un **Archivo de audio cargado**, una frase de **Texto a voz (TTS)** personalizada o **Ninguno** (para silenciar el evento en todo el tema).
- **Restablecer todas las anulaciones:** Borra rápidamente todas las anulaciones activas en el tema, devolviendo el control total a la configuración de cada conductor.
