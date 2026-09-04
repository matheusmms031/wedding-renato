/**
 * As três chaves do PIX. A tabela é genérica; este módulo é quem sabe quais
 * chaves existem e como elas viram um objeto para a API.
 */
const CHAVES = {
  pixKey: 'pix_key',
  pixReceiverName: 'pix_receiver_name',
  pixReceiverCity: 'pix_receiver_city',
}

export async function obterConfigPix(models) {
  const linhas = await models.Setting.findAll({
    where: { key: Object.values(CHAVES) },
    raw: true,
  })

  const porChave = new Map(linhas.map((linha) => [linha.key, linha.value]))

  return {
    pixKey: porChave.get(CHAVES.pixKey) ?? '',
    pixReceiverName: porChave.get(CHAVES.pixReceiverName) ?? '',
    pixReceiverCity: porChave.get(CHAVES.pixReceiverCity) ?? '',
  }
}

export async function salvar(models, entrada) {
  // upsert em vez de create: a linha é única por chave e a tela salva por cima.
  await Promise.all(
    Object.entries(CHAVES).map(([campo, chave]) =>
      models.Setting.upsert({ key: chave, value: entrada[campo] ?? '' }),
    ),
  )

  return obterConfigPix(models)
}
