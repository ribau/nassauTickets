const pad = (value, size) => String(value).padStart(size, '0')

export function createTicket(type, sequence, now = new Date()) {
  if (!['SP', 'SG', 'SE'].includes(type)) {
    throw new Error('Tipo de senha inválido')
  }

  const date = [
    pad(now.getFullYear() % 100, 2),
    pad(now.getMonth() + 1, 2),
    pad(now.getDate(), 2),
  ].join('')

  return {
    number: `${date}-${type}${pad(sequence, 3)}`,
    type,
    status: 'EMITIDA',
    createdAt: now,
  }
}

