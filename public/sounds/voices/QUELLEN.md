# Tierstimmen: Herkunft und Lizenz

Jede Datei in diesem Ordner hat hier eine Zeile. Eine Datei ohne Zeile wird nicht ausgeliefert
(`src/infrastructure/audio/creatureVoices.test.ts`). Geschnitten mit `scripts/stimme-schneiden.sh`:
Mono, 44,1 kHz, MP3 64 kbit/s, höchstens 1,5 s, Spitze −3 dB. Abgerufen am 12.10.2026
(Venusfliegenfalle und T-Rex: 13.10.2026; Maus: 15.10.2026).

| Datei | Was | Urheber | Lizenz | Quelle | Ausschnitt |
|---|---|---|---|---|---|
| `crocodile.mp3` | Brüllen eines Alligators | Borisblue | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Alligatorbellowedit.ogg | ab 14,2 s, 1,3 s |
| `wolf.mp3` | Heulen eines einzelnen Wolfs („Wolf Howls Near Passing Car“, Yellowstone, 11.01.2016) | National Park Service & MSU Acoustic Atlas / Jennifer Jerrett | Public Domain (Yellowstone Sound Library: „in the public domain … used without limitation“; Nennung „National Park Service“ erbeten) | https://www.nps.gov/yell/learn/photosmultimedia/sounds-wolves.htm | ab 3,45 s, 1,5 s, 0,5 s ausgeblendet |
| `shark.mp3` | Luftblasen im Wasser (Haie sind stumm) | stephan (PDSounds) | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Water_bubbles_chortling.ogg | ab 33,75 s, 1,2 s |
| `panda.mp3` | Zwitschern eines Großen Pandas | Mizunoryu | Public Domain (vom Urheber freigegeben, PD-self) | https://commons.wikimedia.org/wiki/File:Giant_panda_twittering.ogg | ab 1,0 s, 1,2 s |
| `lion.mp3` | Brüllen eines Löwen im Zoo | த*உழவன் | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Lion_raring-sound1TamilNadu178.ogg | ab 4,9 s, 1,4 s |
| `panther.mp3` | Fauchen einer Hauskatze (Ersatz: keine gemeinfreie Leoparden-Aufnahme gefunden) | Zabuhailo (Freesound) | CC0 | https://commons.wikimedia.org/wiki/File:Cat_hissing_-_Zabuhailo.wav | ab 0,85 s, 1,2 s |
| `sabertooth.mp3` | Knurren eines Tigers (der Säbelzahntiger ist ausgestorben) | schots (Freesound 439280) | CC0 | https://commons.wikimedia.org/wiki/File:439280_schots_angry-tiger.wav | ab 23,25 s, 1,3 s |
| `flytrap.mp3` | Summen einer großen Fliege („Fly and Glass“, Nr. 0759 — die Pflanze selbst ist stumm, es summt ihre Beute) | Joseph Sardin (BigSoundBank) | CC0 („CC0 (public domain): Free and royalty-free“) | https://bigsoundbank.com/fly-and-glass-s0759.html | ab 34,8 s, 1,3 s, 0,25 s ausgeblendet |
| `trex.mp3` | Brüllen eines Alligators, **tiefer gelegt** (vom T-Rex gibt es keine Aufnahme): dieselbe Quelle wie `crocodile.mp3`, mit `ffmpeg` auf 60 % der Geschwindigkeit gebracht (`asetrate=48000*0.6`), das sind rund neun Halbtöne tiefer | Borisblue, bearbeitet von Zahn Agent | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Alligatorbellowedit.ogg | ab 14,2 s, 0,86 s der Quelle → 1,43 s, 0,3 s ausgeblendet |
| `mouse.mp3` | Quieken einer kleinen Maus, die eine Katze gefangen hat und die bei Berührung quiekt (Originaltitel „Mouse screams“: „A little mouse, caught by a cat, screams when touched“) | Joseph SARDIN (LaSonothèque / BigSoundBank, Ton Nr. 0459) | CC0 („CC0 (public domain): Free and royalty-free“) | https://bigsoundbank.com/mouse-screams-s0459.html | ab 3,50 s, 0,40 s |
| `human.mp3` | „Servus“, gesprochen von einer Männerstimme (Grundton gemessen: rund 123 Hz) | Servus heinz | Public Domain (vom Urheber freigegeben, PD-self) | https://commons.wikimedia.org/wiki/File:De-servus.ogg | ab 0,5 s, 0,8 s |
| `vampire.mp3` | gruseliges Lachen („Evil Laughter“, PDSounds Nr. 607) | stilgar | Public Domain (gemeinfrei) | https://commons.wikimedia.org/wiki/File:Evil_laughter.ogg | ab 0,2 s, 1,5 s |

Die Ausschnitte der zwölf Aufnahmen hat ein Programm gewählt (die lauteste Stelle, bei „Servus“ das
Wort ohne die Stille davor) — bei der Maus nicht die lauteste Stelle, sondern gezielt: die Aufnahme besteht aus einzelnen Quieksern
mit Pausen dazwischen, geschnitten ist ein vollständiger Quiekser aus der Mitte der Aufnahme (ab
3,50 s). Kein Mensch hat die
Ausschnitte vor dem Einbau angehört. Wer eine Stimme tauscht, schneidet neu und trägt die
neue Quelle hier ein.
