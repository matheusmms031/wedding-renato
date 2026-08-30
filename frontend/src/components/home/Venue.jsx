import { SectionLabel } from '../ds/index.js'

const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Condom%C3%ADnio+Mirante+do+Lago+Palmas+TO'

export function Venue() {
  return (
    <section className="section section--alt venue" id="local">
      <SectionLabel>Local</SectionLabel>
      <h2 className="venue__name">Condomínio Mirante do Lago — Salão de Festas</h2>
      <p className="venue__address">Palmas TO, CEP 77019-870</p>
      <p className="venue__actions">
        <a
          className="ds-button ds-button--secondary ds-button--md"
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
        >
          Ver no mapa
        </a>
      </p>
    </section>
  )
}
