# Theme-Editor

Der **Theme-Editor** bietet eine dedizierte Benutzeroberfläche zur Verwaltung visueller Flaggen, Countdown-Lichtsequenzen, Kraftstoffanzeigen, Rennleitungs-Audiosignale und Fahrer-Audio-Überschreibungen für Race Coordinator AI. Er teilt dieselbe standardisierte Symbolleiste, Objektauswahl, den Schreibschutz und den Bearbeitungsmodus wie die Fahrer-, Strecken-, Renn- und Layout-Editoren.

---

## Übersicht & Navigation

Der Theme-Editor ist von mehreren Stellen aus zugänglich:

- **Renntag-Setup-Symbolleiste**: Wählen Sie **Konfig > Theme-Editor** (`/theme-editor` oder `/theme-manager`).
- **Renntag-Optionen-Menü**: Klicken Sie auf das Zahnradmenü in der Renntag-Symbolleiste und wählen Sie **Theme-Editor** (`/theme-editor`). Das Navigieren während eines laufenden Rennens behält den Rennstatus bei.
- **UI-Editor**: Klicken Sie im UI-Editor (`/ui-editor`) im Bereich Themes auf **Theme-Editor öffnen**.

### Schreibschutz und Bearbeitungsmodus-Lebenszyklus

- **Schreibgeschützter Modus (Standard)**: Theme-Eigenschaften, Bild-Slots, Audioeinstellungen und Fahrer-Audio-Überschreibungen sind vor versehentlichen Änderungen geschützt.
- **Bearbeitungsmodus**: Durch Klicken auf das **Bearbeiten**-Symbol (Stift) wird das Theme zur Bearbeitung freigeschaltet.
- **Automatisches Speichern & Validierung**: Beim Verlassen des Bearbeitungsmodus werden Änderungen validiert (z. B. eindeutiger Name) und gespeichert.
- **Änderungen verwerfen**: Beim Verlassen mit ungespeicherten Änderungen erscheint der Bestätigungsdialog.
- **Rückgängig / Wiederholen**: Vollständig integriert mit Standard-Tastenkombinationen (<kbd>Strg</kbd>+<kbd>Z</kbd> und <kbd>Strg</kbd>+<kbd>Y</kbd>).

---

## Symbolleisten-Aktionen

- **Theme-Auswahl**: Dropdown-Menü zur Auswahl eines beliebigen Themes.
- **Bearbeiten / Fertig**: Schaltet zwischen Lese- und Bearbeitungsmodus um.
- **Alle erweitern / minimieren**: Klappt alle Abschnitte gleichzeitig auf oder zu.
- **Theme hinzufügen**: Erstellt eine neue Vorlage basierend auf dem Standard-Theme.
- **Theme kopieren**: Dupliziert das ausgewählte Theme mit einem eindeutigen Namen.
- **Theme löschen**: Löscht das ausgewählte benutzerdefinierte Theme nach Bestätigung.
- **Hilfetour**: Startet eine interaktive geführte Tour.

