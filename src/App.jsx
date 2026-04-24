// VERSIONE ROBUSTA + DETTAGLIO PRATICA
// Se Supabase non è configurato, l'app funziona in modalità demo locale.
// Per usare Supabase davvero, sostituisci SUPABASE_URL e SUPABASE_ANON_KEY con valori reali.

import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('TUO-PROGETTO') &&
  !SUPABASE_ANON_KEY.includes('TUA-ANON-KEY');
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';
const AUTH_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';
const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const DEMO_STORAGE_KEY = 'csp_demo_segnalazioni';

const DEMO_DATA = [
  {
    id: 1,
    titolo: 'Infiltrazione nel vano scale',
    descrizione: 'Presenza di aloni umidi vicino alla copertura, soprattutto dopo la pioggia.',
    condominio: 'Demo Condominio',
    condominio_id: null,
    stato: 'In verifica',
    priorita: 'Media',
    categoria: 'Infiltrazioni',
    luogo: 'Scala A - ultimo piano',
    referente: 'Mario Rossi',
    telefono: '3331234567',
    allegatonome: '',
    allegatoUrl: '',
    note: [
      {
        id: 'n1',
        testo: 'Prima verifica visiva eseguita, da monitorare dopo il prossimo evento piovoso.',
        data: new Date().toLocaleString('it-IT'),
      },
    ],
    created_at: new Date().toISOString(),
  },
];

function loadDemoSegnalazioni() {
  if (typeof window === 'undefined') return DEMO_DATA;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_DATA));
      return DEMO_DATA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEMO_DATA;
  } catch {
    return DEMO_DATA;
  }
}

function saveDemoSegnalazioni(items) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(items));
}

function buildPublicImageUrl(fileName) {
  if (!fileName || !isSupabaseConfigured) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/allegati/${encodeURIComponent(fileName)}`;
}

function badgeClass(stato) {
  if (stato === 'Urgente') return 'bg-red-100 text-red-700 border-red-200';
  if (stato === 'Programmato') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (stato === 'Chiuso') return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

function priorityClass(priorita) {
  if (priorita === 'Alta') return 'text-red-700';
  if (priorita === 'Media') return 'text-amber-700';
  return 'text-emerald-700';
}

function LogoMark() {
  const [logoError, setLogoError] = useState(false);

  return (
    <div className="relative flex items-center justify-center shrink-0 h-24 w-24 md:h-28 md:w-28 overflow-visible">
      <div className="absolute inset-0 rounded-full bg-emerald-200/50 blur-2xl" />

      {!logoError ? (
        <img
          src={LOGO_SRC}
          alt="Condominio Senza Pensieri"
          className="relative z-10 h-40 w-40 md:h-52 md:w-52 object-contain drop-shadow-2xl transition-transform duration-300 hover:scale-105"
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <div>
            <p className="text-lg font-black text-emerald-800 leading-tight">CSP</p>
            <p className="text-[10px] text-red-600 leading-tight">logo non trovato</p>
          </div>
        </div>
      )}
    </div>
  );
}

async function loadUserProfile(email) {
  if (!supabase || !email) {
    return {
      email,
      ruolo: 'gestore',
      condominio: '',
      condominiIds: [],
      condomini: [],
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('utenti')
    .select('email, ruolo, condominio')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  console.log('Profilo utente cercato:', normalizedEmail, 'Risultato:', data, 'Errore:', error);

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      email,
      ruolo: 'non_configurato',
      condominio: '',
      condominiIds: [],
      condomini: [],
    };
  }

  const { data: collegamenti, error: collegamentiError } = await supabase
    .from('utenti_condomini')
    .select('condominio_id, condomini(id, nome, indirizzo)')
    .ilike('email', normalizedEmail);

  if (collegamentiError) {
    throw collegamentiError;
  }

  const condominiCollegati = (collegamenti || [])
    .map((item) => item.condomini)
    .filter(Boolean);

  return {
    ...data,
    condominiIds: (collegamenti || []).map((item) => item.condominio_id),
    condomini: condominiCollegati,
    condominio: condominiCollegati[0]?.nome || data.condominio || '',
  };
}

function Login({ onLogin, disabled, loading }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const handleLogin = async () => {
    if (disabled) {
      onLogin({ email: 'demo@condominio.it', mode: 'demo' });
      return;
    }

    if (!isEmailValid) {
      setMessage('Inserisci una email valida.');
      return;
    }

    setMessage('Invio link di accesso in corso...');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
        },
      });
      if (error) {
        setMessage(`Accesso non riuscito: ${error.message}`);
        console.error('Errore magic link Supabase:', error);
        return;
      }
      setMessage('Link di accesso inviato. Controlla la tua email e poi torna qui.');
    } catch (error) {
      setMessage(`Errore di connessione: ${error.message || 'impossibile contattare il server'}`);
    }
  };

  

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-md w-full max-w-md space-y-5 border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold">Accesso</h1>
          <p className="text-sm text-slate-500 mt-2">
            {disabled
              ? 'Modalità demo attiva: Supabase non è configurato, ma puoi usare l’app localmente.'
              : 'Inserisci la tua email per ricevere il link di accesso.'}
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage('');
          }}
          className="w-full border rounded-xl px-4 py-3"
          disabled={loading}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-slate-900 text-white py-3 rounded-xl disabled:opacity-60"
          disabled={loading}
        >
          {disabled ? 'Entra in demo' : 'Ricevi link'}
        </button>

        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    </div>
  );
}

function FormSegnalazione({ onSave, saving, disabled, condomini = [], selectedCondominioId, onChangeCondominio }) {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('Infiltrazioni');
  const [priorita, setPriorita] = useState('Media');
  const [luogo, setLuogo] = useState('');
  const [referente, setReferente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [file, setFile] = useState(null);
  const [errore, setErrore] = useState('');
  const [condominioId, setCondominioId] = useState(selectedCondominioId || '');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');

    if (!titolo.trim()) {
      setErrore('Il titolo è obbligatorio.');
      return;
    }

    if (!descrizione.trim()) {
      setErrore('La descrizione è obbligatoria.');
      return;
    }

    if (!luogo.trim()) {
      setErrore('Indica dove si trova il problema.');
      return;
    }

    if (!condominioId) {
      setErrore('Seleziona il condominio a cui associare la segnalazione.');
      return;
    }

    try {
      await onSave({
        titolo: titolo.trim(),
        descrizione: descrizione.trim(),
        categoria,
        priorita,
        luogo: luogo.trim(),
        referente: referente.trim(),
        telefono: telefono.trim(),
        condominioId,
        stato: 'In verifica',
        file,
      });
      reset();
    } catch (error) {
      setErrore(error.message || 'Salvataggio non riuscito.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl space-y-4 border border-slate-200">
      <div>
        <h2 className="font-bold text-lg">Nuova segnalazione</h2>
        <p className="text-sm text-slate-500 mt-1">
          {disabled
            ? 'I dati vengono salvati solo in locale sul browser.'
            : 'La segnalazione sarà salvata su database e l’allegato su storage Supabase.'}
        </p>
      </div>

      <div>
        <label className="text-sm text-slate-600">Condominio</label>
        <select
          value={condominioId}
          onChange={(e) => {
            setCondominioId(e.target.value);
            onChangeCondominio?.(e.target.value);
          }}
          className="w-full border px-3 py-2 rounded-xl mt-1"
          disabled={saving}
        >
          <option value="">Seleziona condominio</option>
          {condomini.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        {condomini.length === 0 && (
          <p className="text-sm text-red-600 mt-2">
            Nessun condominio associato al tuo profilo. Chiedi al gestore di collegare la tua email ai condomini.
          </p>
        )}
      </div>

      <input
        placeholder="Titolo"
        value={titolo}
        onChange={(e) => setTitolo(e.target.value)}
        className="w-full border px-3 py-2 rounded-xl"
        disabled={saving}
      />

      <textarea
        placeholder="Descrizione"
        value={descrizione}
        onChange={(e) => setDescrizione(e.target.value)}
        className="w-full border px-3 py-2 rounded-xl min-h-28"
        disabled={saving}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border px-3 py-2 rounded-xl"
          disabled={saving}
        >
          <option>Infiltrazioni</option>
          <option>Balconi</option>
          <option>Facciate</option>
          <option>Copertura</option>
          <option>Grondaie e pluviali</option>
          <option>Parti comuni</option>
        </select>

        <select
          value={priorita}
          onChange={(e) => setPriorita(e.target.value)}
          className="w-full border px-3 py-2 rounded-xl"
          disabled={saving}
        >
          <option>Bassa</option>
          <option>Media</option>
          <option>Alta</option>
        </select>
      </div>

      <input
        placeholder="Luogo del problema"
        value={luogo}
        onChange={(e) => setLuogo(e.target.value)}
        className="w-full border px-3 py-2 rounded-xl"
        disabled={saving}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          placeholder="Referente"
          value={referente}
          onChange={(e) => setReferente(e.target.value)}
          className="w-full border px-3 py-2 rounded-xl"
          disabled={saving}
        />
        <input
          placeholder="Telefono"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          className="w-full border px-3 py-2 rounded-xl"
          disabled={saving}
        />
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={saving}
      />

      {errore && <p className="text-sm text-red-600">{errore}</p>}

      <button
        className="bg-slate-900 text-white px-4 py-2 rounded-xl disabled:opacity-60"
        disabled={saving}
      >
        {saving ? 'Salvataggio...' : 'Salva'}
      </button>
    </form>
  );
}

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote }) {
  const [nota, setNota] = useState('');

  if (!segnalazione) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">{segnalazione.titolo}</h3>
            <p className="text-sm text-slate-500 mt-1">{segnalazione.condominio}</p>
          </div>
          <button onClick={onClose} className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700">
            Chiudi
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            {segnalazione.allegatoUrl && (
              <img
                src={segnalazione.allegatoUrl}
                alt={segnalazione.titolo}
                className="w-full max-w-sm rounded-xl border border-slate-200"
              />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`px-3 py-1 rounded-full border text-sm font-medium ${badgeClass(segnalazione.stato)}`}>
                {segnalazione.stato}
              </span>
              <span className={`text-sm font-semibold ${priorityClass(segnalazione.priorita || 'Media')}`}>
                Priorità: {segnalazione.priorita || 'Media'}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['In verifica', 'Programmato', 'Urgente', 'Chiuso'].map((stato) => (
                <button
                  key={stato}
                  onClick={() => onChangeStatus(segnalazione.id, stato)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  {stato}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Aggiungi nota</p>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Scrivi una nota operativa..."
                className="w-full border px-3 py-2 rounded-xl min-h-24"
              />
              <button
                onClick={() => {
                  if (!nota.trim()) return;
                  onAddNote(segnalazione.id, nota.trim());
                  setNota('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white"
              >
                Aggiungi nota
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200">
          <h4 className="font-semibold mb-3">Cronologia note</h4>
          <div className="space-y-2 max-h-56 overflow-auto">
            {(segnalazione.note || []).length === 0 ? (
              <p className="text-sm text-slate-500">Nessuna nota presente.</p>
            ) : (
              segnalazione.note.map((n) => (
                <div key={n.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <p className="text-sm text-slate-700">{n.testo}</p>
                  <p className="text-xs text-slate-500 mt-1">{n.data}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegnalazioneCard({ segnalazione, onOpen }) {
  return (
    <div className="border p-4 rounded-xl bg-white border-slate-200">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p className="font-bold">{segnalazione.titolo}</p>
          <p className="text-sm text-slate-500 mt-1">{segnalazione.condominio}</p>
        </div>
        <span className={`px-3 py-1 rounded-full border text-sm font-medium w-fit ${badgeClass(segnalazione.stato)}`}>
          {segnalazione.stato}
        </span>
      </div>

      <p className="mt-2">{segnalazione.descrizione}</p>
      <p className={`mt-2 text-sm font-semibold ${priorityClass(segnalazione.priorita || 'Media')}`}>
        Priorità: {segnalazione.priorita || 'Media'}
      </p>

      {segnalazione.allegatoUrl && (
        <img
          src={segnalazione.allegatoUrl}
          alt={segnalazione.titolo}
          className="mt-3 w-40 rounded border border-slate-200"
        />
      )}

      {!segnalazione.allegatoUrl && segnalazione.allegatonome && (
        <p className="mt-3 text-sm text-slate-500">Allegato: {segnalazione.allegatonome}</p>
      )}

      <button
        onClick={() => onOpen(segnalazione)}
        className="mt-4 px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
      >
        Apri dettaglio pratica
      </button>
    </div>
  );
}

function DashboardStat({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'bg-slate-900 text-white',
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-600 text-white',
  }[tone] || 'bg-slate-900 text-white';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-3 inline-flex min-w-14 justify-center rounded-2xl px-4 py-2 text-2xl font-bold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function ActionBar({
  condomini,
  filtroCondominioId,
  onChangeFiltroCondominio,
  searchTerm,
  onChangeSearchTerm,
  onRefresh,
  loading,
  ruolo,
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_18px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-slate-200/50 blur-3xl" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Azioni rapide</p>
          <p className="mt-1 text-sm text-slate-500">
            Filtra, cerca e aggiorna le pratiche senza perdere il controllo del cruscotto.
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] lg:w-auto">
          <select
            value={filtroCondominioId}
            onChange={(e) => onChangeFiltroCondominio(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">Tutti i condomini</option>
            {condomini.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <input
            value={searchTerm}
            onChange={(e) => onChangeSearchTerm(e.target.value)}
            placeholder="Cerca pratica..."
            className="w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          />

          <button
            onClick={onRefresh}
            disabled={loading}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? 'Aggiorno...' : 'Aggiorna'}
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
          Vista: {ruolo}
        </span>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-slate-600">
          Condomini visibili: {condomini.length}
        </span>
        {filtroCondominioId && (
          <button
            onClick={() => onChangeFiltroCondominio('')}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-600 transition hover:bg-slate-50"
          >
            Rimuovi filtro
          </button>
        )}
      </div>
    </section>
  );
}

function DashboardOperativa({ ruolo, segnalazioni, condomini, onOpen }) {
  // Dashboard operativa: tutte le costanti devono stare dentro questa funzione.
  const totale = segnalazioni.length;
  const urgenti = segnalazioni.filter((s) => s.stato === 'Urgente').length;
  const verifica = segnalazioni.filter((s) => s.stato === 'In verifica').length;
  const programmati = segnalazioni.filter((s) => s.stato === 'Programmato').length;
  const chiusi = segnalazioni.filter((s) => s.stato === 'Chiuso').length;

  const perCondominio = condomini.map((c) => {
    const items = segnalazioni.filter((s) => s.condominio_id === c.id);
    return {
      ...c,
      totale: items.length,
      urgenti: items.filter((s) => s.stato === 'Urgente').length,
      verifica: items.filter((s) => s.stato === 'In verifica').length,
      programmati: items.filter((s) => s.stato === 'Programmato').length,
      chiusi: items.filter((s) => s.stato === 'Chiuso').length,
    };
  });

  const segnalazioniCritiche = segnalazioni
    .filter((s) => s.stato === 'Urgente' || s.priorita === 'Alta')
    .slice(0, 5);

  const titolo = ruolo === 'gestore' ? 'Cruscotto gestore' : 'Cruscotto amministratore';
  const descrizione = ruolo === 'gestore'
    ? 'Vista generale su tutti i condomini, le urgenze e le pratiche da presidiare.'
    : 'Vista sintetica dei condomini associati al tuo profilo e delle pratiche aperte.';

  return (
    <section className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] p-6 shadow-[0_25px_80px_-35px_rgba(5,150,105,0.75)]">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/25 blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />

        <div className="relative text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">Dashboard</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">{titolo}</h2>
          <p className="mt-2 max-w-2xl text-white/80">{descrizione}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <DashboardStat label="Totali" value={totale} />
        <DashboardStat label="Urgenti" value={urgenti} tone="red" />
        <DashboardStat label="In verifica" value={verifica} tone="amber" />
        <DashboardStat label="Programmato" value={programmati} tone="emerald" />
        <DashboardStat label="Chiuse" value={chiusi} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Situazione per condominio</h3>
              <p className="text-sm text-slate-500">Riepilogo rapido per stabile.</p>
            </div>
          </div>

          {perCondominio.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun condominio associato.</p>
          ) : (
            <div className="space-y-3">
              {perCondominio.map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 transition hover:border-emerald-200 hover:shadow-md">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{c.nome}</p>
                      {c.indirizzo && <p className="text-sm text-slate-500">{c.indirizzo}</p>}
                    </div>
                    <p className="text-sm font-bold text-slate-700">{c.totale} pratiche</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                    <span className="rounded-xl bg-red-50 px-3 py-2 text-red-700">Urgenti: {c.urgenti}</span>
                    <span className="rounded-xl bg-amber-50 px-3 py-2 text-amber-700">Verifica: {c.verifica}</span>
                    <span className="rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700">Programm.: {c.programmati}</span>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-slate-700">Chiuse: {c.chiusi}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
          <h3 className="text-lg font-bold">Da presidiare</h3>
          <p className="mb-4 text-sm text-slate-500">Urgenze e priorità alte in evidenza.</p>

          {segnalazioniCritiche.length === 0 ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              Nessuna urgenza attiva. Situazione sotto controllo.
            </div>
          ) : (
            <div className="space-y-3">
              {segnalazioniCritiche.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onOpen(s)}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{s.titolo}</p>
                      <p className="mt-1 text-sm text-slate-500">{s.condominio}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(s.stato)}`}>{s.stato}</span>
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${priorityClass(s.priorita || 'Media')}`}>
                    Priorità: {s.priorita || 'Media'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [ruolo, setRuolo] = useState('gestore'); // default
  const [utente, setUtente] = useState(null);
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [condomini, setCondomini] = useState([]);
  const [selectedCondominioId, setSelectedCondominioId] = useState('');
  const [filtroCondominioId, setFiltroCondominioId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dettaglioAperto, setDettaglioAperto] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [userProfile, setUserProfile] = useState(null);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const puoCreareSegnalazioni = ['amministratore', 'condominio'].includes(ruoloNormalizzato);

  const segnalazioniFiltrate = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return segnalazioni;

    const condominiIds = userProfile?.condominiIds || [];

    if (ruoloNormalizzato === 'amministratore') {
      return segnalazioni.filter((s) => condominiIds.includes(s.condominio_id));
    }

    if (ruoloNormalizzato === 'condominio') {
      return segnalazioni.filter((s) => condominiIds.includes(s.condominio_id));
    }

    return [];
  }, [ruoloNormalizzato, segnalazioni, userProfile]);

  const condominiVisibili = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return condomini;

    const condominiIds = userProfile?.condominiIds || [];
    return condomini.filter((c) => condominiIds.includes(c.id));
  }, [ruoloNormalizzato, condomini, userProfile]);

  const segnalazioniVisualizzate = useMemo(() => {
    const testo = searchTerm.toLowerCase().trim();

    return segnalazioniFiltrate.filter((s) => {
      const passaCondominio = filtroCondominioId ? String(s.condominio_id) === String(filtroCondominioId) : true;
      const passaRicerca = !testo
        ? true
        : [s.titolo, s.descrizione, s.condominio, s.categoria, s.luogo, s.referente]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(testo));

      return passaCondominio && passaRicerca;
    });
  }, [segnalazioniFiltrate, filtroCondominioId, searchTerm]);

  const carica = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      if (!isSupabaseConfigured) {
        const demoItems = loadDemoSegnalazioni().sort((a, b) => b.id - a.id);
        setSegnalazioni(demoItems);
        setStatusMessage('Modalità demo locale attiva.');
        return;
      }

      const { data: condData } = await supabase.from('condomini').select('*');
      setCondomini(condData || []);

      const { data, error } = await supabase
        .from('segnalazioni')
        .select('*, condomini(nome)')
        .order('id', { ascending: false });

      if (error) throw error;

      const normalized = (data || []).map((item) => ({
        ...item,
        condominio: item.condomini?.nome || '',
        allegatoUrl: item.allegatonome ? buildPublicImageUrl(item.allegatonome) : '',
        note: Array.isArray(item.note) ? item.note : [],
      }));

      setSegnalazioni(normalized);
    } catch (error) {
      setStatusMessage(`Errore caricamento: ${error.message || 'impossibile recuperare i dati'}`);
      setSegnalazioni([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setReady = () => {
      if (isMounted) setAuthReady(true);
    };

    const handleSession = async (session) => {
      const sessionUser = session?.user;

      if (!sessionUser?.email) {
        if (!isMounted) return;
        setUtente(null);
        setUserProfile(null);
        setRuolo('gestore');
        return;
      }

      if (!isMounted) return;
      setUtente({ email: sessionUser.email, mode: 'supabase-session' });

      try {
        const profile = await loadUserProfile(sessionUser.email);
        if (!isMounted) return;
        setUserProfile(profile);
        setRuolo(profile.ruolo || 'non_configurato');
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(`Errore caricamento profilo: ${error.message}`);
        setUserProfile({ email: sessionUser.email, ruolo: 'non_configurato', condominio: '', condominiIds: [], condomini: [] });
        setRuolo('non_configurato');
      }
    };

    const startAuth = async () => {
      if (!supabase) {
        setReady();
        return;
      }

      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => {
          window.setTimeout(() => resolve({ timeout: true }), 3500);
        });

        const result = await Promise.race([sessionPromise, timeoutPromise]);

        if (!isMounted) return;

        if (result?.timeout) {
          setStatusMessage('Controllo accesso troppo lento: puoi riprovare il login.');
          setReady();
          return;
        }

        if (result.error) {
          setStatusMessage(`Errore sessione: ${result.error.message}`);
          setReady();
          return;
        }

        await handleSession(result.data?.session);
      } catch (error) {
        if (isMounted) {
          setStatusMessage(`Errore controllo accesso: ${error.message || 'sessione non disponibile'}`);
        }
      } finally {
        setReady();
      }
    };

    startAuth();

    const authListener = supabase?.auth.onAuthStateChange((_event, session) => {
      handleSession(session).finally(setReady);
    });

    return () => {
      isMounted = false;
      authListener?.data?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (isSupabaseConfigured && !utente) return;
    carica();
  }, [authReady, utente]);

  const salvaSegnalazione = async ({ titolo, descrizione, categoria, priorita, luogo, referente, telefono, condominioId, stato, file }) => {
    setSaving(true);
    setStatusMessage('');

    try {
      if (!isSupabaseConfigured) {
        let allegatoUrl = '';
        let allegatonome = '';

        if (file) {
          allegatonome = file.name;
          allegatoUrl = URL.createObjectURL(file);
        }

        const nextItem = {
          id: Date.now(),
          titolo,
          descrizione,
          categoria,
          priorita,
          luogo,
          referente,
          telefono,
          condominio: 'Demo Condominio',
          condominio_id: condominioId || null,
          stato,
          allegatonome,
          allegatoUrl,
          note: [],
          created_at: new Date().toISOString(),
        };

        const updated = [nextItem, ...loadDemoSegnalazioni()];
        saveDemoSegnalazioni(updated);
        setSegnalazioni(updated);
        setStatusMessage('Segnalazione salvata in modalità demo.');
        return;
      }

      let fileName = '';

      if (file) {
        fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage
          .from('allegati')
          .upload(fileName, file, { upsert: false });

        if (uploadError) throw uploadError;
      }

      const payload = {
        titolo,
        descrizione,
        categoria,
        priorita,
        luogo,
        referente,
        telefono,
        condominio_id: condominioId || null,
        stato,
        allegatonome: fileName,
        note: [],
      };

      const { error: insertError } = await supabase.from('segnalazioni').insert([payload]);
      if (insertError) throw insertError;

      await carica();
      setStatusMessage('Segnalazione salvata correttamente.');
    } finally {
      setSaving(false);
    }
  };

  const aggiornaSegnalazioneLocale = (id, updater) => {
    setSegnalazioni((prev) => {
      const updated = prev.map((item) => (item.id === id ? updater(item) : item));
      if (!isSupabaseConfigured) saveDemoSegnalazioni(updated);
      return updated;
    });
  };

  const cambiaStato = async (id, nuovoStato) => {
    if (!isSupabaseConfigured) {
      aggiornaSegnalazioneLocale(id, (item) => ({ ...item, stato: nuovoStato }));
      setDettaglioAperto((prev) => (prev && prev.id === id ? { ...prev, stato: nuovoStato } : prev));
      return;
    }

    const { error } = await supabase.from('segnalazioni').update({ stato: nuovoStato }).eq('id', id);
    if (!error) {
      await carica();
      setDettaglioAperto((prev) => (prev && prev.id === id ? { ...prev, stato: nuovoStato } : prev));
    }
  };

  const aggiungiNota = async (id, testo) => {
    const nuovaNota = {
      id: `${Date.now()}`,
      testo,
      data: new Date().toLocaleString('it-IT'),
    };

    if (!isSupabaseConfigured) {
      aggiornaSegnalazioneLocale(id, (item) => ({
        ...item,
        note: [nuovaNota, ...(item.note || [])],
      }));
      setDettaglioAperto((prev) =>
        prev && prev.id === id ? { ...prev, note: [nuovaNota, ...(prev.note || [])] } : prev
      );
      return;
    }

    const target = segnalazioni.find((item) => item.id === id);
    const updatedNotes = [nuovaNota, ...(target?.note || [])];
    const { error } = await supabase.from('segnalazioni').update({ note: updatedNotes }).eq('id', id);
    if (!error) {
      await carica();
      setDettaglioAperto((prev) =>
        prev && prev.id === id ? { ...prev, note: updatedNotes } : prev
      );
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-200">
          <p className="text-slate-600">Controllo accesso in corso...</p>
        </div>
      </div>
    );
  }

  if (!utente) {
    return (
      <Login
        onLogin={(u) => {
          if (u.mode === 'demo') {
            setUtente(u);
            setRuolo('gestore');
            setUserProfile({ email: u.email, ruolo: 'gestore', condominio: '', condominiIds: [], condomini: [] });
          }
        }}
        disabled={!isSupabaseConfigured}
        loading={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="relative rounded-3xl bg-gradient-to-r from-slate-100 via-white to-emerald-50 pt-10 md:pt-12 pb-5 md:pb-6 px-5 md:px-6 shadow-sm border border-slate-200 overflow-visible">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative -mt-12 md:-mt-16 z-20">
                <LogoMark />
              </div>

              <div className="text-slate-900 max-w-full">
                <h1 className="text-xl md:text-2xl font-bold leading-tight">
                  Condominio Senza Pensieri
                </h1>
                <p className="text-slate-500 mt-1 text-xs md:text-sm">
                  Gestione intelligente delle segnalazioni
                </p>

                <div className="mt-2 text-[11px] md:text-xs text-slate-500 space-y-0.5">
                  <p className="break-all">Utente: {utente.email}</p>
                  <p>Ruolo: {ruoloNormalizzato}</p>
                  {userProfile?.condominio && (
                    <p>Condominio: {userProfile.condominio}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                if (supabase && utente?.mode !== 'demo') {
                  await supabase.auth.signOut();
                }
                setUtente(null);
                setRuolo('gestore');
                setUserProfile(null);
                setDettaglioAperto(null);
              }}
              className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

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

        {ruolo === 'non_configurato' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            Il tuo profilo non è ancora configurato nella tabella utenti. Chiedi al gestore di associare la tua email a un ruolo.
          </div>
        )}

        <DashboardOperativa
          ruolo={ruoloNormalizzato}
          segnalazioni={segnalazioniVisualizzate}
          condomini={condominiVisibili}
          onOpen={setDettaglioAperto}
        />

        {puoCreareSegnalazioni && (
        <FormSegnalazione
          onSave={salvaSegnalazione}
          saving={saving}
          disabled={!isSupabaseConfigured}
          condomini={condominiVisibili}
          selectedCondominioId={selectedCondominioId}
          onChangeCondominio={setSelectedCondominioId}
        />
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Segnalazioni</h2>
            <button
              onClick={carica}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>

          {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}

          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-500">Caricamento segnalazioni...</p>
            </div>
          ) : segnalazioniVisualizzate.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-500">Nessuna segnalazione presente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {segnalazioniVisualizzate.map((s) => (
                <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} />
              ))}
            </div>
          )}
        </section>
      </div>

      <DettaglioPraticaModal
        segnalazione={dettaglioAperto}
        onClose={() => setDettaglioAperto(null)}
        onChangeStatus={cambiaStato}
        onAddNote={aggiungiNota}
      />
    </div>
  );
}
