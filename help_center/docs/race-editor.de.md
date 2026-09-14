# Rennen-Editor

## Kraftstoffeinstellungen

Race Coordinator AI unterstützt umfassende Kraftstoffsimulationen für analoge und digitale Strecken, einschließlich anpassbarer Tankkapazität, Startlevel, Boxenstoppverzögerungen, Auftankraten, Strafaktionen bei leerem Tank und Kraftstoffverbrauchsmodellen.

### Kraftstoffverbrauchsmodelle

Der Kraftstoffverbrauch pro Runde (analog) oder pro Sekunde (digital) kann durch mathematische Vorgaben oder ein interaktives benutzerdefiniertes Profil gesteuert werden:

- **Linear**: Der Kraftstoffverbrauch skaliert linear mit Geschwindigkeit oder Gasstellung.
- **Quadratisch**: Der Kraftstoffverbrauch steigt bei schnelleren Rundenzeiten oder höheren Gasstellungen quadratisch an.
- **Kubisch**: Der Kraftstoffverbrauch steigt bei extremen Geschwindigkeiten und Vollgas steil an.
- **Benutzerdefinierte Kurve**: Ermöglicht eine feine Steuerung der Verbrauchskurve durch Ziehen interaktiver Kontrollpunkte direkt auf dem Verbrauchsgraphen.

### Interaktives Bearbeiten der benutzerdefinierten Kurve

Wenn **Benutzerdefinierte Kurve** als Verbrauchstyp ausgewählt ist, erscheinen Kontrollgriffe direkt auf der SVG-Verbrauchskurve:

- **Initiale Kurvengenerierung**: Beim ersten Wechsel zu Benutzerdefinierte Kurve werden die anfänglichen 5 Punkte ohne sichtbaren Sprung direkt von der aktiven Vorgabe (Linear, Quadratisch oder Kubisch) abgetastet.
- **Interaktives Drag-and-Drop**: Klicken und ziehen Sie jeden Punkt nach oben, unten, links oder rechts, um die Kurve anzupassen.
- **Erzwungene Monotonie**:
    - *Analoger Kraftstoff*: Schnellere Rundenzeiten verbrauchen immer mehr oder gleich viel Kraftstoff wie langsamere Rundenzeiten (monoton fallende Kurve). Das Ziehen ist so eingeschränkt, dass Punkte nicht invertiert werden können.
    - *Digitaler Kraftstoff*: Höhere Gasstellungen verbrauchen immer mehr oder gleich viel Kraftstoff wie niedrigere Gasstellungen (monoton steigende Kurve).
- **Punkte hinzufügen**: Klicken Sie auf die Kurvenlinie, um an der exakt interpolierten Position einen neuen Kontrollpunkt einzufügen.
- **Punkte löschen**: Klicken Sie mit der rechten Maustaste auf einen Zwischenpunkt, um ihn zu entfernen (mindestens 2 Endpunkte bleiben erhalten).
- **Vorgaben-Schaltflächen**: Setzen Sie die benutzerdefinierte Kurve über die Schaltflächen oberhalb des Diagramms schnell auf Linear, Quadratisch oder Kubisch zurück.
- **Hintergrund-Persistenz**: Wenn Sie von der benutzerdefinierten Kurve zu einer Vorgabe und später zurück wechseln, bleiben Ihre benutzerdefinierten Punkte im Hintergrund erhalten.
- **Autoritative Server-Berechnungen**: Der Server berechnet den Kraftstoffverbrauch während der Rennen mit demselben stückweise linearen Interpolationsalgorithmus, sodass UI-Vorschau und Rennausführung absolut identisch sind.
