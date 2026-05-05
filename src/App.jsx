import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';
const AUTH_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'csp-auth-session',
  },
});

const STATI_PRATICA = [
  'Nuova',
  'Presa in carico',
  'Sopralluogo effettuato',
  'Preventivata',
  'Accettata',
  'Pianificata',
  'Chiusa',
];

const PIANI_ABBONAMENTO = {
  base: { nome: 'Base', costo: 3.9, app: false, whatsapp: false },
  plus: { nome: 'Plus', costo: 6.9, app: false, whatsapp: true },
  premium: { nome: 'Premium', costo: 9.9, app: true, whatsapp: true },
};

function buildPublicUrl(fileName) {
  if (!fileName) return '';
  return SUPABASE_URL + '/storage/v1/object/public/allegati/' + encodeURIComponent(fileName);
}

function formatEuro(value) {
  const numero = Math.round(Number(value || 0));
  const formattato = numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return '€ ' + formattato;
}

function badgeClass(stato) {
  if (stato === 'Presa in carico') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (stato === 'Sopralluogo effettuato') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (stato === 'Preventivata') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (stato === 'Accettata') return 'bg-teal-100 text-teal-700 border-teal-200';
  if (stato === 'Pianificata') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (stato === 'Chiusa') return 'bg-slate-100 text-slate-700 border-slate-200';
  if (stato === 'Rifiutata') return 'bg-red-100 text-red-700 border-red-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function statoButtonClass(stato, statoCorrente) {
  const active = stato === statoCorrente;
  const base = 'rounded-xl border px-3 py-2 text-sm font-bold transition-all duration-200 ';
  if (!active) return base + 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700';
  if (stato === 'Presa in carico') return base + 'scale-[1.03] border-blue-400 bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-100';
  if (stato === 'Sopralluogo effettuato') return base + 'scale-[1.03] border-purple-400 bg-purple-600 text-white shadow-lg shadow-purple-500/25 ring-4 ring-purple-100';
  if (stato === 'Preventivata') return base + 'scale-[1.03] border-emerald-400 bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-100';
  if (stato === 'Accettata') return base + 'scale-[1.03] border-teal-400 bg-teal-600 text-white shadow-lg shadow-teal-500/25 ring-4 ring-teal-100';
  if (stato === 'Pianificata') return base + 'scale-[1.03] border-sky-400 bg-sky-600 text-white shadow-lg shadow-sky-500/25 ring-4 ring-sky-100';
  if (stato === 'Chiusa') return base + 'scale-[1.03] border-slate-400 bg-slate-800 text-white shadow-lg shadow-slate-500/25 ring-4 ring-slate-100';
  if (stato === 'Rifiutata') return base + 'scale-[1.03] border-red-400 bg-red-600 text-white shadow-lg shadow-red-500/25 ring-4 ring-red-100';
  return base + 'scale-[1.03] border-amber-400 bg-amber-500 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-100';
}

function priorityClass(priorita) {
  if (priorita === 'Alta') return 'text-red-600';
  if (priorita === 'Bassa') return 'text-emerald-600';
  return 'text-amber-600';
}

function LogoMark({ className = 'h-[4.5rem] w-auto md:h-24', alt = 'Condominio Senza Pensieri' }) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
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
    setMessaggio('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailPulita,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      setMessaggio('Ti abbiamo inviato un link di accesso. Controlla la tua email.');
    } catch (error) {
      console.error(error);
      setMessaggio('Errore invio link: ' + (error.message || 'sconosciuto'));
    } finally {
      setInvioInCorso(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="mb-5 flex flex-col items-center rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-center shadow-inner">
          <LogoMark />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-amber-300">Condominio Senza Pensieri</p>
          <p className="mt-1 text-xs text-white/70">Gestione evoluta. Serenità reale.</p>
        </div>
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

function ShellHeader({ utente, userProfile, ruolo, condominiVisibili, pratiche = [], onLogout }) {
  const ora = new Date().getHours();
  const saluto = ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const criticita = pratiche.filter((p) => p.stato !== 'Chiusa' && p.stato !== 'Rifiutata').length;
  const preventiviAperti = pratiche.filter((p) => p.stato === 'Preventivata').length;
  const messaggioRuolo = ruolo === 'admin'
    ? 'Centro di comando operativo'
    : ruolo === 'amministratore'
      ? 'Gestione condomini e pratiche'
      : 'Area condòmino';

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
            <p className="mt-1 text-xs text-white/75 md:text-sm">Gestione evoluta delle pratiche condominiali</p>
            {userProfile?.nome && (
              <div className="mt-3 space-y-3">
                <p className="text-lg font-black leading-tight tracking-tight text-white drop-shadow md:text-2xl">
                  {saluto} {userProfile.nome}
                </p>
                <p className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 backdrop-blur-xl md:text-base">
                  {messaggioRuolo}
                </p>
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
        <button
          onClick={onLogout}
          className="self-start rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-bold text-white shadow-lg backdrop-blur-xl transition hover:bg-white/25 md:self-auto"
        >
          Esci
        </button>
      </div>
    </header>
  );
}

function KPI({ label, value, tone = 'emerald', subtitle }) {
  const styles = {
    emerald: 'from-emerald-50 to-white border-emerald-100 text-emerald-700',
    amber: 'from-amber-50 to-white border-amber-100 text-amber-700',
    blue: 'from-blue-50 to-white border-blue-100 text-blue-700',
    slate: 'from-slate-50 to-white border-slate-100 text-slate-700',
    red: 'from-red-50 to-white border-red-100 text-red-700',
  };

  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-4 shadow-sm ${styles[tone] || styles.emerald}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs opacity-70">{subtitle}</p>}
    </div>
  );
}

function PianoBadge({ piano }) {
  const key = String(piano || 'base').toLowerCase();
  const tone = key === 'premium' ? 'bg-amber-100 text-amber-800 border-amber-200' : key === 'plus' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200';
  return <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${tone}`}>{key}</span>;
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${
        active ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-slate-500 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function AdminDashboard({
  condomini,
  pratiche,
  utenti,
  storico,
  reportCondomini,
  statusMessage,
  onRefresh,
  onCreateCondominio,
  onCreateUtente,
  onCreatePratica,
  onCreaReportPeriodico,
  onCondividiReport,
}) {
  const [tab, setTab] = useState('panoramica');
  const praticheAperte = pratiche.filter((p) => p.stato !== 'Chiusa' && p.stato !== 'Rifiutata');
  const preventivi = pratiche.filter((p) => p.stato === 'Preventivata');
  const valorePreventivi = preventivi.reduce((sum, p) => sum + Number(p.importo_preventivo || 0), 0);
  const condominiPremium = condomini.filter((c) => String(c.piano || '').toLowerCase() === 'premium').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KPI label="Condomini" value={condomini.length} tone="emerald" />
        <KPI label="Utenti" value={utenti.length} tone="blue" />
        <KPI label="Pratiche aperte" value={praticheAperte.length} tone="amber" />
        <KPI label="Preventivi" value={preventivi.length} tone="slate" subtitle={formatEuro(valorePreventivi)} />
        <KPI label="Premium" value={condominiPremium} tone="red" />
      </div>

      {statusMessage && (
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {statusMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-2">
        <TabButton active={tab === 'panoramica'} onClick={() => setTab('panoramica')}>Panoramica</TabButton>
        <TabButton active={tab === 'condomini'} onClick={() => setTab('condomini')}>Condomini</TabButton>
        <TabButton active={tab === 'utenti'} onClick={() => setTab('utenti')}>Utenti</TabButton>
        <TabButton active={tab === 'nuova'} onClick={() => setTab('nuova')}>Nuova pratica</TabButton>
        <TabButton active={tab === 'report'} onClick={() => setTab('report')}>Report</TabButton>
      </div>

      {tab === 'panoramica' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-900">Ultime pratiche</h2>
              <button onClick={onRefresh} className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">Aggiorna</button>
            </div>
            <div className="mt-4 space-y-3">
              {pratiche.slice(0, 8).map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{p.titolo}</p>
                      <p className="mt-1 text-sm text-slate-500">{p.condomini?.nome || p.condominio_nome || 'Condominio'} · {p.categoria}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(p.stato)}`}>{p.stato}</span>
                  </div>
                </div>
              ))}
              {!pratiche.length && <p className="text-sm text-slate-500">Nessuna pratica presente.</p>}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Storico recente</h2>
            <div className="mt-4 space-y-3">
              {storico.slice(0, 8).map((s) => (
                <div key={s.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-bold text-slate-800">{s.azione || 'Aggiornamento'}</p>
                  <p className="mt-1 text-slate-500">{s.note || s.descrizione || ''}</p>
                </div>
              ))}
              {!storico.length && <p className="text-sm text-slate-500">Nessuno storico disponibile.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'condomini' && <CondominiAdmin condomini={condomini} onCreateCondominio={onCreateCondominio} />}
      {tab === 'utenti' && <UtentiAdmin utenti={utenti} condomini={condomini} onCreateUtente={onCreateUtente} />}
      {tab === 'nuova' && <PraticaForm condomini={condomini} onSubmit={onCreatePratica} onChangeCondominio={() => {}} />}
      {tab === 'report' && (
        <ReportCondominiPanel
          condomini={condomini}
          pratiche={pratiche}
          reportCondomini={reportCondomini}
          onCreaReportPeriodico={onCreaReportPeriodico}
          onCondividiReport={onCondividiReport}
        />
      )}
    </div>
  );
}

function CondominiAdmin({ condomini, onCreateCondominio }) {
  const [form, setForm] = useState({ nome: '', indirizzo: '', piano: 'base', unita: 10, amministratore_email: '', note: '' });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() || saving) return;
    setSaving(true);
    try {
      await onCreateCondominio(form);
      setForm({ nome: '', indirizzo: '', piano: 'base', unita: 10, amministratore_email: '', note: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Nuovo condominio</h2>
        <div className="mt-4 space-y-3">
          <input value={form.nome} onChange={(e) => update('nome', e.target.value)} placeholder="Nome condominio" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <input value={form.indirizzo} onChange={(e) => update('indirizzo', e.target.value)} placeholder="Indirizzo" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.piano} onChange={(e) => update('piano', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
              <option value="base">Base</option>
              <option value="plus">Plus</option>
              <option value="premium">Premium</option>
            </select>
            <input type="number" value={form.unita} onChange={(e) => update('unita', e.target.value)} placeholder="Unità" className="rounded-2xl border border-slate-200 px-3 py-3" />
          </div>
          <input value={form.amministratore_email} onChange={(e) => update('amministratore_email', e.target.value)} placeholder="Email amministratore" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Note" className="min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <button disabled={saving} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-60">{saving ? 'Salvataggio...' : 'Crea condominio'}</button>
        </div>
      </form>
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Condomini gestiti</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {condomini.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">{c.nome}</p>
                  <p className="mt-1 text-sm text-slate-500">{c.indirizzo}</p>
                </div>
                <PianoBadge piano={c.piano} />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-500">Unità: {c.unita || '-'}</p>
            </div>
          ))}
          {!condomini.length && <p className="text-sm text-slate-500">Nessun condominio.</p>}
        </div>
      </div>
    </div>
  );
}

function UtentiAdmin({ utenti, condomini, onCreateUtente }) {
  const [form, setForm] = useState({ email: '', nome: '', telefono: '', ruolo: 'condomino', condominio_id: '' });
  const [saving, setSaving] = useState(false);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || saving) return;
    setSaving(true);
    try {
      await onCreateUtente(form);
      setForm({ email: '', nome: '', telefono: '', ruolo: 'condomino', condominio_id: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
      <form onSubmit={submit} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Nuovo utente</h2>
        <div className="mt-4 space-y-3">
          <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <input value={form.nome} onChange={(e) => update('nome', e.target.value)} placeholder="Nome" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} placeholder="Telefono" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
          <select value={form.ruolo} onChange={(e) => update('ruolo', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
            <option value="condomino">Condòmino</option>
            <option value="amministratore">Amministratore</option>
            <option value="admin">Admin</option>
          </select>
          <select value={form.condominio_id} onChange={(e) => update('condominio_id', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
            <option value="">Collega a condominio</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button disabled={saving} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-60">{saving ? 'Salvataggio...' : 'Crea utente'}</button>
        </div>
      </form>
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Utenti</h2>
        <div className="mt-4 space-y-3">
          {utenti.map((u) => (
            <div key={u.email} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">{u.nome || u.email}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{u.ruolo}</span>
              </div>
            </div>
          ))}
          {!utenti.length && <p className="text-sm text-slate-500">Nessun utente.</p>}
        </div>
      </div>
    </div>
  );
}

function AmministratoreDashboard({ condomini, pratiche, reportCondomini, onCreatePratica, onCreaReportPeriodico, onCondividiReport }) {
  const [selectedCondominio, setSelectedCondominio] = useState(condomini[0]?.id || '');
  const praticheVisibili = selectedCondominio ? pratiche.filter((p) => Number(p.condominio_id) === Number(selectedCondominio)) : pratiche;
  const aperte = praticheVisibili.filter((p) => p.stato !== 'Chiusa' && p.stato !== 'Rifiutata').length;
  const chiuse = praticheVisibili.filter((p) => p.stato === 'Chiusa').length;
  const preventivi = praticheVisibili.filter((p) => p.stato === 'Preventivata').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <KPI label="Condomini" value={condomini.length} />
        <KPI label="Pratiche aperte" value={aperte} tone="amber" />
        <KPI label="Preventivi" value={preventivi} tone="blue" />
        <KPI label="Chiuse" value={chiuse} tone="slate" />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Le tue pratiche</h2>
            <p className="mt-1 text-sm text-slate-500">Seleziona un condominio e apri una nuova segnalazione.</p>
          </div>
          <select value={selectedCondominio} onChange={(e) => setSelectedCondominio(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
            <option value="">Tutti i condomini</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <PraticaForm condomini={condomini} onSubmit={onCreatePratica} onChangeCondominio={setSelectedCondominio} />
        <div className="space-y-3">
          {praticheVisibili.map((p) => <PraticaMini key={p.id} pratica={p} />)}
          {!praticheVisibili.length && <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Nessuna pratica per questo filtro.</div>}
        </div>
      </div>

      <ReportCondominiPanel
        condomini={condomini}
        pratiche={pratiche}
        reportCondomini={reportCondomini}
        onCreaReportPeriodico={onCreaReportPeriodico}
        onCondividiReport={onCondividiReport}
      />
    </div>
  );
}

function CondominoDashboard({ userProfile, pratiche, reportCondomini, onCreatePratica, condomini }) {
  const condominioId = userProfile?.condominiIds?.[0] || condomini[0]?.id || '';
  const praticheCondomino = pratiche.filter((p) => !condominioId || Number(p.condominio_id) === Number(condominioId));
  const reportVisibili = reportCondomini.filter((r) => !condominioId || Number(r.condominio_id) === Number(condominioId));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KPI label="Segnalazioni" value={praticheCondomino.length} />
        <KPI label="Aperte" value={praticheCondomino.filter((p) => p.stato !== 'Chiusa' && p.stato !== 'Rifiutata').length} tone="amber" />
        <KPI label="Report" value={reportVisibili.length} tone="blue" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
        <PraticaForm condomini={condomini} onSubmit={onCreatePratica} onChangeCondominio={() => {}} defaultCondominioId={condominioId} />
        <div className="space-y-3">
          {praticheCondomino.map((p) => <PraticaMini key={p.id} pratica={p} />)}
          {!praticheCondomino.length && <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Nessuna segnalazione presente.</div>}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Report del condominio</h2>
        <div className="mt-4 space-y-3">
          {reportVisibili.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 p-4">
              <p className="font-black text-slate-900">{r.titolo}</p>
              <p className="mt-1 text-sm text-slate-500">{r.periodo || ''}</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.contenuto}</p>
            </div>
          ))}
          {!reportVisibili.length && <p className="text-sm text-slate-500">Nessun report disponibile.</p>}
        </div>
      </div>
    </div>
  );
}

function PraticaMini({ pratica }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-slate-900">{pratica.titolo}</p>
          <p className="mt-1 text-sm text-slate-500">{pratica.condomini?.nome || pratica.condominio_nome || 'Condominio'} · {pratica.luogo || pratica.categoria}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeClass(pratica.stato)}`}>{pratica.stato}</span>
      </div>
      <p className="mt-3 text-sm text-slate-700">{pratica.descrizione}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
        <span>Priorità: <strong className={priorityClass(pratica.priorita)}>{pratica.priorita}</strong></span>
        {pratica.importo_preventivo > 0 && <span>Preventivo: <strong>{formatEuro(pratica.importo_preventivo)}</strong></span>}
      </div>
    </div>
  );
}

function PraticaForm({ condomini, onSubmit, onChangeCondominio, defaultCondominioId = '' }) {
  const [condominioId, setCondominioId] = useState(defaultCondominioId || '');
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('Infiltrazioni');
  const [priorita, setPriorita] = useState('Media');
  const [luogo, setLuogo] = useState('');
  const [referente, setReferente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    if (defaultCondominioId) setCondominioId(defaultCondominioId);
  }, [defaultCondominioId]);

  const submit = async (e) => {
    e.preventDefault();
    setErrore('');
    if (!condominioId) return setErrore('Seleziona un condominio.');
    if (!titolo.trim()) return setErrore('Inserisci un titolo.');
    if (saving) return;

    setSaving(true);
    try {
      await onSubmit({ condominio_id: condominioId, titolo, descrizione, categoria, priorita, luogo, referente, telefono, file });
      setTitolo('');
      setDescrizione('');
      setCategoria('Infiltrazioni');
      setPriorita('Media');
      setLuogo('');
      setReferente('');
      setTelefono('');
      setFile(null);
    } catch (error) {
      console.error(error);
      setErrore(error.message || 'Errore salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-5">
      <select
        value={condominioId}
        onChange={(e) => {
          setCondominioId(e.target.value);
          onChangeCondominio(e.target.value);
        }}
        className="w-full rounded-xl border px-3 py-2"
      >
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

function ReportCondominiPanel({ condomini, pratiche, reportCondomini, onCreaReportPeriodico, onCondividiReport }) {
  const [condominioId, setCondominioId] = useState(condomini[0]?.id || '');
  const [periodo, setPeriodo] = useState('Mensile');
  const [saving, setSaving] = useState(false);

  const reportFiltrati = condominioId ? reportCondomini.filter((r) => Number(r.condominio_id) === Number(condominioId)) : reportCondomini;

  const crea = async () => {
    if (!condominioId || saving) return;
    setSaving(true);
    try {
      await onCreaReportPeriodico(condominioId, periodo);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900">Report periodici</h2>
          <p className="mt-1 text-sm text-slate-500">Genera un riepilogo chiaro per amministratore e condòmini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={condominioId} onChange={(e) => setCondominioId(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2">
            <option value="">Seleziona condominio</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2">
            <option>Mensile</option>
            <option>Bimestrale</option>
            <option>Trimestrale</option>
            <option>Annuale</option>
          </select>
          <button onClick={crea} disabled={saving || !condominioId} className="rounded-2xl bg-slate-900 px-4 py-2 font-black text-white disabled:opacity-50">
            {saving ? 'Creazione...' : 'Crea report'}
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {reportFiltrati.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-900">{r.titolo}</p>
                <p className="mt-1 text-sm text-slate-500">{r.periodo} · {r.condomini?.nome || ''}</p>
              </div>
              <button onClick={() => onCondividiReport(r)} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Condividi</button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.contenuto}</p>
          </div>
        ))}
        {!reportFiltrati.length && <p className="text-sm text-slate-500">Nessun report disponibile.</p>}
      </div>
    </div>
  );
}

function PraticheBoard({
  pratiche,
  storico,
  allegati,
  onUpdateStato,
  onAddNota,
  onUploadFile,
  onUpdateImporto,
  ruolo,
  utenteEmail,
  onConversionePreventivo,
  onPianificaLavori,
  onGeneraReport,
  onGeneraPdfVotazioni,
  onCondividiCondomini,
  onVotoCondomino,
  onInviaReminderVoto,
  onInviaRipartoMillesimi,
  onRefreshVoti,
  onDeletePratica,
  onRipristinaPratica,
  votiPreventivi,
  utentiCondomini,
  utentiSistema,
}) {
  const [selectedId, setSelectedId] = useState(pratiche[0]?.id || null);
  const [filtro, setFiltro] = useState('Tutte');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!selectedId && pratiche[0]?.id) setSelectedId(pratiche[0].id);
  }, [pratiche, selectedId]);

  const filtrate = pratiche.filter((p) => {
    const matchStato = filtro === 'Tutte' || p.stato === filtro;
    const q = query.toLowerCase().trim();
    const matchQ = !q || [p.titolo, p.descrizione, p.categoria, p.condomini?.nome, p.luogo].some((v) => String(v || '').toLowerCase().includes(q));
    return matchStato && matchQ;
  });

  const selected = pratiche.find((p) => p.id === selectedId) || filtrate[0];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_1fr]">
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cerca pratica" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2" />
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-2">
            <option>Tutte</option>
            {STATI_PRATICA.map((s) => <option key={s}>{s}</option>)}
            <option>Rifiutata</option>
          </select>
        </div>
        <div className="mt-4 space-y-3">
          {filtrate.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === p.id ? 'border-emerald-300 bg-emerald-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-slate-900">{p.titolo}</p>
                  <p className="mt-1 text-xs text-slate-500">{p.condomini?.nome || p.condominio_nome || ''}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${badgeClass(p.stato)}`}>{p.stato}</span>
              </div>
            </button>
          ))}
          {!filtrate.length && <p className="p-4 text-sm text-slate-500">Nessuna pratica trovata.</p>}
        </div>
      </div>
      <PraticaDetail
        pratica={selected}
        storico={storico.filter((s) => Number(s.pratica_id || s.segnalazione_id) === Number(selected?.id))}
        allegati={allegati.filter((a) => Number(a.pratica_id || a.segnalazione_id) === Number(selected?.id))}
        onUpdateStato={onUpdateStato}
        onAddNota={onAddNota}
        onUploadFile={onUploadFile}
        onUpdateImporto={onUpdateImporto}
        ruolo={ruolo}
        utenteEmail={utenteEmail}
        onConversionePreventivo={onConversionePreventivo}
        onPianificaLavori={onPianificaLavori}
        onGeneraReport={onGeneraReport}
        onGeneraPdfVotazioni={onGeneraPdfVotazioni}
        onCondividiCondomini={onCondividiCondomini}
        onVotoCondomino={onVotoCondomino}
        onInviaReminderVoto={onInviaReminderVoto}
        onInviaRipartoMillesimi={onInviaRipartoMillesimi}
        onRefreshVoti={onRefreshVoti}
        onDeletePratica={onDeletePratica}
        onRipristinaPratica={onRipristinaPratica}
        votiPreventivi={votiPreventivi.filter((v) => Number(v.segnalazione_id) === Number(selected?.id))}
        utentiCondomini={utentiCondomini}
        utentiSistema={utentiSistema}
      />
    </div>
  );
}

function PraticaDetail({
  pratica,
  storico,
  allegati,
  onUpdateStato,
  onAddNota,
  onUploadFile,
  onUpdateImporto,
  ruolo,
  utenteEmail,
  onConversionePreventivo,
  onPianificaLavori,
  onGeneraReport,
  onGeneraPdfVotazioni,
  onCondividiCondomini,
  onVotoCondomino,
  onInviaReminderVoto,
  onInviaRipartoMillesimi,
  onRefreshVoti,
  onDeletePratica,
  onRipristinaPratica,
  votiPreventivi,
  utentiCondomini,
  utentiSistema,
}) {
  const [nota, setNota] = useState('');
  const [importo, setImporto] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setImporto(pratica?.importo_preventivo || '');
  }, [pratica?.id, pratica?.importo_preventivo]);

  if (!pratica) {
    return <div className="rounded-3xl border border-slate-100 bg-white p-6 text-sm text-slate-500">Seleziona una pratica.</div>;
  }

  const addNota = async () => {
    if (!nota.trim()) return;
    setSaving(true);
    try {
      await onAddNota(pratica.id, nota);
      setNota('');
    } finally {
      setSaving(false);
    }
  };

  const upload = async () => {
    if (!file) return;
    setSaving(true);
    try {
      await onUploadFile(pratica.id, file);
      setFile(null);
    } finally {
      setSaving(false);
    }
  };

  const salvaImporto = async () => {
    setSaving(true);
    try {
      await onUpdateImporto(pratica.id, importo);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">{pratica.titolo}</h2>
          <p className="mt-1 text-sm text-slate-500">{pratica.condomini?.nome || pratica.condominio_nome || ''} · {pratica.categoria}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${badgeClass(pratica.stato)}`}>{pratica.stato}</span>
      </div>
      <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{pratica.descrizione}</p>

      {(ruolo === 'admin' || ruolo === 'amministratore') && (
        <div className="rounded-2xl border border-slate-100 p-4">
          <p className="mb-3 text-sm font-black text-slate-900">Avanzamento pratica</p>
          <div className="flex flex-wrap gap-2">
            {[...STATI_PRATICA, 'Rifiutata'].map((s) => (
              <button key={s} onClick={() => onUpdateStato(pratica.id, s)} className={statoButtonClass(s, pratica.stato)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {(ruolo === 'admin' || ruolo === 'amministratore') && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-black text-slate-900">Importo preventivo</p>
            <div className="mt-3 flex gap-2">
              <input type="number" value={importo} onChange={(e) => setImporto(e.target.value)} className="min-w-0 flex-1 rounded-xl border px-3 py-2" />
              <button onClick={salvaImporto} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-white">Salva</button>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 p-4">
            <p className="text-sm font-black text-slate-900">Azioni preventivo</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onCondividiCondomini(pratica)} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">Condividi</button>
              <button onClick={() => onInviaReminderVoto(pratica)} className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">Reminder voto</button>
              <button onClick={() => onGeneraPdfVotazioni(pratica)} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-700">PDF votazioni</button>
              <button onClick={() => onInviaRipartoMillesimi(pratica)} className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-black text-purple-700">Riparto</button>
              <button onClick={() => onRefreshVoti(pratica.id)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">Aggiorna voti</button>
            </div>
          </div>
        </div>
      )}

      {(ruolo === 'admin' || ruolo === 'amministratore') && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button onClick={() => onConversionePreventivo(pratica, true)} className="rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">Preventivo accettato</button>
          <button onClick={() => onConversionePreventivo(pratica, false)} className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white">Preventivo rifiutato</button>
          <button onClick={() => onPianificaLavori(pratica)} className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white">Pianifica lavori</button>
          <button onClick={() => onGeneraReport(pratica)} className="rounded-2xl bg-blue-600 px-4 py-3 font-black text-white">Genera report</button>
          <button onClick={() => onDeletePratica(pratica)} className="rounded-2xl bg-red-50 px-4 py-3 font-black text-red-700">Archivia/elimina</button>
          <button onClick={() => onRipristinaPratica(pratica)} className="rounded-2xl bg-slate-50 px-4 py-3 font-black text-slate-700">Ripristina</button>
        </div>
      )}

      {pratica.stato === 'Preventivata' && ruolo === 'condomino' && (
        <VotoCondomino pratica={pratica} utenteEmail={utenteEmail} votiPreventivi={votiPreventivi} onVotoCondomino={onVotoCondomino} />
      )}

      <div className="rounded-2xl border border-slate-100 p-4">
        <p className="text-sm font-black text-slate-900">Note operative</p>
        <div className="mt-3 flex flex-col gap-2">
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} className="min-h-24 w-full rounded-xl border px-3 py-2" placeholder="Scrivi una nota..." />
          <button onClick={addNota} disabled={saving || !nota.trim()} className="self-start rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50">Aggiungi nota</button>
        </div>
        <div className="mt-4 space-y-2">
          {storico.map((s) => (
            <div key={s.id} className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-800">{s.azione || 'Nota'}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-600">{s.note || s.descrizione}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 p-4">
        <p className="text-sm font-black text-slate-900">Allegati</p>
        {(ruolo === 'admin' || ruolo === 'amministratore' || ruolo === 'condomino') && (
          <div className="mt-3 flex flex-wrap gap-2">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={upload} disabled={saving || !file} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Carica</button>
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {allegati.map((a) => (
            <a key={a.id} href={a.url || buildPublicUrl(a.file_name || a.nome_file)} target="_blank" rel="noreferrer" className="rounded-xl border border-slate-100 p-3 text-sm font-bold text-emerald-700">
              {a.nome_file || a.file_name || 'Allegato'}
            </a>
          ))}
          {!allegati.length && <p className="text-sm text-slate-500">Nessun allegato.</p>}
        </div>
      </div>

      {(ruolo === 'admin' || ruolo === 'amministratore') && (
        <VotiPanel votiPreventivi={votiPreventivi} utentiCondomini={utentiCondomini} utentiSistema={utentiSistema} />
      )}
    </div>
  );
}

function VotoCondomino({ pratica, utenteEmail, votiPreventivi, onVotoCondomino }) {
  const votoUtente = votiPreventivi.find((v) => String(v.email || '').toLowerCase() === String(utenteEmail || '').toLowerCase());
  const [nota, setNota] = useState(votoUtente?.nota || '');
  const [saving, setSaving] = useState(false);

  const vota = async (voto) => {
    setSaving(true);
    try {
      await onVotoCondomino(pratica, voto, nota);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
      <p className="font-black text-amber-900">Votazione preventivo</p>
      <p className="mt-1 text-sm text-amber-800">Importo: {formatEuro(pratica.importo_preventivo)}</p>
      {votoUtente && <p className="mt-2 text-sm font-bold text-amber-900">Hai già votato: {votoUtente.voto}</p>}
      <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota facoltativa" className="mt-3 min-h-20 w-full rounded-xl border border-amber-200 px-3 py-2" />
      <div className="mt-3 flex gap-2">
        <button onClick={() => vota('favorevole')} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 font-black text-white">Favorevole</button>
        <button onClick={() => vota('contrario')} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2 font-black text-white">Contrario</button>
        <button onClick={() => vota('astenuto')} disabled={saving} className="rounded-xl bg-slate-600 px-4 py-2 font-black text-white">Astenuto</button>
      </div>
    </div>
  );
}

function VotiPanel({ votiPreventivi, utentiCondomini, utentiSistema }) {
  const favorevoli = votiPreventivi.filter((v) => v.voto === 'favorevole').length;
  const contrari = votiPreventivi.filter((v) => v.voto === 'contrario').length;
  const astenuti = votiPreventivi.filter((v) => v.voto === 'astenuto').length;

  return (
    <div className="rounded-2xl border border-slate-100 p-4">
      <p className="text-sm font-black text-slate-900">Quadro votazioni</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <KPI label="Favorevoli" value={favorevoli} tone="emerald" />
        <KPI label="Contrari" value={contrari} tone="red" />
        <KPI label="Astenuti" value={astenuti} tone="slate" />
      </div>
      <div className="mt-4 space-y-2">
        {votiPreventivi.map((v) => (
          <div key={v.id || v.email} className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-black text-slate-800">{v.email}</p>
            <p className="mt-1 text-slate-600">Voto: {v.voto} {v.nota ? '· ' + v.nota : ''}</p>
          </div>
        ))}
        {!votiPreventivi.length && <p className="text-sm text-slate-500">Nessun voto registrato.</p>}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [condomini, setCondomini] = useState([]);
  const [pratiche, setPratiche] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [storico, setStorico] = useState([]);
  const [allegati, setAllegati] = useState([]);
  const [reportCondomini, setReportCondomini] = useState([]);
  const [votiPreventivi, setVotiPreventivi] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [mainTab, setMainTab] = useState('dashboard');

  const utente = session?.user;
  const ruoloNormalizzato = String(userProfile?.ruolo || 'condomino').toLowerCase();

  const condominiVisibili = useMemo(() => {
    if (ruoloNormalizzato === 'admin') return condomini;
    const ids = new Set((userProfile?.condominiIds || []).map(Number));
    return condomini.filter((c) => ids.has(Number(c.id)) || String(c.amministratore_email || '').toLowerCase() === String(utente?.email || '').toLowerCase());
  }, [condomini, ruoloNormalizzato, userProfile, utente?.email]);

  const praticheVisibili = useMemo(() => {
    if (ruoloNormalizzato === 'admin') return pratiche;
    const ids = new Set(condominiVisibili.map((c) => Number(c.id)));
    return pratiche.filter((p) => ids.has(Number(p.condominio_id)));
  }, [pratiche, ruoloNormalizzato, condominiVisibili]);

  const carica = async () => {
    if (!utente?.email) return;

    setLoading(true);
    setStatusMessage('');

    try {
      const profile = await loadUserProfile(utente.email);
      setUserProfile(profile);

      const [condominiRes, praticheRes, utentiRes, storicoRes, allegatiRes, reportRes, votiRes] = await Promise.all([
        supabase.from('condomini').select('*').order('nome', { ascending: true }),
        supabase.from('segnalazioni').select('*, condomini(nome, indirizzo, piano)').order('created_at', { ascending: false }),
        supabase.from('utenti').select('*').order('email', { ascending: true }),
        supabase.from('storico_pratiche').select('*').order('created_at', { ascending: false }),
        supabase.from('allegati_pratiche').select('*').order('created_at', { ascending: false }),
        supabase.from('report_condomini').select('*, condomini(nome)').order('created_at', { ascending: false }),
        supabase.from('preventivo_voti').select('*').order('created_at', { ascending: false }),
      ]);

      if (condominiRes.error) throw condominiRes.error;
      if (praticheRes.error) throw praticheRes.error;
      if (utentiRes.error) throw utentiRes.error;
      if (storicoRes.error) throw storicoRes.error;
      if (allegatiRes.error) throw allegatiRes.error;
      if (reportRes.error) throw reportRes.error;
      if (votiRes.error) throw votiRes.error;

      setCondomini(condominiRes.data || []);
      setPratiche(praticheRes.data || []);
      setUtenti(utentiRes.data || []);
      setStorico(storicoRes.data || []);
      setAllegati(allegatiRes.data || []);
      setReportCondomini(reportRes.data || []);
      setVotiPreventivi(votiRes.data || []);
    } catch (error) {
      console.error(error);
      setStatusMessage('Errore caricamento dati: ' + (error.message || 'sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession || null);
      if (!newSession) {
        setUserProfile(null);
        setCondomini([]);
        setPratiche([]);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (session?.user?.email) carica();
  }, [session?.user?.email]);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const registraStorico = async (praticaId, azione, note = '') => {
    const payload = {
      pratica_id: praticaId,
      segnalazione_id: praticaId,
      azione,
      note,
      utente_email: utente?.email || '',
    };
    const { error } = await supabase.from('storico_pratiche').insert(payload);
    if (error) console.warn('Storico non salvato', error);
  };

  const uploadFilePratica = async (praticaId, file) => {
    if (!file) return;
    const fileName = `${praticaId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;

    const url = buildPublicUrl(fileName);
    const { error } = await supabase.from('allegati_pratiche').insert({
      pratica_id: praticaId,
      segnalazione_id: praticaId,
      nome_file: file.name,
      file_name: fileName,
      url,
      tipo: file.type,
      utente_email: utente?.email || '',
    });
    if (error) throw error;

    await registraStorico(praticaId, 'Allegato caricato', file.name);
    await carica();
  };

  const creaPratica = async (form) => {
    let allegatoFile = form.file || null;
    const payload = {
      condominio_id: Number(form.condominio_id),
      titolo: form.titolo,
      descrizione: form.descrizione,
      categoria: form.categoria,
      priorita: form.priorita,
      luogo: form.luogo,
      referente: form.referente,
      telefono: form.telefono,
      stato: 'Nuova',
      creato_da: utente?.email || '',
    };

    const { data, error } = await supabase.from('segnalazioni').insert(payload).select('*').single();
    if (error) throw error;

    await registraStorico(data.id, 'Pratica creata', payload.titolo);
    if (allegatoFile) await uploadFilePratica(data.id, allegatoFile);
    await carica();
    setStatusMessage('Pratica creata correttamente.');
  };

  const aggiornaStato = async (praticaId, stato) => {
    const { error } = await supabase.from('segnalazioni').update({ stato }).eq('id', praticaId);
    if (error) throw error;
    await registraStorico(praticaId, 'Cambio stato', stato);
    await carica();
  };

  const aggiungiNota = async (praticaId, nota) => {
    await registraStorico(praticaId, 'Nota', nota);
    await carica();
  };

  const aggiornaImporto = async (praticaId, importo) => {
    const { error } = await supabase.from('segnalazioni').update({ importo_preventivo: Number(importo || 0), stato: 'Preventivata' }).eq('id', praticaId);
    if (error) throw error;
    await registraStorico(praticaId, 'Preventivo inserito', formatEuro(importo));
    await carica();
  };

  const creaCondominio = async (form) => {
    const { error } = await supabase.from('condomini').insert({
      nome: form.nome,
      indirizzo: form.indirizzo,
      piano: form.piano,
      unita: Number(form.unita || 0),
      amministratore_email: form.amministratore_email,
      note: form.note,
    });
    if (error) throw error;
    await carica();
    setStatusMessage('Condominio creato.');
  };

  const creaUtente = async (form) => {
    const email = form.email.trim().toLowerCase();
    const { error } = await supabase.from('utenti').upsert({
      email,
      nome: form.nome,
      telefono: form.telefono,
      ruolo: form.ruolo,
    }, { onConflict: 'email' });
    if (error) throw error;

    if (form.condominio_id) {
      const { error: linkError } = await supabase.from('utenti_condomini').upsert({
        email,
        condominio_id: Number(form.condominio_id),
      }, { onConflict: 'email,condominio_id' });
      if (linkError) throw linkError;
    }

    await carica();
    setStatusMessage('Utente creato/aggiornato.');
  };

  const creaReportPeriodico = async (condominioId, periodo) => {
    const condominio = condomini.find((c) => Number(c.id) === Number(condominioId));
    const praticheCondominio = pratiche.filter((p) => Number(p.condominio_id) === Number(condominioId));
    const aperte = praticheCondominio.filter((p) => p.stato !== 'Chiusa' && p.stato !== 'Rifiutata');
    const chiuse = praticheCondominio.filter((p) => p.stato === 'Chiusa');
    const preventivi = praticheCondominio.filter((p) => p.stato === 'Preventivata');

    const contenuto = [
      `Report ${periodo} - ${condominio?.nome || 'Condominio'}`,
      '',
      `Pratiche totali: ${praticheCondominio.length}`,
      `Pratiche aperte: ${aperte.length}`,
      `Pratiche chiuse: ${chiuse.length}`,
      `Preventivi in valutazione: ${preventivi.length}`,
      '',
      'Situazione sintetica:',
      ...aperte.slice(0, 10).map((p) => `- ${p.titolo}: ${p.stato} (${p.priorita})`),
    ].join('\n');

    const { error } = await supabase.from('report_condomini').insert({
      condominio_id: Number(condominioId),
      titolo: `Report ${periodo} ${new Date().toLocaleDateString('it-IT')}`,
      periodo,
      contenuto,
      creato_da: utente?.email || '',
    });
    if (error) throw error;
    await carica();
    setStatusMessage('Report periodico creato.');
  };

  const condividiReport = async (report) => {
    setStatusMessage(`Report pronto per la condivisione: ${report.titolo}`);
  };

  const aggiornaConversionePreventivo = async (pratica, accettato) => {
    const nuovoStato = accettato ? 'Accettata' : 'Rifiutata';
    const { error } = await supabase.from('segnalazioni').update({ stato: nuovoStato }).eq('id', pratica.id);
    if (error) throw error;
    await registraStorico(pratica.id, accettato ? 'Preventivo accettato' : 'Preventivo rifiutato', formatEuro(pratica.importo_preventivo));
    await carica();
  };

  const pianificaLavori = async (pratica) => {
    const { error } = await supabase.from('segnalazioni').update({ stato: 'Pianificata' }).eq('id', pratica.id);
    if (error) throw error;
    await registraStorico(pratica.id, 'Lavori pianificati', 'Pratica inserita nella pianificazione lavori.');
    await carica();
  };

  const generaReportPratica = async (pratica) => {
    const contenuto = [
      `Report pratica: ${pratica.titolo}`,
      `Condominio: ${pratica.condomini?.nome || pratica.condominio_nome || ''}`,
      `Stato: ${pratica.stato}`,
      `Priorità: ${pratica.priorita}`,
      '',
      pratica.descrizione || '',
    ].join('\n');

    const { error } = await supabase.from('report_condomini').insert({
      condominio_id: pratica.condominio_id,
      titolo: `Report pratica ${pratica.id}`,
      periodo: 'Pratica',
      contenuto,
      creato_da: utente?.email || '',
    });
    if (error) throw error;
    await registraStorico(pratica.id, 'Report generato', 'Report tecnico pratica creato.');
    await carica();
  };

  const generaPdfVotazioni = async (pratica) => {
    const voti = votiPreventivi.filter((v) => Number(v.segnalazione_id) === Number(pratica.id));
    const favorevoli = voti.filter((v) => v.voto === 'favorevole').length;
    const contrari = voti.filter((v) => v.voto === 'contrario').length;
    const astenuti = voti.filter((v) => v.voto === 'astenuto').length;
    setStatusMessage(`Riepilogo votazioni ${pratica.titolo}: favorevoli ${favorevoli}, contrari ${contrari}, astenuti ${astenuti}.`);
  };

  const condividiPreventivoCondomini = async (pratica) => {
    await registraStorico(pratica.id, 'Preventivo condiviso', 'Preventivo reso disponibile ai condòmini.');
    setStatusMessage('Preventivo condiviso con i condòmini.');
    await carica();
  };

  const aggiornaVotoCondomino = async (pratica, voto, nota = '') => {
    const email = utente?.email?.toLowerCase() || '';
    const { error } = await supabase.from('preventivo_voti').upsert({
      segnalazione_id: pratica.id,
      email,
      voto,
      nota,
    }, { onConflict: 'segnalazione_id,email' });
    if (error) throw error;
    await registraStorico(pratica.id, 'Voto condòmino', `${email}: ${voto}`);
    await carica();
  };

  const inviaReminderVoto = async (pratica) => {
    await registraStorico(pratica.id, 'Reminder voto', 'Promemoria votazione inviato/preparato.');
    setStatusMessage('Reminder votazione preparato.');
    await carica();
  };

  const inviaRipartoMillesimi = async (pratica) => {
    await registraStorico(pratica.id, 'Riparto millesimi', 'Riparto millesimale preparato per il preventivo.');
    setStatusMessage('Riparto millesimale preparato.');
    await carica();
  };

  const aggiornaVotiPratica = async (segnalazioneId) => {
    try {
      const { data, error } = await supabase
        .from('preventivo_voti')
        .select('*')
        .eq('segnalazione_id', segnalazioneId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVotiPreventivi((prev) => {
        const altri = prev.filter((v) => Number(v.segnalazione_id) !== Number(segnalazioneId));
        return [...(data || []), ...altri];
      });

      setStatusMessage(`Voti aggiornati: ${(data || []).length} voti registrati.`);
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento voti: ' + (error.message || 'sconosciuto'));
    }
  };

  const eliminaPratica = async (pratica) => {
    const { error } = await supabase.from('segnalazioni').update({ stato: 'Rifiutata' }).eq('id', pratica.id);
    if (error) throw error;
    await registraStorico(pratica.id, 'Pratica archiviata', 'Pratica archiviata da dashboard.');
    await carica();
  };

  const ripristinaPratica = async (pratica) => {
    const { error } = await supabase.from('segnalazioni').update({ stato: 'Nuova' }).eq('id', pratica.id);
    if (error) throw error;
    await registraStorico(pratica.id, 'Pratica ripristinata', 'Pratica riportata allo stato Nuova.');
    await carica();
  };

  if (loading && !session) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">Caricamento...</div>;
  }

  if (!session) return <Login />;

  return (
    <div className="min-h-screen bg-slate-100 p-3 text-slate-900 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <ShellHeader
          utente={utente}
          userProfile={userProfile}
          ruolo={ruoloNormalizzato}
          condominiVisibili={condominiVisibili}
          pratiche={praticheVisibili}
          onLogout={logout}
        />

        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          <TabButton active={mainTab === 'dashboard'} onClick={() => setMainTab('dashboard')}>Dashboard</TabButton>
          <TabButton active={mainTab === 'pratiche'} onClick={() => setMainTab('pratiche')}>Pratiche</TabButton>
          <TabButton active={mainTab === 'report'} onClick={() => setMainTab('report')}>Report</TabButton>
        </div>

        {loading && <div className="rounded-3xl bg-white p-5 text-sm text-slate-500">Aggiornamento dati...</div>}

        {mainTab === 'dashboard' && ruoloNormalizzato === 'admin' && (
          <AdminDashboard
            condomini={condomini}
            pratiche={pratiche}
            utenti={utenti}
            storico={storico}
            reportCondomini={reportCondomini}
            statusMessage={statusMessage}
            onRefresh={carica}
            onCreateCondominio={creaCondominio}
            onCreateUtente={creaUtente}
            onCreatePratica={creaPratica}
            onCreaReportPeriodico={creaReportPeriodico}
            onCondividiReport={condividiReport}
          />
        )}

        {mainTab === 'dashboard' && ruoloNormalizzato === 'amministratore' && (
          <AmministratoreDashboard
            condomini={condominiVisibili}
            pratiche={praticheVisibili}
            reportCondomini={reportCondomini}
            onCreatePratica={creaPratica}
            onCreaReportPeriodico={creaReportPeriodico}
            onCondividiReport={condividiReport}
          />
        )}

        {mainTab === 'dashboard' && ruoloNormalizzato !== 'admin' && ruoloNormalizzato !== 'amministratore' && (
          <CondominoDashboard
            userProfile={userProfile}
            pratiche={praticheVisibili}
            reportCondomini={reportCondomini}
            condomini={condominiVisibili}
            onCreatePratica={creaPratica}
          />
        )}

        {mainTab === 'pratiche' && (
          <PraticheBoard
            pratiche={praticheVisibili}
            storico={storico}
            allegati={allegati}
            onUpdateStato={aggiornaStato}
            onAddNota={aggiungiNota}
            onUploadFile={uploadFilePratica}
            onUpdateImporto={aggiornaImporto}
            ruolo={ruoloNormalizzato}
            utenteEmail={utente?.email}
            onConversionePreventivo={aggiornaConversionePreventivo}
            onPianificaLavori={pianificaLavori}
            onGeneraReport={generaReportPratica}
            onGeneraPdfVotazioni={generaPdfVotazioni}
            onCondividiCondomini={condividiPreventivoCondomini}
            onVotoCondomino={aggiornaVotoCondomino}
            onInviaReminderVoto={inviaReminderVoto}
            onInviaRipartoMillesimi={inviaRipartoMillesimi}
            onRefreshVoti={aggiornaVotiPratica}
            onDeletePratica={eliminaPratica}
            onRipristinaPratica={ripristinaPratica}
            votiPreventivi={votiPreventivi}
            utentiCondomini={[]}
            utentiSistema={utenti}
          />
        )}

        {mainTab === 'report' && (
          <ReportCondominiPanel
            condomini={condominiVisibili}
            pratiche={praticheVisibili}
            reportCondomini={reportCondomini}
            onCreaReportPeriodico={creaReportPeriodico}
            onCondividiReport={condividiReport}
          />
        )}
      </div>
    </div>
  );
}
