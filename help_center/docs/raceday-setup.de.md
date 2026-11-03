# Renntag-Einrichtung

Die **Renntag-Einrichtung** ist die zentrale Startseite für alle Rennveranstaltungen in Race Coordinator AI. Hier konfigurieren Sie die teilnehmenden Fahrer, wählen Rennformate und Saisons aus, prüfen Heat-Rotationen und starten offizielle oder Demo-Rennen.

## Übersicht {: #overview }

Die Renntag-Einrichtung ist in zwei Hauptbereiche unterteilt:

- **Fahrer-Pool (Linker Bereich)**: Aufgeteilt in **Verfügbare Fahrer** (alle Fahrer Ihrer Datenbank, die startbereit sind) und **Teilnehmende Fahrer** (die für das Rennen ausgewählten Fahrer samt ihrer Startreihenfolge).
- **Rennkonfiguration & Steuerung (Rechter Bereich)**: Beinhaltet Schnellstart-Karten für zuletzt gefahrene Rennen, Renn- und Saison-Auswahl, Konfigurationsübersichten und Schaltflächen zum Starten offizieller oder simulierter Rennen.
- **Obere Menüleiste**: Bietet schnellen Zugriff auf alle Konfigurationsmanager, Renn-Dateiverwaltung und Systemeinstellungen.

## Verfügbare Fahrer {: #available-drivers }

Der Bereich **Verfügbare Fahrer** listet alle Fahrer und Teams Ihrer Datenbank auf, die für das Rennen verfügbar sind:

- **Fahrer hinzufügen**: Ziehen Sie einen Fahrer per Drag-and-Drop in die Liste der teilnehmenden Fahrer oder doppelklicken Sie auf seinen Namen, um ihn am Ende der Startliste hinzuzufügen.
- **Suche & Filter**: Nutzen Sie das Suchfeld, um Fahrer in Echtzeit nach Name oder Spitzname zu filtern. Verwenden Sie die Pfeiltasten und drücken Sie Enter zum Hinzufügen.
- **Label-Filter**: Filtern Sie Fahrer anhand farbiger Labels (z. B. "Pro", "Rookie").
- **Fahrer- & Team-Verwaltung**: Klicken Sie auf **Teams** oder **Fahrer**, um den jeweiligen Manager zu öffnen.
- **Kader-Validierung**: Fahrer im Rennkader können nicht doppelt hinzugefügt werden. Ist ein Team im Rennen, werden dessen Mitglieder aus der Liste der verfügbaren Fahrer ausgeblendet.

## Teilnehmende Fahrer {: #racing-drivers }

Der Bereich **Teilnehmende Fahrer** zeigt die für den aktuellen Lauf ausgewählten Starter an:

- **Startreihenfolge (Seeding)**: Die Reihenfolge in dieser Liste bestimmt die Startplätze der Heat-Rotation. Ziehen Sie Fahrer mit der Maus, um die Startplätze anzupassen.
- **Fahrer entfernen**: Doppelklicken Sie auf einen Fahrer oder ziehen Sie ihn aus der Liste, um ihn aus dem Rennen zu entfernen.
- **Aktionsleiste**:
    - **Gesamtkader anzeigen**: Öffnet die Übersicht aller Fahrer und Teams.
    - **Alle hinzufügen (+)**: Fügt alle verfügbaren Fahrer mit einem Klick hinzu.
    - **Alle entfernen (-)**: Leert die gesamte Rennliste.
    - **Mischen (Shuffle)**: Mischt die Startreihenfolge der Fahrer per Zufall.
- **Fahrer durchsuchen**: Suchen Sie in der aktiven Rennliste oder entfernen Sie Fahrer mit der Eingabetaste.

## Renn- und Saison-Auswahl {: #race-and-season-selection }

In diesem Bereich legen Sie fest, welcher Wettbewerb ausgetragen werden soll:

- **Renn-Auswahl**: Wählen Sie aus Einzelrennen oder Mehretappen-Events. Jedes Format definiert Rotationspläne, Wertungen (Runden oder Zeit) und Rennabschlüsse.
- **Rennsuche**: Durchsuchen Sie Rennen und Events schnell nach Namen.
- **Saison-Auswahl**: Verknüpfen Sie das Rennen mit einer Meisterschaftssaison, oder wählen Sie **Keine** für einen Einzellauf.
- **Konfigurations- & Stand-Übersicht**: Zeigt Details zu Wertungsmethode, Kraftstoffoptionen, Hands-Free-Modus, Strecke und Theme bzw. den Meisterschaftsstand.
- **Ausgewähltes Rennen bearbeiten**: Klicken Sie auf das Stift-Symbol, um das Rennen im Renn-Editor anzupassen.

## Schnellstart-Rennen {: #quick-start-races }

Über der Rennauswahl zeigen zwei große **Schnellstart-Karten** Ihre zuletzt gefahrenen Rennen an. Ein Klick wählt das Rennen sofort aus.

## Rennen starten {: #starting-a-race }

Sobald Starterfeld und Rennformat bereitstehen, nutzen Sie die Aktionsschaltflächen unten rechts:

- **Rennen starten**: Beginnt das offizielle Rennen mit aktiver Streckenhardware (z. B. Arduino, Phidget, Trakmate).
- **Demo-Rennen**: Startet ein simuliertes Rennen ohne Streckensensoren zum Testen von Audio und Bildschirmlayouts.
- **Rennen beitreten / beenden**: Bei laufendem Rennen können Sie der Sitzung wieder beitreten oder sie beenden.

## Menüleiste {: #menu-bar }

Die moderne Menüleiste bietet schnellen Zugriff auf alle Bereiche:

- **Datei**: Rennen laden, Rennverlauf ansehen, Einstellungen exportieren/importieren oder Programm beenden.
- **Konfiguration**: Manager für Fahrer, Teams, Strecken, Rennen, Events, Saisons, Layouts, Themes, Assets und Datenbanken.
- **Optionen**: Benutzeroberfläche, Server-Einstellungen, Sprache, Updates und Demo-Einstellungen.
- **Hilfe**: Protokollstufen anpassen, Über-Dialog und Hilfezentrum öffnen.
