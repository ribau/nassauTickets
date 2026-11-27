import test from 'node:test'
import assert from 'node:assert/strict'
import { formatTicket, isBusinessHours, selectNext, transition } from '../src/domain/queue.js'

const waiting = (type, id) => ({ type, id, status: 'AGUARDANDO' })

test('numeração diária tem data, tipo e três dígitos', () => {
  assert.equal(formatTicket('SP', 1, '2026-12-02'), '261202-SP001')
  assert.equal(formatTicket('SG', 999, '2026-01-09'), '260109-SG999')
  assert.throws(() => formatTicket('SE', 1000, '2026-12-02'))
})

test('fila alterna SP com SE e SG e preserva ordem por tipo', () => {
  const tickets = [waiting('SP', 1), waiting('SP', 2), waiting('SE', 3), waiting('SG', 4)]
  assert.equal(selectNext(tickets, null, null).id, 1)
  assert.equal(selectNext(tickets, 'SP', null).id, 3)
  assert.equal(selectNext(tickets, 'SP', 'SE').id, 4)
  assert.equal(selectNext([waiting('SP', 2)], 'SP', 'SE').id, 2)
  assert.equal(selectNext([], 'SP', 'SE'), null)
})

test('rechamada é opcional para iniciar e obrigatória para ausência', () => {
  assert.equal(transition('CHAMADA', 'EM_ATENDIMENTO'), 'EM_ATENDIMENTO')
  assert.equal(transition('CHAMADA_NOVAMENTE', 'NAO_COMPARECEU'), 'NAO_COMPARECEU')
  assert.throws(() => transition('CHAMADA', 'NAO_COMPARECEU'))
  assert.throws(() => transition('ATENDIDA', 'AGUARDANDO'))
})

test('expediente inclui 7h e exclui 17h', () => {
  assert.equal(isBusinessHours(6, 59), false)
  assert.equal(isBusinessHours(7, 0), true)
  assert.equal(isBusinessHours(16, 59), true)
  assert.equal(isBusinessHours(17, 0), false)
})
