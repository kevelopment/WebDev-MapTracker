Generelle Informationen zu dem Projekt

Bearbeitet von: adamkev, felderms

Getestete Bash:
	Mac: 	Terminal
	Win: 	Git Bash


Node Version:
	5.2.0
Bemerkung:
	5.3.0 hat bei npm install unerwartete Fehler geworfen
	=> siehe: https://github.com/npm/npm/issues/17858


Skripte in package.json:

- lint 		lintet alle JS Dateien (client, server, app.js)

- build 	installiert alle npm Module, 
		lintet das Projekt, 
		konkateniert JS Dateien und Module mithilfe von Browserify,
		obfuskiert und minifiziert JS Dateien mit Babili,
		erzeugt eine minifizierte CSS Datei aus LESS mit lessc
		kopiert Dateien in /public Ordner

- debug		installiert alle npm Module,
		lintet das Projekt,
		konkateniert JS Dateien und Module mithilfe von Browserify,
		erzeugt eine minifizierte CSS Datei aus LESS mit lessc
		kopiert Dateien in /public Ordner

- start <PORT>	startet den Node Server an 8080, oder PORT

- clean		löscht public Ordner und alle node_modules


Allgemeine Ergänzungen zur Aufgabenstellung:

Wir haben uns kleinere Änderungen bzgl der Aufgabenstellung/Vorlage vorbehalten, wie z.B:
	- aktuell ausgewählter Track wird farblich hinterlegt, damit der Nutzer erkennt, 
	welchen Track er angeklickt hat

	- Marker aus Google Maps API werden an Start und Ziel Koordinaten positioniert,
	damit der Nutzer erkennt, wo Start bzw. Ende des Tracks ist 
	(Fehlen der Marker bzw fehlende Beschriftung 

	- Höhengraph hat im vgl. zur Aufgabenstellung invertierte Farben und kein Padding,
	da aus persönlicher Sicht ansprechender/dezenter aussieht 

	- Farbe des Navigationsbereich zur Paginierung geändert um Farbschema der Karte zu 
	treffen


