function QueueSummary({ tickets, counters }) {
  const total = Object.values(counters).reduce((sum, value) => sum + value, 0)

  return (
    <article className="queue-card">
      <div className="queue-header">
        <div>
          <span className="eyebrow">Sessão atual</span>
          <h2>Senhas emitidas</h2>
        </div>
        <strong>{total}</strong>
      </div>

      {tickets.length > 0 ? (
        <ul className="ticket-list">
          {tickets.map((ticket) => (
            <li key={ticket.number}>
              <span className={`mini-code mini-code--${ticket.type.toLowerCase()}`}>{ticket.type}</span>
              <span>{ticket.number}</span>
              <time dateTime={ticket.createdAt.toISOString()}>
                {ticket.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="queue-empty">Nenhuma senha emitida nesta sessão.</p>
      )}

      <p className="prototype-note">Na segunda fase, esta área será alimentada pela API e separada do painel das últimas chamadas.</p>
    </article>
  )
}

export default QueueSummary

