import { useEffect, useState } from 'react'
import QueueSummary from './components/QueueSummary.jsx'
import TicketOption from './components/TicketOption.jsx'
import { createTicket } from './services/ticketService.js'

const ticketTypes = [
  { code: 'SP', title: 'Atendimento prioritário', description: 'Para pessoas com direito a atendimento preferencial.', tone: 'violet' },
  { code: 'SG', title: 'Atendimento geral', description: 'Para cadastros, coletas e demais serviços do laboratório.', tone: 'blue' },
  { code: 'SE', title: 'Retirada de exames', description: 'Fluxo rápido para resultados que já estão disponíveis.', tone: 'green' },
]

function App() {
  const [counters, setCounters] = useState({ SP: 0, SG: 0, SE: 0 })
  const [issuedTickets, setIssuedTickets] = useState([])
  const [currentTicket, setCurrentTicket] = useState(null)

  useEffect(() => {
    document.title = currentTicket
      ? `${currentTicket.number} | nassauTickets`
      : 'nassauTickets | Laboratório'
  }, [currentTicket])

  function handleIssue(type) {
    const nextSequence = counters[type] + 1
    const ticket = createTicket(type, nextSequence)

    setCounters((current) => ({ ...current, [type]: nextSequence }))
    setIssuedTickets((current) => [ticket, ...current].slice(0, 5))
    setCurrentTicket(ticket)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="nassauTickets - início">
          <span className="brand-mark">n</span>
          <span>nassau<strong>Tickets</strong></span>
        </a>
        <span className="phase-badge">Fase 1</span>
      </header>

      <main id="inicio">
        <section className="hero">
          <div>
            <span className="eyebrow">Laboratório de Análises Clínicas</span>
            <h1>Seu atendimento começa aqui.</h1>
            <p>Escolha o serviço desejado para emitir uma senha. O atendimento ocorre das 7h às 17h.</p>
          </div>
          <div className="status-card" aria-label="Status do atendimento">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>Atendimento aberto</strong>
              <small>Protótipo local para a primeira entrega</small>
            </div>
          </div>
        </section>

        <section className="ticket-section" aria-labelledby="ticket-heading">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Totem de autoatendimento</span>
              <h2 id="ticket-heading">Qual atendimento você precisa?</h2>
            </div>
            <p>Toque em uma opção para gerar sua senha.</p>
          </div>

          <div className="ticket-grid">
            {ticketTypes.map((ticketType) => (
              <TicketOption key={ticketType.code} {...ticketType} onIssue={handleIssue} />
            ))}
          </div>
        </section>

        <section className="lower-grid">
          <article className="receipt-card" aria-live="polite">
            <span className="eyebrow">Senha emitida</span>
            {currentTicket ? (
              <>
                <span className="ticket-number">{currentTicket.number}</span>
                <p>Aguarde a chamada no painel. Guarde este número.</p>
                <time dateTime={currentTicket.createdAt.toISOString()}>
                  Emitida às {currentTicket.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">#</span>
                <p>Sua senha aparecerá aqui após a escolha do atendimento.</p>
              </div>
            )}
          </article>

          <QueueSummary tickets={issuedTickets} counters={counters} />
        </section>
      </main>

      <footer>
        <span>nassauTickets</span>
        <span>Protótipo acadêmico · 2026</span>
      </footer>
    </div>
  )
}

export default App

