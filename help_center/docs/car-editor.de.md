# Slotcar-Editor

Der **Slotcar-Editor** führt eine Liste Ihrer Slotcars: was sie sind, in welcher Klasse sie fahren, ihr Maßstab und ihr Setup. Sie öffnen ihn im Race Day Setup über **Verwalten → Slotcars**.

!!! note
    Dies ist der erste Schritt der Unterstützung für Autos. Autos sind noch nicht mit Fahrern oder Rennen verknüpft, am Renntag ändert sich also nichts.

    Das Abzeichen **Vorschau** neben dem Titel bedeutet, dass diese Funktion noch in Arbeit ist. Sie kann sich noch stark ändern oder sogar wieder entfernt werden, während wir Feedback sammeln. Sagen Sie uns Ihre Meinung auf GitHub oder SlotForum.

## Übersicht

Der Slotcar-Editor funktioniert wie der Team-Editor:

- **Auto-Auswahl**: Die Liste neben dem Seitentitel zeigt alle Ihre Autos, nach Namen sortiert.
- **Nur-Lese-Modus**: Beim Öffnen sehen Sie das gewählte Auto mit gesperrten Feldern.
- **Bearbeitungsmodus**: Klicken Sie auf das **Bearbeiten**-Symbol (Stift), um die Felder freizugeben. Während der Bearbeitung ist die Auto-Auswahl gesperrt.
- **Automatisches Speichern**: Änderungen werden im Hintergrund gespeichert, während Sie sie vornehmen.
- **Änderungen verwerfen**: Verlassen Sie den Editor mit ungespeicherten oder ungültigen Änderungen, werden Sie um Bestätigung gebeten. Verwerfen setzt das Auto auf die zuletzt gespeicherte Version zurück.

## Aktionen der Symbolleiste

- **Zurück**: Zurück zum Race Day Setup.
- **Slotcar hinzufügen (+)**: Legt ein neues Auto an und öffnet es zur Bearbeitung.
- **Duplizieren**: Kopiert das gewählte Auto unter einem neuen, eindeutigen Namen. Praktisch für ein zweites Auto desselben Typs.
- **Bearbeiten / Fertig**: Wechselt zwischen Nur-Lese- und Bearbeitungsmodus.
- **Löschen**: Löscht das gewählte Auto nach Bestätigung.
- **Rückgängig / Wiederholen**: Geht durch Ihre letzten Änderungen zurück oder vor.
- **Hilfe (?)**: Startet die geführte Tour.

## Das Auto {: #car-profile }

Der linke Bereich enthält, was das Auto ist:

- **Bild**: Wählen Sie ein Bild oder laden Sie ein Foto des Autos hoch.
- **Name**: Pflichtfeld und eindeutig unter Ihren Autos (zum Beispiel „Porsche 911 RSR #92").
- **Marke / Hersteller**: Zum Beispiel Carrera, Scalextric, Slot.it oder NSR.
- **Klasse**: Die Klasse, in der das Auto fährt, etwa GT3 oder Classic. Beim Tippen werden die Klassen Ihrer anderen Autos vorgeschlagen, damit dieselbe Klasse immer gleich geschrieben wird.
- **Maßstab**: 1:24, 1:32, 1:43, 1:64 (HO), Andere oder Nicht festgelegt.

## Setup {: #car-setup }

Der rechte Bereich enthält, wie das Auto aufgebaut ist. Jedes Feld ist Freitext, damit Sie es so beschreiben können, wie Ihr Club es tut:

- **Motor**: Zum Beispiel „Slot.it V12/4 21.5k", oder Pancake / Inline bei HO.
- **Magnet**: Typ und Stärke, oder „keiner" für Rennen ohne Magnet.
- **Chassis**, **Übersetzung** (zum Beispiel 9/27) und **Reifen**.
- **Modifiziert**: Ankreuzen, wenn das Auto gegenüber dem Auslieferungszustand verändert ist; bei einem Serienauto leer lassen.
- **Notizen**: Alles Weitere zum Auto.
