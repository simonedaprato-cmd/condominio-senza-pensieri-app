import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';
const AUTH_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STATI_PRATICA = ['Presa in carico', 'Sopralluogo effettuato', 'Preventivata', 'Chiusa'];

function buildPublicUrl(fileName) {
  if (!fileName) return '';
  return SUPABASE_URL + '/storage/v1/object/public/allegati/' + encodeURIComponent(fileName);
}

function formatEuro(value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
}

function badgeClass(stato) {
  if (stato === 'Presa in carico') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (stato === 'Sopralluogo effettuato') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (stato === 'Preventivata') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (stato === 'Chiusa') return 'bg-slate-100 text-slate-700 border-slate-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function priorityClass(priorita) {
  if (priorita === 'Alta') return 'text-red-600';
  if (priorita === 'Bassa') return 'text-emerald-600';
  return 'text-amber-600';
}

function LogoMark() {
  const [erroreLogo, setErroreLogo] = useState(false);

  return (
    <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-visible md:h-36 md:w-36">
      <div className="absolute inset-0 rounded-full bg-emerald-200/40 blur-2xl" />
      {!erroreLogo ? (
        <img
          src={LOGO_SRC}
          alt="Condominio Senza Pensieri"
          onError={() => setErroreLogo(true)}
          className="relative z-10 h-48 w-48 object-contain drop-shadow-2xl md:h-64 md:w-64"
        />
      ) : (
        <div className="relative z-10 rounded-2xl bg-white px-4 py-3 text-center text-xs font-bold text-emerald-700 shadow-lg">
          CSP
        </div>
      )}
    </div>
  );
}

async function loadUserProfile(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();

  const { data: utente, error } = await supabase
    .from('utenti')
    .select('email, ruolo, condominio, telefono, nome')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (error) throw error;

  if (!utente) {
    return {
      email,
      ruolo: 'non_configurato',
      nome: '',
      telefono: '',
      condominio: '',
      condominiIds: [],
      condomini: [],
    };
  }

  const { data: collegamenti, error: collegamentiError } = await supabase
    .from('utenti_condomini')
    .select('condominio_id, condomini(id, nome, indirizzo)')
    .ilike('email', normalizedEmail);

  if (collegamentiError) throw collegamentiError;

  const condomini = (collegamenti || []).map((item) => item.condomini).filter(Boolean);

  return {
    ...utente,
    condominiIds: (collegamenti || []).map((item) => item.condominio_id),
    condomini,
    condominio: condomini[0]?.nome || utente.condominio || '',
  };
}

function Login() {
  const [email, setEmail] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [invioInCorso, setInvioInCorso] = useState(false);

  const inviaLink = async () => {
    const emailPulita = email.trim().toLowerCase();
    if (!emailPulita || invioInCorso) return;

    setInvioInCorso(true);
    setMessaggio('Invio link in corso...');

    const { error } = await supabase.auth.signInWithOtp({
      email: emailPulita,
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    });

    setInvioInCorso(false);

    if (error) {
      setMessaggio('Accesso non riuscito: ' + error.message);
      return;
    }

    setMessaggio('Link inviato. Controlla la tua email.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Accesso</h1>
        <p className="mt-2 text-sm text-slate-500">Inserisci la tua email per ricevere il magic link.</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="mt-5 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
        <button
          onClick={inviaLink}
          disabled={invioInCorso || !email.trim()}
          className="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60"
        >
          {invioInCorso ? 'Invio...' : 'Ricevi link'}
        </button>
        {messaggio && <p className="mt-4 text-sm text-slate-600">{messaggio}</p>}
      </div>
    </div>
  );
}

function Header({ utente, ruolo, userProfile, condominiVisibili, segnalazioni, onLogout }) {
  const ora = new Date().getHours();
  let saluto = 'Ciao';
  if (ora >= 5 && ora < 12) saluto = 'Buongiorno';
  else if (ora >= 12 && ora < 18) saluto = 'Buon pomeriggio';
  else if (ora >= 18 && ora < 23) saluto = 'Buonasera';
  else saluto = 'Buonanotte';

  const criticita = segnalazioni.filter((s) => s.priorita === 'Alta').length;
  const preventiviAperti = segnalazioni.filter((s) => s.stato_invio === 'inviato' && !s.stato_conversione).length;

  const messaggioRuolo = (() => {
    if (ruolo === 'gestore') {
      if (criticita > 0) return 'Controllo globale: ' + criticita + ' criticità operative attive';
      if (preventiviAperti > 0) return preventiviAperti + ' preventivi in attesa di risposta';
      return 'Controllo globale attivo: situazione sotto controllo';
    }

    if (ruolo === 'amministratore') {
      if (criticita > 0) return criticita + ' criticità da monitorare';
      return 'Gestisci ' + condominiVisibili.length + ' condomini';
    }

    if (ruolo === 'condominio' && userProfile?.condominio) {
      return 'Condominio: ' + userProfile.condominio;
    }

    return 'Profilo attivo';
  })();

  const whatsappText = 'Ciao Simone, sono ' + (userProfile?.nome || 'un utente') + ', del condominio ' + (userProfile?.condominio || 'non specificato') + '. Ho bisogno di supporto.';

  return (
    <header className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-800 px-2 pb-6 pt-6 shadow-[0_35px_120px_-30px_rgba(5,150,105,0.85)] backdrop-blur-2xl md:px-6 md:pb-8 md:pt-12">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
      <div className="absolute right-1/3 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute -bottom-20 left-0 h-52 w-52 rounded-full bg-emerald-100/20 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-2 md:items-center md:gap-4">
          <LogoMark />
          <div className="min-w-0 text-white">
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-white/95 md:text-2xl">Condominio Senza Pensieri</h1>
            <p className="mt-1 text-xs text-white/75 md:text-sm">Gestione intelligente delle segnalazioni</p>
            {userProfile?.nome && (
              <div className="mt-3 space-y-3">
                <p className="text-2xl font-black leading-tight tracking-tight text-white drop-shadow md:text-4xl">{saluto} {userProfile.nome}</p>
                <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 backdrop-blur-xl md:text-base">{messaggioRuolo}</p>
                <div className="mt-2 flex flex-wrap gap-2 md:max-w-xl">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl md:text-sm">
                    Criticità <strong className="text-white">{criticita}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl md:text-sm">
                    Preventivi <strong className="text-white">{preventiviAperti}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl md:text-sm">
                    Condomini <strong className="text-white">{condominiVisibili.length}</strong>
                  </span>
                </div>
              </div>
            )}
            <div className="mt-3 space-y-1 text-[11px] text-white/75 md:text-xs">
              <p className="break-all">Utente: {utente?.email}</p>
              <p>Ruolo: {ruolo}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <a
            href={'https://wa.me/393477921965?text=' + encodeURIComponent(whatsappText)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/15 shadow-lg backdrop-blur-xl transition duration-300 hover:scale-110 hover:bg-green-500/80"
            title="WhatsApp"
          >
            <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white" aria-hidden="true">
              <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.4 2 7.7L.4 31.6l8.1-2c2.2 1.2 4.8 1.9 7.5 1.9 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.6c-2.4 0-4.7-.7-6.6-1.9l-.5-.3-4.8 1.2 1.3-4.7-.3-.5C4 20.7 3.4 18.4 3.4 16 3.4 8.9 8.9 3.4 16 3.4S28.6 8.9 28.6 16 23.1 29 16 29zm7.4-9.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.7-.2-1 .2-.3.4-1.1 1.3-1.4 1.6-.3.3-.5.3-.9.1-.4-.2-1.8-.7-3.4-2.2-1.3-1.2-2.2-2.7-2.4-3.1-.3-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7 0-.2-1-2.4-1.4-3.3-.3-.8-.7-.7-1-.7h-.8c-.3 0-.7.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.4 3.5 1.6 3.7c.2.2 2.8 4.3 6.9 6 .9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5z" />
            </svg>
          </a>
          <button onClick={onLogout} className="rounded-2xl border border-white/20 bg-white/15 px-5 py-3 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition duration-300 hover:scale-105 hover:bg-white/25">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function DashboardStat({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-600 text-white',
    sky: 'bg-sky-500 text-white',
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={'mt-2 inline-flex min-w-14 justify-center rounded-xl px-3 py-2 text-lg font-bold ' + toneClass}>{value}</p>
    </div>
  );
}

function DashboardVendite({ segnalazioni }) {
  const inviati = segnalazioni.filter((s) => s.stato_invio === 'inviato');
  const accettati = segnalazioni.filter((s) => s.stato_conversione === 'accettato');
  const rifiutati = segnalazioni.filter((s) => s.stato_conversione === 'rifiutato');

  const valoreInviato = inviati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const valoreAccettato = accettati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const valoreRifiutato = rifiutati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const conversione = inviati.length ? Math.round((accettati.length / inviati.length) * 100) : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Vendite</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard fatturato</h2>
      <p className="mt-1 text-sm text-slate-500">Valore economico dei preventivi inviati, accettati e rifiutati.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Valore inviato" value={formatEuro(valoreInviato)} />
        <DashboardStat label="Fatturato accettato" value={formatEuro(valoreAccettato)} tone="emerald" />
        <DashboardStat label="Valore rifiutato" value={formatEuro(valoreRifiutato)} tone="red" />
        <DashboardStat label="Conversione" value={conversione + '%'} tone="amber" />
      </div>
    </section>
  );
}

function DashboardOperativa({ ruolo, segnalazioni, condomini, onOpen }) {
  const totale = segnalazioni.length;
  const urgenti = segnalazioni.filter((s) => s.priorita === 'Alta').length;
  const prese = segnalazioni.filter((s) => s.stato === 'Presa in carico').length;
  const lavorazione = segnalazioni.filter((s) => s.stato === 'Sopralluogo effettuato' || s.stato === 'Preventivata').length;
  const chiuse = segnalazioni.filter((s) => s.stato === 'Chiusa').length;

  const critiche = segnalazioni.filter((s) => s.priorita === 'Alta' || s.stato === 'Presa in carico').slice(0, 5);

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 p-6 text-white shadow-[0_25px_80px_-35px_rgba(5,150,105,0.75)]">
        <p className="text-sm uppercase tracking-[0.25em] text-white/70">Dashboard</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{ruolo === 'gestore' ? 'Cruscotto gestore' : 'Cruscotto amministratore'}</h2>
        <p className="mt-2 max-w-2xl text-white/80">Controllo rapido delle pratiche, delle urgenze e degli stati operativi.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DashboardStat label="Totali" value={totale} />
        <DashboardStat label="Urgenze" value={urgenti} tone="red" />
        <DashboardStat label="Prese in carico" value={prese} tone="amber" />
        <DashboardStat label="In lavorazione" value={lavorazione} tone="sky" />
        <DashboardStat label="Chiuse" value={chiuse} tone="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Situazione per condominio</h3>
          <div className="mt-4 space-y-3">
            {condomini.map((c) => {
              const items = segnalazioni.filter((s) => s.condominio_id === c.id);
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900">{c.nome}</p>
                      {c.indirizzo && <p className="text-sm text-slate-500">{c.indirizzo}</p>}
                    </div>
                    <p className="text-sm font-bold text-slate-700">{items.length} pratiche</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Da monitorare</h3>
          <p className="mb-4 text-sm text-slate-500">Pratiche prioritarie in evidenza.</p>
          <div className="space-y-3">
            {critiche.length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">Situazione sotto controllo.</div>
            ) : (
              critiche.map((s) => (
                <button key={s.id} onClick={() => onOpen(s)} className="w-full rounded-2xl border border-slate-200 p-4 text-left hover:bg-emerald-50/40">
                  <p className="font-semibold text-slate-900">{s.titolo}</p>
                  <p className="mt-1 text-sm text-slate-500">{s.condominio}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ActionBar({ condomini, filtroCondominioId, onChangeFiltroCondominio, searchTerm, onChangeSearchTerm, onRefresh, loading, ruolo }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Azioni rapide</p>
          <p className="mt-1 text-sm text-slate-500">Filtra, cerca e aggiorna le pratiche.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] lg:w-auto">
          <select value={filtroCondominioId} onChange={(e) => onChangeFiltroCondominio(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
            <option value="">Tutti i condomini</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input value={searchTerm} onChange={(e) => onChangeSearchTerm(e.target.value)} placeholder="Cerca pratica..." className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <button onClick={onRefresh} disabled={loading} className="rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60">
            {loading ? 'Sincronizzo...' : 'Aggiorna live'}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">Vista: {ruolo}</span>
        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-600">Condomini visibili: {condomini.length}</span>
      </div>
    </section>
  );
}

function FormSegnalazione({ condomini, selectedCondominioId, onChangeCondominio, onSave, saving }) {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('Infiltrazioni');
  const [priorita, setPriorita] = useState('Media');
  const [luogo, setLuogo] = useState('');
  const [referente, setReferente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [file, setFile] = useState(null);
  const [condominioId, setCondominioId] = useState(selectedCondominioId || '');
  const [errore, setErrore] = useState('');

  const reset = () => {
    setTitolo('');
    setDescrizione('');
    setCategoria('Infiltrazioni');
    setPriorita('Media');
    setLuogo('');
    setReferente('');
    setTelefono('');
    setFile(null);
    setErrore('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrore('');
    if (!titolo.trim() || !descrizione.trim() || !luogo.trim() || !condominioId) {
      setErrore('Compila titolo, descrizione, luogo e condominio.');
      return;
    }
    await onSave({ titolo, descrizione, categoria, priorita, luogo, referente, telefono, file, condominioId });
    reset();
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5">
      <select value={condominioId} onChange={(e) => { setCondominioId(e.target.value); onChangeCondominio(e.target.value); }} className="w-full rounded-xl border px-3 py-2">
        <option value="">Seleziona condominio</option>
        {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Titolo" className="w-full rounded-xl border px-3 py-2" />
      <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Descrizione" className="min-h-24 w-full rounded-xl border px-3 py-2" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="rounded-xl border px-3 py-2">
          <option>Infiltrazioni</option><option>Balconi</option><option>Facciate</option><option>Copertura</option><option>Grondaie e pluviali</option><option>Parti comuni</option>
        </select>
        <select value={priorita} onChange={(e) => setPriorita(e.target.value)} className="rounded-xl border px-3 py-2">
          <option>Bassa</option><option>Media</option><option>Alta</option>
        </select>
      </div>
      <input value={luogo} onChange={(e) => setLuogo(e.target.value)} placeholder="Luogo del problema" className="w-full rounded-xl border px-3 py-2" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <input value={referente} onChange={(e) => setReferente(e.target.value)} placeholder="Referente" className="rounded-xl border px-3 py-2" />
        <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Telefono" className="rounded-xl border px-3 py-2" />
      </div>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      {errore && <p className="text-sm text-red-600">{errore}</p>}
      <button disabled={saving} className="rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-60">
        {saving ? 'Salvataggio...' : 'Salva segnalazione'}
      </button>
    </form>
  );
}

function SegnalazioneCard({ segnalazione, onOpen }) {
  return (
    <button onClick={() => onOpen(segnalazione)} className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-md">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-900">{segnalazione.titolo}</p>
          <p className="break-words text-sm text-slate-500">{segnalazione.condominio}</p>
        </div>
        <span className={'shrink-0 rounded-full border px-2 py-1 text-xs ' + badgeClass(segnalazione.stato)}>{segnalazione.stato}</span>
      </div>
    </button>
  );
}

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote, onUploadFile, onUpdateImporto }) {
  const [nota, setNota] = useState('');
  const [file, setFile] = useState(null);
  const [importo, setImporto] = useState('');
  const [uploading, setUploading] = useState(false);

  if (!segnalazione) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-2 md:p-4">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl md:h-[90vh] md:rounded-3xl">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl md:p-5">
          <div>
            <h3 className="break-words text-lg font-bold leading-tight md:text-xl">{segnalazione.titolo}</h3>
            <p className="mt-1 text-sm text-slate-500">{segnalazione.condominio}</p>
          </div>
          <button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Chiudi</button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 md:grid-cols-2 md:p-5">
          <div className="space-y-3">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            <p><span className="text-slate-500">Importo preventivo:</span> {formatEuro(segnalazione.importo_preventivo || 0)}</p>
            {segnalazione.allegatoUrl && <img src={segnalazione.allegatoUrl} alt="Allegato" className="w-full rounded-xl border border-slate-200" />}
            {segnalazione.fotosopralluogourl && <img src={segnalazione.fotosopralluogourl} alt="Sopralluogo" className="w-full rounded-xl border border-purple-200" />}
            {segnalazione.preventivourl && <a href={segnalazione.preventivourl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-bold text-emerald-700 underline">Apri preventivo</a>}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {STATI_PRATICA.map((stato) => (
                <button key={stato} onClick={() => onChangeStatus(segnalazione.id, stato)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
                  {stato}
                </button>
              ))}
            </div>

            {segnalazione.stato === 'Sopralluogo effettuato' && (
              <div className="space-y-2 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <p className="font-semibold text-purple-800">Foto sopralluogo</p>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button disabled={!file || uploading} onClick={async () => { setUploading(true); await onUploadFile(segnalazione.id, file, 'fotosopralluogonome', 'sopralluogo'); setFile(null); setUploading(false); }} className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  Carica foto
                </button>
              </div>
            )}

            {segnalazione.stato === 'Preventivata' && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Preventivo</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="number" min="0" step="0.01" value={importo} onChange={(e) => setImporto(e.target.value)} placeholder="Importo €" className="rounded-xl border border-emerald-200 px-3 py-2 text-sm" />
                  <button onClick={async () => { await onUpdateImporto(segnalazione.id, importo); setImporto(''); }} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white">Salva importo</button>
                </div>
                <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button disabled={!file || uploading} onClick={async () => { setUploading(true); await onUploadFile(segnalazione.id, file, 'preventivonome', 'preventivo'); setFile(null); setUploading(false); }} className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  Carica preventivo
                </button>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-semibold">Aggiungi nota</p>
              <textarea value={nota} onChange={(e) => setNota(e.target.value)} className="min-h-24 w-full rounded-xl border px-3 py-2" placeholder="Scrivi una nota..." />
              <button onClick={() => { if (!nota.trim()) return; onAddNote(segnalazione.id, nota.trim()); setNota(''); }} className="rounded-xl bg-slate-900 px-4 py-2 text-white">Aggiungi nota</button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-4 md:p-5">
          <h4 className="mb-3 font-semibold">Cronologia note</h4>
          <div className="max-h-52 space-y-2 overflow-auto">
            {(segnalazione.note || []).length === 0 ? <p className="text-sm text-slate-500">Nessuna nota presente.</p> : (segnalazione.note || []).map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-sm text-slate-700">{n.testo}</p>
                <p className="mt-1 text-xs text-slate-500">{n.data}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [utente, setUtente] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [ruolo, setRuolo] = useState('gestore');
  const [condomini, setCondomini] = useState([]);
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dettaglioAperto, setDettaglioAperto] = useState(null);
  const [selectedCondominioId, setSelectedCondominioId] = useState('');
  const [filtroCondominioId, setFiltroCondominioId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuovaSegnalazione, setShowNuovaSegnalazione] = useState(false);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const puoCreareSegnalazioni = ruoloNormalizzato === 'amministratore' || ruoloNormalizzato === 'condominio';

  const condominiVisibili = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return condomini;
    const ids = userProfile?.condominiIds || [];
    return condomini.filter((c) => ids.includes(c.id));
  }, [ruoloNormalizzato, condomini, userProfile]);

  const segnalazioniFiltrate = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return segnalazioni;
    const ids = userProfile?.condominiIds || [];
    return segnalazioni.filter((s) => ids.includes(s.condominio_id));
  }, [segnalazioni, ruoloNormalizzato, userProfile]);

  const segnalazioniVisualizzate = useMemo(() => {
    const testo = searchTerm.toLowerCase().trim();
    return segnalazioniFiltrate.filter((s) => {
      const passaCondominio = filtroCondominioId ? String(s.condominio_id) === String(filtroCondominioId) : true;
      const passaRicerca = !testo || [s.titolo, s.descrizione, s.condominio, s.categoria, s.luogo, s.referente].filter(Boolean).some((v) => String(v).toLowerCase().includes(testo));
      return passaCondominio && passaRicerca;
    });
  }, [segnalazioniFiltrate, filtroCondominioId, searchTerm]);

  const hasPreventiviBanner = segnalazioni.some((s) => s.stato_invio === 'inviato' && !s.stato_conversione);

  const normalizzaSegnalazioni = (data) => (data || []).map((item) => ({
    ...item,
    condominio: item.condomini?.nome || item.condominio || '',
    allegatoUrl: item.allegatonome ? buildPublicUrl(item.allegatonome) : '',
    fotosopralluogourl: item.fotosopralluogonome ? buildPublicUrl(item.fotosopralluogonome) : '',
    preventivourl: item.preventivonome ? buildPublicUrl(item.preventivonome) : '',
    note: Array.isArray(item.note) ? item.note : [],
  }));

  const carica = async () => {
    setLoading(true);
    setStatusMessage('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        setUtente(null);
        setLoading(false);
        return;
      }

      setUtente(currentUser);
      const profile = await loadUserProfile(currentUser.email);
      setUserProfile(profile);
      setRuolo(profile.ruolo || 'non_configurato');

      const { data: condominiData, error: condominiError } = await supabase.from('condomini').select('id, nome, indirizzo').order('nome');
      if (condominiError) throw condominiError;
      setCondomini(condominiData || []);

      const { data: segnalazioniData, error: segnalazioniError } = await supabase
        .from('segnalazioni')
        .select('*, condomini(id, nome, indirizzo)')
        .order('created_at', { ascending: false });

      if (segnalazioniError) throw segnalazioniError;
      setSegnalazioni(normalizzaSegnalazioni(segnalazioniData));
    } catch (error) {
      console.error(error);
      setStatusMessage('Errore caricamento: ' + (error.message || 'sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carica();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => carica());
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  const uploadFile = async (file, prefix) => {
    if (!file) return '';
    const safeName = file.name.split(' ').join('-');
    const fileName = prefix + '-' + Date.now() + '-' + safeName;
    const { error } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: false });
    if (error) throw error;
    return fileName;
  };

  const salvaSegnalazione = async (form) => {
    setSaving(true);
    try {
      const allegatonome = form.file ? await uploadFile(form.file, 'segnalazione') : '';
      const { error } = await supabase.from('segnalazioni').insert({
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim(),
        categoria: form.categoria,
        priorita: form.priorita,
        luogo: form.luogo.trim(),
        referente: form.referente.trim(),
        telefono: form.telefono.trim(),
        condominio_id: Number(form.condominioId),
        stato: 'Presa in carico',
        allegatonome,
        amministratore_email: utente?.email || '',
        amministratore_telefono: userProfile?.telefono || '',
        note: [],
      });
      if (error) throw error;
      setShowNuovaSegnalazione(false);
      await carica();
      setStatusMessage('Segnalazione salvata correttamente.');
    } finally {
      setSaving(false);
    }
  };

  const cambiaStato = async (id, nuovoStato) => {
    const { error } = await supabase.from('segnalazioni').update({ stato: nuovoStato }).eq('id', id);
    if (error) throw error;
    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, stato: nuovoStato } : prev);
  };

  const uploadFilePratica = async (id, file, columnName, prefix) => {
    if (!file) return;
    const safeName = file.name.split(' ').join('-');
    const fileName = prefix + '-' + id + '-' + Date.now() + '-' + safeName;
    const { error: uploadError } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: false });
    if (uploadError) throw uploadError;
    const { error: updateError } = await supabase.from('segnalazioni').update({ [columnName]: fileName }).eq('id', id);
    if (updateError) throw updateError;
    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, [columnName]: fileName, fotosopralluogourl: columnName === 'fotosopralluogonome' ? buildPublicUrl(fileName) : prev.fotosopralluogourl, preventivourl: columnName === 'preventivonome' ? buildPublicUrl(fileName) : prev.preventivourl } : prev);
  };

  const aggiornaImporto = async (id, importo) => {
    const valore = Number(importo || 0);
    const { error } = await supabase.from('segnalazioni').update({ importo_preventivo: valore }).eq('id', id);
    if (error) throw error;
    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, importo_preventivo: valore } : prev);
  };

  const aggiungiNota = async (id, testo) => {
    const pratica = segnalazioni.find((s) => s.id === id) || dettaglioAperto;
    const nuovaNota = { id: Date.now(), testo, data: new Date().toLocaleString('it-IT') };
    const note = [...(pratica?.note || []), nuovaNota];
    const { error } = await supabase.from('segnalazioni').update({ note }).eq('id', id);
    if (error) throw error;
    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, note } : prev);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUtente(null);
    setUserProfile(null);
    setRuolo('gestore');
    setDettaglioAperto(null);
  };

  if (loading && !utente) return <Login />;
  if (!utente) return <Login />;

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 px-3 py-4 md:p-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 overflow-x-hidden">
        <Header
          utente={utente}
          ruolo={ruoloNormalizzato}
          userProfile={userProfile}
          condominiVisibili={condominiVisibili}
          segnalazioni={segnalazioniVisualizzate}
          onLogout={logout}
        />

        <ActionBar
          condomini={condominiVisibili}
          filtroCondominioId={filtroCondominioId}
          onChangeFiltroCondominio={setFiltroCondominioId}
          searchTerm={searchTerm}
          onChangeSearchTerm={setSearchTerm}
          onRefresh={carica}
          loading={loading}
          ruolo={ruoloNormalizzato}
        />

        {ruoloNormalizzato === 'amministratore' && (
          <section className="space-y-3 pb-36 md:pb-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Segnalazioni</h2>
              <button onClick={carica} disabled={loading} className="rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-4 py-2 font-semibold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60">
                {loading ? 'Live...' : 'Aggiorna live'}
              </button>
            </div>
            {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
            ) : segnalazioniVisualizzate.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Nessuna segnalazione presente.</div>
            ) : (
              <div className="space-y-3">
                {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} />)}
              </div>
            )}
          </section>
        )}

        {ruolo === 'non_configurato' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Il tuo profilo non è configurato nella tabella utenti.
          </div>
        )}

        <div className="-mt-2">
          <DashboardOperativa ruolo={ruoloNormalizzato} segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} onOpen={setDettaglioAperto} />
        </div>
        <DashboardVendite segnalazioni={segnalazioniVisualizzate} />

        {ruoloNormalizzato !== 'amministratore' && (
          <section className="space-y-3 pb-36 md:pb-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Segnalazioni</h2>
              <button onClick={carica} disabled={loading} className="rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-4 py-2 font-semibold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60">
                {loading ? 'Live...' : 'Aggiorna live'}
              </button>
            </div>
            {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
            ) : segnalazioniVisualizzate.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Nessuna segnalazione presente.</div>
            ) : (
              <div className="space-y-3">
                {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} />)}
              </div>
            )}
          </section>
        )}
      </div>

      {puoCreareSegnalazioni && (
        <button
          onClick={() => setShowNuovaSegnalazione(true)}
          style={{ bottom: hasPreventiviBanner ? '110px' : '1.25rem' }}
          className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-3xl font-light leading-none text-white shadow-2xl shadow-emerald-900/30 transition hover:scale-105 hover:bg-emerald-700 active:scale-95 md:bottom-5 md:h-auto md:w-auto md:rounded-2xl md:px-5 md:py-3 md:text-base md:font-bold"
          aria-label="Nuova segnalazione"
        >
          <span className="md:hidden">+</span>
          <span className="hidden md:inline">+ Nuova segnalazione</span>
        </button>
      )}

      {puoCreareSegnalazioni && showNuovaSegnalazione && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur-xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nuova segnalazione</h3>
                <p className="text-xs text-slate-500">Compila i dati e salva la pratica.</p>
              </div>
              <button onClick={() => setShowNuovaSegnalazione(false)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Chiudi</button>
            </div>
            <div className="p-4">
              <FormSegnalazione
                onSave={salvaSegnalazione}
                saving={saving}
                condomini={condominiVisibili}
                selectedCondominioId={selectedCondominioId}
                onChangeCondominio={setSelectedCondominioId}
              />
            </div>
          </div>
        </div>
      )}

      {hasPreventiviBanner && (
        <div className="fixed bottom-4 left-3 right-3 z-50 md:left-auto md:right-6 md:bottom-6">
          <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-900 px-4 py-2 text-white shadow-2xl md:justify-start">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-semibold">Nuovi preventivi in attesa</span>
          </div>
        </div>
      )}

      <DettaglioPraticaModal
        segnalazione={dettaglioAperto}
        onClose={() => setDettaglioAperto(null)}
        onChangeStatus={cambiaStato}
        onAddNote={aggiungiNota}
        onUploadFile={uploadFilePratica}
        onUpdateImporto={aggiornaImporto}
      />
    </div>
  );
}
