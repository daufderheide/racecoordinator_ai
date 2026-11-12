# Benutzerdefinierte Rotationssets

## Übersicht {: #overview }

Mit dem **Editor für benutzerdefinierte Rotationssets** können Sie maßgeschneiderte Heat-Rotationsschemata für Ihre Rennstrecke entwerfen, bearbeiten und organisieren. Während Race Coordinator AI standardmäßige algorithmische Rotationen wie **Round Robin**, **Europäisches Round Robin**, **Einzellauf** und **Aufstiegsrennen** bereitstellt, bieten benutzerdefinierte Rotationssets Rennleitern die vollständige, spurgenaue manuelle Kontrolle über Fahrerplanung, Heat-Reihenfolge und Spurzuweisungen.

Ein **Asset für ein benutzerdefiniertes Rotationsset** stellt eine Sammlung (oder ein Set) einzelner Rotationskonfigurationen dar, die speziell auf die physische Spuranzahl einer Strecke (z. B. 2, 4, 6 oder 8 Spuren) zugeschnitten sind. Innerhalb eines einzelnen benutzerdefinierten Rotationsset-Assets können Sie mehrere Rotationsmuster definieren, die für unterschiedliche Teilnehmerzahlen optimiert sind.

Benutzerdefinierte Rotationssets sind ideal für:

- **Spezielle Streckenkonfigurationen:** Strecken mit spezifischen Spureigenschaften, Handicap-Setups oder Boxengassen-Anforderungen.
- **Clubformate & Hausregeln:** Traditionelle Club-Rotationspläne, bei denen bestimmte Fahrerpaarungen oder Spurabfolgen strikt eingehalten werden müssen.
- **Feste Stufen- & Stint-Sequenzen:** Spezielle Einladungsrennen, Derbys oder Teamformate, bei denen algorithmische Round-Robin-Sequenzen nicht den Veranstaltungsregeln entsprechen.

---

## Funktionsweise benutzerdefinierter Rotationssets {: #how-custom-rotations-work }

### Maximale Fahrerkapazität pro Rotation {: #maximum-driver-capacity }

Ein benutzerdefiniertes Rotationsset-Asset definiert nicht nur einen einzelnen statischen Ablaufplan, sondern enthält ein **Set von Rotationen**, wobei **jede Rotation eine Rotation für eine maximale Anzahl von Fahrern** (`numDrivers`) festlegt.

Innerhalb jeder Rotation:

- **Virtuelle Fahrer-Startnummern:** Fahrer werden durch Startplatznummern identifiziert: `Fahrer 1`, `Fahrer 2`, ... bis zu `Fahrer N` (wobei `N` die maximale Fahrerkapazität der Rotation ist).
- **Spurzuweisungen:** Für jeden Heat wird jeder physischen Spur eine bestimmte virtuelle Fahrer-Startnummer zugewiesen (z. B. Spur 1: Fahrer 1, Spur 2: Fahrer 2) oder unbesetzt/leer gelassen.
- **Teilnehmer-Setzung:** Wenn ein Rennen beginnt, werden die registrierten Fahrer den Startplätzen 1 bis $M$ gemäß ihrer Startreihenfolge (oder einer zufälligen Qualifikationsreihenfolge) zugewiesen.

Beispielsweise kann ein Asset „4-Spur-Club-Sprint“ Folgendes enthalten:

- Eine **4-Fahrer-Rotation:** Ein Ablaufplan mit 4 Heats, bei dem 4 Fahrer jeweils einmal auf jeder der 4 Spuren fahren.
- Eine **5-Fahrer-Rotation:** Ein Ablaufplan mit 5 Heats, bei dem 5 Fahrer über die 4 Spuren rotieren und in jedem Heat ein Fahrer pausiert.
- Eine **6-Fahrer-Rotation:** Ein Ablaufplan mit 6 Heats, der eine ausgeglichene Fahrzeit gewährleistet.
- Eine **8-Fahrer-Rotation:** Ein Ablaufplan mit 8 Heats für größere Teilnehmerfelder.

---

### Algorithmus zur Rotationsauswahl {: #rotation-selection-algorithm }

Wenn ein Rennen mit einem benutzerdefinierten Rotationsformat startet (oder wenn der Renn-Editor die Live-Heat-Vorschau generiert), bestimmt Race Coordinator AI automatisch, welche Rotation aus dem Set des Assets verwendet werden soll.

Das System zählt die Anzahl der aktiven, teilnehmenden Fahrer (`driverCount`) und wählt die optimale Rotation anhand einer strikten **dreistufigen Priorisierungsstrategie** aus:

#### 1. Stufe 1: Exakte Übereinstimmung {: #selection-tier-1 }
Das System sucht zuerst nach einer Rotation, deren konfigurierte maximale Fahreranzahl (`numDrivers`) **exakt mit der aktiven Fahreranzahl übereinstimmt** (`numDrivers == driverCount`).

- **Ergebnis:** Die exakt passende Rotation wird ausgewählt.
- **Spurzuordnung:** Jeder teilnehmende Fahrer entspricht 1:1 seinem virtuellen Startplatz (Fahrer 1 fährt als Startplatz 1, Fahrer 2 als Startplatz 2 usw.). Es gibt keine leeren Spuren, es sei denn, die Rotation selbst wurde explizit mit unbesetzten Spuren entworfen.

#### 2. Stufe 2: Nächsthöhere Rotation (Kleinste Rotation größer als die Fahreranzahl) {: #selection-tier-2 }
Gibt es keine Rotation mit der exakten Fahreranzahl, sucht das System nach allen Rotationen im Asset, deren Fahrerkapazität **größer als die aktive Fahreranzahl** ist (`numDrivers > driverCount`). Unter diesen wählt es die Rotation mit der **geringsten Differenz** aus:

$$\min(\text{numDrivers} - \text{driverCount})$$

- **Ergebnis:** Die nächsthöhere Rotation wird ausgewählt, um sicherzustellen, dass alle Fahrer antreten können.
- **Behandlung leerer Spuren:** Da weniger Fahrer anwesend sind, als für die Rotation vorgesehen war, wird jeder Spurplatz, der einer virtuellen Startnummer oberhalb der aktiven Fahreranzahl zugewiesen ist (`Startnummer > driverCount`), automatisch als **leere Spur** (`Driver.EMPTY_DRIVER`) behandelt. Diese Spur bleibt in diesem Heat unbesetzt, während alle teilnehmenden Fahrer auf ihren vorgesehenen Plätzen fahren.

#### 3. Stufe 3: Nächstniedrigere Rotation (Größte Rotation kleiner als die Fahreranzahl) {: #selection-tier-3 }
Übersteigt die aktive Fahreranzahl die Maximalkapazität **jeder** im Asset definierten Rotation (wenn beispielsweise 9 Fahrer antreten, die größte Rotation im Asset aber nur 8 Fahrer unterstützt), fällt das System auf die Rotation mit der **größten Kapazität unterhalb der aktiven Fahreranzahl** zurück:

$$\min(\text{driverCount} - \text{numDrivers})$$

- **Ergebnis:** Die nächstniedrigere Rotation wird ausgewählt.
- **Kapazitätsbegrenzung:** Nur Fahrer, deren Startplatz innerhalb der Kapazität der ausgewählten Rotation liegt (Fahrer 1 bis `numDrivers`), werden für Heats eingeteilt. Fahrer mit Startnummern oberhalb von `numDrivers` erhalten keine Heat-Einteilung.

!!! tip "Design-Tipp: Teilnehmerfelder abdecken"
    Um sicherzustellen, dass alle Fahrer ohne unberücksichtigte Teilnehmer oder unerwartete Leer-Spuren antreten können, erstellen Sie innerhalb desselben Assets für jede erwartete Teilnehmerzahl (z. B. 4, 5, 6, 7 und 8 Fahrer) eine eigene Rotation.

---

### Praxisbeispiele zur Auswahl {: #selection-examples }

Angenommen, Ihr Asset definiert drei Rotationen: **4 Fahrer**, **6 Fahrer** und **8 Fahrer**. Die folgende Tabelle zeigt, welche Rotation Race Coordinator AI abhängig von der Teilnehmerzahl auswählt:

| Gemeldete Fahrer | Im Asset vorhanden | Ausgewählte Rotation | Auswahlregel | Verhalten bei Leer-Spuren & Feld |
| :---: | :---: | :---: | :---: | :--- |
| **4 Fahrer** | 4, 6, 8 | **4-Fahrer-Rotation** | **Stufe 1 (Exakte Übereinstimmung)** | Perfekte Passung. Alle Spuren belegt; alle 4 Fahrer fahren. |
| **5 Fahrer** | 4, 6, 8 | **6-Fahrer-Rotation** | **Stufe 2 (Nächsthöhere Rotation)** | Startplatz 6 läuft als leere Spur. Fahrer 1–5 fahren. |
| **6 Fahrer** | 4, 6, 8 | **6-Fahrer-Rotation** | **Stufe 1 (Exakte Übereinstimmung)** | Perfekte Passung. Alle Spuren belegt; alle 6 Fahrer fahren. |
| **7 Fahrer** | 4, 6, 8 | **8-Fahrer-Rotation** | **Stufe 2 (Nächsthöhere Rotation)** | Startplatz 8 läuft als leere Spur. Fahrer 1–7 fahren. |
| **8 Fahrer** | 4, 6, 8 | **8-Fahrer-Rotation** | **Stufe 1 (Exakte Übereinstimmung)** | Perfekte Passung. Alle Spuren belegt; alle 8 Fahrer fahren. |
| **9 Fahrer** | 4, 6, 8 | **8-Fahrer-Rotation** | **Stufe 3 (Nächstniedrigere Rotation)** | Fahrer 1–8 fahren. Fahrer 9 bleibt unberücksichtigt. |

---

## Erstellen eines benutzerdefinierten Rotationssets {: #creating-custom-rotations }

So erstellen Sie ein neues Asset für ein benutzerdefiniertes Rotationsset:

1. Öffnen Sie den **Asset Manager** über das Hauptmenü oder den Einrichtungsbildschirm.
2. Klicken Sie im linken Bereich auf die Schaltfläche **Neues benutzerdefiniertes Rotationsset** (oder filtern Sie nach **Benutzerdefinierte Rotationssets** und klicken Sie auf eine vorhandene Karte).
3. Der **Rotations-Editor** wird geöffnet:
   - Beim Erstellen eines neuen Rotationsset-Assets zeigt der Editor zunächst einen Hinweisbereich im Leerzustand mit Erläuterungen und einem Link **Weitere Informationen zu benutzerdefinierten Rotationssets** zu dieser Dokumentation an.
   - Geben Sie im Konfigurationsbereich einen eindeutigen **Asset-Namen** ein.
   - Wählen Sie Ihre Ziel-**Strecke** aus. Die Streckenauswahl konfiguriert automatisch die Spuranzahl für alle Rotationen im Set.

---

## Heats & Spuren gestalten {: #designing-heats }

### Rotationen zum Set hinzufügen {: #adding-rotations }

1. Klicken Sie in der oberen Symbolleiste auf die Schaltfläche **Rotation hinzufügen** (`+`), um Ihre erste Rotationskarte zu erstellen.
2. Legen Sie im Kopfbereich der Karte das Feld **Anzahl der Fahrer** fest. Dies definiert die maximale Fahrerkapazität für diese spezifische Rotation.
3. Die Rotationskarte wird automatisch mit einem ersten Heat befüllt, der Spurplätze für Ihre Strecke enthält.

### Heats hinzufügen und anordnen {: #adding-heats }

- **Heat hinzufügen:** Klicken Sie im Rotationskopf auf das `+`-Symbol, um weitere Heats anzuhängen.
- **Heats neu anordnen:** Ziehen Sie Heat-Karten per Drag-and-Drop im Raster an die gewünschte Position.
- **Heat löschen:** Klicken Sie auf das Mülleimer-Symbol einer Heat-Karte, um sie zu entfernen.

### Fahrer Spuren zuweisen {: #assigning-drivers }

- **Pool virtueller Fahrer:** Der linke Bereich bietet einen Pool virtueller Fahrer (`Fahrer 1`, `Fahrer 2` usw.). Sie können die Anzahl der Fahrer im Pool anpassen, um beliebig viele Startplätze bereitzustellen.
- **Drag-and-Drop:** Ziehen Sie Fahrerchips aus dem Pool direkt in die Spurplätze einer Heat-Karte.
- **Spurtausch:** Ziehen Sie einen Fahrerchip von einer Spur auf eine andere, um deren Zuweisungen zu tauschen.
- **Spur leeren:** Ziehen Sie einen Fahrer aus einer Spur heraus oder entfernen Sie ihn, um die Spur unbesetzt zu lassen.

### Gruppenzuweisungen {: #group-assignments }

Jede Heat-Karte enthält ein Eingabefeld für die **Gruppe**:

- Weisen Sie Heats unterschiedlichen Gruppennummern zu (z. B. Gruppe 1, Gruppe 2), wenn Sie mehrstufige oder Gruppenrennen veranstalten.
- Fahrer verschiedener Gruppen fahren unabhängig voneinander, und die Wertungen können in der Rennkonfiguration nach Gruppen getrennt werden.

### Prüfung der Spurgleichheit {: #lane-equality-validation }

Chancengleichheit ist beim Slotracing entscheidend. Race Coordinator AI prüft kontinuierlich die Spurverteilung jeder Rotation:

- **Häkchen-Badge (Grün):** Zeigt an, dass jeder Fahrer in der Rotation gleich oft auf jeder Spur antritt.
- **Warn-Badge (Orange):** Zeigt an, dass die Spurzuweisungen ungleichmäßig sind (z. B. fährt Fahrer 1 zweimal auf Spur 1, aber nie auf Spur 4).
- **Gleichheitsbericht:** Klicken Sie auf das Gleichheits-Badge, um den detaillierten **Spurgleichheitsbericht** zu öffnen. Er zeigt eine Matrix mit der genauen Anzahl der Starts jedes Fahrers auf jeder Spur.

### Rotationen sortieren {: #sorting-rotations }

Klicken Sie in der Titelleiste auf die Schaltfläche **Rotationen sortieren** (`swap_vert`), um alle Rotationskarten automatisch aufsteigend nach ihrer maximalen Fahreranzahl zu sortieren.

---

## Rotationen importieren & exportieren {: #importing-exporting }

Sie können Rotationen zwischen Systemen teilen oder archivieren:

- **Gesamtes Asset exportieren:** Klicken Sie in der oberen Symbolleiste auf **Exportieren**, um das gesamte Asset als `.json`-Datei herunterzuladen.
- **Einzelne Rotation exportieren:** Klicken Sie auf das Export-Symbol (`upload`) einer einzelnen Rotationskarte, um nur diese Fahreranzahl-Konfiguration zu exportieren.
- **Rotationen importieren:** Klicken Sie auf **Importieren**, um `.json`-Rotationsdateien oder ältere Race Coordinator-Dateien (`.txt` im RC1-Format) in Ihr Asset zu laden.

---

## Benutzerdefinierte Rotationssets in Rennen verwenden {: #using-in-races }

Sobald Ihr Asset gespeichert ist:

1. Öffnen Sie den [Renn-Editor](race-editor.md).
2. Stellen Sie im Abschnitt **Renn-Setup** das **Heat-Rotationsformat** auf **Benutzerdefiniertes Rotationsset**.
3. Wählen Sie Ihr benutzerdefiniertes Rotationsset-Asset aus dem Dropdown-Menü **Benutzerdefiniertes Rotationsset** aus.
4. Passen Sie die Renneinstellungen wie gewünscht an:
   - **Heat-Durchläufe:** Wiederholt die gesamte benutzerdefinierte Sequenz $N$-mal.
   - **Heats umkehren:** Kehrt die Heat-Reihenfolge um.
5. Nutzen Sie den Schieberegler für die **Fahreranzahl-Vorschau** und prüfen Sie die **Live-Heat-Vorschau**, um die Heateinteilung vor dem Renntag zu verifizieren.
