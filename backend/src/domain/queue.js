/** Regras puras da fila. A seleção e atualização devem ocorrer na mesma transação. */
export const TYPES = Object.freeze(['SP', 'SE', 'SG'])
export const STATES = Object.freeze({
  ISSUED: 'EMITIDA', WAITING: 'AGUARDANDO', CALLED: 'CHAMADA',
  RECALLED: 'CHAMADA_NOVAMENTE', IN_SERVICE: 'EM_ATENDIMENTO',
  SERVED: 'ATENDIDA', NO_SHOW: 'NAO_COMPARECEU', DISCARDED: 'DESCARTADA',
})

const transitions = {
  EMITIDA: ['AGUARDANDO'],
  AGUARDANDO: ['CHAMADA', 'DESCARTADA'],
  CHAMADA: ['CHAMADA_NOVAMENTE', 'EM_ATENDIMENTO'],
  CHAMADA_NOVAMENTE: ['EM_ATENDIMENTO', 'NAO_COMPARECEU'],
  EM_ATENDIMENTO: ['ATENDIDA'],
}

export function transition(current, next) {
  if (!transitions[current]?.includes(next)) {
    throw new Error(`Transição inválida: ${current} → ${next}`)
  }
  return next
}

export function formatTicket(type, sequence, date) {
  if (!TYPES.includes(type)) throw new Error('Tipo de senha inválido')
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 999) {
    throw new Error('Sequência diária deve estar entre 1 e 999')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data inválida')
  const [year, month, day] = date.split('-')
  return `${year.slice(-2)}${month}${day}-${type}${String(sequence).padStart(3, '0')}`
}

/**
 * Alterna SP e não SP sempre que possível. Entre as não prioritárias,
 * alterna SE e SG quando ambas estão disponíveis, evitando inanição de SG.
 * Em cada tipo, respeita a ordem de emissão recebida.
 */
export function selectNext(tickets, previousType, previousNonPriorityType) {
  const waiting = tickets.filter((ticket) => ticket.status === STATES.WAITING)
  const first = (type) => waiting.find((ticket) => ticket.type === type)
  const sp = first('SP')
  const se = first('SE')
  const sg = first('SG')
  const nonPriority = previousNonPriorityType === 'SE' ? (sg ?? se) : (se ?? sg)
  return (previousType === 'SP' ? (nonPriority ?? sp) : (sp ?? nonPriority)) ?? null
}

export function isBusinessHours(hour, minute = 0) {
  return Number.isInteger(hour) && Number.isInteger(minute) && minute >= 0 && minute < 60 && hour >= 7 && hour < 17
}
