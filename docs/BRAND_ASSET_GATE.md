# Paint28 V04 -brändiasset-portti

Päivitetty: 2026-07-24

## Tila

**ESTÄVÄ ENNEN LOPULLISTA VISUAALISTA HYVÄKSYNTÄÄ**

Repositoryssa ja käytettävissä olevassa File Libraryssa ei ole tunnistettavaa alkuperäistä V04 header-masteria tai hyväksyttyjä korkearesoluutioisia Paint28-työnäytekuvia binääritiedostoina.

File Librarysta löytynyt tiedosto `Futuristinen Paint28-logo kirkastetulla alaviivalla.png` on nimetty logokonseptiksi. Sitä ei käsitellä alkuperäisenä V04-masterina eikä lisätä tuotantoon ilman erillistä kirjallista hyväksyntää.

## Kielletyt korvikkeet

- tekstillä kirjoitettu `28`-merkki
- CSS:llä piirretty logo
- uusi itse tehty SVG
- kuvageneraattorilla tuotettu logo
- esityksestä tai ruutukaappauksesta leikattu rasteri
- konseptikuva ilman hyväksyntää ja käyttöoikeuden vahvistusta
- Facebook-kuvasta tai muusta pakatusta somekuvasta irrotettu logo

## Vaaditut alkuperäiset tiedostot

### Logo

```text
public/brand/logo/paint28-v04-header.svg
public/brand/logo/paint28-v04-header.png
```

Vähintään yhden tiedoston tulee olla alkuperäinen master. SVG on ensisijainen. PNG-masterin tulee sisältää riittävä resoluutio header-, favicon- ja Open Graph -johdannaisiin.

### Faviconit ja ikonit

```text
public/brand/favicon/favicon.ico
public/brand/favicon/favicon-16x16.png
public/brand/favicon/favicon-32x32.png
public/brand/favicon/apple-touch-icon.png
public/brand/favicon/android-chrome-192.png
public/brand/favicon/android-chrome-512.png
public/brand/icons/pwa-maskable.png
```

Johdannaiset luodaan vain hyväksytystä masterista muuttamatta logon mittasuhteita, värejä tai rakennetta.

### Työnäytekuvat

```text
public/brand/hero/paint28-workshop-hero.webp
public/brand/hero/paint28-work-sample-01.webp
public/brand/hero/paint28-work-sample-02.webp
```

Kuvien tulee olla:

- Paint28 Oy:n todellisia töitä tai erikseen hyväksyttyjä master-kuvia
- käyttöoikeudeltaan dokumentoituja
- ilman näkyviä asiakasnimiä tai henkilötietoja
- rekisteritunnuksiltaan peitettyjä, ellei julkaisuun ole dokumentoitua lupaa
- riittävän korkearesoluutioisia responsiivisiin johdannaisiin

## Hyväksyntämetadata

Jokaisesta assetista kirjataan:

```text
alkuperäinen tiedostonimi
lähde / kuvaaja / suunnittelija
Paint28 Oy:n käyttöoikeus
hyväksyjä
hyväksyntäpäivä
SHA-256
sallitut käyttökohteet
```

## Integrointi

Kun masterit on toimitettu:

1. Lisää tiedostot korjaushaaralle muuttamattomina.
2. Laske SHA-256-tarkistussummat.
3. Lisää headeriin hyväksytty V04-logo.
4. Korvaa adminin tekstipohjainen `28`-merkki samalla hyväksytyllä assetilla.
5. Lisää favicon- ja manifest-linkitykset `index.html`-tiedostoon.
6. Lisää oikea hero- ja työnäytekuvarakenne.
7. Testaa logo vähintään 104 px mobiilissa ja 120 px desktopissa.
8. Testaa kuvat 390, 768, 1024 ja 1440 px leveyksillä.
9. Dokumentoi visuaalinen hyväksyntä pull requestiin.

## Go / No-Go

Brändiasset-portti on **GO** vasta, kun:

- alkuperäinen master on repositoryssa
- käyttöoikeus on dokumentoitu
- header ja admin eivät käytä tekstillä tai CSS:llä piirrettyä korviketta
- faviconit ja manifesti latautuvat ilman 404-virheitä
- vähintään yksi hyväksytty todellinen Paint28-työnäytekuva näkyy julkisella sivulla
- Hanna tai Paint28 Oy:n valtuutettu edustaja on hyväksynyt kokonaisuuden kirjallisesti
