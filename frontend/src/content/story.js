/* =========================================================================
 *  TEXTO DE RASCUNHO — Renato e Marília precisam reescrever este arquivo.
 *
 *  A prosa abaixo foi escrita para dar forma e ritmo às seções da home, mas
 *  NÃO é a história de vocês: ninguém aqui sabe onde vocês se conheceram, o
 *  que fazem da vida ou o que sonham. Tudo que é fato — profissão, datas,
 *  lugares — está marcado com «...» e aparece em branco na página até ser
 *  preenchido, de propósito: é melhor um espaço vazio do que uma informação
 *  inventada no site do próprio casamento.
 *
 *  Este é o único arquivo que precisa ser editado para trocar os textos.
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
  chamada:
    'Há encontros que parecem acaso e, vistos de longe, revelam-se caminho. ' +
    'O nosso começou muito antes de nós dois percebermos.',

  momentos: [
    {
      // `quando` é opcional: preencha com o ano ou a data, ou deixe vazio.
      quando: PREENCHER,
      titulo: 'O encontro',
      texto:
        'Foi num dia comum, desses que não avisam que vão mudar tudo. ' +
        'Conversamos até tarde e, no dia seguinte, já não havia como voltar ' +
        'a ser quem éramos antes.',
    },
    {
      quando: PREENCHER,
      titulo: 'O namoro',
      texto:
        'Aprendemos a construir juntos: a dividir os dias comuns, a rir das ' +
        'mesmas bobagens, a orar um pelo outro. Foi ali que entendemos que ' +
        'amar é também escolher, todas as manhãs.',
    },
    {
      quando: PREENCHER,
      titulo: 'O pedido',
      texto:
        'Um joelho no chão, um anel e a certeza tranquila de quem já sabia a ' +
        'resposta havia muito tempo.',
    },
    {
      quando: '20 de dezembro de 2026',
      titulo: 'O nosso sim',
      texto:
        'Diante de Deus e de quem amamos, começamos o capítulo que sonhamos ' +
        'escrever a vida inteira.',
    },
  ],
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
