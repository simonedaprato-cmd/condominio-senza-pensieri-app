import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CircleAlert,
  CircleCheckBig,
  ClipboardList,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';

const isSupabaseConfigured =
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('TUO-PROGETTO') &&
  !SUPABASE_ANON_KEY.includes('TUA-ANON-KEY');

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const DEMO_STORAGE_KEY = 'csp_demo_segnalazioni_app_zip';

const DEMO_DATA = [
  {
    id: 1,
    titolo: 'Infiltrazione nel vano scale',
    descrizione: 'Presenza di aloni umidi vicino alla copertura, soprattutto dopo la pioggia.',
    condominio: 'Demo Condominio',
    stato: 'In verifica',
    priorita: 'Media',
    categoria: 'Infiltrazioni',
    luogo: 'Scala A - ultimo piano',
    referente: 'Mario Rossi',
    telefono: '3331234567',
    allegatoNome: '',
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
  {
    id: 2,
    titolo: 'Distacco intonaco sottobalcone',
    descrizione: 'Piccoli frammenti rilevati nella corte interna. Serve verifica rapida per sicurezza.',
    condominio: 'Demo Condominio',
    stato: 'Urgente',
    priorita: 'Alta',
    categoria: 'Balconi',
    luogo: 'Corte interna - balcone 2° piano',
    referente: 'Lucia Bianchi',
    telefono: '3497654321',
    allegatoNome: '',
    allegatoUrl: '',
    note: [],
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    titolo: 'Portone ingresso non si chiude',
    descrizione: 'Il chiudiporta non completa la chiusura e l’ingresso resta spesso socchiuso.',
    condominio: 'Demo Condominio',
    stato: 'Programmato',
    priorita: 'Bassa',
    categoria: 'Parti comuni',
    luogo: 'Ingresso principale',
    referente: 'Giulio Amministratore',
    telefono: '3471112223',
    allegatoNome: '',
    allegatoUrl: '',
    note: [],
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

function loadUserRole(email) {
  if (!email) return 'gestore';
  const normalized = email.toLowerCase().trim();
  if (normalized.includes('condominio')) return 'condominio';
  if (normalized.includes('admin') || normalized.includes('amministratore')) return 'amministratore';
  return 'gestore';
}

function statusConfig(stato) {
  if (stato === 'Urgente') {
    return {
      badge: 'bg-red-100 text-red-700 border-red-200',
      pill: 'bg-red-600 text-white',
      stripe: 'bg-red-500',
      label: 'Urgenza alta',
      icon: CircleAlert,
    };
  }
  if (stato === 'Programmato') {
    return {
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pill: 'bg-emerald-600 text-white',
      stripe: 'bg-emerald-500',
      label: 'Intervento pianificato',
      icon: Wrench,
    };
  }
  if (stato === 'Chiuso') {
    return {
      badge: 'bg-slate-200 text-slate-700 border-slate-300',
      pill: 'bg-slate-700 text-white',
      stripe: 'bg-slate-400',
      label: 'Pratica chiusa',
      icon: CircleCheckBig,
    };
  }
  return {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    pill: 'bg-amber-500 text-white',
    stripe: 'bg-amber-400',
    label: 'Da verificare',
    icon: Search,
  };
}

function priorityConfig(priorita) {
  if (priorita === 'Alta') return 'bg-red-50 text-red-700 border-red-200';
  if (priorita === 'Media') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function AppLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold leading-tight text-white">CONDOMINIO</p>
          <p className="text-xl font-bold leading-tight text-emerald-400">SENZA PENSIERI</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <img
        src={LOGO_SRC}
        alt="Condominio Senza Pensieri"
        className="h-28 w-28 rounded-2xl object-contain"
        onError={() => setFailed(true)}
      />
      <div>
        <p className="text-2xl font-bold leading-tight text-white">CONDOMINIO</p>
        <p className="text-2xl font-bold leading-tight text-emerald-400">SENZA PENSIERI</p>
      </div>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active ? 'bg-white/12 text-white shadow-sm' : 'text-white/80 hover:bg-white/8 hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function Login({ onMagicLinkRequested, disabled }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const isEmailValid = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);

  const handleDemoLogin = () => {
    onMagicLinkRequested({ email: 'demo@condominio.it', mode: 'demo' });
  };

  const handleSupabaseLogin = async () => {
    if (!isEmailValid) {
      setMessage('Inserisci una email valida.');
      return;
    }

    if (!supabase) {
      setMessage('Supabase non è disponibile.');
      return;
    }

    setSending(true);
    setMessage('Invio link di accesso in corso...');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setMessage(`Accesso non riuscito: ${error.message}`);
        return;
      }

      setMessage('Link di accesso inviato. Controlla la tua email e poi torna qui.');
      onMagicLinkRequested({ email: email.trim(), mode: 'supabase-pending' });
    } catch (error) {
      setMessage(`Errore di connessione: ${error.message || 'impossibile contattare il server'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-6">
      <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            ammigo.it · piattaforma condominio
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
            Una app che organizza il condominio e abbassa la percezione di caos.
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Pratiche, segnalazioni, stato degli interventi, documenti e viste dedicate per gestore, amministratore e condominio.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Pratiche" value="24" hint="ordinate e leggibili" />
            <StatCard title="Urgenze" value="3" hint="subito evidenti" />
            <StatCard title="Controllo" value="100%" hint="più chiarezza operativa" />
          </div>
        </div>

        <div className="space-y-5 rounded-[28px] border border-white bg-white/90 p-8 shadow-xl backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Accedi all’app</h2>
            <p className="mt-2 text-sm text-slate-500">
              {disabled
                ? 'Modalità demo attiva: puoi provare tutta l’interfaccia localmente.'
                : 'Inserisci la tua email per ricevere il link di accesso.'}
            </p>
          </div>

          {disabled ? (
            <button
              onClick={handleDemoLogin}
              className="w-full rounded-2xl bg-slate-900 py-3 font-medium text-white shadow-sm transition hover:opacity-95"
            >
              Entra in demo
            </button>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setMessage('');
                }}
                placeholder="Inserisci la tua email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
                disabled={sending}
              />
              <button
                onClick={handleSupabaseLogin}
                className="w-full rounded-2xl bg-slate-900 py-3 font-medium text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
                disabled={sending}
              >
                {sending ? 'Invio in corso...' : 'Ricevi link di accesso'}
              </button>
            </>
          )}

          {message && <p className="text-sm text-slate-600">{message}</p>}
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <p className="mb-2 text-sm font-medium text-slate-700">{children}</p>;
}

function FormSegnalazione({ onSave, saving }) {
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [categoria, setCategoria] = useState('Infiltrazioni');
  const [priorita, setPriorita] = useState('Media');
  const [luogo, setLuogo] = useState('');
  const [referente, setReferente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [file, setFile] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrore('');
    if (!titolo.trim()) return setErrore('Il titolo è obbligatorio.');
    if (!descrizione.trim()) return setErrore('La descrizione è obbligatoria.');
    if (!luogo.trim()) return setErrore('Indica dove si trova il problema.');

    await onSave({
      titolo: titolo.trim(),
      descrizione: descrizione.trim(),
      categoria,
      priorita,
      luogo: luogo.trim(),
      referente: referente.trim(),
      telefono: telefono.trim(),
      condominio: 'Demo Condominio',
      stato: 'In verifica',
      file,
    });

    reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
      <div>
        <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          Nuova pratica guidata
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Apri una nuova segnalazione</h2>
        <p className="mt-2 text-sm text-slate-500">
          Compila i campi essenziali per trasformare una segnalazione in una pratica chiara e subito gestibile.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div>
            <FieldLabel>Cosa sta succedendo?</FieldLabel>
            <input value={titolo} onChange={(e) => setTitolo(e.target.value)} placeholder="Es. infiltrazione dal lastrico solare" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>
          <div>
            <FieldLabel>Descrivi il problema</FieldLabel>
            <textarea value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="Spiega in poche righe cosa hai rilevato e quando compare." className="min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Categoria</FieldLabel>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200">
                <option>Infiltrazioni</option>
                <option>Balconi</option>
                <option>Facciate</option>
                <option>Copertura</option>
                <option>Grondaie e pluviali</option>
                <option>Parti comuni</option>
              </select>
            </div>
            <div>
              <FieldLabel>Priorità</FieldLabel>
              <select value={priorita} onChange={(e) => setPriorita(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200">
                <option>Bassa</option>
                <option>Media</option>
                <option>Alta</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <FieldLabel>Dove si trova il problema?</FieldLabel>
            <input value={luogo} onChange={(e) => setLuogo(e.target.value)} placeholder="Es. scala B, 3° piano, sottobalcone interno" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabel>Referente</FieldLabel>
              <input value={referente} onChange={(e) => setReferente(e.target.value)} placeholder="Nome e cognome" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <FieldLabel>Telefono</FieldLabel>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Recapito telefonico" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
          </div>
          <div>
            <FieldLabel>Allegato fotografico</FieldLabel>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>
      </div>

      {errore && <p className="text-sm font-medium text-red-600">{errore}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white shadow-sm disabled:opacity-60" disabled={saving}>{saving ? 'Salvataggio...' : 'Apri pratica'}</button>
        <button type="button" onClick={reset} className="rounded-2xl border border-slate-300 px-5 py-3 font-medium text-slate-700">Reset campi</button>
      </div>
    </form>
  );
}

function SegnalazioneCard({ segnalazione, onOpen }) {
  const currentStatus = statusConfig(segnalazione.stato);
  const StatusIcon = currentStatus.icon;

  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute left-0 top-0 h-full w-2 ${currentStatus.stripe}`} />
      <div className="p-5 pl-7 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.pill}`}>{currentStatus.label}</span>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityConfig(segnalazione.priorita || 'Media')}`}>Priorità {segnalazione.priorita || 'Media'}</span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{segnalazione.categoria || 'Generica'}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{segnalazione.titolo}</h3>
              <p className="mt-1 text-sm text-slate-500">{segnalazione.condominio}</p>
            </div>
            <p className="leading-6 text-slate-700">{segnalazione.descrizione}</p>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-slate-500">Luogo</p><p className="mt-1 font-medium text-slate-800">{segnalazione.luogo || 'n.d.'}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-slate-500">Referente</p><p className="mt-1 font-medium text-slate-800">{segnalazione.referente || 'n.d.'}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-slate-500">Stato</p><p className="mt-1 font-medium text-slate-800">{segnalazione.stato}</p></div>
            </div>
          </div>

          <div className="flex min-w-[180px] flex-col items-start gap-3 lg:items-end">
            {segnalazione.allegatoUrl ? (
              <img src={segnalazione.allegatoUrl} alt={segnalazione.titolo} className="h-28 w-40 rounded-2xl border border-slate-200 object-cover" />
            ) : (
              <div className="flex h-28 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                <StatusIcon className="h-7 w-7" />
                Nessuna foto
              </div>
            )}

            <button onClick={() => onOpen(segnalazione)} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-95">Apri pratica</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote }) {
  const [nota, setNota] = useState('');
  if (!segnalazione) return null;
  const currentStatus = statusConfig(segnalazione.stato);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 p-6 text-white lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/70">Scheda pratica</p>
            <h3 className="mt-2 text-2xl font-bold">{segnalazione.titolo}</h3>
            <p className="mt-2 text-sm text-white/80">{segnalazione.condominio}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${currentStatus.pill}`}>{currentStatus.label}</span>
            <button onClick={onClose} className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium">Chiudi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 bg-slate-50 p-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900">Panoramica</h4>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div><p className="text-slate-500">Descrizione</p><p className="mt-1 text-slate-800">{segnalazione.descrizione}</p></div>
                <div><p className="text-slate-500">Luogo</p><p className="mt-1 text-slate-800">{segnalazione.luogo || 'n.d.'}</p></div>
                <div><p className="text-slate-500">Categoria</p><p className="mt-1 text-slate-800">{segnalazione.categoria || 'n.d.'}</p></div>
                <div><p className="text-slate-500">Referente</p><p className="mt-1 text-slate-800">{segnalazione.referente || 'n.d.'}</p></div>
                <div><p className="text-slate-500">Telefono</p><p className="mt-1 text-slate-800">{segnalazione.telefono || 'n.d.'}</p></div>
                <div><p className="text-slate-500">Priorità</p><span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityConfig(segnalazione.priorita || 'Media')}`}>{segnalazione.priorita || 'Media'}</span></div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900">Cronologia note</h4>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
                {(segnalazione.note || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nessuna nota presente.</p>
                ) : (
                  segnalazione.note.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-700">{n.testo}</p>
                      <p className="mt-2 text-xs text-slate-500">{n.data}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900">Stato pratica</h4>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${currentStatus.badge}`}>{segnalazione.stato}</span>
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${priorityConfig(segnalazione.priorita || 'Media')}`}>Priorità {segnalazione.priorita || 'Media'}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {['In verifica', 'Programmato', 'Urgente', 'Chiuso'].map((stato) => (
                  <button key={stato} onClick={() => onChangeStatus(segnalazione.id, stato)} className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">{stato}</button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900">Azione operativa</h4>
              <p className="mt-2 text-sm text-slate-500">Aggiungi una nota per tenere traccia di sopralluoghi, decisioni e aggiornamenti.</p>
              <textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Scrivi una nota operativa..." className="mt-4 min-h-32 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200" />
              <button onClick={() => { if (!nota.trim()) return; onAddNote(segnalazione.id, nota.trim()); setNota(''); }} className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">Aggiungi nota</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardView({ statistiche, segnalazioni, onOpen }) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 text-white shadow-xl">
        <div className="grid gap-6 p-8 md:p-10 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">Dashboard operativa</div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Controllo, ordine e meno stress.</h1>
              <p className="mt-4 max-w-2xl text-lg text-white/75">Una vista chiara delle pratiche aperte, delle urgenze e di ciò che richiede un’azione immediata.</p>
            </div>
          </div>
          <div className="grid gap-4 self-end sm:grid-cols-2">
            <StatCard title="Pratiche visibili" value={String(statistiche.totale)} hint="situazione complessiva" />
            <StatCard title="Urgenze attive" value={String(statistiche.urgenti)} hint="interventi prioritari" />
            <StatCard title="In verifica" value={String(statistiche.inVerifica)} hint="da monitorare" />
            <StatCard title="Chiuse" value={String(statistiche.chiuse)} hint="storico ordinato" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Pratiche recenti</h2>
          <p className="mt-1 text-sm text-slate-500">Le schede sono pensate come ticket operativi, leggibili anche a colpo d’occhio.</p>
        </div>
        <div className="space-y-4">
          {segnalazioni.slice(0, 3).map((s) => (
            <SegnalazioneCard key={s.id} segnalazione={s} onOpen={onOpen} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SegnalazioniView({ segnalazioni, onOpen }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Segnalazioni e pratiche</h2>
          <p className="mt-1 text-sm text-slate-500">Elenco completo delle richieste aperte nel sistema.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500"><Search className="h-4 w-4" /> Cerca</div>
          <button className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700">Filtri</button>
        </div>
      </div>
      <div className="space-y-4">
        {segnalazioni.map((s) => (
          <SegnalazioneCard key={s.id} segnalazione={s} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function PlaceholderView({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center rounded-[28px] border border-white/70 bg-white/90 p-10 text-center shadow-sm backdrop-blur">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-700"><Icon className="h-10 w-10" /></div>
      <h2 className="mt-6 text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-3 max-w-xl text-slate-500">{description}</p>
    </div>
  );
}

export default function App() {
  const [ruolo, setRuolo] = useState('gestore');
  const [utente, setUtente] = useState(null);
  const [view, setView] = useState('dashboard');
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dettaglioAperto, setDettaglioAperto] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const segnalazioniFiltrate = useMemo(() => {
    if (ruolo === 'gestore') return segnalazioni;
    if (ruolo === 'amministratore') return segnalazioni.filter((s) => s.condominio.includes('Demo'));
    if (ruolo === 'condominio') return segnalazioni.filter((s) => s.condominio === 'Demo Condominio');
    return segnalazioni;
  }, [ruolo, segnalazioni]);

  const statistiche = useMemo(() => {
    const source = segnalazioniFiltrate;
    return {
      totale: source.length,
      urgenti: source.filter((s) => s.stato === 'Urgente').length,
      inVerifica: source.filter((s) => s.stato === 'In verifica').length,
      chiuse: source.filter((s) => s.stato === 'Chiuso').length,
    };
  }, [segnalazioniFiltrate]);

  const navigation = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'segnalazioni', label: 'Segnalazioni', icon: ClipboardList },
    { key: 'nuova', label: 'Nuova segnalazione', icon: FileText },
    { key: 'pratiche', label: 'Pratiche', icon: FolderOpen },
    { key: 'documenti', label: 'Documenti', icon: FileText },
    { key: 'impostazioni', label: 'Impostazioni', icon: Settings },
  ];

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

      const { data, error } = await supabase.from('segnalazioni').select('*').order('id', { ascending: false });
      if (error) throw error;

      const normalized = (data || []).map((item) => ({
        ...item,
        allegatoUrl: item.allegatoNome ? buildPublicImageUrl(item.allegatoNome) : '',
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
    if (!supabase) {
      setAuthReady(true);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setStatusMessage(`Errore sessione: ${error.message}`);
        setAuthReady(true);
        return;
      }
      const sessionUser = data.session?.user;
      if (sessionUser?.email) {
        setUtente({ email: sessionUser.email, mode: 'supabase-session' });
        setRuolo(loadUserRole(sessionUser.email));
      }
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser?.email) {
        setUtente({ email: sessionUser.email, mode: 'supabase-session' });
        setRuolo(loadUserRole(sessionUser.email));
      } else {
        setUtente(null);
        setRuolo('gestore');
      }
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!utente && supabase) return;
    carica();
  }, [authReady, utente]);

  const salvaSegnalazione = async ({ titolo, descrizione, categoria, priorita, luogo, referente, telefono, condominio, stato, file }) => {
    setSaving(true);
    setStatusMessage('');

    try {
      if (!isSupabaseConfigured) {
        let allegatoUrl = '';
        let allegatoNome = '';
        if (file) {
          allegatoNome = file.name;
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
          condominio,
          stato,
          allegatoNome,
          allegatoUrl,
          note: [],
          created_at: new Date().toISOString(),
        };

        const updated = [nextItem, ...loadDemoSegnalazioni()];
        saveDemoSegnalazioni(updated);
        setSegnalazioni(updated);
        setStatusMessage('Pratica aperta correttamente in modalità demo.');
        setView('segnalazioni');
        return;
      }

      let fileName = '';
      if (file) {
        fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const { error: uploadError } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: false });
        if (uploadError) throw uploadError;
      }

      const payload = { titolo, descrizione, categoria, priorita, luogo, referente, telefono, condominio, stato, allegatoNome: fileName, note: [] };
      const { error: insertError } = await supabase.from('segnalazioni').insert([payload]);
      if (insertError) throw insertError;

      await carica();
      setStatusMessage('Pratica aperta correttamente.');
      setView('segnalazioni');
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
    const nuovaNota = { id: `${Date.now()}`, testo, data: new Date().toLocaleString('it-IT') };

    if (!isSupabaseConfigured) {
      aggiornaSegnalazioneLocale(id, (item) => ({ ...item, note: [nuovaNota, ...(item.note || [])] }));
      setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, note: [nuovaNota, ...(prev.note || [])] } : prev);
      return;
    }

    const target = segnalazioni.find((item) => item.id === id);
    const updatedNotes = [nuovaNota, ...(target?.note || [])];
    const { error } = await supabase.from('segnalazioni').update({ note: updatedNotes }).eq('id', id);
    if (!error) {
      await carica();
      setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, note: updatedNotes } : prev);
    }
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-6">
        <div className="rounded-[28px] border border-white bg-white/90 px-8 py-6 shadow-xl backdrop-blur">
          <p className="text-slate-600">Controllo sessione in corso...</p>
        </div>
      </div>
    );
  }

  if (!utente) {
    return (
      <Login
        onMagicLinkRequested={(u) => {
          if (u.mode === 'demo') {
            setUtente(u);
            setRuolo(loadUserRole(u.email));
          }
        }}
        disabled={!isSupabaseConfigured}
      />
    );
  }

  let content = null;
  if (view === 'dashboard') content = <DashboardView statistiche={statistiche} segnalazioni={segnalazioniFiltrate} onOpen={setDettaglioAperto} />;
  if (view === 'segnalazioni' || view === 'pratiche') content = <SegnalazioniView segnalazioni={segnalazioniFiltrate} onOpen={setDettaglioAperto} />;
  if (view === 'nuova') content = <FormSegnalazione onSave={salvaSegnalazione} saving={saving} />;
  if (view === 'documenti') content = <PlaceholderView icon={FileText} title="Area documenti" description="Qui potrai raccogliere verbali, report tecnici, preventivi, foto e materiali da consultare per condominio o per pratica." />;
  if (view === 'impostazioni') content = <PlaceholderView icon={ShieldCheck} title="Impostazioni e configurazioni" description="Da qui potrai gestire logo, utenti, ruoli, condòmini, amministratori, preferenze e integrazioni del progetto." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="flex flex-col bg-gradient-to-b from-[#034b36] via-[#013d2c] to-[#022c21] p-5 text-white lg:p-6">
          <AppLogo />

          <div className="mt-8 space-y-2">
            {navigation.map((item) => (
              <SidebarItem key={item.key} icon={item.icon} label={item.label} active={view === item.key || (view === 'pratiche' && item.key === 'pratiche')} onClick={() => setView(item.key)} />
            ))}
          </div>

          <div className="mt-auto space-y-4 pt-6">
            <div className="rounded-3xl border border-white/15 bg-white/6 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
                  {utente.email?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">{utente.email}</p>
                  <p className="text-sm text-white/70">{ruolo}</p>
                </div>
              </div>
            </div>
            <button onClick={async () => {
              if (supabase && utente?.mode !== 'demo') {
                await supabase.auth.signOut();
              }
              setUtente(null);
              setRuolo('gestore');
              setDettaglioAperto(null);
            }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-white/80 hover:bg-white/8 hover:text-white">
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        </aside>

        <main className="p-5 md:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Home className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Demo Condominio</h1>
                  <p className="text-sm text-slate-500">Via Roma 123, Milano</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">Vista: {ruolo}</span>
                <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600"><Bell className="h-5 w-5" /></button>
              </div>
            </header>

            {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}

            {loading ? <div className="rounded-[28px] border border-white/70 bg-white/90 p-8 text-slate-500 shadow-sm">Caricamento contenuti...</div> : content}
          </div>
        </main>
      </div>

      <DettaglioPraticaModal segnalazione={dettaglioAperto} onClose={() => setDettaglioAperto(null)} onChangeStatus={cambiaStato} onAddNote={aggiungiNota} />
    </div>
  );
}
