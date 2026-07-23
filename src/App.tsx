import {
  ArrowRight,
  BatteryCharging,
  Camera,
  CarFront,
  Check,
  Clock3,
  Hammer,
  Mail,
  MapPin,
  Menu,
  Paintbrush,
  Phone,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { QuoteForm } from "./components/QuoteForm";

const services = [
  { icon: SprayCan, title: "Automaalaus", copy: "Osien ja pintojen maalaus hallitulla pohjatyöllä, sävytyksellä ja viimeistelyllä." },
  { icon: Hammer, title: "Korikorjaukset", copy: "Peltivaurioiden, painaumien ja korin vaurioituneiden alueiden korjaus työn laajuuden mukaan." },
  { icon: CarFront, title: "Kolarivaurioiden korjaus", copy: "Vaurion kartoitus, korjaussuunnitelma ja tarvittavat kori- sekä maalaustyöt samasta osoitteesta." },
  { icon: Wrench, title: "Puskurit ja muoviosat", copy: "Korjattavuuden arviointi, muoviosien korjaus ja pintakäsittely vaurion mukaan." },
  { icon: ScanSearch, title: "Naarmut, kolhut ja ruoste", copy: "Paikallisten pintavaurioiden ja ruostealueiden tarkastus sekä tarkoituksenmukainen korjaustapa." },
  { icon: Paintbrush, title: "Värinsävytys ja viimeistely", copy: "Sävyn sovitus, pinnan tasaisuus ja viimeistelyn tarkastus ennen auton luovutusta." },
];

const process = [
  { icon: Camera, title: "Lähetä kuvat", copy: "Kuvaa vaurio läheltä ja hieman kauempaa. Lisää auton tiedot ja rekisteritunnus." },
  { icon: ScanSearch, title: "Alustava arvio", copy: "Kuvien perusteella arvioidaan työn suuntaa. Lopullinen arvio voi vaatia tarkastuksen." },
  { icon: Clock3, title: "Sovitaan työ", copy: "Vahvistetaan aikataulu, työn sisältö ja käytännön tiedot ennen korjausta." },
  { icon: Sparkles, title: "Korjaus ja luovutus", copy: "Työ tehdään sovitusti ja pinta tarkastetaan ennen auton luovutusta." },
];

function SpectrumLine() {
  return <div className="spectrum-line" aria-hidden="true" />;
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <header className="section-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      {copy ? <span>{copy}</span> : null}
      <SpectrumLine />
    </header>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Siirry sisältöön</a>

      <div className="topbar">
        <div className="page-width topbar-inner">
          <span><MapPin aria-hidden="true" /> Autotallintie 5, 00770 Helsinki</span>
          <a href="tel:+358405743094"><Phone aria-hidden="true" /> 040 574 3094</a>
        </div>
      </div>

      <header className="main-header">
        <div className="page-width header-inner">
          <a className="brand" href="#home" aria-label="Paint28 etusivu">
            <span className="brand-mark">28</span>
            <span><strong>PAINT28</strong><small>Automaalaamo · Helsinki</small></span>
          </a>

          <nav className="desktop-nav" aria-label="Päänavigaatio">
            <a href="#services">Palvelut</a>
            <a href="#electric">Sähköautot</a>
            <a href="#process">Prosessi</a>
            <a href="#contact">Yhteystiedot</a>
          </nav>

          <a className="button primary desktop-cta" href="#quote">Pyydä arvio</a>
          <button className="menu-button" type="button" aria-label="Avaa valikko" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
        <SpectrumLine />
        {menuOpen ? (
          <nav className="mobile-menu" aria-label="Mobiilinavigaatio">
            {[
              ["Palvelut", "#services"],
              ["Sähköautot", "#electric"],
              ["Prosessi", "#process"],
              ["Yhteystiedot", "#contact"],
              ["Pyydä arvio", "#quote"],
            ].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          </nav>
        ) : null}
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="hero-grid" aria-hidden="true" />
          <div className="page-width hero-layout">
            <div className="hero-copy">
              <p className="eyebrow-pill">Henkilöstöllä yli 20 vuoden käytännön kokemus</p>
              <h1>Automaalaamo ja peltikorjaamo <span>Helsingin Tattarisuolla</span></h1>
              <p className="hero-lead">Vaurio-, pelti- ja maalaustyöt ilman vähän sinnepäin -ratkaisuja. Lähetä rekisterinumero ja vauriokuvat suoraan korjaamon arvioitavaksi.</p>
              <div className="hero-actions">
                <a className="button primary" href="#quote"><Camera aria-hidden="true" /> Lähetä vauriokuvat</a>
                <a className="button secondary" href="tel:+358405743094"><Phone aria-hidden="true" /> Soita 040 574 3094</a>
              </div>
              <p className="trust-note"><ShieldCheck aria-hidden="true" /> Kuvilla saadaan nopeampi lähtökohta työn arviointiin.</p>
            </div>

            <div className="hero-visual" role="img" aria-label="Tyylitelty tumma automaalaamo ja auton siluetti">
              <div className="booth-light booth-light-one" />
              <div className="booth-light booth-light-two" />
              <div className="car-silhouette"><span /><i /><b /></div>
              <div className="floor-line" />
              <div className="hero-visual-label"><Zap aria-hidden="true" /> Tarkka työ. Hallittu prosessi.</div>
            </div>
          </div>

          <div className="page-width trust-grid">
            {[
              ["01", "Peltisepän osaaminen", "Korjauspalat, ruoste- ja vauriokorjaukset käytännön kokemuksella."],
              ["02", "Viimeistelty maalausjälki", "Pohjatyö, sävytys ja pinnan tarkastus osana samaa työketjua."],
              ["03", "Moderni tarjouspyyntö", "Rekisterinumero, kuvaus ja kuvat yhdellä mobiililomakkeella."],
              ["04", "Selkeä työn vastaanotto", "Hanna vastaa tarjouspyynnöistä, yhteydenpidosta ja työn vastaanotosta."],
            ].map(([number, title, copy]) => (
              <article key={number} className="trust-card"><span>{number}</span><h2>{title}</h2><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section id="services" className="section">
          <div className="page-width">
            <SectionHeading eyebrow="Palvelut" title="Korjaus ja maalaus yhdestä osoitteesta" copy="Vaurion tyyppi ratkaisee työmenetelmän. Kuvilla arviointi voidaan aloittaa ennen auton tuomista pajalle." />
            <div className="service-grid">
              {services.map(({ icon: Icon, title, copy }) => (
                <article className="service-card" key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="electric" className="section dark-section">
          <div className="page-width split-layout">
            <div>
              <SectionHeading eyebrow="Sähkö- ja hybridiautot" title="Korikorjaus vaatii hallitun työjärjestyksen" copy="Ajoneuvon rakenne, akuston sijainti ja valmistajan työohjeet huomioidaan vaurion ja työmenetelmän arvioinnissa." />
              <p className="body-copy">Paint28 hyödyntää Ullanlinnan Sähkö Oy:n sähköteknistä osaamista korjausprosessin tukena. Tämä ei ole valmistajavaltuutus- tai sertifiointiväite.</p>
              <a className="button primary" href="#quote">Pyydä vaurioarvio <ArrowRight aria-hidden="true" /></a>
            </div>
            <div className="electric-card">
              {[
                [CarFront, "Ajoneuvon tunnistus", "Malli, vuosimalli ja vaurioalue ohjaavat rakenteiden tarkastusta."],
                [BatteryCharging, "Riskien tunnistaminen", "Korkeajännitejärjestelmän läheisyys huomioidaan ennen työmenetelmän valintaa."],
                [ShieldCheck, "Ajoneuvokohtainen toteutus", "Korjaus tehdään vaurion ja valmistajan ohjeiden perusteella."],
              ].map(([Icon, title, copy]) => (
                <article key={String(title)}><Icon aria-hidden="true" /><div><h3>{String(title)}</h3><p>{String(copy)}</p></div></article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="section">
          <div className="page-width">
            <SectionHeading eyebrow="Prosessi" title="Kuvasta korjaussuunnitelmaan" copy="Asiakkaan työvaiheet pidetään lyhyinä ja korjaamon käsittely keskitetään yhteen työjonoon." />
            <div className="process-grid">
              {process.map(({ icon: Icon, title, copy }, index) => (
                <article key={title}><span>0{index + 1}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{copy}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section className="section dark-section">
          <div className="page-width review-layout">
            <SectionHeading eyebrow="Työnjälki" title="Asiakkaiden kokemuksia" copy="Sivulla käytetään vain toimitettuja AutoJerry-palautteita ilman keksittyjä tähtiluokituksia." />
            <div className="review-grid">
              <blockquote><p>“Homma hoitui kuten oli sovittu. Suosittelen.”</p><footer>Hannu · Honda Accord · kori-, vaurio- ja maalaustyöt</footer></blockquote>
              <blockquote><p>“Alun kommunikointiongelmien jälkeen homma hoitui mallikkaasti. Taitava ja nopea taittelemaan uutta korjauspalaa.”</p><footer>Robin Jager · BMW 520 · ruostekorjaus</footer></blockquote>
            </div>
          </div>
        </section>

        <section id="quote" className="section quote-section">
          <div className="page-width quote-layout">
            <div>
              <SectionHeading eyebrow="Tarjouspyyntö" title="Lähetä 1–3 kuvaa vauriosta" copy="Täytä tiedot, lisää kuvat ja lähetä pyyntö. Kuvia ei tallenneta julkiseen kansioon." />
              <ul className="benefit-list">
                {["Ei käyttäjätiliä asiakkaalle", "JPG, PNG tai HEIC", "Enintään 10 Mt / kuva", "Private-kuvat ja suojattu admin"].map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
              </ul>
            </div>
            <div className="form-card"><QuoteForm /><SpectrumLine /></div>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="page-width">
            <SectionHeading eyebrow="Yhteystiedot" title="Paja Tattarisuolla" copy="Käyntiosoite ja virallinen postiosoite pidetään erillään väärinkäsitysten välttämiseksi." />
            <div className="contact-grid">
              <article><MapPin aria-hidden="true" /><h3>Paja ja työn vastaanotto</h3><p>Autotallintie 5<br />00770 Helsinki, Tattarisuo</p><a href="https://www.google.com/maps/search/?api=1&query=Autotallintie+5+00770+Helsinki" target="_blank" rel="noreferrer">Avaa reittiohje <ArrowRight aria-hidden="true" /></a></article>
              <article><Phone aria-hidden="true" /><h3>Hanna Haapalainen</h3><p>Toimitusjohtaja, työn vastaanotto ja tarjouspyynnöt</p><a href="tel:+358405743094">040 574 3094</a><a href="mailto:hanna@paint28.fi">hanna@paint28.fi</a></article>
              <article><Wrench aria-hidden="true" /><h3>Jari Haapalainen</h3><p>Korjaamon tekninen vastaava ja autopeltiseppä</p><a href="tel:+358503030721">050 303 0721</a><a href="mailto:paint28@paint28.fi">paint28@paint28.fi</a></article>
              <article><Mail aria-hidden="true" /><h3>Virallinen postiosoite</h3><p>Paint28 Oy<br />Valuraudantie 9–13<br />00700 Helsinki</p><small>Y-tunnus 3371987-1</small></article>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="page-width footer-inner"><div className="brand compact"><span className="brand-mark">28</span><span><strong>PAINT28</strong><small>Automaalaamo · Helsinki</small></span></div><p>© {new Date().getFullYear()} Paint28 Oy · Y-tunnus 3371987-1</p><a href="#quote">Tarjouspyyntö</a></div>
      </footer>

      <div className="mobile-actions" aria-label="Pikatoiminnot"><a href="tel:+358405743094"><Phone aria-hidden="true" /> Soita</a><a href="#quote"><Camera aria-hidden="true" /> Pyydä arvio</a></div>
    </div>
  );
}
