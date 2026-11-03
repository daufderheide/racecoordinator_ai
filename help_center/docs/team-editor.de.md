# Team-Editor

Mit dem **Team-Editor** können Sie Teamprofile erstellen, anzeigen und anpassen, Fahrer zuweisen, Teamlogos hochladen und Mannschaftsaufstellungen verwalten.

## Übersicht

Der Team-Editor integriert Teamauswahl und -bearbeitung in eine einheitliche Benutzeroberfläche:

- **Team-Auswahl**: Befindet sich in der oberen Kopfzeile neben dem Seitentitel. Dieses Dropdown-Menü listet alle vorhandenen Teams auf und ermöglicht einen schnellen Wechsel.
- **Schreibgeschützter Modus**: Standardmäßig zeigt der Editor Teamdetails und zugewiesene Fahrer schreibgeschützt an. Formularfelder, Logo-Auswahl und Fahrerzuweisungsaktionen sind gesperrt, um versehentliche Änderungen zu verhindern.
- **Bearbeitungsmodus**: Durch Klicken auf das **Bearbeiten**-Symbol (Stift) in der Symbolleiste werden Eingabefelder und Fahrerzuweisungssteuerungen entsperrt. Im Bearbeitungsmodus ist das Team-Auswahldropdown gesperrt, um ein versehentliches Verlassen ungespeicherter Änderungen zu verhindern.
- **Kontinuierliches automatisches Speichern**: Wenn Sie Änderungen vornehmen (Teamname bearbeiten, Logo auswählen oder Fahrer neu anordnen/zuweisen), werden Ihre Änderungen automatisch im Hintergrund auf dem Server gespeichert, ohne den Bearbeitungsmodus zu verlassen.
- **Bearbeitungsmodus beenden**: Durch Klicken auf das Symbol **Bearbeitung beenden** (Häkchen) werden Ihre Änderungen überprüft, dauerhaft gespeichert und der schreibgeschützte Modus wiederhergestellt.
- **Änderungen verwerfen**: Wenn Sie versuchen, den Editor mit ungespeicherten oder ungültigen Änderungen zu verlassen, fordert Sie der Dialog für ungespeicherte Änderungen zur Bestätigung auf. Durch das Verwerfen werden alle Änderungen auf die zuletzt gespeicherte Version zurückgesetzt.

## Aktionen der Symbolleiste

Die obere Symbolleiste bietet folgende Aktionen:

- **Zurück**: Kehrt zur vorherigen Ansicht oder zum Renntag-Setup zurück.
- **Team hinzufügen (+)**: Erstellt eine neue Teamvorlage und wechselt in den Bearbeitungsmodus.
- **Team duplizieren**: Erstellt eine Kopie des aktuell ausgewählten Teams mit einem eindeutigen Namen.
- **Bearbeiten / Bearbeitung beenden**: Schaltet zwischen schreibgeschütztem Modus und Bearbeitungsmodus um (Tastenkombination: Cmd/Ctrl+E).
- **Team löschen**: Löscht das ausgewählte Team nach Bestätigung.
- **Rückgängig / Wiederholen**: Nimmt kürzliche Änderungen während der Bearbeitungssitzung zurück oder wendet sie erneut an.
- **Hilfe (?)**: Startet die interaktive Einführung, die jeden Abschnitt des Editors hervorhebt.

## Team-Profil {: #team-profile }

Das linke Bedienfeld enthält die zentralen Identitäts- und Kategorisierungseinstellungen für das Team:

- **Teamname**: Der eindeutige Name des Teams, der in Ranglisten, Anzeigen und Übersichten dargestellt wird.
- **Teambild / Logo**: Wählen Sie ein vordefiniertes Symbol oder laden Sie ein benutzerdefiniertes Logo hoch.
- **Team-Labels**: Weisen Sie farbcodierte Labels (ähnlich wie GitHub-Issue-Labels) zu, um Teams in benutzerdefinierten Gruppen oder Kategorien (wie „GT3“, „Pro“ oder „Amateur“) zu organisieren. Teams können beliebig vielen Labels angehören. Klicken Sie im Bearbeitungsmodus auf **Labels verwalten**, um Labels zu erstellen, zu bearbeiten, umzufärben, zu löschen oder zuzuweisen. Auf dem Renntag-Setup-Bildschirm können Sie verfügbare Teams nach Label filtern, um Teamaufstellungen schnell zusammenzustellen.

## Teammitglieder & Aufstellung {: #team-members }

Der obere Bereich des rechten Bedienfelds zeigt die dem Team derzeit zugewiesenen Fahrer:

- **Kaderverwaltung**: Im Bearbeitungsmodus können Fahrer mithilfe des Ziehpunkts (`☰`) per Drag & Drop in ihrer Reihenfolge angepasst oder mit der Löschen-Schaltfläche (<span class="material-icons">delete</span>) aus dem Team entfernt werden.
- **Round-Robin-Rotation**: Wenn ein Team an einem Rennen teilnimmt, werden die zugewiesenen Fahrer automatisch im Round-Robin-Verfahren gemäß dieser Aufstellungsreihenfolge auf die einzelnen Durchgänge des Teams verteilt.
- **Fahrerwechsel während des Durchgangs**: Je nach Rennkonfiguration können Teamfahrer auch mitten im Durchgang gewechselt werden – entweder bei einem Boxenstopp oder an jedem beliebigen Punkt auf der Strecke.
- **Fahrer-Labels**: Jeder Fahrer zeigt seine zugewiesenen Labels als Abzeichen neben seinem Namen an, um Qualifikationen und Leistungsklassen schnell zu überprüfen.

## Verfügbare Fahrer {: #available-drivers }

Der untere Bereich des rechten Bedienfelds listet alle registrierten Fahrer auf, die diesem Team derzeit nicht zugewiesen sind:

- **Fahrer hinzufügen**: Klicken Sie im Bearbeitungsmodus auf eine Fahrerkarte oder das Plus-Symbol (<span class="material-icons">add</span>), um den Fahrer sofort der Teamaufstellung hinzuzufügen.
- **Mitgliedschaft in mehreren Teams**: Ein Fahrer kann in Ihrer Datenbank Mitglied mehrerer verschiedener Teams sein.
- **Konfliktvermeidung bei Rennen**: Obwohl ein Fahrer mehreren Teams angehören kann, darf kein Fahrer mehrfach an demselben Rennen teilnehmen – weder für zwei konkurrierende Teams noch gleichzeitig als Einzelfahrer und Teammitglied.
