# Dateien

- [Bauen, Basis-Pfad und Veröffentlichen](bauen-und-veroeffentlichen.md) - Wie aus zwei `.astro`-Seiten die veröffentlichte Seite wird: der statische Astro-Bau nach `dist/`, `import.meta.env.BASE_URL` als einzige Quelle interner Adressen samt `ASTRO_BASE`-Normalisierung und Abbruch bei fehlendem `/`, die Kette aus lokalem pre-push-Hook und den Workflow-Jobs `bauen` und `ausliefern`, die Domain über `public/CNAME`, die Engine- und pnpm-Vorgaben sowie die Umgebungen, die es nur im Bau gibt.
