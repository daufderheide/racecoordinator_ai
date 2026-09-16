# Sistema de Audio

Race Coordinator AI incorpora un motor de audio inteligente de doble canal diseñado para ofrecer efectos de sonido envolventes, comentarios de voz dinámicos y anuncios críticos de control de carrera sin superposiciones caóticas ni avisos perdidos.

---

## Arquitectura de Audio de Doble Canal

El motor de audio separa el sonido en dos canales independientes:

```
                      ┌────────────────────────────────────────┐
                      │          Distribuidor de Audio         │
                      └───────────────────┬────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │   Efectos de Sonido    │                      │    Avisos de Voz       │
     │      (SFX Breves)      │                      │   (TTS y Comentarios)  │
     └────────────┬───────────┘                      └────────────┬───────────┘
                  │                                               │
                  ▼                                               ▼
         Reproducción Polifónica                       Voz Única Priorizada
       (Múltiples tonos a la vez)                   ("Reproducir, Reemplazar, 
                  │                                         Descartar")       
                  │◄──────── Atenuación Automática (Ducking) ─────┤
                  │ (Los SFX bajan automáticamente al 20%         │
                  │   de volumen mientras la voz habla)           │
```

### 1. Efectos de Sonido (SFX)
- **Qué incluye:** Tonos cortos no verbales como pitidos de paso por vuelta (`default_beep`), efectos de aceleración (`default_driveby`) o campanas.
- **Reproducción Polifónica:** Se reproducen de inmediato usando elementos HTML5. Si varios coches cruzan la meta al mismo tiempo, cada uno activa su propio tono sin interrumpir a los demás.
- **Atenuación Automática (Audio Ducking):** Mientras se reproduce un mensaje de voz, el volumen de los efectos de sonido se reduce automáticamente al **20%**. Al terminar la voz, los efectos recuperan el 100% de su volumen.

### 2. Avisos de Voz Hablada
- **Qué incluye:** Locuciones de texto a voz (TTS) y archivos de audio verbales grabados (comentarios, sirenas de bandera amarilla, avisos de parada en boxes y cuentas atrás).
- **Motor de Voz Única:** Se gestionan mediante una cola inteligente con la regla **"Reproducir, Reemplazar o Descartar"**, evitando que varias voces hablen al mismo tiempo.

---

## El Sistema de Prioridades

Para gestionar eventos simultáneos (pasos por vuelta, cambios de líder, banderas amarillas, anuncios de tiempo), Race Coordinator AI emplea una jerarquía de 4 niveles de prioridad:

### Niveles de Prioridad

| Nivel | Peso | Eventos Típicos | Comportamiento en Conflicto |
| :--- | :---: | :--- | :--- |
| **`urgent`** (Urgente) | 4 | Bandera amarilla, manga terminada, carrera terminada, salida en falso, tiempo mínimo de vuelta, vuelta de drift, entrada a boxes, alertas de combustible (aviso, crítico, vacío). | **Interrumpe** de inmediato cualquier voz de menor prioridad. Si ya hay una locución urgente hablando, los nuevos avisos urgentes se colocan en la **Cola Urgente** en lugar de descartarse. Omite la pausa de cadencia. |
| **`high`** (Alta) | 3 | Récord absoluto de pista, récord absoluto de carril, nuevo líder de carrera, mejor vuelta de carrera. | **Interrumpe** avisos de prioridad `normal` o `low`. Se **descarta** si hay una locución `urgent` o de prioridad igual/superior activa. |
| **`normal`** (Normal) | 2 | Avisos de tiempo (ej. "30 segundos restantes"), mitad de manga, mejor vuelta de manga, mejor vuelta de carril de carrera, nuevo líder de manga, mejor vuelta personal (en modo TTS). | **Interrumpe** avisos `low`. Se **descarta** si suena una locución `urgent`, `high` u otra locución `normal`. |
| **`low`** (Baja) | 1 | Sonido de vuelta rutinaria del piloto (en modo TTS). | Solo se reproduce si el canal está libre. Se **descarta** si cualquier otro aviso está hablando. |

### Reglas de Conflicto

1. **Reemplazo (Preemption):** Si llega un aviso con mayor prioridad que la locución actual, esta se detiene inmediatamente para dar paso al nuevo aviso.
2. **Descarte (Dropping):** Si un aviso entrante tiene igual o menor prioridad que el que está hablando, se descarta para evitar que las voces se mezclen.
3. **Cola Urgente (Urgent Queueing):** Las alertas urgentes son críticas para el control de carrera. Si llega una alerta urgente mientras otra está hablando, se encola y suena tan pronto como termine la actual.
4. **Pausa de Cadencia (Callout Spacing):** Tras terminar un aviso hablado, se inserta una breve pausa de silencio antes de permitir el siguiente aviso no urgente, asegurando una escucha clara.

### Prioridad de Hitos y Respaldo (Milestone Priority & Fallback)

Cuando un piloto completa una vuelta que activa uno o más hitos (como récords de pista, mejor vuelta de manga o cambio de líder):

1. **Cascada de prioridad para eventos simultáneos:** Los sonidos candidatos de hitos se evalúan en estricto orden de prioridad (Récord general -> Récord general de carril -> Nuevo líder de carrera -> Nuevo líder de manga -> Mejor vuelta de carrera -> Mejor vuelta de carril de carrera -> Mejor vuelta de manga -> Mejor vuelta personal). Si el sonido de mayor prioridad está configurado como `none` (o no configurado), el sistema pasa al siguiente sonido de mayor prioridad activado en esa vuelta y lo reproduce si está configurado.
2. **Avisos descartados por canal ocupado:** Si una locución verbal seleccionada se **descarta** porque otra de mayor prioridad está sonando (o durante una pausa de cadencia), no se reproducirá ningún otro aviso verbal en esa vuelta. En su lugar, el sistema recurre directamente al sonido de **mejor vuelta personal** (si fue PB) o al **tono de vuelta estándar**.
3. **Respaldo polifónico SFX:** Si el sonido de respaldo es un efecto de sonido (SFX), suena polifónicamente, garantizando que el piloto reciba confirmación auditiva inmediata al cruzar la línea de meta.

---

## Opciones de Configuración de Audio

En el **Editor de Interfaz**, dentro de la sección **Configuración de Audio**, encontrará los siguientes ajustes:

### Volumen Maestro
- **Rango:** 0% a 100% (Predeterminado: `100%`)
- **Descripción:** Ajusta el nivel de volumen global de la aplicación, escalando tanto los efectos de sonido como la síntesis de voz.

### Tiempo de Espera de Cola Urgente (TTL)
- **Opciones:** `3 segundos`, `5 segundos (Predeterminado)`, `10 segundos`
- **Descripción:** Tiempo máximo que una alerta urgente puede esperar en la cola si otra alerta urgente ya está hablando. Las alertas caducadas se descartan para no anunciar eventos desfasados.

### Espaciado de Avisos (Pausa de Cadencia)
- **Opciones:** `Ninguno (0s)`, `Corto (500ms - Predeterminado)`, `Normal (1000ms)`, `Relajado (1500ms)`
- **Descripción:** Intervalo mínimo de silencio entre locuciones habladas consecutivas para evitar que se amontonen. Las alertas urgentes omiten esta pausa inmediatamente.

---

## Configuración de Texto a Voz (TTS)

Race Coordinator AI utiliza la API Web Speech nativa del navegador para ofrecer síntesis de voz sin latencia y sin depender de servicios en la nube ni conexión a internet.

### Parámetros de Voz TTS

| Ajuste | Rango / Opciones | Predeterminado | Descripción |
| :--- | :--- | :---: | :--- |
| **Voz TTS** | Voces del navegador / SO | `-- Predeterminado --` | Selecciona la voz utilizada para los avisos hablados (con códigos de idioma como `es-ES`, `en-US`). |
| **Velocidad (Rate)** | `0.1x` a `2.0x` | `1.0x` | Controla la velocidad de habla. Velocidades ligeramente más rápidas (`1.1x`–`1.3x`) son ideales para pistas rápidas. |
| **Tono (Pitch)** | `0.0x` a `2.0x` | `1.0x` | Ajusta la frecuencia o tono de la voz. |
| **Volumen TTS** | `0%` a `100%` | `100%` | Volumen independiente de la voz antes de ser multiplicado por el Volumen Maestro (`masterVolume * ttsVolume`). |
| **Probar Voz** | Botón | — | Reproduce una locución de prueba con los ajustes actuales. |

### Variables Dinámicas en TTS

Los textos TTS aceptan variables entre llaves `{...}` o `${...}`:
- `{driver.name}`, `{driver.nickname}`: Nombre y apodo del piloto.
- `{driver.lastLapTime}`, `{driver.bestLapTime}`: Tiempos de vuelta (redondeados automáticamente a 3 decimales).
- `{driver.totalLaps}` / `{driver.lapCount}`: Total de vueltas completadas.
- `{driver.gapLeader}`, `{driver.gapPosition}`: Diferencias de tiempo con el líder o el coche precedente.
- `{race.name}`, `{track.name}`, `{heat.number}`: Contexto del evento.

Para más información, consulte la [Guía de Texto a Voz (TTS)](tts.md).

---

## Relevancia de Audio y Filtrado Multipantalla

En configuraciones con varios monitores (pantalla principal, puestos de piloto, pantallas de boxes), la **Relevancia de Audio** evita que todos los dispositivos emitan todos los sonidos a la vez.

### 1. Asociaciones de Audio (Audio Associations)
Cada sonido incluye información de contexto:
- **`widgetType`**: Tipo de widget (`'lane-view'`, `'countdown'`, `'timer'`, `'flag'`).
- **`laneIndex`**: Número de carril (índice 0).
- **`driverId`**: Identificador único del piloto.

### 2. Filtrado por Diseño en Pantalla Principal
- **Vista de Carriles (`lane-view`):** Si el diseño no tiene ningún widget de carril, los sonidos de vuelta de los pilotos se silencian.
- **Cuenta Atrás (`countdown`):** Si no hay widget de cuenta atrás, se silencian los pitidos de salida.
- **Temporizador (`timer`):** Si no hay temporizador, se silencian los avisos de mitad de manga y tiempo restante.
- **Banderas (`flag`):** Si no hay widget de banderas, se silencian los sonidos de bandera amarilla y final de carrera.

### 3. Puestos de Piloto Aislados (`scoped`)
En la pantalla de un puesto de piloto (`/driver-station/:lane`), el filtro opera en modo acotado (**`scoped`**):
- Solo se reproducen los sonidos, récords y alertas de combustible del **piloto asignado**.
- Los sonidos de los pilotos rivales se filtran en silencio para no desconcentrar al competidor.
- Los avisos globales (cuenta atrás, banderas amarillas, fin de manga) se mantienen audibles.

### 4. Motores de Audio Independientes por Ventana
Cada pestaña o ventana ejecuta una instancia aislada de `AudioService` (`providers: [AudioService]`), garantizando que los sonidos de un puesto de piloto nunca interfieran con la pantalla del director de carrera.

---

---

## Catálogo Completo de Recursos de Audio

Las siguientes tablas detallan todos los eventos de audio en Race Coordinator AI, su tipo de sonido (SFX no verbal vs. aviso de voz verbal), nivel de prioridad y ámbito de relevancia en pantalla.

### Eventos de Audio del Piloto (Configurados en el Editor de Pilotos)

| Evento de Audio del Piloto | Cuándo se reproduce | Archivo / Activo Predeterminado | Tipo de Sonido | Nivel de Prioridad | Relevancia y Pantalla |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Sonido de Vuelta** | Se reproduce en cada vuelta regular completada (o como respaldo si el sonido de hito se descarta o no está disponible). | `default_beep` | **SFX** (Predefinido) / **Aviso de Voz** (TTS) | `low` (Peso 1 en TTS; Polifónico en SFX) | `lane-view`: Suena en Pantalla Principal (si hay widget de carril) y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Mejor Vuelta Personal** | Se reproduce cuando el piloto logra su tiempo de vuelta más rápido de la manga o sesión actual. | `default_driveby` | **SFX** (Predefinido) / **Aviso de Voz** (TTS) | `normal` (Peso 2 en TTS; Polifónico en SFX) | `lane-view`: Suena en Pantalla Principal (si hay widget de carril) y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Mejor Vuelta de Carrera** | Se reproduce al marcar la vuelta más rápida de toda la carrera entre todas las mangas y carriles. | `default_best_race_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Mejor Vuelta de Carril de Carrera** | Se reproduce al lograr la vuelta más rápida en ese carril específico durante la carrera actual. | `default_best_race_lane_lap` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Mejor Vuelta de Manga** | Se reproduce cuando el piloto logra la vuelta más rápida entre todos los participantes de la manga activa. | `default_best_heat_lap` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de nuevo líder de carrera** | Se reproduce cuando un piloto pasa al primer puesto de la clasificación general de la carrera. | `default_new_race_leader` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de nuevo líder de manga** | Se reproduce cuando un piloto toma el liderato en la manga activa. | `default_new_heat_leader` | **Aviso de Voz** | `normal` (Peso 2) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Récord de Vuelta General** | Se reproduce cuando se bate el récord histórico de pista entre todos los carriles y carreras anteriores. | `default_record_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Récord de Vuelta de Carril General** | Se reproduce cuando se bate el récord histórico de pista en ese carril específico. | `default_record_lane_lap` | **Aviso de Voz** | `high` (Peso 3) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Entrada a Boxes** | Se reproduce cuando el coche entra en el carril de boxes o zona de repostaje. | `default_pit_in` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonidos de Nivel de Combustible** | Se reproduce cuando el nivel de combustible baja al umbral de advertencia, crítico o vacío. | `default_fuel_level` (Conjunto de Audio) | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Sonido de Salida en Falso** | Se reproduce cuando se detecta una salida en falso o infracción en la línea de salida. | `default_penalty` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |

### Eventos de Audio de Tema (Configurados en el Gestor de Temas)

| Ranura de Audio | Clave Predeterminada | Tipo de Sonido | Nivel de Prioridad | Relevancia y Pantalla |
| :--- | :--- | :--- | :---: | :--- |
| **Cuenta Atrás de Salida** | `audio.countdown` | **Aviso de Voz** / Conjunto de Audio | `urgent` | `countdown`: Suena en Pantalla Principal (si hay widget de cuenta atrás) y en todos los Puestos de Piloto. |
| **Semáforo Verde / SALIDA** | `audio.countdown.green` | **Aviso de Voz** / Tono Predefinido | `urgent` | `countdown`: Suena en Pantalla Principal (si hay widget de cuenta atrás) y en todos los Puestos de Piloto. |
| **Bandera Amarilla** | `audio.yellowflag` | **Aviso de Voz** (Sirena de Aviso) | `urgent` (Peso 4) | `flag`: Suena en Pantalla Principal (si hay widget de bandera) y en todos los Puestos de Piloto. |
| **Segundos Restantes** | `audio.seconds_left` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Suena en Pantalla Principal (si hay widget de temporizador) y en todos los Puestos de Piloto. |
| **Vueltas Restantes** | `audio.laps_left` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Suena en Pantalla Principal (si hay widget de temporizador) y en todos los Puestos de Piloto. |
| **Mitad de Manga** | `audio.seconds_left.halfway` | **Aviso de Voz** | `normal` (Peso 2) | `timer`: Suena en Pantalla Principal (si hay widget de temporizador) y en todos los Puestos de Piloto al alcanzar la mitad de la serie (por tiempo o cuando el líder completa la mitad de las vueltas). |
| **Manga Terminada** | `audio.heat_over` | **Aviso de Voz** | `urgent` (Peso 4) | `flag`: Suena en Pantalla Principal (si hay widget de bandera) y en todos los Puestos de Piloto. |
| **Carrera Terminada** | `audio.race_over` | **Aviso de Voz** | `urgent` (Peso 4) | `flag`: Suena en Pantalla Principal (si hay widget de bandera) y en todos los Puestos de Piloto. |
| **Tiempo Mínimo de Vuelta** | `audio.min_lap_time` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |
| **Vuelta de Drift** | `audio.drift_lap` | **Aviso de Voz** | `urgent` (Peso 4) | `lane-view`: Suena en Pantalla Principal y en el Puesto de Piloto de ese carril/piloto. |

---

## Dónde se Configura el Audio

| Ubicación | Qué se puede configurar |
| :--- | :--- |
| **Editor de Interfaz -> Ajustes de Audio** | Volumen maestro, tiempo límite de cola urgente, espaciado de avisos, voz TTS, velocidad, tono, volumen TTS y botón de prueba. |
| **Editor de Temas** | Sonidos globales: cuenta atrás, semáforo verde, bandera amarilla, tiempo restante, mitad de manga, fin de manga, fin de carrera, tiempo mínimo y vuelta de drift. |
| **Editor de Pilotos** | Sonidos específicos del piloto: Sonido de Vuelta, Sonido de Mejor Vuelta Personal, Sonido de Mejor Vuelta de Carrera, Sonido de Mejor Vuelta de Carril de Carrera, Sonido de Mejor Vuelta de Manga, Sonido de nuevo líder de carrera, Sonido de nuevo líder de manga, Sonido de Récord de Vuelta General, Sonido de Récord de Vuelta de Carril General, Sonido de Entrada a Boxes, Sonidos de Nivel de Combustible y Sonido de Salida en Falso. |
| **Gestor de Activos** | Subida y administración de archivos WAV, MP3 y OGG con previsualización inmediata. |
