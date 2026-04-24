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

async function loadUserProfile(email) {
  if (!supabase || !email) {
    return {
      email,
      ruolo: 'gestore',
      condominio: '',
    };
  }

  const { data, error } = await supabase
    .from('utenti')
    .select('email, ruolo, condominio')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      email,
      ruolo: 'non_configurato',
      condominio: '',
    };
  }

  return data;
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

function FormSegnalazione({ onSave, saving, disabled }) {
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

    try {
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

      {!segnalazione.allegatoUrl && segnalazione.allegatoNome && (
        <p className="mt-3 text-sm text-slate-500">Allegato: {segnalazione.allegatoNome}</p>
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

export default function App() {
  const [ruolo, setRuolo] = useState('gestore'); // default
  const [utente, setUtente] = useState(null);
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dettaglioAperto, setDettaglioAperto] = useState(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [userProfile, setUserProfile] = useState(null);

  const segnalazioniFiltrate = useMemo(() => {
    if (ruolo === 'gestore') return segnalazioni;

    if (ruolo === 'amministratore') {
      return segnalazioni.filter((s) => {
        if (userProfile?.condominio) return s.condominio === userProfile.condominio;
        return false;
      });
    }

    if (ruolo === 'condominio') {
      return segnalazioni.filter((s) => s.condominio === userProfile?.condominio);
    }

    return [];
  }, [ruolo, segnalazioni, userProfile]);

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

      const { data, error } = await supabase
        .from('segnalazioni')
        .select('*')
        .order('id', { ascending: false });

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

    const applySession = async (session) => {
      const sessionUser = session?.user;
      if (sessionUser?.email) {
        setUtente({ email: sessionUser.email, mode: 'supabase-session' });
        try {
          const profile = await loadUserProfile(sessionUser.email);
          setUserProfile(profile);
          setRuolo(profile.ruolo || 'non_configurato');
        } catch (error) {
          setStatusMessage(`Errore caricamento profilo: ${error.message}`);
          setUserProfile({ email: sessionUser.email, ruolo: 'non_configurato', condominio: '' });
          setRuolo('non_configurato');
        }
      } else {
        setUtente(null);
        setUserProfile(null);
        setRuolo('gestore');
      }
    };

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        setStatusMessage(`Errore sessione: ${error.message}`);
      } else {
        await applySession(data.session);
      }
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
      setAuthReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (isSupabaseConfigured && !utente) return;
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
        condominio,
        stato,
        allegatoNome: fileName,
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
            setUserProfile({ email: u.email, ruolo: 'gestore', condominio: '' });
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
        <header className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Condominio Senza Pensieri</h1>
            <p className="text-sm text-slate-500 mt-1">Utente: {utente.email}</p>
            <p className="text-sm text-slate-500 mt-1">Ruolo: {ruolo}</p>
            {userProfile?.condominio && (
              <p className="text-sm text-slate-500 mt-1">Condominio: {userProfile.condominio}</p>
            )}
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
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
          >
            Logout
          </button>
        </header>

        {ruolo === 'non_configurato' && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
            Il tuo profilo non è ancora configurato nella tabella utenti. Chiedi al gestore di associare la tua email a un ruolo.
          </div>
        )}

        <FormSegnalazione onSave={salvaSegnalazione} saving={saving} disabled={!isSupabaseConfigured} />

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
          ) : segnalazioniFiltrate.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-slate-500">Nessuna segnalazione presente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {segnalazioniFiltrate.map((s) => (
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
