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

Die fertig gebauten `index.html` und `en.html` werden mit versioniert. Das bestehende GitHub-Pages-Hosting aus dem Repository-Stamm kann unverändert weiterlaufen. Vor dem Push immer bauen und prüfen; es werden keine GitHub Actions, externen Bibliotheken oder Node-Prozesse auf dem Host benötigt. `CNAME` bleibt erhalten. `.nojekyll` deaktiviert unnötige Jekyll-Verarbeitung.

Für einen späteren IONOS-/Linux-Server genügen `index.html`, `en.html`, `styles.css`, `site.js` und `assets/` im Webroot von nginx oder Apache. Alle lokalen URLs sind relativ, daher funktioniert die Seite auch in einem Unterverzeichnis. Keine SPA-Rewrites nötig.

## Späteres Payload CMS

Darstellung und Inhalte sind bereits getrennt. Als nächste Ausbaustufe lassen sich `meetings`, `gospel` und `testimonies` auf Payload Collections sowie Einladung und Kontakte auf Globals abbilden. Ein Build-Schritt kann die veröffentlichten Inhalte serverseitig aus Payload abrufen und im gleichen JSON-Format an diesen Generator übergeben. Das Frontend bleibt statisch; Aktualisierungen können per Webhook einen neuen Build auslösen. API-Zugangsdaten gehören ausschließlich in die Build-Umgebung. Payload selbst ist noch nicht installiert oder integriert.

## Bedienung und externe Dienste

Alle Inhalte, Sprunglinks und Aufklappbereiche funktionieren ohne JavaScript. Die Farbnavigation bleibt innerhalb des Evangeliums-Bereichs unter der Hauptnavigation sichtbar; kleine Displays zeigen alle sechs Farben in zwei Reihen. JavaScript ergänzt die aktuelle Leseposition. Reduzierte Bewegung wird berücksichtigt.

Source Sans 3 wird wie gewünscht direkt von Google Fonts geladen, mit System-Sans-Serif als Fallback. Google Fonts stellt dabei eine externe Verbindung her. Karten, Zoom und soziale Kanäle werden nur als Links angeboten, nicht eingebettet. Die Website verwendet keine Analytics und setzt selbst keine Cookies.

Im bisherigen Projekt waren keine Impressums- oder Datenschutzhinweise enthalten. Entsprechende Betreiberangaben und Texte sind weiterhin vom Betreiber bereitzustellen; es wurden keine Angaben erfunden.
