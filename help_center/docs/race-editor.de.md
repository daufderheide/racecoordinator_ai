# Rennen-Editor

Der **Rennen-Editor** ermöglicht es Ihnen, Rennkonfigurationen zu erstellen, anzupassen und zu verwalten. Hier richten Sie Wertungsregeln, Laufläufe, Kraftstoffsimulationen und Rennoptionen ein.

---

## Übersicht & Automatisches Speichern

Der Rennen-Editor bietet eine einheitliche Oberfläche zur Auswahl, Anzeige, Konfiguration und zum Testen Ihrer Rennformate:

- **Rennenauswahl**: In der oberen Leiste neben dem Seitentitel listet dieses Dropdown-Menü alle konfigurierten Rennen auf und ermöglicht ein schnelles Wechseln.
- **Schreibgeschützter Modus**: Standardmäßig zeigt der Editor Renneigenschaften, Wertungsregeln und Einstellungen im schreibgeschützten Modus an. Formularfelder sind gesperrt, während Akkordeonbereiche und Laufvorschauen interaktiv bleiben.
- **Bearbeitungsmodus**: Ein Klick auf das **Bearbeiten**-Symbol (Stift) schaltet alle Eingabesteuerelemente frei. Während der Bearbeitung ist die Rennenauswahl gesperrt.
- **Kontinuierliche automatische Speicherung**: Alle Änderungen werden automatisch im Hintergrund auf dem Server gespeichert, ohne den Bearbeitungsmodus zu verlassen.
- **Bearbeitungsmodus beenden**: Ein Klick auf das **Fertig**-Symbol (Häkchen) validiert alle Änderungen und kehrt in den schreibgeschützten Modus zurück.
- **Änderungen verwerfen**: Ein Klick auf Verwerfen stellt die zuletzt gespeicherte Version wieder her und verlässt den Bearbeitungsmodus.

Der Arbeitsbereich ist in zwei synchronisierte Bereiche unterteilt:

- **Linkes Bedienfeld (Rennenkonfiguration)**: Allgemeine Renneigenschaften, Format, Wertungsmethoden, Rotationstyp, Gruppeneinstellungen und analoge/digitale Kraftstoffsimulation.
- **Rechtes Bedienfeld (Live-Laufvorschau)**: Generiert dynamisch die vollständige Liste der Läufe basierend auf dem aktiven Rotationstyp und der Fahreranzahl.

---

---

## Renneinrichtung {: #race-setup }

Das linke Bedienfeld konfiguriert das Kernformat und die Streckenzuordnung für Ihr Rennen:

- **Rennenname**: Eindeutiger Name zur Identifizierung des Rennformats am Renntag und in Statistiken.
- **Strecke**: Die diesem Rennen zugewiesene physische Strecke. Die ausgewählte Strecke bestimmt, ob analoge oder digitale Kraftstoffsimulation verfügbar ist.
- **Design**: Visuelles UI-Design für die Anzeige am Renntag.
- **Laufrotationsformat**: Wählen Sie zwischen Standard-Rotationen (**Round Robin**, **Leiter**, **Turnier**) oder benutzerdefinierten Sequenzen.
- **Laufdurchläufe**: Gibt an, wie oft jeder Fahrer die komplette Laufrotation durchläuft.
- **Umgekehrte Läufe**: Dreht die Laufreihenfolge um, sodass Fahrer Läufe in umgekehrter Reihenfolge fahren.
- **Fahreranzahl-Vorschau**: Zeigt eine dynamische Vorschau der generierten Laufliste basierend auf der eingestellten Fahreranzahl.

Das rechte Bedienfeld zeigt die **Live-Laufvorschau**, die die vollständige Liste der Läufe, Fahrerrotationen und Spurzuweisungen in Echtzeit dynamisch generiert, während Sie Einstellungen anpassen.

---

## Navigations-Tabs {: #navigation-tabs }

Die Tableiste am oberen Rand des Rennen-Editors bietet Ein-Klick-Verknüpfungen, um direkt zu jedem Konfigurationsbereich zu springen:

- **Allgemein**: Designs, Audio-Ansagen, Rundenzeitfilter und UI-Einstellungen.
- **Läufe**: Zeiten für automatischen Start und Weiterlauf, Laufdurchläufe und umgekehrte Laufreihenfolge.
- **Wertung**: Lauf- und Gesamtwertungsmethoden, Zielbedingungen, Tiebreaker und Streichergebnisse.
- **Gruppen**: Gruppentrennung der Fahrer, unabhängige Laufpläne und Ranglistenaufstieg.
- **Startmethode**: Start- und Neustartzeiten, Streckenstartpositionen, fliegende Starts und Frühstartstrafen.
- **Team-Optionen**: Langstreckenrennen, Fahrerwechsel und Stint-Limits.
- **Analoger Kraftstoff**: Rundenbasierter Kraftstoffverbrauch, Tankkapazität und Nachtankraten.
- **Digitaler Kraftstoff**: Kontinuierlicher verbrauchsgesteuerter Kraftstoffverbrauch und benutzerdefinierte Kurven.
- **Saisonpunkte**: Meisterschafts-Punktetabelle, Laufpunkte und Bonuspunkte.

Durch Klicken auf einen Tab wird der entsprechende Akkordeonbereich sofort aufgerufen und erweitert.

---

## Allgemeine Einstellungen {: #general-settings }

Der Bereich Allgemeine Einstellungen steuert Präsentation, Zeitfilter und das Rennleiterverhalten:

- **Designauswahl**: Zuweisung benutzerdefinierter Farbschemata und Anzeigelayouts für den Renntag.
- **Audio-Ansagen**: Automatische Sprachansagen für Führungswechsel, schnellste Runden, Boxenstopps und Rennabschlüsse.
- **Minimale Rundenzeit (s)**: Kürzeste zulässige Rundenzeit zur Filterung von Sensorstörungen oder Fehlmessungen.
- **Driftzeit (s)**: Sensor-Erfassungsfenster zur Bewältigung von schleudernden Fahrzeugen auf der Ziellinie.
- **Runden mit Drift von Rekorden ausschließen**: Wenn aktiviert, werden Runden mit Drift nicht für Renn-, Lauf- oder Fahrerrekorde gewertet.
- **Gelbe-Flagge-Regeln**: Automatische oder manuelle Rennpausen bei Gelbphase mit Bahnstromabschaltung.
- **Benutzerdefinierte UI-Optionen**: Auswahl spezialisierter Bestenlisten und Telemetrie-Widgets.

### Driften & Drift-Timing-Mechanik {: #drifting-and-drift-timing }

Im Slotcar-Rennsport werden die Fahrzeuge durch elektrische Spannung angetrieben, die über in die Bahn eingelassene Stromleiter (Stromschienen oder Litzen) bereitgestellt wird. Wenn der Bahnstrom unterbrochen wird – etwa bei einer Gelbphase (Pause), am Ende eines Laufs (**Heat Over**) oder bei Rennende (**Race Over**) –, kommen die Fahrzeuge nicht schlagartig bei Geschwindigkeit null zum Stehen. Aufgrund von Trägheit, Masse, Motormagneten und Bahnreibung rollen fahrende Autos nach dem Abschalten des Stroms noch eine kurze Strecke aus.

In Race Coordinator AI und im Slotcar-Sport wird dieses unmotorisierte Ausrollen als **„Driften“** bezeichnet.

!!! note "Driften im Slotcar-Kontext"
    Im Slotcar-Sport bezeichnet „Driften“ **nicht** das seitliche Ausbrechen des Hecks, Powersliden durch Kurven oder Show-Fahrfiguren. Es bezeichnet ausschließlich das vorwärtsgerichtete Ausrollen eines Fahrzeugs durch seinen Restschwung nach dem Abschalten des Bahnstroms.

Nähert sich ein Fahrzeug der Start-/Ziellinie oder Lichtschranke genau in dem Moment, in dem der Strom abgeschaltet wird, kann sein Schwung es noch über den Sensor tragen, bevor es vollständig anhält. Race Coordinator AI bietet hochpräzise Hardware-Zeitnahme und Regeloptionen, um solche Situationen absolut fair und manipulationssicher zu handhaben.

#### Der entscheidende Unterschied: „Drift-Runde“ vs. „Runde mit Drift-Beteiligung“

In Race Coordinator AI gibt es eine grundlegende Unterscheidung zwischen einer **Drift-Runde** und einer **Runde mit Drift-Beteiligung**. Das Verständnis dieses Unterschieds ist für Rennleiter bei der Konfiguration der Zeitregeln und der Auswertung der Telemetrie unverzichtbar:

##### 1. Eine „Drift-Runde“ (`isDrift = true`)
Eine **Drift-Runde** ist eine Runde, die physisch registriert und gezählt wird, wenn ein Fahrzeug die Start-/Ziellinie oder den Sensor überquert, **WÄHREND der Bahnstrom ABGESCHALTET ist** (konkret während des Zustands `Paused` / Gelbe Flagge, `HeatOver` oder `RaceOver`), sofern dies innerhalb des konfigurierten **Driftzeit**-Fensters geschieht.

- **Physisches Ereignis**: Das Fahrzeug überquert die Ziellinie im Ausrollen ohne Bahnstrom.
- **Visuelle Kennzeichnung**: Die Bahnspalte auf dem Hauptbildschirm des Renntags sowie der Rundeninspektionsdialog zeigen ein auffälliges **`DRIFT`**-Symbol neben der Rundenzeit an.
- **Audio-Ansage**: Löst den konfigurierten **Drift-Runden-Sound** (`driftLapAudio`) des Fahrers als Sprachansage mit dringender Priorität (`urgent`) aus (z. B. *"Drift lap for {driver.nickname}"*).
- **Rundengutschrift**: Die Runde wird dem Rundenguthaben des Fahrers für den Lauf und die Gesamtwertung gutgeschrieben. Die erfasste Rundenzeit kombiniert die vor der Unterbrechung aufgelaufene Zeit mit dem Bruchteil des Ausrollens über den Sensor.
- **Statistik**: Erhöht den Drift-Rundenzähler der Rennstatistik (`driftLapCount`). Automatisch berechnete Teilsegmente werden zurückgesetzt.

##### 2. Eine „Runde mit Drift-Beteiligung“ (`driftInvolved = true`, aber `isDrift = false`)
Eine **Runde mit Drift-Beteiligung** ist eine Runde, die unter **normalen GRÜNE-FLAGGE-Bedingungen unter Bahnstrom** beendet und registriert wurde, deren Gesamtdauer jedoch eine Unterbrechung oder Übertragszeit infolge einer Rennpause oder eines Laufwechsels enthält.

- **Physisches Ereignis**: Das Fahrzeug überquert die Start-/Ziellinie mit **eingeschaltetem** Bahnstrom im regulären Renntempo. Im Verlauf dieser einzelnen Runde wurde der Bahnstrom jedoch zuvor unterbrochen und wieder zugeschaltet.
- **Typische Szenarien**:
    - **Pause bei Gelbphase & Wiederaufnahme während einer Runde**: Ein Fahrer hat 3,2 Sekunden einer 5,0-Sekunden-Runde absolviert, als Gelb ausgerufen wird. Der Strom schaltet ab und das Auto rollt auf der Gegengeraden aus (es überquert den Sensor *nicht*, daher ist es keine Drift-Runde). Der Hardware-Timer stoppt und die aufgelaufenen 3,2 Sekunden werden im Zwischenspeicher des Fahrers gesichert sowie intern als Drift-Zeit markiert (`markDriftTime()`). Bei Freigabe unter Grün starten die Hardware-Timer bei null; das Auto legt die restlichen 1,8 Sekunden unter Strom zurück und überquert die Ziellinie. Die Rundenzeit beträgt 5,0 Sekunden ($3{,}2\,\text{s} + 1{,}8\,\text{s}$). Da das Auto den Sensor unter Strom überquert hat, ist es **keine Drift-Runde** (kein `DRIFT`-Symbol, regulärer Rundensound), aber eine **Runde mit Drift-Beteiligung**, da ihre Dauer durch eine Bahnunterbrechung geteilt wurde.
    - **Versetztes Fahren über mehrere Läufe (`Start at Current`)**: Bei Rennformaten mit fortlaufender Distanz (`start_at_current = true`), bei denen Fahrzeuge am Laufende an Ort und Stelle stehen bleiben und im nächsten Lauf von genau dieser Position weiterfahren, wird die unvollendete Teilrundenzeit des Vorlaufs übertragen. Beim Start des nächsten Laufs wird dieser Übertrag in die Vorlaufzeit geladen. Beendet der Fahrer seine erste Runde des neuen Laufs unter Strom, enthält diese Runde die Zeit aus dem Vorlauf: Es ist eine **Runde mit Drift-Beteiligung**.

---

#### Die beiden Rennkonfigurations-Optionen

Race Coordinator AI bietet im Bereich **Allgemeine Einstellungen** zwei spezielle Optionen zur Steuerung von Driftzeit und Rekordwertung:

```
+---------------------------------------------------------------------------------+
| Minimale Rundenzeit (s): [ 2.0 ]    Driftzeit (s): [ 0.5 ]                      |
|                                                                                 |
| [ ] Trainingsmodus   [X] Runden mit Drift von Rekorden ausschließen             |
+---------------------------------------------------------------------------------+
```

##### Option 1: Driftzeit (`drift_time`)
- **Einstellungstyp**: Dezimalzahl in Sekunden (z. B. `0.0`, `0.5`, `1.0`, `2.0`).
- **Standardwert**: `0.5` Sekunden.
- **Funktion**: Bestimmt das Zeitfenster unmittelbar nach einer Stromabschaltung (Gelbphase, Laufende, Rennende), in dem das Überfahren des Sensors als gültige Ausrollrunde gewertet wird.

!!! warning "Bahnen ohne Relais zur Stromsteuerung"
    Verfügt Ihre Bahn über keine Hardware-Relais zur Steuerung des Bahnstroms, bleibt die Bahn auch bei Pausen, Laufenden und Rennenden durchgehend bestromt. Auf solchen Bahnen **sollte die Driftzeit auf `0` (0.0s) gesetzt werden (keine Drift-Runden)**. Andernfalls könnten Fahrer, die während einer Pause mit gedrücktem Regler weiterfahren, fälschlicherweise Drift-Runden gutgeschrieben bekommen.

Bei Stromunterbrechung erfasst das System den exakten Millisekunden-Zeitstempel. Wird während der Abschaltung ein Sensorimpuls empfangen, gilt:

$$\Delta t = \text{Impulszeit} - \text{Stoppzeit}$$

$$\begin{aligned}
\text{Wenn } \Delta t \le \text{Driftzeit} &\implies \textbf{Als Drift-Runde gewertet } (\text{isDrift} = \text{true}) \\
\text{Wenn } \Delta t > \text{Driftzeit} &\implies \textbf{Verworfen und ignoriert}
\end{aligned}$$

- **Warum eine Driftzeit-Begrenzung unverzichtbar ist**:
    - **Fairness für ausrollende Autos**: Ein Fahrzeug, das sich im Moment der Stromabschaltung unmittelbar vor der Ziellinie befand, hat die Runde verdient, wenn sein Restschwung es Sekundenbruchteile später darüberträgt.
    - **Schutz vor Fehlwertungen durch Streckenposten**: Ohne Begrenzung könnte ein Streckenposten, der ein verunfalltes Auto einsetzt, das Fahrzeug versehentlich über die Lichtschranke schieben und so unberechtigt Runden gutschreiben.
- **Empfehlungen für die Praxis**:
    - **Bahnen ohne Stromrelais**: Verfügt die Bahn über keine Relais zur Stromabschaltung, **sollte die Driftzeit auf `0` (0.0s) gesetzt werden** (keine Drift-Runden). Da der Strom bei Pausen nie abfällt, können Fahrzeuge weiterfahren; ein Driftzeitfenster größer null würde diese regulär motorisierten Runden irrtümlich als Drift-Runden werten.
    - **Magnet-Fahrzeuge (HO, 1/32 mit Magnet)**: Durch die starke Magnetwirkung bremsen Fahrzeuge beim Stromabschalten extrem schnell ab. Empfohlen: `0.3` bis `0.8` Sekunden.
    - **Fahrzeuge ohne Magnet / Schwerere Klassen (1/24, Holzbahnen)**: Geringe Bremswirkung und hohe Trägheit führen zu langen Ausrollwegen. Empfohlen: `1.0` bis `2.5` Sekunden.
    - **Deaktiviert (`0.0s`)**: Schaltet die Erkennung von Drift-Runden vollständig ab. Jeder Impuls bei stromloser Bahn wird ignoriert.

##### Option 2: Runden mit Drift von Rekorden ausschließen (`adjust_drift_laps`)
- **Einstellungstyp**: Kontrollkästchen (`true` / `false`).
- **Standardwert**: Deaktiviert (`false`).
- **Funktion**: Legt fest, ob Runden, bei denen in irgendeiner Weise Drift im Spiel war, für persönliche, Lauf-, Renn- oder Bahnrekorde zählen dürfen.

Beim Abschluss einer Runde prüft das System:

$$\text{driftInvolved} = \text{isDrift} \lor \text{hasDriftTime}$$

$$\text{countTowardsRecords} = \neg(\text{adjust\_drift\_laps} \land \text{driftInvolved})$$

- **Wenn aktiviert (`true`)**:
    - Jede Runde mit Drift-Beteiligung – sei es eine **Drift-Runde** (`isDrift = true`) ODER eine **Runde mit Drift-Beteiligung** (Pause oder Laufübertrag) – wird für die Rekordwertung gesperrt (`countTowardsRecords = false`).
    - Die Runde wird ausgeschlossen von:
        1. **Persönlicher Bestzeit des Fahrers (`bestLapTime`)**: Die persönliche Bestzeit bleibt unangetastet.
        2. **Lauf-Bestzeit**: Zählt nicht als schnellste Runde des aktuellen Laufs.
        3. **Renn-Bestzeit**: Zählt nicht als schnellste Runde des gesamten Rennens.
        4. **Bahn- und Spurrekorden**: Wird nicht in ewige Rekordlisten aufgenommen.
        5. **Rekord-Audioansagen**: Jubel- und Rekordansagen werden unterdrückt.
    - **Wichtiger Grundsatz**: Die Runde **zählt zu 100 % für das Rundenkonto des Fahrers und die Platzierung in der Wertung**. Lediglich der Rekordstatus wird verwehrt.
- **Wenn deaktiviert (`false`)**:
    - Jede Runde, die den Mindestrundenzeit-Filter passiert, kann Rekorde aufstellen, selbst wenn sie durch eine Gelbphase getrennt war oder ohne Strom im Ausrollen erzielt wurde.
- **Warum Rennserien diese Option aktivieren**:
    - Unterbrochene Runden verändern die thermischen und fahrdynamischen Gegebenheiten (abkühlende Reifen und Motoren, Neustarts aus dem Stand).
    - Auch das langsame Ausrollen über die Linie entspricht keinem regulären Renntempo.
    - In Meisterschaften sollen Rundenrekorde ausschließlich unterbrechungsfreie, fliegende Runden bei vollem Tempo repräsentieren.

---

#### Übersichtstabelle

| Merkmal / Verhalten | Reguläre Runde unter Grün | Drift-Runde (`isDrift = true`) | Runde mit Drift-Beteiligung (`hasDriftTime = true`, `isDrift = false`) |
| :--- | :--- | :--- | :--- |
| **Bahnstrom am Sensor** | **EIN** (Grüne Flagge) | **AUS** (Gelbphase, Laufende, Rennende) | **EIN** (Grüne Flagge) |
| **Sensorauslösung** | Unter Strom im Renntempo | Im Ausrollen innerhalb der `drift_time` | Unter Strom nach Pause oder Laufübertrag |
| **Daten-Flag `isDrift`** | `false` | `true` | `false` |
| **Interner Status `driftInvolved`** | `false` | `true` | `true` |
| **Anzeige am Renntag** | Keine Sonderanzeige | **`DRIFT`**-Badge in der Bahnspalte | Keine Sonderanzeige |
| **Audio-Rückmeldung** | Regulärer Runden-/Bestzeitsound | **Drift-Runden-Sound** (`driftLapAudio`, dringend) | Regulärer Rundensound (kein Drift-Sound) |
| **Zählt für Rundenzahl & Wertung** | **Ja** (volle Wertung) | **Ja** (volle Wertung) | **Ja** (volle Wertung) |
| **Zählt für Rekorde (`adjust_drift_laps` = AUS)** | **Ja** | **Ja** (falls schneller) | **Ja** (falls schneller) |
| **Zählt für Rekorde (`adjust_drift_laps` = EIN)** | **Ja** | **Ausgeschlossen / Nicht gewertet** | **Ausgeschlossen / Nicht gewertet** |

---

## Lauf-Optionen {: #heat-options }

Der Bereich Lauf-Optionen konfiguriert automatisierte Zeitsteuerungen, Durchläufe und die Reihenfolge:

- **Automatische Weiterschaltzeit (s)**: Wartezeit nach Ende eines Laufs, bevor automatisch zum nächsten Lauf gewechselt wird.
- **Aufwärmzeit für Weiterschaltung (s)**: Vorlaufzeit vor dem automatischen Weiterschalten.
- **Automatische Startzeit (s)**: Automatischer Verzögerungscountdown vor dem Start des nächsten Laufs.
- **Aufwärmzeit für Start (s)**: Vorlaufzeit vor Beginn des automatischen Start-Countdowns.
- **Laufdurchläufe**: Bestimmt, wie oft jeder Fahrer die gesamte Laufrotation durchläuft.
- **Umgekehrte Läufe**: Dreht die geplante Laufreihenfolge um, sodass Läufe rückwärts ausgetragen werden.
---

## Wertungsregeln {: #scoring-rules }

#### Runden- und Zeitanpassungen (Auswirkungen auf Ranglisten und Metriken)

- **Laufwertungsmethode**: Platzierung der Fahrer in jedem Lauf nach **Meiste Runden**, **Schnellste Runde** oder **Schnellste Gesamtzeit** mit konfigurierbaren Tiebreakern.
- **Zielmethode**: Legt fest, wie das Ende eines Laufs bestimmt wird (nach **Rundenzahl** oder verstrichener **Zeit** in Sekunden).
- **Zielerlaubnis**: Bestimmt, wie Fahrzeuge ihre Runden beenden, wenn der Führende das Ziel erreicht oder die Zeit abläuft (z. B. sofortiges Ende, alle beenden lassen, Einzelrundenabschluss oder automatische Segmentgutschrift).
- **Gesamtwertungsmethode**: Platzierung der Gesamtrangliste über alle Läufe nach **Rundenzahl**, **Schnellste Runde**, **Gesamtzeit**, **Durchschnittliche Runde** oder **Punkte** mit anpassbaren Tiebreakern (einschließlich **Rundenzahl**) und Streichergebnissen.
- **Aufstieg (Step-Up)**: Konfiguriert das progressive Stufenleiter-Rennen. Standardmäßig `0` (deaktiviert). Bei Werten $S > 0$ werden Läufe in progressive Stufen unterteilt, bei denen Fahrer in höheren Stufen auf aufsteigende Qualifikanten aus unteren Stufen warten.

### Stufenleiter-Rennen (Step-Up)

Wenn **Aufstieg (Step-Up)** auf einen positiven Wert ($S > 0$) eingestellt ist, organisiert Race Coordinator AI Läufe und Wertungen als progressive Leiter:

- **Leiter-Stufen**: Fahrer werden anhand ihrer Setzposition in aufeinanderfolgende Stufen eingeteilt. Die am niedrigsten gesetzten Fahrer starten in Stufe 1 (der untersten Stufe).
- **Fahrerverbreitung**:
  - Die unterste Stufe enthält zwischen 2 und der Spuranzahl der Strecke ($2 \le N_{bottom} \le L$) Fahrer.
  - Jede nachfolgende höhere Stufe enthält $L - S$ gesetzte Fahrer und $S$ Aufstiegsplätze für die Qualifikanten aus der vorherigen Stufe.
  - Die oberste Stufe stellt das Finale dar, in dem die am höchsten gesetzten Fahrer auf die Aufsteiger warten.
- **Vollständige Rotationen pro Stufe**: Jede Stufe durchläuft die vollständige Laufrotation der Rennkonfiguration (z. B. Round Robin oder benutzerdefinierte Rotation).
- **Aufstieg & Punktezurücksetzung**: Nach Abschluss einer Stufe (gekennzeichnet durch den Stufengrenz-Lauf) steigen die besten $S$ Fahrer in die nächste Stufe auf. Bei aufsteigenden Fahrern wird die Gesamtwertung zurückgesetzt – nur Läufe in der höchsten erreichten Stufe zählen für die Gesamtwertung.
- **Gestaffelte Gesamtwertung**: Fahrer aus niedrigeren Stufen können in der Gesamtwertung niemals vor Fahrern höherer Stufen platziert werden, unabhängig von ihren Runden oder Zeiten. Der Sieger der Finalstufe gewinnt das Rennen.
- **Gruppenrennen**: Bei Gruppenrennen mit aktiviertem Aufstieg durchläuft jede Gruppe ihre eigene Leiter unabhängig.
- **Unterstützung bei Läufe bearbeiten**: Auf der Seite „Läufe bearbeiten“ werden Aufstiegsfahrer mit Abzeichen markiert und Stufengrenzen können überprüft und umgeschaltet werden.

---

## Punktewertung {: #points-scoring }

Der Bereich Punktewertung konfiguriert die punktebasierte Gesamtwertung eines Rennens. Wenn die Gesamtwertungsmethode auf **Punkte** eingestellt ist, erhalten die Fahrer in jedem Lauf Punkte entsprechend ihrer Lauf-Platzierungen und Bonuskriterien, und die Gesamtwertung richtet sich nach den Gesamtpunkten.

> [!NOTE]
> Dieser Bereich ist nur aktiviert, wenn die **Gesamtwertungsmethode** auf **Punkte** eingestellt ist. Wenn eine andere Wertungsmethode ausgewählt ist, ist der Bereich mit dem Hinweis „Kein Punkterennen“ deaktiviert.

- **Lauf-Platzierungspunkte**: Legen Sie Punkte für Platzierungen (oder pro Spur) in jedem einzelnen Lauf fest (z. B. 3 Punkte für Platz 1, 2 für Platz 2, 1 für Platz 3, 0 für Platz 4).
- **Gesamt-Boni**:
    - *Schnellste Runde*: Bonuspunkte für den Fahrer mit der schnellsten Einzelrunde des gesamten Rennens.
    - *Schnellste Runde pro Spur*: Bonuspunkte für den schnellsten Fahrer auf jeder einzelnen Spur.
    - *Führungsrunde*: Bonuspunkte für das Führen von mindestens einer Runde im gesamten Rennen.
    - *Meiste Führungsrunden*: Bonuspunkte für den Fahrer, der insgesamt die meisten Runden angeführt hat.
    - *Ein-Bonus-Begrenzung*: Beschränkt jeden Fahrer auf maximal einen Gesamtbonus (den höchsten Wert).
- **Lauf-Boni**:
    - *Übertrag %*: Prozentsatz der Laufsrunden, der zu den Laufpunkten hinzugefügt wird.
    - *Schnellste Runde*: Bonuspunkte für die schnellste Runde in einem Lauf.
    - *Führungsrunde*: Bonuspunkte für das Führen einer Runde in einem Lauf.
    - *Meiste Führungsrunden*: Bonuspunkte für die meisten Führungsrunden in einem Lauf.
    - *Ein-Bonus-Begrenzung*: Beschränkt jeden Fahrer auf maximal einen Bonus pro Lauf.
- **Tiebreaker**: Bei Punktegleichstand wird die Rangliste anhand konfigurierbarer Tiebreaker entschieden, darunter **Rundenzahl**, **Schnellste Rundenzeit**, **Mediane Rundenzeit**, **Durchschnittliche Rundenzeit** und **Gesamtzeit**.

---

## Gruppen & Stufen {: #groups-and-stages }

Der Bereich Gruppen & Stufen teilt Fahrer in getrennte Gruppen ein, die auf der Strecke nicht gegeneinander fahren:

- **Gruppentrennung**: Fahrer werden in isolierte Gruppen eingeteilt und bestreiten ihre Läufe unabhängig nach der Rotationskonfiguration.
- **Maximale Gruppen**: Legt die maximale Anzahl zulässiger Gruppen für das Rennen fest.
- **Gruppen ausgleichen**: Verteilt die Fahreranzahl automatisch gleichmäßig auf alle Gruppen.
- **Leere Spuren erlauben**: Ermöglicht Läufe mit unbesetzten Spuren, wenn Gruppen nicht exakt auf die Spurenanzahl passen.
- **Vielfaches des Maximums erzwingen**: Stellt sicher, dass die Gesamtzahl der Läufe einem Vielfachen der maximalen Gruppenkapazität entspricht.
- **Gruppenläufe rotieren**: Wechselt Läufe zwischen verschiedenen Gruppen ab, anstatt eine Gruppe vollständig vor der nächsten abzuschließen.
- **Mindestaufsteiger**: Setzt die besten Fahrer jeder Gruppe automatisch an die Spitze der Gesamtrangliste.
- **Gruppennamen**: Weist jeder Gruppe individuelle Namen zu (z. B. Profi, Halbprofi, Gruppe A/B/C).
---

## Startmethoden {: #start-methods }

Der Bereich Startmethoden konfiguriert den Start von Läufen, die Fahrzeugpositionierung auf der Strecke und Startstrafen:

- **Start- / Neustartzeit (s)**: Countdown-Dauer vor Beginn oder Wiederaufnahme eines Laufs.
- **Zufallsverzögerungen (s)**: Zufällige Verzögerung zum Countdown, um ein Antizipieren des Startsignals zu verhindern.
- **Hinter Sensor starten**: Schreibt vor, dass Fahrzeuge auf Runde Null hinter den Start-/Ziellinien-Sensoren stehen müssen.
- **An aktueller Position starten**: Ermöglicht es Fahrzeugen, nach einer Gelbphase an ihrer aktuellen Position weiterzufahren.
- **Fliegende Starts**: Hält den Bahnstrom beim Start aktiv, sodass Fahrzeuge bei Grün sofort beschleunigen können.
- **Neustart bei Frühstart**: Startet den Countdown bei Erkennung eines Frühstarts automatisch neu.
- **Frühstartstrafen**: Konfiguriert Runden- oder Zeitabzüge für Fahrer, die einen Frühstart verursachen.
---

## Teamrennen-Optionen {: #team-racing }

Der Bereich Teamrennen-Optionen ermöglicht Langstreckenrennen mit mehreren Fahrern pro Team:

- **Teamrennen-Modus**: Aktiviert teambasierte Wertungen, bei denen Fahrer eines Teams Laufläufe gemeinsam bestreiten.
- **Fahrerwechsel-Strategie**: Automatischer Round-Robin-Wechsel der Teamfahrer über aufeinanderfolgende Läufe.
- **Fahrerwechsel während des Laufs**: Erlaubt Teamfahrern den Wechsel bei Boxenstopps oder bestimmten Rundenzahlen.
- **Stint-Limits**: Minimale und maximale Fahrzeit pro Fahrer zur Gewährleistung ausgewogener Einsätze.
- **Pflicht-Fahrerwechsel**: Vorschreiben einer Mindestanzahl von Fahrerwechseln pro Lauf oder Rennen.

---

## Rennen-Editor - Analoge Kraftstoffsimulation {: #analog-fuel-simulation }

Analoger Kraftstoff simuliert den Verbrauch auf **Rundenbasis**. Da analoge Strecken Fahrzeuge erfassen, wenn sie die Start-/Ziellinie überqueren, wird der Kraftstoff bei jeder vollendeten Runde berechnet und abgezogen.

#### Konfigurationsoptionen

- **Analogen Kraftstoff aktivieren**: Hauptschalter für die analoge Kraftstofferfassung. Bei Deaktivierung läuft das Rennen ohne Kraftstoffbeschränkungen.
- **Verbrauchstyp**: Bestimmt die mathematische Kurve zur Berechnung des Verbrauchs basierend auf der Rundenzeit:
    - **Linear**: Der Kraftstoffverbrauch skaliert linear mit der Rundenzeit. Schnellere Runden verbrauchen mehr Kraftstoff, während doppelt so langsame Runden die Hälfte des Basiskraftstoffs verbrauchen.
    - **Quadratisch**: Der Verbrauch skaliert mit dem inversen Quadrat der Rundenzeit, wodurch sehr schnelle Runden stark bestraft werden.
    - **Kubisch**: Der Verbrauch steigt bei schnellen Runden steil an und bestraft aggressive Rekordjagden überproportional.
    - **Benutzerdefinierte Kurve**: Ermöglicht eine punktgenaue, interaktive Formung der Verbrauchskurve direkt auf dem SVG-Graphen.
- **Schnellste Zeit (s)**: Die schnellste erwartete Rundenzeit für Strecke und Fahrzeugklasse (in Sekunden).
- **Langsamste Zeit (s)**: Die langsamste Rundenzeit (in Sekunden) für minimalen Kraftstoffverbrauch.
- **Max. Kraftstoffverbrauch pro schnellster Runde**: Der Kraftstoffverbrauch pro Runde beim Fahren mit oder schneller als die **Schnellste Zeit**.
- **Min. Kraftstoffverbrauch pro langsamster Runde**: Der Kraftstoffverbrauch pro Runde beim Fahren mit oder langsamer als die **Langsamste Zeit**.
    - Für Rundenzeiten zwischen schnellster und langsamster Zeit geht der Kraftstoffverbrauch entsprechend dem gewählten **Verbrauchstyp** (Linear, Quadratisch, Kubisch oder Benutzerdefinierte Kurve) fließend über.
- **Kapazität**: Das Gesamtvolumen des Kraftstofftanks in beliebigen Einheiten (z. B. 100).
- **Startlevel (%)**: Der prozentuale Füllstand des Tanks zu Beginn eines Laufs (z. B. 100 % für vollen Tank oder weniger bei Sprint-/Handicap-Läufen).
- **Auftankrate (%/s)**: Die Geschwindigkeit des Nachtankens während eines Boxenstopps, gemessen in Prozent der Gesamttankkapazität pro Sekunde.
- **Boxenstopp-Verzögerung (s)**: Die vorgeschriebene Standzeit in Sekunden, bevor das Auftanken nach dem Einfahren in die Boxengasse beginnt.
- **Kraftstoff bei Laufstart zurücksetzen**:
    - **Aktiviert**: Der Kraftstoffstand jedes Fahrers wird zu Beginn jedes Laufs auf das konfigurierte **Startlevel** zurückgesetzt.
    - **Deaktiviert**: Der verbleibende Kraftstoff wird laufübergreifend mitgenommen, was strategisches Haushalten über das gesamte Rennen erfordert.
- **Aktion bei leerem Tank**: Die Strafe, wenn einem Fahrer der Kraftstoff ausgeht (Füllstand erreicht 0):
    - **Runden nicht zählen**: Das Fahrzeug fährt weiter, aber Runden werden nicht gewertet, bis in der Box nachgetankt wird.
    - **Lauf beenden**: Der Lauf wird für den Fahrer sofort beendet, der Strom zur Spur wird abgeschaltet und der Fahrer wird als gewertet/ausgeschieden markiert.
    - **Power-Stottern (Power Stutter)**: Simuliert stotternden Motorlauf bei Spritmangel durch schnelles Ein- und Ausschalten des Bahnstroms.
        - *Erfordert Spur-Relais*: Nur verfügbar, wenn die Streckenschnittstelle über getrennte Relais pro Spur verfügt.
        - **Einschaltzeit (s)**: Dauer, die der Bahnstrom während jedes Impulses eingeschaltet bleibt.
        - **Ausschaltzeit (s)**: Dauer, die der Bahnstrom während jedes Impulses ausgeschaltet bleibt.

#### Boxenstopps und Rennzeit bei analogem Kraftstoff

Damit die Standzeit beim Boxenstopp nicht fälschlicherweise als extrem langsame Runde interpretiert wird (was den Verbrauch fehlerhaft senken würde), erfasst Race Coordinator AI die **aufgelaufene Auftankzeit**. Die im Boxenstopp verbrachte Standzeit wird vor der Verbrauchsrechnung von der Rundenzeit abgezogen:

$$\text{Reine Rennzeit} = \text{Rundenzeit} - \text{Aufgelaufene Auftankzeit}$$

#### Diagrammvorschau (Analog)

- **Gleichzeitiger Modellvergleich**: Alle 3 voreingestellten mathematischen Modelle (**Linear**, **Quadratisch** und **Kubisch**) werden gleichzeitig in beiden Diagrammen dargestellt. Der aktuell ausgewählte Typ ist fett mit einem Leuchten hervorgehoben, während die übrigen Modelle als gedämpfte Referenzlinien (~40 % Deckkraft) sichtbar bleiben.
- **Kraftstoffverbrauch pro Runde**: Zeigt den exakten Verbrauch über das gesamte Rundenzeitspektrum (von Schnellste Zeit bis Langsamste Zeit) an. Im Modus Benutzerdefinierte Kurve ermöglichen Griffe und Zurücksetzen-Schaltflächen sofortige Anpassungen, während die 3 Basismodelle zum Vergleich sichtbar bleiben.
- **Zeit bis Boxenstopp**: Zeigt die geschätzte Gesamtreisezeit (oder Runden) bis zum leeren Tank in Abhängigkeit von konstanten Rundenzeiten für alle Modelle.
- **Interaktive Legende und Sichtbarkeit**: Klicken Sie mit der linken Maustaste auf eine Kurve in der Legende, um sie ein- oder auszublenden. Das Ausblenden skaliert die Diagrammachsen dynamisch neu, um verbleibende Kurven genauer betrachten zu können.
- **Vergleichende Hover-Karten**: Beim Überfahren der Diagramme mit der Maus werden Vergleichswerte aller sichtbaren Kurven am aktuellen Messpunkt mit Farbfeldern, Werten und einer `(Aktiv)`-Kennzeichnung angezeigt.

---

---

## Rennen-Editor - Digitale Kraftstoffsimulation {: #digital-fuel-simulation }

Digitaler Kraftstoff simuliert den Verbrauch **kontinuierlich in Echt

---

## Saisonwertung {: #season-scoring }

Der Bereich Saisonwertung definiert die Verteilung von Meisterschaftspunkten für Rennserien:

- **Platzierungspunkte-Tabelle**: Punkteverteilung pro Platzierung (z. B. 25 für Platz 1, 18 für Platz 2 usw.).
- **Laufpunkte**: Optionale zusätzliche Punkte für Einzellaufergebnisse neben dem Gesamtergebnis.
- **Bonuspunkte**:
    - *Schnellste Runde*: Zusatzpunkte für die absolut schnellste Rennrunde.
    - *Pole Position*: Bonuspunkte für die beste Qualifikationsplatzierung.
    - *Meiste Führungsrunden*: Bonuspunkte für die meisten Runden in Führung.
- **Meisterschafts-Aggregation**: Automatische Zusammenrechnung der Punkte über Rennen hinweg inklusive Streichergebnissen.

---

## Crash and Learn {: #crash-and-learn }

Der Expander **Crash and Learn (CNL)** konfiguriert Regeln und Strafen für Deslots (Crashes) während eines Rennens:

- **Crash and Learn aktivieren**: Schaltet die Crash-and-Learn-Erfassung ein oder aus. Wenn deaktiviert, sind alle untergeordneten Einstellungen inaktiv.
- **Automatische Crash-Erkennungszeit (Sekunden)**: Schwellenwert der Rundenzeit in Sekunden, bei dessen Überschreitung ein automatischer Crash erkannt wird. Auf `0` setzen, um die automatische Erkennung zu deaktivieren.
- **Maximale Crashes**: Erlaubte Anzahl von Crashes vor einer Disqualifikation (DQ). Bei `3` wird ein Fahrer beim 4. Crash disqualifiziert.
- **Lauf bei Crash pausieren**: Löst bei automatischem Deslot oder Drücken eines spurbezogenen Call-Buttons automatisch eine Gelbphase (Pause) aus.
- **Mehrere Crashes pro Runde zulassen**: Ermöglicht mehrere aufeinanderfolgende Crashes in derselben Runde, wenn die automatische Crash-Zeit mehrfach abläuft.
- **Crashes bei jedem Lauf zurücksetzen**: Setzt den Crash-Zähler jedes Fahrers zu Beginn jedes Laufs auf `0` zurück.
- **Disqualifikation bei jedem Lauf zurücksetzen**: Hebt den DQ-Status eines Fahrers zu Beginn des nächsten Laufs auf und setzt die Crashes auf `0` zurück.
- **Rundenstrafe pro Crash**: Anzahl der Runden, die dem Fahrer pro Crash abgezogen werden.
- **Zeitstrafe pro Crash (Sekunden)**: Strafzeit in Sekunden, die der Gesamtlaufzeit des Fahrers pro Crash hinzugefügt wird.
- **Lauf-Punkteanteil bei Disqualifikation**: Prozentsatz der gewerteten Laufleistung für disqualifizierte Fahrer (Standard `100%`). Disqualifizierte Fahrer werden hinter allen nicht disqualifizierten Fahrern platziert.
