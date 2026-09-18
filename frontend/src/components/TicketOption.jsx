function TicketOption({ code, title, description, tone, onIssue }) {
  return (
    <article className={`ticket-option ticket-option--${tone}`}>
      <span className="type-code" aria-hidden="true">{code}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <button type="button" onClick={() => onIssue(code)} aria-label={`Emitir senha ${code} - ${title}`}>
        Emitir senha <span aria-hidden="true">→</span>
      </button>
    </article>
  )
}

export default TicketOption

