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
  SprayCan,
  Wrench,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { QuoteForm } from "./components/QuoteForm";

type ServiceItem = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

type ProcessItem = {
  icon: LucideIcon;
  title: string;
  copy: string;
};

const services: ServiceItem[] = [
  {
    icon: SprayCan,
    title: "Automaalaus",
    copy: "Pohjatyö, sävytys, maalaus ja viimeistelyn tarkastus yhtenä hallittuna työketjuna.",
  },
  {
    icon: Hammer,
    title: "Pelti- ja korikorjaukset",
    copy: "Painumat, ruostealueet, korjauspalat ja vaurioituneet korirakenteet työn laajuuden mukaan.",
  },
  {
    icon: CarFront,
    title: "Kolarivaurioiden korjaus",
    copy: "Vaurion kartoitus, korjaussuunnitelma sekä tarvittavat kori- ja maalaustyöt samasta pajasta.",
  },
  {
    icon: Wrench,
    title: "Puskurit ja muoviosat",
    copy: "Korjattavuuden arviointi, muovikorjaus ja pintakäsittely ajoneuvon sekä vaurion perusteella.",
  },
  {
    icon: ScanSearch,
    title: "Naarmut, kolhut ja ruoste",
    copy: "Paikallisten vaurioiden tarkastus ja tarkoituksenmukainen korjaustapa ilman ylimääräisiä työvaiheita.",
  },
  {
    icon: Paintbrush,
    title: "Värinsävytys ja viimeistely",
    copy: "Sävyn sovitus, pinnan tasaisuus ja lopputarkastus ennen ajoneuvon luovutusta.",
  },
];

const process: ProcessItem[] = [
  {
    icon: Camera,
    title: "Lähetä vauriokuvat",
    copy: "Lisää rekisteritunnus, yhteystiedot ja 1–3 selkeää kuvaa vauriosta.",
  },
  {
    icon: ScanSearch,
    title: "Alustava arvio",
    copy: "Kuvien perusteella muodostetaan työn lähtökohta. Lopullinen tarjous voi vaatia pajalla tehtävän tarkastuksen.",
  },
  {
    icon: Clock3,
    title: "Sovitaan toteutus",
    copy: "Työn sisältö, aikataulu ja käytännön järjestelyt vahvistetaan ennen korjauksen aloittamista.",
  },
  {
    icon: ShieldCheck,
    title: "Korjaus ja luovutus",
    copy: "Työ tehdään sovitusti ja korjattu pinta tarkastetaan ennen auton luovuttamista.",
  },
];

function SpectrumLine({ className = "" }: { className?: string }) {
  return <div className={`spectrum-line ${className}`.trim()} aria-hidden="true" />;
}

function SectionHeading({
  index,
  eyebrow,
  title,
  copy,
}: {
  index: string;
  eyebrow: string;
  title: string;
  copy?: string;
}) {
  return (
    <header className="section-heading">
      <div className="section-heading-meta">
        <span>{index}</span>
        <p>{eyebrow}</p>
      </div>
      <h2>{title}</h2>
      {copy ? <p className="section-heading-copy">{copy}</p> : null}
      <SpectrumLine className="section-spectrum" />
    </header>
  );
}

function SiteName({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`site-name ${compact ? "compact" : ""}`.trim()}>
      <strong>Paint28 Oy</strong>
      <small>Automaalaamo · Tattarisuo</small>
    </span>
  );
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Siirry sisältöön</a>

      <header className="main-header">
        <div className="utility-bar">
          <div className="page-width utility-inner">
            <span><MapPin aria-hidden="true" /> Autotallintie 5, 00770 Helsinki</span>
            <a href="tel:+358405743094"><Phone aria-hidden="true" /> 040 574 3094</a>
          </div>
        </div>

        <div className="page-width header-inner">
          <a className="site-name-link" href="#home" aria-label="Paint28 Oy etusivu">
            <SiteName />
          </a>

          <nav className="desktop-nav" aria-label="Päänavigaatio">
            <a href="#services">Palvelut</a>
            <a href="#electric">Sähkö- ja hybridiautot</a>
            <a href="#process">Prosessi</a>
            <a href="#contact">Yhteystiedot</a>
          </nav>

          <a className="button primary desktop-cta" href="#quote">Pyydä arvio</a>
          <button
            className="menu-button"
            type="button"
            aria-label={menuOpen ? "Sulje valikko" : "Avaa valikko"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        <SpectrumLine className="header-spectrum" />

        {menuOpen ? (
          <nav className="mobile-menu" aria-label="Mobiilinavigaatio">
            {[
              ["Palvelut", "#services"],
              ["Sähkö- ja hybridiautot", "#electric"],
              ["Prosessi", "#process"],
              ["Yhteystiedot", "#contact"],
              ["Pyydä arvio", "#quote"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </nav>
        ) : null}
      </header>

      <main id="main">
        <section id="home" className="hero">
          <div className="hero-backdrop" aria-hidden="true" />
          <div className="page-width hero-layout">
            <div className="hero-copy">
              <p className="hero-kicker">Helsinki · Tattarisuo · Autotallintie 5</p>
              <h1>Työnjälki, joka kestää <em>tarkastelun.</em></h1>
              <p className="hero-lead">
                Automaalaus, peltikorjaukset ja kolarivaurioiden korjaus ilman vähän sinnepäin -ratkaisuja.
                Lähetä rekisteritunnus ja vauriokuvat suoraan korjaamon arvioitavaksi.
              </p>
              <div className="hero-actions">
                <a className="button primary" href="#quote"><Camera aria-hidden="true" /> Lähetä vauriokuvat</a>
                <a className="button secondary" href="tel:+358405743094"><Phone aria-hidden="true" /> Soita Hannalle</a>
              </div>
            </div>

            <aside className="hero-brief" aria-label="Paint28 palvelun ydintiedot">
              <div className="hero-brief-head">
                <span>Paint28 / 01</span>
                <span>00770 Helsinki</span>
              </div>
              <div className="hero-brief-statement">
                <p>Pelti.</p>
                <p>Pohjatyö.</p>
                <p>Maalaus.</p>
                <p>Viimeistely.</p>
              </div>
              <dl className="hero-facts">
                <div><dt>Kokemus</dt><dd>Henkilöstöllä yli 20 vuotta käytännön osaamista</dd></div>
                <div><dt>Arvio</dt><dd>Rekisteritunnus ja 1–3 vauriokuvaa</dd></div>
                <div><dt>Vastaanotto</dt><dd>Hanna Haapalainen · 040 574 3094</dd></div>
              </dl>
              <SpectrumLine />
            </aside>
          </div>

          <div className="page-width proof-strip" aria-label="Paint28 palvelulupaukset">
            <div><span>01</span><p>Vahva peltisepän osaaminen</p></div>
            <div><span>02</span><p>Hallittu maalausprosessi</p></div>
            <div><span>03</span><p>Suora työn vastaanotto</p></div>
            <div><span>04</span><p>Mobiili tarjouspyyntö</p></div>
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="page-width">
            <SectionHeading
              index="02"
              eyebrow="Palvelut"
              title="Korjaus ja maalaus samassa työketjussa."
              copy="Vaurion tyyppi ratkaisee työmenetelmän. Kuvilla arviointi voidaan aloittaa jo ennen auton tuomista pajalle."
            />

            <div className="service-list">
              {services.map(({ icon: Icon, title, copy }, index) => (
                <article className="service-row" key={title}>
                  <span className="service-number">{String(index + 1).padStart(2, "0")}</span>
                  <Icon aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <ArrowRight aria-hidden="true" className="service-arrow" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="electric" className="section electric-section">
          <div className="page-width electric-layout">
            <div className="electric-intro">
              <SectionHeading
                index="03"
                eyebrow="Sähkö- ja hybridiautot"
                title="Moderni vauriokorjaus vaatii hallitun työjärjestyksen."
                copy="Ajoneuvon rakenne, akuston sijainti ja valmistajan työohjeet huomioidaan vaurion sekä valittavan työmenetelmän arvioinnissa."
              />
              <p className="body-copy">
                Paint28 hyödyntää Ullanlinnan Sähkö Oy:n sähköteknistä osaamista korjausprosessin tukena.
                Kyse on yhteistyöedusta, ei valmistajavaltuutus- tai sertifiointiväitteestä.
              </p>
              <a className="text-link" href="#quote">Pyydä ajoneuvokohtainen arvio <ArrowRight aria-hidden="true" /></a>
            </div>

            <div className="electric-list">
              {[
                {
                  icon: CarFront,
                  number: "01",
                  title: "Ajoneuvon tunnistus",
                  copy: "Malli, vuosimalli ja vaurioalue ohjaavat rakenteiden sekä työmenetelmien tarkastusta.",
                },
                {
                  icon: BatteryCharging,
                  number: "02",
                  title: "Riskien tunnistaminen",
                  copy: "Korkeajännitejärjestelmän ja akuston läheisyys huomioidaan ennen työn aloittamista.",
                },
                {
                  icon: ShieldCheck,
                  number: "03",
                  title: "Ajoneuvokohtainen toteutus",
                  copy: "Korjaus suunnitellaan vaurion, auton rakenteen ja valmistajan ohjeiden perusteella.",
                },
              ].map(({ icon: Icon, number, title, copy }) => (
                <article key={title}>
                  <div className="electric-icon"><Icon aria-hidden="true" /></div>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="process" className="section process-section">
          <div className="page-width">
            <SectionHeading
              index="04"
              eyebrow="Prosessi"
              title="Kuvasta korjaussuunnitelmaan neljässä vaiheessa."
              copy="Asiakkaan työvaiheet pidetään lyhyinä ja korjaamon käsittely keskitetään yhteen digitaaliseen työjonoon."
            />

            <div className="process-track">
              {process.map(({ icon: Icon, title, copy }, index) => (
                <article key={title}>
                  <div className="process-marker"><span>{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section review-section">
          <div className="page-width review-layout">
            <SectionHeading
              index="05"
              eyebrow="Asiakaskokemus"
              title="Laatu näkyy siinä, miten työ luovutetaan."
              copy="Alla käytetään vain toimitettuja AutoJerry-palautteita ilman keksittyjä tähtiluokituksia."
            />

            <div className="review-stack">
              <blockquote>
                <span>01 / Honda Accord</span>
                <p>“Homma hoitui kuten oli sovittu. Suosittelen.”</p>
                <footer>Hannu · kori-, vaurio- ja maalaustyöt</footer>
              </blockquote>
              <blockquote>
                <span>02 / BMW 520</span>
                <p>“Alun kommunikointiongelmien jälkeen homma hoitui mallikkaasti. Taitava ja nopea taittelemaan uutta korjauspalaa.”</p>
                <footer>Robin Jager · ruostekorjaus</footer>
              </blockquote>
            </div>
          </div>
        </section>

        <section id="quote" className="section quote-section">
          <div className="page-width quote-layout">
            <div className="quote-copy">
              <SectionHeading
                index="06"
                eyebrow="Tarjouspyyntö"
                title="Lähetä vauriosta 1–3 kuvaa."
                copy="Täytä tiedot, lisää kuvat ja lähetä pyyntö. Kuvia ei tallenneta julkiseen kansioon."
              />
              <ul className="benefit-list">
                {[
                  "Ei käyttäjätiliä asiakkaalle",
                  "JPG, PNG tai HEIC",
                  "Enintään 10 Mt per kuva",
                  "Private-kuvat ja suojattu admin",
                ].map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}
              </ul>
            </div>
            <div className="form-card"><QuoteForm /><SpectrumLine /></div>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="page-width">
            <SectionHeading
              index="07"
              eyebrow="Yhteystiedot"
              title="Paja Helsingin Tattarisuolla."
              copy="Käyntiosoite ja virallinen postiosoite pidetään selkeästi erillään."
            />

            <div className="contact-layout">
              <article className="contact-primary">
                <MapPin aria-hidden="true" />
                <span>Paja ja työn vastaanotto</span>
                <h3>Autotallintie 5<br />00770 Helsinki</h3>
                <p>Tattarisuo</p>
                <a className="text-link" href="https://www.google.com/maps/search/?api=1&query=Autotallintie+5+00770+Helsinki" target="_blank" rel="noreferrer">Avaa reittiohje <ArrowRight aria-hidden="true" /></a>
              </article>

              <div className="contact-list">
                <article>
                  <Phone aria-hidden="true" />
                  <div><span>Työn vastaanotto ja tarjoukset</span><h3>Hanna Haapalainen</h3><p>040 574 3094<br /><a href="mailto:hanna@paint28.fi">hanna@paint28.fi</a></p></div>
                </article>
                <article>
                  <Wrench aria-hidden="true" />
                  <div><span>Korjaamon tekninen vastaava</span><h3>Jari Haapalainen</h3><p>050 303 0721<br /><a href="mailto:paint28@paint28.fi">paint28@paint28.fi</a></p></div>
                </article>
                <article>
                  <Mail aria-hidden="true" />
                  <div><span>Virallinen posti- ja laskutusosoite</span><h3>Paint28 Oy</h3><p>Valuraudantie 9–13<br />00700 Helsinki<br />Y-tunnus 3371987-1</p></div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="page-width footer-inner">
          <SiteName compact />
          <p>© {new Date().getFullYear()} Paint28 Oy · Y-tunnus 3371987-1</p>
          <a href="#quote">Tarjouspyyntö <ArrowRight aria-hidden="true" /></a>
        </div>
      </footer>

      <div className="mobile-actions" aria-label="Pikatoiminnot">
        <a href="tel:+358405743094"><Phone aria-hidden="true" /> Soita</a>
        <a href="#quote"><Camera aria-hidden="true" /> Pyydä arvio</a>
      </div>
    </div>
  );
}
