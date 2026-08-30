import { noivos } from '../../content/story.js'
import { SectionLabel } from '../ds/index.js'

export function Couple() {
  return (
    <section className="section section--alt couple" id="quem-somos">
      <SectionLabel>Quem Somos</SectionLabel>

      <div className="couple__grid">
        {noivos.map((pessoa) => (
          <article className="profile" key={pessoa.nome}>
            {pessoa.foto && (
              <img
                className="profile__photo"
                src={pessoa.foto}
                alt={pessoa.nome}
                loading="lazy"
                decoding="async"
              />
            )}
            <h3 className="profile__name">{pessoa.nome}</h3>
            {/* Sem profissão preenchida o espaço fica vazio — é o lembrete
                visual de que falta algo que só os noivos sabem. */}
            <span className="profile__role">{pessoa.profissao}</span>
            <p className="profile__text">{pessoa.texto}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
