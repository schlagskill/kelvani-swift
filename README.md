# KelvaniSwift

KelvaniSwift sichert Tab-Arbeitsbereiche lokal und öffnet sie in neuen Fenstern. Version 0.2.0 bietet Bereichskarten, Suche, Tab-Liste mit Detailansicht, Einzel- und Mehrfachauswahl, Umbenennen/Entfernen mit Rückgängig sowie eine getrennte Ansicht offener Fenster. Darstellung: Hell, Dunkel oder System.

Kostenlos, MIT-lizenziert, ohne Konto oder Server. Oberfläche auf Deutsch. Dies ist eine installierbare **Entwicklungsversion**, noch kein Chrome-Web-Store-/Edge-Add-ons-Release.

## In Chrome oder Edge installieren

1. Repository als ZIP herunterladen und entpacken (oder das vorbereitete Erweiterungspaket verwenden).
2. `chrome://extensions` bzw. `edge://extensions` öffnen und **Entwicklermodus** einschalten.
3. **Entpackt laden** wählen und den Ordner mit `manifest.json` auswählen.
4. Das Erweiterungssymbol anklicken: Der lokale Arbeitsbereich-Manager öffnet sich in einem eigenen Tab.

Zum Aktualisieren zuerst ein Backup exportieren, Dateien im selben Erweiterungsordner austauschen und die Erweiterung auf der Erweiterungsseite neu laden. Ein neuer Installationsordner kann eine andere Erweiterungs-ID und getrennte Daten erzeugen.

## Datenschutz und Rechte

`storage` und `tabs`: zum lokalen Speichern sowie Lesen von Titeln/URLs der Browserfenster. Private Fenster werden nicht gesichert. Interne, unsichere und doppelte URLs werden ausgelassen. Manuelle Sicherung ist kein Live-Sync. Öffnen schließt keine vorhandenen Tabs. Gesichert werden URLs, Titel, Pins, Zeitpunkt und Fensterquelle, keine Seiteninhalte oder Anmeldungen.

Alle App-Assets und Schriften sind lokal. Keine Telemetrie, Remote-Scripts, Remote-Fonts oder Cloud-Synchronisierung. Der Markenlink öffnet kelvani.net nur auf Klick. Das Projekt benötigt keine gehostete Domain. Normales Öffnen einer gespeicherten Website kontaktiert diese Website.

Beim Deinstallieren gehen Erweiterungsdaten verloren: vorher exportieren. Backups enthalten persönliche Links/Notizen bzw. Tab-URLs und sollten privat bleiben. Es werden nur HTTP(S)-URLs ohne eingebettete Zugangsdaten akzeptiert.

## Verhalten und Grenzen

100 Arbeitsbereiche, je 200 unterschiedliche Web-Tabs, Import bis 2 MB. Bestehende v0.1-Backups bleiben gültig. Import führt Daten zusammen, überspringt identische Bereiche und erhält verschiedene Versionen mit gleicher ID. Gespeicherte Tabs lassen sich entfernen; mindestens einer bleibt. Zum vollständigen Entfernen Verwalten verwenden. Teilfehler beim Öffnen werden angezeigt; erneuter Versuch öffnet nur fehlgeschlagene URLs im bereits erstellten Fenster.

## Entwickeln und prüfen

Keine Bibliotheksinstallation und kein Build-Schritt nötig. Node.js 22+:

```sh
npm test
```

HTTP-Vorschau: `python -m http.server 8080 --bind 127.0.0.1`, dann http://127.0.0.1:8080 öffnen. Die Vorschau nutzt localStorage, Erweiterungen chrome.storage.local. Vorschau- und Erweiterungsdaten sind getrennt. HTML direkt vom Dateisystem zu öffnen wird nicht unterstützt. Web Locks serialisiert Änderungen mehrerer App-Tabs.

Automatisierte Tests prüfen Datenlogik und Speicherung sowie Browser-API-Abläufe mit Test-Doubles. UI-Abläufe werden in der HTTP-Browser-Vorschau geprüft. Das ersetzt keinen echten Installationstest in Chrome und Edge. Die verbleibenden nativen Prüfungen und Ergebnisse stehen in [TESTING.md](TESTING.md).

## Herkunft und Assets

Eigenständiger Kelvani-Code für schlagskill mit OpenAI-Coding-Unterstützung. Design nach dem Kelvani-Brandbook v3; Original-Logo vom Projektinhaber, unverändert. Keine fremde Repository-Historie und keine fremden Spendenlinks.

Inter: https://rsms.me/inter/ · SIL Open Font License 1.1, siehe assets/Inter-OFL.txt. Code: MIT, siehe LICENSE. Die Logo-Datei wird für die Marke mitgeliefert; die Code-Lizenz ist keine Erlaubnis, als Kelvani aufzutreten. Toolbar-Symbol-Master und Store-Assets stehen noch aus.

Issues mit Browser-Version, Schritten sowie erwartetem/tatsächlichem Verhalten sind willkommen. Keine privaten Daten oder echten Backups veröffentlichen.
