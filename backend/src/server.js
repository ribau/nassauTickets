import http from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { formatTicket, isBusinessHours, selectNext, transition } from './domain/queue.js'

const db = new DatabaseSync(process.env.DB_PATH || 'nassautickets.sqlite')
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, name TEXT NOT NULL, login TEXT UNIQUE NOT NULL, password TEXT NOT NULL, manager INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS counters(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY, number TEXT UNIQUE NOT NULL, type TEXT NOT NULL, day TEXT NOT NULL, sequence INTEGER NOT NULL, status TEXT NOT NULL, issued_at TEXT NOT NULL, user_id INTEGER REFERENCES users(id), counter_id INTEGER REFERENCES counters(id), called_at TEXT, recalled_at TEXT, started_at TEXT, finished_at TEXT, UNIQUE(day,type,sequence));
CREATE INDEX IF NOT EXISTS queue_idx ON tickets(day,status,type,id);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, ticket_id INTEGER NOT NULL REFERENCES tickets(id), user_id INTEGER REFERENCES users(id), counter_id INTEGER REFERENCES counters(id), event TEXT NOT NULL, occurred_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS queue_state(id INTEGER PRIMARY KEY CHECK(id=1), previous_type TEXT, previous_nonpriority TEXT);
INSERT OR IGNORE INTO queue_state(id) VALUES(1);`)
const get = (sql, ...params) => db.prepare(sql).get(...params)
const all = (sql, ...params) => db.prepare(sql).all(...params)
const run = (sql, ...params) => db.prepare(sql).run(...params)
const now = () => new Date().toISOString()
const local = () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Fortaleza', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).reduce((a,p)=>(a[p.type]=p.value,a),{})
const today = () => { const p=local(); return `${p.year}-${p.month}-${p.day}` }
const working = () => { const p=local(); return isBusinessHours(Number(p.hour),Number(p.minute)) }
const hash = (password, salt=randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password,salt,64).toString('hex')}`
const verify = (password, stored) => { const [salt,value]=stored.split(':'); const a=scryptSync(password,salt,64), b=Buffer.from(value,'hex'); return a.length===b.length && timingSafeEqual(a,b) }
const sessions = new Map()
const tx = (fn) => { db.exec('BEGIN IMMEDIATE'); try { const result=fn(); db.exec('COMMIT'); return result } catch(e) { db.exec('ROLLBACK'); throw e } }
const fail = (status, message) => { const e=new Error(message); e.status=status; throw e }
const event = (ticket, user, counter, action) => run('INSERT INTO events(ticket_id,user_id,counter_id,event,occurred_at) VALUES(?,?,?,?,?)',ticket,user,counter,action,now())
const cleanup = () => tx(() => { const stale=all("SELECT id FROM tickets WHERE status='AGUARDANDO' AND (day < ? OR (day = ? AND ? = 1))",today(),today(),local().hour >= '17' ? 1 : 0); for(const t of stale) {run("UPDATE tickets SET status='DESCARTADA' WHERE id=?",t.id); event(t.id,null,null,'DESCARTADA')} })
function issue(type) { if(!['SP','SG','SE'].includes(type)) fail(400,'Tipo inválido'); if(!working()) fail(409,'Emissão disponível das 7h às 17h'); return tx(()=>{ const day=today(); const sequence=(get('SELECT MAX(sequence) AS n FROM tickets WHERE day=? AND type=?',day,type).n || 0)+1; if(sequence>999) fail(409,'Limite diário de senhas atingido'); const number=formatTicket(type,sequence,day); const id=run("INSERT INTO tickets(number,type,day,sequence,status,issued_at) VALUES(?,?,?,?,'AGUARDANDO',?)",number,type,day,sequence,now()).lastInsertRowid; event(id,null,null,'EMITIDA'); event(id,null,null,'AGUARDANDO'); return get('SELECT * FROM tickets WHERE id=?',id) }) }
function next(user, counter) { if(!working()) fail(409,'Chamadas disponíveis das 7h às 17h'); return tx(()=>{ const c=get('SELECT * FROM counters WHERE id=? AND active=1',counter); if(!c) fail(400,'Guichê inválido'); if(get("SELECT id FROM tickets WHERE (user_id=? OR counter_id=?) AND status IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO')",user.id,counter)) fail(409,'Atendente ou guichê já possui atendimento em andamento'); const state=get('SELECT * FROM queue_state WHERE id=1'); const items=all("SELECT * FROM tickets WHERE day=? AND status='AGUARDANDO' ORDER BY id",today()); const chosen=selectNext(items,state.previous_type,state.previous_nonpriority); if(!chosen) fail(404,'Não há senhas aguardando'); run("UPDATE tickets SET status='CHAMADA',user_id=?,counter_id=?,called_at=? WHERE id=?",user.id,counter,now(),chosen.id); run('UPDATE queue_state SET previous_type=?,previous_nonpriority=? WHERE id=1',chosen.type,chosen.type==='SP'?state.previous_nonpriority:chosen.type); event(chosen.id,user.id,counter,'CHAMADA'); return ticket(chosen.id) }) }
const ticket = id => get('SELECT t.*,u.name AS attendant,c.name AS counter_name FROM tickets t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN counters c ON c.id=t.counter_id WHERE t.id=?',id)
function change(id,user,action) { const targets={recall:'CHAMADA_NOVAMENTE',start:'EM_ATENDIMENTO',finish:'ATENDIDA',absent:'NAO_COMPARECEU'}; const fields={recall:'recalled_at',start:'started_at',finish:'finished_at'}; if(!targets[action]) fail(404,'Ação inválida'); return tx(()=>{const t=ticket(id); if(!t) fail(404,'Senha não encontrada'); if(t.user_id!==user.id) fail(403,'Atendimento pertence a outro atendente'); try { transition(t.status,targets[action]) } catch(e){fail(409,e.message)}; const field=fields[action]; if(field) run(`UPDATE tickets SET status=?,${field}=? WHERE id=?`,targets[action],now(),id); else run('UPDATE tickets SET status=? WHERE id=?',targets[action],id); event(id,user.id,t.counter_id,targets[action]); return ticket(id)}) }
const json = (res,status,data) => {res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(data))}
async function body(req) { let raw=''; for await(const chunk of req) {raw+=chunk; if(raw.length>20000) fail(413,'Dados excedem o limite')} try{return raw?JSON.parse(raw):{}}catch{fail(400,'JSON inválido')} }
const validText = (v,n=120) => typeof v==='string' && v.trim().length>0 && v.trim().length<=n

const server=http.createServer(async(req,res)=>{ try {
  const url=new URL(req.url,'http://localhost'); const path=url.pathname; const method=req.method
  if(!path.startsWith('/api/')) return json(res,404,{error:'Não encontrado'})
  if(method==='GET' && path==='/api/status') return json(res,200,{open:working(),setupRequired:!get('SELECT id FROM users LIMIT 1'),date:today()})
  if(method==='POST' && path==='/api/setup') { if(get('SELECT id FROM users LIMIT 1')) fail(403,'Configuração já realizada'); const b=await body(req); if(!validText(b.name)||!validText(b.login,80)||typeof b.password!=='string'||b.password.length<8) fail(400,'Informe nome, login e senha com ao menos 8 caracteres'); tx(()=>{run('INSERT INTO users(name,login,password,manager) VALUES(?,?,?,1)',b.name.trim(),b.login.trim(),hash(b.password)); for(let n=1;n<=3;n++)run('INSERT INTO counters(name) VALUES(?)',`Guichê ${n}`)}); return json(res,201,{message:'Gestor criado'}) }
  if(method==='POST' && path==='/api/login') { const b=await body(req); const u=get('SELECT * FROM users WHERE login=?',b.login||''); if(!u||typeof b.password!=='string'||!verify(b.password,u.password)) fail(401,'Login ou senha inválidos'); const token=randomBytes(32).toString('hex'); sessions.set(token,{id:u.id,name:u.name,manager:!!u.manager,expires:Date.now()+8*3600000}); res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`); return json(res,200,{id:u.id,name:u.name,manager:!!u.manager}) }
  if(method==='POST' && path==='/api/tickets') {cleanup(); const b=await body(req); return json(res,201,issue(b.type))}
  if(method==='GET' && path==='/api/panel') {cleanup(); return json(res,200,all("SELECT t.number,t.type,t.called_at,t.recalled_at,c.name AS counter_name FROM tickets t JOIN counters c ON c.id=t.counter_id WHERE t.called_at IS NOT NULL AND t.day=? ORDER BY COALESCE(t.recalled_at,t.called_at) DESC LIMIT 5",today()))}
  const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('session='))?.slice(8); const user=sessions.get(token); if(!user||user.expires<Date.now()) {if(token)sessions.delete(token); fail(401,'Faça login para continuar')}
  if(method==='POST' && path==='/api/logout') {sessions.delete(token);res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true})}
  if(method==='GET' && path==='/api/me') return json(res,200,user)
  if(method==='GET' && path==='/api/counters') return json(res,200,all('SELECT * FROM counters WHERE active=1 ORDER BY id'))
  if(method==='GET' && path==='/api/current') return json(res,200,get("SELECT t.*,c.name AS counter_name FROM tickets t LEFT JOIN counters c ON c.id=t.counter_id WHERE t.user_id=? AND t.status IN ('CHAMADA','CHAMADA_NOVAMENTE','EM_ATENDIMENTO') ORDER BY t.id DESC LIMIT 1",user.id)||null)
  if(method==='POST' && path==='/api/call') {cleanup(); const b=await body(req); return json(res,200,next(user,Number(b.counterId)))}
  const match=path.match(/^\/api\/tickets\/(\d+)\/(recall|start|finish|absent)$/); if(method==='POST'&&match) return json(res,200,change(Number(match[1]),user,match[2]))
  if(!user.manager) fail(403,'Acesso exclusivo do gestor')
  if(method==='POST' && path==='/api/users') {const b=await body(req); if(!validText(b.name)||!validText(b.login,80)||typeof b.password!=='string'||b.password.length<8)fail(400,'Dados inválidos'); try{run('INSERT INTO users(name,login,password,manager) VALUES(?,?,?,0)',b.name.trim(),b.login.trim(),hash(b.password))}catch{fail(409,'Login já cadastrado')};return json(res,201,{ok:true})}
  if(method==='POST' && path==='/api/counters') {const b=await body(req);if(!validText(b.name,30))fail(400,'Informe o nome do guichê');try{run('INSERT INTO counters(name) VALUES(?)',b.name.trim())}catch{fail(409,'Guichê já cadastrado')};return json(res,201,{ok:true})}
  if(method==='GET' && path==='/api/reports') { const from=url.searchParams.get('from'),to=url.searchParams.get('to'); if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||from>to)fail(400,'Informe período válido'); const tickets=all('SELECT t.*,u.name AS attendant,c.name AS counter_name FROM tickets t LEFT JOIN users u ON u.id=t.user_id LEFT JOIN counters c ON c.id=t.counter_id WHERE day BETWEEN ? AND ? ORDER BY t.id DESC',from,to); return json(res,200,{tickets}) }
  fail(404,'Não encontrado')
}catch(e){json(res,e.status||500,{error:e.status?e.message:'Erro interno do servidor'})} })
const port=Number(process.env.PORT||3001); server.listen(port,'127.0.0.1',()=>console.log(`API disponível em http://127.0.0.1:${port}`))
