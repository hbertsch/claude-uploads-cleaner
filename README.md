# Claude Uploads Cleaner

Chrome-Add-on ohne KI. Fügt in den claude.ai-Einstellungen unter Datenschutz → „Uploaded files" einen Knopf „Delete all uploaded files" ein. Der Knopf löscht alle hochgeladenen Dateien nacheinander.

## Installation

1. In Chrome `chrome://extensions` öffnen.
2. „Entwicklermodus" einschalten.
3. „Entpackte Erweiterung laden" wählen und diesen Ordner auswählen.

## Benutzung

1. `https://claude.ai/new#settings/data-privacy-controls/uploaded-files` öffnen.
2. Auf „Delete all uploaded files" klicken und die Rückfrage bestätigen.
3. Warten, bis „Done" erscheint. Der Tab muss dabei offen bleiben.

## Grenzen

- Das Add-on findet die Knöpfe über ihre englischen Beschriftungen („Delete", „Load more", „Uploaded files"). Mit anderer Sprache oder nach einer Änderung der Seite muss `content.js` angepasst werden.
- Text, den Claude schon aus den Dateien in Chats übernommen hat, bleibt in den Chats. Dafür müssen die Chats gelöscht werden.
