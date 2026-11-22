# Slotcar-Editor

Der **Slotcar-Editor** führt eine Liste Ihrer Slotcars: was sie sind, in welcher Klasse sie fahren, ihr Maßstab und ihr Setup. Sie öffnen ihn im Race Day Setup über **Verwalten → Slotcars**.

!!! note
    Wählen Sie in Race Day Setup für jeden Fahrer ein Auto und tauschen Sie Autos zwischen den Läufen. Jeder Lauf speichert das Auto so, wie es auf der Strecke war, sodass die Ergebnisse auch nach einer Änderung das richtige Auto behalten.

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

## Eigene Felder {: #car-custom-fields }

Unter dem Setup können Sie eigene Felder hinzufügen, für alles, was Ihr Club erfasst (zum Beispiel Gewicht, Ritzel oder Leitkiel). Klicken Sie im Bearbeitungsmodus auf **Felder verwalten**:

- **Neues Feld**: Name vergeben und Typ wählen: **Text**, **Zahl**, **Ja / nein** oder **Auswahl aus einer Liste** (eine Auswahl pro Zeile).
- **Bearbeiten**: Feld umbenennen oder Auswahlmöglichkeiten ändern. Der Typ kann nach dem Hinzufügen nicht mehr geändert werden.
- **Nach oben / unten**: ändert die Reihenfolge der Felder.
- **Löschen**: entfernt das Feld und seinen Wert bei jedem Auto, nach Bestätigung.

Jedes Auto bekommt dieselben Felder und behält seine eigenen Werte. Ein leer gelassenes Feld bleibt leer.

## Slotcars im Rennen {: #car-in-race }

- **Race Day Setup**: Klicken Sie in der Liste der startenden Fahrer auf das Auto-Symbol einer Zeile, um ein Slotcar zu wählen. Ein Team wählt **Ein Auto für das Team** oder **Ein Auto pro Fahrer**. RC AI merkt sich Ihre Auswahl für das nächste Rennen.
- **Tauschen zwischen den Läufen**: Öffnen Sie am Renntag **Rennleiter → Slotcars…**. Dort steht der nächste Lauf Spur für Spur; wählen Sie ein anderes Auto, und es wird sofort getauscht. Während ein Lauf läuft, sind die Listen gesperrt.
- **Läufe ändern**: Das Auto-Symbol bei einem Fahrer ändert sein Auto für alle Läufe, die noch nicht gefahren sind.
- **Ergebnisse**: Jeder Lauf behält eine Kopie des Autos, wie es gefahren ist. Spätere Änderungen oder das Löschen eines Autos ändern alte Ergebnisse nicht.

Das Auto-Symbol und der Menüpunkt Slotcars… erscheinen erst, wenn es Slotcars in der Datenbank gibt.
