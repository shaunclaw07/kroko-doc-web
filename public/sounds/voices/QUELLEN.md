# Tierstimmen: Herkunft und Lizenz

Jede Datei in diesem Ordner hat hier eine Zeile. Eine Datei ohne Zeile wird nicht ausgeliefert
(`src/infrastructure/audio/creatureVoices.test.ts`). Geschnitten mit `scripts/stimme-schneiden.sh`:
Mono, 44,1 kHz, MP3 64 kbit/s, höchstens 1,5 s, Spitze −3 dB. Abgerufen am 12.10.2026.

| Datei | Was | Urheber | Lizenz | Quelle | Ausschnitt |
|---|---|---|---|---|---|
| `crocodile.mp3` | Brüllen eines Alligators | Borisblue | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Alligatorbellowedit.ogg | ab 14,2 s, 1,3 s |
| `wolf.mp3` | Wolfsheulen | U.S. Fish and Wildlife Service | Public Domain (Werk einer US-Bundesbehörde, PD-USGov-FWS) | https://commons.wikimedia.org/wiki/File:Wolf_howls.ogg | ab 0,15 s, 1,5 s |
| `shark.mp3` | Luftblasen im Wasser (Haie sind stumm) | stephan (PDSounds) | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Water_bubbles_chortling.ogg | ab 33,75 s, 1,2 s |
| `panda.mp3` | Zwitschern eines Großen Pandas | Mizunoryu | Public Domain (vom Urheber freigegeben, PD-self) | https://commons.wikimedia.org/wiki/File:Giant_panda_twittering.ogg | ab 1,0 s, 1,2 s |
| `lion.mp3` | Brüllen eines Löwen im Zoo | த*உழவன் | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg | ab 4,9 s, 1,4 s |
| `panther.mp3` | Fauchen einer Hauskatze (Ersatz: keine gemeinfreie Leoparden-Aufnahme gefunden) | Zabuhailo (Freesound) | CC0 | https://commons.wikimedia.org/wiki/File:Cat_hissing_-_Zabuhailo.wav | ab 0,85 s, 1,2 s |
| `sabertooth.mp3` | Knurren eines Tigers (der Säbelzahntiger ist ausgestorben) | schots (Freesound 439280) | CC0 | https://commons.wikimedia.org/wiki/File:439280_schots_angry-tiger.wav | ab 23,25 s, 1,3 s |
| `mouse.mp3` | **Platzhalter:** zwei hohe Pfeiftöne, mit `ffmpeg` generiert (keine gemeinfreie Maus-Aufnahme gefunden) | Zahn Agent | generiert, eigenes Werk | erzeugt mit ffmpeg `aevalsrc` | ganz, 0,19 s |
| `human.mp3` | **Platzhalter:** „Oh-oh" als zwei Sinustöne, mit `ffmpeg` generiert | Zahn Agent | generiert, eigenes Werk | erzeugt mit ffmpeg `sine` | ganz, 0,52 s |
| `vampire.mp3` | **Platzhalter:** Kichern als vier fallende Sinustöne, mit `ffmpeg` generiert | Zahn Agent | generiert, eigenes Werk | erzeugt mit ffmpeg `sine` | ganz, 0,45 s |

Die Ausschnitte der sieben Aufnahmen hat ein Programm gewählt (die lautesten 1,2 bis 1,5 Sekunden),
kein Mensch hat sie vor dem Einbau angehört. Wer eine Stimme tauscht, schneidet neu und trägt die
neue Quelle hier ein.
