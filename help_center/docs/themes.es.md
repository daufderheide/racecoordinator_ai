# Temas

## Descripción General {: #overview }

Los temas definen la presentación audiovisual completa y la atmósfera de sus carreras en Race Coordinator AI. En lugar de configurar elementos visuales, gráficos de iluminación y avisos sonoros individualmente para cada carrera, los temas combinan estos componentes en perfiles reutilizables.

Cuando un tema está activo, coordina:
- El diseño de pantalla emparejado en la pantalla principal.
- Gráficos visuales sincronizados para banderas, luces de salida e indicadores de combustible.
- Efectos de sonido del sistema, señales de cuenta atrás y anuncios por voz.
- Anulaciones centralizadas de audio para los sonidos individuales de los pilotos.

---

## Configuración del Tema {: #top-selectors }

Ubicados en la barra de controles superior del Editor de Temas, estos ajustes definen las propiedades principales y los diseños vinculados:

- **Nombre del Tema:** Identificador único del tema. Los temas predeterminados del sistema (*RC AI*, *Formula*, *Endurance*) están protegidos y no se pueden eliminar ni renombrar.
- **Diseño de Interfaz Vinculado:** Selecciona el diseño de pantalla creado en el [Editor de Diseños](layout-editor.es.md) que se carga automáticamente en la pantalla principal al iniciar una carrera con este tema.
- **Tema de Estación de Piloto:** Especifica el tema utilizado al abrir una pantalla de estación de piloto dedicada o cuando un piloto se conecta desde un móvil o tableta.
- **Tema de Vista de Piloto:** Especifica el tema utilizado para pantallas de cronograma y dispositivos de espectadores.
- **Temas de Ventana (Temas complementarios):** Configura los temas complementarios para pantallas secundarias. De forma predeterminada, todos los temas disponibles están seleccionados. Durante una carrera, la barra de menús muestra estrictamente los temas configurados para el tema principal. Los temas se pueden seleccionar individualmente o gestionar con la acción de un clic **Seleccionar todo** en el Editor de Temas. Cuando se crea un tema nuevo, se añade automáticamente a todos los temas existentes que tengan todos seleccionados.

---

## Imágenes de Banderas {: #flags }

La sección Imágenes de Banderas le permite personalizar los gráficos mostrados en la pantalla de carrera, widgets de banderas y estaciones de piloto para cada condición de carrera:

- **Carrera (`flag.racing`):** Se muestra durante condiciones normales de carrera con pista verde.
- **Manga Pausada (`flag.heat_paused`):** Bandera amarilla de precaución mostrada durante una interrupción de pista o pausa.
- **Manga Terminada (`flag.heat_over`):** Bandera a cuadros mostrada al finalizar la duración o las vueltas objetivo de la manga.
- **Carrera Terminada (`flag.race_over`):** Bandera a cuadros final que señala la conclusión de todo el evento de carrera.
- **No Iniciada (`flag.not_started`):** Bandera mostrada antes de que comience una manga o carrera.
- **Iniciando (`flag.starting`):** Bandera roja durante la cuenta atrás previa al encendido de la luz verde.
- **Reiniciando (`flag.restarting`):** Bandera mostrada durante la cuenta atrás de reinicio tras una bandera amarilla.
- **Última Vuelta (`flag.one_lap_to_go`):** Bandera blanca tradicional que indica que el líder está en su última vuelta.
- **Manga Finalizando (`flag.heat_finishing`):** Bandera mostrada cuando el ganador ha cruzado la meta y los demás coches terminan su vuelta en curso.
- **Calentamiento (`flag.warmup`):** Se muestra durante sesiones de práctica y calentamiento previo a la carrera.
- **Piloto Terminado (`flag.driver_finished`):** Indicador por carril para pilotos que han completado todas sus vueltas.
- **Penalización (`flag.penalty`):** Bandera negra / indicador de penalización por salida en falso o infracción de tiempo por vuelta.
- **Descalificado (`flag.disqualified`):** Bandera negra mostrada cuando un piloto es descalificado en Crash and Learn o por dirección de carrera.

Para cada bandera puede elegir preajustes integrados o subir imágenes personalizadas en formato SVG, PNG, WebP o JPG a través del [Gestor de Recursos](asset-manager.es.md).

---

## Luces de Salida {: #countdown }

La sección Luces de Salida configura los gráficos de las lámparas utilizados por el Widget de Cuenta Atrás y las luces de salida en pantalla:

- **Lámpara Roja Apagada (`lamp.red.dim`):** Gráfico de lámpara roja atenuada o apagada en estado de espera.
- **Lámpara Roja Encendida (`lamp.red.on`):** Gráfico de lámpara roja iluminada durante las etapas de cuenta atrás.
- **Lámpara Verde (`lamp.green`):** Lámpara verde brillante mostrada en el momento de la salida cuando se activa la corriente.

Estos gráficos se ajustan automáticamente a widgets de luces horizontales y verticales.

---

## Indicador de Combustible {: #fuel-gauge }

La sección Indicador de Combustible configura conjuntos de imágenes multifotograma para simulaciones analógicas y digitales:

- **Conjunto de Indicador (`gauge.fuel`):** Conjunto de imágenes que representan los niveles de combustible desde el 100% (lleno) hasta el 0% (vacío).

Durante una carrera con combustible activo, Race Coordinator AI calcula el consumo en tiempo real y actualiza el fotograma correspondiente, activando alertas visuales cuando el nivel entra en reserva.

---

## Efectos de Sonido {: #audio }

Los temas permiten personalizar sonidos globales del sistema, cuenta atrás, avisos de tiempo y voz:

- **Cuenta Atrás de Salida (`audio.countdown`):** Tonos sonoros durante la secuencia de cuenta atrás.
- **Luz Verde / SALIDA (`audio.countdown.green`):** Tono emitido al encenderse la luz verde.
- **Bandera Amarilla (`audio.yellowflag`):** Sirenas de aviso al producirse una interrupción de pista.
- **Inicio Automático Segundos Restantes (`audio.auto_start`):** Avisos por voz antes del inicio automático de la manga.
- **Tiempo de Manga Segundos Restantes (`audio.seconds_left`):** Avisos periódicos de tiempo restante.
- **Mitad de Manga (`audio.seconds_left.halfway`):** Notificación al alcanzar el punto medio de la manga.
- **Vueltas Restantes del Líder (`audio.laps_left`):** Avisos de vueltas restantes para el líder.
- **Manga Terminada (`audio.heat_over`):** Sonido al finalizar la manga activa.
- **Carrera Terminada (`audio.race_over`):** Fanfarria final al concluir el evento.
- **Avance Automático (`audio.auto_advance`):** Avisos de cuenta atrás antes de pasar a la siguiente manga.
- **Infracción de Tiempo Mínimo (`audio.min_lap_time`):** Tono de alerta si se infringe el tiempo mínimo por vuelta.

Cada sonido puede configurarse como:
1. **Sonido Predeterminado:** Efecto de sonido del catálogo integrado.
2. **Archivo de Audio:** Archivos WAV, MP3 u OGG subidos en el Gestor de Recursos.
3. **Texto a Voz (TTS):** Síntesis de voz dinámica con variables (`{time}`, `{laps}`).

Consulte la documentación del [Sistema de Audio](audio.es.md) para más detalles sobre prioridades y mezclas de sonido.

---

## Anulaciones de Audio del Piloto {: #driver-audio-overrides }

En carreras individuales, cada piloto puede tener tonos personalizados en el [Editor de Pilotos](driver-editor.es.md). Sin embargo, en carreras de club o campeonatos temáticos, se busca a menudo una experiencia sonora uniforme para todos los participantes.

La sección **Anulaciones de Audio del Piloto** permite que el tema anule de forma centralizada cualquier aviso sonoro para todos los pilotos de la carrera.

### Anulaciones de Audio Disponibles

El tema puede anular los 13 eventos de sonido de los pilotos:

#### Sonidos Personales de Vuelta
- **Vuelta Completada (`lapAudio`):** Sonido emitido en cada vuelta válida regular.
- **Mejor Vuelta Personal (`bestLapAudio`):** Sonido cuando un piloto supera su récord personal en la sesión.

#### Sonidos de Vuelta en Carrera
- **Mejor Vuelta de Carrera (`raceBestLapAudio`):** Sonido al marcar la vuelta más rápida de la carrera en cualquier carril.
- **Mejor Vuelta de Carril en Carrera (`raceLaneBestLapAudio`):** Sonido por la vuelta más rápida de ese carril en la carrera.
- **Mejor Vuelta de Manga (`heatBestLapAudio`):** Sonido al marcar la vuelta más rápida de la manga activa.
- **Nuevo Líder de Carrera (`newRaceLeaderAudio`):** Aviso por voz o fanfarria al tomar el liderato general.
- **Nuevo Líder de Manga (`newHeatLeaderAudio`):** Sonido al asumir la 1.ª posición en la manga actual.

#### Sonidos de Mejor Vuelta Absoluta
- **Récord Histórico de Pista (`overallBestLapAudio`):** Sonido de alta prioridad al batir el récord absoluto del circuito.
- **Récord Histórico de Carril (`overallLaneBestLapAudio`):** Sonido al batir el récord histórico en ese carril específico.

#### Sonidos de Eventos
- **Entrada a Boxes (`pitInAudio`):** Sonido al entrar al carril de boxes en pistas digitales.
- **Aviso de Combustible (`fuelAudio`):** Alerta sonora o por voz al entrar en reserva o quedarse sin combustible.
- **Salida en Falso / Penalización (`penaltyAudio`):** Sirena o bocina al cometer una salida en falso o penalización.
- **Vuelta de Deriva (`driftLapAudio`):** Efecto de sonido o aviso de voz urgente reproducido cuando un coche cruza la meta por inercia sin corriente dentro del tiempo de deriva.

### Prioridad y Modos de Anulación

Cada evento de audio puede configurarse de manera independiente:

- **Desactivado (Casilla desmarcada):** El tema no interviene. Race Coordinator AI reproduce la configuración propia del piloto (o el sonido predeterminado).
- **Activado (Casilla marcada):** El tema anula el sonido para **todos los pilotos** que compitan bajo este tema.

Al activarlo, elija entre cuatro modos:
1. **Sonido Predeterminado:** Seleccione un efecto sonoro del catálogo estándar.
2. **Archivo de Audio:** Seleccione un archivo personalizado del Gestor de Recursos.
3. **Texto a Voz (TTS):** Frase personalizada con variables dinámicas:
   - `{driver}` — Nombre o apodo del piloto.
   - `{time}` — Tiempo de vuelta con 3 decimales (ej. `3.142`).
   - `{lane}` — Número de carril activo.
   - `{lap}` — Número de vuelta completada.
   - `{gap}` — Diferencia de tiempo con el líder.
4. **Ninguno (Silencio):** Silencia el evento por completo para toda la carrera.

### Restablecer Todas las Anulaciones

Haga clic en **Restablecer Todas las Anulaciones** en la cabecera de la sección para borrar todas las anulaciones de una sola vez, devolviendo el control total a los perfiles individuales de los pilotos.
