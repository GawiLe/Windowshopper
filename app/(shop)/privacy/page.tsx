"use client"

import { useDB } from "@/lib/store"
import { formatDate } from "@/lib/utils"

export default function PrivacyPage() {
  const { settings } = useDB()
  const p = settings.privacy
  return (
    <article className="px-4 pt-6">
      <h1 className="font-display text-3xl font-semibold text-primary">Privacyverklaring</h1>
      <p className="mt-1 text-sm text-stone-500">Laatst bijgewerkt: {formatDate(settings.updatedAt.slice(0, 10), { day: "numeric", month: "long", year: "numeric" })}</p>

      <div className="mt-5 rounded-2xl bg-primary-soft p-4 text-[15px] leading-relaxed">
        <p className="font-bold">In het kort</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Je hebt <b>geen account</b> nodig. Je kadolijstje staat alleen in je eigen browser.</li>
          <li>We gebruiken <b>geen tracking- of advertentiecookies</b>.</li>
          <li>
            Alleen als je iets <b>reserveert</b>, vragen we je naam, e-mailadres en (optioneel) telefoonnummer. Die delen we
            uitsluitend met de winkel(s) waar je reserveert.
          </li>
          <li>
            Reserveringsgegevens worden na uiterlijk <b>{p.retentionDays} dagen</b> automatisch verwijderd.
          </li>
          <li>Je kunt altijd vragen om inzage of verwijdering via {p.contactEmail}.</li>
        </ul>
      </div>

      <div className="prose-sm mt-6 space-y-6 text-[15px] leading-relaxed text-stone-700 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-primary [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>1. Wie is verantwoordelijk?</h2>
          <p>
            Deze website ({settings.siteName} {settings.areaName}) wordt aangeboden door <b>{p.controllerName}</b>, {p.controllerAddress}
            {p.kvk && <> (KvK {p.kvk})</>}. Wij zijn verwerkingsverantwoordelijke voor de gegevens die via deze website worden verwerkt.
            Vragen? Mail naar <a className="font-semibold text-primary underline" href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>.
          </p>
          <p className="mt-2">
            De deelnemende winkels ontvangen jouw reserveringsgegevens om je reservering af te handelen. Zij gebruiken die gegevens
            alleen daarvoor en zijn gebonden aan afspraken met ons; ze mogen je gegevens niet gebruiken voor bijvoorbeeld nieuwsbrieven
            of reclame.
          </p>
        </section>

        <section>
          <h2>2. Windowshoppen en je kadolijstje</h2>
          <p>
            Rondkijken kan volledig anoniem. Je kadolijstje (welke producten je hebt gekozen en wat je hebt afgevinkt) wordt alleen
            opgeslagen in de lokale opslag (<i>localStorage</i>) van je eigen browser. Wij kunnen dit niet zien.
          </p>
          <p className="mt-2">
            Als je je lijstje deelt of naar jezelf mailt, maken we een link waarin alleen de nummers van de producten staan — geen
            persoonsgegevens. Het mailen gebeurt via je eigen e-mailapp: je e-mailadres komt dan niet bij ons terecht.
          </p>
        </section>

        <section>
          <h2>3. Reserveren</h2>
          <p>Als je een product laat reserveren, verwerken we:</p>
          <ul className="mt-1">
            <li>je naam;</li>
            <li>je e-mailadres (voor je bevestiging en ophaalcode);</li>
            <li>je telefoonnummer, alleen als je dat zelf invult;</li>
            <li>je eventuele opmerking, de gekozen producten en de ophaaldag.</li>
          </ul>
          <p className="mt-2">
            <b>Doel:</b> het apart leggen van je producten en het informeren van de winkel en jou. <b>Grondslag:</b> het uitvoeren van
            jouw verzoek (art. 6 lid 1 sub b AVG) en je uitdrukkelijke toestemming voor het delen met de gekozen winkel(s).
          </p>
          <p className="mt-2">
            <b>Ontvangers:</b> alleen de winkel(s) waar je iets reserveert krijgen je gegevens, per e-mail en in hun beveiligde
            winkeliersomgeving. Een winkel ziet nooit reserveringen bij andere winkels.
          </p>
          <p className="mt-2">
            <b>Bewaartermijn:</b> reserveringsgegevens en bijbehorende e-mails worden uiterlijk {p.retentionDays} dagen na het aanmaken
            automatisch verwijderd. Winkeliers wordt gevraagd e-mails met reserveringen na afhandeling ook te verwijderen.
          </p>
        </section>

        <section>
          <h2>4. Winkeliers</h2>
          <p>
            Van deelnemende winkeliers verwerken we contactgegevens (naam, e-mail, telefoon) en de winkelgegevens die ze zelf
            publiceren. Inloggen gebeurt via een persoonlijke inloglink per e-mail. Deze gegevens bewaren we zolang de winkel meedoet
            en maximaal één jaar na afloop van de actie.
          </p>
        </section>

        <section>
          <h2>5. Cookies en lokale opslag</h2>
          <p>
            We plaatsen geen tracking-, analyse- of advertentiecookies en gebruiken geen social-media-plugins. We gebruiken alleen
            functionele lokale opslag om je lijstje te onthouden en, voor winkeliers, om ingelogd te blijven. Hiervoor is geen
            toestemming nodig. Je kunt deze opslag altijd wissen via de instellingen van je browser of met &ldquo;Wis lijstje&rdquo;.
          </p>
        </section>

        <section>
          <h2>6. Verwerkers en beveiliging</h2>
          <p>
            We gebruiken zorgvuldig gekozen dienstverleners voor hosting, database en het versturen van e-mail. Met hen hebben we
            verwerkersovereenkomsten gesloten en de gegevens worden opgeslagen binnen de Europese Economische Ruimte. De website werkt
            uitsluitend via een beveiligde verbinding (HTTPS) en winkeliers hebben alleen toegang tot gegevens van hun eigen winkel.
          </p>
        </section>

        <section>
          <h2>7. Jouw rechten</h2>
          <p>Je hebt het recht om:</p>
          <ul className="mt-1">
            <li>je gegevens in te zien, te laten corrigeren of te laten verwijderen;</li>
            <li>je toestemming in te trekken (een lopende reservering vervalt dan);</li>
            <li>bezwaar te maken tegen of een beperking te vragen van de verwerking;</li>
            <li>je gegevens over te laten dragen.</li>
          </ul>
          <p className="mt-2">
            Stuur hiervoor een mail naar <a className="font-semibold text-primary underline" href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>.
            We reageren binnen een maand. Ben je niet tevreden? Dan kun je een klacht indienen bij de{" "}
            <a className="font-semibold text-primary underline" href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer">
              Autoriteit Persoonsgegevens
            </a>
            .
          </p>
        </section>

        <section>
          <h2>8. Wijzigingen</h2>
          <p>
            We kunnen deze verklaring aanpassen, bijvoorbeeld als de website verandert. De datum bovenaan laat zien wanneer dat voor
            het laatst is gebeurd.
          </p>
        </section>
      </div>
    </article>
  )
}
