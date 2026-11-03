# Saison-Editor

Mit dem **Saison-Editor** können Sie Meisterschaftssaisons erstellen, verwalten und überprüfen. Eine Saison verfolgt Platzierungen über mehrere abgeschlossene Rennen und Events hinweg, sammelt Meisterschaftspunkte für Fahrer, wendet Streichrennen-Regeln an und berechnet Tabellen in Echtzeit.

## Übersicht

Der Saison-Editor bietet eine umfassende Benutzeroberfläche zur Saisonverwaltung:

- **Saison-Auswahl**: Dieses Dropdown-Menü in der oberen Leiste listet alle gespeicherten Meisterschaftssaisons auf und ermöglicht das Umschalten sowie das Vor- und Zurückblättern.
- **Schreibgeschützter Modus**: Standardmäßig öffnet sich der Editor im schreibgeschützten Modus, um versehentliche Änderungen an Tabellen und Rennen zu verhindern.
- **Bearbeitungsmodus**: Durch Klicken auf das **Bearbeiten**-Symbol (Stift) in der Symbolleiste werden Eingabefelder und Funktionen zum Hinzufügen oder Entfernen von Rennen freigeschaltet.
- **Kontinuierliche automatische Speicherung**: Änderungen an Namen, Streichrennen und Rennzuordnungen werden automatisch im Hintergrund gespeichert.
- **Bearbeitungsmodus beenden**: Durch Klicken auf das **Fertig**-Symbol (Häkchen) wird die Saison validiert, gespeichert und der schreibgeschützte Modus wiederhergestellt.

---

## Symbolleisten-Aktionen

Die obere Symbolleiste stellt wichtige Bearbeitungs- und Verwaltungsaktionen bereit:

- **Zurück**: Kehrt zum vorherigen Bildschirm oder zum Renntag-Setup zurück.
- **Saison hinzufügen (+)**: Erstellt eine neue Saisonvorlage mit Standardwerten und wechselt in den Bearbeitungsmodus.
- **Saison duplizieren**: Klont die aktuelle Saison unter einem neuen, eindeutigen Namen.
- **Bearbeiten / Fertig**: Schaltet zwischen schreibgeschütztem Modus und Bearbeitungsmodus um (Tastaturkürzel: `Cmd/Ctrl+E`).
- **Saison löschen**: Löscht die ausgewählte Meisterschaftssaison nach Bestätigung dauerhaft.
- **Rückgängig / Wiederholen**: Nimmt letzte Änderungen während der Sitzung zurück oder wendet sie erneut an.
- **Hilfe (?)**: Startet die interaktive Führung, die jeden Bereich des Editors erklärt.

---

## Saisonkonfiguration {: #season-configuration }

Die linke Leiste konfiguriert allgemeine Meisterschaftsregeln und Wertungsparameter:

- **Saisonname**: Ein eindeutiger Meisterschaftsname, der in Tabellen, Berichten und im Renntag-Setup angezeigt wird.
- **Streichrennen (Drops)**: Die Anzahl der schlechtesten Rennen, die von der Gesamtpunktzahl jedes Fahrers gestrichen werden, um verpasste Läufe oder schlechte Ergebnisse auszugleichen.

---

## Saisoninfo & Rennverwaltung {: #season-info-bar }

Die Leiste über dem rechten Bereich zeigt Statuskennzahlen und Steuerungen für Rennen:

- **Gefahrene Rennen**: Zeigt die Gesamtzahl der abgeschlossenen Rennen und Events an, die in der Saison enthalten sind.
- **Demo-Rennen-Abzeichen**: Weist darauf hin, ob Trainings- oder Demonstrationsrennen in der Saison aufgezeichnet wurden.
- **Rennen hinzufügen**: Klicken Sie im Bearbeitungsmodus auf **+ Rennen hinzufügen**, um beendete Rennen aus Ihrer Rennhistorie zur Saison hinzuzufügen.

---

## Saisonwertung {: #season-standings }

Der Wertungsbereich berechnet und zeigt die Meisterschaftstabelle in Echtzeit an:

- **Platzierung & Podium**: Fahrer werden nach Gesamtpunkten sortiert; Gold-, Silber- und Bronzemedaillen heben die drei Erstplatzierten hervor.
- **Fahrername**: Vollständiger Name jedes teilnehmenden Fahrers.
- **Netto-Punkte**: Die maßgebliche Meisterschaftspunktzahl (Brutto-Punkte abzüglich Streichrennen).
- **Gestrichene Punkte**: Die Summe der gemäß Streichrennen-Einstellung abgezogenen Punkte.
- **Brutto-Punkte**: Die gesamten erzielten Rohpunkte aller bestrittenen Rennen.
- **Gefahrene Rennen**: Die Anzahl der Rennen, an denen der jeweilige Fahrer teilgenommen hat.

---

## Rennübersichten {: #race-breakdowns }

Der Bereich für Rennübersichten bietet detaillierte Karten für jedes in der Saison enthaltene Rennen:

- **Aufklappbare Rennkarten**: Klicken Sie auf eine Karte, um die Ergebnisse, Platzierungen und Bonuspunkte pro Fahrer einzusehen.
- **Rennen entfernen**: Klicken Sie im Bearbeitungsmodus auf das Papierkorb-Symbol (<span class="material-icons">delete</span>), um ein Rennen aus der Saison zu entfernen.

