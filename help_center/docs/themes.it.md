# Temi

!!! note "Contenuto in fase di sviluppo"
    Questo articolo è in fase di stesura. Il testo completo sarà presto disponibile.

## Temi

Ciascun tema raggruppa risorse visive (bandiere, luci di partenza, indicatori di carburante), annunci audio e assegnazioni di layout:

- **Layout interfaccia personalizzato:** Il layout di visualizzazione associato caricato durante la gara.
- **Tema postazione pilota:** Il tema utilizzato quando si apre o si scansiona una finestra o un dispositivo di postazione pilota a corsia singola.
- **Tema visualizzazione pilota:** Il tema utilizzato quando si apre o si scansiona la finestra del programma o la schermata del dispositivo personale del pilota.

## Audio

I temi consentono di personalizzare gli effetti sonori e gli annunci vocali per gli eventi di gara:

- **Conto alla rovescia di partenza:** Suoni durante la sequenza di avvio (`audio.countdown`).
- **Luce verde / VIA:** Tono emesso al momento dell'accensione delle luci verdi (`audio.countdown.green`).
- **Bandiera gialla:** Sirene o avvisi durante una fase di cautela (`audio.yellowflag`).
- **Secondi rimanenti avvio automatico:** Annunci del conto alla rovescia per il tempo rimanente prima dell'avvio automatico della manche (`audio.auto_start`).
- **Tempo manche (Secondi rimanenti):** Annunci con il tempo restante della manche (`audio.seconds_left`).
- **Conteggio giri leader (Giri rimanenti):** Annunci con i giri rimanenti del leader della manche (`audio.laps_left`).
- **Metà manche:** Notifica al raggiungimento della metà della manche — sia per le gare a tempo (metà durata trascorsa) sia per le gare a giri (quando il leader completa la metà dei giri previsti) (`audio.seconds_left.halfway`).
- **Manche e gara concluse:** Segnali acustici di fine manche (`audio.heat_over`) o fine gara (`audio.race_over`).
- **Secondi rimanenti avanzamento automatico:** Annunci del conto alla rovescia per il tempo rimanente prima dell'avanzamento automatico alla manche successiva (`audio.auto_advance`).
- **Avvisi di infrazione:** Toni per tempo sul giro inferiore al minimo (`audio.min_lap_time`).

Per maggiori dettagli su attenuazione automatica, priorità e rilevanza multischermo, consultare la documentazione del [Sistema Audio](audio.md).

## Sostituzioni audio del pilota

I temi possono sostituire le impostazioni audio individuali dei piloti per tutti i partecipanti quando il tema è attivo. Per impostazione predefinita, vengono riprodotti i suoni personalizzati di ciascun pilota (configurati nell'[Editor piloti](driver-editor.md)). Tuttavia, un tema può sostituire selettivamente uno qualsiasi dei 13 eventi audio del pilota:

- **Suoni personali sul giro:** Giro completato (`lapAudio`), Miglior giro personale (`bestLapAudio`).
- **Suoni di gara sul giro:** Miglior giro di gara (`raceBestLapAudio`), Miglior giro su corsia di gara (`raceLaneBestLapAudio`), Miglior giro di manche (`heatBestLapAudio`), Nuovo leader di gara (`newRaceLeaderAudio`), Nuovo leader di manche (`newHeatLeaderAudio`).
- **Suoni del miglior giro generale:** Miglior giro generale (`overallBestLapAudio`), Miglior giro corsia generale (`overallLaneBestLapAudio`).
- **Suoni degli eventi:** Ingresso ai box (`pitInAudio`), Livello carburante (`fuelAudio`), Falsa partenza / Penalità (`penaltyAudio`), Giro in derapata (`driftLapAudio`).

### Gerarchia di sostituzione e configurazione
- **Disabilitato (Predefinito):** Il tema lascia lo slot inalterato; viene riprodotta la configurazione del pilota.
- **Sostituzione abilitata:** Il tema ha la precedenza per quello specifico evento sonoro su tutti i piloti che utilizzano questo tema. Puoi configurarlo come **Suono predefinito**, **File audio caricato**, frase **Sintesi vocale (TTS)** personalizzata o **Nessuno** (per disattivare l'audio a livello di tema).
- **Ripristina tutte le sostituzioni:** Rimuove rapidamente tutte le sostituzioni attive nel tema, restituendo il controllo completo alle impostazioni di ciascun pilota.
