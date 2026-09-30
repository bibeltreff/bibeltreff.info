# Bibeltreff Stuttgart

Schlichte, statische Website für [bibeltreff.info](https://bibeltreff.info). Fokus: Einladung, Evangelium in Farben und persönliche Zeugnisse.

## Lokal ansehen

Node.js 20.9 oder neuer. Beim ersten Start die Build-Abhängigkeiten installieren:

```sh
npm ci
npm run dev
```

Öffnet einen lokalen Server unter `http://127.0.0.1:4173`. Alternativ `node scripts/serve.mjs`. Der Server baut beim Start die Seite; nach Inhaltsänderungen `npm run build` ausführen und den Browser neu laden. CSS und JavaScript benötigen nur ein Neuladen. Ein anderer Port lässt sich über `PORT` setzen.

## Inhalte und Gestaltung ändern

### Fotos automatisch verkleinern

Originalfotos unter `assets/images/` ablegen und in `src/index.html` mit ihrem Originalpfad einbinden, zum Beispiel:

```html
<img src="assets/images/mein-foto.jpg" alt="Beschreibung des Fotos">
```

`npm run build` erstellt automatisch eine WebP-Vorschau mit höchstens 1200 Pixeln Breite unter `assets/previews/`, setzt die passenden Bildmaße und verlinkt das Original zum Öffnen per Klick. Vorhandene Links bleiben erhalten. Das Original wird nicht verändert; zum Austauschen einfach die Datei ersetzen und erneut bauen. Auch Telegram-Fotos werden beim Build verarbeitet. SVG, GIF, externe Bilder, dekorative Bilder mit `alt=""` sowie Bilder mit `srcset` oder innerhalb von `<picture>` werden nicht verarbeitet.

Vorschaudateinamen hängen vom Bildinhalt ab, damit ausgetauschte Fotos keine veraltete Vorschau aus dem Browsercache zeigen. Originale, erzeugte Vorschauen und die beiden HTML-Seiten gemeinsam einchecken; der Deployment-Workflow erzeugt die Vorschauen ebenfalls automatisch. Nur eine Datei in den Bilderordner zu legen fügt sie noch nicht zur Seite hinzu: Sie muss auch im Template eingebunden sein.

### Inhaltsdateien

- `content/shared.json`: Sprachunabhängige Daten, die für beide Sprachen gelten: Wochentag, Uhrzeiten, Adresse, Karten- und Zoom-Link der Treffen, Farben und Reihenfolge der Evangeliums-Themen die URLs der Kontakt- und Kanal-Links sowie die Reihenfolge der Zeugnisse.
- `content/site.json`: Deutsche Texte: Einladung, Beschreibung der Treffen, Beschriftungen der Kontaktlinks und Datenschutztexte.
- `content/site.en.json`: Englische Übersetzung dieser Texte.
- `content/gospel.de.json` und `content/gospel.en.json`: Die sechs Evangeliums-Themen auf Deutsch und Englisch, mit gekürzten NKJV-Bibelzitaten in der englischen Fassung. Die Kapitel-IDs (`plan`, `problem` usw.) stehen direkt auf oberster Ebene.
- `content/zeugnisse/de/` und `content/zeugnisse/en/`: Zeugnisse als Markdown, eine Datei pro Zeugnis und Sprache (siehe „Zeugnisse schreiben“).
- `content/legal.json`: Betreiberangaben für Impressum und Datenschutzerklärung.
- `content/ui.de.json` und `content/ui.en.json`: Beschriftungen, Navigation, Hinweise und barrierefreie Texte beider Sprachen.
- `src/layout.html`: Gemeinsames Seitengerüst aller Seiten (Kopf, Navigation mit Artikel-Menü, Fußbereich) mit Platzhaltern für beide Sprachen.
- `src/index.html`: Inhalt der Startseite; wird in `src/layout.html` eingesetzt.
- `styles.css`: Responsive Gestaltung; Hauptfarbe ist das Blau aus dem PDF `#1d61b2` (`--accent`).
- `site.js`: Markierung des aktuellen Evangeliums-Themas und Messung der haftenden Navigation.
- `assets/meeting-status.js`: Zeigt den sanft pulsierenden blauen Punkt nur zu den veröffentlichten wöchentlichen Treffzeiten (Zeitzone Europe/Berlin). Bei reduzierter Bewegung bleibt er ruhig; ohne JavaScript bleibt er verborgen.
- `assets/documents/evangelium-in-farben.pdf`: Aktuelles deutsches Originalheft als Download (Fassung `Das_Evangelium_in_Farben_3_Uni_GER.pdf`).
- `index.html` und `en.html`, `artikel/` und `articles/`: Generierte deutsche und englische Seiten. Änderungen hier werden beim Bauen überschrieben; `artikel/` und `articles/` werden dabei jedes Mal komplett neu erzeugt.

Deutsch bleibt die Standardsprache. Der Sprachlink in der Kopfzeile öffnet `en.html` beziehungsweise `index.html` und funktioniert ohne JavaScript. Beide Seiten haben eigene Metadaten sowie gegenseitige `hreflang`-Verweise. Das Originalheft bleibt deutsch und ist auf der englischen Seite als „German PDF“ gekennzeichnet.

Englische Bibelzitate folgen der NKJV, auch in der Einleitung und im Zeugnis. Auslassungen in gekürzten Versen sind mit „…“ markiert; Johannes 3:16 bleibt auf zwei Themen verteilt. Übersetzungsunterschiede bleiben erhalten: 1. Petrus 2:2 endet mit „grow thereby“, Offenbarung 5:10 verwendet „us“ und „we“. Offenbarung 20:14 wird vollständig zitiert, damit Feuersee und zweiter Tod im Zusammenhang bleiben. Der englische Fußbereich enthält den NKJV-Quellenhinweis. Wortlaut geprüft anhand der [NKJV bei Bible Gateway](https://www.biblegateway.com/versions/New-King-James-Version-NKJV-Bible/).

Das kleine Symbol oben rechts bietet die Farbschemata Systemstandard, Hell und Dunkel an. Standardmäßig folgt die Seite dem System, auch ohne JavaScript. Eine manuelle Auswahl wird lokal im Browser gespeichert; „Systemstandard“ hebt sie wieder auf. Das Drucklayout bleibt hell.

Nach Änderungen an Inhalten oder Vorlage:

```sh
npm run build
npm run check
```

`check` prüft beide Sprachen: interne Sprungziele, eindeutige und übereinstimmende IDs, lokale Assets, Link-Schemata, PDF, Textkodierung, Sprachlinks und das Vorhandensein aller Themen und Zeugnisse. Außerdem müssen Übersetzungsschlüssel und Inhaltsstruktur übereinstimmen. Browserprüfung bleibt für Darstellung und Bedienung notwendig.

In `content/shared.json` stehen nur Daten, die nicht übersetzt werden. Sichtbare Wörter bleiben immer in der Sprachdatei, auch wenn sie in beiden Sprachen gleich lauten (etwa „WhatsApp“ oder „Gold“). Jeder Eintrag in `meetings`, `gospel`, `contact` und `social` hat in `shared.json` eine `id`; die Sprachdateien enthalten unter derselben `id` die Texte dazu. Die Reihenfolge bestimmt `shared.json`. Ein neues Treffen braucht also einen Eintrag in `shared.json` (`id`, `weekday` als englischer Kleinbuchstaben-Name wie `wednesday`, `start`, `end`, `address`, `map`, optional `online`) und in beiden Sprachdateien einen Eintrag mit `label`, `location` und `note`. Fehlt eine `id` in einer Sprache oder gibt es sie nur dort, bricht der Build mit einer Fehlermeldung ab.

Die Texte zu `gospel` stehen in `content/gospel.de.json` und `content/gospel.en.json`; IDs, Farben und Reihenfolge bleiben in `content/shared.json`. Bei jedem Thema werden alle Bibelstellen in `verses` direkt angezeigt. Zusätzliche Stellen können in `moreVerses` eingetragen werden, ebenfalls als Objekte mit `text` und `reference`. Nur wenn `moreVerses` Einträge enthält, erscheint darunter „Weitere Bibelstellen +“ zum Aufklappen. Ein leeres oder weggelassenes `moreVerses` erzeugt keinen Aufklappbereich.

Treffzeiten und der Treffpunkt am grünen Tisch stammen auf Wunsch des Betreibers aus dem PDF. Die Kontakt-, Kanal- und Zoom-Links stammen von der bisherigen Website. Sonntag bleibt mit anschließendem Mittagessen. Bibelzitate und Erläuterungen folgen dem bereitgestellten Heft; die Farbreihenfolge ist Gold, Schwarz, Rot, Weiß, Grün, Gold.

### Zeugnisse schreiben

Jedes Zeugnis ist eine Markdown-Datei pro Sprache: `content/zeugnisse/de/<id>.md` und `content/zeugnisse/en/<id>.md`. Der Dateiname ohne `.md` ist die `id`; er darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten und erscheint als Sprungmarke `#zeugnis-<id>`. Die Reihenfolge auf der Seite bestimmt die Liste `testimonies` in `content/shared.json`.

```markdown
---
name: Maria
headline: Ein Satz, der als Überschrift erscheint.
intro: Eine kurze Zeile unter der Überschrift.
---

Erster Absatz. Ein Absatz darf über mehrere Zeilen gehen;
erst eine Leerzeile beginnt einen neuen Absatz.

> Denn so hat Gott die Welt geliebt …
> — Johannes 3:16

Weiter geht es nach dem Bibelzitat.
```

- Zwischen den beiden `---` stehen genau die Felder `name`, `headline` und `intro`, jeweils in einer Zeile.
- Ein Bibelzitat ist ein Block, dessen Zeilen alle mit `>` beginnen. Die letzte Zeile nennt nach einem Gedankenstrich (`—`, `–` oder `--`) die Stelle.
- Der Text bleibt schlicht: Überschriften, Listen, Links und Formatierungen wie `**fett**` werden nicht unterstützt. Anführungszeichen um Überschrift und Zitat setzt die Seite selbst.

Wie ein neues Zeugnis angelegt wird, steht unter „Neue Inhalte anlegen“.

Jedes Zeugnis erhält automatisch ein per Maus, Touch und Tastatur bedienbares Aufklappelement. Die vorhandenen Zeugnisse stammen von Can Luca und Thomas; Rechtschreibung, Zeichensetzung und Absatzgliederung wurden leicht geglättet, die inhaltlichen Aussagen beibehalten. Thomas’ englisches Bibelzitat verwendet einen gekürzten [NKJV-Wortlaut von Philipper 3:8](https://www.biblegateway.com/passage/?search=Philippians+3%3A8&version=NKJV).

### Artikel

Die Artikel von [hochschul-bibelkreise.de](https://hochschul-bibelkreise.de/category/neues-aus-dem-bibelkreis/) liegen als Markdown unter `content/artikel/de/<serie>/<id>.md`, ihre Bilder unter `assets/artikel/<serie>/<id>/`. Die Serien entsprechen den Themen der alten Website: `das-buch-offenbarung`, `das-reich-gottes-in-den-verschiedenen-zeitaltern`, `der-traum-nebukadnezars`, `die-aufstiegslieder`, `die-stiftshuette`, `hesekiel-tempel` und `zion-die-wohnung-gottes`. Die angezeigten Namen der Themen stehen in beiden Sprachen in `content/artikel/themen.json`; die Reihenfolge dort entspricht dem Menü der alten Website. Die `id` ist der Slug des deutschen Originals. Eine englische Fassung ist optional und liegt mit derselben Serie und `id` unter `content/artikel/en/<serie>/`. Übernommen wurden alle 68 deutschen Artikel und die 9 vorhandenen englischen Fassungen; weitere Artikel sollen nur noch neu übersetzt werden.

Der Build erzeugt daraus statische Seiten: `artikel/` (Übersicht), `artikel/<serie>/` (alle Artikel eines Themas, neueste zuerst, mit Datum und den ersten ein bis zwei Sätzen) und `artikel/<serie>/<id>.html` (der Artikel mit Links zum älteren und neueren Artikel desselben Themas). Die englischen Seiten liegen entsprechend unter `articles/` und zeigen nur Themen mit englischen Artikeln. Der Sprachlink führt zur Übersetzung, sonst zur Übersicht der anderen Sprache. Die Übersicht zeigt den letzten Artikel, einen zufälligen Artikel und alle Themen. Im Kopf öffnet „Artikel“ bei Maus-Hover ein Menü mit „Letzter Artikel“, „Zufälliger Artikel“ und „Alle Artikel“, daneben klappen die Themen auf. Auf Touch-Geräten und schmalen Bildschirmen führt „Artikel“ direkt zur Übersicht. Der Zufall wählt JavaScript beim Klick bzw. beim Laden der Übersicht; ohne JavaScript führen beide zu einem beim Bauen festgelegten Artikel.

`date` ist der Veröffentlichungszeitpunkt (`2024-05-31` oder mit Uhrzeit `2024-05-31T18:30:00+02:00`); er bestimmt die Reihenfolge, angezeigt wird nur der Tag. Bei gleichem Zeitpunkt wird nach Titel sortiert, etwa bei elf Aufstiegsliedern, die im Original alle den 30. November 2007 tragen. Artikelbilder erhalten wie andere Bilder automatisch eine WebP-Vorschau mit Link zum Original.

```markdown
---
title: Offenbarung 11:3-14 Die zwei Zeugen
date: 2022-03-22
source: https://hochschul-bibelkreise.de/neues-aus-dem-bibelkreis/offenbarung-11-die-zwei-zeugen/
image: assets/artikel/das-buch-offenbarung/offenbarung-11-die-zwei-zeugen/Oelbaeume-752x440.jpeg
imageAlt: Die zwei Ölbäume
---

Einleitung …

## Zwischenüberschrift

> “Bibeltext …”
>
> — Offenbarung 11:3
```

`image` und `imageAlt` (Beitragsbild) sind optional und werden bisher nicht angezeigt. Anders als bei den Zeugnissen ist hier übliches Markdown erlaubt: Überschriften, `**fett**`, `*kursiv*`, Links, Listen, Bilder, Tabellen und Zeilenumbrüche mit `\` am Zeilenende. Sonstiges HTML wird als Text angezeigt, erlaubt sind nur `<u>` und `<br>`. `#`-Überschriften werden zu Zwischenüberschriften, weil der Titel die Seitenüberschrift ist. Ein Zitat, dessen letzter Absatz mit `—` beginnt, zeigt diesen als Quellenangabe. Entfernt wurden beim Import nur Inhaltsverzeichnis, Telegram-Button und Seitenleiste. Links auf importierte Artikel und Themen der alten Website führen beim Bauen auf die neuen Seiten.

### Neue Inhalte anlegen

Nach jeder Änderung `npm run build` und `npm run check` ausführen und das Ergebnis mit `npm run dev` im Browser ansehen. Fehlermeldungen nennen Datei und, wo möglich, Zeile. Dateinamen und `id`s bestehen nur aus Kleinbuchstaben, Ziffern und Bindestrichen, also ohne Umlaute: `ae`, `oe`, `ue`, `ss`.

**Ein neues Zeugnis**

1. `content/zeugnisse/de/<id>.md` und `content/zeugnisse/en/<id>.md` im Format aus „Zeugnisse schreiben“ anlegen, zum Beispiel `content/zeugnisse/de/maria.md`. Beide Sprachen sind Pflicht.
2. Die `id` (hier `maria`) in `content/shared.json` unter `testimonies` an der Stelle eintragen, an der das Zeugnis erscheinen soll.
3. Bauen und prüfen.

**Ein neuer Artikel**

1. Das Thema wählen, also einen Ordner unter `content/artikel/de/`, etwa `das-buch-offenbarung`. Für ein neues Thema zuerst die Kategorie anlegen (siehe unten).
2. `content/artikel/de/<thema>/<id>.md` anlegen. Die `id` wird Teil der Adresse (`artikel/<thema>/<id>.html`) und darf in keinem anderen Thema schon vorkommen.

   ```markdown
   ---
   title: Offenbarung 12 Die Frau und der Drache
   date: 2026-10-07
   ---

   Der erste Absatz erscheint gekürzt in der Übersicht und in der Themenliste.

   ## Zwischenüberschrift

   > “Und ein großes Zeichen erschien im Himmel …”
   >
   > — Offenbarung 12:1

   ![Beschreibung des Bildes](assets/artikel/das-buch-offenbarung/offenbarung-12-die-frau-und-der-drache/zeitstrahl.jpg)
   ```

   Pflicht sind nur `title` und `date`. Der Anrisstext in Übersicht und Themenliste (zugleich die Seitenbeschreibung für Suchmaschinen) entsteht automatisch aus den ersten ein bis zwei Sätzen des ersten Absatzes und endet immer mit „…“. Wer ihn selbst formulieren möchte, trägt ihn optional als einzeiliges `excerpt: Mein eigener Anrisstext.` ein; dieser Text wird unverändert und ohne „…“ angezeigt. `source` gibt es nur bei den importierten Artikeln. Mehrere Artikel am selben Tag lassen sich mit Uhrzeit ordnen, zum Beispiel `date: 2026-10-07T19:30:00+02:00`.
3. Bilder unter `assets/artikel/<thema>/<id>/` ablegen und mit dem Pfad ab `assets/` einbinden, wie im Beispiel. Die Beschreibung in `![…]` ist der Alternativtext. Die Vorschau erzeugt der Build.
4. Optional die englische Fassung als `content/artikel/en/<thema>/<id>.md` mit gleichem Thema und gleicher `id` anlegen. Ohne sie erscheint der Artikel nur auf Deutsch; der Sprachlink führt dann zur englischen Übersicht.
5. Bauen und prüfen. Der neue Artikel erscheint automatisch als „Letzter Artikel“, in seinem Thema und im Zufall.

**Eine neue Artikelkategorie (Thema)**

1. In `content/artikel/themen.json` einen Eintrag hinzufügen. `id` ist der Ordnername, `de` und `en` die angezeigten Namen; beide sind Pflicht, auch wenn es noch keine englischen Artikel gibt. Die Reihenfolge in der Datei bestimmt die Reihenfolge in Menü und Übersicht.

   ```json
   {
     "id": "das-evangelium-nach-johannes",
     "de": "Das Evangelium nach Johannes",
     "en": "The Gospel of John"
   }
   ```
2. Den Ordner `content/artikel/de/<id>/` anlegen und darin den ersten Artikel schreiben. Ein Thema ohne Artikel wird nicht angezeigt. Im Englischen erscheint es erst mit dem ersten englischen Artikel in `content/artikel/en/<id>/`.
3. Bilder kommen nach `assets/artikel/<id>/<artikel-id>/`.
4. Bauen und prüfen. Das Thema erscheint automatisch im Menü unter „Alle Artikel“, in der Übersicht und mit eigener Seite `artikel/<id>/`.

## Statisches Hosting

Die fertig gebauten `index.html` und `en.html` werden mit versioniert. Das bestehende GitHub-Pages-Hosting aus dem Repository-Stamm kann unverändert weiterlaufen. Vor dem Push immer bauen und prüfen; ohne automatischen Telegram-Import werden keine GitHub Actions, externen Bibliotheken oder Node-Prozesse auf dem Host benötigt. Für automatische Kanalnachrichten dient der unten beschriebene optionale Workflow. `CNAME` bleibt erhalten. `.nojekyll` deaktiviert unnötige Jekyll-Verarbeitung.

Für einen späteren IONOS-/Linux-Server genügen `index.html`, `en.html`, `styles.css`, `site.js`, `assets/`, `artikel/` und `articles/` im Webroot von nginx oder Apache. Alle lokalen URLs sind relativ, daher funktioniert die Seite auch in einem Unterverzeichnis. Keine SPA-Rewrites nötig; Ordner wie `artikel/` müssen nur ihre `index.html` ausliefern, wie es nginx, Apache und GitHub Pages standardmäßig tun.

## Späteres Payload CMS

Darstellung und Inhalte sind bereits getrennt. Als nächste Ausbaustufe lassen sich `meetings`, `gospel` und die Zeugnisse auf Payload Collections sowie Einladung und Kontakte auf Globals abbilden. Ein Build-Schritt kann die veröffentlichten Inhalte serverseitig aus Payload abrufen und im gleichen JSON-Format an diesen Generator übergeben. Das Frontend bleibt statisch; Aktualisierungen können per Webhook einen neuen Build auslösen. API-Zugangsdaten gehören ausschließlich in die Build-Umgebung. Payload selbst ist noch nicht installiert oder integriert.

## Bedienung und externe Dienste

Alle Inhalte, Sprunglinks und Aufklappbereiche funktionieren ohne JavaScript. Die Farbnavigation bleibt innerhalb des Evangeliums-Bereichs unter der Hauptnavigation sichtbar; kleine Displays zeigen alle sechs Farben in zwei Reihen. JavaScript ergänzt die aktuelle Leseposition. Reduzierte Bewegung wird berücksichtigt.

Source Sans 3 (SIL Open Font License, siehe `assets/fonts/OFL.txt`) liegt als variable WOFF2-Schrift (Gewichte 400–700, Teilmengen Latin und Latin Extended) unter `assets/fonts/` und wird selbst ausgeliefert, mit System-Sans-Serif als Fallback. Es gibt keine Verbindung zu Google Fonts. Die Lagekarte ist ein OpenStreetMap-iframe (ohne JavaScript, ohne API-Key, ohne Tracking-Cookies); dabei lädt der Browser Kartenkacheln von openstreetmap.org. Routen, Zoom und soziale Kanäle werden nur als Links angeboten, nicht eingebettet. Die Website verwendet keine Analytics und setzt selbst keine Cookies.

Impressum und Datenschutzerklärung stehen als ausklappbare Bereiche im Fußbereich (Sprungmarke `#datenschutz`). Die Betreiberangaben (Gruppenname, verantwortliche Person, Anschrift, E-Mail, optionaler Vereinsregistereintrag, Stand der Datenschutzerklärung) stehen einmal in `content/legal.json` und gelten für beide Sprachen; ein leerer `register` blendet den Registereintrag aus. Die Texte der Datenschutzerklärung stehen unter `privacy` in `content/site.json` und `content/site.en.json`. Solange `content/legal.json` noch „BITTE ERGÄNZEN“ enthält, gibt `npm run check` eine Warnung aus.

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
