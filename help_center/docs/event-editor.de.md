# Veranstaltungs-Editor

Mit dem **Veranstaltungs-Editor** können Sie Events mit mehreren Rennen entwerfen, konfigurieren und verwalten. In Race Coordinator AI verknüpft eine Veranstaltung mehrere einzelne Rennkonfigurationen zu einer aufeinanderfolgenden Abfolge – wie Qualifikationsläufe, die in Halbfinals und Meisterschaftsfinals übergehen, oder mehrstufige Turniere.

## Übersicht

Der Veranstaltungs-Editor bietet ein übersichtliches Zwei-Spalten-Layout zur Strukturierung mehrstufiger Wettbewerbe:

- **Veranstaltungsauswahl**: Dieses Dropdown-Menü in der oberen Leiste neben dem Seitentitel listet alle gespeicherten Veranstaltungen auf und ermöglicht das schnelle Umschalten sowie das Vor- und Zurückblättern.
- **Schreibgeschützter Modus**: Standardmäßig öffnet sich der Editor im schreibgeschützten Modus, um versehentliche Änderungen an Rennabfolgen zu verhindern.
- **Bearbeitungsmodus**: Durch Klicken auf das **Bearbeiten**-Symbol (Stift) in der Symbolleiste werden Eingabefelder und Rennabfolgen zur Bearbeitung freigeschaltet.
- **Kontinuierliche automatische Speicherung**: Änderungen an Name, Beschreibung, Vorrückzeit und Rennfolge werden automatisch im Hintergrund gespeichert.
- **Bearbeitungsmodus beenden**: Durch Klicken auf das **Fertig**-Symbol (Häkchen) wird die Veranstaltung validiert, gespeichert und der schreibgeschützte Modus wiederhergestellt.

---

## Symbolleisten-Aktionen

Die obere Symbolleiste stellt wichtige Bearbeitungs- und Verwaltungsaktionen bereit:

- **Zurück**: Kehrt zum vorherigen Bildschirm oder zum Renntag-Setup zurück.
- **Veranstaltung hinzufügen (+)**: Erstellt eine neue Veranstaltungsvorlage mit Standardwerten und wechselt in den Bearbeitungsmodus.
- **Veranstaltung duplizieren**: Klont die aktuelle Veranstaltung unter einem neuen, eindeutigen Namen.
- **Bearbeiten / Fertig**: Schaltet zwischen schreibgeschütztem Modus und Bearbeitungsmodus um (Tastaturkürzel: `Cmd/Ctrl+E`).
- **Veranstaltung löschen**: Löscht die ausgewählte Veranstaltung nach Bestätigung dauerhaft.
- **Rückgängig / Wiederholen**: Nimmt letzte Änderungen während der Sitzung zurück oder wendet sie erneut an.
- **Hilfe (?)**: Startet die interaktive Führung, die jeden Bereich des Editors erklärt.

---

## Veranstaltungskonfiguration {: #event-configuration }

Die linke Leiste konfiguriert allgemeine Metadaten und das automatische Übergangsverhalten zwischen den Etappen:

- **Name der Veranstaltung**: Ein eindeutiger Anzeigename, der die Veranstaltung anzeigt.
- **Beschreibung**: Ein optionales Textfeld für Notizen, Etappenregeln, Wertungsübersichten oder Turnierhinweise.
- **Automatische Vorrückzeit**: Die Wartezeit (in Sekunden) nach Abschluss eines Rennens, bevor automatisch zum nächsten Rennen der Abfolge gewechselt wird. Der Wert `0` deaktiviert den automatischen Wechsel.

---

## Rennfolge {: #race-sequence }

Die rechte Leiste verwaltet die geordnete Abfolge der Rennen des Events:

- **Rennen hinzufügen**: Klicken Sie im Bearbeitungsmodus auf **+ Rennen hinzufügen**, um gespeicherte Rennkonfigurationen auszuwählen und an die Abfolge anzuhängen.
- **Etappenreihenfolge**: Rennen laufen nacheinander von oben nach unten ab (Etappe #1, Etappe #2 usw.). Ziehen Sie im Bearbeitungsmodus am Ziehpunkt (<span class="material-icons">drag_indicator</span>), um Etappen neu anzuordnen.
- **Maximale Fahrerbegrenzung**: Jede Etappe kann die Teilnehmerzahl beschränken:
  - **Unbegrenzt (Alle Fahrer)**: Alle berechtigten Fahrer der vorherigen Etappe nehmen an diesem Rennen teil.
  - **Feste Begrenzung**: Geben Sie eine genaue Anzahl der bestplatzierten Fahrer an, die in diese Etappe aufsteigen (z. B. die besten 8 aus der Qualifikation ins Halbfinale). Klicken Sie auf **Unbegrenzt**, um zwischen numerischem Limit und allen Fahrern umzuschalten.
- **Rennen entfernen**: Klicken Sie im Bearbeitungsmodus auf das Papierkorb-Symbol (<span class="material-icons">delete</span>), um eine Etappe zu entfernen. Jede Veranstaltung muss mindestens ein Rennen enthalten.

