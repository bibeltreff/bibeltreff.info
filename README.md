# Bibeltreff Stuttgart

Schlichte, statische Website für [bibeltreff.info](https://bibeltreff.info). Fokus: Einladung, Evangelium in Farben und persönliche Zeugnisse.

## Lokal ansehen

Node.js 20 oder neuer, keine Pakete zu installieren:

```sh
npm run dev
```

Öffnet einen lokalen Server unter `http://127.0.0.1:4173`. Alternativ `node scripts/serve.mjs`. Der Server baut beim Start die Seite; nach Inhaltsänderungen `npm run build` ausführen und den Browser neu laden. CSS und JavaScript benötigen nur ein Neuladen. Ein anderer Port lässt sich über `PORT` setzen.

## Inhalte und Gestaltung ändern

- `content/site.json`: Deutsche Einladung, Treffzeiten, sechs Evangeliums-Themen, Zeugnisse und Kontaktlinks.
- `content/site.en.json`: Englische Übersetzung mit gekürzten NKJV-Bibelzitaten.
- `content/ui.de.json` und `content/ui.en.json`: Beschriftungen, Navigation, Hinweise und barrierefreie Texte beider Sprachen.
- `src/index.html`: Gemeinsame HTML-Vorlage mit Platzhaltern für beide Sprachen.
- `styles.css`: Responsive Gestaltung; Hauptfarbe ist das Blau aus dem PDF `#1d61b2` (`--accent`).
- `site.js`: Markierung des aktuellen Evangeliums-Themas und Messung der haftenden Navigation.
- `assets/meeting-status.js`: Zeigt den sanft pulsierenden blauen Punkt nur zu den veröffentlichten wöchentlichen Treffzeiten (Zeitzone Europe/Berlin). Bei reduzierter Bewegung bleibt er ruhig; ohne JavaScript bleibt er verborgen.
- `assets/documents/evangelium-in-farben.pdf`: Unverändertes Originalheft als Download.
- `index.html` und `en.html`: Generierte deutsche und englische Seiten. Änderungen hier werden beim Bauen überschrieben.

Deutsch bleibt die Standardsprache. Der Sprachlink in der Kopfzeile öffnet `en.html` beziehungsweise `index.html` und funktioniert ohne JavaScript. Beide Seiten haben eigene Metadaten sowie gegenseitige `hreflang`-Verweise. Das Originalheft bleibt deutsch und ist auf der englischen Seite als „German PDF“ gekennzeichnet.

Englische Bibelzitate folgen der NKJV, auch in der Einleitung und im Zeugnis. Auslassungen in gekürzten Versen sind mit „…“ markiert; Johannes 3:16 bleibt auf zwei Themen verteilt. Übersetzungsunterschiede bleiben erhalten: 1. Petrus 2:2 endet mit „grow thereby“, Offenbarung 5:10 verwendet „us“ und „we“. Offenbarung 20:14 wird vollständig zitiert, damit Feuersee und zweiter Tod im Zusammenhang bleiben. Der englische Fußbereich enthält den NKJV-Quellenhinweis. Wortlaut geprüft anhand der [NKJV bei Bible Gateway](https://www.biblegateway.com/versions/New-King-James-Version-NKJV-Bible/).

Das kleine Symbol neben „Sag Hallo“ bietet die Farbschemata Systemstandard, Hell und Dunkel an. Standardmäßig folgt die Seite dem System, auch ohne JavaScript. Eine manuelle Auswahl wird lokal im Browser gespeichert; „Systemstandard“ hebt sie wieder auf. Das Drucklayout bleibt hell.

Nach Änderungen an Inhalten oder Vorlage:

```sh
npm run build
npm run check
```

`check` prüft beide Sprachen: interne Sprungziele, eindeutige und übereinstimmende IDs, lokale Assets, Link-Schemata, PDF, Textkodierung, Sprachlinks und das Vorhandensein aller Themen und Zeugnisse. Außerdem müssen Treffzeiten, Kontaktlinks, Übersetzungsschlüssel und Inhaltsstruktur übereinstimmen. Browserprüfung bleibt für Darstellung und Bedienung notwendig.

Ein neues Zeugnis wird im Array `testimonies` ergänzt: `id` (eindeutiger URL-tauglicher Bezeichner), `name`, `headline`, `intro` und `paragraphs` (Liste einzelner Absätze). Es erhält automatisch ein per Maus, Touch und Tastatur bedienbares Aufklappelement. Die vorhandenen Zeugnisse stammen von Can Luca und Thomas; Rechtschreibung, Zeichensetzung und Absatzgliederung wurden leicht geglättet, die inhaltlichen Aussagen beibehalten. Thomas’ englisches Bibelzitat verwendet einen gekürzten [NKJV-Wortlaut von Philipper 3:8](https://www.biblegateway.com/passage/?search=Philippians+3%3A8&version=NKJV).

In `testimonies[].paragraphs` stehen normale Absätze als Text. Bibelzitate werden an der gewünschten Stelle als Objekt mit `text` und `reference` eingefügt und als Blockzitat mit eigener Quellenangabe dargestellt.

Bei jedem Thema in `gospel` werden alle Bibelstellen in `verses` direkt angezeigt. Zusätzliche Stellen können in `moreVerses` eingetragen werden, ebenfalls als Objekte mit `text` und `reference`. Nur wenn `moreVerses` Einträge enthält, erscheint darunter „Weitere Bibelstellen +“ zum Aufklappen. Ein leeres oder weggelassenes `moreVerses` erzeugt keinen Aufklappbereich.

Treffzeiten und der Treffpunkt am grünen Tisch stammen auf Wunsch des Betreibers aus dem PDF. Die Kontakt-, Kanal- und Zoom-Links stammen von der bisherigen Website. Sonntag bleibt mit anschließendem Mittagessen. Bibelzitate und Erläuterungen folgen dem bereitgestellten Heft; die Farbreihenfolge ist Gold, Schwarz, Rot, Weiß, Grün, Gold.

## Statisches Hosting

Die fertig gebauten `index.html` und `en.html` werden mit versioniert. Das bestehende GitHub-Pages-Hosting aus dem Repository-Stamm kann unverändert weiterlaufen. Vor dem Push immer bauen und prüfen; ohne automatischen Telegram-Import werden keine GitHub Actions, externen Bibliotheken oder Node-Prozesse auf dem Host benötigt. Für automatische Kanalnachrichten dient der unten beschriebene optionale Workflow. `CNAME` bleibt erhalten. `.nojekyll` deaktiviert unnötige Jekyll-Verarbeitung.

Für einen späteren IONOS-/Linux-Server genügen `index.html`, `en.html`, `styles.css`, `site.js` und `assets/` im Webroot von nginx oder Apache. Alle lokalen URLs sind relativ, daher funktioniert die Seite auch in einem Unterverzeichnis. Keine SPA-Rewrites nötig.

## Späteres Payload CMS

Darstellung und Inhalte sind bereits getrennt. Als nächste Ausbaustufe lassen sich `meetings`, `gospel` und `testimonies` auf Payload Collections sowie Einladung und Kontakte auf Globals abbilden. Ein Build-Schritt kann die veröffentlichten Inhalte serverseitig aus Payload abrufen und im gleichen JSON-Format an diesen Generator übergeben. Das Frontend bleibt statisch; Aktualisierungen können per Webhook einen neuen Build auslösen. API-Zugangsdaten gehören ausschließlich in die Build-Umgebung. Payload selbst ist noch nicht installiert oder integriert.

## Bedienung und externe Dienste

Alle Inhalte, Sprunglinks und Aufklappbereiche funktionieren ohne JavaScript. Die Farbnavigation bleibt innerhalb des Evangeliums-Bereichs unter der Hauptnavigation sichtbar; kleine Displays zeigen alle sechs Farben in zwei Reihen. JavaScript ergänzt die aktuelle Leseposition. Reduzierte Bewegung wird berücksichtigt.

Source Sans 3 wird wie gewünscht direkt von Google Fonts geladen, mit System-Sans-Serif als Fallback. Google Fonts stellt dabei eine externe Verbindung her. Karten, Zoom und soziale Kanäle werden nur als Links angeboten, nicht eingebettet. Die Website verwendet keine Analytics und setzt selbst keine Cookies.

Im bisherigen Projekt waren keine Impressums- oder Datenschutzhinweise enthalten. Entsprechende Betreiberangaben und Texte sind weiterhin vom Betreiber bereitzustellen; es wurden keine Angaben erfunden.

## Telegram: die letzten drei Nachrichten

Die Website kann Texte und Bildunterschriften aus `@bibeltreff_uni` als drei Karten zwischen Treffen und Evangelium anzeigen. Die Inhalte bleiben in ihrer Originalsprache. Fett- und Kursivschrift, Unterstreichungen, Durchstreichungen, Zitate, Code und Links bleiben erhalten. Audio und Sprachnachrichten erhalten einen Player sowie einen Downloadlink. Reguläre Telegram-Fotos werden direkt angezeigt und lassen sich durch Anklicken in voller Größe öffnen. Videos, als Dokument verschickte Bilder und besondere Nachrichtenformate bleiben im Telegram-Kanal verfügbar. Die Karten erscheinen als Nachrichtenblasen mit Sender und separaten Datumsmarken darüber, ohne Uhrzeiten, vertikal von der ältesten zur neuesten Nachricht und dem Hover-Effekt der Treffkarten. Aufnahme-Titel werden nicht doppelt angezeigt; unter den Karten steht ein gemeinsamer Kanal-Link. Es gibt keine Telegram-Skripte oder direkten Telegram-Verbindungen im Browser. Ohne importierte Nachrichten bleibt der Abschnitt ausgeblendet.

`content/telegram.json` enthält die drei neuesten Nachrichten sowie den gespeicherten Update-Offset. `scripts/telegram.mjs` sammelt ausschließlich Beiträge aus dem öffentlichen Kanal. Andere Nachrichten und private Nutzerdaten werden nicht gespeichert. Bearbeitungen werden übernommen, solange Telegram sie dem Bot zustellt. Gelöschte Kanalnachrichten meldet die Bot API nicht: entsprechende Einträge müssen manuell entfernt werden. Albumteile zählen als einzelne Telegram-Nachrichten.

### Einmalige Einrichtung auf GitHub

1. Diese Änderungen nach Prüfung in den Branch `main` pushen. Allein dadurch wird die Synchronisierung noch nicht aktiviert.
2. Bei `@BotFather` über `/mybots` → `@bibeltreff_bot` den API-Token abrufen. Im Repository unter **Settings → Secrets and variables → Actions → Secrets → New repository secret** als `TELEGRAM_BOT_TOKEN` speichern. Nicht in Dateien, Nachrichten oder öffentliche Logs einfügen.
3. Unter **Actions → Telegram and GitHub Pages → Run workflow** zunächst `mode: inspect` auswählen. Die Ausgabe zeigt nur `webhookActive`, `pendingUpdates` und `membership`. Diese Prüfung verändert keine Verbindung und bestätigt keine Updates.
4. Bei `webhookActive: true` zuerst den bisherigen Dienst identifizieren. Der Collector löscht den Webhook niemals automatisch. Auch bei `false` prüfen, ob auf einem alten Server oder bei einem Bot-Dienst noch ein Polling-Programm läuft; das lässt sich über die API nicht zuverlässig erkennen. Für diesen Collector darf kein anderer Empfänger den Bot abfragen.
5. Unter **Settings → Pages → Build and deployment → Source** auf **GitHub Actions** umstellen. Der Workflow veröffentlicht nur die Website-Dateien, nicht Quellcode oder den Update-Offset. Er schreibt den Feed und die generierten Seiten nach `main`; Branch-Regeln müssen diesen Workflow-Push erlauben.
6. Unter **Settings → Secrets and variables → Actions → Variables** die Repository-Variable `TELEGRAM_SYNC_ENABLED` auf `true` setzen. Danach den Workflow einmal mit `mode: sync` starten. Der Telegram-Import läuft einmal täglich um 18:17 UTC (19:17 Uhr in Berlin im Winter, 20:17 Uhr im Sommer). Pushes auf `main` bauen und veröffentlichen die Website mit den bereits gespeicherten Nachrichten, ohne Telegram erneut abzufragen. GitHub kann geplante Läufe verzögern und bei längerer Repository-Inaktivität deaktivieren; fehlgeschlagene oder ausbleibende Läufe beachten.

Der Workflow bestätigt bei Telegram nur Updates, deren Zustand bereits in einem vorherigen Lauf gespeichert wurde. Neue Updates werden zunächst zusammen mit den drei Nachrichten versioniert. Bei einem fehlgeschlagenen Commit/Push wird der noch unbestätigte Stapel beim nächsten Lauf erneut eingelesen. Pro Lauf werden bis zu 100 Updates verarbeitet; bei einem größeren Rückstand weitere Läufe auslösen. Updates hält Telegram höchstens 24 Stunden vor. Beim täglichen Abruf gibt es daher keinen Zeitpuffer: Verzögerte oder ausgefallene Läufe können Nachrichten verpassen; diese müssen gegebenenfalls erneut an den Bot weitergeleitet werden.

### Die vorhandenen drei Nachrichten übernehmen

Nach der Verbindungsprüfung die drei letzten Kanalnachrichten in Telegram **an `@bibeltreff_bot` weiterleiten**, mit sichtbarer Herkunft und ohne den Absender auszublenden. Danach innerhalb von 24 Stunden den Workflow mit `mode: sync` starten. Nur Weiterleitungen mit Telegrams Kanal-Herkunft `bibeltreff_uni` werden übernommen, mit der ursprünglichen Nachrichten-ID und dem ursprünglichen Datum. Eine alte Weiterleitung überschreibt keinen bereits gespeicherten Text. Bei identischem Text kann erneutes Weiterleiten fehlende Formatierungen, Fotos und Audiodaten eines älteren Imports ergänzen.

Falls der Kanal Weiterleitungen verhindert, können die drei Einträge einmalig direkt in `content/telegram.json` eingetragen werden. Beispielstruktur (Werte durch den echten Inhalt ersetzen):

```json
{
  "nextOffset": 0,
  "posts": [
    {
      "id": 433,
      "date": "2026-09-23T18:39:25.000Z",
      "text": "Hier den vollständigen Originaltext eintragen.",
      "hasMedia": false
    }
  ]
}
```

Einen bereits vorhandenen `nextOffset` unverändert lassen. Danach bauen, prüfen und veröffentlichen. Neue Kanalbeiträge werden anschließend automatisch gesammelt. Der Bot antwortet auf Weiterleitungen nicht; das ist für diesen Collector normal.

### Wann läuft der Workflow?

- **Push nach `main`**: Normale Inhalts- oder Codeänderungen starten Build, Prüfungen und Deployment mit dem gespeicherten Telegram-Feed; es erfolgt kein neuer Telegram-Abruf. Ein rein lokaler Commit oder ein Push in einen anderen Branch startet diesen Workflow nicht.
- **Einmal täglich um 18:17 UTC**: Neue Telegram-Nachrichten werden abgeholt; das Veröffentlichen einer Kanalnachricht löst selbst keinen sofortigen Workflow aus.
- **Manuell**: `inspect` prüft nur die Bot-Verbindung; `sync` aktualisiert und veröffentlicht.

Sync und Deployment benötigen `TELEGRAM_SYNC_ENABLED=true`. Ein geplanter oder manuell gestarteter Sync holt neue bzw. bearbeitete Beiträge, behält die drei höchsten Nachrichten-IDs, lädt unterstütztes Audio herunter, baut beide Sprachen, prüft sie und speichert Feed, Audio und generierte Seiten im Repository. Danach veröffentlicht er die Website auf GitHub Pages. Der eigene Commit mit dem `GITHUB_TOKEN` löst keinen weiteren Push-Workflow aus. Bei einem Fehler vor dem Deployment bleibt die bisherige Website online.

### Audio, Fotos und Formatierungen

Audio und Fotos werden während des Syncs mit dem privaten Bot-Token heruntergeladen und unter `assets/telegram/` gespeichert. `scripts/telegram-media.mjs` lädt beide Medientypen herunter, verwendet lokale Kopien wieder und entfernt nicht mehr benötigte Mediendateien aus dem aktuellen Website-Dateibestand. Besucher erhalten nur lokale URLs und einen HTML-Audioplayer (`preload="none"`, kein Autoplay); der Token erscheint nie in Seiten oder Audiodatei-URLs. Unterstützt werden Audio-Nachrichten, Sprachnachrichten und als Audiodokument erkannte Dateien in MP3, M4A, Ogg/Opus, WAV, AAC und FLAC. Die Abspielbarkeit des jeweiligen Codecs hängt vom Browser ab; ein Downloadlink bleibt verfügbar.

Die Standard-Bot-API erlaubt Downloads bis 20 MB. Größere oder nicht herunterladbare Dateien behalten den Telegram-Link. Fehlgeschlagene Downloads werden beim nächsten Sync erneut versucht. Bereits gespeicherte Dateien werden wiederverwendet. Audio und Fotos zu Nachrichten, die aus den letzten drei herausfallen, werden aus dem aktuellen Website-Dateibestand entfernt; frühere Versionen bleiben in der Git-Historie.

Die Formatierung stammt aus Telegrams `entities` bzw. `caption_entities`, einschließlich verschachtelter Formatierungen und korrekter Emoji-Positionen. HTML aus Nachrichtentexten wird nicht ausgeführt; Links sind auf HTTP, HTTPS und E-Mail beschränkt. Nicht unterstützte Telegram-Sonderformatierungen erscheinen als normaler Text.

**Bestehende Beiträge nach diesem Upgrade:** Nach dem Push die betroffenen Originalnachrichten nochmals mit sichtbarer Herkunft an den Bot weiterleiten und `mode: sync` ausführen. Frühere Importe hatten Formatierungen, Audio-IDs bzw. Foto-IDs noch nicht gespeichert. Reguläre Fotos werden in der größten von Telegram angebotenen Auflösung importiert; ältere Foto-Nachrichten müssen für den erstmaligen Bildimport erneut an den Bot weitergeleitet werden. Albumteile zählen weiterhin als einzelne Nachrichten; es gibt noch keine zusammengefasste Albumgalerie. Neue Beiträge enthalten diese Daten automatisch. Sind Weiterleitungen im Kanal gesperrt, können neue Kanalbeiträge bzw. nachfolgende Bearbeitungen die vollständigen Daten liefern.
### Lokale Ausführung

Token über eine private Umgebungsvariable `TELEGRAM_BOT_TOKEN` bereitstellen. Die Befehle laden keine `.env`-Dateien automatisch.

```sh
npm run telegram:inspect
# Erst nach Prüfung auf bisherige Bot-Dienste TELEGRAM_SYNC_ENABLED=true setzen:
npm run telegram:sync
npm run build
npm run check
```

Den geänderten Feed vor dem nächsten Sync dauerhaft sichern/committen. Lokalen Sync und den GitHub-Workflow nicht parallel betreiben. Der normale Build funktioniert weiterhin ohne Netzwerk und ohne Token. `npm run check` testet zusätzlich Auswahl, Bearbeitungen, Weiterleitungen, Datenschutzfilter, Webhook-Schutz und HTML-Escaping anhand künstlicher Nachrichten; echte API-Zugriffe erfolgen dabei nicht.

Referenzen: [Telegram Bot API](https://core.telegram.org/bots/api#getupdates), [Webhook-Prüfung](https://core.telegram.org/bots/api#getwebhookinfo), [GitHub Pages mit Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

Der Telegram-Bereich ist ein responsives, scrollbares Chatfenster (maximal 560 px hoch und 760 px breit; Nachrichtenblasen maximal 600 px breit). JavaScript zeigt beim Laden zunächst die neueste Nachricht am unteren Ende. Nach der ersten Interaktion bleibt die Scrollposition unter Kontrolle des Besuchers. Ohne JavaScript beginnt das Fenster oben bei der ältesten Nachricht. Der Bereich ist per Tastatur fokussierbar; beim Drucken werden alle Nachrichten vollständig angezeigt.
