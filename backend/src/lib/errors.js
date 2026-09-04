/**
 * Erro de domínio. Os services lançam AppError; o error-handler o converte em
 * resposta HTTP. A mensagem vai crua para a tela do convidado, então sempre em
 * português.
 */
export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export const badRequest = (code, message, details) => new AppError(400, code, message, details)
export const unauthorized = (message = 'Sua sessão expirou. Entre novamente.') =>
  new AppError(401, 'UNAUTHENTICATED', message)
export const forbidden = (message = 'Você não tem permissão para esta ação.') =>
  new AppError(403, 'FORBIDDEN', message)
export const notFound = (code, message) => new AppError(404, code, message)
export const payloadTooLarge = (code, message) => new AppError(413, code, message)
export const conflict = (code, message, details) => new AppError(409, code, message, details)
