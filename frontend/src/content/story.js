/* =========================================================================
 *  Textos do site. Este é o único arquivo que precisa ser editado para
 *  trocá-los.
 *
 *  `historia` é o texto real, escrito pelos noivos.
 *
 *  AINDA É RASCUNHO: `noivos` (os dois parágrafos de apresentação) e
 *  `proposito.planos` continuam com prosa inventada, escrita só para dar
 *  forma às seções. Tudo que é fato — profissão, datas, lugares — está
 *  marcado com «...» e aparece em branco na página até ser preenchido, de
 *  propósito: é melhor um espaço vazio do que uma informação inventada no
 *  site do próprio casamento.
 * ========================================================================= */

/** Vazio não é renderizado — serve para marcar o que só vocês sabem. */
const PREENCHER = ''

/* -------------------------------------------------------------------------
 *  FOTOS
 *
 *  1. copie os arquivos para src/assets/fotos/
 *  2. descomente o import correspondente
 *  3. troque o `null` pela variável importada
 *
 *  Sem foto, o hero mantém o painel verde com o monograma e os perfis ficam
 *  só com nome e texto — nada quebra.
 * ------------------------------------------------------------------------- */
import fotoCasal from '../assets/fotos/casal.jpg'
// import fotoRenato from '../assets/fotos/renato.jpg'
// import fotoMarilia from '../assets/fotos/marilia.jpg'

export const fotoDoCasal = {
  src: fotoCasal,
  alt: 'Renato e Marília',
  // Os rostos estão no terço superior do quadro. Num painel largo o `cover`
  // corta bastante em cima e embaixo, então o enquadramento sobe para 22%.
  posicao: '50% 22%',
}

export const historia = {
  // Abertura: sai em itálico, destacada do corpo.
  chamada:
    'Se alguém tivesse contado a Renato e Marília que uma amizade na igreja, ' +
    'em Dublin, passaria por uma coincidência numa lanchonete e acabaria ' +
    'chegando ao altar, os dois provavelmente dariam muita risada.',

  paragrafos: [
    'Eles se conheceram na igreja e começaram como amigos. Depois de alguns ' +
      'rolês com amigos, os dois acabaram se encontrando por acaso numa ' +
      'lanchonete — e foi ali que Deus resolveu colocar um “assunto” na mesa. ' +
      'Uma conversa que começou como qualquer outra e terminou deixando os ' +
      'dois com bastante coisa para pensar.',
    'Depois disso, vieram os olhares diferentes, algumas desconfianças e ' +
      'aquelas conversas em que ninguém fala exatamente o que está pensando, ' +
      'mas os dois sabem que tem alguma coisa acontecendo. Até que, com Deus ' +
      'dando o start, veio a decisão: “Então… bora tentar.” E foi aí que ' +
      'começou a história de verdade.',
    'E tentaram mesmo. Entre estudos e trabalho, faziam de tudo para se ' +
      'encontrar, muitas vezes de madrugada. Renato atravessava Dublin de ' +
      'bicicleta para levar Marília para casa e, quando não tinha bicicleta, ' +
      'ia na coragem mesmo — porque aparentemente o amor também fazia hora extra.',
    'Entre cafés, madrugadas, pedaladas e muita oração, a amizade virou amor.',
    'Hoje, celebramos o casamento como Deus planejou: não apenas uma festa, ' +
      'mas uma aliança para a vida toda, na qual marido e mulher caminham ' +
      'juntos, refletem o amor de Cristo e glorificam a Deus.',
  ],

  // Fecho: isolado sobre um filete dourado, o divisor-assinatura do sistema.
  fecho:
    'E pensar que tudo começou com dois amigos, uma lanchonete e Deus dando ' +
    'o start na história.',
}

export const noivos = [
  {
    nome: 'Renato',
    foto: null, // ← fotoRenato
    profissao: PREENCHER,
    texto:
      'Alguém que gosta de plano bem feito e de café passado na hora. ' +
      'Se há uma coisa que aprendi neste caminho, é que os melhores planos ' +
      'são os que se fazem a dois.',
  },
  {
    nome: 'Marília',
    foto: null, // ← fotoMarilia
    profissao: PREENCHER,
    texto:
      'Alguém que percebe o detalhe que ninguém viu e transforma qualquer ' +
      'canto em lugar de acolher. Cheguei aqui aprendendo que casa não é ' +
      'endereço, é pessoa.',
  },
]

export const proposito = {
  chamada: 'Não fomos nós que nos encontramos.',

  paragrafos: [
    'Antes de nos conhecermos, já éramos conhecidos. Antes de nos escolhermos, ' +
      'já havíamos sido escolhidos. Foi Cristo quem nos aproximou, quem ' +
      'sustentou o que era frágil em nós e quem transformou dois caminhos em um só.',
    'Por isso não entendemos este casamento como o fim de uma história, mas ' +
      'como o começo de um chamado: construir um lar onde Deus seja o centro, ' +
      'onde a porta esteja sempre aberta e onde o amor que recebemos seja o ' +
      'mesmo que ofereçamos.',
  ],

  versiculo: {
    // O versículo do convite original dos noivos.
    referencia: '1 Coríntios 13:12',
    texto: 'Porque agora vemos por espelho em enigma, mas então veremos face a face.',
  },

  planos: {
    titulo: 'Nossos planos',
    texto:
      'Sonhamos com uma casa cheia de gente e de conversa. Com trabalho que ' +
      'sirva a alguém além de nós. Com viagens que caibam no orçamento e ' +
      'memórias que não caibam em lugar nenhum. E, se Deus quiser, com filhos ' +
      'a quem possamos contar esta mesma história.',
  },

  fecho: {
    referencia: 'Eclesiastes 4:12',
    texto: 'O cordão de três dobras não se quebra com facilidade.',
  },
}
