# Päästä päähän -demon hyväksymiskriteerit

## 1. PR-laatuportti

Ennen Vercel-previewta seuraavien GitHub Actions -jobien pitää olla vihreitä:

```text
lint-typecheck-build
playwright-ui-smoke
```

Todisteeksi tallennetaan:

- PR-numero
- head commit SHA
- workflow run -URL
- molempien jobien conclusion `success`
- Playwright-report artifact

## 2. Pakollinen live-demo

1. Avaa onnistunut Vercel-preview mobiililla.
2. Täytä tarjouspyyntö.
3. Lataa kaksi oikeaa JPG/PNG/HEIC-kuvaa.
4. Vahvista Turnstile, jos avainpari on aktivoitu.
5. Lähetä pyyntö.
6. Varmista `201`-vastaus ja näkyvä viite-UUID.
7. Varmista, että `quote_requests.status = 'Uusi'`.
8. Varmista, että puhelin ja rekisteritunnus ovat normalisoidussa muodossa.
9. Varmista, että kuvat ovat private `damage-photos`-bucketissa.
10. Kirjaudu preview-adminilla `ville@vidosocial.com`.
11. Varmista, että liidi näkyy Realtime-päivityksenä.
12. Avaa signed URL -kuvat lightboxiin.
13. Testaa zoom 100–400 %.
14. Testaa hiiren rulla ja vetämällä panorointi.
15. Testaa mobiilin pinch-to-zoom ja yhden sormen panorointi.
16. Testaa näppäimet `+`, `-`, `0`, nuolet ja `Esc`.
17. Muuta tila `Käsittelyssä` → `Sovittu pajalle`.
18. Arkistoi demoliidi.
19. Poista testidata hallitulla manuaalisella admin-toiminnolla tai dokumentoidulla SQL:llä. Poistettua `e2e-cleanup`-funktiota ei aktivoida.

## 3. Negatiiviset testit

- 0 kuvaa → estetään näkyvällä virheellä
- 4 kuvaa → estetään
- GIF/PDF → estetään
- yli 10 Mt kuva → estetään
- kuvien yhteiskoko yli 30 Mt → estetään
- puuttuva tietosuostumus → estetään näkyvällä virheellä
- virheellinen suomalainen puhelinnumero → frontend ja Edge Function estävät
- virheellinen suomalainen rekisteritunnus → frontend ja Edge Function estävät
- asiakkaan lähettämä `status=Valmis` → tallentuu silti `Uusi`
- asiakkaan lähettämä `internalNotes` → ei tallennu
- origin, jota ei ole allowlistissa → `403 Origin not allowed`
- Turnstile-secret aktivoituna ilman tokenia → estetään
- kirjautumaton käyttäjä ei voi lukea liidejä tai kuvia
- ei-admin-käyttäjä ei voi lukea liidejä tai kuvia
- vanhentunut admin-session → signed URL -osoitteita ei luoda

## 4. Brändi- ja asset-portti

- alkuperäinen hyväksytty V04 header-master on repositoryssa
- admin ei käytä tekstillä tai CSS:llä piirrettyä `28`-korviketta
- faviconit ja manifesti eivät palauta 404-virheitä
- vähintään yksi oikea Paint28-työnäytekuva näkyy hero- tai referenssiosiossa
- kuvan käyttöoikeus ja hyväksyntä on dokumentoitu
- sivu on tarkistettu 390, 768, 1024 ja 1440 px leveyksillä

Jos assetit puuttuvat, demo voidaan hyväksyä vain tekniseksi previewksi. Sitä ei saa nimetä lopulliseksi visuaaliseksi hyväksyntäversioksi.

## 5. Preview-ympäristö

- Vercel deployment state on `READY`
- preview-origin on lisätty täsmällisenä `PREVIEW_ORIGIN`-arvona
- `*.vercel.app`-jokeria ei käytetä
- `noindex,nofollow,noarchive` näkyy sekä HTML-metassa että response-headerissa
- `paint28.fi` ei ole vielä kytketty
- Hannan henkilökohtaista käyttäjää ei ole aktivoitu
- preview-admin voidaan deaktivoida yhdellä SQL-toiminnolla

## Go / No-Go

Demo on esittelykelpoinen vain, kun:

- CI on vihreä
- onnistunut Vercel-preview on käytettävissä
- Edge Function ja migraatiot vastaavat repositoryn head commitia
- vähintään yksi päästä päähän -testi on dokumentoitu
- estäviä tietoturvahuomautuksia ei ole
- preview-admin toimii ja voidaan poistaa tai deaktivoida
- Turnstile on joko kokonaan pois päältä tai aktivoitu avainparina
- puuttuvat V04- ja työnäyteassetit on ratkaistu tai kirjattu selvästi estäväksi visuaaliseksi poikkeamaksi
