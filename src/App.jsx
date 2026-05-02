import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';
const AUTH_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STATI_PRATICA = ['Presa in carico', 'Sopralluogo effettuato', 'Preventivata', 'Accettata', 'Pianificata', 'Chiusa'];
const PIANI_ABBONAMENTO = {
  base: { nome: 'Base', costo: 3.5, app: false, whatsapp: false },
  plus: { nome: 'Plus', costo: 6.5, app: false, whatsapp: true },
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

function GestioneContratti({ condomini, contratti, onCreateContratto }) {
  const [condominioId, setCondominioId] = useState('');
  const [piano, setPiano] = useState('premium');
  const [famiglie, setFamiglie] = useState('');

  const pianoConfig = PIANI_ABBONAMENTO[piano] || PIANI_ABBONAMENTO.premium;
  const famiglieNum = Number(famiglie || 0);
  const ricavoMensile = famiglieNum * pianoConfig.costo;
  const ricavoAnnuale = ricavoMensile * 12;

  const submit = async (e) => {
    e.preventDefault();
    if (!condominioId || !famiglieNum) return;

    await onCreateContratto({
      condominio_id: Number(condominioId),
      piano,
      famiglie: famiglieNum,
      costo_unitario: pianoConfig.costo,
      ricavo_mensile: ricavoMensile,
      ricavo_annuo: ricavoAnnuale,
      gruppo_whatsapp_attivo: pianoConfig.whatsapp,
      app_attiva: pianoConfig.app,
    });

    setCondominioId('');
    setFamiglie('');
    setPiano('premium');
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Contratti</p>
      <h2 className="mt-1 text-xl font-bold">Attiva nuovo abbonamento</h2>
      <p className="mt-1 text-sm text-slate-500">Gestione commerciale ricorrente Condominio Senza Pensieri.</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <select value={condominioId} onChange={(e) => setCondominioId(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
          <option value="">Seleziona condominio</option>
          {condomini.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>

        <select value={piano} onChange={(e) => setPiano(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
          <option value="base">Base</option>
          <option value="plus">Plus</option>
          <option value="premium">Premium</option>
        </select>

        <input
          type="number"
          min="1"
          placeholder="Numero famiglie"
          value={famiglie}
          onChange={(e) => setFamiglie(e.target.value)}
          className="w-full rounded-2xl border border-slate-200 px-3 py-3"
        />

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-sm font-semibold">Riepilogo economico</p>
          <p className="text-sm text-slate-600">Costo unitario: {formatEuro(pianoConfig.costo)}</p>
          <p className="text-sm text-slate-600">MRR: {formatEuro(ricavoMensile)}</p>
          <p className="text-sm text-slate-600">ARR: {formatEuro(ricavoAnnuale)}</p>
        </div>

        <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white">
          Attiva contratto
        </button>
      </form>
    </section>
  );
}

function GestioneRinnoviContratti({ contratti, onRinnovaContratto, onUpgradeContratto }) {
  const inScadenza = contratti.filter((c) => {
    if (!c.data_scadenza || c.stato !== 'attivo') return false;
    const oggi = new Date();
    const scadenza = new Date(c.data_scadenza);
    const diff = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
    return diff <= 30;
  });

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Rinnovi</p>
      <h2 className="mt-1 text-xl font-bold">Contratti in scadenza / upgrade</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio rinnovi e crescita commerciale.</p>

      <div className="mt-4 space-y-3">
        {inScadenza.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            Nessun contratto in scadenza nei prossimi 30 giorni.
          </div>
        ) : (
          inScadenza.map((contratto) => (
            <div key={contratto.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">Condominio ID #{contratto.condominio_id}</p>
                  <p className="text-sm text-slate-500">
                    Piano: {PIANI_ABBONAMENTO[contratto.piano]?.nome || contratto.piano} • Scadenza: {new Date(contratto.data_scadenza).toLocaleDateString('it-IT')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onRinnovaContratto(contratto)}
                    className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
                  >
                    Rinnova
                  </button>
                  {contratto.piano !== 'premium' && (
                    <button
                      onClick={() => onUpgradeContratto(contratto)}
                      className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white"
                    >
                      Upgrade Premium
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardTerritorioToscana({ contratti, condomini }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');

  const province = {};
  attivi.forEach((contratto) => {
    const condominio = condomini.find((c) => c.id === contratto.condominio_id);
    const indirizzo = (condominio?.indirizzo || '').toLowerCase();

    let provincia = 'Toscana generica';
    if (indirizzo.includes('firenze')) provincia = 'Firenze';
    else if (indirizzo.includes('prato')) provincia = 'Prato';
    else if (indirizzo.includes('pistoia')) provincia = 'Pistoia';
    else if (indirizzo.includes('lucca')) provincia = 'Lucca';
    else if (indirizzo.includes('pisa')) provincia = 'Pisa';
    else if (indirizzo.includes('livorno')) provincia = 'Livorno';
    else if (indirizzo.includes('arezzo')) provincia = 'Arezzo';
    else if (indirizzo.includes('siena')) provincia = 'Siena';
    else if (indirizzo.includes('massa')) provincia = 'Massa-Carrara';
    else if (indirizzo.includes('grosseto')) provincia = 'Grosseto';

    if (!province[provincia]) {
      province[provincia] = {
        nome: provincia,
        condomini: 0,
        fatturato: 0,
      };
    }

    province[provincia].condomini += 1;
    province[provincia].fatturato += Number(contratto.ricavo_annuo || 0);
  });

  const ranking = Object.values(province).sort((a, b) => b.fatturato - a.fatturato);
  const fatturatoTotale = ranking.reduce((sum, p) => sum + p.fatturato, 0);
  const provinciaTop = ranking[0]?.nome || 'N.D.';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-700">Toscana</p>
      <h2 className="mt-1 text-xl font-bold">Espansione territoriale Toscana</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio crescita strategica regionale.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Province attive" value={ranking.length} tone="sky" />
        <DashboardStat label="Condomini attivi" value={attivi.length} tone="emerald" />
        <DashboardStat label="ARR Toscana" value={formatEuro(fatturatoTotale)} tone="amber" />
        <DashboardStat label="Top provincia" value={provinciaTop} tone="slate" />
      </div>

      <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
        <p className="text-sm font-bold text-orange-800">Priorità provinciali</p>
        <div className="mt-3 space-y-2">
          {ranking.length === 0 ? (
            <p className="text-sm text-orange-700">Nessun dato disponibile.</p>
          ) : (
            ranking.slice(0, 7).map((provincia) => (
              <div key={provincia.nome} className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">{provincia.nome}</p>
                  <p className="text-xs text-slate-500">{provincia.condomini} condomini</p>
                </div>
                <p className="font-bold text-orange-700">{formatEuro(provincia.fatturato)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardProvinceOpportunita({ contratti, condomini }) {
  const attiviIds = new Set(contratti.filter((c) => c.stato === 'attivo').map((c) => c.condominio_id));

  const provinceStats = {};

  condomini.forEach((condominio) => {
    const indirizzo = (condominio.indirizzo || '').toLowerCase();
    let provincia = 'Toscana generica';

    if (indirizzo.includes('firenze')) provincia = 'Firenze';
    else if (indirizzo.includes('prato')) provincia = 'Prato';
    else if (indirizzo.includes('pistoia')) provincia = 'Pistoia';
    else if (indirizzo.includes('lucca')) provincia = 'Lucca';
    else if (indirizzo.includes('pisa')) provincia = 'Pisa';
    else if (indirizzo.includes('livorno')) provincia = 'Livorno';
    else if (indirizzo.includes('arezzo')) provincia = 'Arezzo';
    else if (indirizzo.includes('siena')) provincia = 'Siena';
    else if (indirizzo.includes('massa')) provincia = 'Massa-Carrara';
    else if (indirizzo.includes('grosseto')) provincia = 'Grosseto';

    if (!provinceStats[provincia]) {
      provinceStats[provincia] = {
        nome: provincia,
        totali: 0,
        acquisiti: 0,
      };
    }

    provinceStats[provincia].totali += 1;
    if (attiviIds.has(condominio.id)) {
      provinceStats[provincia].acquisiti += 1;
    }
  });

  const opportunita = Object.values(provinceStats)
    .map((p) => ({
      ...p,
      prospect: p.totali - p.acquisiti,
      penetrazione: p.totali ? Math.round((p.acquisiti / p.totali) * 100) : 0,
    }))
    .sort((a, b) => b.prospect - a.prospect);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Opportunità Toscana</p>
      <h2 className="mt-1 text-xl font-bold">Province a maggior potenziale</h2>
      <p className="mt-1 text-sm text-slate-500">Dove concentrare acquisizione amministratori e campagne locali.</p>

      <div className="mt-4 space-y-3">
        {opportunita.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun dato disponibile.</p>
        ) : (
          opportunita.slice(0, 7).map((provincia) => (
            <div key={provincia.nome} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{provincia.nome}</p>
                  <p className="text-xs text-slate-500">
                    Copertura: {provincia.acquisiti}/{provincia.totali} • Penetrazione {provincia.penetrazione}%
                  </p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
                  Prospect: {provincia.prospect}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardLeadCommercialeToscana({ contratti, condomini }) {
  const attiviIds = new Set(
    contratti.filter((c) => c.stato === 'attivo').map((c) => c.condominio_id)
  );

  const leadPerProvincia = {};

  condomini.forEach((condominio) => {
    const indirizzo = (condominio.indirizzo || '').toLowerCase();
    let provincia = 'Toscana generica';

    if (indirizzo.includes('firenze')) provincia = 'Firenze';
    else if (indirizzo.includes('prato')) provincia = 'Prato';
    else if (indirizzo.includes('pistoia')) provincia = 'Pistoia';
    else if (indirizzo.includes('lucca')) provincia = 'Lucca';
    else if (indirizzo.includes('pisa')) provincia = 'Pisa';
    else if (indirizzo.includes('livorno')) provincia = 'Livorno';
    else if (indirizzo.includes('arezzo')) provincia = 'Arezzo';
    else if (indirizzo.includes('siena')) provincia = 'Siena';
    else if (indirizzo.includes('massa')) provincia = 'Massa-Carrara';
    else if (indirizzo.includes('grosseto')) provincia = 'Grosseto';

    if (!leadPerProvincia[provincia]) {
      leadPerProvincia[provincia] = {
        nome: provincia,
        prospect: 0,
        attivi: 0,
      };
    }

    if (attiviIds.has(condominio.id)) {
      leadPerProvincia[provincia].attivi += 1;
    } else {
      leadPerProvincia[provincia].prospect += 1;
    }
  });

  const ranking = Object.values(leadPerProvincia)
    .map((provincia) => ({
      ...provincia,
      score: provincia.prospect * 2 + provincia.attivi,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Lead Toscana</p>
      <h2 className="mt-1 text-xl font-bold">Pipeline commerciale territoriale</h2>
      <p className="mt-1 text-sm text-slate-500">Province prioritarie per acquisizione amministratori e campagne locali.</p>

      <div className="mt-4 space-y-3">
        {ranking.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun dato disponibile.</p>
        ) : (
          ranking.slice(0, 8).map((provincia) => (
            <div key={provincia.nome} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{provincia.nome}</p>
                  <p className="text-xs text-slate-500">
                    Attivi: {provincia.attivi} • Prospect: {provincia.prospect}
                  </p>
                </div>
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                  Score: {provincia.score}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardMarginalita({ contratti }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');

  const fatturato = attivi.reduce((sum, c) => sum + Number(c.ricavo_annuo || 0), 0);
  const costoOperativoStimato = Math.round(fatturato * 0.38);
  const margineLordo = fatturato - costoOperativoStimato;
  const marginalitaPercentuale = fatturato ? Math.round((margineLordo / fatturato) * 100) : 0;
  const valoreMedioCliente = attivi.length ? Math.round(fatturato / attivi.length) : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Marginalità</p>
      <h2 className="mt-1 text-xl font-bold">KPI marginalità netta reale</h2>
      <p className="mt-1 text-sm text-slate-500">Controllo sostenibilità economica e profitto operativo.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Fatturato annuo" value={formatEuro(fatturato)} tone="sky" />
        <DashboardStat label="Costi stimati" value={formatEuro(costoOperativoStimato)} tone="red" />
        <DashboardStat label="Margine lordo" value={formatEuro(margineLordo)} tone="emerald" />
        <DashboardStat label="Marginalità" value={marginalitaPercentuale + '%'} tone="amber" />
      </div>

      <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4">
        <p className="text-sm font-bold text-green-800">Valore medio cliente</p>
        <p className="mt-2 text-2xl font-black text-green-700">{formatEuro(valoreMedioCliente)}</p>
        <p className="text-xs text-green-700">Redditività media annuale per condominio attivo</p>
      </div>
    </section>
  );
}

function DashboardLeadPipeline({ contratti, condomini }) {
  const attiviIds = new Set(
    contratti.filter((c) => c.stato === 'attivo').map((c) => c.condominio_id)
  );

  const prospectCondomini = condomini.filter((c) => !attiviIds.has(c.id));

  const leadCaldi = prospectCondomini.slice(0, Math.ceil(prospectCondomini.length * 0.35));
  const leadTiepidi = prospectCondomini.slice(leadCaldi.length, Math.ceil(prospectCondomini.length * 0.7));
  const leadFreddi = prospectCondomini.slice(leadCaldi.length + leadTiepidi.length);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Pipeline</p>
      <h2 className="mt-1 text-xl font-bold">CRM lead amministratori prospect</h2>
      <p className="mt-1 text-sm text-slate-500">Pipeline acquisizione commerciale nuovi clienti.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Prospect totali" value={prospectCondomini.length} tone="slate" />
        <DashboardStat label="Lead caldi" value={leadCaldi.length} tone="red" />
        <DashboardStat label="Lead tiepidi" value={leadTiepidi.length} tone="amber" />
        <DashboardStat label="Lead freddi" value={leadFreddi.length} tone="sky" />
      </div>

      <div className="mt-5 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
        <p className="text-sm font-bold text-cyan-800">Top prospect prioritari</p>
        <div className="mt-3 space-y-2">
          {leadCaldi.length === 0 ? (
            <p className="text-sm text-cyan-700">Nessun prospect disponibile.</p>
          ) : (
            leadCaldi.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between rounded-xl border border-cyan-100 bg-white px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">{lead.nome}</p>
                  <p className="text-xs text-slate-500">{lead.indirizzo || 'Area non specificata'}</p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                  Alta priorità
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardEspansione({ contratti, condomini }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');

  const totaleCondomini = condomini.length;
  const coperti = new Set(attivi.map((c) => c.condominio_id)).size;
  const penetrazione = totaleCondomini ? Math.round((coperti / totaleCondomini) * 100) : 0;
  const prospect = Math.max(totaleCondomini - coperti, 0);

  const potenzialeMensile = prospect * 12 * PIANI_ABBONAMENTO.premium.costo;
  const potenzialeAnnuale = potenzialeMensile * 12;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Espansione</p>
      <h2 className="mt-1 text-xl font-bold">Espansione territoriale / prospect</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio copertura commerciale e crescita potenziale.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Condomini totali" value={totaleCondomini} tone="slate" />
        <DashboardStat label="Condomini attivi" value={coperti} tone="emerald" />
        <DashboardStat label="Penetrazione" value={penetrazione + '%'} tone="sky" />
        <DashboardStat label="Prospect" value={prospect} tone="amber" />
      </div>

      <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4">
        <p className="text-sm font-bold text-rose-800">Potenziale Premium inesplorato</p>
        <p className="mt-2 text-sm text-rose-700">MRR potenziale: {formatEuro(potenzialeMensile)}</p>
        <p className="text-sm text-rose-700">ARR potenziale: {formatEuro(potenzialeAnnuale)}</p>
      </div>
    </section>
  );
}

function DashboardRanking({ contratti, condomini }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');

  const ranking = attivi.map((contratto) => {
    const condominio = condomini.find((c) => c.id === contratto.condominio_id);
    return {
      ...contratto,
      nome: condominio?.nome || `Condominio #${contratto.condominio_id}`,
    };
  }).sort((a, b) => Number(b.ricavo_annuo || 0) - Number(a.ricavo_annuo || 0));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-700">Ranking</p>
      <h2 className="mt-1 text-xl font-bold">Top amministratori / condomini</h2>
      <p className="mt-1 text-sm text-slate-500">Classifica clienti per redditività annuale.</p>

      <div className="mt-4 space-y-3">
        {ranking.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Nessun contratto disponibile.
          </div>
        ) : (
          ranking.slice(0, 10).map((cliente, index) => (
            <div key={cliente.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-sm font-black text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{cliente.nome}</p>
                  <p className="text-xs text-slate-500">Piano: {PIANI_ABBONAMENTO[cliente.piano]?.nome}</p>
                </div>
              </div>
              <p className="font-black text-yellow-700">{formatEuro(cliente.ricavo_annuo)}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardForecast({ contratti }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');
  const mrr = attivi.reduce((sum, c) => sum + Number(c.ricavo_mensile || 0), 0);
  const arr = mrr * 12;
  const crescitaStimata = Math.round(arr * 1.25);
  const premium = attivi.filter((c) => c.piano === 'premium').length;
  const totale = attivi.length;
  const premiumRatio = totale ? Math.round((premium / totale) * 100) : 0;
  const churnStimato = Math.max(5, 100 - premiumRatio);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Forecast</p>
      <h2 className="mt-1 text-xl font-bold">Previsione crescita annuale</h2>
      <p className="mt-1 text-sm text-slate-500">Previsioni business e stabilità commerciale.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="ARR attuale" value={formatEuro(arr)} tone="emerald" />
        <DashboardStat label="ARR stimato +25%" value={formatEuro(crescitaStimata)} tone="sky" />
        <DashboardStat label="Premium ratio" value={premiumRatio + '%'} tone="amber" />
        <DashboardStat label="Churn rischio" value={churnStimato + '%'} tone="red" />
      </div>

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm font-bold text-indigo-800">Indicatore strategico</p>
        <p className="mt-2 text-sm text-indigo-700">
          Con il mantenimento dell'attuale conversione e una crescita commerciale moderata, il business può raggiungere un incremento stimato del 25% annuo.
        </p>
      </div>
    </section>
  );
}

function GestioneLeadAmministratori({ onCreateLead }) {
  const [form, setForm] = useState({
    nome_studio: '',
    referente: '',
    telefono: '',
    email: '',
    provincia: 'Firenze',
    numero_condomini: '',
    origine: 'LinkedIn',
    stato_pipeline: 'prospect',
    note: '',
  });

  const numeroCondomini = Number(form.numero_condomini || 0);
  const valorePotenziale = numeroCondomini * 12 * PIANI_ABBONAMENTO.premium.costo * 12;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome_studio.trim()) return;

    await onCreateLead({
      ...form,
      numero_condomini: numeroCondomini,
      valore_potenziale: valorePotenziale,
    });

    setForm({
      nome_studio: '',
      referente: '',
      telefono: '',
      email: '',
      provincia: 'Firenze',
      numero_condomini: '',
      origine: 'LinkedIn',
      stato_pipeline: 'prospect',
      note: '',
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">CRM Lead</p>
      <h2 className="mt-1 text-xl font-bold">Nuovo lead amministratore</h2>
      <p className="mt-1 text-sm text-slate-500">Inserisci uno studio amministrativo prospect e calcola il potenziale annuo.</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={form.nome_studio} onChange={(e) => update('nome_studio', e.target.value)} placeholder="Nome studio / amministratore" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input value={form.referente} onChange={(e) => update('referente', e.target.value)} placeholder="Referente" className="rounded-2xl border border-slate-200 px-3 py-3" />
          <input value={form.telefono} onChange={(e) => update('telefono', e.target.value)} placeholder="Telefono" className="rounded-2xl border border-slate-200 px-3 py-3" />
        </div>
        <input value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Email" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={form.provincia} onChange={(e) => update('provincia', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
            {['Firenze', 'Prato', 'Pistoia', 'Lucca', 'Pisa', 'Livorno', 'Arezzo', 'Siena', 'Massa-Carrara', 'Grosseto'].map((p) => <option key={p}>{p}</option>)}
          </select>
          <input type="number" min="0" value={form.numero_condomini} onChange={(e) => update('numero_condomini', e.target.value)} placeholder="Condomini gestiti" className="rounded-2xl border border-slate-200 px-3 py-3" />
          <select value={form.origine} onChange={(e) => update('origine', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
            <option>LinkedIn</option><option>Sito</option><option>Referral</option><option>Telefono</option><option>Email</option><option>Evento</option>
          </select>
        </div>
        <textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Note commerciali" className="min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-3" />
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
          <p className="text-sm font-bold text-cyan-800">Potenziale stimato Premium</p>
          <p className="mt-1 text-2xl font-black text-cyan-700">{formatEuro(valorePotenziale)}</p>
        </div>
        <button type="submit" className="w-full rounded-2xl bg-cyan-700 px-4 py-3 font-bold text-white">Salva lead</button>
      </form>
    </section>
  );
}

function DashboardLeadAmministratori({ leadAmministratori }) {
  const totale = leadAmministratori.length;
  const clienti = leadAmministratori.filter((l) => l.stato_pipeline === 'cliente').length;
  const trattative = leadAmministratori.filter((l) => ['trattativa', 'preventivo_inviato'].includes(l.stato_pipeline)).length;
  const valorePipeline = leadAmministratori.reduce((sum, l) => sum + Number(l.valore_potenziale || 0), 0);
  const followupOggi = leadAmministratori.filter((l) => l.prossimo_followup && new Date(l.prossimo_followup) <= new Date()).length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Lead Amministratori</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard pipeline commerciale</h2>
      <p className="mt-1 text-sm text-slate-500">Controllo prospect, trattative e valore potenziale Toscana.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Lead totali" value={totale} tone="slate" />
        <DashboardStat label="Trattative" value={trattative} tone="amber" />
        <DashboardStat label="Clienti" value={clienti} tone="emerald" />
        <DashboardStat label="Follow-up" value={followupOggi} tone="red" />
        <DashboardStat label="Valore pipeline" value={formatEuro(valorePipeline)} tone="sky" />
      </div>
      <div className="mt-5 space-y-2">
        {leadAmministratori.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Nessun lead inserito.</p>
        ) : (
          leadAmministratori.slice(0, 6).map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="font-bold text-slate-900">{lead.nome_studio}</p>
                <p className="text-xs text-slate-500">{lead.provincia} • {lead.stato_pipeline} • {lead.numero_condomini || 0} condomini</p>
              </div>
              <p className="font-black text-cyan-700">{formatEuro(lead.valore_potenziale || 0)}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardCRM({ contratti, condomini }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');

  const clientiTop = attivi.map((contratto) => {
    const condominio = condomini.find((c) => c.id === contratto.condominio_id);
    return {
      ...contratto,
      nome: condominio?.nome || `Condominio #${contratto.condominio_id}`,
    };
  }).sort((a, b) => Number(b.ricavo_annuo || 0) - Number(a.ricavo_annuo || 0)).slice(0, 5);

  const baseDaConvertire = attivi.filter((c) => c.piano === 'base').length;
  const plusDaConvertire = attivi.filter((c) => c.piano === 'plus').length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-fuchsia-700">CRM</p>
      <h2 className="mt-1 text-xl font-bold">CRM amministratori / clienti</h2>
      <p className="mt-1 text-sm text-slate-500">Controllo clienti top e potenziale upgrade commerciale.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Base da convertire" value={baseDaConvertire} tone="amber" />
        <DashboardStat label="Plus da convertire" value={plusDaConvertire} tone="sky" />
        <DashboardStat label="Clienti top" value={clientiTop.length} tone="emerald" />
        <DashboardStat label="Premium attivi" value={attivi.filter((c) => c.piano === 'premium').length} tone="slate" />
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-700">Top clienti per valore annuale</p>
        <div className="mt-3 space-y-2">
          {clientiTop.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun contratto disponibile.</p>
          ) : (
            clientiTop.map((cliente) => (
              <div key={cliente.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                <div>
                  <p className="font-semibold text-slate-900">{cliente.nome}</p>
                  <p className="text-xs text-slate-500">Piano: {PIANI_ABBONAMENTO[cliente.piano]?.nome}</p>
                </div>
                <p className="font-bold text-fuchsia-700">{formatEuro(cliente.ricavo_annuo)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardPagamenti({ contratti }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');
  const totaleIncassato = attivi.reduce((sum, c) => sum + Number(c.ricavo_annuo || 0), 0);
  const mensile = attivi.reduce((sum, c) => sum + Number(c.ricavo_mensile || 0), 0);
  const scaduti = contratti.filter((c) => c.stato === 'scaduto').length;
  const sospesi = contratti.filter((c) => c.stato === 'sospeso').length;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Pagamenti</p>
      <h2 className="mt-1 text-xl font-bold">Storico economico contratti</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio stato economico complessivo.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Incasso annuale attivo" value={formatEuro(totaleIncassato)} tone="emerald" />
        <DashboardStat label="Incasso mensile" value={formatEuro(mensile)} tone="sky" />
        <DashboardStat label="Contratti scaduti" value={scaduti} tone="amber" />
        <DashboardStat label="Contratti sospesi" value={sospesi} tone="red" />
      </div>
    </section>
  );
}

function DashboardAbbonamenti({ contratti }) {
  const attivi = contratti.filter((c) => c.stato === 'attivo');
  const base = attivi.filter((c) => c.piano === 'base');
  const plus = attivi.filter((c) => c.piano === 'plus');
  const premium = attivi.filter((c) => c.piano === 'premium');

  const totaleFamiglie = attivi.reduce((sum, c) => sum + Number(c.famiglie || 0), 0);
  const mrr = attivi.reduce((sum, c) => sum + Number(c.ricavo_mensile || 0), 0);
  const arr = mrr * 12;
  const premiumRatio = attivi.length ? Math.round((premium.length / attivi.length) * 100) : 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Business</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard abbonamenti</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio business ricorrente e crescita annuale.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Condomini attivi" value={attivi.length} tone="sky" />
        <DashboardStat label="Famiglie attive" value={totaleFamiglie} tone="emerald" />
        <DashboardStat label="MRR" value={formatEuro(mrr)} tone="amber" />
        <DashboardStat label="ARR" value={formatEuro(arr)} tone="slate" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <DashboardStat label="Base" value={base.length} />
        <DashboardStat label="Plus" value={plus.length} tone="amber" />
        <DashboardStat label="Premium" value={premium.length} tone="emerald" />
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-sm font-bold text-emerald-800">Premium ratio</p>
        <p className="mt-2 text-3xl font-black text-emerald-700">{premiumRatio}%</p>
        <p className="text-xs text-emerald-700">Percentuale condomini premium sul totale attivo</p>
      </div>
    </section>
  );
}

function DashboardAssemblea({ segnalazioni, votiPreventivi }) {
  const praticheCondivise = segnalazioni.filter((s) => s.preventivo_condiviso_condomini);

  const dati = praticheCondivise.map((pratica) => {
    const voti = (votiPreventivi || []).filter((v) => v.segnalazione_id === pratica.id);
    const favorevoli = voti.filter((v) => v.voto === 'favorevole').length;
    const contrari = voti.filter((v) => v.voto === 'contrario').length;
    const indecisi = voti.filter((v) => v.voto === 'indeciso').length;
    const totale = voti.length;
    const quorum = totale > 0 ? Math.round((favorevoli / totale) * 100) : 0;

    return {
      id: pratica.id,
      titolo: pratica.titolo,
      condominio: pratica.condominio,
      favorevoli,
      contrari,
      indecisi,
      totale,
      quorum,
    };
  }).sort((a, b) => b.quorum - a.quorum);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700">Assemblea</p>
      <h2 className="mt-1 text-xl font-bold">Quorum digitale preventivi</h2>
      <p className="mt-1 text-sm text-slate-500">Monitoraggio consenso condomini pre-assemblea.</p>

      <div className="mt-4 space-y-3">
        {dati.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Nessun preventivo condiviso disponibile.
          </div>
        ) : (
          dati.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-bold text-slate-900">{item.titolo}</p>
                  <p className="text-sm text-slate-500">{item.condominio}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">Fav: {item.favorevoli}</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 font-bold text-red-700">Con: {item.contrari}</span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-bold text-amber-700">Ind: {item.indecisi}</span>
                  <span className="rounded-full bg-sky-100 px-3 py-1 font-bold text-sky-700">Quorum: {item.quorum}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function DashboardEconomica({ segnalazioni, condomini }) {
  const totaleStorico = segnalazioni.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const accettate = segnalazioni.filter((s) => s.stato_conversione === 'accettato');
  const fatturatoAccettato = accettate.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const ticketMedio = accettate.length ? Math.round(fatturatoAccettato / accettate.length) : 0;
  const perCondominio = condomini.map((c) => {
    const pratiche = segnalazioni.filter((s) => s.condominio_id === c.id);
    const valore = pratiche.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
    return { nome: c.nome, valore, pratiche: pratiche.length };
  }).sort((a, b) => b.valore - a.valore).slice(0, 5);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Economica</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard economica premium</h2>
      <p className="mt-1 text-sm text-slate-500">Analisi fatturato, ticket medio e condomini a maggior valore.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Valore totale" value={formatEuro(totaleStorico)} tone="sky" />
        <DashboardStat label="Fatturato accettato" value={formatEuro(fatturatoAccettato)} tone="emerald" />
        <DashboardStat label="Ticket medio" value={formatEuro(ticketMedio)} tone="amber" />
        <DashboardStat label="Pratiche accettate" value={accettate.length} />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-700">Top condomini per valore</p>
        <div className="mt-3 space-y-2">
          {perCondominio.length === 0 ? (
            <p className="text-sm text-slate-500">Nessun dato disponibile.</p>
          ) : (
            perCondominio.map((item) => (
              <div key={item.nome} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-800">{item.nome}</p>
                  <p className="text-xs text-slate-500">{item.pratiche} pratiche</p>
                </div>
                <p className="font-bold text-sky-700">{formatEuro(item.valore)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardVendite({ segnalazioni }) {
  const preventivi = segnalazioni.filter((s) => Number(s.importo_preventivo || 0) > 0);
  const deliberati = segnalazioni.filter((s) => s.stato_conversione === 'accettato');

  const totalePreventivi = preventivi.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const totaleDeliberato = deliberati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const daDeliberare = Math.max(totalePreventivi - totaleDeliberato, 0);
  const provvigione = totaleDeliberato * 0.08;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Vendite</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard vendite amministratore</h2>
      <p className="mt-1 text-sm text-slate-500">Totale preventivi, deliberato, da deliberare e provvigione stimata all’8%.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Totale preventivi" value={formatEuro(totalePreventivi)} />
        <DashboardStat label="Totale deliberato" value={formatEuro(totaleDeliberato)} tone="emerald" />
        <DashboardStat label="Da deliberare" value={formatEuro(daDeliberare)} tone="amber" />
        <DashboardStat label="Provvigione 8%" value={formatEuro(provvigione)} tone="sky" />
      </div>
    </section>
  );
}

function DashboardStorico({ segnalazioni }) {
  const archiviate = segnalazioni.filter((s) => s.archiviata === true);
  const chiuse = archiviate.filter((s) => s.stato === 'Chiusa').length;
  const rifiutate = archiviate.filter((s) => s.stato === 'Rifiutata').length;
  const valoreStorico = archiviate.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);

  const perAnno = archiviate.reduce((acc, s) => {
    const data = s.data_archiviazione || s.created_at;
    const anno = data ? new Date(data).getFullYear() : 'n.d.';
    acc[anno] = (acc[anno] || 0) + 1;
    return acc;
  }, {});

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Archivio</p>
      <h2 className="mt-1 text-xl font-bold">Storico pratiche archiviate</h2>
      <p className="mt-1 text-sm text-slate-500">Riepilogo delle pratiche archiviate e del valore storico gestito.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Archiviate" value={archiviate.length} />
        <DashboardStat label="Chiuse" value={chiuse} tone="emerald" />
        <DashboardStat label="Rifiutate" value={rifiutate} tone="red" />
        <DashboardStat label="Valore storico" value={formatEuro(valoreStorico)} tone="sky" />
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-700">Distribuzione per anno</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(perAnno).length === 0 ? (
            <span className="text-sm text-slate-500">Nessuna pratica archiviata.</span>
          ) : (
            Object.entries(perAnno).map(([anno, totale]) => (
              <span key={anno} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-200">
                {anno}: {totale}
              </span>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardOperativa({ ruolo, segnalazioni, condomini, onOpen }) {
  const totale = segnalazioni.length;
  const urgenti = segnalazioni.filter((s) => s.priorita === 'Alta').length;
  const prese = segnalazioni.filter((s) => s.stato === 'Presa in carico').length;
  const lavorazione = segnalazioni.filter((s) => s.stato === 'Sopralluogo effettuato' || s.stato === 'Preventivata' || s.stato === 'Accettata' || s.stato === 'Pianificata').length;
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

function ActionBar({ condomini, filtroCondominioId, onChangeFiltroCondominio, searchTerm, onChangeSearchTerm, onRefresh, loading, ruolo, showArchiviate, onToggleArchiviate }) {
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
        {ruolo === 'gestore' && (
          <button
            type="button"
            onClick={onToggleArchiviate}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700"
          >
            {showArchiviate ? 'Mostra pratiche attive' : 'Mostra archivio pratiche'}
          </button>
        )}
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

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote, onUploadFile, onUpdateImporto, ruolo, onConversionePreventivo, onPianificaLavori, onGeneraReport, onGeneraPdfVotazioni, onCondividiCondomini, onVotoCondomino, onInviaReminderVoto, onDeletePratica, onRipristinaPratica, votiPreventivi }) {
  const [nota, setNota] = useState('');
  const [file, setFile] = useState(null);
  const [importo, setImporto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dataInizioPresunta, setDataInizioPresunta] = useState('');

  if (!segnalazione) return null;

  const votiPratica = (votiPreventivi || []).filter((v) => v.segnalazione_id === segnalazione.id);
  const votiFavorevoli = votiPratica.filter((v) => v.voto === 'favorevole').length;
  const votiContrari = votiPratica.filter((v) => v.voto === 'contrario').length;
  const votiIndecisi = votiPratica.filter((v) => v.voto === 'indeciso').length;
  const totaleVoti = votiPratica.length;
  const consensoPercentuale = totaleVoti ? Math.round((votiFavorevoli / totaleVoti) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-2 md:p-4">
      <div className="flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl md:h-[90vh] md:rounded-3xl">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl md:p-5">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          <div>
            <h3 className="break-words text-lg font-bold leading-tight md:text-xl">{segnalazione.titolo}</h3>
            <p className="mt-1 text-sm text-slate-500">{segnalazione.condominio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ruolo === 'gestore' && !segnalazione.archiviata && (
              <button
                onClick={() => onDeletePratica(segnalazione)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Archivia pratica
              </button>
            )}
            {ruolo === 'gestore' && segnalazione.archiviata && (
              <button
                onClick={() => onRipristinaPratica(segnalazione)}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white"
              >
                Ripristina pratica
              </button>
            )}
            <button
              onClick={() => onGeneraReport(segnalazione)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
            >
              Genera report
            </button>
            {segnalazione.preventivo_condiviso_condomini && (
              <button
                onClick={() => onGeneraPdfVotazioni(segnalazione)}
                className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white"
              >
                Export PDF votazioni
              </button>
            )}
            <button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Chiudi</button>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 md:grid-cols-2 md:p-5">
          <div className="space-y-3">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            <p><span className="text-slate-500">Importo preventivo:</span> {formatEuro(segnalazione.importo_preventivo || 0)}</p>
            {segnalazione.data_inizio_lavori_presunta && (
              <p><span className="text-slate-500">Inizio lavori presunto:</span> {new Date(segnalazione.data_inizio_lavori_presunta).toLocaleDateString('it-IT')}</p>
            )}
            {segnalazione.allegatoUrl && <img src={segnalazione.allegatoUrl} alt="Allegato" className="w-full rounded-xl border border-slate-200" />}
            {segnalazione.fotosopralluogourl && <img src={segnalazione.fotosopralluogourl} alt="Sopralluogo" className="w-full rounded-xl border border-purple-200" />}
            {segnalazione.preventivourl && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <a href={segnalazione.preventivourl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-bold text-emerald-700 underline">
                  Apri preventivo
                </a>

                {(ruolo === 'condominio' || ruolo === 'amministratore' || ruolo === 'gestore') && segnalazione.preventivo_condiviso_condomini && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-800">
                        Preventivo condiviso dall’amministratore
                      </p>
                      <p className="mt-1 text-xs text-sky-700">
                        Documento disponibile per consultazione diretta.
                      </p>
                    </div>

                    {ruolo === 'condominio' && (
                      <div className="space-y-2 border-t border-sky-200 pt-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-800">
                          Voto consultivo condomino
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onVotoCondomino(segnalazione.id, 'favorevole')}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Favorevole
                          </button>
                          <button
                            type="button"
                            onClick={() => onVotoCondomino(segnalazione.id, 'contrario')}
                            className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white"
                          >
                            Contrario
                          </button>
                          <button
                            type="button"
                            onClick={() => onVotoCondomino(segnalazione.id, 'indeciso')}
                            className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white"
                          >
                            Indeciso
                          </button>
                        </div>
                        {segnalazione.voto_condomino && (
                          <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-sky-800 border border-sky-100">
                            Il tuo voto: {segnalazione.voto_condomino}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {ruolo === 'amministratore' && segnalazione.stato === 'Preventivata' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onConversionePreventivo(segnalazione.id, 'accettato');
                      }}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
                    >
                      Accetta preventivo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onConversionePreventivo(segnalazione.id, 'rifiutato');
                      }}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Rifiuta preventivo
                    </button>
                  </div>
                )}

                {segnalazione.stato_conversione && (
                  <p className="text-sm font-semibold text-slate-700">
                    Stato preventivo: {segnalazione.stato_conversione}
                  </p>
                )}

                {ruolo === 'amministratore' && segnalazione.stato === 'Preventivata' && !segnalazione.preventivo_condiviso_condomini && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCondividiCondomini(segnalazione);
                    }}
                    className="w-full rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
                  >
                    Condividi con i condomini
                  </button>
                )}

                {segnalazione.preventivo_condiviso_condomini && ruolo === 'amministratore' && (
                  <div className="rounded-xl bg-sky-100 px-3 py-3 text-sm font-semibold text-sky-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p>Preventivo condiviso con i condomini</p>
                      <button
                        type="button"
                        onClick={() => onInviaReminderVoto(segnalazione)}
                        className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-bold text-white hover:bg-sky-800"
                      >
                        Invia reminder non votanti
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Favorevoli</p>
                        <p className="text-lg font-black text-emerald-700">{votiFavorevoli}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Contrari</p>
                        <p className="text-lg font-black text-red-600">{votiContrari}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Indecisi</p>
                        <p className="text-lg font-black text-amber-600">{votiIndecisi}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Consenso</p>
                        <p className="text-lg font-black text-sky-700">{consensoPercentuale}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ruolo === 'gestore' && STATI_PRATICA.map((stato) => (
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

            {ruolo === 'gestore' && segnalazione.stato_conversione === 'accettato' && segnalazione.stato !== 'Pianificata' && (
              <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="font-semibold text-sky-800">Pianificazione lavori</p>
                <p className="text-sm text-sky-700">Inserisci la data presunta di inizio lavori e comunica la pianificazione all’amministratore.</p>
                <input
                  type="date"
                  value={dataInizioPresunta}
                  onChange={(e) => setDataInizioPresunta(e.target.value)}
                  className="w-full rounded-xl border border-sky-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={!dataInizioPresunta}
                  onClick={() => onPianificaLavori(segnalazione.id, dataInizioPresunta)}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Pianifica lavori
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
  const generaPdfVotazioni = (pratica) => {
    if (!pratica) return;

    const votiPratica = (votiPreventivi || []).filter((v) => v.segnalazione_id === pratica.id);
    const favorevoli = votiPratica.filter((v) => v.voto === 'favorevole').length;
    const contrari = votiPratica.filter((v) => v.voto === 'contrario').length;
    const indecisi = votiPratica.filter((v) => v.voto === 'indeciso').length;
    const totale = votiPratica.length;
    const quorum = totale ? Math.round((favorevoli / totale) * 100) : 0;

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const dettaglioVoti = votiPratica.length
      ? votiPratica.map((v) => `<tr><td style="padding:8px;border:1px solid #ccc;">${v.email}</td><td style="padding:8px;border:1px solid #ccc;">${v.voto}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:12px;border:1px solid #ccc;">Nessun voto registrato</td></tr>';

    reportWindow.document.write(`
      <html>
        <head>
          <title>Report votazioni - ${pratica.titolo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; background:#f8fafc; color:#0f172a; }
            .page { max-width: 900px; margin:auto; background:white; padding:35px; border-radius:20px; }
            .toolbar { display:flex; justify-content:flex-end; gap:10px; margin-bottom:20px; }
            .btn { background:#047857; color:white; border:none; padding:10px 16px; border-radius:10px; font-weight:bold; cursor:pointer; }
            table { width:100%; border-collapse:collapse; margin-top:20px; }
            th, td { text-align:left; }
            th { background:#ecfdf5; }
            @media print { .toolbar { display:none; } body { background:white; padding:0; } }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button class="btn" onclick="window.print()">Scarica PDF / Stampa</button>
          </div>
          <div class="page">
            <h1>Condominio Senza Pensieri</h1>
            <h2>Report votazioni condomini</h2>
            <p><strong>Condominio:</strong> ${pratica.condominio}</p>
            <p><strong>Pratica:</strong> ${pratica.titolo}</p>
            <p><strong>Importo preventivo:</strong> ${formatEuro(pratica.importo_preventivo || 0)}</p>
            <hr/>
            <h3>Riepilogo votazioni</h3>
            <p>Favorevoli: <strong>${favorevoli}</strong></p>
            <p>Contrari: <strong>${contrari}</strong></p>
            <p>Indecisi: <strong>${indecisi}</strong></p>
            <p>Quorum favorevole: <strong>${quorum}%</strong></p>
            <h3>Dettaglio voti</h3>
            <table>
              <thead>
                <tr>
                  <th style="padding:8px;border:1px solid #ccc;">Condomino</th>
                  <th style="padding:8px;border:1px solid #ccc;">Voto</th>
                </tr>
              </thead>
              <tbody>
                ${dettaglioVoti}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `);

    reportWindow.document.close();
  };

  const generaReportPratica = (pratica) => {
    if (!pratica) return;

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Impossibile aprire il report. Verifica che il browser non blocchi i popup.');
      return;
    }

    const noteHtml = (pratica.note || []).length
      ? pratica.note.map((n) => `<div style="margin-bottom:12px;padding:10px;border:1px solid #d1d5db;border-radius:10px;"><strong>${n.data}</strong><br/>${n.testo}</div>`).join('')
      : '<p>Nessuna nota presente.</p>';

    reportWindow.document.write(`
      <html>
        <head>
          <title>Report pratica - ${pratica.titolo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; color: #0f172a; background: #f8fafc; }
            h1, h2 { color: #047857; }
            .page { max-width: 900px; margin: 0 auto; background: white; padding: 34px; border-radius: 22px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); }
            .toolbar { position: sticky; top: 0; z-index: 10; display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 18px; }
            .btn { border: 0; background: #047857; color: white; font-weight: 700; padding: 11px 16px; border-radius: 12px; cursor: pointer; }
            .btn.secondary { background: #0f172a; }
            .section { margin-bottom: 30px; }
            .box { border: 1px solid #d1d5db; padding: 16px; border-radius: 14px; margin-top: 10px; }
            img { max-width: 100%; border-radius: 12px; margin-top: 10px; }
            a { color: #047857; font-weight: bold; }
            @media print {
              body { background: white; padding: 0; }
              .toolbar { display: none; }
              .page { box-shadow: none; border-radius: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button class="btn" onclick="window.print()">Scarica PDF / Stampa</button>
            <button class="btn secondary" onclick="window.close()">Chiudi</button>
          </div>
          <div class="page">
          <h1>Condominio Senza Pensieri</h1>
          <h2>Report pratica</h2>

          <div class="section box">
            <p><strong>Condominio:</strong> ${pratica.condominio}</p>
            <p><strong>Titolo:</strong> ${pratica.titolo}</p>
            <p><strong>Descrizione:</strong> ${pratica.descrizione}</p>
            <p><strong>Categoria:</strong> ${pratica.categoria || 'n.d.'}</p>
            <p><strong>Stato:</strong> ${pratica.stato}</p>
            <p><strong>Priorità:</strong> ${pratica.priorita}</p>
            <p><strong>Luogo:</strong> ${pratica.luogo || 'n.d.'}</p>
            <p><strong>Referente:</strong> ${pratica.referente || 'n.d.'}</p>
            <p><strong>Telefono:</strong> ${pratica.telefono || 'n.d.'}</p>
            <p><strong>Preventivo:</strong> ${formatEuro(pratica.importo_preventivo || 0)}</p>
            ${pratica.data_inizio_lavori_presunta ? `<p><strong>Data presunta inizio lavori:</strong> ${new Date(pratica.data_inizio_lavori_presunta).toLocaleDateString('it-IT')}</p>` : ''}
          </div>

          ${pratica.allegatoUrl ? `<div class="section"><h2>Foto segnalazione</h2><img src="${pratica.allegatoUrl}" /></div>` : ''}
          ${pratica.fotosopralluogourl ? `<div class="section"><h2>Foto sopralluogo</h2><img src="${pratica.fotosopralluogourl}" /></div>` : ''}
          ${pratica.preventivourl ? `<div class="section"><h2>Preventivo</h2><p><a href="${pratica.preventivourl}" target="_blank">Apri documento preventivo</a></p></div>` : ''}

          <div class="section">
            <h2>Cronologia note</h2>
            ${noteHtml}
          </div>
          </div>
        </body>
      </html>
    `);

    reportWindow.document.close();
    reportWindow.focus();
  };
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
  const [showFabLabel, setShowFabLabel] = useState(false);
  const [votiPreventivi, setVotiPreventivi] = useState([]);
  const [showArchiviate, setShowArchiviate] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [leadAmministratori, setLeadAmministratori] = useState([]);

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
      const passaArchivio = showArchiviate ? s.archiviata === true : s.archiviata !== true;
      const passaCondominio = filtroCondominioId ? String(s.condominio_id) === String(filtroCondominioId) : true;
      const passaRicerca = !testo || [s.titolo, s.descrizione, s.condominio, s.categoria, s.luogo, s.referente].filter(Boolean).some((v) => String(v).toLowerCase().includes(testo));
      return passaCondominio && passaRicerca && passaArchivio;
    });
  }, [segnalazioniFiltrate, filtroCondominioId, searchTerm]);

  const hasPreventiviBanner = segnalazioni.some((s) => s.stato_invio === 'inviato' && !s.stato_conversione);

  const normalizzaSegnalazioni = (data) => (data || []).map((item) => {
    const statoDb = item.stato || '';
    const statoCalcolato = statoDb === 'Chiusa'
      ? 'Chiusa'
      : statoDb === 'Pianificata' || item.data_inizio_lavori_presunta
        ? 'Pianificata'
        : statoDb === 'Rifiutata' || item.stato_conversione === 'rifiutato'
          ? 'Rifiutata'
          : statoDb === 'Accettata' || item.stato_conversione === 'accettato'
            ? 'Accettata'
            : statoDb;

    return {
    ...item,
    stato: statoCalcolato,
    condominio: item.condomini?.nome || item.condominio || '',
    allegatoUrl: item.allegatonome ? buildPublicUrl(item.allegatonome) : '',
    fotosopralluogourl: item.fotosopralluogonome ? buildPublicUrl(item.fotosopralluogonome) : '',
    preventivourl: item.preventivonome ? buildPublicUrl(item.preventivonome) : '',
    note: Array.isArray(item.note) ? item.note : [],
  };
  });

  const carica = async () => {
    setLoading(true);
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

      const { data: votiData, error: votiError } = await supabase
        .from('preventivo_voti')
        .select('*');

      if (votiError && votiError.code !== 'PGRST116') throw votiError;
      setVotiPreventivi(votiData || []);

      const { data: contrattiData, error: contrattiError } = await supabase
        .from('contratti_condominio')
        .select('*');

      if (contrattiError && contrattiError.code !== 'PGRST116') throw contrattiError;
      setContratti(contrattiData || []);

      const { data: leadData, error: leadError } = await supabase
        .from('lead_amministratori')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadError && leadError.code !== 'PGRST116') throw leadError;
      setLeadAmministratori(leadData || []);
    } catch (error) {
      console.error(error);
      setStatusMessage('Errore caricamento: ' + (error.message || 'sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setShowFabLabel(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setShowFabLabel(false), 900);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    carica();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => carica());
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
      authListener?.subscription?.unsubscribe();
    };
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
    try {
      const updatePayload = {
        stato: nuovoStato,
        ...(nuovoStato === 'Chiusa' || nuovoStato === 'Pianificata' ? { stato_conversione: 'accettato' } : {}),
      };

      const { data, error } = await supabase
        .from('segnalazioni')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error('Aggiornamento stato non applicato.');

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === id ? { ...item, ...updatePayload, stato: nuovoStato } : item
      )));

      setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, ...updatePayload, stato: nuovoStato } : prev);
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento stato: ' + (error.message || 'sconosciuto'));
    }
  };

  const uploadFilePratica = async (id, file, columnName, prefix) => {
    if (!file) return;
    const safeName = file.name.split(' ').join('-');
    const fileName = prefix + '-' + id + '-' + Date.now() + '-' + safeName;
    const { error: uploadError } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: false });
    if (uploadError) throw uploadError;

    const updatePayload = {
      [columnName]: fileName,
      ...(columnName === 'preventivonome'
        ? {
            stato: 'Preventivata',
            stato_invio: 'inviato',
          }
        : {}),
    };

    const { error: updateError } = await supabase.from('segnalazioni').update(updatePayload).eq('id', id);
    if (updateError) throw updateError;
    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? {
      ...prev,
      ...updatePayload,
      [columnName]: fileName,
      fotosopralluogourl: columnName === 'fotosopralluogonome' ? buildPublicUrl(fileName) : prev.fotosopralluogourl,
      preventivourl: columnName === 'preventivonome' ? buildPublicUrl(fileName) : prev.preventivourl,
    } : prev);
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

  const condividiPreventivoCondomini = async (pratica) => {
    try {
      if (!pratica?.id) return;
      const conferma = window.confirm('Vuoi condividere questo preventivo con i condomini del condominio?');
      if (!conferma) return;

      const { data, error } = await supabase.functions.invoke('share-preventivo-condomini', {
        body: {
          id: pratica.id,
          titolo: pratica.titolo,
          condominio_id: pratica.condominio_id,
          importo_preventivo: pratica.importo_preventivo,
          preventivonome: pratica.preventivonome,
        },
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Condivisione non riuscita.');

      const updatePayload = {
        preventivo_condiviso_condomini: true,
        data_condivisione_preventivo: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('segnalazioni')
        .update(updatePayload)
        .eq('id', pratica.id);

      if (updateError) throw updateError;

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === pratica.id ? { ...item, ...updatePayload } : item
      )));

      setDettaglioAperto((prev) => prev && prev.id === pratica.id ? { ...prev, ...updatePayload } : prev);
      setStatusMessage('Preventivo condiviso con i condomini.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore condivisione preventivo: ' + (error.message || 'sconosciuto'));
    }
  };

  const inviaReminderVoto = async (pratica) => {
    try {
      if (!pratica?.id) return;
      const conferma = window.confirm('Vuoi inviare un reminder ai condomini che non hanno ancora votato?');
      if (!conferma) return;

      const { data, error } = await supabase.functions.invoke('reminder-voto-condomini', {
        body: {
          id: pratica.id,
          titolo: pratica.titolo,
          condominio_id: pratica.condominio_id,
          importo_preventivo: pratica.importo_preventivo,
        },
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Reminder non riuscito.');

      setStatusMessage(`Reminder inviato a ${data?.emails?.length || 0} condomini non votanti.`);
    } catch (error) {
      console.error(error);
      alert('Errore invio reminder: ' + (error.message || 'sconosciuto'));
    }
  };

  const aggiornaVotoCondomino = async (id, voto) => {
    try {
      if (!utente?.email) throw new Error('Utente non identificato');

      const votoPayload = {
        segnalazione_id: id,
        email: utente.email.toLowerCase().trim(),
        voto,
      };

      const { error } = await supabase
        .from('preventivo_voti')
        .upsert(votoPayload, { onConflict: 'segnalazione_id,email' });

      if (error) throw error;

      setStatusMessage('Voto consultivo registrato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore registrazione voto: ' + (error.message || 'sconosciuto'));
    }
  };

  const pianificaLavori = async (id, dataPresunta) => {
    try {
      const updatePayload = {
        stato: 'Pianificata',
        stato_conversione: 'accettato',
        data_inizio_lavori_presunta: dataPresunta,
      };

      const { data, error } = await supabase
        .from('segnalazioni')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Pianificazione non applicata.');

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === id ? { ...item, ...updatePayload } : item
      )));

      setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, ...updatePayload } : prev);
      setStatusMessage('Lavori pianificati: amministratore avvisato.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore pianificazione lavori: ' + (error.message || 'sconosciuto'));
    }
  };

  const aggiornaConversionePreventivo = async (id, stato_conversione) => {
    try {
      const statoVisuale = stato_conversione === 'rifiutato'
        ? 'Rifiutata'
        : stato_conversione === 'accettato'
          ? 'Accettata'
          : 'Preventivata';

      const { error } = await supabase
        .from('segnalazioni')
        .update({ stato_conversione, stato: statoVisuale })
        .eq('id', id);

      if (error) throw error;

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === id ? { ...item, stato_conversione, stato: statoVisuale } : item
      )));

      setDettaglioAperto((prev) => prev && prev.id === id ? {
        ...prev,
        stato_conversione,
        stato: statoVisuale,
      } : prev);

      setStatusMessage(
        stato_conversione === 'rifiutato'
          ? 'Preventivo rifiutato: pratica aggiornata.'
          : 'Preventivo accettato con successo.'
      );

      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento preventivo: ' + (error.message || 'sconosciuto'));
    }
  };

  const eliminaPratica = async (pratica) => {
    try {
      if (!pratica?.id) return;
      const conferma = window.confirm('Vuoi archiviare questa pratica? Potrai consultarla nello storico.');
      if (!conferma) return;

      const { error } = await supabase
        .from('segnalazioni')
        .update({
          archiviata: true,
          data_archiviazione: new Date().toISOString(),
        })
        .eq('id', pratica.id);

      if (error) throw error;

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === pratica.id
          ? {
              ...item,
              archiviata: true,
              data_archiviazione: new Date().toISOString(),
            }
          : item
      )));

      setDettaglioAperto(null);
      setStatusMessage('Pratica archiviata con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore archiviazione pratica: ' + (error.message || 'sconosciuto'));
    }
  };

  const ripristinaPratica = async (pratica) => {
    try {
      if (!pratica?.id) return;
      const conferma = window.confirm('Vuoi ripristinare questa pratica tra quelle attive?');
      if (!conferma) return;

      const updatePayload = {
        archiviata: false,
        data_archiviazione: null,
      };

      const { error } = await supabase
        .from('segnalazioni')
        .update(updatePayload)
        .eq('id', pratica.id);

      if (error) throw error;

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === pratica.id ? { ...item, ...updatePayload } : item
      )));

      setDettaglioAperto(null);
      setStatusMessage('Pratica ripristinata tra le pratiche attive.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore ripristino pratica: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaLeadAmministratore = async (lead) => {
    try {
      const { error } = await supabase.from('lead_amministratori').insert({
        ...lead,
        stato_pipeline: lead.stato_pipeline || 'prospect',
      });

      if (error) throw error;
      setStatusMessage('Lead amministratore salvato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione lead: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaContratto = async (contratto) => {
    try {
      const { error } = await supabase.from('contratti_condominio').insert({
        ...contratto,
        stato: 'attivo',
        data_attivazione: new Date().toISOString(),
      });

      if (error) throw error;

      setStatusMessage('Contratto attivato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione contratto: ' + (error.message || 'sconosciuto'));
    }
  };

  const rinnovaContratto = async (contratto) => {
    try {
      const nuovaScadenza = new Date();
      nuovaScadenza.setFullYear(nuovaScadenza.getFullYear() + 1);

      const { error } = await supabase
        .from('contratti_condominio')
        .update({
          data_scadenza: nuovaScadenza.toISOString(),
          stato: 'attivo',
        })
        .eq('id', contratto.id);

      if (error) throw error;
      setStatusMessage('Contratto rinnovato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore rinnovo contratto: ' + (error.message || 'sconosciuto'));
    }
  };

  const upgradeContratto = async (contratto) => {
    try {
      const pianoPremium = PIANI_ABBONAMENTO.premium;
      const ricavoMensile = Number(contratto.famiglie || 0) * pianoPremium.costo;

      const { error } = await supabase
        .from('contratti_condominio')
        .update({
          piano: 'premium',
          costo_unitario: pianoPremium.costo,
          ricavo_mensile: ricavoMensile,
          ricavo_annuo: ricavoMensile * 12,
          app_attiva: true,
          gruppo_whatsapp_attivo: true,
        })
        .eq('id', contratto.id);

      if (error) throw error;
      setStatusMessage('Contratto aggiornato a Premium con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore upgrade contratto: ' + (error.message || 'sconosciuto'));
    }
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
          showArchiviate={showArchiviate}
          onToggleArchiviate={() => setShowArchiviate((prev) => !prev)}
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
          showArchiviate={showArchiviate}
          onToggleArchiviate={() => setShowArchiviate((prev) => !prev)}
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

        {ruoloNormalizzato !== 'condominio' && (
          <div className="-mt-2">
            <DashboardOperativa ruolo={ruoloNormalizzato} segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} onOpen={setDettaglioAperto} />
          </div>
        )}
        {ruoloNormalizzato === 'gestore' && showArchiviate && (
          <DashboardStorico segnalazioni={segnalazioniVisualizzate} />
        )}
        {ruoloNormalizzato === 'amministratore' && (
          <DashboardVendite segnalazioni={segnalazioniVisualizzate} />
        )}
        {ruoloNormalizzato === 'gestore' && (
          <>
            <GestioneLeadAmministratori onCreateLead={creaLeadAmministratore} />
            <DashboardLeadAmministratori leadAmministratori={leadAmministratori} />
            <GestioneContratti condomini={condomini} contratti={contratti} onCreateContratto={creaContratto} />
            <GestioneRinnoviContratti
              contratti={contratti}
              onRinnovaContratto={rinnovaContratto}
              onUpgradeContratto={upgradeContratto}
            />
            <DashboardAbbonamenti contratti={contratti} />
            <DashboardPagamenti contratti={contratti} />
            <DashboardCRM contratti={contratti} condomini={condomini} />
            <DashboardForecast contratti={contratti} />
            <DashboardRanking contratti={contratti} condomini={condomini} />
            <DashboardEspansione contratti={contratti} condomini={condomini} />
            <DashboardLeadPipeline contratti={contratti} condomini={condomini} />
            <DashboardMarginalita contratti={contratti} />
            <DashboardTerritorioToscana contratti={contratti} condomini={condomini} />
            <DashboardProvinceOpportunita contratti={contratti} condomini={condomini} />
            <DashboardLeadCommercialeToscana contratti={contratti} condomini={condomini} />
            <DashboardEconomica segnalazioni={segnalazioni} condomini={condomini} />
            <DashboardAssemblea segnalazioni={segnalazioni} votiPreventivi={votiPreventivi} />
          </>
        )}

        {(ruoloNormalizzato === 'gestore' || ruoloNormalizzato === 'condominio') && (
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
          className="fixed right-5 z-40 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-700 active:scale-95 md:right-6 md:px-5"
          aria-label="Nuova segnalazione"
        >
          <span className="text-2xl leading-none">+</span>
          <span className={`overflow-hidden whitespace-nowrap transition-all duration-500 ${showFabLabel ? 'max-w-[180px] opacity-100 ml-1' : 'max-w-0 opacity-0 ml-0'}`}>
            Nuova segnalazione
          </span>
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
        ruolo={ruoloNormalizzato}
        onConversionePreventivo={aggiornaConversionePreventivo}
        onPianificaLavori={pianificaLavori}
        onGeneraReport={generaReportPratica}
        onGeneraPdfVotazioni={generaPdfVotazioni}
        onCondividiCondomini={condividiPreventivoCondomini}
        onVotoCondomino={aggiornaVotoCondomino}
        onInviaReminderVoto={inviaReminderVoto}
        onDeletePratica={eliminaPratica}
        onRipristinaPratica={ripristinaPratica}
        votiPreventivi={votiPreventivi}
      />
    </div>
  );
}
