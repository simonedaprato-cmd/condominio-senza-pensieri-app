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
    stato: 'Presa in carico',
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
  if (stato === 'Presa in carico') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (stato === 'Sopralluogo effettuato') return 'bg-purple-100 text-purple-700 border-purple-200';
  if (stato === 'Preventivata') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (stato === 'Chiusa') return 'bg-slate-200 text-slate-700 border-slate-300';
  if (stato === 'Urgente') return 'bg-red-100 text-red-700 border-red-200';
  if (stato === 'Programmato') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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
    .select('email, ruolo, condominio, telefono, nome')
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

function FormSegnalazione({ onSave, saving, disabled, condomini = [], selectedCondominioId, onChangeCondominio, utente, userProfile }) {
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
        amministratoreEmail: utente?.email || '',
        amministratoreTelefono: userProfile?.telefono || '',
        condominioId,
        stato: 'Presa in carico',
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

function formatEuro(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(number);
}

function buildPreventivoMessage(segnalazione) {
  const link = segnalazione.preventivourl || '';
  const importo = segnalazione.importo_preventivo ? formatEuro(segnalazione.importo_preventivo) : '';
  const righe = [
    'Buongiorno,',
    '',
    'è stato caricato il preventivo relativo alla pratica:',
    '"' + (segnalazione.titolo || '') + '"',
    '',
    'Condominio: ' + (segnalazione.condominio || 'n.d.'),
    importo ? 'Importo preventivo: ' + importo : '',
    'Stato pratica: ' + (segnalazione.stato || 'n.d.'),
    '',
    link ? 'Puoi visualizzare il preventivo qui:' : '',
    link,
    '',
    'Resto a disposizione.',
  ];

  return righe.filter(Boolean).join(String.fromCharCode(10));
}

function buildWhatsappPreventivo(segnalazione) {
  const body = buildPreventivoMessage(segnalazione);
  const numeroAmministratore = segnalazione.amministratore_telefono || segnalazione.telefono || '';
  const phone = String(numeroAmministratore).replace(/[^0-9]/g, '');
  const base = phone ? 'https://wa.me/' + phone : 'https://wa.me/';
  return base + '?text=' + encodeURIComponent(body);
}

function buildFollowupMessage(segnalazione) {
  return [
    'Buongiorno,',
    '',
    'ti scrivo per avere un riscontro sul preventivo:',
    '"' + (segnalazione.titolo || '') + '"',
    '',
    segnalazione.importo_preventivo ? 'Importo: ' + formatEuro(segnalazione.importo_preventivo) : '',
    'Condominio: ' + (segnalazione.condominio || 'n.d.'),
    '',
    'Resto a disposizione per chiarimenti.',
  ].filter(Boolean).join(String.fromCharCode(10));
}

async function inviaFollowup(segnalazione) {
  try {
    await fetch('/api/invia-preventivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: segnalazione.amministratore_email,
        titolo: 'Follow-up preventivo: ' + segnalazione.titolo,
        condominio: segnalazione.condominio,
        link: segnalazione.preventivourl,
      }),
    });

    const numero = segnalazione.amministratore_telefono || '';
    const url = 'https://wa.me/' + String(numero).replace(/[^0-9]/g, '') + '?text=' + encodeURIComponent(buildFollowupMessage(segnalazione));
    window.open(url, '_blank');

    alert('Follow-up inviato 🚀');
  } catch (e) {
    console.error(e);
    alert('Errore follow-up');
  }
}

async function inviaNotificaPreventivo(segnalazione) {
  try {
    await fetch('/api/invia-preventivo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: segnalazione.amministratore_email,
        titolo: segnalazione.titolo,
        condominio: segnalazione.condominio,
        link: segnalazione.preventivourl,
        importo: segnalazione.importo_preventivo || null,
      }),
    });

    const whatsappUrl = buildWhatsappPreventivo(segnalazione);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    if (segnalazione.id && supabase) {
      await supabase
        .from('segnalazioni')
        .update({
          stato_invio: 'inviato',
          data_invio: new Date().toISOString(),
        })
        .eq('id', segnalazione.id);
    }

    alert('Preventivo inviato ✅');
  } catch (error) {
    console.error(error);
    alert('Errore invio preventivo');
  }
}

async function aggiornaConversione(segnalazione, stato) {
  try {
    if (segnalazione.id && supabase) {
      await supabase
        .from('segnalazioni')
        .update({
          stato_conversione: stato,
          data_conversione: new Date().toISOString(),
        })
        .eq('id', segnalazione.id);
    }
    alert('Stato aggiornato: ' + stato);
    window.location.reload();
  } catch (e) {
    console.error(e);
    alert('Errore aggiornamento conversione');
  }
}

function DettaglioPraticaModal({
  segnalazione,
  onClose,
  onChangeStatus,
  onAddNote,
  onUploadSopralluogoFoto,
  onUploadPreventivo,
  onUpdateImportoPreventivo,
  ruolo,
}) {
  const [nota, setNota] = useState('');
  const [fotoSopralluogo, setFotoSopralluogo] = useState(null);
  const [preventivoFile, setPreventivoFile] = useState(null);
  const [importoPreventivo, setImportoPreventivo] = useState('');
  const [uploading, setUploading] = useState(false);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const isGestore = ruoloNormalizzato === 'gestore';

  if (!segnalazione) return null;

  const importoAttuale = segnalazione.importo_preventivo ? formatEuro(segnalazione.importo_preventivo) : 'Non inserito';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-2 md:p-4 z-50 overflow-hidden">
      <div className="bg-white w-full max-w-4xl h-[92vh] md:h-[90vh] rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/60">
        <div className="sticky top-0 z-20 p-4 md:p-5 border-b border-slate-200 flex items-start sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-xl shadow-sm">
          <div>
            <h3 className="text-lg md:text-xl font-bold leading-tight break-words">{segnalazione.titolo}</h3>
            <p className="text-sm text-slate-500 mt-1">{segnalazione.condominio}</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold shadow hover:bg-slate-800">
            Chiudi
          </button>
        </div>

        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-slate-100">
          <div className="space-y-3">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono referente:</span> {segnalazione.telefono || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono amministratore:</span> {segnalazione.amministratore_telefono || 'n.d.'}</p>
            <p><span className="text-slate-500">Importo preventivo:</span> {importoAttuale}</p>
            {segnalazione.allegatoUrl && (
              <img src={segnalazione.allegatoUrl} alt={segnalazione.titolo} className="w-full max-w-full md:max-w-sm rounded-xl border border-slate-200" />
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
              {(isGestore ? ['Presa in carico', 'Sopralluogo effettuato', 'Preventivata', 'Chiusa'] : []).map((stato) => (
                <button key={stato} onClick={() => onChangeStatus(segnalazione.id, stato)} className="px-3 py-2 rounded-xl border border-slate-300 text-sm">
                  {stato}
                </button>
              ))}
            </div>

            {isGestore && segnalazione.stato === 'Sopralluogo effettuato' && (
              <div className="space-y-2 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <p className="font-semibold text-purple-800">Foto sopralluogo</p>
                <p className="text-sm text-purple-700">Carica una foto rappresentativa del sopralluogo.</p>
                <input type="file" accept="image/*" onChange={(e) => setFotoSopralluogo(e.target.files?.[0] || null)} disabled={uploading} />
                <button
                  onClick={async () => {
                    if (!fotoSopralluogo) return;
                    setUploading(true);
                    await onUploadSopralluogoFoto(segnalazione.id, fotoSopralluogo);
                    setFotoSopralluogo(null);
                    setUploading(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-700 text-white text-sm disabled:opacity-60"
                  disabled={uploading || !fotoSopralluogo}
                >
                  {uploading ? 'Caricamento...' : 'Carica foto sopralluogo'}
                </button>
                {segnalazione.fotosopralluogourl && (
                  <img src={segnalazione.fotosopralluogourl} alt="Foto sopralluogo" className="mt-3 w-full max-w-full md:max-w-sm rounded-xl border border-purple-200" />
                )}
              </div>
            )}

            {isGestore && segnalazione.stato === 'Preventivata' && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Preventivo</p>
                <p className="text-sm text-emerald-700">Carica il preventivo e inserisci l’importo economico della proposta.</p>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Importo preventivo €"
                    value={importoPreventivo}
                    onChange={(e) => setImportoPreventivo(e.target.value)}
                    className="rounded-xl border border-emerald-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!importoPreventivo) return;
                      await onUpdateImportoPreventivo(segnalazione.id, importoPreventivo);
                      setImportoPreventivo('');
                    }}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
                  >
                    Salva importo
                  </button>
                </div>

                <input type="file" accept="application/pdf,image/*" onChange={(e) => setPreventivoFile(e.target.files?.[0] || null)} disabled={uploading} />
                <button
                  onClick={async () => {
                    if (!preventivoFile) return;
                    setUploading(true);
                    await onUploadPreventivo(segnalazione.id, preventivoFile);
                    setPreventivoFile(null);
                    setUploading(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm disabled:opacity-60"
                  disabled={uploading || !preventivoFile}
                >
                  {uploading ? 'Caricamento...' : 'Carica preventivo'}
                </button>

                {segnalazione.preventivourl && (
                  <div className="space-y-3">
                    <a
                href={`https://wa.me/393477921965?text=${encodeURIComponent(`Ciao Simone, sono ${userProfile?.nome || 'un utente'}, del condominio ${userProfile?.condominio || 'non specificato'}. Ho bisogno di supporto.${ruoloNormalizzato ? `
Ruolo: ${ruoloNormalizzato}` : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/15 backdrop-blur border border-white/20 hover:bg-green-500/80 transition"
                title="WhatsApp"
              >
                <svg viewBox="0 0 32 32" className="h-5 w-5 fill-white" aria-hidden="true">
                  <path d="M16 .4C7.4.4.4 7.4.4 16c0 2.8.7 5.4 2 7.7L.4 31.6l8.1-2c2.2 1.2 4.8 1.9 7.5 1.9 8.6 0 15.6-7 15.6-15.6S24.6.4 16 .4zm0 28.6c-2.4 0-4.7-.7-6.6-1.9l-.5-.3-4.8 1.2 1.3-4.7-.3-.5C4 20.7 3.4 18.4 3.4 16 3.4 8.9 8.9 3.4 16 3.4S28.6 8.9 28.6 16 23.1 29 16 29zm7.4-9.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.7-.2-1 .2-.3.4-1.1 1.3-1.4 1.6-.3.3-.5.3-.9.1-.4-.2-1.8-.7-3.4-2.2-1.3-1.2-2.2-2.7-2.4-3.1-.3-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.3-.4.4-.7.1-.2 0-.5 0-.7 0-.2-1-2.4-1.4-3.3-.3-.8-.7-.7-1-.7h-.8c-.3 0-.7.1-1 .5-.3.4-1.3 1.3-1.3 3.1s1.4 3.5 1.6 3.7c.2.2 2.8 4.3 6.9 6 .9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5z"/>
                </svg>
              </a>

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
                className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white text-sm font-semibold hover:bg-white/25"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {quickFilter && (
          <div className="max-w-4xl mx-auto rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>Filtro rapido attivo: <strong>{quickFilter === 'alto_valore' ? 'alto valore' : quickFilter}</strong></span>
            <button onClick={() => setQuickFilter('')} className="rounded-xl bg-white px-3 py-1 text-xs font-bold border border-emerald-200">
              Rimuovi
            </button>
          </div>
        )}

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

        <DashboardVendite segnalazioni={segnalazioniVisualizzate} />

        <DashboardOperativa
          ruolo={ruoloNormalizzato}
          segnalazioni={segnalazioniVisualizzate}
          condomini={condominiVisibili}
          onOpen={setDettaglioAperto}
        />

        

        <section className="space-y-3 pb-28 md:pb-6"> 
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Segnalazioni</h2>
            <button
              onClick={carica}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-900/20 hover:shadow-xl active:scale-95 transition disabled:opacity-60"
              disabled={loading}
            >
              <span className="inline-flex items-center gap-2">
                <span className={loading ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
                {loading ? 'Live...' : 'Aggiorna live'}
              </span>
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

        {puoCreareSegnalazioni && showNuovaSegnalazione && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-4">
            <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-white/60">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-xl p-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nuova segnalazione</h3>
                  <p className="text-xs text-slate-500">Compila i dati e salva la pratica.</p>
                </div>
                <button
                  onClick={() => setShowNuovaSegnalazione(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                >
                  Chiudi
                </button>
              </div>
              <div className="p-4">
                <FormSegnalazione
                  onSave={salvaSegnalazione}
                  saving={saving}
                  disabled={!isSupabaseConfigured}
                  condomini={condominiVisibili}
                  selectedCondominioId={selectedCondominioId}
                  onChangeCondominio={setSelectedCondominioId}
                  utente={utente}
                  userProfile={userProfile}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {puoCreareSegnalazioni && (
        <button
          onClick={() => setShowNuovaSegnalazione(true)}
          style={{ bottom: hasPreventiviBanner ? 'calc(1rem + 120px)' : '1.25rem' }}
          className={`fixed right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-700 active:scale-95 md:bottom-5 md:rounded-2xl md:px-5 md:py-3 ${mostraLabelFab ? 'px-4 py-3' : 'h-14 w-14 justify-center px-0 py-0'}`}
          aria-label="Nuova segnalazione"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-light leading-none">+</span>
          <span className={`overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight transition-all duration-300 ${mostraLabelFab ? 'max-w-44 opacity-100' : 'max-w-0 opacity-0'}`}>
            Nuova segnalazione
          </span>
        </button>
      )}

      <DettaglioPraticaModal
        segnalazione={dettaglioAperto}
        onClose={() => setDettaglioAperto(null)}
        onChangeStatus={cambiaStato}
        onAddNote={aggiungiNota}
        onUploadSopralluogoFoto={caricaFotoSopralluogo}
        onUploadPreventivo={caricaPreventivo}
        onUpdateImportoPreventivo={aggiornaImportoPreventivo}
        ruolo={ruoloNormalizzato}
      />
    </div>
  );
}
