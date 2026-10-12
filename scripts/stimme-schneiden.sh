#!/usr/bin/env bash
# Schneidet eine Tierstimme aus einer Aufnahme und legt sie so ab, wie das Spiel sie ausliefert:
# Mono, 44,1 kHz, MP3 mit 64 kbit/s, ohne Metadaten, weich ein- und ausgeblendet und auf −3 dB
# Spitze angeglichen (bei so kurzen Stücken misst `loudnorm` nicht verlässlich).
#
# Aufruf:  bash scripts/stimme-schneiden.sh <quelle> <tier> <start-sekunden> <dauer-sekunden> [ausblenden-sekunden]
# Das Ausblenden dauert 0,12 s; ein Klang, der mitten im Ton endet (ein Heulen), braucht mehr.
# Beispiel: bash scripts/stimme-schneiden.sh "$TMPDIR/zahn_agent-stimmen/wolf/a.ogg" wolf 2.4 1.3
set -euo pipefail

quelle="$1"; tier="$2"; start="$3"; dauer="$4"; blende="${5:-0.12}"
ziel="public/sounds/voices/${tier}.mp3"
mkdir -p "$(dirname "$ziel")"

# Länger als 1,5 s wird nicht ausgeliefert.
awk -v d="$dauer" 'BEGIN { exit !(d > 0 && d <= 1.5) }' || { echo "Dauer muss zwischen 0 und 1,5 s liegen" >&2; exit 1; }

spitze=$(ffmpeg -hide_banner -ss "$start" -t "$dauer" -i "$quelle" -af volumedetect -f null - 2>&1 \
  | sed -n 's/.*max_volume: \(-\{0,1\}[0-9.]*\) dB.*/\1/p')
[ -n "$spitze" ] || { echo "Spitzenpegel nicht messbar — ist das eine Tondatei?" >&2; exit 1; }
hub=$(awk -v p="$spitze" 'BEGIN { printf "%.1f", -3 - p }')
aus=$(awk -v d="$dauer" -v b="$blende" 'BEGIN { printf "%.2f", d - b }')

# -write_xing 0 und -id3v2_version 0: die Datei beginnt mit einem Tonrahmen, ohne Marke davor.
ffmpeg -hide_banner -loglevel error -y -ss "$start" -t "$dauer" -i "$quelle" \
  -ac 1 -ar 44100 \
  -af "volume=${hub}dB,afade=t=in:st=0:d=0.02,afade=t=out:st=${aus}:d=${blende}" \
  -map_metadata -1 -id3v2_version 0 -write_xing 0 -codec:a libmp3lame -b:a 64k "$ziel"

echo "$ziel: $(wc -c < "$ziel") Byte, Spitze vorher ${spitze} dB, angehoben um ${hub} dB"
