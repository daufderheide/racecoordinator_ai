# Oberflächen-Editor

## Übersicht

Mit dem UI-Editor können Sie benutzerdefinierte Renntag-Layouts erstellen, Fahrerranglisten-Spalten anpassen, Soundeffekte und Grafiken des Designs ändern und modulare [Benutzerdefinierte Widgets](custom-widgets.md) laden.

## Layout- und Spaltenkonfiguration

- Ziehen Sie Widgets aus der Palette per Drag & Drop auf die Leinwand.
- Passen Sie Größe, Position und Ausrichtung der Widgets an Ihre Bildschirmauflösung an. Alle Widgets bleiben innerhalb des Leinwandbereichs begrenzt.
- **Widget-Inspektor-Steuerung**:
  - **Position & Größe**: Positionieren und dimensionieren Sie das ausgewählte Widget präzise über die Eingabefelder für **X**, **Y**, **Breite** und **Höhe**.
  - **Widget löschen**: Klicken Sie auf das Papierkorb-Symbol im Inspektor-Kopfbereich oder auf **Widget löschen** in der Seitenleiste.
- **Tastaturkurzbefehle**:
  - <kbd>Entf</kbd> oder <kbd>Rücktaste</kbd>: Entfernt das ausgewählte Widget aus dem Layout.
  - <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>: Verschiebt das ausgewählte Widget um 1px (oder 10px mit gedrückter <kbd>Umschalttaste</kbd>).
  - <kbd>Strg</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Letzte Aktion rückgängig machen.
  - <kbd>Strg</kbd>+<kbd>Y</kbd> / <kbd>Cmd</kbd>+<kbd>Umschalt</kbd>+<kbd>Z</kbd>: Wiederherstellen.
- Spaltenreihenfolge, Spaltensichtbarkeit, Anker und Breitenpräferenzen konfigurieren.

## Timer-Widget-Konfiguration

Das **Timer**-Widget zeigt die abgelaufene oder verbleibende Renn- bzw. Durchgangszeit in konfigurierbaren Darstellungsstilen an:

- **Anzeigeformat**:
  - **Dynamisch (1:23 / 45s)**: Kompakte Anzeige, die führende Nullen weglässt und unter einer Minute nur Sekunden anzeigt.
  - **Minuten & Sekunden (01:23 / 00:45)**: Feste zweistellige Minuten und Sekunden. Verhindert Textlängensprünge und plötzliche Schriftgrößenänderungen bei automatischer Skalierung.
  - **Minuten & Sekunden (1:23 / 0:45)**: Behält Minuten auch unter einer Minute bei (`0:45`), verwendet aber einstellige Minuten ab einer Minute (`1:23`).
  - **Vollständige Uhr (00:01:23 / 00:00:45)**: Feste achtstellige Digitaluhr (`HH:MM:SS`), ideal für Langstreckenrennen.
  - **Gesamtsekunden (83s / 45s)**: Zeigt die gesamte verbleibende oder abgelaufene Zeit in Sekunden an.
- **Sekundenbruchteile (Subsekunden)**:
  - **Unter Schwellenwert**: Zeigt Dezimalstellen (1 bis 3 Stellen) an, sobald die Zeit unter den konfigurierten Schwellenwert fällt (z. B. letzte 10 Sekunden).
  - **Immer**: Zeigt Sekundenbruchteile durchgehend während des gesamten Durchgangs an.
  - **Nie**: Beschränkt den Timer ausschließlich auf ganze Sekunden.
- **Live-Vorschau**: Der Inspektor bietet eine sofortige Vorschau darauf, wie die ausgewählten Einstellungen an verschiedenen Zeitpunkten formatiert werden (`> 1 hr`, `> 1 min`, `< 1 min` und `< 10s`).
