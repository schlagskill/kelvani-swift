UI release 0.6.0 · gemeinsame Produktfamilie

Gemeinsame UI-Quelle und Synchronisierung: assets/ui/README.md.

# KelvaniSwift (kelvani.net)

Kostenlose, quelloffene Tab-Arbeitsbereiche für Chrome und Edge. **Version 0.6.0:** Ein Klick auf das Erweiterungssymbol öffnet ein kompaktes Popup über der aktuellen Website. Über den Pfeil oben rechts öffnest du den großen Manager in einem eigenen Browser-Tab. Beide Ansichten verwenden dieselben lokalen Daten.

Installierbare Entwicklungsversion unter MIT-Lizenz, ohne Konto, Server oder Cloud-Sync. Kein Store-Release und keine vollständige Workona-Funktionsgleichheit.

## Installation und Aktualisierung

1. Erweiterungspaket entpacken; der gewählte Ordner muss `manifest.json` enthalten.
2. `chrome://extensions` oder `edge://extensions` öffnen und Entwicklermodus aktivieren.
3. **Entpackt laden** wählen und diesen Ordner auswählen.
4. KelvaniSwift an die Browserleiste anheften und das Symbol anklicken.
5. Im Popup schnell suchen, Links öffnen oder ein Fenster sichern. Der Pfeil **In großem Tab öffnen** öffnet bzw. fokussiert die große Ansicht und übernimmt den ausgewählten Arbeitsbereich.

Bei einer bestehenden Installation: zuerst unter Einstellungen ein Backup exportieren, Dateien **im bisherigen Installationsordner** ersetzen und die Erweiterung auf der Erweiterungsseite neu laden. Ein anderer Ordner kann eine neue Erweiterungs-ID und getrennte Daten erzeugen. Bestehende v1-Daten und Backups bleiben lesbar.

## Arbeitsbereiche und Tabs

### Neu in 0.4.1: Einstieg und Vorlagen

- Eine Übersicht zeigt deine Projekte und erklärt den Einstieg in drei Schritten. **So funktioniert Swift** bleibt jederzeit erreichbar.
- Sechs zweisprachige Startvorlagen: Entwicklung, Recherche, Lernen & Schule, 3D-Druck, Schreiben und persönliche Planung.
- Vor dem Anlegen lassen sich Name, Farbe, Symbol und Links bearbeiten. Links kannst du auswählen, ergänzen oder entfernen. Das Anlegen öffnet noch keine Websites.
- Bis zu 50 eigene Vorlagen speichern und bearbeiten. Bestehende Arbeitsbereiche lassen sich über **Als Vorlage speichern** wiederverwenden. Eine Vorlage und daraus angelegte Bereiche bleiben unabhängig.
- Backups enthalten eigene Vorlagen. Alte Backups ohne Vorlagen bleiben lesbar; bei einem Import bleiben unterschiedliche Versionen erhalten.
- Die kleine Ansicht bleibt 460 × 580 Pixel groß. Die große Ansicht übernimmt den ausgewählten Bereich beziehungsweise die Vorlagen- oder Startansicht.

- Leere Bereiche anlegen, umbenennen, duplizieren, favorisieren sowie Farbe und Symbol wählen.
- Im großen Manager Bereiche per Ziehen sortieren; alternativ einen Bereich fokussieren und Alt + Pfeil hoch/runter verwenden. Favoriten und übrige Bereiche erscheinen getrennt.
- Tabs am Griff rechts ziehen: vor einen anderen Tab, ans Ende der Liste oder auf einen Arbeitsbereich in der Seitenleiste. Alternativ Checkboxen markieren und **Verschieben** verwenden. Pfeil-Buttons sortieren einzelne Tabs im großen Manager auch per Tastatur.
- Links hinzufügen, ausgewählte Links entfernen, Bereiche löschen. Entfernen betrifft gespeicherte Daten, niemals offene Browser-Tabs. Leere Bereiche bleiben erhalten. Rückgängig ist nach solchen Änderungen acht Sekunden verfügbar und überschreibt keine zwischenzeitlichen Änderungen anderer Swift-Ansichten.
- Zentrale Suche nach Bereichsnamen, Tab-Titeln und URLs. Strg/⌘ + K fokussiert die Suche, Esc hebt Suche und Auswahl auf bzw. beendet Ziehen.
- Deutsch/Englisch und Hell/Dunkel/System unter Einstellungen. Backup-Export enthält auch Darstellungs- und Spracheinstellungen. Import führt Bereiche zusammen, behält aktuelle Einstellungen und verlangt eine Bestätigung.

**Gespeichert und offen sind getrennt:** Die Ansicht Offene Tabs zeigt unterstützte Web-Tabs normaler Browserfenster. Ein Klick fokussiert den echten Tab. Ein Fenster oder eine Auswahl lässt sich neu sichern, zu einem Bereich hinzufügen oder bewusst als Ersatz seiner Sicherung speichern. Die Vorschau zeigt Anzahl und ausgelassene Tabs. Es gibt keinen automatischen Abgleich.

**Öffnen ohne unnötige Duplikate:** Bereits offene HTTP(S)-Adressen in normalen, nicht privaten Fenstern werden wiederverwendet. Fehlende Links öffnen im aktuellen normalen Fenster; ist es nicht verfügbar, entsteht ein neues Fenster. URLs werden vollständig verglichen, einschließlich Parametern und Fragmenten. Bereits offene Tabs werden nicht umsortiert oder geschlossen. Pins neu erstellter Tabs werden übernommen. Teilfehler lassen sich erneut versuchen; Swift prüft dabei wieder, welche Links inzwischen offen sind.

Die Tab-Wiederherstellung läuft im Erweiterungs-Hintergrund weiter, wenn das Popup beim Fensterwechsel geschlossen wird. Ein lokaler Ergebnisbericht macht Teilfehler beim nächsten Öffnen sichtbar. Gleichzeitige Öffnen-Anfragen beider Ansichten werden nacheinander verarbeitet.

## Datenschutz und Grenzen

Nur `storage` und `tabs` werden benötigt. Keine Host-Berechtigungen, Telemetrie, Remote-Scripts, Remote-Schriften, Seiteninhalte oder Anmeldedaten. Alle Assets werden lokal geladen. Eine geöffnete Website wird erst beim bewussten Öffnen ihrer URL kontaktiert. Private, interne und unsichere URLs sowie eingebettete Zugangsdaten werden nicht gesichert.

Gespeichert werden URLs, Titel, Pins, Sicherungszeitpunkt, Fensterquelle, Bereichseigenschaften und Einstellungen. Der letzte Öffnen-Bericht bleibt lokal bis zur nächsten Öffnen-Aktion; Fehler daraus werden höchstens einen Tag lang erneut angezeigt. Backups enthalten persönliche Webadressen. Vor Deinstallation exportieren, da Browser-Erweiterungsdaten dabei verloren gehen.

Maximal 100 Bereiche, je 200 unterschiedliche Web-Tabs, URLs bis 8192 Zeichen und Importdateien bis 2 MB. Kapazitäts- und Schreibfehler brechen Änderungen ab; Verschieben in einen vollen Bereich verliert keine Quell-Tabs. Import überspringt identische Bereiche; verschiedene Versionen mit gleicher ID bekommen eine eigene ID.

## Entwickeln und Prüfen

Kein Build und keine Laufzeitbibliotheken erforderlich. Node.js 22+: `npm test`.

HTTP-Vorschau: im Repository `python -m http.server 8080 --bind 127.0.0.1`, danach `http://127.0.0.1:8080/index.html` oder `popup.html` öffnen. Die Vorschau nutzt getrennte localStorage-Daten, die Erweiterung chrome.storage.local. Browser-Aktionen sind in der Vorschau deaktiviert; der Vergrößern-Button wechselt dort im selben Vorschau-Tab in die große Ansicht. Beispieldaten werden nur auf ausdrücklichen Klick in Einstellungen geladen. Dateisystem-URLs werden nicht unterstützt.

Web Locks serialisiert Änderungen von Popup und Manager. API-Tests mit Test-Doubles und HTTP-Oberflächenprüfungen bestätigen keinen echten Chrome-/Edge-Installationstest. Ausgeführte Prüfungen und verbleibende native Prüfschritte: [TESTING.md](TESTING.md).

## Herkunft

Eigenständiger Kelvani-Code für schlagskill mit OpenAI-Coding-Unterstützung. Original-Logo vom Projektinhaber; die PNG-Datei bleibt unverändert, im dunklen Modus wird sie durch CSS angepasst. Kein kopiertes Repository und keine fremden Spendenlinks.

Inter: [rsms.me/inter](https://rsms.me/inter/), SIL Open Font License 1.1, siehe assets/Inter-OFL.txt. Code: MIT, siehe LICENSE. Die Code-Lizenz ist keine Erlaubnis, als Kelvani aufzutreten. Die bereitgestellten Erweiterungsicons bleiben erhalten.

Issues mit Browser-Version, Schritten und erwartetem/tatsächlichem Verhalten sind willkommen. Keine privaten Links oder echten Backups veröffentlichen.

## Verbesserungen in 0.4.1

Die große Ansicht wird beim Wiederöffnen nicht mehr neu geladen. Ein offener Eingabedialog bleibt erhalten; der angeforderte Arbeitsbereich wechselt erst nach dem Schließen. Neue Suche hebt eine bestehende Tab-Auswahl auf, damit unsichtbare Links nicht versehentlich entfernt oder geöffnet werden. Die Auswahl lässt sich auch mit × aufheben. Tastaturfokus bleibt bei sortierten Tab-Buttons erhalten.


## Aktuelle Änderungen 0.6.0

Eigenständiges 360px-Popup: Fenster sichern, suchen, wieder öffnen und große Ansicht aufrufen. Große Übersicht mit echten Bestandszahlen, Favoritenfilter und drei Sortierungen. K-Logo in Lila.

Nach dem Ersetzen der Dateien die entpackte Erweiterung im Browser neu laden. Das ZIP allein aktualisiert keine bereits installierte Erweiterung.
