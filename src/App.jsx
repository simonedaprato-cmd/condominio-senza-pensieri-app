import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import OneSignal from 'react-onesignal';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
const APP_VERSION = '1.0.57';
const APP_VERSION_LABEL = 'CSP v1.0.57';
const isValoreVero = (value) => value === true || value === 'true' || value === 1 || value === '1';
const LOGO_SRC = '/brand/csp-logo-sidebar.png';
const SPLASH_LOGO_SRC = '/brand/csp-monogram-splash.png';
const MAIL_LOGO_SRC = '/brand/csp-logo-mail.png';
const OTP_MAIL_LOGO_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co/storage/v1/object/public/brand-assets/nuovo%20logo%20sfondo%20nero%20per%20mail.png';
const AUTH_REDIRECT_URL = typeof window !== 'undefined' ? window.location.origin : '';
const ONESIGNAL_APP_ID = '61ae6769-0000-4811-af73-41e2007d5d96';

const MOTION_CARD = 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl';
const MOTION_SOFT = 'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md';
const MOTION_BUTTON = 'transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]';


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
  base: { nome: 'Base', costo: 0, app: true, whatsapp: false, provvigione: 0.05, livello: 1 },
  plus: { nome: 'Plus', costo: 3, app: true, whatsapp: true, provvigione: 0.07, livello: 2 },
  premium: { nome: 'Premium', costo: 9.9, app: true, whatsapp: true, provvigione: 0.10, livello: 3 },
};

function normalizzaPianoAbbonamento(value) {
  const piano = String(value || '').toLowerCase().trim();
  if (piano === 'premium') return 'premium';
  if (piano === 'plus') return 'plus';
  return 'base';
}

function getContrattoCorrenteCondominio(condominioId, contratti = []) {
  const id = Number(condominioId || 0);
  if (!id) return null;

  return (contratti || [])
    .filter((contratto) => Number(contratto.condominio_id) === id)
    .sort((a, b) => new Date(b.data_attivazione || b.created_at || 0) - new Date(a.data_attivazione || a.created_at || 0))[0] || null;
}

function isContrattoSospesoCondominio(condominioId, contratti = []) {
  const contratto = getContrattoCorrenteCondominio(condominioId, contratti);
  const stato = String(contratto?.stato || '').toLowerCase().trim();
  return ['sospeso', 'disdetto', 'annullato', 'scaduto'].includes(stato);
}

function getPianoAbbonamentoCondominio(condominioId, contratti = []) {
  const id = Number(condominioId || 0);
  if (!id) return 'base';

  const contrattoCorrente = getContrattoCorrenteCondominio(id, contratti);
  const stato = String(contrattoCorrente?.stato || '').toLowerCase().trim();

  if (['sospeso', 'disdetto', 'annullato', 'scaduto'].includes(stato)) {
    return 'base';
  }

  return normalizzaPianoAbbonamento(contrattoCorrente?.piano);
}

function getSubscriptionFlags(piano) {
  const pianoNorm = normalizzaPianoAbbonamento(piano);
  return {
    piano: pianoNorm,
    isBase: pianoNorm === 'base',
    isPlus: pianoNorm === 'plus' || pianoNorm === 'premium',
    isPremium: pianoNorm === 'premium',
    config: PIANI_ABBONAMENTO[pianoNorm] || PIANI_ABBONAMENTO.base,
  };
}

function getNumeroFamiglieCondominio(condominio = {}) {
  return Number(
    condominio.numero_condomini ||
    condominio.numero_famiglie ||
    condominio.famiglie ||
    condominio.unita_immobiliari ||
    condominio.unita ||
    0
  );
}


function getLivelloPianoAbbonamento(piano) {
  return PIANI_ABBONAMENTO[normalizzaPianoAbbonamento(piano)]?.livello || 1;
}

function canUseSubscriptionFeature(piano, required = 'plus') {
  return getLivelloPianoAbbonamento(piano) >= getLivelloPianoAbbonamento(required);
}


function ReportSubscriptionGateCard({ required = 'plus', title, text }) {
  const tone = required === 'premium' ? 'amber' : 'sky';
  const cls = required === 'premium'
    ? 'border-amber-100 bg-gradient-to-br from-amber-50 via-yellow-50 to-white text-amber-900'
    : 'border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-sky-900';

  return (
    <div className={`rounded-[2rem] border p-5 shadow-sm ${cls}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
          🔒
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">
            {required === 'premium' ? 'Riservato a CSP Premium' : 'Riservato a CSP Plus'}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{title}</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] opacity-70">
            Contatta il tuo amministratore per l’attivazione del piano.
          </p>
        </div>
      </div>
    </div>
  );
}


function SubscriptionLockedCard({ required = 'plus', title, text, compact = false }) {
  const requiredNorm = normalizzaPianoAbbonamento(required);
  const label = requiredNorm === 'premium' ? 'CSP Premium' : 'CSP Plus';
  return (
    <section className={`rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-white ${compact ? 'p-4' : 'p-6'} shadow-sm`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Riservato a {label}</p>
          <h3 className="mt-1 text-xl font-black text-slate-900">{title || `Disponibile con ${label}`}</h3>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            {text || `Questa funzione resta visibile per mostrarti cosa puoi attivare con ${label}, senza perdere il controllo della tua area CSP.`}
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white text-2xl shadow-lg shadow-emerald-950/10 ring-1 ring-emerald-100">
          🔒
        </div>
      </div>
    </section>
  );
}


function SubscriptionPlanBadge({ piano = 'base', className = '' }) {
  const pianoNorm = normalizzaPianoAbbonamento(piano);
  const config = {
    base: {
      label: 'CSP Base',
      cls: 'border-slate-200 bg-white text-slate-600 shadow-sm',
    },
    plus: {
      label: 'CSP Plus',
      cls: 'border-sky-200 bg-gradient-to-r from-sky-50 via-slate-50 to-cyan-50 text-sky-800 shadow-sm shadow-sky-900/5',
    },
    premium: {
      label: 'CSP Premium',
      cls: 'border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-white text-amber-800 shadow-sm shadow-amber-900/10',
    },
  }[pianoNorm] || {
    label: 'CSP Base',
    cls: 'border-slate-200 bg-white text-slate-600 shadow-sm',
  };

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${config.cls} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${pianoNorm === 'premium' ? 'bg-amber-500' : pianoNorm === 'plus' ? 'bg-sky-500' : 'bg-slate-400'}`} />
      {config.label}
    </span>
  );
}


function SubscriptionPlanInlineLabel({ piano = 'base' }) {
  const pianoNorm = normalizzaPianoAbbonamento(piano);
  const cls = pianoNorm === 'premium'
    ? 'text-amber-700'
    : pianoNorm === 'plus'
      ? 'text-sky-700'
      : 'text-slate-500';
  const label = pianoNorm === 'premium'
    ? 'CSP PREMIUM'
    : pianoNorm === 'plus'
      ? 'CSP PLUS'
      : 'CSP BASE';

  return (
    <span className={`font-black uppercase tracking-[0.12em] ${cls}`}>
      <span className="mx-1 text-slate-400">▪</span>
      {label}
    </span>
  );
}

function subscriptionPlanCardClass(piano = 'base') {
  const pianoNorm = normalizzaPianoAbbonamento(piano);
  if (pianoNorm === 'premium') {
    return 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-amber-900/10';
  }
  if (pianoNorm === 'plus') {
    return 'border-sky-200 bg-gradient-to-br from-sky-50 via-slate-50 to-cyan-50 shadow-sky-900/10';
  }
  return 'border-slate-200 bg-white';
}




function TopbarPlanTextLabel({ piano = 'base' }) {
  const pianoNorm = normalizzaPianoAbbonamento(piano);
  const label = pianoNorm === 'premium'
    ? 'CSP PREMIUM'
    : pianoNorm === 'plus'
      ? 'CSP PLUS'
      : 'CSP BASE';

  const cls = pianoNorm === 'premium'
    ? 'text-amber-100'
    : pianoNorm === 'plus'
      ? 'text-sky-100'
      : 'text-white/80';

  return (
    <span className={`text-xs font-black uppercase tracking-[0.16em] ${cls}`}>
      {label}
    </span>
  );
}

function buildPublicUrl(fileName) {
  if (!fileName) return '';
  return SUPABASE_URL + '/storage/v1/object/public/allegati/' + encodeURIComponent(fileName);
}

function formatEuro(value) {
  const numero = Math.round(Number(value || 0));
  const formattato = numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return '€ ' + formattato;
}

function formatCurrency(value) {
  return formatEuro(value);
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

function LogoMark({ className = 'h-[4.5rem] w-auto md:h-24', alt = 'Condominio Senza Pensieri', src = LOGO_SRC }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}



function getCurrentAppBaseUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.origin + window.location.pathname;
}

function buildAppDeepLink(params = {}) {
  if (typeof window === 'undefined') return '';
  const url = new URL(getCurrentAppBaseUrl() || window.location.href);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}



function buildGoogleMapsUrl(parts = []) {
  const query = (parts || [])
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  if (!query) return '';

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function GoogleMapsButton({ parts = [], label = 'Apri su Google Maps', className = '' }) {
  const url = buildGoogleMapsUrl(parts);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 ${className}`}
    >
      {label}
    </a>
  );
}

function isPushLaunchContext() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search || '');
  return (
    params.get('fromPush') === '1' ||
    params.get('source') === 'push' ||
    params.get('utm_source') === 'onesignal' ||
    params.has('pratica') ||
    params.has('segnalazione') ||
    params.has('segnalazioneId') ||
    params.has('capitolato') ||
    params.has('rivista') ||
    params.has('magazine') ||
    params.get('section') === 'rivista'
  );
}

function normalizeEmail(value) {
  return String(value || '').toLowerCase().trim();
}

async function loadUserProfile(email) {
  const normalizedEmail = String(email || '').toLowerCase().trim();

  const { data: utente, error } = await supabase
    .from('utenti')
    .select('email, ruolo, condominio, telefono, nome, studio, amministratore_email')
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

  let collegamentiFinali = collegamenti || [];

  // Collaboratore: eredita automaticamente i condomìni dell'amministratore collegato.
  // Il riferimento corretto è utenti.amministratore_email; utenti.condominio resta solo come legacy/fallback.
  if (String(utente.ruolo || '').toLowerCase().trim() === 'collaboratore') {
    const amministratoreCollegatoEmail = normalizeEmail(utente.amministratore_email || utente.condominio);

    if (amministratoreCollegatoEmail) {
      const { data: collegamentiAmministratore, error: collegamentiAdminError } = await supabase
        .from('utenti_condomini')
        .select('condominio_id, condomini(id, nome, indirizzo)')
        .ilike('email', amministratoreCollegatoEmail);

      if (collegamentiAdminError) throw collegamentiAdminError;

      const byId = new Map();
      [...collegamentiFinali, ...(collegamentiAmministratore || [])].forEach((item) => {
        if (item?.condominio_id) byId.set(Number(item.condominio_id), item);
      });
      collegamentiFinali = Array.from(byId.values());
    }
  }

  const condomini = collegamentiFinali.map((item) => item.condomini).filter(Boolean);

  return {
    ...utente,
    condominiIds: collegamentiFinali.map((item) => item.condominio_id),
    condomini,
    condominio: condomini[0]?.nome || utente.condominio || '',
  };
}


function AppMotionStyles() {
  return (
    <style>{`
      @keyframes cspFadeUp {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }



      @keyframes cspProgressFill {
        0% {
          width: 0%;
          opacity: 0.72;
        }
        18% {
          width: 18%;
          opacity: 1;
        }
        58% {
          width: 72%;
        }
        100% {
          width: 100%;
          opacity: 1;
        }
      }

      @keyframes cspSplashGlow {
        0%, 100% {
          opacity: 0.55;
          transform: scale(0.96);
        }
        50% {
          opacity: 0.92;
          transform: scale(1.04);
        }
      }

      .csp-splash-progress {
        animation: cspProgressFill 2.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .csp-splash-glow {
        animation: cspSplashGlow 2.6s ease-in-out infinite;
      }

      @keyframes cspSoftPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 18px 45px -30px rgba(15, 23, 42, 0.35);
        }
        50% {
          transform: scale(1.01);
          box-shadow: 0 24px 60px -34px rgba(5, 150, 105, 0.45);
        }
      }

      .csp-enter {
        animation: cspFadeUp 520ms ease-out both;
      }

      .csp-enter-slow {
        animation: cspFadeUp 720ms ease-out both;
      }

      .csp-premium-pulse {
        animation: cspSoftPulse 3.8s ease-in-out infinite;
      }

      .csp-tap {
        transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
      }

      .csp-tap:active {
        transform: scale(0.97);
        filter: brightness(0.96);
      }

      .csp-touch-card {
        transition: transform 240ms ease, box-shadow 240ms ease;
      }


      .csp-scroll {
        scrollbar-width: thin;
        scrollbar-color: rgba(15, 23, 42, 0.28) transparent;
      }

      .csp-scroll::-webkit-scrollbar {
        width: 8px;
      }

      .csp-scroll::-webkit-scrollbar-track {
        background: transparent;
      }

      .csp-scroll::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.22);
        border-radius: 999px;
      }

      .csp-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(15, 23, 42, 0.36);
      }

      .csp-touch-card:active {
        transform: scale(0.985);
        box-shadow: 0 18px 45px -32px rgba(15, 23, 42, 0.45);
      }
    `}</style>
  );
}





function formatCurrencySafeCsp(value) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `€ ${Math.round(Number.isFinite(n) ? n : 0).toLocaleString('it-IT')}`;
  }
}

function SchedaCondominioStrategicaModal({ row, onClose, mode = 'richiesta', utentiCondomini = [] }) {
  if (!row || !row.condominio) return null;

  const condominio = row.condominio;
  const famiglieDaAnagrafica = (Array.isArray(utentiCondomini) ? utentiCondomini : [])
    .filter((u) => Number(u.condominio_id || 0) === Number(row.id || condominio.id || 0))
    .filter((u) => ['condominio', 'condomino'].includes(String(u.ruolo || '').toLowerCase().trim()))
    .length;

  const famiglie = Number(
    condominio.famiglie ||
    condominio.numero_condomini ||
    condominio.numero_famiglie ||
    condominio.unita ||
    condominio.numero_famiglie_censite ||
    famiglieDaAnagrafica ||
    0
  );

  const calcola = (piano) => {
    const config = PIANI_ABBONAMENTO[piano] || PIANI_ABBONAMENTO.base;
    const mensileFamiglia = Number(config.costo || 0);
    const annuo = famiglie * mensileFamiglia * 12;
    return { mensileFamiglia, annuo };
  };

  const plus = calcola('plus');
  const premium = calcola('premium');

  const richiedi = async (piano) => {
    const pianoPulito = String(piano || '').toLowerCase().trim();
    const pianoLabel = pianoPulito.toUpperCase();

    if (mode === 'gestore') {
      window.alert(
        `Attivazione CSP ${pianoLabel} selezionata per ${row.nome}.\n\nNel prossimo step collegheremo questo pulsante alla creazione/aggiornamento del contratto e alle notifiche ufficiali di avvenuta attivazione.`
      );
      return;
    }

    const conferma = window.confirm(
      `Confermare richiesta attivazione CSP ${pianoLabel} per ${row.nome}?\n\nIl gestore riceverà una richiesta dedicata.`
    );

    if (!conferma) return;

    const payload = {
      piano: pianoPulito,
      condominioId: row.id,
      condominioNome: row.nome,
      famiglie,
      praticheAnno: row.pratiche,
      attivitaCsp: row.score,
    };

    console.log('[CSP request-upgrade] invio invoke...', payload);

    try {
      const { data, error } = await supabase.functions.invoke('request-upgrade-csp', {
        body: payload,
      });

      console.log('[CSP request-upgrade] risposta invoke', { data, error });

      if (error) throw error;

      window.alert(data?.message || `Richiesta CSP ${pianoLabel} inviata al gestore.`);
    } catch (error) {
      console.error('[CSP request-upgrade] errore', error);
      const message = error?.message || error?.context?.message || 'Errore sconosciuto';
      window.alert(`Errore invio richiesta CSP ${pianoLabel}.\n\n${message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center bg-slate-950/45 p-3 backdrop-blur-sm md:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/70 bg-white p-5 shadow-2xl csp-enter md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Scheda condominio</p>
            <h3 className="mt-1 text-2xl font-black leading-tight text-slate-900">{row.nome}</h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Utilizzo CSP annuale · {row.pratiche} pratiche · score {row.score}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-500 shadow-sm transition hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Famiglie</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{famiglie || '—'}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Pratiche</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{row.pratiche}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Attività CSP</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{row.score}</p>
          </div>
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-white/70 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4">
          <p className="text-sm font-bold leading-6 text-slate-700">
            Questo condominio mostra un utilizzo CSP continuativo. Le funzioni evolute possono rendere più ordinata la gestione annuale e ridurre attività manuali ricorrenti.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[1.6rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-700">Simulazione CSP Plus</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrencySafeCsp(plus.annuo)} / anno</p>
            <p className="mt-1 text-xs font-bold text-slate-500">≈ {formatCurrencySafeCsp(plus.mensileFamiglia)} / famiglia / mese</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Riparti automatici, reminder quote e report annuale.</p>
            <button
              type="button"
              onClick={() => richiedi('plus')}
              className="mt-4 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {mode === 'gestore' ? 'Attiva CSP Plus' : 'Richiedi attivazione CSP Plus'}
            </button>
          </div>

          <div className="rounded-[1.6rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-yellow-50 to-white p-4 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">Simulazione CSP Premium</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrencySafeCsp(premium.annuo)} / anno</p>
            <p className="mt-1 text-xs font-bold text-slate-500">≈ {formatCurrencySafeCsp(premium.mensileFamiglia)} / famiglia / mese</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">Priorità interventi, report semestrale e vantaggi Premium dedicati.</p>
            <button
              type="button"
              onClick={() => richiedi('premium')}
              className="mt-4 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {mode === 'gestore' ? 'Attiva CSP Premium' : 'Richiedi attivazione CSP Premium'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UtilizzoCspCondominiale({ ruolo = '', condomini = [], segnalazioni = [] }) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const [schedaAperta, setSchedaAperta] = useState(null);

  if (!['amministratore', 'collaboratore'].includes(ruoloNorm)) return null;

  const anno = new Date().getFullYear();
  const condominiLista = Array.isArray(condomini) ? condomini : [];
  const pratiche = Array.isArray(segnalazioni) ? segnalazioni : [];

  const nomeCondominio = (condominio) => (
    condominio?.nome ||
    condominio?.name ||
    condominio?.denominazione ||
    (condominio?.id ? `Condominio #${condominio.id}` : 'Condominio')
  );

  const righe = condominiLista
    .map((condominio) => {
      const id = Number(condominio?.id || 0);
      const praticheCondominio = pratiche.filter((s) => Number(s.condominio_id || 0) === id);
      const praticheAnno = praticheCondominio.filter((s) => {
        const raw = s.created_at || s.data || s.createdAt;
        if (!raw) return true;
        const d = new Date(raw);
        return Number.isFinite(d.getTime()) ? d.getFullYear() === anno : true;
      });

      const chiuse = praticheAnno.filter((s) => String(s.stato || '').toLowerCase().includes('chius')).length;
      const votazioni = praticheAnno.filter((s) => String(s.stato || '').toLowerCase().includes('vot')).length;
      const score = praticheAnno.length + chiuse + votazioni;

      return {
        id,
        nome: nomeCondominio(condominio),
        score,
        pratiche: praticheAnno.length,
        condominio,
      };
    })
    .filter((row) => row.id && row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (righe.length === 0) return null;

  const maxScore = Math.max(...righe.map((row) => row.score), 1);

  return (
    <>
      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur csp-enter">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Utilizzo CSP</p>
            <h3 className="mt-1 text-base font-black text-slate-900">Condomìni più attivi</h3>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{anno}</p>
        </div>

        <div className="mt-3 max-h-[230px] space-y-2 overflow-y-auto pr-1 csp-scroll">
          {righe.map((row, index) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSchedaAperta(row)}
              className="w-full rounded-2xl border border-slate-100 bg-white/75 px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{index + 1}. {row.nome}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{row.pratiche} pratiche CSP · apri scheda</p>
                </div>
                <p className="text-xs font-black text-emerald-700">{row.score}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500/70"
                  style={{ width: `${Math.max(12, Math.round((row.score / maxScore) * 100))}%` }}
                />
              </div>
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] font-bold leading-5 text-slate-500">
          I condomìni con utilizzo continuativo beneficiano maggiormente delle funzioni CSP evolute.
        </p>
      </section>

      {schedaAperta && (
        <SchedaCondominioStrategicaModal
          row={schedaAperta}
          utentiCondomini={utentiCondomini}
          onClose={() => setSchedaAperta(null)}
        />
      )}
    </>
  );
}



function CondominiOperativiSuite({ condomini = [], segnalazioni = [], capitolati = [], contratti = [], utentiCondomini = [] }) {
  const [search, setSearch] = useState('');
  const [schedaAperta, setSchedaAperta] = useState(null);
  const anno = new Date().getFullYear();

  const nomeCondominio = (condominio) => (
    condominio?.nome ||
    condominio?.name ||
    condominio?.denominazione ||
    (condominio?.id ? `Condominio #${condominio.id}` : 'Condominio')
  );

  const numeroFamiglie = (condominio, condominioId = null) => {
    const id = Number(condominioId || condominio?.id || 0);
    const famiglieDaAnagrafica = (Array.isArray(utentiCondomini) ? utentiCondomini : [])
      .filter((u) => Number(u.condominio_id || 0) === id)
      .filter((u) => ['condominio', 'condomino'].includes(String(u.ruolo || '').toLowerCase().trim()))
      .length;

    return Number(
      condominio?.famiglie ||
      condominio?.numero_condomini ||
      condominio?.numero_famiglie ||
      condominio?.unita ||
      condominio?.numero_famiglie_censite ||
      famiglieDaAnagrafica ||
      0
    );
  };

  const righe = (Array.isArray(condomini) ? condomini : [])
    .map((condominio) => {
      const id = Number(condominio?.id || 0);
      const praticheCsp = (Array.isArray(segnalazioni) ? segnalazioni : []).filter((s) => Number(s.condominio_id || 0) === id);
      const praticheCasep = (Array.isArray(capitolati) ? capitolati : []).filter((c) => Number(c.condominio_id || c.condominioId || 0) === id);
      const praticheAnno = praticheCsp.filter((s) => {
        const raw = s.created_at || s.data || s.createdAt;
        if (!raw) return true;
        const d = new Date(raw);
        return Number.isFinite(d.getTime()) ? d.getFullYear() === anno : true;
      });
      const chiuse = praticheAnno.filter((s) => String(s.stato || '').toLowerCase().includes('chius')).length;
      const score = praticheAnno.length + chiuse + praticheCasep.length;
      const piano = getPianoAbbonamentoCondominio(id, contratti);
      return {
        id,
        nome: nomeCondominio(condominio),
        condominio,
        famiglie: numeroFamiglie(condominio, id),
        pratiche: praticheAnno.length,
        praticheCasep: praticheCasep.length,
        score,
        piano,
      };
    })
    .filter((row) => row.id)
    .filter((row) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return row.nome.toLowerCase().includes(q) || String(row.condominio?.indirizzo || '').toLowerCase().includes(q);
    })
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome));

  const maxScore = Math.max(...righe.map((row) => row.score), 1);

  const apriScheda = (row) => {
    setSchedaAperta({
      ...row,
      pratiche: row.pratiche,
      score: row.score,
    });
  };

  return (
    <section className="space-y-4 pb-36 md:pb-6">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Control room amministratore</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">I tuoi condomìni</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Schede anagrafiche, utilizzo CSP/CaSeP e simulazione piani evoluti.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca condominio..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 md:max-w-xs"
          />
        </div>
      </div>

      {righe.length === 0 ? (
        <EmptyState icon="🏢" title="Nessun condominio trovato" text="Non risultano condomìni collegati al tuo profilo o alla ricerca corrente." action="Modifica ricerca" tone="emerald" />
      ) : (
        <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1 csp-scroll">
          {righe.map((row) => {
            const pianoNorm = normalizzaPianoAbbonamento(row.piano);
            const pianoClass = pianoNorm === 'premium'
              ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-white'
              : pianoNorm === 'plus'
                ? 'border-sky-200 bg-gradient-to-br from-sky-50 via-slate-50 to-cyan-50'
                : 'border-slate-200 bg-white';

            return (
              <button
                key={row.id}
                type="button"
                onClick={() => apriScheda(row)}
                className={`w-full rounded-[2rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${pianoClass}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black text-slate-900">{row.nome}</h3>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">CSP {pianoNorm}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">{row.condominio?.indirizzo || 'Indirizzo non indicato'}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center md:min-w-[280px]">
                    <div className="rounded-2xl bg-white/75 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Famiglie</p>
                      <p className="text-lg font-black text-slate-900">{row.famiglie || '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">CSP</p>
                      <p className="text-lg font-black text-emerald-700">{row.pratiche}</p>
                    </div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">CaSeP</p>
                      <p className="text-lg font-black text-slate-900">{row.praticheCasep}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80">
                  <div
                    className="h-full rounded-full bg-emerald-500/70"
                    style={{ width: `${Math.max(10, Math.round((row.score / maxScore) * 100))}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {schedaAperta && (
        <SchedaCondominioStrategicaModal
          row={schedaAperta}
          onClose={() => setSchedaAperta(null)}
        />
      )}
    </section>
  );
}




function GestoreCondominiRegistratiSuite({ condomini = [], contratti = [], utentiSistema = [], utentiCondomini = [], segnalazioni = [], capitolati = [] }) {
  const [search, setSearch] = useState('');
  const [provinciaFiltro, setProvinciaFiltro] = useState('');
  const [adminFiltro, setAdminFiltro] = useState('');
  const [pianoFiltro, setPianoFiltro] = useState('');
  const [schedaAperta, setSchedaAperta] = useState(null);

  const nomeCondominio = (condominio) => (
    condominio?.nome ||
    condominio?.name ||
    condominio?.denominazione ||
    (condominio?.id ? `Condominio #${condominio.id}` : 'Condominio')
  );

  const adminLabel = (email) => {
    const e = String(email || '').toLowerCase().trim();
    if (!e) return 'Amministratore non indicato';
    const u = (utentiSistema || []).find((utente) => String(utente.email || '').toLowerCase().trim() === e);
    return u?.studio || u?.ragione_sociale || u?.nome || e;
  };

  const province = [...new Set((condomini || []).map((c) => String(c.provincia || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  const amministratori = [...new Set((condomini || []).map((c) => String(c.amministratore_email || '').toLowerCase().trim()).filter(Boolean))]
    .sort((a, b) => adminLabel(a).localeCompare(adminLabel(b)));

  const righe = (Array.isArray(condomini) ? condomini : [])
    .map((condominio) => {
      const id = Number(condominio?.id || 0);
      const piano = getPianoAbbonamentoCondominio(id, contratti);
      const praticheCsp = (Array.isArray(segnalazioni) ? segnalazioni : []).filter((s) => Number(s.condominio_id || 0) === id);
      const praticheCasep = (Array.isArray(capitolati) ? capitolati : []).filter((c) => Number(c.condominio_id || c.condominioId || 0) === id);
      const famiglieDaAnagrafica = (Array.isArray(utentiCondomini) ? utentiCondomini : [])
        .filter((u) => Number(u.condominio_id || 0) === id)
        .filter((u) => ['condominio', 'condomino'].includes(String(u.ruolo || '').toLowerCase().trim()))
        .length;
      const famiglie = Number(condominio.famiglie || condominio.numero_condomini || condominio.numero_famiglie || condominio.unita || condominio.numero_famiglie_censite || famiglieDaAnagrafica || 0);
      const score = praticheCsp.length + praticheCasep.length;
      return {
        id,
        condominio,
        nome: nomeCondominio(condominio),
        provincia: String(condominio.provincia || '').trim(),
        citta: String(condominio.citta || condominio.città || '').trim(),
        indirizzo: String(condominio.indirizzo || '').trim(),
        amministratoreEmail: String(condominio.amministratore_email || '').toLowerCase().trim(),
        amministratore: adminLabel(condominio.amministratore_email),
        piano,
        famiglie,
        praticheCsp: praticheCsp.length,
        praticheCasep: praticheCasep.length,
        score,
      };
    })
    .filter((row) => row.id)
    .filter((row) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return [row.nome, row.indirizzo, row.citta, row.provincia, row.amministratore, row.amministratoreEmail].join(' ').toLowerCase().includes(q);
    })
    .filter((row) => !provinciaFiltro || row.provincia === provinciaFiltro)
    .filter((row) => !adminFiltro || row.amministratoreEmail === adminFiltro)
    .filter((row) => !pianoFiltro || normalizzaPianoAbbonamento(row.piano) === pianoFiltro)
    .sort((a, b) => {
      const order = { premium: 3, plus: 2, base: 1 };
      return (order[normalizzaPianoAbbonamento(b.piano)] || 0) - (order[normalizzaPianoAbbonamento(a.piano)] || 0)
        || b.score - a.score
        || a.nome.localeCompare(b.nome);
    });

  const stats = {
    totale: righe.length,
    base: righe.filter((r) => normalizzaPianoAbbonamento(r.piano) === 'base').length,
    plus: righe.filter((r) => normalizzaPianoAbbonamento(r.piano) === 'plus').length,
    premium: righe.filter((r) => normalizzaPianoAbbonamento(r.piano) === 'premium').length,
  };

  const apriScheda = (row) => {
    setSchedaAperta({
      id: row.id,
      nome: row.nome,
      condominio: row.condominio,
      pratiche: row.praticheCsp,
      score: row.score,
      praticheCasep: row.praticheCasep,
      piano: row.piano,
    });
  };

  return (
    <section className="space-y-4 pb-36 md:pb-6">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">Control room contratti</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Condomìni registrati</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Piani attivi, filtri commerciali e schede operative per gestione upgrade.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Totale</p><p className="text-lg font-black text-slate-900">{stats.totale}</p></div>
            <div className="rounded-2xl bg-white px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Base</p><p className="text-lg font-black text-slate-700">{stats.base}</p></div>
            <div className="rounded-2xl bg-sky-50 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-500">Plus</p><p className="text-lg font-black text-sky-800">{stats.plus}</p></div>
            <div className="rounded-2xl bg-amber-50 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-600">Premium</p><p className="text-lg font-black text-amber-800">{stats.premium}</p></div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca..." className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100" />
          <select value={provinciaFiltro} onChange={(e) => setProvinciaFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
            <option value="">Tutte le province</option>
            {province.map((provincia) => <option key={provincia} value={provincia}>{provincia}</option>)}
          </select>
          <select value={adminFiltro} onChange={(e) => setAdminFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
            <option value="">Tutti gli amministratori</option>
            {amministratori.map((email) => <option key={email} value={email}>{adminLabel(email)}</option>)}
          </select>
          <select value={pianoFiltro} onChange={(e) => setPianoFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
            <option value="">Tutti i piani</option>
            <option value="base">Base</option>
            <option value="plus">Plus</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      {righe.length === 0 ? (
        <EmptyState icon="🏢" title="Nessun condominio trovato" text="Nessun risultato per i filtri selezionati." action="Modifica filtri" tone="emerald" />
      ) : (
        <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1 csp-scroll">
          {righe.map((row) => {
            const pianoNorm = normalizzaPianoAbbonamento(row.piano);
            const cardClass = pianoNorm === 'premium'
              ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-amber-900/10'
              : pianoNorm === 'plus'
                ? 'border-sky-200 bg-gradient-to-br from-sky-50 via-slate-50 to-cyan-50 shadow-sky-900/10'
                : 'border-slate-200 bg-white';

            return (
              <button key={row.id} type="button" onClick={() => apriScheda(row)} className={`w-full rounded-[2rem] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${cardClass}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-black text-slate-900">{row.nome}</h3>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">CSP {pianoNorm}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-500">{[row.indirizzo, row.citta, row.provincia].filter(Boolean).join(' · ') || 'Indirizzo non indicato'}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-400">{row.amministratore}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center md:min-w-[300px]">
                    <div className="rounded-2xl bg-white/75 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Famiglie</p><p className="text-lg font-black text-slate-900">{row.famiglie || '—'}</p></div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">CSP</p><p className="text-lg font-black text-emerald-700">{row.praticheCsp}</p></div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">CaSeP</p><p className="text-lg font-black text-slate-900">{row.praticheCasep}</p></div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {schedaAperta && (
        <SchedaCondominioStrategicaModal row={schedaAperta} mode="gestore" utentiCondomini={utentiCondomini} onClose={() => setSchedaAperta(null)} />
      )}
    </section>
  );
}



function SmartMicroInsight({ ruolo = '', piano = 'base', segnalazioni = [], subscriptionFlags = getSubscriptionFlags('base') }) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const pratiche = Array.isArray(segnalazioni) ? segnalazioni : [];
  const anno = new Date().getFullYear();

  const praticheAnno = pratiche.filter((s) => {
    const rawDate = s.created_at || s.data || s.createdAt;
    if (!rawDate) return false;
    const d = new Date(rawDate);
    return Number.isFinite(d.getTime()) && d.getFullYear() === anno;
  });

  const praticheChiuse = praticheAnno.filter((s) => String(s.stato || '').toLowerCase().includes('chius'));
  const valoreLavori = praticheAnno.reduce((sum, s) => {
    const valore = Number(s.importo || s.importo_preventivo || s.importo_lavori || s.valore || 0);
    return sum + (Number.isFinite(valore) ? valore : 0);
  }, 0);

  const insight = (() => {
    if (ruoloNorm === 'amministratore' || ruoloNorm === 'collaboratore') {
      if (subscriptionFlags?.isPlus || subscriptionFlags?.isPremium) {
        return `Insight CSP · Gestione Plus attiva: riparti e reminder possono lavorare al posto delle attività manuali.`;
      }
      if (praticheAnno.length >= 8) {
        return `Insight CSP · ${praticheAnno.length} pratiche nel ${anno}: il condominio sta usando CSP in modo continuativo.`;
      }
      return `Insight CSP · CSP Plus automatizza riparti, reminder quote e report annuali.`;
    }

    if (ruoloNorm === 'gestore') {
      return `Insight CSP · Monitoraggio attivo su ${pratiche.length} pratiche complessive dell’ecosistema.`;
    }

    if (['condominio', 'condomino'].includes(ruoloNorm)) {
      if (subscriptionFlags?.isPremium && valoreLavori > 0) {
        return `Insight CSP · Nel ${anno} sono stati coordinati ${formatCurrency(valoreLavori)} di lavori tramite CSP.`;
      }
      if (subscriptionFlags?.isPlus || subscriptionFlags?.isPremium) {
        return `Insight CSP · Il tuo condominio ha accesso agli strumenti evoluti del piano ${normalizzaPianoAbbonamento(piano).toUpperCase()}.`;
      }
      if (praticheAnno.length > 0) {
        return `Insight CSP · ${praticheAnno.length} pratiche gestite nel ${anno} per il tuo condominio.`;
      }
      return `Insight CSP · La tua area CSP raccoglie pratiche, aggiornamenti e comunicazioni del condominio.`;
    }

    return '';
  })();

  if (!insight) return null;

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-xs font-bold leading-5 text-slate-700 shadow-sm backdrop-blur md:text-sm">
      <span className="font-black text-emerald-700">✦</span>
      <span className="ml-2">{insight}</span>
    </div>
  );
}


function EmptyState({
  icon = '✨',
  title = 'Nessun dato disponibile',
  text = 'Quando ci saranno nuovi contenuti, li vedrai comparire qui.',
  action,
  tone = 'emerald',
}) {
  const tones = {
    emerald: 'border-emerald-200 from-emerald-50 via-white to-slate-50 text-emerald-800',
    amber: 'border-amber-200 from-amber-50 via-white to-slate-50 text-amber-800',
    blue: 'border-blue-200 from-blue-50 via-white to-slate-50 text-blue-800',
    slate: 'border-slate-200 from-slate-50 via-white to-white text-slate-800',
    rose: 'border-rose-200 from-rose-50 via-white to-slate-50 text-rose-800',
  };

  return (
    <div className={`csp-enter rounded-3xl border border-dashed bg-gradient-to-br p-7 text-center shadow-sm ${tones[tone] || tones.emerald}`}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl shadow-lg shadow-slate-900/10">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{text}</p>
      {action && (
        <p className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide shadow-sm">
          {action}
        </p>
      )}
    </div>
  );
}


function StatoBadge({ stato }) {
  const base = "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide";

  if (!stato) return null;

  if (stato.toLowerCase().includes("aperta")) {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-800 csp-premium-pulse`}>
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        Aperta
      </span>
    );
  }

  if (stato.toLowerCase().includes("corso")) {
    return (
      <span className={`${base} bg-amber-100 text-amber-800 animate-pulse`}>
        <span className="h-2 w-2 rounded-full bg-amber-500"></span>
        In corso
      </span>
    );
  }

  if (stato.toLowerCase().includes("chiusa")) {
    return (
      <span className={`${base} bg-slate-200 text-slate-700`}>
        <span className="h-2 w-2 rounded-full bg-slate-500"></span>
        Chiusa
      </span>
    );
  }

  return (
    <span className={`${base} bg-slate-100 text-slate-600`}>
      {stato}
    </span>
  );
}




function FlussoOperativoPratica({ titolo = 'Stato avanzamento', stato = '', steps = [] }) {
  const statoNorm = String(stato || '').toLowerCase();
  const activeIndex = Math.max(0, steps.findIndex((step) => {
    const label = String(step.label || '').toLowerCase();
    const aliases = (step.aliases || []).map((item) => String(item || '').toLowerCase());
    return statoNorm === label || statoNorm.includes(label) || aliases.some((alias) => statoNorm.includes(alias));
  }));
  const resolvedIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-emerald-700">{titolo}</p>
          <h4 className="mt-1 text-base font-black text-slate-900">Flusso operativo</h4>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm ring-1 ring-emerald-100">
          {stato || steps[0]?.label || 'Nuova pratica'}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const done = index < resolvedIndex;
          const active = index === resolvedIndex;
          const cls = active
            ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            : done
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-slate-200 bg-white text-slate-500';
          return (
            <div key={`${step.label}-${index}`} className={`rounded-2xl border p-3 transition-all ${cls}`}>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${active ? 'bg-white text-emerald-700' : done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {done ? '✓' : index + 1}
                </span>
                <div>
                  <p className="text-xs font-black leading-tight">{step.label}</p>
                  {step.text && <p className={`mt-0.5 text-[11px] font-semibold leading-snug ${active ? 'text-emerald-50' : done ? 'text-emerald-700' : 'text-slate-400'}`}>{step.text}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



function resolveWorkflowStepKey(stato = '', steps = []) {
  const statoNorm = String(stato || '').toLowerCase().trim();
  const found = (steps || []).find((step) => {
    const label = String(step.label || '').toLowerCase().trim();
    const aliases = (step.aliases || []).map((item) => String(item || '').toLowerCase().trim());
    return statoNorm === label || (label && statoNorm.includes(label)) || aliases.some((alias) => alias && statoNorm.includes(alias));
  });
  return found?.label || steps?.[0]?.label || 'Senza stato';
}

function groupItemsByWorkflowStatus(items = [], steps = []) {
  const base = (steps || []).map((step) => ({ step, items: [] }));
  const extra = [];
  (items || []).forEach((item) => {
    const key = resolveWorkflowStepKey(item?.stato, steps);
    const bucket = base.find((group) => group.step.label === key);
    if (bucket) bucket.items.push(item);
    else extra.push(item);
  });
  const groups = base.filter((group) => group.items.length > 0);
  if (extra.length) groups.push({ step: { label: 'Altri stati', text: 'Pratiche non classificate' }, items: extra });
  return groups;
}

function WorkflowStatusGroup({ step, count, tone = 'emerald', children }) {
  const toneMap = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    sky: 'border-sky-100 bg-sky-50 text-sky-800',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
    slate: 'border-slate-100 bg-slate-50 text-slate-800',
  };
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">Stato pratica</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">{step?.label || 'Senza stato'}</h3>
          {step?.text && <p className="mt-1 text-sm font-semibold text-slate-500">{step.text}</p>}
        </div>
        <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-black ${toneMap[tone] || toneMap.emerald}`}>
          {count} {count === 1 ? 'pratica' : 'pratiche'}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </section>
  );
}

function ToastInterno({ toast, onClose }) {
  if (!toast) return null;

  const toneClass = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-900',
    warning: 'border-amber-100 bg-amber-50 text-amber-900',
    info: 'border-sky-100 bg-sky-50 text-sky-900',
    error: 'border-red-100 bg-red-50 text-red-900',
  }[toast.tone || 'info'] || 'border-sky-100 bg-sky-50 text-sky-900';

  const icon = {
    success: '✅',
    warning: '⚠️',
    info: '🔔',
    error: '❌',
  }[toast.tone || 'info'] || '🔔';

  return (
    <div className="fixed left-3 right-3 top-4 z-[80] md:left-auto md:right-6 md:w-[420px]">
      <div className={`csp-enter rounded-3xl border p-4 shadow-2xl shadow-slate-900/20 backdrop-blur-xl ${toneClass}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black">{toast.title || 'Aggiornamento'}</p>
            {toast.message && <p className="mt-1 text-xs leading-relaxed opacity-80">{toast.message}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/70 px-2.5 py-1 text-xs font-black opacity-80 shadow-sm"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

function NotifichePushBox({ utenteEmail }) {
  const [supportate, setSupportate] = useState(false);
  const [inizializzato, setInizializzato] = useState(false);
  const [inizializzazioneInCorso, setInizializzazioneInCorso] = useState(false);
  const [permesso, setPermesso] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [collegatoEmail, setCollegatoEmail] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [dispositivoSalvato, setDispositivoSalvato] = useState(false);
  const [messaggio, setMessaggio] = useState('');
  const [debugSalvataggio, setDebugSalvataggio] = useState('');
  const [iosInfo, setIosInfo] = useState({
    isIOS: false,
    isStandalone: false,
    isSafari: false,
  });

  const emailPulita = String(utenteEmail || '').toLowerCase().trim();
  const apertaDaPush = isPushLaunchContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const userAgent = window.navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(userAgent) || (
      /macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1
    );
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(userAgent);

    setIosInfo({ isIOS, isStandalone, isSafari });

    const browserSupportato = 'serviceWorker' in navigator && (
      'Notification' in window || isIOS
    );

    setSupportate(browserSupportato);

    if (typeof Notification !== 'undefined') {
      setPermesso(Notification.permission);
    }
  }, []);

  const inizializzaOneSignal = async (origine = 'auto') => {
    if (inizializzato) return true;
    if (inizializzazioneInCorso) return false;

    if (iosInfo.isIOS && !iosInfo.isStandalone) {
      setMessaggio('Su iPhone apri l’app dalla schermata Home, non da Safari, per attivare le notifiche.');
      return false;
    }

    try {
      setInizializzazioneInCorso(true);
      setMessaggio('Preparo le notifiche...');

      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
        notifyButton: {
          enable: false,
        },
      });

      setInizializzato(true);
      setPermesso(typeof Notification !== 'undefined' ? Notification.permission : 'default');
      setMessaggio('');
      console.info('OneSignal inizializzato:', origine);
      return true;
    } catch (error) {
      console.error('Errore inizializzazione OneSignal:', error);
      setMessaggio('Notifiche non inizializzate. Chiudi e riapri l’app, poi riprova.');
      return false;
    } finally {
      setInizializzazioneInCorso(false);
    }
  };

  const leggiSubscriptionId = async () => {
    for (let tentativo = 1; tentativo <= 30; tentativo += 1) {
      let subId = '';

      try {
        const pushSub = OneSignal.User?.PushSubscription;

        subId =
          pushSub?.id ||
          pushSub?.subscriptionId ||
          pushSub?.token ||
          pushSub?.current?.id ||
          pushSub?.current?.subscriptionId ||
          '';

        if (!subId && typeof pushSub?.getIdAsync === 'function') {
          subId = await pushSub.getIdAsync();
        }
      } catch (error) {
        console.warn('Lettura subscription OneSignal non riuscita:', error);
      }

      if (subId) {
        console.info('Subscription ID rilevato:', subId);
        return subId;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 700));
    }

    console.warn('Subscription ID non disponibile dopo attesa prolungata.');
    return '';
  };

  const salvaSubscriptionId = async (subId) => {
    if (!emailPulita || !subId) return false;

    try {
      const { data, error } = await supabase.functions.invoke('save-subscription', {
        body: {
          email: emailPulita,
          subscriptionId: subId,
          deviceLabel: /Android/i.test(navigator.userAgent)
            ? 'Android'
            : /iPhone|iPad|iPod/i.test(navigator.userAgent)
              ? 'iOS'
              : /Windows/i.test(navigator.userAgent)
                ? 'Windows'
                : 'Web',
          userAgent: navigator.userAgent,
        },
      });

      if (error) {
        console.warn('Salvataggio subscription tramite funzione non completato:', error.message || error);
        setDebugSalvataggio('Errore funzione: ' + (error.message || JSON.stringify(error)));
        setMessaggio('Notifiche attive, ma registrazione dispositivo non completata.');
        return false;
      }

      console.info('Subscription salvata nella tabella multi-dispositivo:', data);
      setDebugSalvataggio('Risposta save-subscription: ' + JSON.stringify(data));

      // Release 100: refresh diretto degli stessi campi letti da notify-capitolato.
      // È un fallback sicuro: anche se save-subscription aggiorna solo la tabella multi-device,
      // CaSeP deve avere l'ID fresco anche in utenti e utenti_condomini, come nel motore CSP.
      try {
        const { error: utentiUpdateError } = await supabase
          .from('utenti')
          .update({ onesignal_subscription_id: subId })
          .ilike('email', emailPulita);

        if (utentiUpdateError) {
          console.warn('Refresh OneSignal utenti non completato:', utentiUpdateError.message || utentiUpdateError);
        }

        const { error: mappingUpdateError } = await supabase
          .from('utenti_condomini')
          .update({ onesignal_subscription_id: subId })
          .ilike('email', emailPulita);

        if (mappingUpdateError) {
          console.warn('Refresh OneSignal utenti_condomini non completato:', mappingUpdateError.message || mappingUpdateError);
        }

        console.info('OneSignal CaSeP refresh salvato su utenti/utenti_condomini:', {
          email: emailPulita,
          subscriptionId: subId,
          release: APP_VERSION,
        });
      } catch (refreshError) {
        console.warn('Refresh diretto OneSignal CaSeP non completato:', refreshError);
      }

      if (data?.success && Number(data?.records_updated || 0) > 0) {
        setDispositivoSalvato(true);
        setMessaggio('');
        return true;
      }

      // Anche se la funzione non dichiara record aggiornati, il fallback diretto sopra può aver aggiornato i campi utili.
      setDispositivoSalvato(true);
      setMessaggio('');
      return true;
    } catch (error) {
      console.warn('Errore chiamata save-subscription:', error);
      setDebugSalvataggio('Errore chiamata: ' + (error.message || JSON.stringify(error)));
      setMessaggio('Notifiche attive, ma registrazione dispositivo non riuscita.');
      return false;
    }
  };

  const collegaUtenteOneSignal = async (origine = 'auto') => {
    if (!emailPulita) {
      console.warn('OneSignal: email utente assente, collegamento saltato');
      return null;
    }

    const okInit = await inizializzaOneSignal(origine + '-init');
    if (!okInit) return null;

    try {
      await OneSignal.login(emailPulita);

      try {
        await OneSignal.User.addEmail(emailPulita);
      } catch (emailError) {
        console.warn('OneSignal addEmail non completato:', emailError);
      }

      try {
        if (typeof OneSignal.User?.PushSubscription?.optIn === 'function') {
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (optInError) {
        console.warn('OneSignal optIn non completato:', optInError);
      }

      const subId = await leggiSubscriptionId();

      console.info('OneSignal utente collegato:', {
        origine,
        email: emailPulita,
        subscriptionId: subId || 'non disponibile',
        permission: typeof Notification !== 'undefined' ? Notification.permission : 'n/a',
      });

      setCollegatoEmail(true);

      if (subId) {
        setSubscriptionId(subId);
        const salvato = await salvaSubscriptionId(subId);
        if (!salvato) return null;
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        setMessaggio('Notifiche consentite. Attendo la registrazione del dispositivo...');
        window.setTimeout(async () => {
          const subIdRitardato = await leggiSubscriptionId();
          if (subIdRitardato) {
            setSubscriptionId(subIdRitardato);
            const salvato = await salvaSubscriptionId(subIdRitardato);
            if (salvato) {
              setCollegatoEmail(true);
              setDispositivoSalvato(true);
              setMessaggio('');
            }
          }
        }, 2500);
      }

      return subId;
    } catch (error) {
      console.error('Errore collegamento utente OneSignal:', error);
      setCollegatoEmail(false);
      setMessaggio('Notifiche attive, ma utente non collegato. Riprova ad attivarle.');
      return null;
    }
  };

  useEffect(() => {
    if (!supportate || inizializzato) return;

    if (iosInfo.isIOS && !iosInfo.isStandalone) {
      setMessaggio('Su iPhone installa prima l’app nella schermata Home, poi aprila dall’icona per attivare le notifiche.');
      return;
    }

    inizializzaOneSignal('auto');
  }, [supportate, iosInfo.isIOS, iosInfo.isStandalone, inizializzato]);

  useEffect(() => {
    if (!inizializzato || !emailPulita) return;

    let active = true;

    const collega = async () => {
      const subId = await collegaUtenteOneSignal('login-effect');
      if (!active) return;

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && subId) {
        setCollegatoEmail(true);
      }
    };

    collega();

    return () => {
      active = false;
    };
  }, [inizializzato, emailPulita]);

  useEffect(() => {
    if (!inizializzato || !emailPulita) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    let active = true;

    const refreshCaSeP = async () => {
      try {
        console.info('OneSignal CaSeP refresh automatico avviato', {
          email: emailPulita,
          release: APP_VERSION,
        });

        const subId = await collegaUtenteOneSignal('casep-refresh-release100');

        if (!active) return;

        if (subId) {
          console.info('OneSignal CaSeP refresh automatico completato', {
            email: emailPulita,
            subscriptionId: subId,
            release: APP_VERSION,
          });
        }
      } catch (error) {
        console.warn('OneSignal CaSeP refresh automatico errore:', error);
      }
    };

    const timer = window.setTimeout(refreshCaSeP, 1200);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [inizializzato, emailPulita, permesso]);


  const attivaNotifiche = async () => {
    try {
      setMessaggio('');

      if (!supportate) {
        setMessaggio('Le notifiche push non sono supportate da questo browser.');
        return;
      }

      if (iosInfo.isIOS && !iosInfo.isStandalone) {
        setMessaggio('Apri l’app dall’icona sulla schermata Home dell’iPhone, non da Safari, poi premi di nuovo Attiva.');
        return;
      }

      const okInit = await inizializzaOneSignal('click');
      if (!okInit) return;

      if (emailPulita) {
        await collegaUtenteOneSignal('prima-del-permesso');
      }

      await OneSignal.Notifications.requestPermission();

      try {
        if (typeof OneSignal.User?.PushSubscription?.optIn === 'function') {
          await OneSignal.User.PushSubscription.optIn();
        }
      } catch (optInError) {
        console.warn('OneSignal optIn non completato:', optInError);
      }

      const nuovoPermesso = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      setPermesso(nuovoPermesso);

      if (nuovoPermesso === 'granted') {
        const subId = await collegaUtenteOneSignal('dopo-permesso');

        if (subId) {
          setCollegatoEmail(true);
          setDispositivoSalvato(true);
          setMessaggio('');
        } else {
          setMessaggio('Notifiche consentite. Premi Registra tra qualche secondo se il box resta visibile.');
        }
      } else if (nuovoPermesso === 'denied') {
        setMessaggio('Notifiche bloccate dal browser. Puoi riattivarle dalle impostazioni del sito.');
      } else {
        setMessaggio('Permesso notifiche non ancora concesso.');
      }
    } catch (error) {
      console.error('Errore richiesta permesso notifiche:', error);
      setMessaggio('Errore attivazione notifiche: ' + (error.message || 'sconosciuto'));
    }
  };

  if (!supportate && !iosInfo.isIOS) return null;

  // Quando l'app viene aperta da una push/deep link, non mostriamo il box
  // installazione/registrazione: deve aprirsi direttamente la pratica.
  if (apertaDaPush) return null;

  const attive = permesso === 'granted' && collegatoEmail && dispositivoSalvato;

  if (attive) {
    return null;
  }

  const titoloBox = iosInfo.isIOS && !iosInfo.isStandalone
    ? 'Installa l’app su iPhone'
    : permesso === 'granted'
      ? 'Registra questo dispositivo'
      : 'Attiva notifiche push';

  const testoBox = iosInfo.isIOS && !iosInfo.isStandalone
    ? 'Per ricevere notifiche su iPhone: Safari → Condividi → Aggiungi a Home. Poi apri l’app dalla nuova icona.'
    : permesso === 'granted'
      ? 'Le notifiche sono consentite. Completa la registrazione del dispositivo per riceverle.'
      : 'Ricevi avvisi su nuove segnalazioni, votazioni e aggiornamenti importanti.';

  return (
    <div className="csp-enter rounded-3xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-amber-900">
            {titoloBox}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {testoBox}
          </p>
          {emailPulita && (
            <p className="mt-1 text-[11px] font-semibold text-amber-800">
              Collegamento utente: {emailPulita}
            </p>
          )}
          {subscriptionId && (
            <p className="mt-1 text-[10px] font-semibold text-amber-700">
              Dispositivo: {subscriptionId}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={attivaNotifiche}
          disabled={inizializzazioneInCorso}
          className={`rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm disabled:opacity-60 ${MOTION_BUTTON}`}
        >
          {inizializzazioneInCorso ? 'Preparo...' : iosInfo.isIOS && !iosInfo.isStandalone ? 'Istruzioni' : permesso === 'granted' ? 'Registra' : 'Attiva'}
        </button>
      </div>

      {messaggio && (
        <p className="mt-3 rounded-2xl bg-white/70 px-3 py-2 text-xs font-semibold text-slate-600">
          {messaggio}
        </p>
      )}

      {debugSalvataggio && (
        <pre className="mt-3 max-h-32 overflow-auto rounded-2xl bg-white/80 px-3 py-2 text-[10px] leading-relaxed text-slate-600">
          {debugSalvataggio}
        </pre>
      )}
    </div>
  );
}


function Login() {
  const [email, setEmail] = useState('');
  const [messaggio, setMessaggio] = useState('');
  const [messaggioTipo, setMessaggioTipo] = useState('info');
  const [codiceOtp, setCodiceOtp] = useState('');
  const otpInputRef = useRef(null);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [codiceRichiesto, setCodiceRichiesto] = useState(false);

  const mostraMessaggio = (testo, tipo = 'info') => {
    setMessaggio(testo);
    setMessaggioTipo(tipo);
  };

  const normalizzaCodiceOtp = (valore) => String(valore || '').replace(/\D/g, '').slice(0, 8);

  const codiceOtpPulito = normalizzaCodiceOtp(codiceOtp);
  const codiceOtpCompleto = codiceOtpPulito.length === 8;

  const verificaEmailAbilitata = async (emailPulita) => {
    const emailNormalizzata = String(emailPulita || '').trim().toLowerCase();
    if (!emailNormalizzata) return false;

    // La verifica pre-login deve passare da una Edge Function con service role.
    // Dal frontend anonimo le RLS possono nascondere utenti/utenti_condomini e causare falsi negativi.
    const { data, error } = await supabase.functions.invoke('check-login-email', {
      body: { email: emailNormalizzata },
    });

    if (error) {
      console.error('Errore verifica email abilitata:', error);
      throw new Error('Verifica accesso non disponibile. Riprova tra poco oppure contatta l’assistenza tecnica.');
    }

    return Boolean(data?.allowed);
  };

  const inviaCodice = async () => {
    const emailPulita = email.trim().toLowerCase();
    if (!emailPulita || invioInCorso) return;

    setInvioInCorso(true);
    mostraMessaggio('Verifico il tuo accesso riservato...', 'info');

    try {
      const emailAbilitata = await verificaEmailAbilitata(emailPulita);

      if (!emailAbilitata) {
        mostraMessaggio('Email non riconosciuta. Questa email non risulta abilitata all’accesso a Condominio Senza Pensieri. Verifica l’indirizzo inserito oppure contatta l’assistenza tecnica.', 'error');
        setCodiceRichiesto(false);
        return;
      }

      mostraMessaggio('Invio del codice di accesso in corso...', 'info');

      const { error } = await supabase.auth.signInWithOtp({
        email: emailPulita,
        options: {
          emailRedirectTo: AUTH_REDIRECT_URL,
          data: {
            app_name: 'Condominio Senza Pensieri',
            logo_url: OTP_MAIL_LOGO_URL,
          },
        },
      });

      if (error) throw error;

      setCodiceRichiesto(true);
      mostraMessaggio('Codice inviato. Controlla la tua email e inserisci le 8 cifre per accedere alla tua area riservata.', 'success');
    } catch (error) {
      console.error(error);
      mostraMessaggio('Accesso non riuscito: ' + (error.message || 'errore sconosciuto'), 'error');
    } finally {
      setInvioInCorso(false);
    }
  };

  const verificaCodice = async () => {
    const emailPulita = email.trim().toLowerCase();
    const token = normalizzaCodiceOtp(codiceOtp || otpInputRef.current?.value || '');

    if (!emailPulita) return mostraMessaggio('Inserisci prima la tua email.', 'error');
    if (!token) return mostraMessaggio('Inserisci il codice ricevuto via email.', 'error');
    if (token.length !== 8) return mostraMessaggio('Il codice deve contenere 8 cifre.', 'error');

    setInvioInCorso(true);
    mostraMessaggio('Verifica del codice in corso...', 'info');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailPulita,
        token,
        type: 'email',
      });

      if (error) throw error;
      mostraMessaggio('Accesso verificato. Sto preparando la tua area riservata...', 'success');
    } catch (error) {
      console.error(error);
      mostraMessaggio('Codice non valido o scaduto. Richiedi un nuovo codice e riprova.', 'error');
    } finally {
      setInvioInCorso(false);
    }
  };

  const incollaDaClipboard = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        return mostraMessaggio('Copia automatica non supportata su questo dispositivo.', 'error');
      }

      const testo = await navigator.clipboard.readText();
      if (!testo) return mostraMessaggio('Nessun codice trovato negli appunti.', 'error');

      const codice = normalizzaCodiceOtp(testo);
      setCodiceOtp(codice);
      mostraMessaggio(codice.length === 8 ? 'Codice incollato automaticamente. Puoi procedere con l’accesso.' : 'Non ho trovato un codice valido negli appunti.', codice.length === 8 ? 'success' : 'error');
    } catch (error) {
      console.error(error);
      mostraMessaggio('Impossibile leggere gli appunti. Incolla manualmente il codice.', 'error');
    }
  };

  const messageClass = messaggioTipo === 'error'
    ? 'border-red-100 bg-red-50 text-red-700'
    : messaggioTipo === 'success'
      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
      : 'border-slate-100 bg-slate-50 text-slate-600';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white p-0 shadow-2xl shadow-emerald-950/40 csp-enter csp-touch-card">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-7 py-10 text-center text-white">
          <div className="absolute inset-x-10 top-8 h-24 rounded-full bg-emerald-400/10 blur-3xl csp-splash-glow" />
          <div className="relative mx-auto flex h-[21rem] w-[21rem] max-h-[72vw] max-w-[72vw] items-center justify-center overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/40 p-5 shadow-2xl shadow-black/35">
            <img src={OTP_MAIL_LOGO_URL} alt="Condominio Senza Pensieri" className="h-full w-full object-contain" />
          </div>
          <p className="relative mt-7 text-[11px] font-black uppercase tracking-[0.28em] text-emerald-100">Accesso riservato CSP</p>
          <h1 className="relative mt-2 text-2xl font-black tracking-tight">Entra con codice sicuro</h1>
          <p className="relative mt-2 text-sm leading-relaxed text-white/70">Un accesso unico, semplice e uniforme da smartphone, tablet e computer.</p>
        </div>

        <div className="p-7">
          <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Email abilitata</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setCodiceOtp('');
              setCodiceRichiesto(false);
            }}
            placeholder="nome@email.it"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
          />

          <button
            onClick={inviaCodice}
            disabled={invioInCorso || !email.trim()}
            className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white shadow-lg shadow-emerald-900/25 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:translate-y-0 disabled:opacity-60"
          >
            {invioInCorso && !codiceRichiesto ? 'Verifico...' : 'Ricevi codice di accesso'}
          </button>

          <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Codice OTP</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Inserisci le 8 cifre ricevute via email. Il codice è temporaneo e protegge il tuo accesso.</p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              ref={otpInputRef}
              value={codiceOtpPulito}
              onInput={(e) => setCodiceOtp(normalizzaCodiceOtp(e.currentTarget.value))}
              onChange={(e) => setCodiceOtp(normalizzaCodiceOtp(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                const testo = e.clipboardData?.getData('text') || '';
                const codice = normalizzaCodiceOtp(testo);
                setCodiceOtp(codice);
                if (codice.length === 8) mostraMessaggio('Codice acquisito. Puoi procedere con l’accesso.', 'success');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') verificaCodice();
              }}
              placeholder="••••••••"
              className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-3xl font-black tracking-[0.45em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={incollaDaClipboard}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5"
              >
                Incolla codice
              </button>
              <button
                type="button"
                onClick={verificaCodice}
                disabled={invioInCorso}
                className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {invioInCorso && codiceRichiesto ? 'Verifico...' : 'Accedi'}
              </button>
            </div>
          </div>

          {messaggio && (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold leading-relaxed ${messageClass}`}>{messaggio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MultiCondominioSwitcher({ ruolo, condomini = [], filtroCondominioId, onChangeCondominio }) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const isUtenteMulti = ruoloNorm !== 'gestore' && Array.isArray(condomini) && condomini.length > 1;

  if (!isUtenteMulti) return null;

  const attivoId = filtroCondominioId ? String(filtroCondominioId) : '';
  const seleziona = (id) => {
    onChangeCondominio(id ? String(id) : '');
  };

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm csp-enter">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Profilo multi-condominio</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">I tuoi condomìni CSP</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Hai più immobili collegati: puoi vedere tutto insieme oppure filtrare una singola posizione.
          </p>
        </div>
        <select
          value={attivoId}
          onChange={(e) => seleziona(e.target.value)}
          className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
        >
          <option value="">Tutti i condomìni</option>
          {condomini.map((condominio) => (
            <option key={condominio.id} value={String(condominio.id)}>
              {condominio.nome || `Condominio #${condominio.id}`}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => seleziona('')}
          className={`rounded-3xl border p-4 text-left transition-all duration-200 ${
            !attivoId
              ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          <p className="text-sm font-black">Vista unica</p>
          <p className={`mt-1 text-xs font-semibold ${!attivoId ? 'text-emerald-50' : 'text-slate-500'}`}>
            Tutte le pratiche, i report e i contenuti collegati al tuo profilo.
          </p>
        </button>
        {condomini.map((condominio) => {
          const isActive = attivoId === String(condominio.id);
          return (
            <button
              key={condominio.id}
              type="button"
              onClick={() => seleziona(condominio.id)}
              className={`rounded-3xl border p-4 text-left transition-all duration-200 ${
                isActive
                  ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <p className="text-sm font-black">{condominio.nome || `Condominio #${condominio.id}`}</p>
              <p className={`mt-1 text-xs font-semibold ${isActive ? 'text-emerald-50' : 'text-slate-500'}`}>
                {condominio.indirizzo || 'Indirizzo non indicato'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}


function LiveTopBar({ onOpenMenu, onRefresh, loading, userProfile, pianoAbbonamento = 'base' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).replace('.', '');
  const formattedTime = now.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const ora = now.getHours();
  let saluto = 'CIAO';
  if (ora >= 5 && ora < 12) saluto = 'BUONGIORNO';
  else if (ora >= 12 && ora < 18) saluto = 'BUON POMERIGGIO';
  else if (ora >= 18 && ora < 23) saluto = 'BUONASERA';
  else saluto = 'BUONANOTTE';

  const nomeUtente = String(userProfile?.nome || 'BENVENUTO').toUpperCase();

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-[70] border-b border-emerald-900/20 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 text-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-2">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white text-xl font-black leading-none text-emerald-800 shadow-md shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg active:translate-y-0 active:shadow-sm"
            aria-label="Apri menu"
          >
            ☰
          </button>
          <div className="text-right text-xs font-black uppercase tracking-[0.16em] text-white/80 md:text-sm">
            {['condominio', 'condomino'].includes(String(userProfile?.ruolo || '').toLowerCase().trim()) ? (
              <TopbarPlanTextLabel piano={pianoAbbonamento} />
            ) : (
              <>
                <span>{formattedDate}</span>
                <span className="mx-2 text-white/45">•</span>
                <span className="text-white">{formattedTime}</span>
              </>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-4xl px-5 pb-2 pt-1 text-center md:px-7">
          <p className="text-xs font-semibold leading-snug tracking-[0.08em] text-white/65 md:text-sm">Gestione evoluta delle pratiche condominiali</p>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-white md:text-base">{saluto} {nomeUtente}</p>
        </div>
        <div className="mx-auto w-full max-w-4xl px-4 pb-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="w-full rounded-2xl border border-white/20 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800 shadow-md shadow-emerald-950/25 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-lg active:translate-y-0 active:shadow-sm disabled:opacity-60"
          >
            {loading ? 'Sincronizzo live...' : 'Aggiorna live'}
          </button>
        </div>
      </div>
      <div className="h-[138px] shrink-0 md:h-[146px]" aria-hidden="true" />
    </>
  );
}

function Header() {
  return null;
}

function DashboardEconomicStat({ label, value, tone = 'slate' }) {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50 text-slate-800',
    red: 'border-red-100 bg-red-50 text-red-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
  }[tone] || 'border-slate-200 bg-slate-50 text-slate-800';

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm csp-touch-card">
      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">{label}</p>
      <div className={`shrink-0 rounded-xl border px-4 py-2 text-right text-sm font-black tracking-tight ${toneClass}`}>
        {value}
      </div>
    </div>
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


function GestioneAnagraficheBox({ condomini = [], amministratori = [], utentiSistema = [], utentiCondomini = [], onSaved }) {
  const condominiAttivi = Array.isArray(condomini) ? condomini : [];
  const utentiAttivi = Array.isArray(utentiSistema) ? utentiSistema : [];
  const collegamentiAttivi = Array.isArray(utentiCondomini) ? utentiCondomini : [];
  const amministratoriAttivi = useMemo(() => {
    const byEmail = new Map();
    [...(amministratori || []), ...utentiAttivi]
      .filter((utente) => String(utente?.ruolo || '').toLowerCase().trim() === 'amministratore')
      .forEach((utente) => {
        const email = normalizeEmail(utente.email);
        if (email) byEmail.set(email, { ...utente, email });
      });
    return Array.from(byEmail.values()).sort((a, b) => String(a.nome || a.studio || a.email).localeCompare(String(b.nome || b.studio || b.email), 'it'));
  }, [amministratori, utentiAttivi]);

  const [tab, setTab] = useState('amministratore');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvTipo, setCsvTipo] = useState('amministratore');

  const emptyAmministratore = {
    nome: '', cognome: '', ragione_sociale: '', indirizzo: '', citta: '', provincia: '', condomini_totali: '', referente: '', telefono_ufficio: '', telefono_cellulare: '', email: '',
  };
  const emptyCollaboratore = { nome: '', cognome: '', telefono: '', email: '', amministratore_email: '' };
  const emptyCondominio = { nome: '', indirizzo: '', citta: '', provincia: '', numero_condomini: '', codice_fiscale: '', codice_sdi: '', amministratore_email: '' };
  const emptyCondomino = { nome: '', cognome: '', email: '', telefono: '', condominio_id: '', millesimi: '' };

  const [adminForm, setAdminForm] = useState(emptyAmministratore);
  const [collabForm, setCollabForm] = useState(emptyCollaboratore);
  const [condominioForm, setCondominioForm] = useState(emptyCondominio);
  const [condominoForm, setCondominoForm] = useState(emptyCondomino);

  const updateForm = (setter, field, value) => setter((prev) => ({ ...prev, [field]: value }));
  const emailKey = (value) => normalizeEmail(value);
  const labelAmministratore = (utente) => [utente.ragione_sociale || utente.studio, [utente.nome, utente.cognome].filter(Boolean).join(' '), utente.email].filter(Boolean).join(' • ');

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const upsertUtenteByEmail = async (payload) => {
    const email = emailKey(payload.email);
    if (!email) throw new Error('Email obbligatoria.');

    // CRM anagrafiche prudente: sulla tabella utenti scriviamo SOLO colonne già presenti
    // e già lette dal sistema. Tutto il materiale commerciale esteso resta in lead_amministratori.
    const cleanPayload = {
      email,
      ruolo: payload.ruolo || 'condominio',
      nome: String(payload.nome || '').trim(),
      telefono: String(payload.telefono || '').trim(),
      studio: String(payload.studio || '').trim(),
      amministratore_email: payload.amministratore_email ? emailKey(payload.amministratore_email) : null,
    };

    Object.keys(cleanPayload).forEach((key) => {
      if (cleanPayload[key] === undefined || cleanPayload[key] === '') delete cleanPayload[key];
    });

    const { data: existing, error: existingError } = await supabase
      .from('utenti')
      .select('id,email')
      .ilike('email', email)
      .maybeSingle();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    if (existing?.id) {
      const { error } = await supabase.from('utenti').update(cleanPayload).eq('id', existing.id);
      if (error) throw error;
      return existing.id;
    }

    const { data, error } = await supabase.from('utenti').insert(cleanPayload).select('id').maybeSingle();
    if (error) throw error;
    return data?.id || null;
  };


  const upsertUtenteCondominioMapping = async ({ email, condominioId, ruolo, extra = {} }) => {
    const cleanEmail = emailKey(email);
    const id = Number(condominioId || 0);
    if (!cleanEmail || !id) return;

    const { data: existing, error: existingError } = await supabase
      .from('utenti_condomini')
      .select('id')
      .ilike('email', cleanEmail)
      .eq('condominio_id', id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    const mapping = {
      email: cleanEmail,
      condominio_id: id,
      ruolo,
      ...extra,
    };

    Object.keys(mapping).forEach((key) => {
      if (mapping[key] === undefined || mapping[key] === '') delete mapping[key];
    });

    if (existing?.id) {
      const { error } = await supabase.from('utenti_condomini').update(mapping).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('utenti_condomini').insert(mapping);
      if (error) throw error;
    }
  };

  const upsertLeadAmministratoreByEmail = async (payload) => {
    const email = emailKey(payload.email);
    if (!email) return;
    const leadPayload = {
      nome_studio: payload.ragione_sociale || payload.studio || [payload.nome, payload.cognome].filter(Boolean).join(' ') || email,
      referente: payload.referente || [payload.nome, payload.cognome].filter(Boolean).join(' '),
      telefono: payload.telefono_cellulare || payload.telefono_ufficio || payload.telefono || '',
      email,
      provincia: payload.provincia || '',
      citta: payload.citta || '',
      indirizzo: payload.indirizzo || '',
      numero_condomini: safeNumber(payload.condomini_totali, 0),
      numero_condomini_interessati: 0,
      origine: 'Anagrafica CSP',
      stato_pipeline: 'potenziale',
      note: 'Creato automaticamente dal CRM anagrafiche CSP.',
      data_appuntamento: null,
      ora_appuntamento: null,
      prossimo_followup: null,
    };

    const { data: existing, error: existingError } = await supabase
      .from('lead_amministratori')
      .select('id,email')
      .ilike('email', email)
      .maybeSingle();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    if (existing?.id) {
      const { error } = await supabase.from('lead_amministratori').update(leadPayload).eq('id', existing.id);
      if (error) throw error;
      return;
    }

    const { error } = await supabase.from('lead_amministratori').insert(leadPayload);
    if (error) throw error;
  };

  const salvaAmministratore = async (e, formOverride = null) => {
    e?.preventDefault?.();
    const source = formOverride || adminForm;
    const email = emailKey(source.email);
    if (!email) return alert('Inserisci la mail dell’amministratore.');
    try {
      setSaving(true);
      const payload = {
        email,
        ruolo: 'amministratore',
        nome: String(source.nome || '').trim(),
        cognome: String(source.cognome || '').trim(),
        studio: String(source.ragione_sociale || '').trim(),
        ragione_sociale: String(source.ragione_sociale || '').trim(),
        indirizzo: String(source.indirizzo || '').trim(),
        citta: String(source.citta || '').trim(),
        provincia: String(source.provincia || '').trim(),
        condomini_totali: safeNumber(source.condomini_totali, 0),
        referente: String(source.referente || '').trim(),
        telefono_ufficio: String(source.telefono_ufficio || '').trim(),
        telefono_cellulare: String(source.telefono_cellulare || '').trim(),
        telefono: String(source.telefono_cellulare || source.telefono_ufficio || '').trim(),
      };
      await upsertUtenteByEmail(payload);
      await upsertLeadAmministratoreByEmail(payload);
      if (!formOverride) setAdminForm(emptyAmministratore);
      setMessage('Amministratore salvato anche nel CRM commerciale.');
      await onSaved?.();
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio amministratore: ' + (error.message || 'sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  const salvaCollaboratore = async (e, formOverride = null) => {
    e?.preventDefault?.();
    const source = formOverride || collabForm;
    const email = emailKey(source.email);
    if (!email) return alert('Inserisci la mail del collaboratore.');
    if (!source.amministratore_email) return alert('Seleziona l’amministratore collegato.');
    try {
      setSaving(true);
      await upsertUtenteByEmail({
        email,
        ruolo: 'collaboratore',
        nome: String(source.nome || '').trim(),
        cognome: String(source.cognome || '').trim(),
        telefono: String(source.telefono || '').trim(),
        amministratore_email: emailKey(source.amministratore_email),
      });
      if (!formOverride) setCollabForm(emptyCollaboratore);
      setMessage('Collaboratore salvato e collegato all’amministratore.');
      await onSaved?.();
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio collaboratore: ' + (error.message || 'sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  const salvaCondominio = async (e, formOverride = null) => {
    e?.preventDefault?.();
    const source = formOverride || condominioForm;
    if (!String(source.nome || '').trim()) return alert('Inserisci il nome del condominio.');
    if (!source.amministratore_email) return alert('Seleziona l’amministratore collegato.');
    try {
      setSaving(true);
      const amministratoreSelezionato = amministratori.find((admin) => emailKey(admin.email) === emailKey(source.amministratore_email));
      const indirizzoCompleto = [source.indirizzo, source.citta, source.provincia].filter(Boolean).join(', ');
      const payload = {
        nome: String(source.nome || '').trim(),
        indirizzo: String(indirizzoCompleto || source.indirizzo || '').trim(),
        codice_fiscale: String(source.codice_fiscale || '').trim(),
        codice_sdi: String(source.codice_sdi || '').trim(),
        famiglie: safeNumber(source.numero_condomini, 0),
        amministratore_email: emailKey(source.amministratore_email),
        amministratore_telefono: String(amministratoreSelezionato?.telefono || '').trim(),
        csp_attivo: true,
      };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === undefined || payload[key] === '') delete payload[key];
      });
      const { data: condominioCreato, error } = await supabase.from('condomini').insert(payload).select('id').maybeSingle();
      if (error) throw error;

      const condominioId = Number(condominioCreato?.id || 0);
      const adminEmail = emailKey(source.amministratore_email);

      if (condominioId) {
        await upsertUtenteCondominioMapping({
          email: adminEmail,
          condominioId,
          ruolo: 'amministratore',
        });

        const gestori = (utentiAttivi || []).filter((utente) => String(utente.ruolo || '').toLowerCase().trim() === 'gestore' && emailKey(utente.email));
        for (const gestore of gestori) {
          await upsertUtenteCondominioMapping({
            email: gestore.email,
            condominioId,
            ruolo: 'gestore',
          });
        }

        // Collaboratori: fonte corretta tabella utenti, colonna amministratore_email.
        // Non usiamo fallback su altri campi per evitare collegamenti errati.
        const { data: collaboratoriCollegati, error: collaboratoriError } = await supabase
          .from('utenti')
          .select('email, ruolo, amministratore_email')
          .eq('ruolo', 'collaboratore')
          .ilike('amministratore_email', adminEmail);

        if (collaboratoriError) throw collaboratoriError;

        console.log('[CRM anagrafiche] collaboratori collegati da utenti.amministratore_email', {
          adminEmail,
          condominioId,
          collaboratori: (collaboratoriCollegati || []).map((c) => c.email),
        });

        for (const collaboratore of (collaboratoriCollegati || [])) {
          await upsertUtenteCondominioMapping({
            email: collaboratore.email,
            condominioId,
            ruolo: 'collaboratore',
          });
        }
      }

      if (!formOverride) setCondominioForm(emptyCondominio);
      setMessage('Condominio salvato e collegamenti automatici creati per gestore, amministratore e collaboratori registrati.');
      await onSaved?.();
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio condominio: ' + (error.message || 'sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  const salvaCondomino = async (e, formOverride = null) => {
    e?.preventDefault?.();
    const source = formOverride || condominoForm;
    const email = emailKey(source.email);
    const condominioId = Number(source.condominio_id || 0);
    if (!email) return alert('Inserisci la mail del condòmino.');
    if (!condominioId) return alert('Seleziona il condominio.');
    try {
      setSaving(true);
      await upsertUtenteByEmail({
        email,
        ruolo: 'condominio',
        nome: String(source.nome || '').trim(),
        cognome: String(source.cognome || '').trim(),
        telefono: String(source.telefono || '').trim(),
      });

      const { data: existing, error: existingError } = await supabase
        .from('utenti_condomini')
        .select('id')
        .ilike('email', email)
        .eq('condominio_id', condominioId)
        .maybeSingle();
      if (existingError && existingError.code !== 'PGRST116') throw existingError;

      const mapping = {
        email,
        condominio_id: condominioId,
        ruolo: 'condominio',
        millesimi: safeNumber(source.millesimi, 0),
        cognome: String(source.cognome || '').trim(),
      };

      if (existing?.id) {
        const { error } = await supabase.from('utenti_condomini').update(mapping).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('utenti_condomini').insert(mapping);
        if (error) throw error;
      }

      if (!formOverride) setCondominoForm(emptyCondomino);
      setMessage('Condòmino salvato e collegato al condominio.');
      await onSaved?.();
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio condòmino: ' + (error.message || 'sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const downloadCsv = (filename, headers, rows) => {
    const csv = [headers.join(';'), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportAnagrafiche = () => {
    if (tab === 'amministratore') {
      const headers = ['nome', 'cognome', 'ragione_sociale', 'indirizzo', 'citta', 'provincia', 'condomini_totali', 'referente', 'telefono_ufficio', 'telefono_cellulare', 'email'];
      return downloadCsv('amministratori-csp.csv', headers, amministratoriAttivi);
    }
    if (tab === 'collaboratore') {
      const headers = ['nome', 'cognome', 'telefono', 'email', 'amministratore_email'];
      return downloadCsv('collaboratori-csp.csv', headers, utentiAttivi.filter((u) => String(u.ruolo || '').toLowerCase() === 'collaboratore'));
    }
    if (tab === 'condominio') {
      const headers = ['nome', 'indirizzo', 'citta', 'provincia', 'numero_condomini', 'codice_fiscale', 'codice_sdi', 'amministratore_email'];
      return downloadCsv('condomini-csp.csv', headers, condominiAttivi);
    }
    const headers = ['nome', 'cognome', 'email', 'telefono', 'condominio_id', 'millesimi'];
    const rows = collegamentiAttivi.filter((u) => ['condominio', 'condomino'].includes(String(u.ruolo || '').toLowerCase())).map((u) => {
      const user = utentiAttivi.find((item) => emailKey(item.email) === emailKey(u.email)) || {};
      return { ...u, nome: user.nome || '', telefono: user.telefono || '' };
    });
    return downloadCsv('condomini-utenti-csp.csv', headers, rows);
  };

  const parseCsv = (text) => {
    const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const separator = lines[0].includes(';') ? ';' : ',';
    const split = (line) => {
      const out = [];
      let current = '';
      let quoted = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') quoted = !quoted;
        else if (char === separator && !quoted) { out.push(current.replace(/^"|"$/g, '').trim()); current = ''; }
        else current += char;
      }
      out.push(current.replace(/^"|"$/g, '').trim());
      return out;
    };
    const headers = split(lines[0]).map((h) => String(h || '').toLowerCase().trim());
    return lines.slice(1).map((line) => {
      const values = split(line);
      return headers.reduce((acc, header, index) => ({ ...acc, [header]: values[index] || '' }), {});
    });
  };

  const importaCsv = async () => {
    const rows = parseCsv(csvText);
    if (!rows.length) return alert('CSV vuoto o non valido.');
    try {
      setSaving(true);
      for (const row of rows) {
        if (csvTipo === 'amministratore') await salvaAmministratore(null, row);
        if (csvTipo === 'collaboratore') await salvaCollaboratore(null, row);
        if (csvTipo === 'condominio') await salvaCondominio(null, row);
        if (csvTipo === 'condomino') await salvaCondomino(null, row);
      }
      setCsvText('');
      setMessage(`Import completato: ${rows.length} righe elaborate.`);
      await onSaved?.();
    } catch (error) {
      console.error(error);
      alert('Errore import CSV: ' + (error.message || 'sconosciuto'));
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100';
  const labelClass = 'text-[11px] font-black uppercase tracking-[0.16em] text-slate-500';

  const AdminSelect = ({ value, onChange }) => (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      <option value="">Seleziona amministratore censito</option>
      {amministratoriAttivi.map((admin) => <option key={admin.email} value={admin.email}>{labelAmministratore(admin)}</option>)}
    </select>
  );

  return (
    <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">CRM anagrafiche</p>
          <h3 className="mt-1 text-xl font-black text-slate-900">Utenti, condomìni e collegamenti</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Inserimento dati nelle tabelle reali CSP: utenti, utenti_condomini, condomini e lead amministratori.</p>
        </div>
        <button type="button" onClick={exportAnagrafiche} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white shadow-sm">Esporta vista CSV</button>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          ['amministratore', 'Amministratore'], ['collaboratore', 'Collaboratore'], ['condominio', 'Condominio'], ['condomino', 'Condòmino'],
        ].map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${tab === key ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'}`}>{label}</button>
        ))}
      </div>

      {message && <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p>}

      {tab === 'amministratore' && (
        <form onSubmit={salvaAmministratore} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <label className={labelClass}>Nome<input value={adminForm.nome} onChange={(e) => updateForm(setAdminForm, 'nome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Cognome<input value={adminForm.cognome} onChange={(e) => updateForm(setAdminForm, 'cognome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Ragione sociale<input value={adminForm.ragione_sociale} onChange={(e) => updateForm(setAdminForm, 'ragione_sociale', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Referente<input value={adminForm.referente} onChange={(e) => updateForm(setAdminForm, 'referente', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Indirizzo<input value={adminForm.indirizzo} onChange={(e) => updateForm(setAdminForm, 'indirizzo', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Città<input value={adminForm.citta} onChange={(e) => updateForm(setAdminForm, 'citta', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Provincia<input value={adminForm.provincia} onChange={(e) => updateForm(setAdminForm, 'provincia', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Condomìni totali<input type="number" value={adminForm.condomini_totali} onChange={(e) => updateForm(setAdminForm, 'condomini_totali', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Telefono ufficio<input value={adminForm.telefono_ufficio} onChange={(e) => updateForm(setAdminForm, 'telefono_ufficio', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Telefono cellulare<input value={adminForm.telefono_cellulare} onChange={(e) => updateForm(setAdminForm, 'telefono_cellulare', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={`${labelClass} md:col-span-2`}>Indirizzo mail<input type="email" value={adminForm.email} onChange={(e) => updateForm(setAdminForm, 'email', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <button disabled={saving} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">Salva amministratore</button>
        </form>
      )}

      {tab === 'collaboratore' && (
        <form onSubmit={salvaCollaboratore} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <label className={labelClass}>Nome<input value={collabForm.nome} onChange={(e) => updateForm(setCollabForm, 'nome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Cognome<input value={collabForm.cognome} onChange={(e) => updateForm(setCollabForm, 'cognome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Telefono<input value={collabForm.telefono} onChange={(e) => updateForm(setCollabForm, 'telefono', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Indirizzo mail<input type="email" value={collabForm.email} onChange={(e) => updateForm(setCollabForm, 'email', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={`${labelClass} md:col-span-2`}>Amministratore collegato<div className="mt-1"><AdminSelect value={collabForm.amministratore_email} onChange={(value) => updateForm(setCollabForm, 'amministratore_email', value)} /></div></label>
          <button disabled={saving} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">Salva collaboratore</button>
        </form>
      )}

      {tab === 'condominio' && (
        <form onSubmit={salvaCondominio} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <label className={labelClass}>Nome condominio<input value={condominioForm.nome} onChange={(e) => updateForm(setCondominioForm, 'nome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Numero condòmini<input type="number" value={condominioForm.numero_condomini} onChange={(e) => updateForm(setCondominioForm, 'numero_condomini', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Indirizzo<input value={condominioForm.indirizzo} onChange={(e) => updateForm(setCondominioForm, 'indirizzo', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Città<input value={condominioForm.citta} onChange={(e) => updateForm(setCondominioForm, 'citta', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Provincia<input value={condominioForm.provincia} onChange={(e) => updateForm(setCondominioForm, 'provincia', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Codice fiscale<input value={condominioForm.codice_fiscale} onChange={(e) => updateForm(setCondominioForm, 'codice_fiscale', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>SDI<input value={condominioForm.codice_sdi} onChange={(e) => updateForm(setCondominioForm, 'codice_sdi', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Amministratore collegato<div className="mt-1"><AdminSelect value={condominioForm.amministratore_email} onChange={(value) => updateForm(setCondominioForm, 'amministratore_email', value)} /></div></label>
          <button disabled={saving} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">Salva condominio</button>
        </form>
      )}

      {tab === 'condomino' && (
        <form onSubmit={salvaCondomino} className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
          <label className={labelClass}>Nome<input value={condominoForm.nome} onChange={(e) => updateForm(setCondominoForm, 'nome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Cognome<input value={condominoForm.cognome} onChange={(e) => updateForm(setCondominoForm, 'cognome', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Indirizzo mail<input type="email" value={condominoForm.email} onChange={(e) => updateForm(setCondominoForm, 'email', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Telefono<input value={condominoForm.telefono} onChange={(e) => updateForm(setCondominoForm, 'telefono', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <label className={labelClass}>Condominio<select value={condominoForm.condominio_id} onChange={(e) => updateForm(setCondominoForm, 'condominio_id', e.target.value)} className={`mt-1 w-full ${inputClass}`}><option value="">Seleziona condominio</option>{condominiAttivi.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
          <label className={labelClass}>Millesimi di proprietà<input type="number" step="0.001" value={condominoForm.millesimi} onChange={(e) => updateForm(setCondominoForm, 'millesimi', e.target.value)} className={`mt-1 w-full ${inputClass}`} /></label>
          <button disabled={saving} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white md:col-span-2 disabled:opacity-50">Salva condòmino</button>
        </form>
      )}

      <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Import CSV</p>
            <h4 className="mt-1 text-lg font-black text-slate-900">Importa anagrafiche</h4>
            <p className="mt-1 text-xs font-semibold text-slate-500">Usa intestazioni uguali ai campi del form selezionato.</p>
          </div>
          <select value={csvTipo} onChange={(e) => setCsvTipo(e.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm font-black text-cyan-800">
            <option value="amministratore">Amministratori</option>
            <option value="collaboratore">Collaboratori</option>
            <option value="condominio">Condomìni</option>
            <option value="condomino">Condòmini</option>
          </select>
        </div>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={5} className="mt-3 w-full rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm" placeholder="nome;cognome;email;telefono..." />
        <button type="button" onClick={importaCsv} disabled={saving} className="mt-3 rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50">Importa CSV</button>
      </div>
    </section>
  );
}


function ArchivioContrattiAttiviCards({ condomini = [], contratti = [], onRinnovaContratto, onUpgradeContratto, onSospendiContratto, onRiattivaContratto }) {
  const [ricercaContratti, setRicercaContratti] = useState('');
  const [filtroPianoContratti, setFiltroPianoContratti] = useState('');
  const [contrattoSelezionato, setContrattoSelezionato] = useState(null);

  const nomeCondominio = (condominio) => condominio?.nome || condominio?.name || (condominio?.id ? `Condominio #${condominio.id}` : 'Condominio');
  const condominioById = (id) => (condomini || []).find((c) => Number(c.id) === Number(id));
  const getContrattoCondominio = (contratto) => condominioById(contratto?.condominio_id);
  const getPianoContratto = (contratto) => normalizzaPianoAbbonamento(contratto?.piano);
  const contrattoTone = (contratto) => {
    const pianoContratto = getPianoContratto(contratto);
    if (pianoContratto === 'premium') return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-900 ring-1 ring-amber-100';
    if (pianoContratto === 'plus') return 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 text-sky-900 ring-1 ring-sky-100';
    return 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white text-slate-900 ring-1 ring-slate-100';
  };
  const contrattoBadge = (contratto) => {
    const statoContratto = String(contratto?.stato || 'attivo').toLowerCase().trim();
    if (statoContratto === 'sospeso') return 'border-red-200 bg-red-100 text-red-800';
    const pianoContratto = getPianoContratto(contratto);
    if (pianoContratto === 'premium') return 'border-amber-200 bg-amber-100 text-amber-800';
    if (pianoContratto === 'plus') return 'border-sky-200 bg-sky-100 text-sky-800';
    return 'border-slate-200 bg-slate-100 text-slate-700';
  };

  const contrattiAttivi = (contratti || [])
    .filter((contratto) => {
      const stato = String(contratto.stato || 'attivo').toLowerCase().trim();
      return !['scaduto', 'disdetto', 'annullato', 'annullata'].includes(stato);
    })
    .map((contratto) => ({ ...contratto, condominio: getContrattoCondominio(contratto) }))
    .filter((contratto) => {
      const q = ricercaContratti.toLowerCase().trim();
      const pianoContratto = getPianoContratto(contratto);
      const condominio = contratto.condominio || {};
      const nome = nomeCondominio(condominio).toLowerCase();
      const indirizzo = String(condominio.indirizzo || '').toLowerCase();
      const citta = String(condominio.citta || '').toLowerCase();
      const matchRicerca = !q || nome.includes(q) || indirizzo.includes(q) || citta.includes(q) || String(contratto.condominio_id || '').includes(q);
      const matchPiano = !filtroPianoContratti || pianoContratto === filtroPianoContratti;
      return matchRicerca && matchPiano;
    })
    .sort((a, b) => nomeCondominio(a.condominio).localeCompare(nomeCondominio(b.condominio), 'it'));

  const renderContrattoModal = () => {
    if (!contrattoSelezionato) return null;
    const contratto = contrattoSelezionato;
    const condominio = contratto.condominio || getContrattoCondominio(contratto);
    const pianoContratto = getPianoContratto(contratto);
    const config = PIANI_ABBONAMENTO[pianoContratto] || PIANI_ABBONAMENTO.base;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setContrattoSelezionato(null)}>
        <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 csp-enter csp-scroll" onClick={(e) => e.stopPropagation()}>
          <div className={`rounded-[1.75rem] border p-5 ${contrattoTone(contratto)}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Scheda contratto CSP</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{nomeCondominio(condominio)}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{[condominio?.indirizzo, condominio?.citta, condominio?.provincia].filter(Boolean).join(', ') || 'Indirizzo non indicato'}</p>
              </div>
              <span className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${contrattoBadge(contratto)}`}>
                {String(contratto.stato || '').toLowerCase().trim() === 'sospeso' ? 'Sospeso' : config.nome}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <DashboardStat label="Famiglie" value={contratto.famiglie || getNumeroFamiglieCondominio(condominio) || '—'} tone="slate" />
              <DashboardStat label="MRR" value={formatEuro(contratto.ricavo_mensile)} tone="emerald" />
              <DashboardStat label="ARR" value={formatEuro(contratto.ricavo_annuo)} tone="sky" />
              <DashboardStat label="Provvigione" value={`${Math.round((config.provvigione || 0) * 100)}%`} tone="amber" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Decorrenza</p>
                <p className="mt-1 text-sm font-black text-slate-900">{contratto.data_attivazione ? new Date(contratto.data_attivazione).toLocaleDateString('it-IT') : 'Non indicata'}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Scadenza</p>
                <p className="mt-1 text-sm font-black text-slate-900">{contratto.data_scadenza ? new Date(contratto.data_scadenza).toLocaleDateString('it-IT') : 'Non indicata'}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Stato</p>
                <p className="mt-1 text-sm font-black text-slate-900">{contratto.stato || 'attivo'}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Rinnovo automatico</p>
                <p className="mt-1 text-sm font-black text-slate-900">{isValoreVero(contratto.rinnovo_automatico) ? 'Attivo' : 'Non indicato'}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {typeof onRinnovaContratto === 'function' && (
              <button type="button" onClick={async () => { await onRinnovaContratto(contratto); setContrattoSelezionato(null); }} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5">
                Rinnova contratto
              </button>
            )}
            {pianoContratto !== 'premium' && typeof onUpgradeContratto === 'function' && (
              <button type="button" onClick={async () => { await onUpgradeContratto(contratto); setContrattoSelezionato(null); }} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-900/20 transition hover:-translate-y-0.5">
                Porta a Premium
              </button>
            )}
            {String(contratto.stato || '').toLowerCase().trim() !== 'sospeso' && typeof onSospendiContratto === 'function' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const conferma = window.confirm('Sospendere questo contratto per mancato pagamento? Potrai riattivarlo da questa stessa lista.');
                    if (!conferma) return;
                    await onSospendiContratto(contratto);
                    setContrattoSelezionato(null);
                  }}
                  className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5"
                >
                  Sospendi per mancato pagamento
                </button>
              ) : typeof onRiattivaContratto === 'function' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const conferma = window.confirm('Riattivare questo contratto e riportarlo tra gli attivi?');
                    if (!conferma) return;
                    await onRiattivaContratto(contratto);
                    setContrattoSelezionato(null);
                  }}
                  className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
                >
                  Riattiva contratto
                </button>
              ) : null}
            <button type="button" onClick={() => setContrattoSelezionato(null)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5">
              Chiudi scheda
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Archivio contratti</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Condomìni con contratto attivo o sospeso</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Card cliccabili, ricerca rapida, sospensioni e riattivazioni sempre sotto controllo.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[520px]">
          <input value={ricercaContratti} onChange={(e) => setRicercaContratti(e.target.value)} placeholder="Cerca condominio o indirizzo..." className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
          <select value={filtroPianoContratti} onChange={(e) => setFiltroPianoContratti(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100">
            <option value="">Tutti i piani</option>
            <option value="base">Base</option>
            <option value="plus">Plus</option>
            <option value="premium">Premium</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        <DashboardStat label="Attivi" value={contrattiAttivi.length} tone="emerald" />
        <DashboardStat label="Base" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'base').length} tone="slate" />
        <DashboardStat label="Plus" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'plus').length} tone="sky" />
        <DashboardStat label="Premium" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'premium').length} tone="amber" />
        <DashboardStat label="MRR" value={formatEuro(contrattiAttivi.reduce((sum, c) => sum + Number(c.ricavo_mensile || 0), 0))} tone="emerald" />
        <DashboardStat label="ARR" value={formatEuro(contrattiAttivi.reduce((sum, c) => sum + Number(c.ricavo_annuo || 0), 0))} tone="sky" />
      </div>

      <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {contrattiAttivi.length === 0 ? (
          <EmptyState icon="📑" title="Nessun contratto attivo trovato" text="Appena attiverai un contratto CSP, comparirà qui in una card consultabile." action="Archivio pronto" tone="slate" />
        ) : (
          contrattiAttivi.map((contratto) => {
            const condominio = contratto.condominio;
            const pianoContratto = getPianoContratto(contratto);
            const config = PIANI_ABBONAMENTO[pianoContratto] || PIANI_ABBONAMENTO.base;
            return (
              <button key={contratto.id || `${contratto.condominio_id}-${contratto.piano}`} type="button" onClick={() => setContrattoSelezionato(contratto)} className={`w-full rounded-[1.75rem] border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${contrattoTone(contratto)}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${contrattoBadge(contratto)}`}>{config.nome}</span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${String(contratto.stato || 'attivo').toLowerCase().trim() === 'sospeso' ? 'border-red-200 bg-red-100 text-red-800' : 'border-white/70 bg-white/75 text-slate-600'}`}>
                        {String(contratto.stato || 'attivo').toLowerCase().trim() === 'sospeso' ? 'Sospeso' : 'Attivo'}
                      </span>
                    </div>
                    <h3 className="mt-3 truncate text-lg font-black text-slate-900">{nomeCondominio(condominio)}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{[condominio?.indirizzo, condominio?.citta].filter(Boolean).join(', ') || 'Indirizzo non indicato'}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-right sm:min-w-[300px]">
                    <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">Famiglie</p><p className="text-sm font-black text-slate-900">{contratto.famiglie || getNumeroFamiglieCondominio(condominio) || '—'}</p></div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">MRR</p><p className="text-sm font-black text-slate-900">{formatEuro(contratto.ricavo_mensile)}</p></div>
                    <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm"><p className="text-[10px] font-black uppercase text-slate-400">ARR</p><p className="text-sm font-black text-slate-900">{formatEuro(contratto.ricavo_annuo)}</p></div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
      {renderContrattoModal()}
    </section>
  );
}

function GestioneContratti({ condomini, contratti, onCreateContratto, onRinnovaContratto, onUpgradeContratto, onSospendiContratto, onRiattivaContratto }) {
  const [condominioId, setCondominioId] = useState('');
  const [piano, setPiano] = useState('plus');
  const [famiglie, setFamiglie] = useState('');
  const [famiglieAutocompilate, setFamiglieAutocompilate] = useState(false);
  const [ricercaContratti, setRicercaContratti] = useState('');
  const [filtroPianoContratti, setFiltroPianoContratti] = useState('');
  const [contrattoSelezionato, setContrattoSelezionato] = useState(null);

  const condominioSelezionato = (condomini || []).find((c) => Number(c.id) === Number(condominioId));
  const pianoConfig = PIANI_ABBONAMENTO[piano] || PIANI_ABBONAMENTO.plus;
  const famiglieNum = Number(famiglie || 0);
  const ricavoMensile = famiglieNum * pianoConfig.costo;
  const ricavoAnnuale = ricavoMensile * 12;
  const pianoAttuale = condominioId ? getPianoAbbonamentoCondominio(condominioId, contratti) : 'base';
  const subscriptionFlags = getSubscriptionFlags(pianoAttuale);

  const nomeCondominio = (condominio) => condominio?.nome || condominio?.name || (condominio?.id ? `Condominio #${condominio.id}` : 'Condominio');
  const condominioById = (id) => (condomini || []).find((c) => Number(c.id) === Number(id));
  const getContrattoCondominio = (contratto) => condominioById(contratto?.condominio_id);
  const getPianoContratto = (contratto) => normalizzaPianoAbbonamento(contratto?.piano);
  const contrattoTone = (contratto) => {
    const pianoContratto = getPianoContratto(contratto);
    if (pianoContratto === 'premium') return 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 text-amber-900 ring-1 ring-amber-100';
    if (pianoContratto === 'plus') return 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 text-sky-900 ring-1 ring-sky-100';
    return 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-white text-slate-900 ring-1 ring-slate-100';
  };
  const contrattoBadge = (contratto) => {
    const statoContratto = String(contratto?.stato || 'attivo').toLowerCase().trim();
    if (statoContratto === 'sospeso') return 'border-red-200 bg-red-100 text-red-800';
    const pianoContratto = getPianoContratto(contratto);
    if (pianoContratto === 'premium') return 'border-amber-200 bg-amber-100 text-amber-800';
    if (pianoContratto === 'plus') return 'border-sky-200 bg-sky-100 text-sky-800';
    return 'border-slate-200 bg-slate-100 text-slate-700';
  };

  const contrattiAttivi = (contratti || [])
    .filter((contratto) => {
      const stato = String(contratto.stato || 'attivo').toLowerCase().trim();
      return !['scaduto', 'disdetto', 'annullato', 'annullata'].includes(stato);
    })
    .map((contratto) => ({ ...contratto, condominio: getContrattoCondominio(contratto) }))
    .filter((contratto) => {
      const q = ricercaContratti.toLowerCase().trim();
      const pianoContratto = getPianoContratto(contratto);
      const nome = nomeCondominio(contratto.condominio).toLowerCase();
      const indirizzo = String(contratto.condominio?.indirizzo || '').toLowerCase();
      const matchRicerca = !q || nome.includes(q) || indirizzo.includes(q) || String(contratto.condominio_id || '').includes(q);
      const matchPiano = !filtroPianoContratti || pianoContratto === filtroPianoContratti;
      return matchRicerca && matchPiano;
    })
    .sort((a, b) => nomeCondominio(a.condominio).localeCompare(nomeCondominio(b.condominio), 'it'));

  const selezionaCondominio = (value) => {
    setCondominioId(value);
    const condominio = (condomini || []).find((c) => Number(c.id) === Number(value));
    const numeroFamiglie = getNumeroFamiglieCondominio(condominio);

    if (numeroFamiglie > 0) {
      setFamiglie(String(numeroFamiglie));
      setFamiglieAutocompilate(true);
    } else {
      setFamiglie('');
      setFamiglieAutocompilate(false);
    }
  };

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
    setFamiglieAutocompilate(false);
    setPiano('plus');
  };

  return (
    <section className="space-y-4">
      <section className="hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Contratti CSP</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Condomìni con contratto attivo o sospeso</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Archivio rapido degli abbonamenti attivi. Le card sono cliccabili e aprono la scheda contratto.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-[520px]">
            <input
              value={ricercaContratti}
              onChange={(e) => setRicercaContratti(e.target.value)}
              placeholder="Cerca condominio o indirizzo..."
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <select
              value={filtroPianoContratti}
              onChange={(e) => setFiltroPianoContratti(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Tutti i piani</option>
              <option value="base">Base</option>
              <option value="plus">Plus</option>
              <option value="premium">Premium</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
          <DashboardStat label="Attivi" value={contrattiAttivi.length} tone="emerald" />
          <DashboardStat label="Base" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'base').length} tone="slate" />
          <DashboardStat label="Plus" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'plus').length} tone="sky" />
          <DashboardStat label="Premium" value={contrattiAttivi.filter((c) => getPianoContratto(c) === 'premium').length} tone="amber" />
          <DashboardStat label="MRR" value={formatEuro(contrattiAttivi.reduce((sum, c) => sum + Number(c.ricavo_mensile || 0), 0))} tone="emerald" />
          <DashboardStat label="ARR" value={formatEuro(contrattiAttivi.reduce((sum, c) => sum + Number(c.ricavo_annuo || 0), 0))} tone="sky" />
        </div>

        <div className="mt-4 max-h-[500px] space-y-3 overflow-y-auto pr-1 csp-scroll">
          {contrattiAttivi.length === 0 ? (
            <EmptyState icon="📑" title="Nessun contratto attivo trovato" text="Appena attiverai un contratto CSP, comparirà qui in una card consultabile." action="Archivio pronto" tone="slate" />
          ) : (
            contrattiAttivi.map((contratto) => {
              const condominio = contratto.condominio;
              const pianoContratto = getPianoContratto(contratto);
              const config = PIANI_ABBONAMENTO[pianoContratto] || PIANI_ABBONAMENTO.base;
              return (
                <button
                  key={contratto.id || `${contratto.condominio_id}-${contratto.piano}`}
                  type="button"
                  onClick={() => setContrattoSelezionato(contratto)}
                  className={`w-full rounded-[1.75rem] border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${contrattoTone(contratto)}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${contrattoBadge(contratto)}`}>
                          {config.nome}
                        </span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${String(contratto.stato || 'attivo').toLowerCase().trim() === 'sospeso' ? 'border-red-200 bg-red-100 text-red-800' : 'border-white/70 bg-white/75 text-slate-600'}`}>
                          {String(contratto.stato || 'attivo').toLowerCase().trim() === 'sospeso' ? 'Sospeso' : 'Attivo'}
                        </span>
                      </div>
                      <h3 className="mt-3 truncate text-lg font-black text-slate-900">{nomeCondominio(condominio)}</h3>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{condominio?.indirizzo || condominio?.citta || 'Indirizzo non indicato'}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-right sm:min-w-[300px]">
                      <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400">Famiglie</p>
                        <p className="text-sm font-black text-slate-900">{contratto.famiglie || getNumeroFamiglieCondominio(condominio) || '—'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400">MRR</p>
                        <p className="text-sm font-black text-slate-900">{formatEuro(contratto.ricavo_mensile)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/75 px-3 py-2 shadow-sm">
                        <p className="text-[10px] font-black uppercase text-slate-400">ARR</p>
                        <p className="text-sm font-black text-slate-900">{formatEuro(contratto.ricavo_annuo)}</p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Contratti</p>
        <h2 className="mt-1 text-xl font-bold">Attiva nuovo abbonamento</h2>
        <p className="mt-1 text-sm text-slate-500">Gestione commerciale ricorrente Condominio Senza Pensieri.</p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <select value={condominioId} onChange={(e) => selezionaCondominio(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
            <option value="">Seleziona condominio</option>
            {(condomini || []).map((c) => (
              <option key={c.id} value={c.id}>{c.nome || c.name || `Condominio #${c.id}`}</option>
            ))}
          </select>

          {condominioId && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              Piano attuale: {subscriptionFlags.config.nome} • Famiglie censite: {getNumeroFamiglieCondominio(condominioSelezionato) || 'non indicate'}
            </div>
          )}

          <select value={piano} onChange={(e) => setPiano(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
            <option value="base">Base</option>
            <option value="plus">Plus</option>
            <option value="premium">Premium</option>
          </select>

          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Famiglie</span>
            <input
              type="number"
              min="1"
              placeholder="Numero famiglie"
              value={famiglie}
              onChange={(e) => {
                setFamiglie(e.target.value);
                setFamiglieAutocompilate(false);
              }}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3"
            />
            <span className="mt-1 block text-xs font-semibold text-slate-500">
              {famiglieAutocompilate
                ? 'Compilato automaticamente dall’anagrafica del condominio. Puoi modificarlo se necessario.'
                : 'Il valore può essere corretto manualmente prima dell’attivazione.'}
            </span>
          </label>

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm font-semibold">Riepilogo economico</p>
            <p className="text-sm text-slate-600">Costo unitario mensile: {formatEuro(pianoConfig.costo)}</p>
            <p className="text-sm text-slate-600">MRR: {formatEuro(ricavoMensile)}</p>
            <p className="text-sm text-slate-600">ARR: {formatEuro(ricavoAnnuale)}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Provvigione amministratore su interventi pagati: {Math.round((pianoConfig.provvigione || 0) * 100)}%</p>
          </div>

          <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-bold text-white">
            Attiva contratto
          </button>
        </form>
      </section>

      {contrattoSelezionato && (() => {
        const contratto = contrattoSelezionato;
        const condominio = contratto.condominio || getContrattoCondominio(contratto);
        const pianoContratto = getPianoContratto(contratto);
        const config = PIANI_ABBONAMENTO[pianoContratto] || PIANI_ABBONAMENTO.base;
        return (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setContrattoSelezionato(null)}>
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 csp-enter csp-scroll" onClick={(e) => e.stopPropagation()}>
              <div className={`rounded-[1.75rem] border p-5 ${contrattoTone(contratto)}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Scheda contratto CSP</p>
                    <h2 className="mt-1 text-2xl font-black text-slate-900">{nomeCondominio(condominio)}</h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{condominio?.indirizzo || condominio?.citta || 'Indirizzo non indicato'}</p>
                  </div>
                  <span className={`w-fit rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${contrattoBadge(contratto)}`}>
                    {String(contratto.stato || '').toLowerCase().trim() === 'sospeso' ? 'Sospeso' : config.nome}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <DashboardStat label="Famiglie" value={contratto.famiglie || getNumeroFamiglieCondominio(condominio) || '—'} tone="slate" />
                  <DashboardStat label="MRR" value={formatEuro(contratto.ricavo_mensile)} tone="emerald" />
                  <DashboardStat label="ARR" value={formatEuro(contratto.ricavo_annuo)} tone="sky" />
                  <DashboardStat label="Provvigione" value={`${Math.round((config.provvigione || 0) * 100)}%`} tone="amber" />
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Decorrenza</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{contratto.data_attivazione ? new Date(contratto.data_attivazione).toLocaleDateString('it-IT') : 'Non indicata'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Scadenza</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{contratto.data_scadenza ? new Date(contratto.data_scadenza).toLocaleDateString('it-IT') : 'Non indicata'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Stato</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{contratto.stato || 'attivo'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Rinnovo automatico</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{isValoreVero(contratto.rinnovo_automatico) ? 'Attivo' : 'Non indicato'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {typeof onRinnovaContratto === 'function' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onRinnovaContratto(contratto);
                      setContrattoSelezionato(null);
                    }}
                    className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
                  >
                    Rinnova contratto
                  </button>
                )}
                {pianoContratto !== 'premium' && typeof onUpgradeContratto === 'function' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpgradeContratto(contratto);
                      setContrattoSelezionato(null);
                    }}
                    className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-amber-900/20 transition hover:-translate-y-0.5"
                  >
                    Porta a Premium
                  </button>
                )}
                {String(contratto.stato || '').toLowerCase().trim() !== 'sospeso' && typeof onSospendiContratto === 'function' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const conferma = window.confirm('Sospendere questo contratto per mancato pagamento? Potrai riattivarlo da questa stessa lista.');
                        if (!conferma) return;
                        await onSospendiContratto(contratto);
                        setContrattoSelezionato(null);
                      }}
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5"
                    >
                      Sospendi per mancato pagamento
                    </button>
                  ) : typeof onRiattivaContratto === 'function' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const conferma = window.confirm('Riattivare questo contratto e riportarlo tra gli attivi?');
                        if (!conferma) return;
                        await onRiattivaContratto(contratto);
                        setContrattoSelezionato(null);
                      }}
                      className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:-translate-y-0.5"
                    >
                      Riattiva contratto
                    </button>
                  ) : null}
                <button
                  type="button"
                  onClick={() => setContrattoSelezionato(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5"
                >
                  Chiudi scheda
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {inScadenza.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <EmptyState icon="⏳" title="Nessuna scadenza vicina" text="Non risultano contratti in scadenza nei prossimi 30 giorni." action="Agenda libera" tone="emerald" />
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
            <EmptyState icon="📈" title="Nessun dato disponibile" text="Appena saranno presenti dati utili, questa sezione mostrerà indicatori e andamento in modo chiaro." action="Dashboard pronta" tone="amber" />
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

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {opportunita.length === 0 ? (
          <EmptyState icon="✨" title="Nessun dato disponibile" text="Quando ci saranno informazioni da mostrare, compariranno qui in una vista ordinata e facile da leggere." action="Tutto pronto" tone="slate" />
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

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {ranking.length === 0 ? (
          <EmptyState icon="✨" title="Nessun dato disponibile" text="Quando ci saranno informazioni da mostrare, compariranno qui in una vista ordinata e facile da leggere." action="Tutto pronto" tone="slate" />
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
            <EmptyState icon="🎯" title="Nessun prospect disponibile" text="Quando inserirai nuovi contatti o opportunità commerciali, li vedrai qui con stato e priorità." action="Pipeline pronta" tone="blue" />
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

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {ranking.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            <EmptyState icon="📑" title="Nessun contratto disponibile" text="I contratti saranno visualizzati qui appena disponibili." action="Archivio pronto" tone="slate" />
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
  const [csvText, setCsvText] = useState('');
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvMessage, setCsvMessage] = useState('');
  const [form, setForm] = useState({
    nome_studio: '',
    referente: '',
    telefono: '',
    email: '',
    provincia: 'Firenze',
    citta: '',
    indirizzo: '',
    numero_condomini: '',
    numero_condomini_interessati: '',
    origine: 'LinkedIn',
    stato_pipeline: 'potenziale',
    data_appuntamento: '',
    ora_appuntamento: '',
    luogo_incontro: '',
    note: '',
  });

  const numeroCondomini = Number(form.numero_condomini || 0);
  const numeroCondominiInteressati = Number(form.numero_condomini_interessati || 0);
  const VALORE_ANNUO_CONDOMINIO_CRM = 10 * 9.90 * 12;
  const valorePotenziale = numeroCondominiInteressati * VALORE_ANNUO_CONDOMINIO_CRM;
  const percentualeInteressati = numeroCondomini ? Math.round((numeroCondominiInteressati / numeroCondomini) * 100) : 0;

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'indirizzo' || field === 'citta') {
        const indirizzo = field === 'indirizzo' ? value : next.indirizzo;
        const citta = field === 'citta' ? value : next.citta;
        const luogoAutomatico = [indirizzo, citta].filter(Boolean).join(', ');

        if (!prev.luogo_incontro || prev.luogo_incontro === [prev.indirizzo, prev.citta].filter(Boolean).join(', ')) {
          next.luogo_incontro = luogoAutomatico;
        }
      }

      if (field === 'data_appuntamento' || field === 'ora_appuntamento') {
        next.stato_pipeline = next.stato_pipeline === 'potenziale' ? 'presentazione_effettuata' : next.stato_pipeline;
      }

      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nome_studio.trim()) return;

    await onCreateLead({
      ...form,
      data_appuntamento: form.data_appuntamento || null,
      ora_appuntamento: form.ora_appuntamento || null,
      prossimo_followup: form.prossimo_followup || null,
      numero_condomini: numeroCondomini,
      numero_condomini_interessati: numeroCondominiInteressati,
      valore_potenziale: valorePotenziale,
    });

    setForm({
      nome_studio: '',
      referente: '',
      telefono: '',
      email: '',
      provincia: 'Firenze',
      citta: '',
      indirizzo: '',
      numero_condomini: '',
      numero_condomini_interessati: '',
      origine: 'LinkedIn',
      stato_pipeline: 'potenziale',
      data_appuntamento: '',
      ora_appuntamento: '',
      luogo_incontro: '',
      note: '',
    });
  };

  const normalizzaChiaveCsv = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[àá]/g, 'a')
    .replace(/[èé]/g, 'e')
    .replace(/[ìí]/g, 'i')
    .replace(/[òó]/g, 'o')
    .replace(/[ùú]/g, 'u');

  const parseCsvLine = (line, separator) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.replace(/^"|"$/g, '').trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.replace(/^"|"$/g, '').trim());
    return result;
  };

  const importaCsvLead = async () => {
    const righe = csvText.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);

    if (righe.length < 2) {
      setCsvMessage('Inserisci almeno intestazione e una riga dati.');
      return;
    }

    try {
      setCsvImporting(true);
      setCsvMessage('');

      const separator = righe[0].includes(';') ? ';' : ',';
      const headers = parseCsvLine(righe[0], separator).map(normalizzaChiaveCsv);

      const getValue = (row, aliases) => {
        for (const alias of aliases) {
          const index = headers.indexOf(alias);
          if (index >= 0) return row[index] || '';
        }
        return '';
      };

      let importati = 0;

      for (const riga of righe.slice(1)) {
        const row = parseCsvLine(riga, separator);
        const nomeStudio = getValue(row, ['nome_studio', 'studio', 'cliente', 'amministratore', 'nome']);

        if (!nomeStudio) continue;

        const numero = Number(getValue(row, ['numero_condomini', 'condomini', 'n_condomini']) || 0);
        const numeroInteressati = Number(getValue(row, ['numero_condomini_interessati', 'condomini_interessati', 'interessati']) || 0);
        const citta = getValue(row, ['citta', 'comune']);
        const indirizzo = getValue(row, ['indirizzo', 'via']);
        const luogo = getValue(row, ['luogo_incontro', 'luogo']) || [indirizzo, citta].filter(Boolean).join(', ');

        await onCreateLead({
          nome_studio: nomeStudio,
          referente: getValue(row, ['referente', 'contatto']),
          telefono: getValue(row, ['telefono', 'cellulare', 'phone']),
          email: getValue(row, ['email', 'mail']),
          provincia: getValue(row, ['provincia', 'prov']) || 'Firenze',
          citta,
          indirizzo,
          numero_condomini: numero,
          origine: getValue(row, ['origine', 'fonte']) || 'CSV',
          stato_pipeline: getValue(row, ['stato_pipeline', 'stato']) || 'prospect',
          data_appuntamento: getValue(row, ['data_appuntamento', 'appuntamento', 'data_incontro']) || null,
          ora_appuntamento: getValue(row, ['ora_appuntamento', 'ora_incontro', 'ora']) || null,
          luogo_incontro: luogo,
          note: getValue(row, ['note', 'annotazioni']),
          valore_potenziale: numeroInteressati * 10 * 9.90 * 12,
        });

        importati += 1;
      }

      setCsvText('');
      setCsvMessage(`Import completato: ${importati} lead inseriti.`);
    } catch (error) {
      console.error(error);
      setCsvMessage('Errore import CSV: ' + (error.message || 'sconosciuto'));
    } finally {
      setCsvImporting(false);
    }
  };

  const leggiFileCsv = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result || ''));
    reader.readAsText(file);
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
          <input value={form.citta} onChange={(e) => update('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-slate-200 px-3 py-3" />
          <input value={form.indirizzo} onChange={(e) => update('indirizzo', e.target.value)} placeholder="Indirizzo studio" className="rounded-2xl border border-slate-200 px-3 py-3" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input type="number" min="0" value={form.numero_condomini} onChange={(e) => update('numero_condomini', e.target.value)} placeholder="Condomini totali amministrati" className="rounded-2xl border border-slate-200 px-3 py-3" />
          <input type="number" min="0" value={form.numero_condomini_interessati} onChange={(e) => update('numero_condomini_interessati', e.target.value)} placeholder="Nr. condomìni interessati" className="rounded-2xl border border-slate-200 px-3 py-3" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <select value={form.origine} onChange={(e) => update('origine', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
            <option>LinkedIn</option><option>Sito</option><option>Referral</option><option>Telefono</option><option>Email</option><option>Evento</option>
          </select>
          <select value={form.stato_pipeline} onChange={(e) => update('stato_pipeline', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
            <option value="potenziale">Potenziale</option>
            <option value="presentazione_effettuata">Presentazione effettuata</option>
            <option value="follow_up_richiesto">Follow up richiesto</option>
            <option value="richiesta_preventivo">Richiesta preventivo</option>
            <option value="preventivo_inviato">Preventivo inviato</option>
            <option value="operativo">Operativo</option>
            <option value="non_interessato">Non interessato</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Prossimo incontro previsto
            <input type="date" value={form.data_appuntamento} onChange={(e) => update('data_appuntamento', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800" />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Ora incontro
            <input type="time" value={form.ora_appuntamento} onChange={(e) => update('ora_appuntamento', e.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-800" />
          </label>
          <input value={form.luogo_incontro} onChange={(e) => update('luogo_incontro', e.target.value)} placeholder="Luogo incontro automatico: indirizzo + città" className="rounded-2xl border border-slate-200 px-3 py-3" />
        </div>
        <textarea value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Note commerciali" className="min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-3" />
        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
          <p className="text-sm font-bold text-cyan-800">Potenziale guadagno annuo</p>
          <p className="mt-1 text-2xl font-black text-cyan-700">{formatEuro(valorePotenziale)}</p>
          <p className="mt-1 text-xs font-semibold text-cyan-700">
            Calcolo: {numeroCondominiInteressati} condomìni interessati × 10 famiglie × €9,90/mese × 12 mesi
          </p>
          <p className="mt-1 text-xs font-black text-cyan-800">
            Incidenza interessati: {percentualeInteressati}%
          </p>
        </div>
        <button type="submit" className="w-full rounded-2xl bg-cyan-700 px-4 py-3 font-bold text-white">Salva lead</button>
      </form>

      <div className="mt-5 rounded-3xl border border-cyan-100 bg-cyan-50 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Import CSV</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Importa lista lead</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Intestazioni accettate: nome_studio, referente, telefono, email, provincia, citta, indirizzo, numero_condomini, numero_condomini_interessati, origine, stato, data_appuntamento, ora_appuntamento, note.
            </p>
          </div>
          <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-black text-cyan-700 shadow-sm">
            Carica file CSV
            <input type="file" accept=".csv,text/csv" onChange={(e) => leggiFileCsv(e.target.files?.[0])} className="hidden" />
          </label>
        </div>

        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={"nome_studio;referente;telefono;email;provincia;citta;indirizzo;numero_condomini;numero_condomini_interessati;origine;note\nStudio Rossi;Mario Rossi;333...;mail@studio.it;Firenze;Firenze;Via Roma 1;25;8;LinkedIn;Interessato a CSP"}
          className="mt-3 min-h-32 w-full rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" onClick={importaCsvLead} disabled={csvImporting} className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
            {csvImporting ? 'Import in corso...' : 'Importa CSV'}
          </button>
          {csvMessage && <p className="text-xs font-bold text-cyan-800">{csvMessage}</p>}
        </div>
      </div>
    </section>
  );
}


function DashboardLeadTecnici({ leadTecnici = [], onCreateLeadTecnico, onUpdateLeadTecnico, onImportLeadTecnici }) {
  const emptyForm = { nome: '', cognome: '', studio_tecnico: '', email: '', telefono: '', indirizzo: '', citta: '', provincia: '', note: '' };
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [provinciaFiltro, setProvinciaFiltro] = useState('');
  const [importText, setImportText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const provinceDisponibili = [...new Set((leadTecnici || []).map((tecnico) => tecnico.provincia).filter(Boolean))].sort();
  const filtrati = (leadTecnici || []).filter((tecnico) => {
    const haystack = [tecnico.nome, tecnico.cognome, tecnico.studio_tecnico, tecnico.email, tecnico.telefono, tecnico.indirizzo, tecnico.citta, tecnico.provincia, tecnico.note].join(' ').toLowerCase();
    return (!search || haystack.includes(search.toLowerCase())) && (!provinciaFiltro || tecnico.provincia === provinciaFiltro);
  });
  const parseImportRows = () => importText.split('\n').map((row) => row.trim()).filter(Boolean).map((row) => {
    const parts = row.includes(';') ? row.split(';') : row.split(',');
    return { nome: String(parts[0] || '').trim(), cognome: String(parts[1] || '').trim(), studio_tecnico: String(parts[2] || '').trim(), email: String(parts[3] || '').trim(), telefono: String(parts[4] || '').trim(), indirizzo: String(parts[5] || '').trim(), citta: String(parts[6] || '').trim(), provincia: String(parts[7] || '').trim(), note: String(parts.slice(8).join(' ') || '').trim() };
  });
  const exportCsv = () => {
    const headers = ['nome', 'cognome', 'studio_tecnico', 'email', 'telefono', 'indirizzo', 'citta', 'provincia', 'note'];
    const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const rows = [headers.join(';'), ...filtrati.map((tecnico) => headers.map((header) => escapeCsv(tecnico[header])).join(';'))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-tecnici-casp-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const startEdit = (tecnico) => { setEditingId(tecnico.id); setForm({ nome: tecnico.nome || '', cognome: tecnico.cognome || '', studio_tecnico: tecnico.studio_tecnico || '', email: tecnico.email || '', telefono: tecnico.telefono || '', indirizzo: tecnico.indirizzo || '', citta: tecnico.citta || '', provincia: tecnico.provincia || '', note: tecnico.note || '' }); };
  const reset = () => { setEditingId(null); setForm(emptyForm); };
  return (
    <section className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">CRM Tecnici CaSP</p><h2 className="mt-1 text-xl font-black text-slate-900">Tecnici e studi tecnici</h2><p className="mt-1 text-sm font-semibold text-slate-500">Archivio tecnico-commerciale per newsletter, campagne CaSP e futuri cantieri.</p></div><button type="button" onClick={exportCsv} className="rounded-2xl bg-slate-900 px-4 py-3 text-xs font-black text-white">Esporta CSV</button></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <form className="grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 md:grid-cols-2" onSubmit={async (event) => { event.preventDefault(); if (editingId) { await onUpdateLeadTecnico(editingId, form); } else { await onCreateLeadTecnico(form); } reset(); }}>
          <input value={form.nome} onChange={(e) => updateField('nome', e.target.value)} placeholder="Nome" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.cognome} onChange={(e) => updateField('cognome', e.target.value)} placeholder="Cognome" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.studio_tecnico} onChange={(e) => updateField('studio_tecnico', e.target.value)} placeholder="Studio tecnico" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="Email" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.telefono} onChange={(e) => updateField('telefono', e.target.value)} placeholder="Telefono" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.indirizzo} onChange={(e) => updateField('indirizzo', e.target.value)} placeholder="Indirizzo" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.citta} onChange={(e) => updateField('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <input value={form.provincia} onChange={(e) => updateField('provincia', e.target.value)} placeholder="Provincia" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" />
          <textarea value={form.note} onChange={(e) => updateField('note', e.target.value)} placeholder="Note" className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm md:col-span-2" />
          <div className="flex flex-wrap gap-2 md:col-span-2"><button className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white">{editingId ? 'Aggiorna tecnico' : 'Salva tecnico'}</button>{editingId && <button type="button" onClick={reset} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Annulla</button>}</div>
        </form>
        <form className="space-y-3 rounded-3xl border border-emerald-100 bg-emerald-50 p-4" onSubmit={async (event) => { event.preventDefault(); await onImportLeadTecnici(parseImportRows()); setImportText(''); }}>
          <div><p className="text-sm font-black text-emerald-900">Importa lista Excel/CSV</p><p className="mt-1 text-xs font-semibold text-emerald-700">Formato: nome; cognome; studio; email; telefono; indirizzo; città; provincia; note</p></div>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={8} className="w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm" placeholder="Mario; Rossi; Studio Rossi; mario@email.it; 333...; Via Roma 1; Pisa; PI; Interessato a CaSP" />
          <button className="rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white">Importa tecnici</button>
        </form>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-sky-50 p-4"><p className="text-xs font-black uppercase text-sky-700">Totale</p><p className="mt-1 text-2xl font-black text-slate-900">{leadTecnici.length}</p></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase text-emerald-700">Filtrati</p><p className="mt-1 text-2xl font-black text-slate-900">{filtrati.length}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs font-black uppercase text-amber-700">Province</p><p className="mt-1 text-2xl font-black text-slate-900">{provinceDisponibili.length}</p></div><div className="rounded-2xl bg-violet-50 p-4"><p className="text-xs font-black uppercase text-violet-700">Newsletter</p><p className="mt-1 text-sm font-black text-slate-900">Pronto per AI Marketing</p></div></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca tecnico, studio, città..." className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm" /><select value={provinciaFiltro} onChange={(e) => setProvinciaFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm"><option value="">Tutte le province</option>{provinceDisponibili.map((provincia) => <option key={provincia} value={provincia}>{provincia}</option>)}</select></div>
      <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">{filtrati.length === 0 ? (<EmptyState icon="📐" title="Nessun tecnico presente" text="Inserisci tecnici dalle pratiche CaSeP, manualmente o tramite import CSV." action="CRM pronto" tone="sky" />) : filtrati.map((tecnico) => (<div key={tecnico.id || tecnico.email} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-black text-slate-900">{[tecnico.nome, tecnico.cognome].filter(Boolean).join(' ') || tecnico.email || 'Tecnico'}</p><p className="mt-1 text-xs font-bold text-slate-500">{tecnico.studio_tecnico || 'Studio non indicato'} • {tecnico.citta || 'Città n.d.'} {tecnico.provincia ? `(${tecnico.provincia})` : ''}</p><p className="mt-1 text-xs font-semibold text-slate-500">{tecnico.email || 'Email n.d.'} • {tecnico.telefono || 'Telefono n.d.'}</p>{tecnico.note && <p className="mt-2 text-xs font-semibold text-slate-600">{tecnico.note}</p>}</div><button type="button" onClick={() => startEdit(tecnico)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-sky-700 ring-1 ring-sky-100">Modifica</button></div></div>))}</div>
    </section>
  );
}

function DashboardLeadAmministratori({ leadAmministratori, onUpdateLead }) {
  const [leadInModifica, setLeadInModifica] = useState(null);
  const [formLead, setFormLead] = useState({
    stato_pipeline: '',
    prossimo_followup: '',
    data_appuntamento: '',
    ora_appuntamento: '',
    luogo_incontro: '',
    citta: '',
    indirizzo: '',
    telefono: '',
    email: '',
    note: '',
    numero_condomini: '',
    numero_condomini_interessati: '',
    valore_potenziale: '',
  });
  const [leadSearch, setLeadSearch] = useState('');
  const [leadProvinciaFiltro, setLeadProvinciaFiltro] = useState('');
  const [leadStatoFiltro, setLeadStatoFiltro] = useState('');

  const VALORE_ANNUO_CONDOMINIO_CRM = 10 * 9.90 * 12;
  const totale = leadAmministratori.length;
  const presentazioni = leadAmministratori.filter((l) => l.stato_pipeline === 'presentazione_effettuata').length;
  const preventivi = leadAmministratori.filter((l) => ['richiesta_preventivo', 'preventivo_inviato'].includes(l.stato_pipeline)).length;
  const operativi = leadAmministratori.filter((l) => l.stato_pipeline === 'operativo').length;
  const pipelineCondominiTotali = leadAmministratori.reduce((sum, l) => sum + Number(l.numero_condomini || 0), 0);
  const pipelineCondominiInteressati = leadAmministratori.reduce((sum, l) => sum + Number(l.numero_condomini_interessati || 0), 0);
  const percentualePipelineInteressati = pipelineCondominiTotali ? Math.round((pipelineCondominiInteressati / pipelineCondominiTotali) * 100) : 0;
  const mediaCondominiInteressatiLead = totale ? Math.round((pipelineCondominiInteressati / totale) * 10) / 10 : 0;
  const valorePipeline = pipelineCondominiInteressati * VALORE_ANNUO_CONDOMINIO_CRM;

  const statiLead = [
    ['potenziale', 'Potenziale'],
    ['presentazione_effettuata', 'Presentazione effettuata'],
    ['follow_up_richiesto', 'Follow up richiesto'],
    ['richiesta_preventivo', 'Richiesta preventivo'],
    ['preventivo_inviato', 'Preventivo inviato'],
    ['operativo', 'Operativo'],
    ['non_interessato', 'Non interessato'],
  ];

  const provinceDisponibili = [...new Set((leadAmministratori || []).map((lead) => lead.provincia).filter(Boolean))].sort();

  const leadFiltrati = (leadAmministratori || [])
    .filter((lead) => {
      const search = leadSearch.toLowerCase().trim();
      const matchSearch = !search || [
        lead.nome_studio,
        lead.referente,
        lead.email,
        lead.telefono,
        lead.citta,
        lead.indirizzo,
      ].some((value) => String(value || '').toLowerCase().includes(search));

      const matchProvincia = !leadProvinciaFiltro || lead.provincia === leadProvinciaFiltro;
      const matchStato = !leadStatoFiltro || lead.stato_pipeline === leadStatoFiltro;

      return matchSearch && matchProvincia && matchStato;
    })
    .sort((a, b) => {
      const dataA = a.data_appuntamento || a.prossimo_followup || '';
      const dataB = b.data_appuntamento || b.prossimo_followup || '';
      return String(dataA).localeCompare(String(dataB));
    });

  const apriModificaLead = (lead) => {
    setLeadInModifica(lead);
    setFormLead({
      stato_pipeline: lead.stato_pipeline || 'potenziale',
      prossimo_followup: lead.prossimo_followup ? String(lead.prossimo_followup).slice(0, 10) : '',
      data_appuntamento: lead.data_appuntamento ? String(lead.data_appuntamento).slice(0, 10) : '',
      ora_appuntamento: lead.ora_appuntamento ? String(lead.ora_appuntamento).slice(0, 5) : '',
      luogo_incontro: lead.luogo_incontro || '',
      citta: lead.citta || '',
      indirizzo: lead.indirizzo || '',
      telefono: lead.telefono || '',
      email: lead.email || '',
      note: lead.note || '',
      numero_condomini: lead.numero_condomini || '',
      numero_condomini_interessati: lead.numero_condomini_interessati || '',
      valore_potenziale: lead.valore_potenziale || '',
    });
  };

  const aggiornaFormLead = (field, value) => {
    setFormLead((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'numero_condomini_interessati') {
        const numero = Number(value || 0);
        next.valore_potenziale = numero * VALORE_ANNUO_CONDOMINIO_CRM;
      }

      if (field === 'indirizzo' || field === 'citta') {
        const indirizzo = field === 'indirizzo' ? value : next.indirizzo;
        const citta = field === 'citta' ? value : next.citta;
        const luogoAutomatico = [indirizzo, citta].filter(Boolean).join(', ');
        const vecchioLuogoAutomatico = [prev.indirizzo, prev.citta].filter(Boolean).join(', ');

        if (!prev.luogo_incontro || prev.luogo_incontro === vecchioLuogoAutomatico) {
          next.luogo_incontro = luogoAutomatico;
        }
      }

      if (field === 'data_appuntamento' || field === 'ora_appuntamento') {
        next.stato_pipeline = next.stato_pipeline === 'potenziale' ? 'presentazione_effettuata' : next.stato_pipeline;
      }

      return next;
    });
  };

  const salvaModificaLead = async () => {
    if (!leadInModifica?.id) return;

    await onUpdateLead(leadInModifica.id, {
      stato_pipeline: formLead.stato_pipeline,
      prossimo_followup: formLead.prossimo_followup || null,
      data_appuntamento: formLead.data_appuntamento || null,
      ora_appuntamento: formLead.ora_appuntamento || null,
      luogo_incontro: formLead.luogo_incontro,
      citta: formLead.citta,
      indirizzo: formLead.indirizzo,
      telefono: formLead.telefono,
      email: formLead.email,
      note: formLead.note,
      numero_condomini: Number(formLead.numero_condomini || 0),
      numero_condomini_interessati: Number(formLead.numero_condomini_interessati || 0),
      valore_potenziale: Number(formLead.valore_potenziale || 0),
    });

    setLeadInModifica(null);
  };

  const creaLinkGoogleCalendar = (lead) => {
    const data = lead.data_appuntamento || formLead.data_appuntamento;
    const ora = lead.ora_appuntamento || formLead.ora_appuntamento || '09:00';

    if (!data) {
      return '';
    }

    const start = new Date(`${data}T${ora || '09:00'}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const toGoogleDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

    const location = lead.luogo_incontro || [lead.indirizzo, lead.citta].filter(Boolean).join(', ') || [lead.citta, lead.provincia].filter(Boolean).join(', ');
    const details = [
      'Presentazione Condominio Senza Pensieri',
      '',
      `Studio: ${lead.nome_studio || ''}`,
      `Referente: ${lead.referente || ''}`,
      `Telefono: ${lead.telefono || ''}`,
      `Email: ${lead.email || ''}`,
      `Città: ${lead.citta || ''}`,
      `Indirizzo: ${lead.indirizzo || ''}`,
      `Condomìni totali amministrati: ${lead.numero_condomini || 0}`,
      `Condomìni interessati: ${lead.numero_condomini_interessati || 0}`,
      `Potenziale guadagno annuo: ${formatEuro((Number(lead.numero_condomini_interessati || 0) * VALORE_ANNUO_CONDOMINIO_CRM) || lead.valore_potenziale || 0)}`,
      '',
      `Note: ${lead.note || ''}`,
    ].join('\n');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Demo CSP - ${lead.nome_studio || 'Lead amministratore'}`,
      dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
      details,
      location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const apriGoogleCalendarLead = (lead) => {
    const leadCalendar = {
      ...lead,
      ...(
        leadInModifica && Number(leadInModifica.id) === Number(lead.id)
          ? {
              data_appuntamento: formLead.data_appuntamento,
              ora_appuntamento: formLead.ora_appuntamento,
              luogo_incontro: formLead.luogo_incontro,
              citta: formLead.citta,
              indirizzo: formLead.indirizzo,
              note: formLead.note,
              numero_condomini: formLead.numero_condomini,
              numero_condomini_interessati: formLead.numero_condomini_interessati,
              valore_potenziale: formLead.valore_potenziale,
            }
          : {}
      ),
    };

    const url = creaLinkGoogleCalendar(leadCalendar);

    if (!url) {
      alert('Inserisci almeno la data appuntamento per creare l’evento Google Calendar.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const labelStato = (stato) => statiLead.find((item) => item[0] === stato)?.[1] || stato || 'n.d.';

  const esportaLeadCsv = () => {
    const headers = [
      'nome_studio',
      'referente',
      'telefono',
      'email',
      'provincia',
      'citta',
      'indirizzo',
      'numero_condomini',
      'numero_condomini_interessati',
      'stato_pipeline',
      'data_appuntamento',
      'ora_appuntamento',
      'prossimo_followup',
      'origine',
      'note',
    ];

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = leadFiltrati.map((lead) => [
      lead.nome_studio,
      lead.referente,
      lead.telefono,
      lead.email,
      lead.provincia,
      lead.citta,
      lead.indirizzo,
      lead.numero_condomini,
      lead.numero_condomini_interessati,
      lead.stato_pipeline,
      lead.data_appuntamento,
      lead.ora_appuntamento,
      lead.prossimo_followup,
      lead.origine,
      lead.note,
    ].map(escapeCsv).join(';'));

    const csv = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-amministratori-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Lead Amministratori</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard pipeline commerciale</h2>
      <p className="mt-1 text-sm text-slate-500">Controllo pipeline, presentazioni, preventivi, operativi e valore annuo potenziale Toscana.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Lead totali" value={totale} tone="slate" />
        <DashboardStat label="Presentazioni" value={presentazioni} tone="amber" />
        <DashboardStat label="Preventivi" value={preventivi} tone="sky" />
        <DashboardStat label="Operativi" value={operativi} tone="emerald" />
        <DashboardStat label="Valore pipeline" value={formatEuro(valorePipeline)} tone="sky" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Pipeline condomini totali" value={pipelineCondominiTotali} tone="slate" />
        <DashboardStat label="Condomini interessati" value={pipelineCondominiInteressati} tone="emerald" />
        <DashboardStat label="% condomini interessati" value={`${percentualePipelineInteressati}%`} tone="amber" />
        <DashboardStat label="Media interessati / lead" value={mediaCondominiInteressatiLead} tone="cyan" />
        <DashboardStat label="Pipeline 10 famiglie × €9,90" value={formatEuro(valorePipeline)} tone="emerald" />
      </div>

      {leadInModifica && (
        <div className="mt-5 rounded-3xl border border-cyan-200 bg-cyan-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Aggiorna lead</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">{leadInModifica.nome_studio}</h3>
              <p className="text-sm text-slate-500">{leadInModifica.provincia} • {leadInModifica.referente || 'Referente n.d.'}</p>
            </div>
            <button type="button" onClick={() => setLeadInModifica(null)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600">
              Chiudi
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <select value={formLead.stato_pipeline} onChange={(e) => aggiornaFormLead('stato_pipeline', e.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-3">
              {statiLead.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input type="date" value={formLead.prossimo_followup || ''} onChange={(e) => aggiornaFormLead('prossimo_followup', e.target.value)} className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input value={formLead.citta} onChange={(e) => aggiornaFormLead('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input value={formLead.indirizzo} onChange={(e) => aggiornaFormLead('indirizzo', e.target.value)} placeholder="Indirizzo studio" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input value={formLead.telefono} onChange={(e) => aggiornaFormLead('telefono', e.target.value)} placeholder="Telefono aggiornato" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input type="email" value={formLead.email} onChange={(e) => aggiornaFormLead('email', e.target.value)} placeholder="Email aggiornata" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <label className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Prossimo incontro previsto
              <input type="date" value={formLead.data_appuntamento || ''} onChange={(e) => aggiornaFormLead('data_appuntamento', e.target.value)} className="mt-1 w-full rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800" />
            </label>
            <label className="text-xs font-bold uppercase tracking-wide text-cyan-700">
              Ora incontro
              <input type="time" value={formLead.ora_appuntamento || ''} onChange={(e) => aggiornaFormLead('ora_appuntamento', e.target.value)} className="mt-1 w-full rounded-2xl border border-cyan-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800" />
            </label>
            <input value={formLead.luogo_incontro} onChange={(e) => aggiornaFormLead('luogo_incontro', e.target.value)} placeholder="Luogo incontro automatico: indirizzo + città" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input type="number" min="0" value={formLead.numero_condomini} onChange={(e) => aggiornaFormLead('numero_condomini', e.target.value)} placeholder="Condomini totali amministrati" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <input type="number" min="0" value={formLead.numero_condomini_interessati} onChange={(e) => aggiornaFormLead('numero_condomini_interessati', e.target.value)} placeholder="Nr. condomìni interessati" className="rounded-2xl border border-cyan-200 bg-white px-3 py-3" />
            <label className="rounded-2xl border border-cyan-200 bg-white px-3 py-2 md:col-span-2">
              <span className="block text-[10px] font-black uppercase tracking-wide text-cyan-700">Potenziale guadagno annuo</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-black text-cyan-700">€</span>
                <input type="number" min="0" value={formLead.valore_potenziale} onChange={(e) => aggiornaFormLead('valore_potenziale', e.target.value)} placeholder="0" className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none" />
              </div>
              <span className="mt-1 block text-xs font-black text-cyan-700">{formatEuro(Number(formLead.valore_potenziale || 0))}</span>
              <span className="mt-1 block text-[11px] font-semibold text-slate-500">
                {Number(formLead.numero_condomini || 0) ? Math.round((Number(formLead.numero_condomini_interessati || 0) / Number(formLead.numero_condomini || 0)) * 100) : 0}% interessati • {Number(formLead.numero_condomini_interessati || 0)} condomìni × 10 famiglie × €9,90/mese × 12
              </span>
            </label>
          </div>

          <textarea value={formLead.note} onChange={(e) => aggiornaFormLead('note', e.target.value)} placeholder="Note dopo incontro, prossimi passi, obiezioni, richieste..." className="mt-3 min-h-28 w-full rounded-2xl border border-cyan-200 bg-white px-3 py-3" />

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={salvaModificaLead} className="rounded-2xl bg-cyan-700 px-4 py-3 text-sm font-black text-white">
              Salva aggiornamento lead
            </button>
            <button type="button" onClick={() => apriGoogleCalendarLead(leadInModifica)} className="rounded-2xl bg-sky-700 px-4 py-3 text-sm font-black text-white">
              Crea evento Google Calendar
            </button>
            <button type="button" onClick={() => aggiornaFormLead('stato_pipeline', 'operativo')} className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
              Segna operativo
            </button>
            <button type="button" onClick={() => aggiornaFormLead('stato_pipeline', 'non_interessato')} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white">
              Non interessato
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Tabella lead</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Elenco potenziali clienti</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Ricerca per cliente, referente, città, telefono o email. Filtri rapidi per provincia e stato.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:w-[760px]">
            <input
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Cerca cliente / referente..."
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold"
            />
            <select value={leadProvinciaFiltro} onChange={(e) => setLeadProvinciaFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold">
              <option value="">Tutte le province</option>
              {provinceDisponibili.map((provincia) => <option key={provincia} value={provincia}>{provincia}</option>)}
            </select>
            <select value={leadStatoFiltro} onChange={(e) => setLeadStatoFiltro(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold">
              <option value="">Tutti gli stati</option>
              {statiLead.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button type="button" onClick={esportaLeadCsv} className="rounded-2xl bg-cyan-700 px-3 py-3 text-sm font-black text-white">
              Esporta CSV
            </button>
          </div>
        </div>

        <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl border border-slate-200 bg-white csp-scroll">
          {leadAmministratori.length === 0 ? (
            <EmptyState icon="🚀" title="Nessun lead inserito" text="Aggiungi il primo lead o importa una lista CSV per costruire la pipeline commerciale." action="CRM pronto" tone="emerald" />
          ) : leadFiltrati.length === 0 ? (
            <EmptyState icon="🔎" title="Nessun lead trovato" text="Modifica ricerca o filtri per visualizzare altri potenziali clienti." action="Filtri attivi" tone="slate" />
          ) : (
            <table className="min-w-[860px] w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Provincia</th>
                  <th className="px-3 py-3">Contatti</th>
                  <th className="px-3 py-3">Stato</th>
                  <th className="px-3 py-3">Incontro / Follow-up</th>
                  <th className="px-3 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {leadFiltrati.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 align-top hover:bg-cyan-50/40">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-900">{lead.nome_studio}</p>
                      <p className="text-xs font-semibold text-slate-500">{lead.referente || 'Referente n.d.'}</p>
                      {(lead.indirizzo || lead.citta) && (
                        <p className="mt-1 text-xs text-slate-500">📍 {[lead.indirizzo, lead.citta].filter(Boolean).join(', ')}</p>
                      )}
                      {lead.note && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{lead.note}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-700">{lead.provincia || 'n.d.'}</p>
                      <p className="text-xs text-slate-500">{lead.citta || ''}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-xs font-semibold text-slate-600">{lead.telefono || 'Telefono n.d.'}</p>
                      <p className="text-xs font-semibold text-slate-600">{lead.email || 'Email n.d.'}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-cyan-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-cyan-700">
                        {labelStato(lead.stato_pipeline)}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">{lead.numero_condomini_interessati || 0}/{lead.numero_condomini || 0} interessati</p>
                    </td>
                    <td className="px-3 py-3">
                      {lead.data_appuntamento ? (
                        <p className="text-xs font-black text-sky-700">
                          {new Date(lead.data_appuntamento).toLocaleDateString('it-IT')} {lead.ora_appuntamento ? `• ${String(lead.ora_appuntamento).slice(0, 5)}` : ''}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400">Incontro non fissato</p>
                      )}
                      {lead.prossimo_followup && (
                        <p className="mt-1 text-xs font-bold text-amber-700">Follow-up: {new Date(lead.prossimo_followup).toLocaleDateString('it-IT')}</p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => apriModificaLead(lead)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">
                          Aggiorna
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-500">
          Lead visualizzati: {leadFiltrati.length}/{leadAmministratori.length}
        </p>
      </div>
    </section>
  );
}





function GuadagniGestoreDashboard({ contratti = [], segnalazioni = [], capitolati = [], lavoriPrivati = [], fattureLavoriPrivati = [], fatturePartner = [], fattureProvvigioniGestore = [] }) {
  const IVA_PRIVATI_LSP = 1.22;
  const isFatturaPagataGuadagni = (record = {}) => {
    const stato = String(record.stato || record.status || record.pagamento_stato || '').toLowerCase();
    return stato.includes('pagat') || stato.includes('saldat') || stato.includes('incassat');
  };
  const importoImponibilePrivato = (record = {}) => {
    const imponibileEsplicito = Number(record.importo_imponibile || record.imponibile || record.netto || 0);
    if (imponibileEsplicito > 0) return imponibileEsplicito;
    const lordo = Number(record.totale || record.importo_totale || record.importo_preventivo || record.importo || record.valore || 0);
    return lordo > 0 ? Math.round((lordo / IVA_PRIVATI_LSP) * 100) / 100 : 0;
  };

  const contrattiAttivi = (contratti || []).filter((c) => String(c.stato || '').toLowerCase() === 'attivo');
  const abbonamentiCsp = contrattiAttivi.reduce((sum, c) => sum + Number(c.ricavo_annuo || (Number(c.ricavo_mensile || 0) * 12) || 0), 0);

  const praticheCspChiuse = (segnalazioni || []).filter((s) => ['accettata', 'pianificata', 'chiusa'].includes(String(s.stato || '').toLowerCase()));
  const praticheCsp = praticheCspChiuse.reduce((sum, s) => sum + Number(s.importo_preventivo || s.importo || 0), 0);

  const fattureProvvigioniGestorePagate = (fattureProvvigioniGestore || []).filter(isFatturaPagataGuadagni);
  const provvigioniCasep = fattureProvvigioniGestorePagate.reduce((sum, f) => sum + Number(f.importo_imponibile || f.totale || f.importo || 0), 0);

  const fattureLavoriPrivatiPagate = (fattureLavoriPrivati || []).filter(isFatturaPagataGuadagni);
  const lsp = fattureLavoriPrivatiPagate.reduce((sum, f) => sum + importoImponibilePrivato(f), 0);

  const fonti = [
    { key: 'abbonamenti', label: 'Abbonamenti CSP', value: abbonamentiCsp, tone: 'emerald', note: `${contrattiAttivi.length} contratti attivi` },
    { key: 'pratiche', label: 'Pratiche CSP', value: praticheCsp, tone: 'sky', note: `${praticheCspChiuse.length} pratiche valorizzate` },
    { key: 'casep', label: 'CaSeP', value: provvigioniCasep, tone: 'amber', note: `${fattureProvvigioniGestorePagate.length} fatture provvigione pagate` },
    { key: 'lsp', label: 'LSP', value: lsp, tone: 'rose', note: `Solo fatture pagate • imponibile netto IVA 22%` },
  ];

  const totale = fonti.reduce((sum, f) => sum + Number(f.value || 0), 0);
  const meseCorrente = new Date().getMonth();
  const annoCorrente = new Date().getFullYear();
  const lavoriMese = fattureLavoriPrivatiPagate.filter((f) => {
    const d = new Date(f.data_pagamento || f.paid_at || f.updated_at || f.created_at || 0);
    return d.getFullYear() === annoCorrente && d.getMonth() === meseCorrente;
  }).reduce((sum, f) => sum + importoImponibilePrivato(f), 0);
  const praticheMese = praticheCspChiuse.filter((s) => {
    const d = new Date(s.updated_at || s.created_at || 0);
    return d.getFullYear() === annoCorrente && d.getMonth() === meseCorrente;
  }).reduce((sum, s) => sum + Number(s.importo_preventivo || s.importo || 0), 0);
  const totaleMese = lavoriMese + praticheMese;
  const numeroOperazioniEconomiche = praticheCspChiuse.length + fattureProvvigioniGestorePagate.length + fattureLavoriPrivatiPagate.length;
  const ticketMedio = totale && numeroOperazioniEconomiche ? totale / numeroOperazioniEconomiche : 0;
  const fontePrincipale = [...fonti].sort((a, b) => b.value - a.value)[0];

  const palette = {
    emerald: { bar: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', stroke: '#059669' },
    sky: { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 border-sky-100', stroke: '#0ea5e9' },
    amber: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 border-amber-100', stroke: '#f59e0b' },
    rose: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-100', stroke: '#f43f5e' },
  };

  let offset = 0;
  const donutParts = fonti.map((f) => {
    const percent = totale ? Math.round((f.value / totale) * 100) : 0;
    const dash = `${percent} ${100 - percent}`;
    const part = { ...f, percent, dash, offset: -offset, color: palette[f.tone]?.stroke || '#64748b' };
    offset += percent;
    return part;
  });

  const mesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const andamento = mesi.map((mese, index) => {
    const pratiche = praticheCspChiuse.filter((s) => {
      const d = new Date(s.updated_at || s.created_at || 0);
      return d.getFullYear() === annoCorrente && d.getMonth() === index;
    }).reduce((sum, s) => sum + Number(s.importo_preventivo || s.importo || 0), 0);
    const lspMese = fattureLavoriPrivatiPagate.filter((f) => {
      const d = new Date(f.data_pagamento || f.paid_at || f.updated_at || f.created_at || 0);
      return d.getFullYear() === annoCorrente && d.getMonth() === index;
    }).reduce((sum, f) => sum + importoImponibilePrivato(f), 0);
    return { mese, value: pratiche + lspMese };
  });
  const maxMese = Math.max(...andamento.map((m) => m.value), 1);

  return (
    <section className="space-y-4 pb-10">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Guadagni</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Control Room economica</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
              Una vista chiara delle entrate incassate dall’ecosistema: abbonamenti, pratiche CSP, CaSeP e lavori privati LSP.
            </p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 text-right shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Totale incassato</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{formatEuro(totale)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardStat label="Totale generale" value={formatEuro(totale)} tone="emerald" />
          <DashboardStat label="Questo mese" value={formatEuro(totaleMese)} tone="sky" />
          <DashboardStat label="Ticket medio" value={formatEuro(ticketMedio)} tone="amber" />
          <DashboardStat label="Fonte principale" value={fontePrincipale?.label || 'n.d.'} tone="slate" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Composizione</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Ripartizione fatturato</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">Peso percentuale di ogni componente sul totale.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-center">
            <div className="relative h-52 w-52">
              <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e2e8f0" strokeWidth="6" />
                {donutParts.map((part) => part.percent > 0 && (
                  <circle
                    key={part.key}
                    cx="21"
                    cy="21"
                    r="15.915"
                    fill="transparent"
                    stroke={part.color}
                    strokeWidth="6"
                    strokeDasharray={part.dash}
                    strokeDashoffset={part.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Totale</p>
                <p className="text-2xl font-black text-slate-900">{formatEuro(totale)}</p>
              </div>
            </div>
            <div className="w-full space-y-3">
              {fonti.map((f) => {
                const percent = totale ? Math.round((f.value / totale) * 100) : 0;
                return (
                  <div key={f.key} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{f.label}</p>
                        <p className="text-xs font-semibold text-slate-500">{f.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{formatEuro(f.value)}</p>
                        <p className="text-xs font-black text-emerald-700">{percent}%</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div className={`h-full rounded-full ${palette[f.tone]?.bar || 'bg-slate-500'}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Andamento</p>
          <h3 className="mt-1 text-xl font-black text-slate-900">Entrate valorizzate nell’anno</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Barre mensili calcolate sulle pratiche e richieste valorizzate.</p>
          <div className="mt-6 flex h-72 items-end gap-2 rounded-3xl border border-slate-100 bg-slate-50 p-4">
            {andamento.map((m) => {
              const height = Math.max(8, Math.round((m.value / maxMese) * 100));
              return (
                <div key={m.mese} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="flex w-full items-end justify-center rounded-t-2xl bg-gradient-to-t from-emerald-700 to-emerald-400 shadow-sm" style={{ height: `${height}%` }} title={`${m.mese}: ${formatEuro(m.value)}`} />
                  <span className="text-[10px] font-black uppercase text-slate-400">{m.mese}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        {fonti.map((f) => (
          <article key={f.key} className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${palette[f.tone]?.chip || 'border-slate-100 bg-slate-50 text-slate-600'}`}>
              {f.label}
            </span>
            <p className="mt-4 text-2xl font-black text-slate-900">{formatEuro(f.value)}</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{f.note}</p>
          </article>
        ))}
      </section>
    </section>
  );
}

function GuadagniAmministratoreSuite({ fatturePartner, fattureProvvigioniAmministratori, aziendePartner }) {
  const aziendaById = (id) => (aziendePartner || []).find((a) => Number(a.id) === Number(id));

  const getDataPagamentoFattura = (fattura) => (
    fattura?.pagata_il ||
    fattura?.data_pagamento ||
    fattura?.paid_at ||
    null
  );

  const isFatturaPagataFuoriTermine = (fattura) => {
    if (String(fattura?.stato || '').toLowerCase() !== 'pagata') return false;
    if (!fattura?.data_scadenza) return false;

    const dataPagamentoRaw = getDataPagamentoFattura(fattura);
    if (!dataPagamentoRaw) return false;

    const scadenza = new Date(fattura.data_scadenza);
    const pagamento = new Date(dataPagamentoRaw);

    if (Number.isNaN(scadenza.getTime()) || Number.isNaN(pagamento.getTime())) return false;

    scadenza.setHours(0, 0, 0, 0);
    pagamento.setHours(0, 0, 0, 0);

    const limiteMaturazione = new Date(scadenza);
    limiteMaturazione.setDate(limiteMaturazione.getDate() + 15);

    return pagamento > limiteMaturazione;
  };

  const fatturePagate = (fatturePartner || []).filter((fattura) => String(fattura.stato || '').toLowerCase() === 'pagata');
  const fatturePagateValide = fatturePagate.filter((fattura) => !isFatturaPagataFuoriTermine(fattura));
  const fatturePagateFuoriTermine = fatturePagate.filter((fattura) => isFatturaPagataFuoriTermine(fattura));

  const provvigioneMaturata = fatturePagateValide.reduce((sum, fattura) => sum + (Number(fattura.importo_imponibile || 0) * 0.10), 0);
  const provvigionePersa = fatturePagateFuoriTermine.reduce((sum, fattura) => sum + (Number(fattura.importo_imponibile || 0) * 0.10), 0);

  const provvigioniFatturate = (fattureProvvigioniAmministratori || [])
    .filter((fattura) => String(fattura.stato || '') !== 'annullata')
    .reduce((sum, fattura) => sum + Number(fattura.importo_imponibile || 0), 0);

  const provvigioniPagate = (fattureProvvigioniAmministratori || [])
    .filter((fattura) => String(fattura.stato || '') === 'pagata')
    .reduce((sum, fattura) => sum + Number(fattura.importo_imponibile || 0), 0);

  const provvigioniDaFatturare = Math.max(provvigioneMaturata - provvigioniFatturate, 0);
  const provvigioniDaIncassare = Math.max(provvigioniFatturate - provvigioniPagate, 0);

  const fornitoriMap = new Map();

  fatturePagateValide.forEach((fattura) => {
    const id = Number(fattura.azienda_partner_id || 0);
    if (!id) return;

    const row = fornitoriMap.get(id) || {
      azienda_partner_id: id,
      azienda: aziendaById(id),
      imponibilePagato: 0,
      provvigioneMaturata: 0,
      provvigionePersa: 0,
      fatturato: 0,
      pagato: 0,
      daFatturare: 0,
      daIncassare: 0,
      fatturePagate: 0,
      fatturePerse: 0,
    };

    row.imponibilePagato += Number(fattura.importo_imponibile || 0);
    row.provvigioneMaturata += Number(fattura.importo_imponibile || 0) * 0.10;
    row.fatturePagate += 1;
    fornitoriMap.set(id, row);
  });

  fatturePagateFuoriTermine.forEach((fattura) => {
    const id = Number(fattura.azienda_partner_id || 0);
    if (!id) return;

    const row = fornitoriMap.get(id) || {
      azienda_partner_id: id,
      azienda: aziendaById(id),
      imponibilePagato: 0,
      provvigioneMaturata: 0,
      provvigionePersa: 0,
      fatturato: 0,
      pagato: 0,
      daFatturare: 0,
      daIncassare: 0,
      fatturePagate: 0,
      fatturePerse: 0,
    };

    row.provvigionePersa += Number(fattura.importo_imponibile || 0) * 0.10;
    row.fatturePerse += 1;
    fornitoriMap.set(id, row);
  });

  (fattureProvvigioniAmministratori || []).forEach((fattura) => {
    const id = Number(fattura.azienda_partner_id || 0);
    if (!id) return;

    const row = fornitoriMap.get(id) || {
      azienda_partner_id: id,
      azienda: aziendaById(id),
      imponibilePagato: 0,
      provvigioneMaturata: 0,
      provvigionePersa: 0,
      fatturato: 0,
      pagato: 0,
      daFatturare: 0,
      daIncassare: 0,
      fatturePagate: 0,
      fatturePerse: 0,
    };

    if (String(fattura.stato || '') !== 'annullata') {
      row.fatturato += Number(fattura.importo_imponibile || 0);
    }

    if (String(fattura.stato || '') === 'pagata') {
      row.pagato += Number(fattura.importo_imponibile || 0);
    }

    fornitoriMap.set(id, row);
  });

  const righeFornitori = [...fornitoriMap.values()]
    .map((row) => ({
      ...row,
      daFatturare: Math.max(row.provvigioneMaturata - row.fatturato, 0),
      daIncassare: Math.max(row.fatturato - row.pagato, 0),
    }))
    .sort((a, b) => String(a.azienda?.ragione_sociale || '').localeCompare(String(b.azienda?.ragione_sociale || '')));

  if (isCondomino && !(subscriptionFlags?.isPlus || subscriptionFlags?.isPremium)) {
    return (
      <section className="space-y-4">
        <SubscriptionLockedCard
          required="plus"
          title="La tua casa Senza Pensieri è disponibile con CSP Plus"
          text="Il piano Base mantiene segnalazioni e pratiche condominiali. Con Plus puoi usare LSP per richieste private, preventivi, documenti e aggiornamenti dedicati alla tua casa."
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Guadagni</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Riepilogo provvigioni amministratore</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Vista riservata per controllare provvigioni maturate, fatturate e ancora da fatturare.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Da fatturare</p>
            <p className="mt-1 text-2xl font-black text-emerald-800">{formatEuro(provvigioniDaFatturare)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
          <DashboardStat label="Maturate" value={formatEuro(provvigioneMaturata)} tone="sky" />
          <DashboardStat label="Fatturate" value={formatEuro(provvigioniFatturate)} tone="emerald" />
          <DashboardStat label="Perse" value={formatEuro(provvigionePersa)} tone="red" />
          <DashboardStat label="Da fatturare" value={formatEuro(provvigioniDaFatturare)} tone="amber" />
          <DashboardStat label="Pagate" value={formatEuro(provvigioniPagate)} tone="emerald" />
          <DashboardStat label="Da incassare" value={formatEuro(provvigioniDaIncassare)} tone="red" />
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-500">
          Le provvigioni sono maturate solo sulle fatture pagate entro 15 giorni dalla scadenza. I pagamenti oltre tale limite restano visibili come provvigioni perse.
        </p>
      </section>

      <section className="h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700">Suddivisione per fornitore</p>
            <h2 className="mt-1 text-xl font-bold">Fatture da emettere per destinatario</h2>
          </div>
          <p className="text-xs font-bold text-slate-500">Usa questa vista per emettere le fatture corrette ai fornitori giusti.</p>
        </div>

        <div className="mt-4 max-h-[500px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Fornitore</th>
                <th className="px-3 py-3 text-right">Imponibile pagato</th>
                <th className="px-3 py-3 text-right">Maturate</th>
                <th className="px-3 py-3 text-right">Perse</th>
                <th className="px-3 py-3 text-right">Fatturate</th>
                <th className="px-3 py-3 text-right">Da fatturare</th>
                <th className="px-3 py-3 text-right">Pagate</th>
                <th className="px-3 py-3 text-right">Da incassare</th>
              </tr>
            </thead>
            <tbody>
              {righeFornitori.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessuna provvigione maturata disponibile.
                  </td>
                </tr>
              ) : (
                righeFornitori.map((row) => (
                  <tr key={row.azienda_partner_id} className="border-t border-slate-100 hover:bg-emerald-50/30">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-900">{row.azienda?.ragione_sociale || `Fornitore #${row.azienda_partner_id}`}</p>
                      <p className="text-xs text-slate-500">{row.fatturePagate} fatture pagate valide • {row.fatturePerse} fuori termine</p>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-700">{formatEuro(row.imponibilePagato)}</td>
                    <td className="px-3 py-3 text-right font-black text-sky-700">{formatEuro(row.provvigioneMaturata)}</td>
                    <td className="px-3 py-3 text-right font-black text-red-700">{formatEuro(row.provvigionePersa)}</td>
                    <td className="px-3 py-3 text-right font-black text-emerald-700">{formatEuro(row.fatturato)}</td>
                    <td className="px-3 py-3 text-right font-black text-amber-700">{formatEuro(row.daFatturare)}</td>
                    <td className="px-3 py-3 text-right font-black text-emerald-700">{formatEuro(row.pagato)}</td>
                    <td className="px-3 py-3 text-right font-black text-red-700">{formatEuro(row.daIncassare)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}



function VotazioneAssembleaCasep({ capitolato, utentiCondomini = [], utentiSistema = [], votiAssemblea = [], onSaveVotoAssemblea }) {
  const [filtro, setFiltro] = useState('');
  const condominioId = Number(capitolato?.condominio_id || 0);
  const emailKey = (value) => String(value || '').toLowerCase().trim();

  const nomeByEmail = useMemo(() => {
    const map = new Map();
    (utentiSistema || []).forEach((utente) => {
      const email = emailKey(utente.email);
      if (email) map.set(email, utente.nome || email);
    });
    return map;
  }, [utentiSistema]);

  const votoByEmail = useMemo(() => {
    const map = new Map();
    (votiAssemblea || [])
      .filter((voto) => Number(voto.capitolato_id) === Number(capitolato?.id))
      .forEach((voto) => map.set(emailKey(voto.email), voto));
    return map;
  }, [votiAssemblea, capitolato?.id]);

  const aventiDiritto = useMemo(() => {
    return (utentiCondomini || [])
      .filter((item) => Number(item.condominio_id) === condominioId)
      .filter((item) => {
        const ruolo = String(item.ruolo || '').toLowerCase().trim();
        return ruolo === 'condominio' || ruolo === 'condomino';
      })
      .map((item) => {
        const email = emailKey(item.email);
        const voto = votoByEmail.get(email) || {};
        const nome = nomeByEmail.get(email) || item.nome || email;
        const cognome = item.cognome || voto.cognome || '';
        const millesimi = Number(item.millesimi || voto.millesimi || 0);
        return {
          email,
          nome,
          cognome,
          label: `${nome || ''} ${cognome || ''}`.trim() || email,
          millesimi,
          presente: Boolean(voto.presente),
          voto: voto.voto || '',
          delegato_a_email: emailKey(voto.delegato_a_email),
          note: voto.note || '',
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label, 'it'));
  }, [utentiCondomini, condominioId, nomeByEmail, votoByEmail]);

  const presenti = aventiDiritto.filter((item) => item.presente);
  const presentiEmails = new Set(presenti.map((item) => item.email));
  const delegheValide = aventiDiritto.filter((item) => item.delegato_a_email && presentiEmails.has(item.delegato_a_email));

  const millesimiRappresentatiPerEmail = useMemo(() => {
    const map = new Map();
    presenti.forEach((item) => map.set(item.email, Number(item.millesimi || 0)));
    delegheValide.forEach((delegato) => {
      map.set(delegato.delegato_a_email, Number(map.get(delegato.delegato_a_email) || 0) + Number(delegato.millesimi || 0));
    });
    return map;
  }, [presenti, delegheValide]);

  const riepilogo = useMemo(() => {
    const represented = Array.from(millesimiRappresentatiPerEmail.values()).reduce((sum, value) => sum + Number(value || 0), 0);
    const base = {
      presentiFisici: presenti.length,
      deleghe: delegheValide.length,
      rappresentati: represented,
      favorevoli: 0,
      contrari: 0,
      astenuti: 0,
      nonEspressi: 0,
    };

    presenti.forEach((presente) => {
      const peso = Number(millesimiRappresentatiPerEmail.get(presente.email) || 0);
      const voto = String(presente.voto || '').toLowerCase();
      if (voto === 'favorevole') base.favorevoli += peso;
      else if (voto === 'contrario') base.contrari += peso;
      else if (voto === 'astenuto') base.astenuti += peso;
      else base.nonEspressi += peso;
    });

    return base;
  }, [presenti, delegheValide, millesimiRappresentatiPerEmail]);

  const listaFiltrata = aventiDiritto.filter((item) => {
    const q = filtro.toLowerCase().trim();
    if (!q) return true;
    return item.label.toLowerCase().includes(q) || item.email.includes(q);
  });

  const salva = async (item, patch) => {
    const prossimo = {
      capitolato_id: capitolato.id,
      condominio_id: condominioId,
      email: item.email,
      nome: item.nome,
      cognome: item.cognome || '',
      millesimi: Number(item.millesimi || 0),
      presente: item.presente,
      voto: item.voto || '',
      delegato_a_email: item.delegato_a_email || null,
      note: item.note || '',
      ...patch,
    };

    if (prossimo.presente) prossimo.delegato_a_email = null;
    if (prossimo.delegato_a_email) {
      prossimo.presente = false;
      prossimo.voto = '';
    }

    await onSaveVotoAssemblea?.(prossimo);
  };

  const generaResocontoPdf = () => {
    const rowsPresenti = presenti.map((item) => {
      const peso = Number(millesimiRappresentatiPerEmail.get(item.email) || item.millesimi || 0).toFixed(2);
      const deleghe = delegheValide.filter((d) => d.delegato_a_email === item.email).map((d) => `${d.label} (${Number(d.millesimi || 0).toFixed(2)})`).join(', ');
      return `<tr><td>${item.label}</td><td>${Number(item.millesimi || 0).toFixed(2)}</td><td>${peso}</td><td>${item.voto || 'Non espresso'}</td><td>${deleghe || '-'}</td></tr>`;
    }).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Resoconto assemblea CaSeP</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#0f172a}h1{font-size:24px}h2{font-size:18px;margin-top:24px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.card{border:1px solid #d1d5db;border-radius:14px;padding:12px;background:#f8fafc}.label{font-size:11px;text-transform:uppercase;color:#64748b;font-weight:800}.value{font-size:20px;font-weight:900;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border-bottom:1px solid #e5e7eb;text-align:left;padding:9px;font-size:12px}th{background:#f1f5f9;text-transform:uppercase;font-size:10px;color:#475569}.muted{color:#64748b;font-size:12px}</style></head><body><h1>Resoconto assemblea CaSeP</h1><p class="muted">${capitolato?.numero_pratica || '#'+capitolato?.id} — ${capitolato?.titolo || ''}</p><p><strong>Condominio:</strong> ${capitolato?.condominio_nome || ''}<br/><strong>Data assemblea:</strong> ${capitolato?.data_assemblea || '-'}<br/><strong>Luogo:</strong> ${capitolato?.luogo_assemblea || '-'}</p><div class="grid"><div class="card"><div class="label">Presenti fisici</div><div class="value">${riepilogo.presentiFisici}</div></div><div class="card"><div class="label">Deleghe</div><div class="value">${riepilogo.deleghe}</div></div><div class="card"><div class="label">Millesimi rappresentati</div><div class="value">${riepilogo.rappresentati.toFixed(2)}</div></div><div class="card"><div class="label">Favorevoli</div><div class="value">${riepilogo.favorevoli.toFixed(2)}</div></div><div class="card"><div class="label">Contrari</div><div class="value">${riepilogo.contrari.toFixed(2)}</div></div><div class="card"><div class="label">Astenuti</div><div class="value">${riepilogo.astenuti.toFixed(2)}</div></div><div class="card"><div class="label">Non espressi</div><div class="value">${riepilogo.nonEspressi.toFixed(2)}</div></div></div><h2>Presenti, deleghe e votazioni</h2><table><thead><tr><th>Condòmino</th><th>Millesimi propri</th><th>Millesimi rappresentati</th><th>Voto</th><th>Deleghe ricevute</th></tr></thead><tbody>${rowsPresenti || '<tr><td colspan="5">Nessun presente registrato.</td></tr>'}</tbody></table><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`;
    const win = window.open('', '_blank');
    if (!win) return alert('Popup bloccato: consenti le finestre popup per generare il PDF.');
    win.document.write(html);
    win.document.close();
  };

  if (!condominioId) return null;

  return (
    <div className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Votazione assemblea CaSeP</p>
          <h3 className="mt-1 text-lg font-black text-slate-900">Presenze, deleghe e millesimi live</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">Sistema separato dal voto CSP: pensato per assemblea fisica e gestione manuale assistita.</p>
        </div>
        <button type="button" onClick={generaResocontoPdf} className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-black text-white">
          Genera resoconto PDF
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-7">
        <DashboardStat label="Presenti" value={riepilogo.presentiFisici} tone="sky" />
        <DashboardStat label="Deleghe" value={riepilogo.deleghe} tone="amber" />
        <DashboardStat label="Rappresentati" value={riepilogo.rappresentati.toFixed(2)} tone="slate" />
        <DashboardStat label="Favorevoli" value={riepilogo.favorevoli.toFixed(2)} tone="emerald" />
        <DashboardStat label="Contrari" value={riepilogo.contrari.toFixed(2)} tone="red" />
        <DashboardStat label="Astenuti" value={riepilogo.astenuti.toFixed(2)} tone="purple" />
        <DashboardStat label="Non espressi" value={riepilogo.nonEspressi.toFixed(2)} tone="slate" />
      </div>

      <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Cerca per nome, cognome o email" className="w-full rounded-2xl border border-indigo-100 bg-white px-3 py-3 text-sm font-semibold md:max-w-md" />
        <p className="text-xs font-bold text-indigo-700">Condòmini caricati: {aventiDiritto.length}</p>
      </div>

      <div className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-indigo-100 bg-white csp-scroll">
        <table className="min-w-[1040px] w-full border-collapse text-sm">
          <thead className="bg-indigo-100 text-left text-[11px] font-black uppercase tracking-wide text-indigo-700">
            <tr>
              <th className="px-3 py-3">Condòmino</th>
              <th className="px-3 py-3 text-right">Millesimi</th>
              <th className="px-3 py-3">Presente</th>
              <th className="px-3 py-3">Delega a</th>
              <th className="px-3 py-3">Voto</th>
              <th className="px-3 py-3 text-right">Rappresentati</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrata.length === 0 ? (
              <tr><td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">Nessun condòmino trovato. Verifica anagrafica, cognome e millesimi.</td></tr>
            ) : listaFiltrata.map((item) => {
              const rappresentati = item.presente ? Number(millesimiRappresentatiPerEmail.get(item.email) || item.millesimi || 0) : 0;
              const delegabileA = presenti.filter((presente) => presente.email !== item.email);
              return (
                <tr key={item.email} className="border-t border-slate-100 hover:bg-indigo-50/40">
                  <td className="px-3 py-3">
                    <p className="font-black text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                  </td>
                  <td className="px-3 py-3 text-right font-black text-slate-800">{Number(item.millesimi || 0).toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <label className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-700">
                      <input type="checkbox" checked={item.presente} onChange={(e) => salva(item, { presente: e.target.checked, delegato_a_email: null, voto: e.target.checked ? item.voto : '' })} />
                      Presente
                    </label>
                  </td>
                  <td className="px-3 py-3">
                    <select value={item.delegato_a_email || ''} onChange={(e) => salva(item, { delegato_a_email: e.target.value || null, presente: false, voto: '' })} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold" disabled={item.presente}>
                      <option value="">Nessuna delega</option>
                      {delegabileA.map((presente) => <option key={presente.email} value={presente.email}>{presente.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select value={item.voto || ''} onChange={(e) => salva(item, { voto: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold" disabled={!item.presente}>
                      <option value="">Non espresso</option>
                      <option value="favorevole">Favorevole</option>
                      <option value="contrario">Contrario</option>
                      <option value="astenuto">Astenuto</option>
                    </select>
                  </td>
                  <td className="px-3 py-3 text-right font-black text-indigo-700">{rappresentati.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}



function statoDocumentoPresentazione(dataScadenza) {
  if (!dataScadenza) return { label: 'non caricato', tone: 'slate' };
  const oggi = new Date();
  const scadenza = new Date(dataScadenza);
  const diff = Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
  if (Number.isNaN(diff)) return { label: 'da verificare', tone: 'amber' };
  if (diff < 0) return { label: 'scaduto', tone: 'red' };
  if (diff <= 30) return { label: `in scadenza (${diff} gg)`, tone: 'amber' };
  return { label: 'valido', tone: 'emerald' };
}

function badgeDocumentoPresentazione(tone) {
  if (tone === 'emerald') return 'border-emerald-300 bg-emerald-500/15 text-emerald-100';
  if (tone === 'amber') return 'border-amber-300 bg-amber-500/15 text-amber-100';
  if (tone === 'red') return 'border-red-300 bg-red-500/15 text-red-100';
  return 'border-slate-300 bg-white/10 text-slate-100';
}

function PresentazioneAssembleaCaSeP({ capitolato, azienda, votiAssemblea = [], onClose }) {
  const [slide, setSlide] = useState(0);
  const durc = statoDocumentoPresentazione(azienda?.durc_scadenza);
  const polizza = statoDocumentoPresentazione(azienda?.polizza_scadenza);
  const voti = (votiAssemblea || []).filter((voto) => Number(voto.capitolato_id) === Number(capitolato?.id));
  const presenti = voti.filter((voto) => voto.presente);
  const deleghe = voti.filter((voto) => voto.delegato_a_email);
  const millesimiPresenti = presenti.reduce((sum, voto) => sum + Number(voto.millesimi || 0), 0);
  const favorevoli = presenti.filter((voto) => String(voto.voto).toLowerCase() === 'favorevole').reduce((sum, voto) => sum + Number(voto.millesimi || 0), 0);
  const contrari = presenti.filter((voto) => String(voto.voto).toLowerCase() === 'contrario').reduce((sum, voto) => sum + Number(voto.millesimi || 0), 0);
  const astenuti = presenti.filter((voto) => String(voto.voto).toLowerCase() === 'astenuto').reduce((sum, voto) => sum + Number(voto.millesimi || 0), 0);
  const step = ['Richiesta', 'Sopralluogo', 'Relazione', 'Offerta', 'Assemblea', 'Decisione', 'CaSP'];
  const stato = String(capitolato?.stato || '').toLowerCase();
  const activeIndex = stato.includes('convertita') ? 6 : stato.includes('accett') || stato.includes('rifiut') ? 5 : stato.includes('assemblea') || stato.includes('presenza') ? 4 : stato.includes('offerta') ? 3 : stato.includes('relazione') ? 2 : stato.includes('sopralluogo') ? 1 : 0;

  const slides = [
    {
      label: 'Quadro intervento',
      body: (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">Pratica CaSeP</p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-white md:text-6xl">{capitolato?.titolo || 'Intervento condominiale'}</h1>
            <p className="mt-4 text-xl font-semibold text-emerald-50">{capitolato?.condominio_nome || 'Condominio'} • {capitolato?.numero_pratica || `#${capitolato?.id}`}</p>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">{capitolato?.note || capitolato?.categoria || 'Riepilogo tecnico e operativo della pratica da condividere in assemblea.'}</p>
          </div>
          <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-400/10 p-6 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-200">Assemblea</p>
            <p className="mt-4 text-3xl font-black text-white">{capitolato?.data_assemblea || 'Da pianificare'}</p>
            <p className="mt-3 text-lg font-semibold text-slate-200">{capitolato?.luogo_assemblea || 'Luogo da definire'}</p>
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-300">Stato pratica</p>
              <p className="mt-1 text-2xl font-black text-emerald-100">{capitolato?.stato || 'Nuova pratica'}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      label: 'Offerta e azienda',
      body: (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-sky-300/30 bg-sky-400/10 p-8 backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-sky-200">Offerta economica</p>
            <p className="mt-5 text-5xl font-black text-white md:text-6xl">{capitolato?.valore_offerta ? formatEuro(capitolato.valore_offerta) : 'Offerta non caricata'}</p>
            <p className="mt-4 text-lg font-semibold text-slate-200">Fornitore: {azienda?.ragione_sociale || capitolato?.azienda_vincitrice_nome || 'Da selezionare'}</p>
            {capitolato?.offerta_pdf_url && <a href={capitolato.offerta_pdf_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-900">Apri offerta PDF</a>}
          </div>
          <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-400/10 p-8 backdrop-blur-xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">Affidabilità azienda</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className={`rounded-full border px-4 py-2 text-sm font-black uppercase ${badgeDocumentoPresentazione(durc.tone)}`}>DURC: {durc.label}</span>
              <span className={`rounded-full border px-4 py-2 text-sm font-black uppercase ${badgeDocumentoPresentazione(polizza.tone)}`}>Polizza: {polizza.label}</span>
              {azienda?.certificazioni_iso && <span className="rounded-full border border-cyan-300 bg-cyan-400/10 px-4 py-2 text-sm font-black uppercase text-cyan-100">ISO: {azienda.certificazioni_iso}</span>}
              {azienda?.certificazioni_soa && <span className="rounded-full border border-purple-300 bg-purple-400/10 px-4 py-2 text-sm font-black uppercase text-purple-100">SOA: {azienda.certificazioni_soa}</span>}
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-300">Garanzie</p>
              <p className="mt-2 whitespace-pre-wrap text-base font-semibold leading-relaxed text-white">{azienda?.schema_garanzie || 'Schema garanzie non ancora caricato.'}</p>
            </div>
            {azienda?.note_qualificazione && <p className="mt-4 text-sm font-semibold leading-relaxed text-emerald-50">{azienda.note_qualificazione}</p>}
          </div>
        </div>
      ),
    },
    {
      label: 'Timeline',
      body: (
        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">Avanzamento pratica</p>
          <div className="mt-10 grid gap-4 md:grid-cols-7">
            {step.map((label, index) => (
              <div key={label} className={`rounded-3xl border p-5 text-center ${index <= activeIndex ? 'border-emerald-300 bg-emerald-400/20 text-white shadow-xl shadow-emerald-950/30' : 'border-white/10 bg-white/5 text-slate-400'}`}>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-black">{index + 1}</div>
                <p className="mt-3 text-sm font-black uppercase tracking-wide">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-2xl font-black text-white">Stato attuale: {capitolato?.stato || 'Da definire'}</p>
        </div>
      ),
    },
    {
      label: 'Votazione live',
      body: (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase text-slate-300">Presenti</p><p className="mt-3 text-5xl font-black text-white">{presenti.length}</p></div>
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase text-slate-300">Deleghe</p><p className="mt-3 text-5xl font-black text-white">{deleghe.length}</p></div>
          <div className="rounded-[2rem] border border-emerald-300/30 bg-emerald-400/10 p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase text-emerald-200">Favorevoli</p><p className="mt-3 text-5xl font-black text-white">{favorevoli.toFixed(2)}</p></div>
          <div className="rounded-[2rem] border border-red-300/30 bg-red-400/10 p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase text-red-200">Contrari</p><p className="mt-3 text-5xl font-black text-white">{contrari.toFixed(2)}</p></div>
          <div className="rounded-[2rem] border border-purple-300/30 bg-purple-400/10 p-6 backdrop-blur-xl"><p className="text-xs font-black uppercase text-purple-200">Astenuti</p><p className="mt-3 text-5xl font-black text-white">{astenuti.toFixed(2)}</p></div>
          <div className="md:col-span-5 rounded-[2rem] border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Millesimi presenti/rappresentati</p>
            <p className="mt-3 text-6xl font-black text-white">{millesimiPresenti.toFixed(2)} / 1000</p>
            <div className="mt-5 h-5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, millesimiPresenti / 10)}%` }} /></div>
          </div>
        </div>
      ),
    },
  ];
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        chiudiPresentazione();
        return;
      }
      if (event.key === 'ArrowLeft') {
        setSlide((prev) => Math.max(0, prev - 1));
      }
      if (event.key === 'ArrowRight') {
        setSlide((prev) => Math.min(slides.length - 1, prev + 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [slides.length, onClose]);

  const attivaSchermoIntero = async () => {
    try {
      const target = document.documentElement;
      if (!document.fullscreenElement && target?.requestFullscreen) {
        await target.requestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen non disponibile:', error);
    }
  };

  const chiudiPresentazione = () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (error) {
      console.warn('Fullscreen exit non disponibile:', error);
    }
    onClose?.();
  };

  const current = slides[slide] || slides[0];
  return (
    <div className="fixed inset-0 z-[9999] h-screen w-screen overflow-auto bg-slate-950 p-4 text-white md:p-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.25),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <LogoMark className="h-14 w-auto" />
            <div><p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-300">Modalità assemblea premium</p><h2 className="text-2xl font-black text-white">{current.label}</h2></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={attivaSchermoIntero} className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 hover:bg-emerald-300">Schermo intero</button>
            <button type="button" onClick={chiudiPresentazione} className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur hover:bg-white/20">Esci dalla presentazione</button>
          </div>
        </header>
        <main className="relative flex-1 py-8">{current.body}</main>
        <footer className="relative flex flex-col gap-3 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2">{slides.map((item, index) => <button key={item.label} type="button" onClick={() => setSlide(index)} className={`h-3 rounded-full transition-all ${index === slide ? 'w-12 bg-emerald-400' : 'w-3 bg-white/25'}`} aria-label={item.label} />)}</div>
          <div className="flex gap-2"><button type="button" onClick={() => setSlide((prev) => Math.max(0, prev - 1))} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white disabled:opacity-40" disabled={slide === 0}>← Indietro</button><button type="button" onClick={() => setSlide((prev) => Math.min(slides.length - 1, prev + 1))} className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-40" disabled={slide === slides.length - 1}>Avanti →</button></div>
        </footer>
      </div>
    </div>
  );
}

function CapitolatoSenzaPensieriSuite({
  ruolo,
  userProfile,
  capitolati,
  capitolatiEventi,
  condomini,
  utentiSistema,
  utentiCondomini = [],
  votiAssembleaCasep = [],
  onSaveVotoAssembleaCasep,
  aziendePartner,
  contratti = [],
  onCreateCapitolato,
  onUpdateCapitolato,
  onUploadCapitolatoPdf,
  onDeleteCapitolato,
}) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const isGestore = ruoloNorm === 'gestore';
  const isAmministratore = ruoloNorm === 'amministratore';
  const isCollaboratore = ruoloNorm === 'collaboratore';
  const canPresentareAssemblea = isGestore || isAmministratore || isCollaboratore;
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [capitolatoPdfName, setCapitolatoPdfName] = useState('');
  const [uploadingDocId, setUploadingDocId] = useState(null);
  const [filtroStato, setFiltroStato] = useState('');
  const [filtroSearch, setFiltroSearch] = useState('');
  const [conversioneDraft, setConversioneDraft] = useState({});
  const [capitolatoApertoId, setCapitolatoApertoId] = useState(null);
  const [assembleaDraft, setAssembleaDraft] = useState({ capitolatoId: null, data: '', ora: '', luogo: '' });
  const [presentazioneAssembleaId, setPresentazioneAssembleaId] = useState(null);
  const [showNuovoCapitolatoModal, setShowNuovoCapitolatoModal] = useState(false);
  const [capitolatoSuccessMessage, setCapitolatoSuccessMessage] = useState('');

  const apriPresentazioneAssemblea = (capitolatoId) => {
    try {
      const target = document.documentElement;
      if (!document.fullscreenElement && target?.requestFullscreen) {
        target.requestFullscreen().catch(() => {});
      }
    } catch (error) {
      console.warn('Fullscreen non disponibile:', error);
    }
    setPresentazioneAssembleaId(capitolatoId);
  };

  const amministratoreEmail = userProfile?.email || '';
  const amministratoreNome = userProfile?.nome || userProfile?.email || '';
  const amministratoreRiferimentoEmail = String(
    userProfile?.amministratore_email ||
    userProfile?.amministratoreEmail ||
    userProfile?.amministratore_riferimento ||
    ''
  ).toLowerCase().trim();
  const amministratoreOperativoEmail = isCollaboratore && amministratoreRiferimentoEmail
    ? amministratoreRiferimentoEmail
    : amministratoreEmail;
  const amministratoreOperativoNome = isCollaboratore
    ? (userProfile?.amministratore_nome || userProfile?.studio || amministratoreOperativoEmail || amministratoreNome)
    : amministratoreNome;

  const [form, setForm] = useState({
    condominio_id: '',
    condominio_nome: '',
    titolo: '',
    categoria: 'Facciate e coperture',
    indirizzo: '',
    citta: '',
    provincia: '',
    importo_presunto: '',
    priorita: 'Media',
    note: '',
    capitolato_pdf_url: '',
    tecnico_nome: '',
    tecnico_cognome: '',
    tecnico_studio: '',
    tecnico_email: '',
    tecnico_telefono: '',
    tecnico_indirizzo: '',
    tecnico_citta: '',
    tecnico_provincia: '',
    tecnico_note: '',
  });

  const stati = [
    'Nuovo capitolato',
    'Sopralluogo programmato',
    'Sopralluogo effettuato',
    'Relazione inviata',
    'Offerta inviata',
    'Assemblea programmata',
    'Offerta accettata',
    'Offerta rifiutata',
    'Presenza CSP richiesta',
    'Aggiudicata',
    'Convertita in CaSP',
    'Non aggiudicata',
  ];

  const flussoCasepSteps = [
    { label: 'Nuovo capitolato', text: 'Richiesta aperta', aliases: ['nuova pratica'] },
    { label: 'Sopralluogo programmato', text: 'Verifica tecnica' },
    { label: 'Sopralluogo effettuato', text: 'Rilievo completato' },
    { label: 'Relazione inviata', text: 'Documenti tecnici' },
    { label: 'Offerta inviata', text: 'Preventivo disponibile' },
    { label: 'Assemblea programmata', text: 'Decisione condominio', aliases: ['presenza csp richiesta'] },
    { label: 'Offerta accettata', text: 'Esito amministratore', aliases: ['aggiudicata', 'convertita in casp'] },
    { label: 'Offerta rifiutata', text: 'Pratica conclusa', aliases: ['non aggiudicata'] },
  ];

  const estraiOraAssemblea = (luogo = '') => {
    const match = String(luogo || '').match(/(?:\s*[—-]\s*)?ore\s+([0-2]?\d:[0-5]\d)\s*$/i);
    return match?.[1] || '';
  };

  const pulisciLuogoAssemblea = (luogo = '') => String(luogo || '').replace(/(?:\s*[—-]\s*)?ore\s+[0-2]?\d:[0-5]\d\s*$/i, '').trim();

  const componiLuogoAssemblea = (luogo = '', ora = '') => {
    const luogoPulito = pulisciLuogoAssemblea(luogo);
    const oraPulita = String(ora || '').trim();
    return oraPulita ? `${luogoPulito} — ore ${oraPulita}` : luogoPulito;
  };

  const statoDecisioneCapitolato = (item) => {
    const stato = String(item?.stato || '').toLowerCase();
    const decisione = String(item?.decisione_amministratore || '').toLowerCase();
    if (stato.includes('rifiut') || decisione.includes('rifiut')) return 'rifiutata';
    if (stato.includes('accett') || decisione.includes('accett')) return 'accettata';
    return '';
  };

  const buildGoogleCalendarUrl = (item) => {
    const title = `Assemblea Capitolato Senza Pensieri - ${item.condominio_nome || item.titolo || 'Condominio'}`;
    const details = [
      `Pratica: ${item.numero_pratica || item.id}`,
      `Titolo: ${item.titolo || ''}`,
      `Tecnico: ${item.tecnico_nome || 'n.d.'}`,
      `Richiesta presenza CSP: ${item.presenza_csp_richiesta ? 'Sì' : 'No'}`,
    ].join('\n');

    const date = item.data_assemblea || new Date().toISOString().slice(0, 10);
    const cleanDate = String(date).replaceAll('-', '');
    const ora = estraiOraAssemblea(item.luogo_assemblea) || '18:00';
    const [hh = '18', mm = '00'] = String(ora).split(':');
    const startMinutes = (Number(hh) || 18) * 60 + (Number(mm) || 0);
    const endMinutes = startMinutes + 120;
    const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, '0');
    const endM = String(endMinutes % 60).padStart(2, '0');
    const location = pulisciLuogoAssemblea(item.luogo_assemblea) || item.indirizzo || '';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${cleanDate}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00/${cleanDate}T${endH}${endM}00`,
      details,
      location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const aziendaById = (id) => (aziendePartner || []).find((azienda) => Number(azienda.id) === Number(id));

  const valoreBooleanoAttivo = (valore) => {
    if (valore === true || valore === 1) return true;
    const normalizzato = String(valore || '').toLowerCase().trim();
    return ['true', '1', 'si', 'sì', 'yes', 'attivo', 'attiva'].includes(normalizzato);
  };

  const condominioCspAttivo = (condominioId) => {
    const condominio = (condomini || []).find((item) => Number(item.id) === Number(condominioId));
    if (valoreBooleanoAttivo(condominio?.csp_attivo)) return true;

    const oggi = new Date().toISOString().slice(0, 10);
    return (contratti || []).some((contratto) => {
      if (Number(contratto.condominio_id) !== Number(condominioId)) return false;
      const statoContratto = String(contratto.stato || contratto.status || '').toLowerCase();
      if (['annullato', 'annullata', 'disdetto', 'disdetta', 'scaduto', 'scaduta'].includes(statoContratto)) return false;
      if (contratto.data_scadenza && String(contratto.data_scadenza).slice(0, 10) < oggi) return false;
      return Boolean(contratto.piano || contratto.app_attiva || contratto.gruppo_whatsapp_attivo || statoContratto === 'attivo' || statoContratto === 'attiva');
    });
  };

  const eseguiCampagnaConsigliata = async (azienda, tipoCampagna) => {
    try {
      if (!azienda?.id) {
        alert('Azienda non valida.');
        return;
      }

      if (!azienda.email) {
        alert('Azienda senza email: completa l’anagrafica partner prima dell’invio.');
        return;
      }

      setSendingCampaignId(azienda.id);

      const { error } = await supabase.functions.invoke('campaign-partner-casp', {
        body: {
          azienda_id: azienda.id,
          tipo_campagna: tipoCampagna,
        },
      });

      if (error) throw error;

      alert('Campagna consigliata inviata correttamente.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Errore invio campagna consigliata: ' + (error.message || 'sconosciuto'));
    } finally {
      setSendingCampaignId(null);
    }
  };

  const updateConversioneDraft = (capitolatoId, field, value) => {
    setConversioneDraft((prev) => ({
      ...prev,
      [capitolatoId]: {
        ...(prev[capitolatoId] || {}),
        [field]: value,
      },
    }));
  };

  const convertiInCasp = async (item, aziendaId, valoreAggiudicato, noteConversione) => {
    if (!aziendaId) {
      alert('Seleziona azienda vincitrice prima della conversione CaSP.');
      return;
    }

    await onUpdateCapitolato(item.id, {
      azienda_vincitrice_id: Number(aziendaId),
      azienda_vincitrice_nome: aziendaById(aziendaId)?.ragione_sociale || '',
      valore_aggiudicato: Number(valoreAggiudicato || item.valore_offerta || item.importo_presunto || 0),
      note_conversione_casp: noteConversione || '',
      convertita_casp: true,
      data_conversione_casp: new Date().toISOString().slice(0, 10),
      stato: 'Convertita in CaSP',
    });

    alert('Pratica convertita in CaSP correttamente.');
  };

  const updateForm = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'condominio_id') {
        const condominio = (condomini || []).find((c) => Number(c.id) === Number(value));
        next.condominio_nome = condominio?.nome || '';
        next.indirizzo = condominio?.indirizzo || prev.indirizzo || '';
      }

      return next;
    });
  };

  const caricaPdf = async (file) => {
    if (!file) return;
    try {
      setUploadingPdf(true);
      const url = await onUploadCapitolatoPdf(file);
      setForm((prev) => ({ ...prev, capitolato_pdf_url: url }));
      setCapitolatoPdfName(file.name);
      alert('Capitolato PDF caricato correttamente.');
    } catch (error) {
      console.error(error);
      alert('Errore caricamento capitolato PDF: ' + (error.message || 'sconosciuto'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const caricaDocumentoTecnico = async (item, tipo, file) => {
    if (!file) return;

    try {
      setUploadingDocId(`${item.id}-${tipo}`);
      const url = await onUploadCapitolatoPdf(file);
      const payload = tipo === 'relazione'
        ? { relazione_pdf_url: url, stato: 'Relazione inviata' }
        : { offerta_pdf_url: url, stato: 'Offerta inviata' };

      await onUpdateCapitolato(item.id, payload);
      alert(`${tipo === 'relazione' ? 'Relazione tecnica PDF' : 'Offerta PDF'} caricata correttamente.`);
    } catch (error) {
      console.error(error);
      alert('Errore caricamento documento: ' + (error.message || 'sconosciuto'));
    } finally {
      setUploadingDocId(null);
    }
  };

  const aggiornaWorkflowTecnico = async (item, payload) => {
    await onUpdateCapitolato(item.id, payload);
  };

  const pianificaAssembleaCapitolato = async (item) => {
    const dataAssemblea = String(assembleaDraft.data || '').trim();
    const oraAssemblea = String(assembleaDraft.ora || '').trim();
    const luogoAssemblea = String(assembleaDraft.luogo || '').trim();

    if (!dataAssemblea || !oraAssemblea || !luogoAssemblea) {
      alert('Inserisci data, orario e luogo dell’assemblea prima di salvare.');
      return;
    }

    await aggiornaWorkflowTecnico(item, {
      data_assemblea: dataAssemblea,
      luogo_assemblea: componiLuogoAssemblea(luogoAssemblea, oraAssemblea),
      stato: 'Assemblea programmata',
    });

    alert('Assemblea pianificata correttamente.');
  };

  const cancellaCapitolato = async (item) => {
    if (!item?.id || !onDeleteCapitolato) return;
    const conferma = window.confirm(`Sicuro di cancellare la pratica ${item.numero_pratica || `#${item.id}`}? L’operazione non può essere annullata.`);
    if (!conferma) return;
    await onDeleteCapitolato(item.id);
    setCapitolatoApertoId(null);
  };

  const salvaValoreOffertaCapitolato = async (item, valore) => {
    const numero = Number(valore || 0);

    if (!numero || numero <= 0) {
      alert('Inserisci un valore offerta valido.');
      return;
    }

    await aggiornaWorkflowTecnico(item, {
      valore_offerta: numero,
      stato: 'Offerta inviata',
    });

    alert('Valore offerta salvato correttamente.');
  };

  const salvaFornitoreOffertaCapitolato = async (item, aziendaId) => {
    const id = Number(aziendaId || 0);
    const azienda = aziendaById(id);

    if (!id || !azienda) {
      await aggiornaWorkflowTecnico(item, {
        azienda_partner_id: null,
        azienda_partner_nome: '',
      });
      return;
    }

    await aggiornaWorkflowTecnico(item, {
      azienda_partner_id: id,
      azienda_partner_nome: azienda.ragione_sociale || '',
    });

    alert('Fornitore offerta collegato correttamente.');
  };

  const azioneAmministratoreOfferta = async (item, azione) => {
    const oggi = new Date().toISOString().slice(0, 10);

    if (azione === 'accetta') {
      await aggiornaWorkflowTecnico(item, {
        stato: 'Offerta accettata',
        decisione_amministratore: 'Accettata',
        data_decisione_offerta: oggi,
      });
      alert('Offerta accettata correttamente.');
      return;
    }

    if (azione === 'rifiuta') {
      await aggiornaWorkflowTecnico(item, {
        stato: 'Offerta rifiutata',
        decisione_amministratore: 'Rifiutata',
        data_decisione_offerta: oggi,
      });
      alert('Offerta rifiutata correttamente.');
      return;
    }

    const nota = window.prompt('Scrivi la richiesta da inviare al gestore:') || '';

    if (!nota.trim()) {
      alert('Inserisci una richiesta prima di inviare.');
      return;
    }

    await aggiornaWorkflowTecnico(item, {
      stato: 'Integrazione richiesta',
      decisione_amministratore: 'Richiesta integrazione',
      note_richiesta_amministratore: nota.trim(),
      data_decisione_offerta: oggi,
    });

    alert('Richiesta inviata correttamente.');
  };

  const apriPratica = async (e) => {
    e.preventDefault();

    if (!form.titolo || !form.condominio_nome) {
      alert('Inserisci titolo pratica e condominio.');
      return;
    }

    const payload = {
      ...form,
      condominio_id: form.condominio_id ? Number(form.condominio_id) : null,
      amministratore_email: amministratoreOperativoEmail,
      amministratore_nome: amministratoreOperativoNome,
      importo_presunto: Number(form.importo_presunto || 0),
      stato: 'Nuovo capitolato',
    };

    const result = await onCreateCapitolato(payload);

    if (result?.success) {
      setShowNuovoCapitolatoModal(false);
      setCapitolatoSuccessMessage('Pratica Capitolato Senza Pensieri aperta correttamente.');
      window.setTimeout(() => setCapitolatoSuccessMessage(''), 4500);
      setForm({
        condominio_id: '',
        condominio_nome: '',
        titolo: '',
        categoria: 'Facciate e coperture',
        indirizzo: '',
        citta: '',
        provincia: '',
        importo_presunto: '',
        priorita: 'Media',
        note: '',
        capitolato_pdf_url: '',
        tecnico_nome: '',
        tecnico_cognome: '',
        tecnico_studio: '',
        tecnico_email: '',
        tecnico_telefono: '',
        tecnico_indirizzo: '',
        tecnico_citta: '',
        tecnico_provincia: '',
        tecnico_note: '',
      });
      setCapitolatoPdfName('');
    }
  };

  const capitolatiVisibili = (capitolati || [])
    .filter((item) => {
      if (isGestore) return true;
      const adminPratica = String(item.amministratore_email || '').toLowerCase().trim();
      const adminOperativo = String(amministratoreOperativoEmail || '').toLowerCase().trim();
      if (adminOperativo && adminPratica === adminOperativo) return true;
      if (isCollaboratore) {
        const idsCollaboratore = (userProfile?.condominiIds || []).map((id) => Number(id));
        return idsCollaboratore.includes(Number(item.condominio_id));
      }
      return false;
    })
    .filter((item) => !filtroStato || item.stato === filtroStato)
    .filter((item) => {
      const haystack = [
        item.numero_pratica,
        item.titolo,
        item.condominio_nome,
        item.amministratore_nome,
        item.tecnico_nome,
        item.tecnico_studio,
      ].filter(Boolean).join(' ').toLowerCase();

      return !filtroSearch || haystack.includes(filtroSearch.toLowerCase().trim());
    });

  const capitolatoAperto = capitolatiVisibili.find((item) => Number(item.id) === Number(capitolatoApertoId));
  const presentazioneCapitolato = capitolatiVisibili.find((item) => Number(item.id) === Number(presentazioneAssembleaId));

  useEffect(() => {
    if (!capitolatoAperto?.id) {
      setAssembleaDraft({ capitolatoId: null, data: '', ora: '', luogo: '' });
      return;
    }

    setAssembleaDraft((prev) => {
      if (Number(prev.capitolatoId) === Number(capitolatoAperto.id)) return prev;

      return {
        capitolatoId: capitolatoAperto.id,
        data: capitolatoAperto.data_assemblea || '',
        ora: estraiOraAssemblea(capitolatoAperto.luogo_assemblea) || '',
        luogo: pulisciLuogoAssemblea(capitolatoAperto.luogo_assemblea || ''),
      };
    });
  }, [capitolatoAperto?.id, capitolatoAperto?.data_assemblea, capitolatoAperto?.luogo_assemblea]);

  // Release 141: deep link push CaSeP.
  // Le push CaSeP aprono direttamente la scheda capitolato con ?fromPush=1&capitolato=ID.
  useEffect(() => {
    if (!capitolatiVisibili.length) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search || '');
    const capitolatoId = params.get('capitolato') || params.get('casep') || params.get('capitolatoId');
    if (!capitolatoId) return;

    const capitolato = capitolatiVisibili.find((item) => Number(item.id) === Number(capitolatoId));
    if (!capitolato) return;

    setCapitolatoApertoId(Number(capitolato.id));
    params.delete('capitolato');
    params.delete('casep');
    params.delete('capitolatoId');
    params.delete('fromPush');
    params.delete('source');
    params.delete('utm_source');

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({ ...(window.history.state || {}), cspRoute: getCspHistoryRoute() }, document.title, nextUrl);
  }, [capitolatiVisibili, setCapitolatoApertoId]);

  const valorePotenziale = capitolatiVisibili.reduce((sum, item) => sum + Number(item.valore_offerta || 0), 0);
  const valoreOfferteGestore = capitolatiVisibili.reduce((sum, item) => sum + Number(item.valore_offerta || 0), 0);
  const guadagnoPotenzialeAmministratore = valoreOfferteGestore * 0.10;
  const altePriorita = capitolatiVisibili.filter((item) => String(item.priorita || '').toLowerCase() === 'alta').length;
  const convertiteCaSP = capitolatiVisibili.filter((item) => item.stato === 'Convertita in CaSP').length;
  const valoreAcquisito = capitolatiVisibili.reduce((sum, item) => sum + Number(item.valore_aggiudicato || 0), 0);
  const sopralluoghiImminenti = capitolatiVisibili.filter((item) => item.data_sopralluogo).length;
  const assembleeImminenti = capitolatiVisibili.filter((item) => item.data_assemblea).length;
  const presenzeRichieste = capitolatiVisibili.filter((item) => item.presenza_csp_richiesta).length;
  const tassoConversione = capitolatiVisibili.length ? `${Math.round((convertiteCaSP / capitolatiVisibili.length) * 100)}%` : '0%';

  const partnerRanking = [...(aziendePartner || [])]
    .map((azienda) => {
      const capitolatiAzienda = capitolatiVisibili.filter((item) => Number(item.azienda_vincitrice_id) === Number(azienda.id));
      const convertiti = capitolatiAzienda.filter((item) => item.convertita_casp || item.stato === 'Convertita in CaSP');
      const valore = capitolatiAzienda.reduce((sum, item) => sum + Number(item.valore_offerta || 0), 0);
      const valoreCasp = convertiti.reduce((sum, item) => sum + Number(item.valore_aggiudicato || item.valore_offerta || 0), 0);

      return {
        ...azienda,
        capitolati: capitolatiAzienda.length,
        convertiti: convertiti.length,
        valore,
        valoreCasp,
        tasso: capitolatiAzienda.length ? Math.round((convertiti.length / capitolatiAzienda.length) * 100) : 0,
      };
    })
    .filter((azienda) => azienda.capitolati > 0 || azienda.convertiti > 0)
    .sort((a, b) => Number(b.valoreCasp || b.valore || 0) - Number(a.valoreCasp || a.valore || 0));

  const topPartner = partnerRanking[0];
  const aziendeConvertite = partnerRanking.filter((azienda) => azienda.convertiti > 0).length;
  const partnerDaOnboardare = partnerRanking.filter((azienda) => azienda.convertiti >= 1);
  const partnerDaAnnuale = partnerRanking.filter((azienda) => azienda.convertiti >= 2);
  const valorePartnerDaAnnuale = partnerDaAnnuale.reduce((sum, azienda) => sum + Number(azienda.valoreCasp || 0), 0);

  return (
    <>
      {canPresentareAssemblea && presentazioneCapitolato && (
        <PresentazioneAssembleaCaSeP
          capitolato={presentazioneCapitolato}
          azienda={aziendaById(presentazioneCapitolato.azienda_vincitrice_id) || aziendaById(presentazioneCapitolato.azienda_partner_id)}
          votiAssemblea={votiAssembleaCasep}
          onClose={() => setPresentazioneAssembleaId(null)}
        />
      )}
      <section className="space-y-4">
      {!isGestore && (
        <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Capitolato Senza Pensieri</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Nuova pratica Capitolato</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Uno spazio pensato per semplificare ogni nuova richiesta. Tutto organizzato in un flusso chiaro, rapido e sempre consultabile.</p>
            </div>
            <button type="button" onClick={() => setShowNuovoCapitolatoModal(true)} className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-sky-800">
              Apri nuova pratica
            </button>
          </div>
          {capitolatoSuccessMessage && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-800">
              {capitolatoSuccessMessage}
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Control Center CaSeP</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Capitolato Senza Pensieri</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Grandi lavori, capitolati e passaggi operativi raccolti in un unico spazio chiaro e sempre consultabile.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:min-w-[520px] md:grid-cols-4">
            <DashboardStat label="Capitolati" value={capitolatiVisibili.length} tone="sky" />
            <DashboardStat label="Valore potenziale" value={formatEuro(valorePotenziale)} tone="emerald" />
            <DashboardStat label="Priorità alta" value={altePriorita} tone="amber" />
            {isGestore ? (
              <DashboardStat label="Convertite CaSP" value={convertiteCaSP} tone="purple" />
            ) : (
              <DashboardStat label="Guadagno potenziale" value={formatEuro(guadagnoPotenzialeAmministratore)} tone="purple" />
            )}
          </div>
        </div>
      </section>

      {isGestore && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Control Room Capitolati</p>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-6">
            <DashboardStat label="Valore acquisito" value={formatEuro(valoreAcquisito)} tone="emerald" />
            <DashboardStat label="Tasso conversione" value={tassoConversione} tone="purple" />
            <DashboardStat label="Sopralluoghi" value={sopralluoghiImminenti} tone="sky" />
            <DashboardStat label="Assemblee" value={assembleeImminenti} tone="amber" />
            <DashboardStat label="Presenze CSP" value={presenzeRichieste} tone="red" />
            <DashboardStat label="Partner attivi" value={new Set(capitolatiVisibili.filter(c => c.azienda_vincitrice_id).map(c => c.azienda_vincitrice_id)).size} tone="slate" />
          </div>
        </section>
      )}

      {isGestore && (
        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700">Ranking partner CaSeP</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Aziende convertite e potenziale CaSP</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">Classifica delle aziende vincitrici dei capitolati e delle conversioni verso CaSP.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 md:min-w-[420px]">
              <DashboardStat label="Aziende convertite" value={aziendeConvertite} tone="purple" />
              <DashboardStat label="Top partner" value={topPartner?.ragione_sociale || 'n.d.'} tone="emerald" />
            </div>
          </div>

          <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
            <table className="min-w-[920px] w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Partner</th>
                  <th className="px-3 py-3 text-right">Capitolati</th>
                  <th className="px-3 py-3 text-right">Conversioni CaSP</th>
                  <th className="px-3 py-3 text-right">Tasso</th>
                  <th className="px-3 py-3 text-right">Valore lavori</th>
                  <th className="px-3 py-3 text-right">Valore CaSP</th>
                  <th className="px-3 py-3">Priorità commerciale</th>
                </tr>
              </thead>
              <tbody>
                {partnerRanking.length === 0 ? (
                  <tr><td colSpan="7" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">Nessuna azienda ancora collegata a capitolati convertiti.</td></tr>
                ) : (
                  partnerRanking.map((azienda, index) => (
                    <tr key={azienda.id} className="border-t border-slate-100 hover:bg-purple-50/30">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{index + 1}. {azienda.ragione_sociale}</p>
                        <p className="text-xs text-slate-500">{azienda.email || azienda.telefono || 'contatto n.d.'}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-slate-700">{azienda.capitolati}</td>
                      <td className="px-3 py-3 text-right font-black text-purple-700">{azienda.convertiti}</td>
                      <td className="px-3 py-3 text-right font-black text-slate-900">{azienda.tasso}%</td>
                      <td className="px-3 py-3 text-right font-black text-emerald-700">{formatEuro(azienda.valore)}</td>
                      <td className="px-3 py-3 text-right font-black text-purple-700">{formatEuro(azienda.valoreCasp)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          azienda.convertiti >= 2 ? 'bg-emerald-100 text-emerald-700' :
                          azienda.convertiti === 1 ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {azienda.convertiti >= 2 ? 'Proporre annuale' : azienda.convertiti === 1 ? 'Follow-up CaSP' : 'Monitorare'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isGestore && (
        <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Onboarding CaSP aziende</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Candidati proposta commerciale</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Aziende che hanno già sperimentato CaSP tramite Capitolato Senza Pensieri e sono pronte per follow-up o proposta annuale.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:min-w-[560px]">
              <DashboardStat label="Da contattare" value={partnerDaOnboardare.length} tone="amber" />
              <DashboardStat label="Proposta annuale" value={partnerDaAnnuale.length} tone="emerald" />
              <DashboardStat label="Valore target" value={formatEuro(valorePartnerDaAnnuale)} tone="purple" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
            {partnerDaOnboardare.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Nessuna azienda ancora pronta per onboarding CaSP.
              </div>
            ) : (
              partnerDaOnboardare.map((azienda) => {
                const propostaAnnuale = azienda.convertiti >= 2;
                const subject = propostaAnnuale
                  ? `Proposta CaSP annuale - ${azienda.ragione_sociale}`
                  : `Follow-up CaSP - ${azienda.ragione_sociale}`;

                const body = propostaAnnuale
                  ? `Buongiorno, dopo le prime conversioni positive su Capitolato Senza Pensieri, vorrei proporvi l'utilizzo annuale di Cantiere Senza Pensieri come strumento ufficiale per la gestione dei vostri cantieri condominiali.`
                  : `Buongiorno, dopo il primo utilizzo di Cantiere Senza Pensieri, vorrei fissare un breve confronto per raccogliere il vostro feedback e valutare insieme le prossime opportunità.`;

                const mailto = azienda.email
                  ? `mailto:${azienda.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                  : '';

                const stato = (partnerOnboardingCaSP || []).find((item) => Number(item.azienda_id) === Number(azienda.id))?.stato_commerciale || 'Da contattare';

                return (
                  <div key={azienda.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                          {propostaAnnuale ? 'Proposta annuale consigliata' : 'Follow-up consigliato'}
                        </p>
                        <h3 className="mt-1 text-lg font-black text-slate-900">{azienda.ragione_sociale}</h3>
                        <p className="text-xs font-semibold text-slate-500">{azienda.email || 'email n.d.'} {azienda.telefono ? `• ${azienda.telefono}` : ''}</p>
                        <p className="mt-1 text-xs font-black text-slate-700">Stato CRM: {stato}</p>
                        <p className="text-xs text-slate-500">
                          Follow-up: {(partnerOnboardingCaSP || []).find((item) => Number(item.azienda_id) === Number(azienda.id))?.data_followup || 'non programmato'}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        propostaAnnuale ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {propostaAnnuale ? 'Annuale' : 'Follow-up'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <DashboardStat label="Conversioni" value={azienda.convertiti} tone="purple" />
                      <DashboardStat label="Valore CaSP" value={formatEuro(azienda.valoreCasp)} tone="emerald" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {mailto ? (
                        <a href={mailto} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">
                          Prepara email
                        </a>
                      ) : (
                        <span className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-500">Email non presente</span>
                      )}
                      {azienda.telefono && (
                        <a href={`https://wa.me/39${String(azienda.telefono).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">
                          WhatsApp
                        </a>
                      )}

                      <button type="button" onClick={() => salvaPartnerOnboarding(azienda, 'Primo contatto inviato')} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white">
                        Segna contattato
                      </button>

                      <button type="button" onClick={() => salvaPartnerOnboarding(azienda, 'Follow-up programmato')} className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-black text-white">
                        Programma follow-up
                      </button>

                      <button type="button" onClick={() => salvaPartnerOnboarding(azienda, 'Convertita annuale')} className="rounded-xl bg-purple-700 px-3 py-2 text-xs font-black text-white">
                        Convertita annuale
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {!isGestore && (
        <>
          <section className="hidden">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Capitolato Senza Pensieri</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">Nuova pratica Capitolato</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">Uno spazio pensato per semplificare ogni nuova richiesta. Tutto organizzato in un flusso chiaro, rapido e sempre consultabile.</p>
              </div>
              <button type="button" onClick={() => setShowNuovoCapitolatoModal(true)} className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-sky-800">
                Apri nuova pratica
              </button>
            </div>
            {capitolatoSuccessMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-800">
                {capitolatoSuccessMessage}
              </div>
            )}
          </section>

          {showNuovoCapitolatoModal && (
            <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-3">
              <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl csp-scroll">
                <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur-xl">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Capitolato Senza Pensieri</p>
                    <h3 className="mt-1 text-xl font-black text-slate-900">Apri pratica Capitolato</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">Carica i dati e conferma solo quando la richiesta è completa.</p>
                  </div>
                  <button type="button" onClick={() => setShowNuovoCapitolatoModal(false)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">Chiudi</button>
                </div>
                <section className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Nuovo capitolato</p>
          <h2 className="mt-1 text-xl font-bold">Apri pratica Capitolato</h2>
          <p className="mt-1 text-sm text-slate-500">Carica il capitolato e crea una scheda tecnica completa del condominio e del tecnico incaricato.</p>

          <form onSubmit={apriPratica} className="mt-4 space-y-4">
            <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm font-black text-sky-800">Scheda condominio e lavori</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <input value={form.titolo} onChange={(e) => updateForm('titolo', e.target.value)} placeholder="Titolo pratica" className="rounded-2xl border border-sky-200 bg-white px-3 py-3 md:col-span-2" />
                <select value={form.priorita} onChange={(e) => updateForm('priorita', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                  <option value="Bassa">Priorità bassa</option>
                  <option value="Media">Priorità media</option>
                  <option value="Alta">Priorità alta</option>
                </select>
                <select value={form.condominio_id} onChange={(e) => updateForm('condominio_id', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                  <option value="">Seleziona condominio</option>
                  {(condomini || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
                <input value={form.condominio_nome} onChange={(e) => updateForm('condominio_nome', e.target.value)} placeholder="Nome condominio" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
                <input value={form.categoria} onChange={(e) => updateForm('categoria', e.target.value)} placeholder="Categoria lavori" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
                <input value={form.indirizzo} onChange={(e) => updateForm('indirizzo', e.target.value)} placeholder="Indirizzo" className="rounded-2xl border border-sky-200 bg-white px-3 py-3 md:col-span-2" />
                <input value={form.citta} onChange={(e) => updateForm('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
                <input value={form.provincia} onChange={(e) => updateForm('provincia', e.target.value)} placeholder="Provincia" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
                <input type="number" step="0.01" value={form.importo_presunto} onChange={(e) => updateForm('importo_presunto', e.target.value)} placeholder="Importo presunto lavori" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-800">Tecnico incaricato alla redazione del capitolato</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={form.tecnico_nome} onChange={(e) => updateForm('tecnico_nome', e.target.value)} placeholder="Nome tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_cognome} onChange={(e) => updateForm('tecnico_cognome', e.target.value)} placeholder="Cognome tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_studio} onChange={(e) => updateForm('tecnico_studio', e.target.value)} placeholder="Studio tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_email} onChange={(e) => updateForm('tecnico_email', e.target.value)} placeholder="Email tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_telefono} onChange={(e) => updateForm('tecnico_telefono', e.target.value)} placeholder="Telefono tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_indirizzo} onChange={(e) => updateForm('tecnico_indirizzo', e.target.value)} placeholder="Indirizzo studio tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_citta} onChange={(e) => updateForm('tecnico_citta', e.target.value)} placeholder="Città tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={form.tecnico_provincia} onChange={(e) => updateForm('tecnico_provincia', e.target.value)} placeholder="Provincia tecnico" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
              </div>
              <textarea value={form.tecnico_note} onChange={(e) => updateForm('tecnico_note', e.target.value)} placeholder="Note tecniche" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">PDF capitolato</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {capitolatoPdfName || (form.capitolato_pdf_url ? 'PDF capitolato caricato' : 'Nessun PDF caricato')}
                  </p>
                  {form.capitolato_pdf_url && (
                    <a href={form.capitolato_pdf_url} target="_blank" rel="noreferrer" className="text-xs font-black text-sky-700">Apri PDF caricato</a>
                  )}
                </div>
                <label className={`cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-white ${uploadingPdf ? 'bg-slate-400' : 'bg-sky-700'}`}>
                  {uploadingPdf ? 'Caricamento...' : 'Carica capitolato PDF'}
                  <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaPdf(e.target.files?.[0])} className="hidden" disabled={uploadingPdf} />
                </label>
              </div>
            </div>

            <textarea value={form.note} onChange={(e) => updateForm('note', e.target.value)} placeholder="Note amministratore" className="min-h-24 w-full rounded-2xl border border-slate-200 px-3 py-3" />

            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white">
              Apri pratica Capitolato
            </button>
          </form>
        </section>
              </div>
            </div>
          )}
        </>
      )}

      <section className="h-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Archivio capitolati</p>
            <h2 className="mt-1 text-xl font-bold">Lista pratiche grandi lavori</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Vista sintetica: apri una pratica per gestire sopralluogo, documenti, assemblea e conversione CaSP.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <input value={filtroSearch} onChange={(e) => setFiltroSearch(e.target.value)} placeholder="Cerca pratica, condominio, tecnico" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
            <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
              <option value="">Tutti gli stati</option>
              {stati.map((stato) => <option key={stato} value={stato}>{stato}</option>)}
            </select>
          </div>
        </div>

        {false && capitolatoAperto && (
          <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Pratica aperta</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  {capitolatoAperto.numero_pratica || `#${capitolatoAperto.id}`} — {capitolatoAperto.titolo}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {capitolatoAperto.condominio_nome || 'Condominio n.d.'} • {capitolatoAperto.stato || 'Nuovo capitolato'}
                </p>
                {statoDecisioneCapitolato(capitolatoAperto) && (
                  <div className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${statoDecisioneCapitolato(capitolatoAperto) === 'accettata' ? 'bg-emerald-700 text-white' : 'bg-red-700 text-white'}`}>
                    Pratica {statoDecisioneCapitolato(capitolatoAperto)}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCapitolatoApertoId(null)}
                  className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-700"
                >
                  Chiudi
                </button>
                {isGestore && (
                  <button
                    type="button"
                    onClick={() => cancellaCapitolato(capitolatoAperto)}
                    className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-50"
                  >
                    Cancella pratica
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Modalità assemblea premium</p>
              {canPresentareAssemblea && condominioCspAttivo(capitolatoAperto.condominio_id) ? (
                <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm font-semibold text-slate-600">Disponibile per questo condominio CSP attivo: presentazione fullscreen con offerta, timeline, votazione live e affidabilità azienda.</p>
                  <button type="button" onClick={() => apriPresentazioneAssemblea(capitolatoAperto.id)} className="rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20">
                    Apri presentazione fullscreen
                  </button>
                </div>
              ) : canPresentareAssemblea ? (
                <div className="mt-2 rounded-2xl border border-amber-200 bg-white p-3">
                  <p className="text-sm font-black text-amber-800">Funzione premium riservata ai condomìni con CSP attivo.</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">La regia assemblea avanzata usa anagrafiche, millesimi, deleghe e dati CSP: è il motivo perfetto per proporre l’attivazione del condominio.</p>
                </div>
              ) : (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-sm font-black text-slate-700">Modalità riservata a gestore, amministratore e collaboratore.</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">I condòmini non accedono alla regia assemblea premium.</p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stato e sopralluogo</p>
                {isGestore ? (
                  <div className="mt-2 space-y-2">
                    <select
                      value={capitolatoAperto.stato || 'Nuovo capitolato'}
                      onChange={(e) => onUpdateCapitolato(capitolatoAperto.id, { stato: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-black"
                    >
                      {stati.map((stato) => <option key={stato} value={stato}>{stato}</option>)}
                    </select>
                    <input
                      type="date"
                      value={capitolatoAperto.data_sopralluogo || ''}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        aggiornaWorkflowTecnico(capitolatoAperto, {
                          data_sopralluogo: e.target.value,
                          stato: 'Sopralluogo programmato',
                        });
                        alert('Data sopralluogo inserita. Notifica avviata.');
                      }}
                      className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                    />
                    <textarea
                      defaultValue={capitolatoAperto.note_sopralluogo || ''}
                      onBlur={(e) => aggiornaWorkflowTecnico(capitolatoAperto, { note_sopralluogo: e.target.value })}
                      placeholder="Note sopralluogo"
                      className="min-h-16 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {capitolatoAperto.data_sopralluogo || 'Sopralluogo da programmare'}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Documenti</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {capitolatoAperto.capitolato_pdf_url && <a href={capitolatoAperto.capitolato_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Capitolato</a>}
                  {capitolatoAperto.relazione_pdf_url && <a href={capitolatoAperto.relazione_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Relazione</a>}
                  {capitolatoAperto.offerta_pdf_url && <a href={capitolatoAperto.offerta_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-black text-white">Offerta</a>}
                </div>
                {isGestore && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <label className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-black text-white ${uploadingDocId === `${capitolatoAperto.id}-relazione` ? 'bg-slate-400' : 'bg-emerald-700'}`}>
                        {uploadingDocId === `${capitolatoAperto.id}-relazione` ? 'Carico...' : 'Carica relazione'}
                        <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaDocumentoTecnico(capitolatoAperto, 'relazione', e.target.files?.[0])} className="hidden" disabled={uploadingDocId === `${capitolatoAperto.id}-relazione`} />
                      </label>
                      <label className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-black text-white ${uploadingDocId === `${capitolatoAperto.id}-offerta` ? 'bg-slate-400' : 'bg-sky-700'}`}>
                        {uploadingDocId === `${capitolatoAperto.id}-offerta` ? 'Carico...' : 'Carica offerta'}
                        <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaDocumentoTecnico(capitolatoAperto, 'offerta', e.target.files?.[0])} className="hidden" disabled={uploadingDocId === `${capitolatoAperto.id}-offerta`} />
                      </label>
                    </div>
                    <div className="rounded-xl border border-sky-100 bg-sky-50 p-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Valore offerta</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={capitolatoAperto.valore_offerta || ''}
                          placeholder="Importo offerta"
                          className="w-full rounded-xl border border-sky-200 bg-white px-2 py-2 text-xs font-bold"
                          onBlur={(e) => {
                            if (e.target.value) salvaValoreOffertaCapitolato(capitolatoAperto, e.target.value);
                          }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">Attuale: {formatEuro(capitolatoAperto.valore_offerta || 0)}</p>
                      <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Fornitore collegato all'offerta</p>
                        <select
                          value={capitolatoAperto.azienda_partner_id || capitolatoAperto.azienda_vincitrice_id || ''}
                          onChange={(e) => salvaFornitoreOffertaCapitolato(capitolatoAperto, e.target.value)}
                          className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-2 py-2 text-xs font-bold"
                        >
                          <option value="">Seleziona fornitore</option>
                          {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
                        </select>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">Serve per mostrare DURC, polizza, certificazioni e garanzie nella modalità assemblea.</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isGestore && capitolatoAperto.valore_offerta && (
                  <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-2">
                    <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Valore offerta</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{formatEuro(capitolatoAperto.valore_offerta || 0)}</p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-white p-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">Conversione CaSP</p>
                {capitolatoAperto.convertita_casp ? (
                  <div className="mt-2 rounded-2xl border border-purple-100 bg-purple-50 p-3">
                    <p className="text-sm font-black text-purple-800">Convertita in CaSP</p>
                    <p className="text-xs text-slate-500">Valore deliberato: {formatEuro(capitolatoAperto.valore_aggiudicato || capitolatoAperto.valore_offerta || 0)}</p>
                  </div>
                ) : isGestore ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">In attesa di decisione amministratore / aggiudicazione.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Decisione amministratore: {capitolatoAperto.decisione_amministratore || 'Da gestire'}</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'accetta')} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Accetta offerta</button>
                      <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'rifiuta')} className="rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white">Rifiuta offerta</button>
                      <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'richiedi')} className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white">Richiedi integrazione</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 max-h-[650px] overflow-y-auto pr-1 csp-scroll">
          {capitolatiVisibili.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Nessun capitolato presente.
            </div>
          ) : (
            <div className="space-y-4">
              {groupItemsByWorkflowStatus(capitolatiVisibili, flussoCasepSteps).map((group) => (
                <WorkflowStatusGroup key={group.step.label} step={group.step} count={group.items.length} tone="sky">
                  {group.items.map((item) => (
                    <article
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setCapitolatoApertoId(Number(item.id))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setCapitolatoApertoId(Number(item.id));
                        }
                      }}
                      className={`group cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50/50 hover:shadow-md active:bg-sky-100 ${MOTION_CARD}`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-slate-900">{item.numero_pratica || `#${item.id}`}</p>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                              item.priorita === 'Alta' ? 'bg-red-100 text-red-700' :
                              item.priorita === 'Bassa' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {item.priorita || 'Media'}
                            </span>
                          </div>
                          <h4 className="mt-1 text-base font-black text-slate-900">{item.titolo || 'Capitolato senza titolo'}</h4>
                          <p className="mt-1 text-sm font-semibold text-slate-500">{item.condominio_nome || 'Condominio n.d.'}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">{item.indirizzo || ''} {item.citta || ''}</p>
                          {isGestore && <p className="mt-1 text-xs font-semibold text-slate-400">{item.amministratore_nome || item.amministratore_email || 'Amministratore n.d.'}</p>}
                        </div>
                        <div className="flex flex-col items-start gap-2 md:items-end">
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase text-sky-700">{item.stato || 'Nuovo capitolato'}</span>
                          <span className="text-sm font-black text-slate-900">
                            {Number(item.valore_offerta || 0) > 0 ? formatEuro(item.valore_offerta || 0) : <span className="text-xs font-bold text-slate-400">Offerta non caricata</span>}
                          </span>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-700 text-lg font-black text-white shadow-md shadow-sky-900/20 transition group-hover:scale-105">›</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </WorkflowStatusGroup>
              ))}
            </div>
          )}
        </div>
      </section>

      {capitolatoAperto && (
        <section
          data-casep-open-panel
          className="fixed inset-0 z-[10050] overflow-y-auto bg-slate-950/50 px-3 py-5 backdrop-blur-sm md:px-6"
          onClick={() => setCapitolatoApertoId(null)}
        >
          <div
            className="mx-auto max-w-7xl rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Scheda pratica capitolato</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">{capitolatoAperto.numero_pratica || `#${capitolatoAperto.id}`} — {capitolatoAperto.titolo}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{capitolatoAperto.condominio_nome || 'Condominio n.d.'} • {capitolatoAperto.indirizzo || ''} {capitolatoAperto.citta || ''}</p>
              <GoogleMapsButton parts={[capitolatoAperto.indirizzo, capitolatoAperto.citta, capitolatoAperto.condominio_nome]} className="mt-3" />
            </div>
            <button
              type="button"
              onClick={() => setCapitolatoApertoId(null)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600"
            >
              Chiudi scheda
            </button>
          </div>

          <div className="mt-4">
            <FlussoOperativoPratica
              titolo="Avanzamento CaSeP"
              stato={capitolatoAperto.stato || 'Nuovo capitolato'}
              steps={flussoCasepSteps}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Stato pratica</p>
              {isGestore ? (
                <div className="mt-2 space-y-2">
                  <select
                    value={capitolatoAperto.stato || 'Nuovo capitolato'}
                    onChange={(e) => onUpdateCapitolato(capitolatoAperto.id, { stato: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-black"
                  >
                    {stati.map((stato) => <option key={stato} value={stato}>{stato}</option>)}
                  </select>

                  {(capitolatoAperto.stato === 'Sopralluogo programmato' || !capitolatoAperto.data_sopralluogo) && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-2">
                      <p className="text-[11px] font-black uppercase tracking-wide text-amber-700">Data sopralluogo</p>
                      <input
                        type="date"
                        value={capitolatoAperto.data_sopralluogo || ''}
                        onChange={(e) => {
                          if (!e.target.value) return;
                          aggiornaWorkflowTecnico(capitolatoAperto, {
                            data_sopralluogo: e.target.value,
                            stato: 'Sopralluogo programmato',
                          });
                          alert('Data sopralluogo inserita. Notifica avviata.');
                        }}
                        className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-2 py-2 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <span className="mt-2 inline-block rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase text-sky-700">{capitolatoAperto.stato || 'Nuovo capitolato'}</span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Sopralluogo</p>
              {isGestore ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="date"
                    value={capitolatoAperto.data_sopralluogo || ''}
                    onChange={(e) => aggiornaWorkflowTecnico(capitolatoAperto, { data_sopralluogo: e.target.value || null, stato: e.target.value ? 'Sopralluogo programmato' : capitolatoAperto.stato })}
                    className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                  />
                  <textarea
                    defaultValue={capitolatoAperto.note_sopralluogo || ''}
                    onBlur={(e) => aggiornaWorkflowTecnico(capitolatoAperto, { note_sopralluogo: e.target.value })}
                    placeholder="Note sopralluogo"
                    className="min-h-16 w-full rounded-xl border border-slate-200 px-2 py-2 text-xs"
                  />
                </div>
              ) : (
                <p className="mt-2 text-xs font-semibold text-slate-600">{capitolatoAperto.data_sopralluogo || 'Da programmare'}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Assemblea</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">{isGestore ? 'Compilabile dall’amministratore.' : 'Inserisci data, orario e luogo assemblea e richiedi presenza CSP.'}</p>
              <div className="mt-2 space-y-2">
                <input
                  type="date"
                  value={assembleaDraft.capitolatoId === capitolatoAperto.id ? assembleaDraft.data : (capitolatoAperto.data_assemblea || '')}
                  onChange={(e) => setAssembleaDraft((prev) => ({
                    ...prev,
                    capitolatoId: capitolatoAperto.id,
                    data: e.target.value || '',
                  }))}
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                  disabled={isGestore}
                />
                <input
                  type="time"
                  value={assembleaDraft.capitolatoId === capitolatoAperto.id ? assembleaDraft.ora : estraiOraAssemblea(capitolatoAperto.luogo_assemblea)}
                  onChange={(e) => setAssembleaDraft((prev) => ({
                    ...prev,
                    capitolatoId: capitolatoAperto.id,
                    ora: e.target.value || '',
                  }))}
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                  disabled={isGestore}
                />
                <input
                  value={assembleaDraft.capitolatoId === capitolatoAperto.id ? assembleaDraft.luogo : pulisciLuogoAssemblea(capitolatoAperto.luogo_assemblea || '')}
                  onChange={(e) => setAssembleaDraft((prev) => ({
                    ...prev,
                    capitolatoId: capitolatoAperto.id,
                    luogo: e.target.value,
                  }))}
                  placeholder="Luogo assemblea"
                  className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs"
                  disabled={isGestore}
                />
                {!isGestore && (
                  <button
                    type="button"
                    onClick={() => pianificaAssembleaCapitolato(capitolatoAperto)}
                    className="w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white transition hover:bg-amber-700"
                  >
                    Pianifica assemblea
                  </button>
                )}
                <div className="flex flex-wrap gap-2">
                  <a href={buildGoogleCalendarUrl(capitolatoAperto)} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Google Calendar</a>
                  {!capitolatoAperto.presenza_csp_richiesta ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await aggiornaWorkflowTecnico(capitolatoAperto, { presenza_csp_richiesta: true, stato: 'Presenza CSP richiesta' });
                        alert('Richiesta presenza CSP inviata correttamente.');
                      }}
                      className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white"
                    >
                      Richiedi presenza CSP
                    </button>
                  ) : (
                    <span className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">Presenza CSP richiesta</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Documenti</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {capitolatoAperto.capitolato_pdf_url && <a href={capitolatoAperto.capitolato_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Capitolato</a>}
                {capitolatoAperto.relazione_pdf_url && <a href={capitolatoAperto.relazione_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Relazione</a>}
                {capitolatoAperto.offerta_pdf_url && <a href={capitolatoAperto.offerta_pdf_url} target="_blank" rel="noreferrer" className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-black text-white">Offerta</a>}
              </div>

              {isGestore && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <label className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-black text-white ${uploadingDocId === `${capitolatoAperto.id}-relazione` ? 'bg-slate-400' : 'bg-emerald-700'}`}>
                      {uploadingDocId === `${capitolatoAperto.id}-relazione` ? 'Carico...' : 'Carica relazione'}
                      <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaDocumentoTecnico(capitolatoAperto, 'relazione', e.target.files?.[0])} className="hidden" disabled={uploadingDocId === `${capitolatoAperto.id}-relazione`} />
                    </label>
                    <label className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-black text-white ${uploadingDocId === `${capitolatoAperto.id}-offerta` ? 'bg-slate-400' : 'bg-sky-700'}`}>
                      {uploadingDocId === `${capitolatoAperto.id}-offerta` ? 'Carico...' : 'Carica offerta'}
                      <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaDocumentoTecnico(capitolatoAperto, 'offerta', e.target.files?.[0])} className="hidden" disabled={uploadingDocId === `${capitolatoAperto.id}-offerta`} />
                    </label>
                  </div>
                  <div className="rounded-xl border border-sky-100 bg-sky-50 p-2">
                    <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Valore offerta</p>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={capitolatoAperto.valore_offerta || ''}
                      placeholder="Importo offerta"
                      className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-2 py-2 text-xs font-bold"
                      onBlur={(e) => {
                        if (e.target.value) salvaValoreOffertaCapitolato(capitolatoAperto, e.target.value);
                      }}
                    />
                    <p className="mt-1 text-xs font-semibold text-slate-500">Attuale: {formatEuro(capitolatoAperto.valore_offerta || 0)}</p>
                  </div>
                </div>
              )}

              {!isGestore && capitolatoAperto.valore_offerta && (
                <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50 p-2">
                  <p className="text-[11px] font-black uppercase tracking-wide text-sky-700">Valore offerta</p>
                  <p className="mt-1 text-sm font-black text-slate-900">{formatEuro(capitolatoAperto.valore_offerta || 0)}</p>
                </div>
              )}

              {Number(capitolatoAperto.importo_presunto || 0) > 0 && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">Importo presunto indicato dall'amministratore</p>
                  <p className="mt-1 text-sm font-black text-slate-700">{formatEuro(capitolatoAperto.importo_presunto || 0)}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400">Dato informativo interno: non entra nelle statistiche né nella fatturazione.</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Conversione CaSP</p>
              {capitolatoAperto.convertita_casp ? (
                <div className="mt-2 rounded-2xl border border-purple-100 bg-purple-50 p-3">
                  <p className="text-sm font-black text-purple-800">Convertita in CaSP</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{capitolatoAperto.azienda_vincitrice_nome || aziendaById(capitolatoAperto.azienda_vincitrice_id)?.ragione_sociale || 'Azienda n.d.'}</p>
                  <p className="text-xs text-slate-500">Valore deliberato: {formatEuro(capitolatoAperto.valore_aggiudicato || capitolatoAperto.valore_offerta || 0)}</p>
                </div>
              ) : isGestore ? (
                <div className="mt-2 space-y-2">
                  <select
                    value={conversioneDraft[capitolatoAperto.id]?.azienda_vincitrice_id || capitolatoAperto.azienda_vincitrice_id || ''}
                    onChange={(e) => updateConversioneDraft(capitolatoAperto.id, 'azienda_vincitrice_id', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                  >
                    <option value="">Azienda vincitrice</option>
                    {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={conversioneDraft[capitolatoAperto.id]?.valore_aggiudicato ?? capitolatoAperto.valore_aggiudicato ?? capitolatoAperto.valore_offerta ?? ''}
                    onChange={(e) => updateConversioneDraft(capitolatoAperto.id, 'valore_aggiudicato', e.target.value)}
                    placeholder="Valore deliberato"
                    className="w-full rounded-xl border border-slate-200 px-2 py-2 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const draft = conversioneDraft[capitolatoAperto.id] || {};
                      convertiInCasp(
                        capitolatoAperto,
                        draft.azienda_vincitrice_id || capitolatoAperto.azienda_vincitrice_id,
                        draft.valore_aggiudicato ?? capitolatoAperto.valore_aggiudicato ?? capitolatoAperto.valore_offerta,
                        draft.note_conversione_casp ?? capitolatoAperto.note_conversione_casp
                      );
                    }}
                    className="w-full rounded-xl bg-purple-700 px-3 py-2 text-xs font-black text-white"
                  >
                    Converti in CaSP
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-semibold text-slate-500">Decisione amministratore: {capitolatoAperto.decisione_amministratore || 'Da gestire'}</p>
                  <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'accetta')} className="w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Accetta offerta</button>
                  <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'rifiuta')} className="w-full rounded-xl bg-red-700 px-3 py-2 text-xs font-black text-white">Rifiuta offerta</button>
                  <button type="button" onClick={() => azioneAmministratoreOfferta(capitolatoAperto, 'richiedi')} className="w-full rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white">Richiedi integrazione</button>
                </div>
              )}
            </div>
          </div>

          <VotazioneAssembleaCasep
            capitolato={capitolatoAperto}
            utentiCondomini={utentiCondomini}
            utentiSistema={utentiSistema}
            votiAssemblea={votiAssembleaCasep}
            onSaveVotoAssemblea={onSaveVotoAssembleaCasep}
          />

          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">Timeline pratica</p>
            <div className="mt-2 max-h-28 space-y-1 overflow-auto csp-scroll">
              {(capitolatiEventi || [])
                .filter((evento) => Number(evento.capitolato_id) === Number(capitolatoAperto.id))
                .slice(0, 8)
                .map((evento) => (
                  <div key={evento.id} className="rounded-xl bg-white px-2 py-2 text-xs">
                    <span className="font-black text-slate-700">{evento.tipo_evento}</span>
                    <span className="ml-2 text-slate-600">{evento.descrizione}</span>
                  </div>
                ))}
            </div>
          </div>
          </div>
        </section>
      )}
      </section>
    </>
  );
}

function FatturazioneAmministratoreSuite({ fatturePartner, condomini, aziendePartner }) {
  const [searchNumero, setSearchNumero] = useState('');
  const [searchCondominio, setSearchCondominio] = useState('');
  const [searchFornitore, setSearchFornitore] = useState('');
  const [searchStato, setSearchStato] = useState('');

  const aziendaById = (id) => (aziendePartner || []).find((a) => Number(a.id) === Number(id));
  const condominioById = (id) => (condomini || []).find((c) => Number(c.id) === Number(id));

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const limite15 = new Date(oggi);
  limite15.setDate(limite15.getDate() + 15);

  const fatture = fatturePartner || [];
  const totaleFatture = fatture.reduce((sum, f) => sum + Number(f.totale || 0), 0);
  const fattureAperte = fatture.filter((f) => !['pagata', 'annullata'].includes(String(f.stato || '').toLowerCase()));

  const fattureInScadenza = fattureAperte
    .filter((f) => {
      if (!f.data_scadenza) return false;
      const scadenza = new Date(f.data_scadenza);
      scadenza.setHours(0, 0, 0, 0);
      return scadenza >= oggi && scadenza <= limite15;
    })
    .sort((a, b) => String(a.data_scadenza || '').localeCompare(String(b.data_scadenza || '')));

  const fattureScadute = fattureAperte
    .filter((f) => {
      if (!f.data_scadenza) return false;
      const scadenza = new Date(f.data_scadenza);
      scadenza.setHours(0, 0, 0, 0);
      return scadenza < oggi;
    })
    .sort((a, b) => String(a.data_scadenza || '').localeCompare(String(b.data_scadenza || '')));

  const fornitoriIdsFatture = [...new Set((fatture || []).map((fattura) => Number(fattura.azienda_partner_id)).filter(Boolean))];

  const fornitoriFiltro = (aziendePartner || [])
    .filter((azienda) => fornitoriIdsFatture.length === 0 || fornitoriIdsFatture.includes(Number(azienda.id)))
    .sort((a, b) => String(a.ragione_sociale || '').localeCompare(String(b.ragione_sociale || '')));

  const fattureFiltrate = fatture.filter((fattura) => {
    const condominio = condominioById(fattura.condominio_id)?.nome || '';
    const fornitore = aziendaById(fattura.azienda_partner_id)?.ragione_sociale || '';
    const matchNumero = !searchNumero || String(fattura.numero_fattura || fattura.id || '').toLowerCase().includes(searchNumero.toLowerCase().trim());
    const matchCondominio = !searchCondominio || condominio.toLowerCase().includes(searchCondominio.toLowerCase().trim());
    const matchFornitore = !searchFornitore || fornitore.toLowerCase().includes(searchFornitore.toLowerCase().trim());
    const matchStato = !searchStato || String(fattura.stato || '') === searchStato;
    return matchNumero && matchCondominio && matchFornitore && matchStato;
  });

  const renderMiniFattura = (fattura, tone = 'amber') => (
    <div key={fattura.id} className={`rounded-2xl border bg-white p-3 ${tone === 'red' ? 'border-red-100' : 'border-amber-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
          <p className="text-xs font-semibold text-slate-500">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Fornitore n.d.'}</p>
          <p className="text-xs text-slate-500">{condominioById(fattura.condominio_id)?.nome || 'Condominio n.d.'}</p>
        </div>
        <div className="text-right">
          <p className={`font-black ${tone === 'red' ? 'text-red-700' : 'text-amber-700'}`}>{formatEuro(fattura.totale || 0)}</p>
          <p className="text-xs font-bold text-slate-500">Scad. {fattura.data_scadenza || 'n.d.'}</p>
        </div>
      </div>
      {fattura.file_url && (
        <a href={fattura.file_url} target="_blank" rel="noreferrer" className={`mt-2 inline-block text-xs font-black ${tone === 'red' ? 'text-red-700' : 'text-amber-700'}`}>
          Apri PDF
        </a>
      )}
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="h-[420px] overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Prossimi 15 giorni</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Fatture in scadenza</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-amber-700 shadow-sm">{fattureInScadenza.length}</span>
          </div>
          <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-1 csp-scroll">
            {fattureInScadenza.length === 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm font-semibold text-slate-500">Nessuna fattura in scadenza.</div>
            ) : fattureInScadenza.map((fattura) => renderMiniFattura(fattura, 'amber'))}
          </div>
        </section>

        <section className="h-[420px] overflow-hidden rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Scadenza superata</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Fatture scadute</h2>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-red-700 shadow-sm">{fattureScadute.length}</span>
          </div>
          <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-1 csp-scroll">
            {fattureScadute.length === 0 ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm font-semibold text-slate-500">Nessuna fattura scaduta.</div>
            ) : fattureScadute.map((fattura) => renderMiniFattura(fattura, 'red'))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Fatturazione</p>
            <h2 className="mt-1 text-xl font-bold">Fatturazione</h2>
            <p className="mt-1 text-sm text-slate-500">Ricerca e riepilogo fatture per numero, condominio, fornitore e stato.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[520px]">
            <DashboardStat label="Totale fatture" value={formatEuro(totaleFatture)} tone="sky" />
            <DashboardStat label="In scadenza" value={fattureInScadenza.length} tone="amber" />
            <DashboardStat label="Scadute" value={fattureScadute.length} tone="red" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={searchNumero} onChange={(e) => setSearchNumero(e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <select value={searchCondominio} onChange={(e) => setSearchCondominio(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
            <option value="">Tutti i condomini</option>
            {(condomini || []).map((condominio) => <option key={condominio.id} value={condominio.nome}>{condominio.nome}</option>)}
          </select>
          <select value={searchFornitore} onChange={(e) => setSearchFornitore(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
            <option value="">Tutti i fornitori</option>
            {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.ragione_sociale}>{azienda.ragione_sociale}</option>)}
          </select>
          <select value={searchStato} onChange={(e) => setSearchStato(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
            <option value="">Tutti gli stati</option>
            <option value="bozza">Bozza</option>
            <option value="inviata">Inviata</option>
            <option value="pagata">Pagata</option>
            <option value="scaduta">Scaduta</option>
            <option value="annullata">Annullata</option>
          </select>
        </div>
      </section>

      <section className="h-[560px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Archivio fatture</p>
        <h2 className="mt-1 text-xl font-bold">Elenco fatture</h2>

        <div className="mt-4 max-h-[450px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[920px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Fattura</th>
                <th className="px-3 py-3">Condominio</th>
                <th className="px-3 py-3">Fornitore</th>
                <th className="px-3 py-3 text-right">Totale</th>
                <th className="px-3 py-3">Scadenza</th>
                <th className="px-3 py-3">Stato</th>
                <th className="px-3 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody>
              {fattureFiltrate.length === 0 ? (
                <tr><td colSpan="7" className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Nessuna fattura trovata.</td></tr>
              ) : (
                fattureFiltrate.map((fattura) => (
                  <tr key={fattura.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                      <p className="text-xs text-slate-500">{fattura.data_emissione || 'n.d.'}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{condominioById(fattura.condominio_id)?.nome || 'n.d.'}</td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'n.d.'}</td>
                    <td className="px-3 py-3 text-right font-black text-slate-900">{formatEuro(fattura.totale || 0)}</td>
                    <td className="px-3 py-3 text-slate-600">{fattura.data_scadenza || 'n.d.'}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                        fattura.stato === 'pagata' ? 'bg-emerald-100 text-emerald-700' :
                        fattura.stato === 'scaduta' ? 'bg-red-100 text-red-700' :
                        fattura.stato === 'inviata' ? 'bg-sky-100 text-sky-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {fattura.stato}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {fattura.file_url ? (
                        <a href={fattura.file_url} target="_blank" rel="noreferrer" className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-black text-white">Apri</a>
                      ) : (
                        <span className="text-xs text-slate-400">n.d.</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}


function CampagnePartnerSuite({ partnerCampaignLog, aziendePartner }) {
  const [search, setSearch] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [esitoFiltro, setEsitoFiltro] = useState('');
  const [sendingCampaignId, setSendingCampaignId] = useState(null);

  const aziendaById = (id) => (aziendePartner || []).find((azienda) => Number(azienda.id) === Number(id));
  const campagne = partnerCampaignLog || [];
  const filtrate = campagne.filter((campagna) => {
    const azienda = aziendaById(campagna.azienda_id)?.ragione_sociale || '';
    const testo = [azienda, campagna.destinatario, campagna.tipo_campagna, campagna.esito, campagna.note].filter(Boolean).join(' ').toLowerCase();

    return (!search || testo.includes(search.toLowerCase().trim()))
      && (!tipoFiltro || campagna.tipo_campagna === tipoFiltro)
      && (!esitoFiltro || campagna.esito === esitoFiltro);
  });

  const inviate = campagne.filter((c) => c.esito === 'inviata').length;
  const errori = campagne.filter((c) => c.esito === 'errore').length;
  const dryRun = campagne.filter((c) => c.esito === 'dry_run').length;
  const aziendeContattate = new Set(campagne.map((c) => c.azienda_id).filter(Boolean)).size;
  const followup = campagne.filter((c) => c.tipo_campagna === 'followup').length;
  const annuali = campagne.filter((c) => c.tipo_campagna === 'annuale').length;
  const premium = campagne.filter((c) => c.tipo_campagna === 'premium').length;

  const valoreStimatoCampagna = (tipo) => {
    if (tipo === 'premium') return 5000;
    if (tipo === 'annuale') return 5000;
    if (tipo === 'followup') return 1000;
    return 0;
  };

  const valorePipelineCampagne = campagne.reduce((sum, campagna) => sum + valoreStimatoCampagna(campagna.tipo_campagna), 0);
  const valoreCampagneInviate = campagne
    .filter((campagna) => campagna.esito === 'inviata')
    .reduce((sum, campagna) => sum + valoreStimatoCampagna(campagna.tipo_campagna), 0);

  const partnerEconomici = [...new Set(campagne.map((c) => c.azienda_id).filter(Boolean))]
    .map((aziendaId) => {
      const azienda = aziendaById(aziendaId);
      const campagneAzienda = campagne.filter((c) => Number(c.azienda_id) === Number(aziendaId));
      const valore = campagneAzienda.reduce((sum, campagna) => sum + valoreStimatoCampagna(campagna.tipo_campagna), 0);
      const ultima = campagneAzienda[0];

      return {
        aziendaId,
        azienda,
        campagne: campagneAzienda.length,
        valore,
        ultimaCampagna: ultima?.tipo_campagna || '',
        ultimoEsito: ultima?.esito || '',
      };
    })
    .sort((a, b) => b.valore - a.valore);

  const topValorePartner = partnerEconomici[0];
  const forecastConservativo = Math.round(valoreCampagneInviate * 0.15);
  const forecastMedio = Math.round(valoreCampagneInviate * 0.30);
  const forecastAmbizioso = Math.round(valoreCampagneInviate * 0.50);

  return (
    <section className="space-y-4">
      <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Campagne Partner CaSP</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Pilota commerciale</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Monitoraggio separato degli invii commerciali alle aziende partner, senza interferire con CaSeP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:min-w-[560px] md:grid-cols-4">
            <DashboardStat label="Campagne" value={campagne.length} tone="sky" />
            <DashboardStat label="Inviate" value={inviate} tone="emerald" />
            <DashboardStat label="Errori" value={errori} tone="red" />
            <DashboardStat label="Aziende" value={aziendeContattate} tone="purple" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <DashboardStat label="Follow-up" value={followup} tone="amber" />
          <DashboardStat label="Annuali" value={annuali} tone="emerald" />
          <DashboardStat label="Premium" value={premium} tone="purple" />
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Revenue Intelligence</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Valore commerciale campagne</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Stima prudenziale del potenziale economico generato dalle campagne partner CaSP.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:min-w-[560px] md:grid-cols-4">
            <DashboardStat label="Pipeline stimata" value={formatEuro(valorePipelineCampagne)} tone="emerald" />
            <DashboardStat label="Campagne inviate" value={formatEuro(valoreCampagneInviate)} tone="sky" />
            <DashboardStat label="Forecast medio" value={formatEuro(forecastMedio)} tone="purple" />
            <DashboardStat label="Top partner" value={topValorePartner?.azienda?.ragione_sociale || 'n.d.'} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <DashboardStat label="Scenario conservativo 15%" value={formatEuro(forecastConservativo)} tone="slate" />
          <DashboardStat label="Scenario medio 30%" value={formatEuro(forecastMedio)} tone="emerald" />
          <DashboardStat label="Scenario ambizioso 50%" value={formatEuro(forecastAmbizioso)} tone="purple" />
        </div>

        <div className="mt-4 max-h-[300px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[860px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3 text-right">Campagne</th>
                <th className="px-3 py-3 text-right">Valore stimato</th>
                <th className="px-3 py-3">Ultima campagna</th>
                <th className="px-3 py-3">Esito</th>
              </tr>
            </thead>
            <tbody>
              {partnerEconomici.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessun dato economico disponibile.
                  </td>
                </tr>
              ) : (
                partnerEconomici.map((row) => (
                  <tr key={row.aziendaId} className="border-t border-slate-100 hover:bg-emerald-50/30">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-900">{row.azienda?.ragione_sociale || `Azienda #${row.aziendaId}`}</p>
                    </td>
                    <td className="px-3 py-3 text-right font-black text-slate-700">{row.campagne}</td>
                    <td className="px-3 py-3 text-right font-black text-emerald-700">{formatEuro(row.valore)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase text-sky-700">
                        {row.ultimaCampagna || 'n.d.'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        row.ultimoEsito === 'inviata'
                          ? 'bg-emerald-100 text-emerald-700'
                          : row.ultimoEsito === 'errore'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {row.ultimoEsito || 'n.d.'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700">Decision Engine</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Direttore commerciale digitale</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Prioritizzazione automatica partner, scoring conversione e suggerimento prossima campagna.
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3 text-right">Score</th>
                <th className="px-3 py-3">Temperatura</th>
                <th className="px-3 py-3">Prossima azione</th>
                <th className="px-3 py-3">Priorità</th>
              </tr>
            </thead>
            <tbody>
              {partnerEconomici.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessun partner analizzabile.
                  </td>
                </tr>
              ) : (
                partnerEconomici.map((row) => {
                  const score =
                    (row.valore >= 10000 ? 40 : row.valore >= 5000 ? 25 : 10)
                    + (row.campagne >= 3 ? 25 : row.campagne >= 2 ? 15 : 5)
                    + (row.ultimoEsito === 'inviata' ? 20 : row.ultimoEsito === 'dry_run' ? 10 : 0);

                  const temperatura =
                    score >= 70 ? 'Caldo'
                    : score >= 40 ? 'Tiepido'
                    : 'Freddo';

                  const prossimaAzione =
                    row.ultimaCampagna === 'followup'
                      ? 'Campagna annuale'
                      : row.ultimaCampagna === 'annuale'
                        ? 'Campagna premium'
                        : row.ultimaCampagna === 'premium'
                          ? 'Contatto diretto gestore'
                          : 'Follow-up';

                  const priorita =
                    score >= 70 ? 'Alta'
                    : score >= 40 ? 'Media'
                    : 'Bassa';

                  return (
                    <tr key={`decision-${row.aziendaId}`} className="border-t border-slate-100 hover:bg-purple-50/30">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{row.azienda?.ragione_sociale || `Azienda #${row.aziendaId}`}</p>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-purple-700">{score}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          temperatura === 'Caldo'
                            ? 'bg-red-100 text-red-700'
                            : temperatura === 'Tiepido'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {temperatura}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{prossimaAzione}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          priorita === 'Alta'
                            ? 'bg-purple-100 text-purple-700'
                            : priorita === 'Media'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {priorita}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Automation Engine</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Azioni operative consigliate</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Partner prioritizzati con suggerimento immediato per accelerare conversioni commerciali.
            </p>
          </div>
        </div>

        <div className="mt-4 max-h-[460px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[1080px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3">Temperatura</th>
                <th className="px-3 py-3">Campagna consigliata</th>
                <th className="px-3 py-3">Canale</th>
                <th className="px-3 py-3">Priorità</th>
                <th className="px-3 py-3">Stato operativo</th>
                <th className="px-3 py-3 text-right">Scheda</th>
              </tr>
            </thead>
            <tbody>
              {partnerEconomici.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessun partner disponibile.
                  </td>
                </tr>
              ) : (
                partnerEconomici.map((row) => {
                  const score =
                    (row.valore >= 10000 ? 40 : row.valore >= 5000 ? 25 : 10)
                    + (row.campagne >= 3 ? 25 : row.campagne >= 2 ? 15 : 5)
                    + (row.ultimoEsito === 'inviata' ? 20 : row.ultimoEsito === 'dry_run' ? 10 : 0);

                  const temperatura =
                    score >= 70 ? 'Caldo'
                    : score >= 40 ? 'Tiepido'
                    : 'Freddo';

                  const campagna =
                    row.ultimaCampagna === 'followup'
                      ? 'Annuale'
                      : row.ultimaCampagna === 'annuale'
                        ? 'Premium'
                        : row.ultimaCampagna === 'premium'
                          ? 'Contatto diretto'
                          : 'Follow-up';

                  const canale =
                    temperatura === 'Caldo'
                      ? 'Email + Push + WA'
                      : temperatura === 'Tiepido'
                        ? 'Email + Push'
                        : 'Email';

                  const priorita =
                    score >= 70 ? 'Alta'
                    : score >= 40 ? 'Media'
                    : 'Bassa';

                  return (
                    <tr key={`automation-${row.aziendaId}`} className="border-t border-slate-100 hover:bg-amber-50/30">
                      <td className="px-3 py-3 font-black text-slate-900">
                        {row.azienda?.ragione_sociale || `Azienda #${row.aziendaId}`}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          temperatura === 'Caldo'
                            ? 'bg-red-100 text-red-700'
                            : temperatura === 'Tiepido'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {temperatura}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{campagna}</td>
                      <td className="px-3 py-3 text-slate-600">{canale}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          priorita === 'Alta'
                            ? 'bg-purple-100 text-purple-700'
                            : priorita === 'Media'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {priorita}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-emerald-700 font-black">
                        {priorita === 'Alta' ? 'Invio immediato consigliato' : priorita === 'Media' ? 'Monitorare / programmare' : 'Nurturing'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {campagna === 'Contatto diretto' ? (
                          <span className="rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-500">Contatto manuale</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => eseguiCampagnaConsigliata(row.azienda, campagna === 'Annuale' ? 'annuale' : campagna === 'Premium' ? 'premium' : 'followup')}
                            disabled={sendingCampaignId === row.aziendaId}
                            className={`rounded-xl px-3 py-2 text-xs font-black text-white ${sendingCampaignId === row.aziendaId ? 'bg-slate-400' : 'bg-emerald-700'}`}
                          >
                            {sendingCampaignId === row.aziendaId ? 'Invio...' : 'Esegui campagna'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Esecuzione semi-automatica</p>
        <h2 className="mt-1 text-xl font-black text-slate-900">Campagna consigliata pronta all’invio</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Il pulsante “Esegui campagna” usa la edge <strong>campaign-partner-casp</strong>, registra l’invio in archivio e mantiene separata la logica dalla sezione CaSeP.
        </p>
      </section>

      <section className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-700">Full Commercial Control</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Controllo commerciale avanzato</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Gestione VIP, blacklist, saturazione commerciale e priorità territoriale partner.
          </p>
        </div>

        <div className="mt-4 max-h-[480px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[1180px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3">Classe</th>
                <th className="px-3 py-3">Stato</th>
                <th className="px-3 py-3">Territorio</th>
                <th className="px-3 py-3">Rischio saturazione</th>
                <th className="px-3 py-3">Azione consigliata</th>
              </tr>
            </thead>
            <tbody>
              {partnerEconomici.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessun partner disponibile.
                  </td>
                </tr>
              ) : (
                partnerEconomici.map((row) => {
                  const classe =
                    row.valore >= 15000 ? 'VIP'
                    : row.valore >= 5000 ? 'Core'
                    : 'Standard';

                  const stato =
                    row.ultimoEsito === 'errore'
                      ? 'Blacklist osservazione'
                      : row.valore >= 15000
                        ? 'Partner strategico'
                        : 'Attivo';

                  const territorio = row.azienda?.provincia || row.azienda?.citta || 'Da assegnare';

                  const saturazione =
                    row.campagne >= 6 ? 'Alta'
                    : row.campagne >= 3 ? 'Media'
                    : 'Bassa';

                  const azione =
                    stato === 'Blacklist osservazione'
                      ? 'Verifica manuale'
                      : classe === 'VIP'
                        ? 'Gestione prioritaria diretta'
                        : saturazione === 'Alta'
                          ? 'Ridurre pressione commerciale'
                          : 'Espansione controllata';

                  return (
                    <tr key={`control-${row.aziendaId}`} className="border-t border-slate-100 hover:bg-rose-50/30">
                      <td className="px-3 py-3 font-black text-slate-900">
                        {row.azienda?.ragione_sociale || `Azienda #${row.aziendaId}`}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          classe === 'VIP'
                            ? 'bg-purple-100 text-purple-700'
                            : classe === 'Core'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {classe}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-700">{stato}</td>
                      <td className="px-3 py-3 text-slate-600">{territorio}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          saturazione === 'Alta'
                            ? 'bg-red-100 text-red-700'
                            : saturazione === 'Media'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {saturazione}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-rose-700">{azione}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-900/10 bg-slate-950 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Executive Master Dashboard</p>
            <h2 className="mt-1 text-2xl font-black">Indice globale di crescita</h2>
            <p className="mt-1 text-sm font-semibold text-slate-300">
              Vista direzionale dell’ecosistema commerciale: campagne, partner, forecast e priorità strategiche.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-right">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Growth Index</p>
            <p className="mt-1 text-3xl font-black text-emerald-300">
              {Math.min(100, Math.round((aziendeContattate * 8) + (inviate * 4) + (premium * 10) + (annuali * 7)))}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Forecast 12 mesi</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{formatEuro(forecastMedio * 12)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Pipeline campagne</p>
            <p className="mt-2 text-2xl font-black text-sky-300">{formatEuro(valorePipelineCampagne)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Partner attivi</p>
            <p className="mt-2 text-2xl font-black text-purple-300">{aziendeContattate}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Campagne premium</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{premium}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Top partner</p>
            <p className="mt-2 truncate text-lg font-black text-white">{topValorePartner?.azienda?.ragione_sociale || 'n.d.'}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-300">Scenario prudente</p>
            <p className="mt-2 text-2xl font-black">{formatEuro(forecastConservativo * 12)}</p>
            <p className="mt-1 text-xs text-emerald-100/80">Stima annuale con conversione bassa.</p>
          </div>
          <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-sky-300">Scenario medio</p>
            <p className="mt-2 text-2xl font-black">{formatEuro(forecastMedio * 12)}</p>
            <p className="mt-1 text-xs text-sky-100/80">Stima annuale realistica su pipeline attiva.</p>
          </div>
          <div className="rounded-3xl border border-purple-300/20 bg-purple-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-purple-300">Scenario espansivo</p>
            <p className="mt-2 text-2xl font-black">{formatEuro(forecastAmbizioso * 12)}</p>
            <p className="mt-1 text-xs text-purple-100/80">Stima annuale con alta conversione partner.</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-100 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Territorial Expansion Matrix</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Espansione territoriale intelligente</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Analisi per territori, saturazione commerciale locale e priorità di sviluppo.
          </p>
        </div>

        <div className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[1180px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Territorio</th>
                <th className="px-3 py-3 text-right">Partner</th>
                <th className="px-3 py-3 text-right">Valore stimato</th>
                <th className="px-3 py-3">Saturazione</th>
                <th className="px-3 py-3">Classe territorio</th>
                <th className="px-3 py-3">Strategia</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const territori = {};

                partnerEconomici.forEach((row) => {
                  const territorio = row.azienda?.provincia || row.azienda?.citta || 'Non assegnato';

                  if (!territori[territorio]) {
                    territori[territorio] = {
                      nome: territorio,
                      partner: 0,
                      valore: 0,
                    };
                  }

                  territori[territorio].partner += 1;
                  territori[territorio].valore += row.valore;
                });

                const territoriArray = Object.values(territori).sort((a, b) => b.valore - a.valore);

                if (territoriArray.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                        Nessun territorio disponibile.
                      </td>
                    </tr>
                  );
                }

                return territoriArray.map((territorio) => {
                  const saturazione =
                    territorio.partner >= 6 ? 'Alta'
                    : territorio.partner >= 3 ? 'Media'
                    : 'Bassa';

                  const classe =
                    territorio.valore >= 30000 ? 'Dominante'
                    : territorio.valore >= 10000 ? 'Strategico'
                    : 'Espansione';

                  const strategia =
                    saturazione === 'Alta'
                      ? 'Ottimizzare conversioni'
                      : classe === 'Dominante'
                        ? 'Protezione leadership'
                        : classe === 'Strategico'
                          ? 'Espansione selettiva'
                          : 'Acquisizione aggressiva';

                  return (
                    <tr key={`territorio-${territorio.nome}`} className="border-t border-slate-100 hover:bg-cyan-50/30">
                      <td className="px-3 py-3 font-black text-slate-900">{territorio.nome}</td>
                      <td className="px-3 py-3 text-right font-black text-slate-700">{territorio.partner}</td>
                      <td className="px-3 py-3 text-right font-black text-emerald-700">{formatEuro(territorio.valore)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          saturazione === 'Alta'
                            ? 'bg-red-100 text-red-700'
                            : saturazione === 'Media'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {saturazione}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          classe === 'Dominante'
                            ? 'bg-purple-100 text-purple-700'
                            : classe === 'Strategico'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {classe}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-cyan-700">{strategia}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-300">Ammigo Central Command</p>
            <h2 className="mt-2 text-3xl font-black">Centrale operativa ecosistema</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-slate-300">
              Supervisione unificata di CSP, CaSeP, CaSP e Campagne commerciali con controllo strategico globale.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-right">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Enterprise Index</p>
            <p className="mt-2 text-4xl font-black text-yellow-300">
              {Math.min(999, aziendeContattate + campagne.length + partnerEconomici.length + premium * 5)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Fatturato potenziale</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{formatEuro(valorePipelineCampagne)}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Forecast annuale</p>
            <p className="mt-2 text-2xl font-black text-sky-300">{formatEuro(forecastMedio * 12)}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Partner attivi</p>
            <p className="mt-2 text-2xl font-black text-purple-300">{aziendeContattate}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Top territori</p>
            <p className="mt-2 text-lg font-black text-cyan-300">{partnerEconomici[0]?.azienda?.provincia || partnerEconomici[0]?.azienda?.citta || 'n.d.'}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Top partner</p>
            <p className="mt-2 truncate text-lg font-black text-white">{topValorePartner?.azienda?.ragione_sociale || 'n.d.'}</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-300">Campagne premium</p>
            <p className="mt-2 text-2xl font-black text-amber-300">{premium}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-300">Direzione CSP</p>
            <p className="mt-2 text-sm font-semibold text-emerald-100">Motore acquisizione amministratori e pipeline primaria.</p>
          </div>
          <div className="rounded-3xl border border-sky-300/20 bg-sky-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-sky-300">Direzione CaSeP / CaSP</p>
            <p className="mt-2 text-sm font-semibold text-sky-100">Capitolati, conversione grandi lavori e governance cantieri.</p>
          </div>
          <div className="rounded-3xl border border-purple-300/20 bg-purple-300/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-purple-300">Direzione Campaign</p>
            <p className="mt-2 text-sm font-semibold text-purple-100">Espansione partner, automazione e crescita territoriale.</p>
          </div>
        </div>
      </section>

      <section className="h-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Storico campagne</p>
            <h2 className="mt-1 text-xl font-bold">Archivio invii commerciali</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca azienda, email, note"
              className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold"
            />
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
              <option value="">Tutte le campagne</option>
              <option value="followup">Follow-up</option>
              <option value="annuale">Annuale</option>
              <option value="premium">Premium</option>
            </select>
            <select value={esitoFiltro} onChange={(e) => setEsitoFiltro(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
              <option value="">Tutti gli esiti</option>
              <option value="inviata">Inviata</option>
              <option value="errore">Errore</option>
              <option value="dry_run">Dry run</option>
            </select>
          </div>
        </div>

        <div className="mt-4 max-h-[640px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Azienda</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Destinatario</th>
                <th className="px-3 py-3">Esito</th>
                <th className="px-3 py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {filtrate.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-3 py-8 text-center text-sm font-semibold text-slate-500">
                    Nessuna campagna presente.
                  </td>
                </tr>
              ) : (
                filtrate.map((campagna) => {
                  const azienda = aziendaById(campagna.azienda_id);
                  return (
                    <tr key={campagna.id} className="border-t border-slate-100 hover:bg-sky-50/30">
                      <td className="px-3 py-3 text-xs font-semibold text-slate-600">
                        {campagna.data_invio ? new Date(campagna.data_invio).toLocaleString('it-IT') : 'n.d.'}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{azienda?.ragione_sociale || `Azienda #${campagna.azienda_id || 'n.d.'}`}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-black uppercase text-sky-700">
                          {campagna.tipo_campagna || 'n.d.'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{campagna.destinatario || 'n.d.'}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                          campagna.esito === 'inviata'
                            ? 'bg-emerald-100 text-emerald-700'
                            : campagna.esito === 'errore'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {campagna.esito || 'n.d.'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-500">{campagna.note || ''}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function FatturazionePartnerSuite({
  aziendePartner,
  provvigioniPartner,
  fatturePartner,
  provvigioniMaturate,
  fattureProvvigioniGestore,
  fattureProvvigioniAmministratori,
  condomini,
  segnalazioni,
  utentiSistema,
  leadAmministratori,
  capitolatiSenzaPensieri = [],
  onCreateAziendaPartner,
  onUpdateAziendaPartner,
  onCreateProvvigionePartner,
  onCreateFatturaPartner,
  onUpdateFatturaPartner,
  onInviaFatturaPartner,
  onUploadFatturaPdf,
  onCreateFatturaProvvigioneGestore,
  onUpdateFatturaProvvigioneGestore,
  onCreateFatturaProvvigioneAmministratore,
  onUpdateFatturaProvvigioneAmministratore,
}) {
  const [aziendaForm, setAziendaForm] = useState({
    ragione_sociale: '',
    partita_iva: '',
    email: '',
    telefono: '',
    referente: '',
    tipo_attivita: 'Impresa edile',
    citta: '',
    provincia: 'Firenze',
    percentuale_gestore: '',
    durc_url: '',
    durc_scadenza: '',
    polizza_url: '',
    polizza_scadenza: '',
    certificazioni_iso: '',
    certificazioni_soa: '',
    schema_garanzie: '',
    note_qualificazione: '',
    note: '',
  });

  const [partnerSearch, setPartnerSearch] = useState('');
  const [aziendaInModifica, setAziendaInModifica] = useState(null);
  const [aziendaEditForm, setAziendaEditForm] = useState({
    ragione_sociale: '',
    partita_iva: '',
    email: '',
    telefono: '',
    referente: '',
    tipo_attivita: '',
    citta: '',
    provincia: '',
    durc_url: '',
    durc_scadenza: '',
    polizza_url: '',
    polizza_scadenza: '',
    certificazioni_iso: '',
    certificazioni_soa: '',
    schema_garanzie: '',
    note_qualificazione: '',
    note: '',
    attiva: true,
    nuova_percentuale_gestore: '',
  });

  const [uploadingFatturaPdf, setUploadingFatturaPdf] = useState(false);
  const [fatturaPdfName, setFatturaPdfName] = useState('');

  const [fatturaForm, setFatturaForm] = useState({
    azienda_partner_id: '',
    amministratore_email: '',
    condominio_id: '',
    segnalazione_id: '',
    capitolato_id: '',
    pratica_tipo: 'csp',
    numero_fattura: '',
    descrizione: '',
    importo_imponibile: '',
    iva: '',
    totale: '',
    file_url: '',
    data_emissione: new Date().toISOString().slice(0, 10),
    data_scadenza: '',
    stato: 'bozza',
    note: '',
  });

  const [fatturaSearchNumero, setFatturaSearchNumero] = useState('');
  const [fatturaSearchPratica, setFatturaSearchPratica] = useState('');
  const [fatturaSearchPartner, setFatturaSearchPartner] = useState('');
  const [fatturaFiltroStato, setFatturaFiltroStato] = useState('');
  const [fatturaInModifica, setFatturaInModifica] = useState(null);
  const [fatturaEditForm, setFatturaEditForm] = useState({
    azienda_partner_id: '',
    amministratore_email: '',
    condominio_id: '',
    segnalazione_id: '',
    capitolato_id: '',
    pratica_tipo: 'csp',
    numero_fattura: '',
    descrizione: '',
    importo_imponibile: '',
    iva: '',
    totale: '',
    file_url: '',
    data_emissione: '',
    data_scadenza: '',
    stato: '',
    note: '',
  });

  const [miaFatturaForm, setMiaFatturaForm] = useState({
    azienda_partner_id: '',
    numero_fattura: '',
    data_fattura: new Date().toISOString().slice(0, 10),
    importo_imponibile: '',
    iva: '22',
    totale: '',
    file_url: '',
    note: '',
  });

  const [fatturaProvvAdminForm, setFatturaProvvAdminForm] = useState({
    amministratore_email: '',
    amministratore_nome: '',
    azienda_partner_id: '',
    numero_fattura: '',
    trimestre: '',
    anno: String(new Date().getFullYear()),
    data_fattura: new Date().toISOString().slice(0, 10),
    importo_imponibile: '',
    iva: '0',
    totale: '',
    stato: 'da_pagare',
    note: '',
  });

  const [adminProvvigioniSelezionato, setAdminProvvigioniSelezionato] = useState('');

  const [miaFatturaInModifica, setMiaFatturaInModifica] = useState(null);
  const [miaFatturaEditForm, setMiaFatturaEditForm] = useState({
    azienda_partner_id: '',
    numero_fattura: '',
    data_fattura: '',
    importo_imponibile: '',
    iva: '',
    totale: '',
    file_url: '',
    stato: '',
    note: '',
  });
  const [fatturaProvvAdminInModifica, setFatturaProvvAdminInModifica] = useState(null);
  const [fatturaProvvAdminEditForm, setFatturaProvvAdminEditForm] = useState({
    amministratore_email: '',
    amministratore_nome: '',
    azienda_partner_id: '',
    numero_fattura: '',
    trimestre: '',
    anno: '',
    data_fattura: '',
    importo_imponibile: '',
    iva: '',
    totale: '',
    stato: '',
    note: '',
  });

  const updateMiaFattura = (field, value) => {
    setMiaFatturaForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }

      return next;
    });
  };

  const updateFatturaProvvAdmin = (field, value) => {
    setFatturaProvvAdminForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'amministratore_email') {
        const admin = amministratori.find((u) => String(u.email || '').toLowerCase() === String(value || '').toLowerCase());
        next.amministratore_nome = admin?.nome || value || '';
      }

      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }

      return next;
    });
  };


  const apriModificaMiaFattura = (fattura) => {
    setMiaFatturaInModifica(fattura);
    setMiaFatturaEditForm({
      azienda_partner_id: fattura.azienda_partner_id || '',
      numero_fattura: fattura.numero_fattura || '',
      data_fattura: fattura.data_fattura ? String(fattura.data_fattura).slice(0, 10) : '',
      importo_imponibile: fattura.importo_imponibile || '',
      iva: fattura.iva ?? '22',
      totale: fattura.totale || '',
      file_url: fattura.file_url || '',
      stato: fattura.stato || 'bozza',
      note: fattura.note || '',
    });
  };

  const updateMiaFatturaEdit = (field, value) => {
    setMiaFatturaEditForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }
      return next;
    });
  };

  const salvaModificaMiaFattura = async () => {
    if (!miaFatturaInModifica?.id) return;
    if (typeof onUpdateFatturaProvvigioneGestore !== 'function') {
      alert('Funzione aggiornamento fattura provvigione gestore non disponibile.');
      return;
    }
    await onUpdateFatturaProvvigioneGestore(miaFatturaInModifica.id, {
      ...miaFatturaEditForm,
      azienda_partner_id: miaFatturaEditForm.azienda_partner_id ? Number(miaFatturaEditForm.azienda_partner_id) : null,
      importo_imponibile: Number(miaFatturaEditForm.importo_imponibile || 0),
      iva: Number(miaFatturaEditForm.iva || 0),
      totale: Number(miaFatturaEditForm.totale || 0),
      data_fattura: miaFatturaEditForm.data_fattura || null,
    });
    setMiaFatturaInModifica(null);
  };

  const apriModificaFatturaProvvAdmin = (fattura) => {
    setFatturaProvvAdminInModifica(fattura);
    setFatturaProvvAdminEditForm({
      amministratore_email: fattura.amministratore_email || '',
      amministratore_nome: fattura.amministratore_nome || '',
      azienda_partner_id: fattura.azienda_partner_id || '',
      numero_fattura: fattura.numero_fattura || '',
      trimestre: fattura.trimestre || '',
      anno: fattura.anno || '',
      data_fattura: fattura.data_fattura ? String(fattura.data_fattura).slice(0, 10) : '',
      importo_imponibile: fattura.importo_imponibile || '',
      iva: fattura.iva ?? '0',
      totale: fattura.totale || '',
      stato: fattura.stato || 'da_pagare',
      note: fattura.note || '',
    });
  };

  const updateFatturaProvvAdminEdit = (field, value) => {
    setFatturaProvvAdminEditForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'amministratore_email') {
        const admin = amministratori.find((u) => String(u.email || '').toLowerCase() === String(value || '').toLowerCase());
        next.amministratore_nome = admin?.nome || value || '';
      }
      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }
      return next;
    });
  };

  const salvaModificaFatturaProvvAdmin = async () => {
    if (!fatturaProvvAdminInModifica?.id) return;
    await onUpdateFatturaProvvigioneAmministratore(fatturaProvvAdminInModifica.id, {
      ...fatturaProvvAdminEditForm,
      azienda_partner_id: fatturaProvvAdminEditForm.azienda_partner_id ? Number(fatturaProvvAdminEditForm.azienda_partner_id) : null,
      anno: fatturaProvvAdminEditForm.anno ? Number(fatturaProvvAdminEditForm.anno) : null,
      importo_imponibile: Number(fatturaProvvAdminEditForm.importo_imponibile || 0),
      iva: Number(fatturaProvvAdminEditForm.iva || 0),
      totale: Number(fatturaProvvAdminEditForm.totale || 0),
      data_fattura: fatturaProvvAdminEditForm.data_fattura || null,
    });
    setFatturaProvvAdminInModifica(null);
  };

  const salvaFatturaProvvAdmin = async (e) => {
    e.preventDefault();

    if (!fatturaProvvAdminForm.amministratore_email || !fatturaProvvAdminForm.azienda_partner_id) {
      alert('Seleziona amministratore e azienda partner.');
      return;
    }

    const adminSelezionato = amministratori.find((u) => String(u.email || '').toLowerCase() === String(fatturaProvvAdminForm.amministratore_email || '').toLowerCase());

    await onCreateFatturaProvvigioneAmministratore({
      ...fatturaProvvAdminForm,
      amministratore_nome: fatturaProvvAdminForm.amministratore_nome || adminSelezionato?.nome || fatturaProvvAdminForm.amministratore_email,
      azienda_partner_id: Number(fatturaProvvAdminForm.azienda_partner_id),
      anno: Number(fatturaProvvAdminForm.anno || new Date().getFullYear()),
      importo_imponibile: Number(fatturaProvvAdminForm.importo_imponibile || 0),
      iva: Number(fatturaProvvAdminForm.iva || 0),
      totale: Number(fatturaProvvAdminForm.totale || 0),
    });

    alert('Fattura provvigione amministratore caricata correttamente.');

    setFatturaProvvAdminForm({
      amministratore_email: '',
      amministratore_nome: '',
      azienda_partner_id: '',
      numero_fattura: '',
      trimestre: '',
      anno: String(new Date().getFullYear()),
      data_fattura: new Date().toISOString().slice(0, 10),
      importo_imponibile: '',
      iva: '0',
      totale: '',
      stato: 'da_pagare',
      note: '',
    });
  };

  const updateAzienda = (field, value) => setAziendaForm((prev) => ({ ...prev, [field]: value }));
  const updateAziendaEdit = (field, value) => setAziendaEditForm((prev) => ({ ...prev, [field]: value }));

  const apriModificaAzienda = (azienda) => {
    setAziendaInModifica(azienda);
    setAziendaEditForm({
      ragione_sociale: azienda.ragione_sociale || '',
      partita_iva: azienda.partita_iva || '',
      email: azienda.email || '',
      telefono: azienda.telefono || '',
      referente: azienda.referente || '',
      tipo_attivita: azienda.tipo_attivita || '',
      citta: azienda.citta || '',
      provincia: azienda.provincia || '',
      durc_url: azienda.durc_url || '',
      durc_scadenza: azienda.durc_scadenza || '',
      polizza_url: azienda.polizza_url || '',
      polizza_scadenza: azienda.polizza_scadenza || '',
      certificazioni_iso: azienda.certificazioni_iso || '',
      certificazioni_soa: azienda.certificazioni_soa || '',
      schema_garanzie: azienda.schema_garanzie || '',
      note_qualificazione: azienda.note_qualificazione || '',
      note: azienda.note || '',
      attiva: azienda.attiva !== false,
      nuova_percentuale_gestore: '',
    });
  };

  const salvaModificaAzienda = async () => {
    if (!aziendaInModifica?.id) return;

    const { nuova_percentuale_gestore, ...payload } = aziendaEditForm;
    await onUpdateAziendaPartner(aziendaInModifica.id, payload);

    if (nuova_percentuale_gestore !== '' && nuova_percentuale_gestore !== null) {
      await onCreateProvvigionePartner(aziendaInModifica.id, Number(nuova_percentuale_gestore || 0));
    }

    setAziendaInModifica(null);
  };

  const provvigioneAttivaAzienda = (aziendaId) => {
    return (provvigioniPartner || [])
      .filter((p) => Number(p.azienda_partner_id) === Number(aziendaId) && p.attiva !== false)
      .sort((a, b) => String(b.valida_dal || '').localeCompare(String(a.valida_dal || '')))[0];
  };

  const aziendeFiltrate = (aziendePartner || []).filter((azienda) => {
    const search = partnerSearch.toLowerCase().trim();
    if (!search) return true;
    return [
      azienda.ragione_sociale,
      azienda.partita_iva,
      azienda.email,
      azienda.telefono,
      azienda.referente,
      azienda.tipo_attivita,
      azienda.citta,
      azienda.provincia,
      azienda.certificazioni_iso,
      azienda.certificazioni_soa,
      azienda.schema_garanzie,
      azienda.note_qualificazione,
    ].some((value) => String(value || '').toLowerCase().includes(search));
  });


  const giorniAllaScadenzaDocumento = (dataScadenza) => {
    if (!dataScadenza) return null;
    const oggi = new Date();
    const scadenza = new Date(dataScadenza);
    if (Number.isNaN(scadenza.getTime())) return null;
    oggi.setHours(0, 0, 0, 0);
    scadenza.setHours(0, 0, 0, 0);
    return Math.ceil((scadenza - oggi) / (1000 * 60 * 60 * 24));
  };

  const statoDocumentoAzienda = (dataScadenza) => {
    const giorni = giorniAllaScadenzaDocumento(dataScadenza);
    if (giorni === null) return { label: 'Non caricato', tone: 'slate', giorni: null };
    if (giorni < 0) return { label: 'Scaduto', tone: 'red', giorni };
    if (giorni <= 15) return { label: `In scadenza ${giorni} gg`, tone: 'amber', giorni };
    return { label: 'Valido', tone: 'emerald', giorni };
  };

  const badgeDocumentoClass = (tone) => (
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    tone === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' :
    tone === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
    'bg-slate-100 text-slate-600 border-slate-200'
  );

  const aziendeConDocumentiCritici = (aziendePartner || []).filter((azienda) => {
    const durc = statoDocumentoAzienda(azienda.durc_scadenza);
    const polizza = statoDocumentoAzienda(azienda.polizza_scadenza);
    return ['red', 'amber'].includes(durc.tone) || ['red', 'amber'].includes(polizza.tone);
  });

  const aziendeQualificate = (aziendePartner || []).filter((azienda) => (
    statoDocumentoAzienda(azienda.durc_scadenza).tone === 'emerald' &&
    statoDocumentoAzienda(azienda.polizza_scadenza).tone === 'emerald'
  ));

  const updateFattura = (field, value) => {
    setFatturaForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'pratica_tipo') {
        next.segnalazione_id = '';
        next.capitolato_id = '';
      }

      if (field === 'capitolato_id') {
        const capitolato = capitolatoById(value);
        next.segnalazione_id = '';
        next.condominio_id = capitolato?.condominio_id ? String(capitolato.condominio_id) : next.condominio_id;
        next.amministratore_email = capitolato?.amministratore_email || next.amministratore_email;
        next.azienda_partner_id = capitolato?.azienda_vincitrice_id ? String(capitolato.azienda_vincitrice_id) : next.azienda_partner_id;
        const valore = Number(capitolato?.valore_aggiudicato || capitolato?.valore_offerta || 0);
        if (valore > 0 && !Number(next.importo_imponibile || 0)) next.importo_imponibile = valore;
        if (!next.descrizione && capitolato) next.descrizione = `Fattura CaSeP - ${capitolato.numero_pratica || `Pratica #${capitolato.id}`} - ${capitolato.titolo || capitolato.condominio_nome || ''}`.trim();
      }

      if (field === 'importo_imponibile' || field === 'iva' || field === 'capitolato_id') {
        const imponibile = Number(next.importo_imponibile || 0);
        const ivaPercentuale = Number(next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }

      return next;
    });
  };

  const updateFatturaEdit = (field, value) => {
    setFatturaEditForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }

      return next;
    });
  };

  const apriModificaFattura = (fattura) => {
    setFatturaInModifica(fattura);
    setFatturaEditForm({
      azienda_partner_id: fattura.azienda_partner_id || '',
      amministratore_email: fattura.amministratore_email || '',
      condominio_id: fattura.condominio_id || '',
      segnalazione_id: fattura.segnalazione_id || '',
      numero_fattura: fattura.numero_fattura || '',
      descrizione: fattura.descrizione || '',
      importo_imponibile: fattura.importo_imponibile || '',
      iva: fattura.iva || '',
      totale: fattura.totale || '',
      file_url: fattura.file_url || '',
      data_emissione: fattura.data_emissione || '',
      data_scadenza: fattura.data_scadenza || '',
      stato: fattura.stato || 'bozza',
      note: fattura.note || '',
    });
  };

  const salvaModificaFattura = async () => {
    if (!fatturaInModifica?.id) return;

    await onUpdateFatturaPartner(fatturaInModifica.id, {
      ...fatturaEditForm,
      azienda_partner_id: Number(fatturaEditForm.azienda_partner_id || 0) || null,
      condominio_id: fatturaEditForm.condominio_id ? Number(fatturaEditForm.condominio_id) : null,
      segnalazione_id: fatturaEditForm.segnalazione_id ? Number(fatturaEditForm.segnalazione_id) : null,
      importo_imponibile: Number(fatturaEditForm.importo_imponibile || 0),
      iva: Number(fatturaEditForm.iva || 0),
      totale: Number(fatturaEditForm.totale || 0),
      data_scadenza: fatturaEditForm.data_scadenza || null,
    });

    setFatturaInModifica(null);
  };

  const caricaPdfFattura = async (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Carica solo file PDF.');
      return;
    }

    try {
      setUploadingFatturaPdf(true);
      const url = await onUploadFatturaPdf(file);

      if (url) {
        updateFattura('file_url', url);
        setFatturaPdfName(file.name);
        alert('Fattura caricata correttamente.');
      }
    } catch (error) {
      console.error(error);
      alert('Errore caricamento PDF fattura: ' + (error.message || 'sconosciuto'));
    } finally {
      setUploadingFatturaPdf(false);
    }
  };

  const amministratoriDaUtenti = (utentiSistema || [])
    .filter((u) => String(u.ruolo || '').toLowerCase() === 'amministratore')
    .map((u) => ({
      email: u.email,
      nome: u.studio || u.ragione_sociale || u.nome_studio || u.nome || '',
    }));

  const amministratoriDaLead = (leadAmministratori || [])
    .filter((lead) => lead.email)
    .map((lead) => ({
      email: lead.email,
      nome: lead.studio || lead.ragione_sociale || lead.nome_studio || lead.nome || lead.amministratore || lead.cliente || '',
    }));

  const amministratoriMap = new Map();

  [...amministratoriDaUtenti, ...amministratoriDaLead].forEach((admin) => {
    const email = String(admin.email || '').toLowerCase().trim();
    if (!email) return;

    const precedente = amministratoriMap.get(email) || {};
    amministratoriMap.set(email, {
      ...precedente,
      ...admin,
      email: admin.email,
      nome: admin.nome || precedente.nome || admin.email,
    });
  });

  const amministratori = [...amministratoriMap.values()]
    .sort((a, b) => String(a.nome || a.email || '').localeCompare(String(b.nome || b.email || '')));
  const praticheChiuse = (segnalazioni || []).filter((s) => String(s.stato || '').toLowerCase().trim() === 'chiusa');
  const praticheCasepFatturabili = (capitolatiSenzaPensieri || []).filter((item) => {
    const stato = String(item.stato || '').toLowerCase();
    const decisione = String(item.decisione_amministratore || '').toLowerCase();
    return (stato.includes('accett') || decisione.includes('accett')) && Number(item.valore_aggiudicato || item.valore_offerta || 0) > 0;
  });
  const capitolatoById = (id) => (capitolatiSenzaPensieri || []).find((item) => Number(item.id) === Number(id));

  const normalizzaEmail = (value) => String(value || '').toLowerCase().trim();
  const getDataPagamentoFattura = (fattura) => (
    fattura?.pagata_il ||
    fattura?.data_pagamento ||
    fattura?.paid_at ||
    null
  );

  const isFatturaPagataFuoriTermine = (fattura) => {
    if (String(fattura?.stato || '').toLowerCase() !== 'pagata') return false;
    if (!fattura?.data_scadenza) return false;

    const dataPagamentoRaw = getDataPagamentoFattura(fattura);
    if (!dataPagamentoRaw) return false;

    const scadenza = new Date(fattura.data_scadenza);
    const pagamento = new Date(dataPagamentoRaw);

    if (Number.isNaN(scadenza.getTime()) || Number.isNaN(pagamento.getTime())) return false;

    scadenza.setHours(0, 0, 0, 0);
    pagamento.setHours(0, 0, 0, 0);

    const limiteMaturazione = new Date(scadenza);
    limiteMaturazione.setDate(limiteMaturazione.getDate() + 15);

    return pagamento > limiteMaturazione;
  };

  const calcolaProvvigioneAmministratoreDaFattura = (fattura) => Number(fattura.importo_imponibile || 0) * 0.10;

  const provvigioniPerAmministratore = amministratori.map((admin) => {
    const email = normalizzaEmail(admin.email);
    const fattureAdminPagate = (fatturePartner || []).filter((fattura) => (
      normalizzaEmail(fattura.amministratore_email) === email &&
      String(fattura.stato || '').toLowerCase() === 'pagata'
    ));
    const fattureValide = fattureAdminPagate.filter((fattura) => !isFatturaPagataFuoriTermine(fattura));
    const fatturePerse = fattureAdminPagate.filter((fattura) => isFatturaPagataFuoriTermine(fattura));
    const fattureProvvigioneAdmin = (fattureProvvigioniAmministratori || []).filter((fattura) => normalizzaEmail(fattura.amministratore_email) === email);

    const maturate = fattureValide.reduce((sum, fattura) => sum + calcolaProvvigioneAmministratoreDaFattura(fattura), 0);
    const perse = fatturePerse.reduce((sum, fattura) => sum + calcolaProvvigioneAmministratoreDaFattura(fattura), 0);
    const fatturate = fattureProvvigioneAdmin
      .filter((fattura) => String(fattura.stato || '') !== 'annullata')
      .reduce((sum, fattura) => sum + Number(fattura.importo_imponibile || 0), 0);
    const pagate = fattureProvvigioneAdmin
      .filter((fattura) => String(fattura.stato || '') === 'pagata')
      .reduce((sum, fattura) => sum + Number(fattura.importo_imponibile || 0), 0);

    return {
      ...admin,
      email,
      nome: admin.nome || admin.email,
      maturate,
      perse,
      fatturate,
      pagate,
      daFatturare: Math.max(maturate - fatturate, 0),
      daPagare: Math.max(fatturate - pagate, 0),
      fattureValide,
      fatturePerse,
      fattureProvvigioneAdmin,
    };
  });

  const riepilogoAdminSelezionato = provvigioniPerAmministratore.find((row) => row.email === normalizzaEmail(adminProvvigioniSelezionato)) || null;

  const fatturatoTotale = (fatturePartner || []).reduce((sum, fattura) => sum + Number(fattura.totale || 0), 0);
  const fatturatoPagato = (fatturePartner || []).filter((f) => f.stato === 'pagata').reduce((sum, fattura) => sum + Number(fattura.totale || 0), 0);
  const fattureScadute = (fatturePartner || []).filter((f) => f.stato === 'scaduta').length;
  const provvigioniGestore = (provvigioniMaturate || []).reduce((sum, p) => sum + Number(p.importo_gestore || 0), 0);
  const provvigioniAmministratori = (provvigioniMaturate || []).reduce((sum, p) => sum + Number(p.importo_amministratore || 0), 0);
  const mieProvvigioniFatturate = (fattureProvvigioniGestore || []).reduce((sum, f) => sum + Number(f.importo_imponibile || 0), 0);
  const mieProvvigioniDaFatturare = Math.max(provvigioniGestore - mieProvvigioniFatturate, 0);

  const provvAdminTotali = provvigioniPerAmministratore.reduce((sum, row) => sum + row.fatturate, 0);
  const provvAdminMaturate = provvigioniPerAmministratore.reduce((sum, row) => sum + row.maturate, 0);
  const provvAdminPerse = provvigioniPerAmministratore.reduce((sum, row) => sum + row.perse, 0);
  const provvAdminPagate = provvigioniPerAmministratore.reduce((sum, row) => sum + row.pagate, 0);
  const provvAdminDaFatturare = provvigioniPerAmministratore.reduce((sum, row) => sum + row.daFatturare, 0);
  const provvAdminDaPagare = provvigioniPerAmministratore.reduce((sum, row) => sum + row.daPagare, 0);

  const oggiFatture = new Date();
  oggiFatture.setHours(0, 0, 0, 0);
  const limiteScadenzaFatture = new Date(oggiFatture);
  limiteScadenzaFatture.setDate(limiteScadenzaFatture.getDate() + 15);

  const fattureAperte = (fatturePartner || []).filter((fattura) => !['pagata', 'annullata'].includes(String(fattura.stato || '').toLowerCase()));

  const fattureInScadenza = fattureAperte
    .filter((fattura) => {
      if (!fattura.data_scadenza) return false;
      const scadenza = new Date(fattura.data_scadenza);
      scadenza.setHours(0, 0, 0, 0);
      return scadenza >= oggiFatture && scadenza <= limiteScadenzaFatture;
    })
    .sort((a, b) => String(a.data_scadenza || '').localeCompare(String(b.data_scadenza || '')));

  const fattureScaduteAperte = fattureAperte
    .filter((fattura) => {
      if (!fattura.data_scadenza) return false;
      const scadenza = new Date(fattura.data_scadenza);
      scadenza.setHours(0, 0, 0, 0);
      return scadenza < oggiFatture;
    })
    .sort((a, b) => String(a.data_scadenza || '').localeCompare(String(b.data_scadenza || '')));

  const creaAzienda = async (e) => {
    e.preventDefault();
    if (!aziendaForm.ragione_sociale.trim()) return;

    await onCreateAziendaPartner({
      ...aziendaForm,
      percentuale_gestore: Number(aziendaForm.percentuale_gestore || 0),
    });

    setAziendaForm({
      ragione_sociale: '',
      partita_iva: '',
      email: '',
      telefono: '',
      referente: '',
      tipo_attivita: 'Impresa edile',
      citta: '',
      provincia: 'Firenze',
      percentuale_gestore: '',
      durc_url: '',
      durc_scadenza: '',
      polizza_url: '',
      polizza_scadenza: '',
      certificazioni_iso: '',
      certificazioni_soa: '',
      schema_garanzie: '',
      note_qualificazione: '',
      note: '',
    });
  };

  const creaFattura = async (e) => {
    e.preventDefault();
    if (!fatturaForm.azienda_partner_id) return;

    const capitolatoSelezionato = fatturaForm.pratica_tipo === 'casep' ? capitolatoById(fatturaForm.capitolato_id) : null;
    const { capitolato_id, pratica_tipo, ...payloadFattura } = fatturaForm;

    await onCreateFatturaPartner({
      ...payloadFattura,
      azienda_partner_id: Number(fatturaForm.azienda_partner_id),
      condominio_id: fatturaForm.condominio_id ? Number(fatturaForm.condominio_id) : null,
      segnalazione_id: pratica_tipo === 'csp' && fatturaForm.segnalazione_id ? Number(fatturaForm.segnalazione_id) : null,
      descrizione: pratica_tipo === 'casep' && capitolatoSelezionato
        ? `${fatturaForm.descrizione || 'Fattura CaSeP'}\nRiferimento CaSeP: ${capitolatoSelezionato.numero_pratica || `#${capitolatoSelezionato.id}`} - ${capitolatoSelezionato.titolo || capitolatoSelezionato.condominio_nome || ''}`
        : fatturaForm.descrizione,
      note: pratica_tipo === 'casep' && capitolatoSelezionato
        ? `${fatturaForm.note || ''}\nCASEP_ID:${capitolatoSelezionato.id}`.trim()
        : fatturaForm.note,
      importo_imponibile: Number(fatturaForm.importo_imponibile || 0),
      iva: Number(fatturaForm.iva || 0),
      totale: Number(fatturaForm.totale || 0),
      data_scadenza: fatturaForm.data_scadenza || null,
    });

    setFatturaPdfName('');
    setFatturaForm({
      azienda_partner_id: '',
      amministratore_email: '',
      condominio_id: '',
      segnalazione_id: '',
      numero_fattura: '',
      descrizione: '',
      importo_imponibile: '',
      iva: '',
      totale: '',
      file_url: '',
      data_emissione: new Date().toISOString().slice(0, 10),
      data_scadenza: '',
      stato: 'bozza',
      note: '',
    });
  };

  const creaMiaFatturaProvvigione = async (e) => {
    e.preventDefault();

    if (!miaFatturaForm.azienda_partner_id || !miaFatturaForm.numero_fattura) {
      alert('Seleziona azienda partner e inserisci numero fattura.');
      return;
    }

    await onCreateFatturaProvvigioneGestore({
      ...miaFatturaForm,
      azienda_partner_id: Number(miaFatturaForm.azienda_partner_id),
      importo_imponibile: Number(miaFatturaForm.importo_imponibile || 0),
      iva: Number(miaFatturaForm.iva || 0),
      totale: Number(miaFatturaForm.totale || 0),
      data_fattura: miaFatturaForm.data_fattura || new Date().toISOString().slice(0, 10),
    });

    setMiaFatturaForm({
      azienda_partner_id: '',
      numero_fattura: '',
      data_fattura: new Date().toISOString().slice(0, 10),
      importo_imponibile: '',
      iva: '22',
      totale: '',
      file_url: '',
      note: '',
    });
  };

  const aziendaById = (id) => (aziendePartner || []).find((a) => Number(a.id) === Number(id));
  const condominioById = (id) => (condomini || []).find((c) => Number(c.id) === Number(id));
  const segnalazioneById = (id) => (segnalazioni || []).find((s) => Number(s.id) === Number(id));

  const fattureFiltrate = (fatturePartner || []).filter((fattura) => {
    const partner = aziendaById(fattura.azienda_partner_id)?.ragione_sociale || '';
    const pratica = segnalazioneById(fattura.segnalazione_id);
    const praticaText = [
      fattura.segnalazione_id,
      pratica?.titolo,
      pratica?.descrizione,
    ].filter(Boolean).join(' ').toLowerCase();

    const matchNumero = !fatturaSearchNumero || String(fattura.numero_fattura || fattura.id || '').toLowerCase().includes(fatturaSearchNumero.toLowerCase().trim());
    const matchPratica = !fatturaSearchPratica || praticaText.includes(fatturaSearchPratica.toLowerCase().trim());
    const matchPartner = !fatturaSearchPartner || partner.toLowerCase().includes(fatturaSearchPartner.toLowerCase().trim());
    const matchStato = !fatturaFiltroStato || String(fattura.stato || '') === fatturaFiltroStato;

    return matchNumero && matchPratica && matchPartner && matchStato;
  });

  const provvigioniPerAzienda = (aziendePartner || []).map((azienda) => {
    const maturate = (provvigioniMaturate || []).filter((p) => Number(p.azienda_partner_id) === Number(azienda.id));
    const totaleGestore = maturate.reduce((sum, p) => sum + Number(p.importo_gestore || 0), 0);
    const totaleAmministratore = maturate.reduce((sum, p) => sum + Number(p.importo_amministratore || 0), 0);

    return {
      azienda,
      totaleGestore,
      totaleAmministratore,
      fatture: (fatturePartner || []).filter((f) => Number(f.azienda_partner_id) === Number(azienda.id)).length,
    };
  });

  return (
    <section className="space-y-4">
      {miaFatturaInModifica && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setMiaFatturaInModifica(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 csp-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Scheda fattura provvigione</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">{miaFatturaInModifica.numero_fattura || `Fattura #${miaFatturaInModifica.id}`}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Modifica i dati della fattura gestore in uno spazio dedicato.</p>
              </div>
              <button type="button" onClick={() => setMiaFatturaInModifica(null)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Chiudi</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={miaFatturaEditForm.azienda_partner_id} onChange={(e) => updateMiaFatturaEdit('azienda_partner_id', e.target.value)} className="rounded-2xl border border-violet-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="">Azienda partner</option>
                {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
              </select>
              <input value={miaFatturaEditForm.numero_fattura} onChange={(e) => updateMiaFatturaEdit('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="date" value={miaFatturaEditForm.data_fattura || ''} onChange={(e) => updateMiaFatturaEdit('data_fattura', e.target.value)} className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <select value={miaFatturaEditForm.stato || 'bozza'} onChange={(e) => updateMiaFatturaEdit('stato', e.target.value)} className="rounded-2xl border border-violet-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="bozza">Bozza</option>
                <option value="inviata">Inviata</option>
                <option value="pagata">Pagata</option>
                <option value="annullata">Annullata</option>
              </select>
              <input type="number" step="0.01" value={miaFatturaEditForm.importo_imponibile} onChange={(e) => updateMiaFatturaEdit('importo_imponibile', e.target.value)} placeholder="Imponibile" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={miaFatturaEditForm.iva} onChange={(e) => updateMiaFatturaEdit('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={miaFatturaEditForm.totale} onChange={(e) => updateMiaFatturaEdit('totale', e.target.value)} placeholder="Totale" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input value={miaFatturaEditForm.file_url} onChange={(e) => updateMiaFatturaEdit('file_url', e.target.value)} placeholder="URL PDF" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
            </div>
            <textarea value={miaFatturaEditForm.note} onChange={(e) => updateMiaFatturaEdit('note', e.target.value)} placeholder="Note" className="mt-3 min-h-24 w-full rounded-2xl border border-violet-200 bg-white px-3 py-3" />
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {miaFatturaEditForm.file_url && <a href={miaFatturaEditForm.file_url} target="_blank" rel="noreferrer" className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-center text-sm font-black text-violet-700">Apri PDF</a>}
              <button type="button" onClick={salvaModificaMiaFattura} className="rounded-2xl bg-violet-700 px-4 py-3 text-sm font-black text-white">Salva modifiche</button>
            </div>
          </div>
        </div>
      )}

      {fatturaProvvAdminInModifica && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onClick={() => setFatturaProvvAdminInModifica(null)}>
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 csp-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Scheda provvigione amministratore</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">{fatturaProvvAdminInModifica.numero_fattura || `Fattura #${fatturaProvvAdminInModifica.id}`}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Apri, controlla e aggiorna lo stato della provvigione in un popup dedicato.</p>
              </div>
              <button type="button" onClick={() => setFatturaProvvAdminInModifica(null)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-700">Chiudi</button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={fatturaProvvAdminEditForm.amministratore_email} onChange={(e) => updateFatturaProvvAdminEdit('amministratore_email', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="">Amministratore</option>
                {amministratori.map((u) => <option key={u.email} value={u.email}>{u.nome || u.email}</option>)}
              </select>
              <select value={fatturaProvvAdminEditForm.azienda_partner_id} onChange={(e) => updateFatturaProvvAdminEdit('azienda_partner_id', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="">Azienda partner</option>
                {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
              </select>
              <input value={fatturaProvvAdminEditForm.numero_fattura} onChange={(e) => updateFatturaProvvAdminEdit('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
              <select value={fatturaProvvAdminEditForm.stato || 'da_pagare'} onChange={(e) => updateFatturaProvvAdminEdit('stato', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="da_pagare">Da pagare</option>
                <option value="pagata">Pagata</option>
                <option value="annullata">Annullata</option>
              </select>
              <select value={fatturaProvvAdminEditForm.trimestre} onChange={(e) => updateFatturaProvvAdminEdit('trimestre', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
                <option value="">Trimestre</option>
                <option value="Q1">Q1</option>
                <option value="Q2">Q2</option>
                <option value="Q3">Q3</option>
                <option value="Q4">Q4</option>
              </select>
              <input type="number" value={fatturaProvvAdminEditForm.anno} onChange={(e) => updateFatturaProvvAdminEdit('anno', e.target.value)} placeholder="Anno" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
              <input type="date" value={fatturaProvvAdminEditForm.data_fattura || ''} onChange={(e) => updateFatturaProvvAdminEdit('data_fattura', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={fatturaProvvAdminEditForm.importo_imponibile} onChange={(e) => updateFatturaProvvAdminEdit('importo_imponibile', e.target.value)} placeholder="Imponibile" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={fatturaProvvAdminEditForm.iva} onChange={(e) => updateFatturaProvvAdminEdit('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={fatturaProvvAdminEditForm.totale} onChange={(e) => updateFatturaProvvAdminEdit('totale', e.target.value)} placeholder="Totale" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
            </div>
            <textarea value={fatturaProvvAdminEditForm.note} onChange={(e) => updateFatturaProvvAdminEdit('note', e.target.value)} placeholder="Note contabili" className="mt-3 min-h-24 w-full rounded-2xl border border-indigo-200 bg-white px-3 py-3" />
            <button type="button" onClick={salvaModificaFatturaProvvAdmin} className="mt-4 w-full rounded-2xl bg-indigo-700 px-4 py-3 text-sm font-black text-white">Salva modifiche</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Fatturato totale" value={formatEuro(fatturatoTotale)} tone="slate" />
        <DashboardStat label="Fatturato pagato" value={formatEuro(fatturatoPagato)} tone="emerald" />
        <DashboardStat label="Fatture scadute" value={fattureScadute} tone="red" />
        <DashboardStat label="Provv. gestore" value={formatEuro(provvigioniGestore)} tone="sky" />
        <DashboardStat label="Provv. amministratori" value={formatEuro(provvigioniAmministratori)} tone="amber" />
      </div>

      <section className="h-[880px] overflow-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm csp-scroll">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Fatture</p>
          <h2 className="mt-1 text-xl font-bold">Nuova fattura partner</h2>
          <p className="mt-1 text-sm text-slate-500">Collega fattura ad azienda partner, amministratore, condominio ed eventuale pratica.</p>

          <form onSubmit={creaFattura} className="mt-4 space-y-3">
            <select value={fatturaForm.azienda_partner_id} onChange={(e) => updateFattura('azienda_partner_id', e.target.value)} className="w-full rounded-2xl border border-slate-200 px-3 py-3">
              <option value="">Seleziona azienda partner</option>
              {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
            </select>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <select value={fatturaForm.amministratore_email} onChange={(e) => updateFattura('amministratore_email', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="">Amministratore</option>
                {amministratori.map((u) => <option key={u.email} value={u.email}>{u.nome ? `${u.nome} — ${u.email}` : u.email}</option>)}
              </select>
              <select value={fatturaForm.condominio_id} onChange={(e) => updateFattura('condominio_id', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="">Condominio</option>
                {(condomini || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select value={fatturaForm.pratica_tipo} onChange={(e) => updateFattura('pratica_tipo', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="csp">Pratica CSP</option>
                <option value="casep">Pratica CaSeP</option>
              </select>
              {fatturaForm.pratica_tipo === 'casep' ? (
                <select value={fatturaForm.capitolato_id} onChange={(e) => updateFattura('capitolato_id', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                  <option value="">Pratica CaSeP collegata</option>
                  {praticheCasepFatturabili.slice(0, 120).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.numero_pratica || `CaSeP #${c.id}`} — {c.titolo || c.condominio_nome} — {formatEuro(c.valore_aggiudicato || c.valore_offerta || 0)}
                    </option>
                  ))}
                </select>
              ) : (
                <select value={fatturaForm.segnalazione_id} onChange={(e) => updateFattura('segnalazione_id', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                  <option value="">Pratica CSP collegata</option>
                  {praticheChiuse.slice(0, 120).map((s) => <option key={s.id} value={s.id}>{s.titolo}</option>)}
                </select>
              )}
              <input value={fatturaForm.numero_fattura} onChange={(e) => updateFattura('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input type="number" step="0.01" value={fatturaForm.importo_imponibile} onChange={(e) => updateFattura('importo_imponibile', e.target.value)} placeholder="Imponibile" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input type="number" step="0.01" value={fatturaForm.iva} onChange={(e) => updateFattura('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input type="number" step="0.01" value={fatturaForm.totale} onChange={(e) => updateFattura('totale', e.target.value)} placeholder="Totale" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <select value={fatturaForm.stato} onChange={(e) => updateFattura('stato', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="bozza">Bozza</option>
                <option value="inviata">Inviata</option>
                <option value="pagata">Pagata</option>
                <option value="scaduta">Scaduta</option>
                <option value="annullata">Annullata</option>
              </select>
              <input type="date" value={fatturaForm.data_emissione} onChange={(e) => updateFattura('data_emissione', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input type="date" value={fatturaForm.data_scadenza} onChange={(e) => updateFattura('data_scadenza', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">PDF fattura</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {fatturaPdfName || (fatturaForm.file_url ? 'PDF fattura caricato' : 'Nessun PDF caricato')}
                  </p>
                  {fatturaForm.file_url && (
                    <a href={fatturaForm.file_url} target="_blank" rel="noreferrer" className="text-xs font-black text-sky-700">
                      Apri PDF caricato
                    </a>
                  )}
                </div>
                <label className={`cursor-pointer rounded-2xl px-4 py-3 text-sm font-black text-white ${uploadingFatturaPdf ? 'bg-slate-400' : 'bg-sky-700'}`}>
                  {uploadingFatturaPdf ? 'Caricamento...' : 'Carica PDF'}
                  <input type="file" accept="application/pdf,.pdf" onChange={(e) => caricaPdfFattura(e.target.files?.[0])} className="hidden" disabled={uploadingFatturaPdf} />
                </label>
              </div>
              <input value={fatturaForm.file_url} onChange={(e) => updateFattura('file_url', e.target.value)} placeholder="URL PDF generato automaticamente" className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500" />
            </div>
            <textarea value={fatturaForm.descrizione} onChange={(e) => updateFattura('descrizione', e.target.value)} placeholder="Descrizione" className="min-h-20 w-full rounded-2xl border border-slate-200 px-3 py-3" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button type="submit" className="w-full rounded-2xl bg-sky-700 px-4 py-3 font-black text-white">Salva fattura</button>
              <button
                type="button"
                onClick={async () => {
                  if (!fatturaForm.azienda_partner_id || !fatturaForm.amministratore_email) {
                    alert('Seleziona azienda partner e amministratore prima di inviare la fattura.');
                    return;
                  }

                  const capitolatoSelezionato = fatturaForm.pratica_tipo === 'casep' ? capitolatoById(fatturaForm.capitolato_id) : null;
                  const { capitolato_id, pratica_tipo, ...payloadFattura } = fatturaForm;
                  const saved = await onCreateFatturaPartner({
                    ...payloadFattura,
                    azienda_partner_id: Number(fatturaForm.azienda_partner_id),
                    condominio_id: fatturaForm.condominio_id ? Number(fatturaForm.condominio_id) : null,
                    segnalazione_id: pratica_tipo === 'csp' && fatturaForm.segnalazione_id ? Number(fatturaForm.segnalazione_id) : null,
                    descrizione: pratica_tipo === 'casep' && capitolatoSelezionato
                      ? `${fatturaForm.descrizione || 'Fattura CaSeP'}\nRiferimento CaSeP: ${capitolatoSelezionato.numero_pratica || `#${capitolatoSelezionato.id}`} - ${capitolatoSelezionato.titolo || capitolatoSelezionato.condominio_nome || ''}`
                      : fatturaForm.descrizione,
                    note: pratica_tipo === 'casep' && capitolatoSelezionato
                      ? `${fatturaForm.note || ''}\nCASEP_ID:${capitolatoSelezionato.id}`.trim()
                      : fatturaForm.note,
                    importo_imponibile: Number(fatturaForm.importo_imponibile || 0),
                    iva: Number(fatturaForm.iva || 0),
                    totale: Number(fatturaForm.totale || 0),
                    data_scadenza: fatturaForm.data_scadenza || null,
                    stato: 'inviata',
                  });

                  if (saved?.id) {
                    await onInviaFatturaPartner(saved.id);
                    setFatturaPdfName('');
                    setFatturaForm({
                      azienda_partner_id: '',
                      amministratore_email: '',
                      condominio_id: '',
                      segnalazione_id: '',
                      numero_fattura: '',
                      descrizione: '',
                      importo_imponibile: '',
                      iva: '',
                      totale: '',
                      file_url: '',
                      data_emissione: new Date().toISOString().slice(0, 10),
                      data_scadenza: '',
                      stato: 'bozza',
                      note: '',
                    });
                  }
                }}
                className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white"
              >
                Invia fattura
              </button>
            </div>
          </form>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="h-[430px] overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Controllo scadenze</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Fatture in scadenza</h2>
              <p className="mt-1 text-sm text-slate-600">Prossimi 15 giorni, escluse pagate e annullate.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-amber-700 shadow-sm">{fattureInScadenza.length}</span>
          </div>

          <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-1 csp-scroll">
            {fattureInScadenza.length === 0 ? (
              <div className="rounded-2xl border border-amber-100 bg-white p-4 text-sm font-semibold text-slate-500">Nessuna fattura in scadenza nei prossimi 15 giorni.</div>
            ) : (
              fattureInScadenza.map((fattura) => (
                <button type="button" key={fattura.id} onClick={() => apriModificaFattura(fattura)} className="w-full rounded-2xl border border-amber-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                      <p className="text-xs font-semibold text-slate-500">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Partner n.d.'}</p>
                      <p className="text-xs text-slate-500">{condominioById(fattura.condominio_id)?.nome || fattura.amministratore_email || 'n.d.'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-700">{formatEuro(fattura.totale || 0)}</p>
                      <p className="text-xs font-bold text-slate-500">Scad. {fattura.data_scadenza}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="h-[430px] overflow-hidden rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Controllo insoluti</p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">Fatture scadute</h2>
              <p className="mt-1 text-sm text-slate-600">Scadenza superata, escluse pagate e annullate.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-red-700 shadow-sm">{fattureScaduteAperte.length}</span>
          </div>

          <div className="mt-4 max-h-[300px] space-y-2 overflow-auto pr-1 csp-scroll">
            {fattureScaduteAperte.length === 0 ? (
              <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm font-semibold text-slate-500">Nessuna fattura scaduta aperta.</div>
            ) : (
              fattureScaduteAperte.map((fattura) => (
                <button type="button" key={fattura.id} onClick={() => apriModificaFattura(fattura)} className="w-full rounded-2xl border border-red-100 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                      <p className="text-xs font-semibold text-slate-500">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Partner n.d.'}</p>
                      <p className="text-xs text-slate-500">{condominioById(fattura.condominio_id)?.nome || fattura.amministratore_email || 'n.d.'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-700">{formatEuro(fattura.totale || 0)}</p>
                      <p className="text-xs font-bold text-red-600">Scad. {fattura.data_scadenza}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="h-[820px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Elenco fatture</p>
            <h2 className="mt-1 text-xl font-bold">Fatture partner e pagamenti</h2>
          </div>
          <p className="text-xs font-bold text-slate-500">Segna “Pagata” per maturare automaticamente le provvigioni.</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={fatturaSearchNumero} onChange={(e) => setFatturaSearchNumero(e.target.value)} placeholder="Cerca numero fattura" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <input value={fatturaSearchPratica} onChange={(e) => setFatturaSearchPratica(e.target.value)} placeholder="Cerca pratica" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <input value={fatturaSearchPartner} onChange={(e) => setFatturaSearchPartner(e.target.value)} placeholder="Cerca partner" className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold" />
          <select value={fatturaFiltroStato} onChange={(e) => setFatturaFiltroStato(e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold">
            <option value="">Tutte le condizioni</option>
            <option value="bozza">Bozza</option>
            <option value="inviata">Inviata</option>
            <option value="pagata">Pagata</option>
            <option value="scaduta">Scaduta</option>
            <option value="annullata">Annullata</option>
          </select>
        </div>

        {fatturaInModifica && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
            <button type="button" aria-label="Chiudi scheda fattura" onClick={() => setFatturaInModifica(null)} className="absolute inset-0" />
            <div className="relative max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[2rem] border border-sky-200 bg-sky-50 p-4 shadow-2xl shadow-slate-950/30 csp-scroll">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Dettagli fattura</p>
                <h3 className="mt-1 text-lg font-black text-slate-900">{fatturaInModifica.numero_fattura || `Fattura #${fatturaInModifica.id}`}</h3>
              </div>
              <button type="button" onClick={() => setFatturaInModifica(null)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700">Chiudi</button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <select value={fatturaEditForm.azienda_partner_id} onChange={(e) => updateFatturaEdit('azienda_partner_id', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                <option value="">Partner</option>
                {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
              </select>
              <select value={fatturaEditForm.amministratore_email} onChange={(e) => updateFatturaEdit('amministratore_email', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                <option value="">Amministratore</option>
                {amministratori.map((u) => <option key={u.email} value={u.email}>{u.nome || u.email}</option>)}
              </select>
              <select value={fatturaEditForm.condominio_id} onChange={(e) => updateFatturaEdit('condominio_id', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                <option value="">Condominio</option>
                {(condomini || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select value={fatturaEditForm.segnalazione_id} onChange={(e) => updateFatturaEdit('segnalazione_id', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                <option value="">Pratica collegata</option>
                {praticheChiuse.slice(0, 120).map((s) => <option key={s.id} value={s.id}>#{s.id} - {s.titolo}</option>)}
              </select>
              <input value={fatturaEditForm.numero_fattura} onChange={(e) => updateFatturaEdit('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
              <select value={fatturaEditForm.stato} onChange={(e) => updateFatturaEdit('stato', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3">
                <option value="bozza">Bozza</option>
                <option value="inviata">Inviata</option>
                <option value="pagata">Pagata</option>
                <option value="scaduta">Scaduta</option>
                <option value="annullata">Annullata</option>
              </select>
              <input type="number" step="0.01" value={fatturaEditForm.importo_imponibile} onChange={(e) => updateFatturaEdit('importo_imponibile', e.target.value)} placeholder="Imponibile" className="rounded-2xl border border-sky-200 bg-white px-3 py-3 md:col-span-2" />
              <input type="number" step="0.01" value={fatturaEditForm.iva} onChange={(e) => updateFatturaEdit('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={fatturaEditForm.totale} onChange={(e) => updateFatturaEdit('totale', e.target.value)} placeholder="Valore fattura totale" className="rounded-2xl border border-sky-200 bg-white px-3 py-3 md:col-span-2" />
              <input type="date" value={fatturaEditForm.data_emissione || ''} onChange={(e) => updateFatturaEdit('data_emissione', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
              <input type="date" value={fatturaEditForm.data_scadenza || ''} onChange={(e) => updateFatturaEdit('data_scadenza', e.target.value)} className="rounded-2xl border border-sky-200 bg-white px-3 py-3" />
              <input value={fatturaEditForm.file_url} onChange={(e) => updateFatturaEdit('file_url', e.target.value)} placeholder="URL PDF" className="rounded-2xl border border-sky-200 bg-white px-3 py-3 md:col-span-3" />
            </div>
            <textarea value={fatturaEditForm.descrizione} onChange={(e) => updateFatturaEdit('descrizione', e.target.value)} placeholder="Descrizione" className="mt-3 min-h-20 w-full rounded-2xl border border-sky-200 bg-white px-3 py-3" />
            <button type="button" onClick={salvaModificaFattura} className="mt-3 w-full rounded-2xl bg-sky-700 px-4 py-3 font-black text-white">Salva dettagli fattura</button>
            </div>
          </div>
        )}

        <div className="mt-4 max-h-[540px] space-y-3 overflow-auto pr-1 csp-scroll">
          {fattureFiltrate.length === 0 ? (
            <EmptyState icon="🧾" title="Nessuna fattura trovata" text="Modifica filtri o ricerca per visualizzare altre fatture." action="Archivio ordinato" tone="slate" />
          ) : (
            fattureFiltrate.map((fattura) => {
              const stato = String(fattura.stato || 'bozza').toLowerCase();
              const statoClass = stato === 'pagata'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : stato === 'scaduta'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : stato === 'inviata'
                    ? 'bg-sky-100 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200';
              return (
                <button
                  key={fattura.id}
                  type="button"
                  onClick={() => apriModificaFattura(fattura)}
                  className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statoClass}`}>{fattura.stato || 'bozza'}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Partner n.d.'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {[condominioById(fattura.condominio_id)?.nome, fattura.amministratore_email].filter(Boolean).join(' • ') || 'Destinatario non indicato'}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Emessa: {fattura.data_emissione || 'n.d.'} • Scadenza: {fattura.data_scadenza || 'n.d.'} {fattura.segnalazione_id ? `• Pratica #${fattura.segnalazione_id}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-2xl font-black text-slate-900">{formatEuro(fattura.totale || 0)}</p>
                      {fattura.file_url && <span className="mt-1 inline-flex rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-sky-700">PDF disponibile</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="h-[720px] overflow-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm csp-scroll">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-700">Le mie fatture</p>
            <h2 className="mt-1 text-xl font-bold">Fatture provvigioni gestore</h2>
            <p className="mt-1 text-sm text-slate-500">Registra le fatture che emetti alle aziende partner per le tue provvigioni. Nessun invio automatico.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 md:min-w-[520px]">
            <DashboardStat label="Provvigioni totali" value={formatEuro(provvigioniGestore)} tone="sky" />
            <DashboardStat label="Fatturate" value={formatEuro(mieProvvigioniFatturate)} tone="emerald" />
            <DashboardStat label="Da fatturare" value={formatEuro(mieProvvigioniDaFatturare)} tone="amber" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <form onSubmit={creaMiaFatturaProvvigione} className="space-y-3 rounded-3xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-sm font-black text-violet-800">Nuova fattura provvigione</p>
            <select value={miaFatturaForm.azienda_partner_id} onChange={(e) => updateMiaFattura('azienda_partner_id', e.target.value)} className="w-full rounded-2xl border border-violet-200 bg-white px-3 py-3">
              <option value="">Azienda partner da fatturare</option>
              {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
            </select>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={miaFatturaForm.numero_fattura} onChange={(e) => updateMiaFattura('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="date" value={miaFatturaForm.data_fattura} onChange={(e) => updateMiaFattura('data_fattura', e.target.value)} className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={miaFatturaForm.importo_imponibile} onChange={(e) => updateMiaFattura('importo_imponibile', e.target.value)} placeholder="Imponibile provvigione" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={miaFatturaForm.iva} onChange={(e) => updateMiaFattura('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input type="number" step="0.01" value={miaFatturaForm.totale} onChange={(e) => updateMiaFattura('totale', e.target.value)} placeholder="Totale" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
              <input value={miaFatturaForm.file_url} onChange={(e) => updateMiaFattura('file_url', e.target.value)} placeholder="Link PDF opzionale" className="rounded-2xl border border-violet-200 bg-white px-3 py-3" />
            </div>
            <textarea value={miaFatturaForm.note} onChange={(e) => updateMiaFattura('note', e.target.value)} placeholder="Note fattura provvigione" className="min-h-20 w-full rounded-2xl border border-violet-200 bg-white px-3 py-3" />
            <button type="submit" className="w-full rounded-2xl bg-violet-700 px-4 py-3 font-black text-white">Salva fattura provvigione</button>
          </form>

          <div className="max-h-[430px] space-y-3 overflow-auto pr-1 csp-scroll">
            {(fattureProvvigioniGestore || []).length === 0 ? (
              <EmptyState icon="€" title="Nessuna fattura provvigione" text="Le fatture provvigione che emetti ai partner saranno raccolte qui." action="Archivio pronto" tone="slate" />
            ) : (
              fattureProvvigioniGestore.map((fattura) => (
                <button key={fattura.id} type="button" onClick={() => apriModificaMiaFattura(fattura)} className="w-full rounded-[1.75rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Azienda n.d.'}</p>
                      <p className="mt-1 text-xs text-slate-400">{fattura.data_fattura || 'Data n.d.'}</p>
                      {fattura.file_url && <span className="mt-2 inline-flex rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-violet-700">PDF disponibile</span>}
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xl font-black text-slate-900">{formatEuro(fattura.importo_imponibile || 0)}</p>
                      <p className="text-xs font-bold text-violet-700">Totale {formatEuro(fattura.totale || 0)}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Apri scheda</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="h-[880px] overflow-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm csp-scroll">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Provvigioni amministratori</p>
            <h2 className="mt-1 text-xl font-bold">Controllo trimestrale</h2>
            <p className="mt-1 text-sm text-slate-500">Gestione contabile interna dei riepiloghi fattura delle provvigioni amministratori.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:min-w-[720px] md:grid-cols-6">
            <DashboardStat label="Maturate" value={formatEuro(provvAdminMaturate)} tone="sky" />
            <DashboardStat label="Perse" value={formatEuro(provvAdminPerse)} tone="red" />
            <DashboardStat label="Fatturate" value={formatEuro(provvAdminTotali)} tone="emerald" />
            <DashboardStat label="Da fatturare" value={formatEuro(provvAdminDaFatturare)} tone="amber" />
            <DashboardStat label="Pagate" value={formatEuro(provvAdminPagate)} tone="emerald" />
            <DashboardStat label="Da pagare" value={formatEuro(provvAdminDaPagare)} tone="red" />
          </div>
        </div>

        <form onSubmit={salvaFatturaProvvAdmin} className="mt-4 rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
          <p className="text-sm font-black text-indigo-800">Nuovo riepilogo fattura</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select value={fatturaProvvAdminForm.amministratore_email} onChange={(e) => updateFatturaProvvAdmin('amministratore_email', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
              <option value="">Amministratore</option>
              {amministratori.map((u) => <option key={u.email} value={u.email}>{u.nome || u.email}</option>)}
            </select>

            <select value={fatturaProvvAdminForm.azienda_partner_id} onChange={(e) => updateFatturaProvvAdmin('azienda_partner_id', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
              <option value="">Azienda partner</option>
              {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
            </select>

            <input value={fatturaProvvAdminForm.numero_fattura} onChange={(e) => updateFatturaProvvAdmin('numero_fattura', e.target.value)} placeholder="Numero fattura" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <select value={fatturaProvvAdminForm.trimestre} onChange={(e) => updateFatturaProvvAdmin('trimestre', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-900">
              <option value="">Trimestre</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
            </select>

            <input type="number" value={fatturaProvvAdminForm.anno} onChange={(e) => updateFatturaProvvAdmin('anno', e.target.value)} placeholder="Anno" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <input type="date" value={fatturaProvvAdminForm.data_fattura} onChange={(e) => updateFatturaProvvAdmin('data_fattura', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <input type="number" step="0.01" value={fatturaProvvAdminForm.importo_imponibile} onChange={(e) => updateFatturaProvvAdmin('importo_imponibile', e.target.value)} placeholder="Imponibile" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <input type="number" step="0.01" value={fatturaProvvAdminForm.iva} onChange={(e) => updateFatturaProvvAdmin('iva', e.target.value)} placeholder="IVA %" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <input type="number" step="0.01" value={fatturaProvvAdminForm.totale} onChange={(e) => updateFatturaProvvAdmin('totale', e.target.value)} placeholder="Totale" className="rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

            <select value={fatturaProvvAdminForm.stato} onChange={(e) => updateFatturaProvvAdmin('stato', e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3">
              <option value="da_pagare">Da pagare</option>
              <option value="pagata">Pagata</option>
              <option value="annullata">Annullata</option>
            </select>
          </div>

          <textarea value={fatturaProvvAdminForm.note} onChange={(e) => updateFatturaProvvAdmin('note', e.target.value)} placeholder="Note contabili" className="mt-3 min-h-20 w-full rounded-2xl border border-indigo-200 bg-white px-3 py-3" />

          <button type="submit" className="mt-3 w-full rounded-2xl bg-indigo-700 px-4 py-3 font-black text-white">
            Salva riepilogo fattura
          </button>
        </form>

        <section className="mt-4 rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Dashboard riservata</p>
              <h3 className="mt-1 text-lg font-black text-slate-900">Provvigioni per amministratore</h3>
              <p className="mt-1 text-sm text-slate-500">
                Seleziona un amministratore per visualizzare solo i suoi numeri: utile quando la schermata è aperta durante un incontro.
              </p>
            </div>
            <select value={adminProvvigioniSelezionato} onChange={(e) => setAdminProvvigioniSelezionato(e.target.value)} className="rounded-2xl border border-indigo-200 bg-white px-3 py-3 font-bold text-slate-700 md:min-w-[320px]">
              <option value="">Seleziona amministratore</option>
              {provvigioniPerAmministratore.map((admin) => (
                <option key={admin.email} value={admin.email}>{admin.nome || admin.email}</option>
              ))}
            </select>
          </div>

          {riepilogoAdminSelezionato ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                <DashboardStat label="Maturate" value={formatEuro(riepilogoAdminSelezionato.maturate)} tone="sky" />
                <DashboardStat label="Perse" value={formatEuro(riepilogoAdminSelezionato.perse)} tone="red" />
                <DashboardStat label="Fatturate" value={formatEuro(riepilogoAdminSelezionato.fatturate)} tone="emerald" />
                <DashboardStat label="Da fatturare" value={formatEuro(riepilogoAdminSelezionato.daFatturare)} tone="amber" />
                <DashboardStat label="Pagate" value={formatEuro(riepilogoAdminSelezionato.pagate)} tone="emerald" />
                <DashboardStat label="Da pagare" value={formatEuro(riepilogoAdminSelezionato.daPagare)} tone="red" />
              </div>

              <div className="max-h-[360px] space-y-3 overflow-auto pr-1 csp-scroll">
                {riepilogoAdminSelezionato.fattureProvvigioneAdmin.length === 0 ? (
                  <EmptyState icon="🧾" title="Nessuna fattura provvigione" text="Quando saranno registrate fatture per questo amministratore, le vedrai qui in forma ordinata." action="Dashboard riservata" tone="slate" />
                ) : (
                  riepilogoAdminSelezionato.fattureProvvigioneAdmin.map((fattura) => (
                    <button key={fattura.id} type="button" onClick={() => apriModificaFatturaProvvAdmin(fattura)} className="w-full rounded-[1.75rem] border border-indigo-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-base font-black text-slate-900">{fattura.numero_fattura || `#${fattura.id}`}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'Fornitore n.d.'}</p>
                          <p className="mt-1 text-xs text-slate-400">{[fattura.trimestre, fattura.anno].filter(Boolean).join(' ') || 'Periodo n.d.'} • {fattura.data_fattura || 'Data n.d.'}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-xl font-black text-slate-900">{formatEuro(fattura.importo_imponibile || 0)}</p>
                          <span className={`mt-2 inline-flex rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-wide ${
                            fattura.stato === 'pagata'
                              ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                              : fattura.stato === 'annullata'
                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                : 'border-amber-200 bg-amber-100 text-amber-700'
                          }`}>{fattura.stato || 'da_pagare'}</span>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-400">Apri scheda</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/60 p-6 text-center">
              <p className="text-sm font-black text-indigo-800">Seleziona un amministratore per aprire la dashboard riservata.</p>
              <p className="mt-1 text-xs font-semibold text-indigo-600">I numeri degli altri amministratori restano nascosti.</p>
            </div>
          )}
        </section>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Provvigioni maturate</p>
          <h2 className="mt-1 text-xl font-bold">Riparto provvigionale</h2>
          <div className="mt-4 max-h-[380px] overflow-auto csp-scroll">
            {(provvigioniMaturate || []).length === 0 ? (
              <EmptyState icon="€" title="Nessuna provvigione maturata" text="Le provvigioni compariranno quando una fattura sarà registrata come pagata." action="In attesa pagamenti" tone="slate" />
            ) : (
              <div className="space-y-2">
                {provvigioniMaturate.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-slate-900">{aziendaById(p.azienda_partner_id)?.ragione_sociale || 'Partner'}</p>
                        <p className="text-xs text-slate-500">{p.amministratore_email || 'Amministratore n.d.'} • {p.data_maturazione}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase text-amber-700">{p.stato_liquidazione}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <DashboardStat label="Fattura" value={formatEuro(p.totale_fattura || 0)} tone="slate" />
                      <DashboardStat label="Gestore" value={formatEuro(p.importo_gestore || 0)} tone="sky" />
                      <DashboardStat label="Amm. 10%" value={formatEuro(p.importo_amministratore || 0)} tone="amber" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700">Divisione per partner</p>
          <h2 className="mt-1 text-xl font-bold">Provvigioni per azienda</h2>
          <div className="mt-4 space-y-2">
            {provvigioniPerAzienda.length === 0 ? (
              <EmptyState icon="🏢" title="Nessuna azienda partner" text="Inserisci la prima azienda partner per attivare il monitoraggio economico." action="Partner da creare" tone="slate" />
            ) : (
              provvigioniPerAzienda.map((row) => (
                <div key={row.azienda.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="font-black text-slate-900">{row.azienda.ragione_sociale}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <DashboardStat label="Fatture" value={row.fatture} tone="slate" />
                    <DashboardStat label="Gestore" value={formatEuro(row.totaleGestore)} tone="sky" />
                    <DashboardStat label="Amm." value={formatEuro(row.totaleAmministratore)} tone="amber" />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Qualificazione aziende</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Controllo documentale partner</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">DURC, polizza, ISO/SOA e garanzie: la base per mostrare in assemblea l’azienda giusta per l’intervento giusto.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <DashboardStat label="Qualificate" value={aziendeQualificate.length} tone="emerald" />
            <DashboardStat label="Alert" value={aziendeConDocumentiCritici.length} tone="amber" />
            <DashboardStat label="Partner" value={(aziendePartner || []).length} tone="slate" />
          </div>
        </div>
        {aziendeConDocumentiCritici.length > 0 && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-amber-700">Reminder documentali</p>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {aziendeConDocumentiCritici.slice(0, 8).map((azienda) => {
                const durc = statoDocumentoAzienda(azienda.durc_scadenza);
                const polizza = statoDocumentoAzienda(azienda.polizza_scadenza);
                return (
                  <div key={azienda.id} className="rounded-2xl border border-amber-100 bg-white p-3">
                    <p className="font-black text-slate-900">{azienda.ragione_sociale}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badgeDocumentoClass(durc.tone)}`}>DURC: {durc.label}</span>
                      <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badgeDocumentoClass(polizza.tone)}`}>Polizza: {polizza.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="h-[760px] overflow-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-sm csp-scroll">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Aziende partner</p>
          <h2 className="mt-1 text-xl font-bold">Nuova azienda partner</h2>
          <p className="mt-1 text-sm text-slate-500">Inserisci l’azienda fatturante e la provvigione gestore valida da oggi.</p>

          <form onSubmit={creaAzienda} className="mt-4 space-y-3">
            <input value={aziendaForm.ragione_sociale} onChange={(e) => updateAzienda('ragione_sociale', e.target.value)} placeholder="Ragione sociale" className="w-full rounded-2xl border border-slate-200 px-3 py-3" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={aziendaForm.partita_iva} onChange={(e) => updateAzienda('partita_iva', e.target.value)} placeholder="Partita IVA" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.tipo_attivita} onChange={(e) => updateAzienda('tipo_attivita', e.target.value)} placeholder="Tipo attività" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.referente} onChange={(e) => updateAzienda('referente', e.target.value)} placeholder="Referente" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.telefono} onChange={(e) => updateAzienda('telefono', e.target.value)} placeholder="Telefono" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.email} onChange={(e) => updateAzienda('email', e.target.value)} placeholder="Email" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input type="number" step="0.01" value={aziendaForm.percentuale_gestore} onChange={(e) => updateAzienda('percentuale_gestore', e.target.value)} placeholder="% provvigione gestore" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.citta} onChange={(e) => updateAzienda('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-slate-200 px-3 py-3" />
              <input value={aziendaForm.provincia} onChange={(e) => updateAzienda('provincia', e.target.value)} placeholder="Provincia" className="rounded-2xl border border-slate-200 px-3 py-3" />
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Qualificazione azienda</p>
              <p className="mt-1 text-sm font-semibold text-emerald-800">Documenti e garanzie da mostrare in modalità assemblea premium.</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={aziendaForm.durc_url} onChange={(e) => updateAzienda('durc_url', e.target.value)} placeholder="URL DURC aggiornato" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input type="date" value={aziendaForm.durc_scadenza} onChange={(e) => updateAzienda('durc_scadenza', e.target.value)} className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" title="Scadenza DURC" />
                <input value={aziendaForm.polizza_url} onChange={(e) => updateAzienda('polizza_url', e.target.value)} placeholder="URL polizza assicurativa" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input type="date" value={aziendaForm.polizza_scadenza} onChange={(e) => updateAzienda('polizza_scadenza', e.target.value)} className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" title="Scadenza polizza" />
                <input value={aziendaForm.certificazioni_iso} onChange={(e) => updateAzienda('certificazioni_iso', e.target.value)} placeholder="Certificazioni ISO" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaForm.certificazioni_soa} onChange={(e) => updateAzienda('certificazioni_soa', e.target.value)} placeholder="Certificazioni SOA" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
              </div>
              <textarea value={aziendaForm.schema_garanzie} onChange={(e) => updateAzienda('schema_garanzie', e.target.value)} placeholder="Schema garanzie lavori" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
              <textarea value={aziendaForm.note_qualificazione} onChange={(e) => updateAzienda('note_qualificazione', e.target.value)} placeholder="Note qualificazione / punti di forza da presentare in assemblea" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
            </div>

            <textarea value={aziendaForm.note} onChange={(e) => updateAzienda('note', e.target.value)} placeholder="Note" className="min-h-20 w-full rounded-2xl border border-slate-200 px-3 py-3" />
            <button type="submit" className="w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white">Salva azienda partner</button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Gestione fornitori</p>
              <h2 className="mt-1 text-xl font-bold">Elenco aziende partner</h2>
              <p className="mt-1 text-sm text-slate-500">Cerca, modifica dati, attiva/disattiva e aggiorna percentuale provvigione.</p>
            </div>
            <input
              value={partnerSearch}
              onChange={(e) => setPartnerSearch(e.target.value)}
              placeholder="Cerca fornitore..."
              className="rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold md:w-72"
            />
          </div>

          {aziendaInModifica && (
            <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Modifica fornitore</p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">{aziendaInModifica.ragione_sociale}</h3>
                </div>
                <button type="button" onClick={() => setAziendaInModifica(null)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-700">
                  Chiudi
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <input value={aziendaEditForm.ragione_sociale} onChange={(e) => updateAziendaEdit('ragione_sociale', e.target.value)} placeholder="Ragione sociale" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.partita_iva} onChange={(e) => updateAziendaEdit('partita_iva', e.target.value)} placeholder="Partita IVA" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.tipo_attivita} onChange={(e) => updateAziendaEdit('tipo_attivita', e.target.value)} placeholder="Tipo attività" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.referente} onChange={(e) => updateAziendaEdit('referente', e.target.value)} placeholder="Referente" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.telefono} onChange={(e) => updateAziendaEdit('telefono', e.target.value)} placeholder="Telefono" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.email} onChange={(e) => updateAziendaEdit('email', e.target.value)} placeholder="Email" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.citta} onChange={(e) => updateAziendaEdit('citta', e.target.value)} placeholder="Città" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input value={aziendaEditForm.provincia} onChange={(e) => updateAziendaEdit('provincia', e.target.value)} placeholder="Provincia" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <input type="number" step="0.01" value={aziendaEditForm.nuova_percentuale_gestore} onChange={(e) => updateAziendaEdit('nuova_percentuale_gestore', e.target.value)} placeholder="Nuova % provvigione gestore" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <label className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={aziendaEditForm.attiva} onChange={(e) => updateAziendaEdit('attiva', e.target.checked)} />
                  Azienda attiva
                </label>
              </div>

              <div className="mt-4 rounded-3xl border border-emerald-200 bg-white/80 p-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Qualificazione azienda</p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={aziendaEditForm.durc_url} onChange={(e) => updateAziendaEdit('durc_url', e.target.value)} placeholder="URL DURC aggiornato" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                  <input type="date" value={aziendaEditForm.durc_scadenza} onChange={(e) => updateAziendaEdit('durc_scadenza', e.target.value)} className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" title="Scadenza DURC" />
                  <input value={aziendaEditForm.polizza_url} onChange={(e) => updateAziendaEdit('polizza_url', e.target.value)} placeholder="URL polizza assicurativa" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                  <input type="date" value={aziendaEditForm.polizza_scadenza} onChange={(e) => updateAziendaEdit('polizza_scadenza', e.target.value)} className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" title="Scadenza polizza" />
                  <input value={aziendaEditForm.certificazioni_iso} onChange={(e) => updateAziendaEdit('certificazioni_iso', e.target.value)} placeholder="Certificazioni ISO" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                  <input value={aziendaEditForm.certificazioni_soa} onChange={(e) => updateAziendaEdit('certificazioni_soa', e.target.value)} placeholder="Certificazioni SOA" className="rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                </div>
                <textarea value={aziendaEditForm.schema_garanzie} onChange={(e) => updateAziendaEdit('schema_garanzie', e.target.value)} placeholder="Schema garanzie lavori" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
                <textarea value={aziendaEditForm.note_qualificazione} onChange={(e) => updateAziendaEdit('note_qualificazione', e.target.value)} placeholder="Note qualificazione / punti di forza da presentare in assemblea" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
              </div>

              <textarea value={aziendaEditForm.note} onChange={(e) => updateAziendaEdit('note', e.target.value)} placeholder="Note" className="mt-3 min-h-20 w-full rounded-2xl border border-emerald-200 bg-white px-3 py-3" />
              <button type="button" onClick={salvaModificaAzienda} className="mt-3 w-full rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white">
                Salva modifiche fornitore
              </button>
            </div>
          )}

          <div className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
            <table className="min-w-[760px] w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Azienda</th>
                  <th className="px-3 py-3">Referente</th>
                  <th className="px-3 py-3">Provvigione</th>
                  <th className="px-3 py-3">Documenti</th>
                  <th className="px-3 py-3">Stato</th>
                  <th className="px-3 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {aziendeFiltrate.length === 0 ? (
                  <tr><td colSpan="6" className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Nessun fornitore trovato.</td></tr>
                ) : aziendeFiltrate.map((azienda) => {
                  const provv = provvigioneAttivaAzienda(azienda.id);
                  const durc = statoDocumentoAzienda(azienda.durc_scadenza);
                  const polizza = statoDocumentoAzienda(azienda.polizza_scadenza);
                  return (
                    <tr key={azienda.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{azienda.ragione_sociale}</p>
                        <p className="text-xs text-slate-500">{azienda.tipo_attivita || 'Attività n.d.'} • {azienda.citta || ''} {azienda.provincia || ''}</p>
                        <p className="text-xs text-slate-400">{azienda.partita_iva || 'P.IVA n.d.'}</p>
                        {(azienda.durc_url || azienda.polizza_url) && (
                          <div className="mt-1 flex flex-wrap gap-2">
                            {azienda.durc_url && <a href={azienda.durc_url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-emerald-700">DURC</a>}
                            {azienda.polizza_url && <a href={azienda.polizza_url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-emerald-700">Polizza</a>}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-700">{azienda.referente || 'n.d.'}</p>
                        <p className="text-xs text-slate-500">{azienda.telefono || ''}</p>
                        <p className="text-xs text-slate-500">{azienda.email || ''}</p>
                      </td>
                      <td className="px-3 py-3 font-black text-emerald-700">{provv ? `${Number(provv.percentuale_gestore || 0)}%` : '0%'}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`w-fit rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badgeDocumentoClass(durc.tone)}`}>DURC: {durc.label}</span>
                          <span className={`w-fit rounded-full border px-2 py-1 text-[10px] font-black uppercase ${badgeDocumentoClass(polizza.tone)}`}>Polizza: {polizza.label}</span>
                          {(azienda.certificazioni_iso || azienda.certificazioni_soa) && (
                            <span className="w-fit rounded-full border border-sky-200 bg-sky-100 px-2 py-1 text-[10px] font-black uppercase text-sky-700">
                              {[azienda.certificazioni_iso, azienda.certificazioni_soa].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${azienda.attiva !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                          {azienda.attiva !== false ? 'Attiva' : 'Disattiva'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button type="button" onClick={() => apriModificaAzienda(azienda)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">
                          Modifica
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
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
            <EmptyState icon="📑" title="Nessun contratto disponibile" text="I contratti attivi, in scadenza o da rinnovare saranno raccolti qui in modo chiaro." action="Archivio contratti pronto" tone="slate" />
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

      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
        {dati.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            <EmptyState icon="💬" title="Nessun preventivo condiviso" text="Quando un preventivo sarà condiviso con i condòmini, lo vedrai in questa sezione." action="In attesa di condivisione" tone="blue" />
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
      <div className="mt-4 space-y-2">
        <DashboardEconomicStat label="Valore totale" value={formatEuro(totaleStorico)} tone="sky" />
        <DashboardEconomicStat label="Fatturato accettato" value={formatEuro(fatturatoAccettato)} tone="emerald" />
        <DashboardEconomicStat label="Ticket medio" value={formatEuro(ticketMedio)} tone="amber" />
        <DashboardEconomicStat label="Pratiche accettate" value={accettate.length} />
      </div>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-700">Top condomini per valore</p>
        <div className="mt-3 space-y-2">
          {perCondominio.length === 0 ? (
            <EmptyState icon="✨" title="Nessun dato disponibile" text="Quando ci saranno informazioni da mostrare, compariranno qui in una vista ordinata e facile da leggere." action="Tutto pronto" tone="slate" />
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

function DashboardEconomicaAmministratore({ segnalazioni, fatturePartner = [], provvigioniMaturate = [] }) {
  const preventivi = segnalazioni.filter((s) => Number(s.importo_preventivo || 0) > 0);
  const deliberati = segnalazioni.filter((s) => s.stato_conversione === 'accettato');

  const totalePreventivi = preventivi.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const totaleDeliberato = deliberati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const daDeliberare = Math.max(totalePreventivi - totaleDeliberato, 0);

  const fatturePagate = (fatturePartner || []).filter((f) => String(f.stato || '').toLowerCase() === 'pagata');
  const imponibilePagato = fatturePagate.reduce((sum, f) => sum + Number(f.importo_imponibile || 0), 0);
  const provvigioneDaLog = (provvigioniMaturate || []).reduce((sum, p) => sum + Number(p.importo_amministratore || 0), 0);
  const provvigione = provvigioneDaLog || (imponibilePagato * 0.10);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Dashboard economica</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">Quadro economico amministratore</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            La provvigione matura solo quando la fattura è pagata ed è calcolata sull’imponibile.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-[11px] font-black uppercase tracking-wide text-emerald-700">Provvigione maturata</p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{formatEuro(provvigione)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Totale preventivi" value={formatEuro(totalePreventivi)} tone="slate" />
        <DashboardStat label="Totale deliberato" value={formatEuro(totaleDeliberato)} tone="emerald" />
        <DashboardStat label="Da deliberare" value={formatEuro(daDeliberare)} tone="amber" />
        <DashboardStat label="Imponibile pagato" value={formatEuro(imponibilePagato)} tone="sky" />
        <DashboardStat label="Fatture pagate" value={fatturePagate.length} tone="emerald" />
      </div>

      <div className="mt-5 rounded-3xl border border-sky-100 bg-sky-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">Provvigioni amministratore</p>
        <h3 className="mt-1 text-lg font-black text-slate-900">Controllo provvigionale</h3>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <DashboardStat label="Provvigione maturata" value={formatEuro(provvigione)} tone="sky" />
          <DashboardStat label="Base imponibile" value={formatEuro(imponibilePagato)} tone="emerald" />
          <DashboardStat label="Aliquota" value="10%" tone="amber" />
          <DashboardStat label="Fatture utili" value={fatturePagate.length} tone="slate" />
        </div>

        <p className="mt-3 text-xs font-semibold text-slate-500">
          Le provvigioni vengono conteggiate esclusivamente sulle fatture saldate, al netto IVA.
        </p>
      </div>
    </section>
  );
}

function DashboardStorico({ segnalazioni }) {
  const archiviate = segnalazioni.filter((s) => isValoreVero(s.archiviata));
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
            <EmptyState icon="🗂️" title="Nessuna pratica archiviata" text="Le pratiche concluse o archiviate verranno raccolte qui per mantenere memoria storica e ordine operativo." action="Archivio pulito" tone="slate" />
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

function DashboardStatiGestore({ segnalazioni, onOpen }) {
  const stati = ['Presa in carico', 'Sopralluogo effettuato', 'Preventivata', 'Accettata', 'Pianificata', 'Chiusa', 'Rifiutata'];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Flusso operativo</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Pratiche divise per stato</h2>
          <p className="mt-1 text-sm text-slate-500">Vista rapida per controllare avanzamento, ritardi e priorità operative.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          {segnalazioni.length} pratiche attive
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stati.map((stato) => {
          const items = segnalazioni.filter((s) => s.stato === stato);
          return (
            <div key={stato} className="flex h-96 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className={'rounded-full border px-3 py-1 text-xs font-black ' + badgeClass(stato)}>{stato}</span>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">{items.length}</span>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
                {items.length === 0 ? (
                  <EmptyState icon="✅" title="Nessuna pratica in questo stato" text="Questo stato è libero. Le pratiche compariranno automaticamente quando avanzeranno nel flusso operativo." action="Stato libero" tone="emerald" />
                ) : (
                  items.map((s) => (
                    <button key={s.id} onClick={() => onOpen(s)} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-bold text-slate-900">{s.titolo}</p>
                        <span className={'shrink-0 text-xs font-black ' + priorityClass(s.priorita)}>{s.priorita}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{s.condominio}</p>
                    </button>
                  ))
                )}
                
              </div>
            </div>
          );
        })}
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Situazione per condominio</h3>
              <p className="mt-1 text-sm text-slate-500">Riepilogo compatto dei condomìni visibili.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
              {condomini.length} condomìni
            </span>
          </div>

          <div className="mt-4 max-h-[292px] space-y-3 overflow-y-auto pr-1 csp-scroll">
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

          {condomini.length > 3 && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Scorri il riquadro per visualizzare gli altri condomìni.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold">Da monitorare</h3>
          <p className="mb-4 text-sm text-slate-500">Pratiche prioritarie in evidenza.</p>
          <div className="space-y-3 md:max-h-[520px] md:overflow-y-auto md:pr-1 md:csp-scroll">
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

function LaTuaRivistaSuite({ riviste, ruolo, onOpenPubblica, canPublish = false }) {
  const rivisteOrdinate = [...(riviste || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const ultima = rivisteOrdinate[0];

  return (
    <section className="space-y-4 pb-8">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 shadow-sm">
        <div className="p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Magazine CSP</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">La tua rivista</h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
                Archivio digitale della rivista Condominio Senza Pensieri: uscite bimestrali, contenuti tecnici, legali e pratici per vivere il condominio con più chiarezza.
              </p>
            </div>
            {canPublish && (
              <button
                type="button"
                onClick={onOpenPubblica}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20"
              >
                + Pubblica uscita
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Archivio</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{rivisteOrdinate.length}</p>
              <p className="text-xs font-semibold text-slate-500">uscite disponibili</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm md:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Ultima uscita</p>
              <p className="mt-2 text-lg font-black text-slate-900">{ultima?.titolo || 'Nessuna uscita pubblicata'}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {[ultima?.numero, ultima?.periodo].filter(Boolean).join(' • ') || 'Quando sarà pubblicata, comparirà qui.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {rivisteOrdinate.length === 0 ? (
        <EmptyState
          icon="📰"
          title="Archivio rivista ancora vuoto"
          text={ruolo === 'gestore' ? 'Pubblica la prima uscita bimestrale per renderla disponibile ad amministratori, collaboratori e condòmini.' : 'Quando sarà disponibile una nuova uscita, la troverai qui pronta da leggere o scaricare.'}
          action="Archivio pronto"
          tone="emerald"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {rivisteOrdinate.map((rivista) => {
            const fileUrl = rivista.file_url || buildPublicUrl(rivista.file_nome);
            return (
              <article key={rivista.id || rivista.file_nome} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">📰</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                      {[rivista.numero, rivista.periodo].filter(Boolean).join(' • ') || 'Rivista CSP'}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-900">{rivista.titolo}</h3>
                    {rivista.descrizione && <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">{rivista.descrizione}</p>}
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Pubblicata il {rivista.created_at ? new Date(rivista.created_at).toLocaleDateString('it-IT') : 'n.d.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-black text-white"
                  >
                    Leggi rivista
                  </a>
                  <a
                    href={`${fileUrl}?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-center text-sm font-black text-emerald-700"
                  >
                    Apri / Scarica
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PubblicaRivistaModal({ onClose, onPubblica, saving }) {
  const [numero, setNumero] = useState('Numero 0');
  const [periodo, setPeriodo] = useState('');
  const [titolo, setTitolo] = useState('Condominio Senza Pensieri');
  const [descrizione, setDescrizione] = useState('');
  const [file, setFile] = useState(null);
  const [errore, setErrore] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErrore('');

    if (!titolo.trim() || !file) {
      setErrore('Inserisci titolo e PDF della rivista.');
      return;
    }

    await onPubblica({
      numero,
      periodo,
      titolo,
      descrizione,
      file,
    });
  };

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-lg rounded-3xl border border-white/60 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">La tua rivista</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">Pubblica nuova uscita</h3>
            <p className="mt-1 text-sm text-slate-500">
              Carica il PDF della rivista e rendilo disponibile nell’archivio digitale.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">
            Chiudi
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Numero es. Numero 0"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            placeholder="Periodo es. Maggio/Giugno 2026"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="Titolo uscita"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />
          <textarea
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="Descrizione breve, facoltativa"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <label className="block rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <span className="font-black">PDF rivista</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-3 block w-full text-sm"
            />
            {file && <span className="mt-2 block text-xs font-semibold">{file.name}</span>}
          </label>

          {errore && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {errore}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 font-black text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60"
          >
            {saving ? 'Pubblicazione in corso...' : 'Pubblica rivista'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ArchivioReportPremium({ reports, ruolo, canSend = false, onOpenInvia }) {
  const canFilterCondominio = !['condominio', 'condomino'].includes(ruolo);
  const [filtroReportCondominio, setFiltroReportCondominio] = useState('tutti');
  const reportCondomini = Array.from(new Set((reports || [])
    .map((report) => report.condominio || report.nome_condominio || report.condominio_nome || 'Condominio')
    .filter(Boolean)))
    .sort((a, b) => String(a).localeCompare(String(b), 'it'));
  const reportsFiltrati = canFilterCondominio && filtroReportCondominio !== 'tutti'
    ? (reports || []).filter((report) => String(report.condominio || report.nome_condominio || report.condominio_nome || 'Condominio') === String(filtroReportCondominio))
    : (reports || []);
  const reportsOrdinati = [...reportsFiltrati].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const ultimo = reportsOrdinati[0];
  const memoriaLabel = canFilterCondominio ? 'La memoria dei tuoi immobili' : 'La memoria del tuo immobile';

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-teal-50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-700">{memoriaLabel}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">I tuoi report</h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
              Report, aggiornamenti e documenti raccolti nel tempo in un unico spazio dedicato.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:min-w-[260px]">
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-center shadow-sm backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Report</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{reportsOrdinati.length}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-center shadow-sm backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Ultimo</p>
              <p className="mt-2 text-sm font-black text-slate-800">
                {ultimo?.created_at ? new Date(ultimo.created_at).toLocaleDateString('it-IT') : '—'}
              </p>
            </div>
          </div>
        </div>

        {canFilterCondominio && reportCondomini.length > 1 && (
          <div className="mt-5 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Filtra per condominio</label>
            <select
              value={filtroReportCondominio}
              onChange={(e) => setFiltroReportCondominio(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm font-bold text-slate-700"
            >
              <option value="tutti">Tutti i condomìni</option>
              {reportCondomini.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
          </div>
        )}
        {canSend && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenInvia}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20"
            >
              Invia report semestrale
            </button>
          </div>
        )}
      </div>

      {reportsOrdinati.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-3xl">📄</div>
          <h3 className="mt-4 text-xl font-black text-slate-900">Nessun report disponibile</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-slate-500">
            Qui troverai i report del tuo condominio appena saranno pubblicati e resi disponibili ai soggetti autorizzati.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reportsOrdinati.map((report) => (
            <article key={report.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Report CSP</span>
                    {report.periodo && <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{report.periodo}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-black text-slate-900">{report.titolo || 'Report condominio'}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {report.condominio || report.nome_condominio || 'Condominio'} • {report.created_at ? new Date(report.created_at).toLocaleDateString('it-IT') : 'Data non disponibile'}
                  </p>
                  {report.descrizione && <p className="mt-2 text-sm font-semibold text-slate-600">{report.descrizione}</p>}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-black text-white shadow-sm"
                  >
                    Apri report
                  </a>
                  <a
                    href={`${report.file_url}?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-black text-emerald-700"
                  >
                    Apri / Scarica
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ReportSemestraleModal({ condomini, onClose, onInvia, saving }) {
  const [condominioId, setCondominioId] = useState(condomini?.[0]?.id ? String(condomini[0].id) : '');
  const [periodo, setPeriodo] = useState('');
  const [titolo, setTitolo] = useState('Report semestrale Premium');
  const [file, setFile] = useState(null);
  const [errore, setErrore] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErrore('');

    if (!condominioId || !periodo.trim() || !titolo.trim() || !file) {
      setErrore('Seleziona condominio, periodo, titolo e PDF del report.');
      return;
    }

    await onInvia({
      condominioId: Number(condominioId),
      periodo: periodo.trim(),
      titolo: titolo.trim(),
      file,
    });
  };

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-lg rounded-3xl border border-white/60 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Premium</p>
            <h3 className="mt-1 text-xl font-black text-slate-900">Invia report semestrale</h3>
            <p className="mt-1 text-sm text-slate-500">
              Carica il PDF e invialo via email e push ad amministratore e condòmini.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">
            Chiudi
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <select
            value={condominioId}
            onChange={(e) => setCondominioId(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          >
            <option value="">Seleziona condominio</option>
            {(condomini || []).map((condominio) => (
              <option key={condominio.id} value={condominio.id}>
                {condominio.nome}
              </option>
            ))}
          </select>

          <input
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            placeholder="Periodo es. Primo semestre 2026"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <input
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="Titolo report"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          />

          <label className="block rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <span className="font-black">PDF report</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mt-3 block w-full text-sm"
            />
            {file && <span className="mt-2 block text-xs font-semibold">{file.name}</span>}
          </label>

          {errore && (
            <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              {errore}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-3 font-black text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60"
          >
            {saving ? 'Invio in corso...' : 'Invia report Premium'}
          </button>
        </form>
      </div>
    </div>
  );
}


function ActionBar({ condomini, filtroCondominioId, onChangeFiltroCondominio, filtroStato, onChangeFiltroStato, searchTerm, onChangeSearchTerm, onRefresh, loading, ruolo, showArchiviate, onToggleArchiviate, onOpenReportPremium }) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const showCondominioSelect = ruoloNorm === 'gestore' || (Array.isArray(condomini) && condomini.length > 1);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm csp-enter">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Control Center</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Contesto operativo, filtri e azioni rapide in un unico pannello.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[1fr_1fr_1fr_auto]">
          {showCondominioSelect && (
            <select value={filtroCondominioId} onChange={(e) => onChangeFiltroCondominio(e.target.value)} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm font-bold text-emerald-950 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100">
              <option value="">{ruoloNorm === 'gestore' ? 'Tutti i condomini' : 'Tutti i tuoi condomini'}</option>
              {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          )}
          {(ruolo === 'amministratore' || ruolo === 'collaboratore') && (
            <select value={filtroStato} onChange={(e) => onChangeFiltroStato(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
              <option value="">Tutti gli stati</option>
              <option value="Presa in carico">Presa in carico</option>
              <option value="Sopralluogo programmato">Sopralluogo programmato</option>
              <option value="Sopralluogo effettuato">Sopralluogo effettuato</option>
              <option value="Preventivata">Preventivata</option>
              <option value="Accettata">Accettata</option>
              <option value="Pianificata">Pianificata</option>
              <option value="Chiusa">Chiusa</option>
              <option value="Rifiutata">Rifiutata</option>
            </select>
          )}
          <input value={searchTerm} onChange={(e) => onChangeSearchTerm(e.target.value)} placeholder="Cerca pratica..." className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <button type="button" className="rounded-2xl border border-emerald-100 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm">
            Vista
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {ruolo === 'gestore' && onOpenReportPremium && (
          <button
            type="button"
            onClick={onOpenReportPremium}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-black text-emerald-700"
          >
            Report Premium
          </button>
        )}
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
      <button disabled={saving} className={`rounded-xl bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-60 ${MOTION_BUTTON} csp-tap csp-tap`}>
        {saving ? 'Salvataggio...' : 'Salva segnalazione'}
      </button>
    </form>
  );
}

function SegnalazioneCard({ segnalazione, onOpen, pianoAbbonamento = 'base', showSubscriptionBadge = false }) {
  return (
    <button onClick={() => onOpen(segnalazione)} className={`w-full overflow-hidden rounded-2xl border p-4 text-left transition hover:shadow-md ${showSubscriptionBadge ? subscriptionPlanCardClass(pianoAbbonamento) : 'border-slate-200 bg-white'}`}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-900">{segnalazione.titolo}</p>
          <p className="break-words text-sm text-slate-500">{segnalazione.condominio}</p>
        </div>
        <span className={'shrink-0 rounded-full border px-2 py-1 text-xs ' + badgeClass(segnalazione.stato)}><StatoBadge stato={segnalazione.stato} /></span>
      </div>
    </button>
  );
}


function TimelinePratica({ stato }) {
  const steps = [
    { key: 'Nuova', match: ['nuova', 'aperta'], icon: '1' },
    { key: 'In carico', match: ['presa in carico', 'in corso', 'sopralluogo', 'preventivata', 'accettata'], icon: '2' },
    { key: 'Programmata', match: ['pianificata', 'programmata'], icon: '3' },
    { key: 'Chiusa', match: ['chiusa'], icon: '4' },
  ];

  const statoNorm = String(stato || '').toLowerCase();

  let activeIndex = steps.findIndex((step) =>
    step.match.some((term) => statoNorm.includes(term))
  );

  if (statoNorm.includes('rifiutata')) activeIndex = -1;
  if (activeIndex < 0 && !statoNorm.includes('rifiutata')) activeIndex = 0;

  return (
    <div className="csp-enter rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Avanzamento pratica</p>
          <p className="mt-1 text-xs text-slate-500">Segui il percorso operativo dalla segnalazione alla chiusura.</p>
        </div>
        <StatoBadge stato={stato} />
      </div>

      {statoNorm.includes('rifiutata') ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
          Pratica rifiutata o archiviata.
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto_1fr_auto_1fr_auto] items-start gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < activeIndex;
            const isActive = index === activeIndex;
            const isDoneOrActive = isCompleted || isActive;

            return (
              <div key={step.key} className="contents">
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-2xl text-xs font-black shadow-sm transition-all duration-300 ${
                      isActive
                        ? 'scale-110 bg-emerald-600 text-white shadow-emerald-900/20'
                        : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span
                    className={`mt-2 max-w-[72px] text-[10px] font-black uppercase leading-tight ${
                      isDoneOrActive ? 'text-emerald-800' : 'text-slate-400'
                    }`}
                  >
                    {step.key}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="pt-4">
                    <div className={`h-1 rounded-full transition-all duration-500 ${
                      index < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote, onUploadFile, onUpdateImporto, ruolo, utenteEmail, onConversionePreventivo, onPianificaLavori, onGeneraReport, onGeneraPdfVotazioni, onCondividiCondomini, onVotoCondomino, onInviaReminderVoto, onInviaRipartoMillesimi, onDeletePratica, onRipristinaPratica, votiPreventivi, votazioniRiepiloghi = [], utentiCondomini, utentiSistema, condomini = [], onRefreshVoti, subscriptionFlags = getSubscriptionFlags('premium'), pianoAbbonamento = 'base', showSubscriptionBadge = false }) {
  const ruoloDettaglio = String(ruolo || '').toLowerCase().trim();
  const isAmministratoreOperativoDettaglio = ruoloDettaglio === 'amministratore' || ruoloDettaglio === 'collaboratore';
  const [nota, setNota] = useState('');
  const [mostraCronologia, setMostraCronologia] = useState(false);
  const [file, setFile] = useState(null);
  const [importo, setImporto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dataInizioPresunta, setDataInizioPresunta] = useState('');
  const [importoRiparto, setImportoRiparto] = useState('');
  const [scadenzaRiparto, setScadenzaRiparto] = useState('');
  const [rateRiparto, setRateRiparto] = useState('1');
  const [scadenzeRateRiparto, setScadenzeRateRiparto] = useState(['']);

  if (!segnalazione) return null;

  const condominioPratica = (condomini || []).find((c) => Number(c.id) === Number(segnalazione.condominio_id));
  const mapsCspParts = [
    segnalazione.indirizzo,
    segnalazione.luogo,
    condominioPratica?.indirizzo,
    condominioPratica?.citta,
    segnalazione.condominio,
    condominioPratica?.nome,
  ];

  const votiPratica = (votiPreventivi || []).filter((v) => Number(v.segnalazione_id) === Number(segnalazione.id));
  const votoUtente = votiPratica.find((v) => String(v.email || '').toLowerCase().trim() === String(utenteEmail || '').toLowerCase().trim());
  const votiFavorevoli = votiPratica.filter((v) => v.voto === 'favorevole').length;
  const votiContrari = votiPratica.filter((v) => v.voto === 'contrario').length;
  const votiIndecisi = votiPratica.filter((v) => v.voto === 'indeciso').length;
  const totaleVoti = votiPratica.length;
  const consensoPercentuale = totaleVoti ? Math.round((votiFavorevoli / totaleVoti) * 100) : 0;
  const partecipazionePercentuale = Math.min(100, totaleVoti * 10);
  const ultimoVoto = votiPratica
    .slice()
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())[0];

  const emailCondominiAbilitati = new Set(
    (utentiSistema || [])
      .filter((utente) => ['condominio', 'condomino'].includes(String(utente.ruolo || '').toLowerCase().trim()))
      .map((utente) => String(utente.email || '').toLowerCase().trim())
      .filter(Boolean)
  );

  const aventiDirittoVoto = [...new Set(
    (utentiCondomini || [])
      .filter((item) => Number(item.condominio_id) === Number(segnalazione.condominio_id))
      .map((item) => String(item.email || '').toLowerCase().trim())
      .filter((email) => email && emailCondominiAbilitati.has(email))
  )];

  const emailVotanti = new Set(votiPratica.map((voto) => String(voto.email || '').toLowerCase().trim()).filter(Boolean));
  const totaleAventiDiritto = aventiDirittoVoto.length;
  const votiMancanti = Math.max(totaleAventiDiritto - totaleVoti, 0);
  const nonVotanti = aventiDirittoVoto.filter((email) => !emailVotanti.has(email));
  const partecipazioneRealePercentuale = totaleAventiDiritto ? Math.round((totaleVoti / totaleAventiDiritto) * 100) : 0;
  const consultazioneCompletata = totaleAventiDiritto > 0 && votiMancanti === 0;

  const riepilogoAggregato = (votazioniRiepiloghi || []).find((item) => Number(item.segnalazione_id) === Number(segnalazione.id));
  const sintesiFavorevoli = Number(riepilogoAggregato?.favorevoli ?? votiFavorevoli);
  const sintesiContrari = Number(riepilogoAggregato?.contrari ?? votiContrari);
  const sintesiIndecisi = Number(riepilogoAggregato?.indecisi ?? votiIndecisi);
  const sintesiTotaleVoti = Number(riepilogoAggregato?.totale_voti ?? totaleVoti);
  const sintesiAventiDiritto = Number(riepilogoAggregato?.totale_aventi_diritto ?? totaleAventiDiritto);
  const sintesiVotiMancanti = Math.max(Number(riepilogoAggregato?.voti_mancanti ?? votiMancanti), 0);
  const sintesiPartecipazione = Number(riepilogoAggregato?.partecipazione_percentuale ?? partecipazioneRealePercentuale);
  const sintesiCompletata = Boolean(riepilogoAggregato?.completata ?? consultazioneCompletata);

  const condominiRiparto = (utentiCondomini || [])
    .filter((item) => Number(item.condominio_id) === Number(segnalazione.condominio_id))
    .map((item) => {
      const email = String(item.email || '').toLowerCase().trim();
      const utente = (utentiSistema || []).find((u) => String(u.email || '').toLowerCase().trim() === email);
      const ruoloRiparto = String(item.ruolo || utente?.ruolo || '').toLowerCase().trim();
      return {
        email,
        nome: utente?.nome || email,
        ruolo: ruoloRiparto,
        millesimi: Number(item.millesimi || 0),
      };
    })
    .filter((item) => item.email && ['condominio', 'condomino'].includes(item.ruolo));

  const totaleMillesimi = condominiRiparto.reduce((sum, item) => sum + Number(item.millesimi || 0), 0);
  const importoRipartoNumero = Number(importoRiparto || segnalazione.importo_preventivo || 0);
  const numeroRateRiparto = Math.max(1, Number(rateRiparto || 1));
  const scadenzeRateComplete = scadenzeRateRiparto.slice(0, numeroRateRiparto).every(Boolean);

  const aggiornaNumeroRateRiparto = (value) => {
    const numero = Math.max(1, Number(value || 1));
    setRateRiparto(String(numero));
    setScadenzeRateRiparto((prev) => {
      const prossime = [...prev];
      while (prossime.length < numero) prossime.push('');
      return prossime.slice(0, numero);
    });
  };

  const aggiornaScadenzaRata = (index, value) => {
    setScadenzeRateRiparto((prev) => {
      const prossime = [...prev];
      prossime[index] = value;
      return prossime;
    });

    if (index === 0) {
      setScadenzaRiparto(value);
    }
  };

  const quotePerRata = numeroRateRiparto > 0 ? importoRipartoNumero / numeroRateRiparto : importoRipartoNumero;
  const quoteRiparto = condominiRiparto.map((item) => ({
    ...item,
    quota: importoRipartoNumero * Number(item.millesimi || 0) / 1000,
    quota_rata: quotePerRata * Number(item.millesimi || 0) / 1000,
  }));

  const ripartoSalvato = (() => {
    const raw = segnalazione.riparto_millesimale;

    if (!raw) return null;
    if (typeof raw === 'object') return raw;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  const noteRipartoStorico = (segnalazione.note || []).some((nota) =>
    String(nota?.testo || '').toLowerCase().includes('riparto millesimale inviato')
  );

  const emailUtentePulita = String(utenteEmail || '').toLowerCase().trim();
  const ruoloRipartoVisibile = ['condominio', 'condomino'].includes(String(ruolo || '').toLowerCase().trim());
  const canUseRipartoMillesimale = subscriptionFlags?.isPlus || subscriptionFlags?.isPremium;
  const quotaUtenteRiparto = ripartoSalvato?.quote?.find((item) => {
    const emailQuota = String(item.email || item.utente_email || item.email_condomino || '').toLowerCase().trim();
    return emailQuota && emailQuota === emailUtentePulita;
  });

  return (
    <div className="fixed inset-0 z-[220] overflow-y-auto bg-black/40 p-2 md:flex md:items-center md:justify-center md:overflow-hidden md:p-4">
      <div className="min-h-full w-full max-w-4xl rounded-2xl border border-white/60 bg-white shadow-2xl md:flex md:h-[90vh] md:min-h-0 md:flex-col md:overflow-hidden md:rounded-3xl">
        <div className="sticky top-0 z-20 flex items-start justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-xl md:p-5">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words text-lg font-bold leading-tight md:text-xl">{segnalazione.titolo}</h3>
              {showSubscriptionBadge && <SubscriptionPlanBadge piano={pianoAbbonamento} />}
            </div>
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
                onClick={() => onGeneraPdfVotazioni(segnalazione, ruolo)}
                className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white"
              >
                Export PDF votazioni
              </button>
            )}
            <button onClick={onClose} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">Chiudi</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-4 md:flex-1 md:grid-cols-2 md:overflow-y-auto md:p-5">
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <GoogleMapsButton parts={mapsCspParts} className="mt-1" />
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            {(ruolo === 'gestore' || isAmministratoreOperativoDettaglio) && (
              <p><span className="text-slate-500">Importo preventivo:</span> {formatEuro(segnalazione.importo_preventivo || 0)}</p>
            )}
            {segnalazione.data_inizio_lavori_presunta && (
              <p><span className="text-slate-500">Inizio lavori presunto:</span> {new Date(segnalazione.data_inizio_lavori_presunta).toLocaleDateString('it-IT')}</p>
            )}
            {segnalazione.allegatoUrl && <img src={segnalazione.allegatoUrl} alt="Allegato" className="w-full rounded-xl border border-slate-200" />}
            {segnalazione.fotosopralluogourl && <img src={segnalazione.fotosopralluogourl} alt="Sopralluogo" className="w-full rounded-xl border border-purple-200" />}
            {segnalazione.fotolavorifinitiurl && (
              <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="mb-2 text-sm font-black text-emerald-800">Foto lavoro finito</p>
                <img src={segnalazione.fotolavorifinitiurl} alt="Lavoro finito" className="w-full rounded-xl border border-emerald-200" />
              </div>
            )}
            {segnalazione.preventivourl && (!['condominio', 'condomino'].includes(ruolo) || segnalazione.preventivo_condiviso_condomini) && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <a href={segnalazione.preventivourl} target="_blank" rel="noreferrer" className="inline-flex text-sm font-bold text-emerald-700 underline">
                  Apri preventivo
                </a>

                {(['condominio', 'condomino'].includes(ruolo) || isAmministratoreOperativoDettaglio || ruolo === 'gestore') && segnalazione.preventivo_condiviso_condomini && (
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-sky-800">
                        Preventivo condiviso dall’amministratore
                      </p>
                      <p className="mt-1 text-xs text-sky-700">
                        Documento disponibile per consultazione diretta.
                      </p>
                    </div>

                    {['condominio', 'condomino'].includes(ruolo) && (
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
                        {votoUtente && (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Votato</p>
                            <p className="mt-1 text-sm font-bold text-emerald-800">Il tuo voto: {votoUtente.voto}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(['condominio', 'condomino'].includes(ruolo) || ruolo === 'gestore') && (
                      <div className="mt-3 rounded-xl border border-white/70 bg-white p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-sky-800">Riepilogo votazione</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Esito consultivo aggiornato in tempo reale.
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${sintesiCompletata ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sintesiCompletata ? 'Completata' : 'In corso'}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Favorevoli</p>
                            <p className="text-lg font-black text-emerald-700">{sintesiFavorevoli}</p>
                          </div>
                          <div className="rounded-xl bg-red-50 p-3 text-center border border-red-100">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Contrari</p>
                            <p className="text-lg font-black text-red-600">{sintesiContrari}</p>
                          </div>
                          <div className="rounded-xl bg-amber-50 p-3 text-center border border-amber-100">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Indecisi</p>
                            <p className="text-lg font-black text-amber-600">{sintesiIndecisi}</p>
                          </div>
                          <div className="rounded-xl bg-sky-50 p-3 text-center border border-sky-100">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500">Voti</p>
                            <p className="text-lg font-black text-sky-700">{sintesiTotaleVoti}/{sintesiAventiDiritto || sintesiTotaleVoti}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                            <span>Partecipazione</span>
                            <span>{sintesiPartecipazione}%</span>
                          </div>
                          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-sky-600 transition-all duration-500" style={{ width: `${sintesiPartecipazione}%` }} />
                          </div>
                        </div>

                        <p className="mt-3 text-xs font-semibold text-slate-600">
                          {sintesiCompletata
                            ? 'La votazione è completa. Push ed email finali vengono inviate automaticamente dal sistema.'
                            : `La votazione non è ancora completa: mancano ${sintesiVotiMancanti} voti.`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isAmministratoreOperativoDettaglio && segnalazione.stato === 'Preventivata' && (
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

                {isAmministratoreOperativoDettaglio && segnalazione.stato === 'Preventivata' && !segnalazione.preventivo_condiviso_condomini && (
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

                {segnalazione.preventivo_condiviso_condomini && isAmministratoreOperativoDettaglio && (
                  <div className="rounded-xl bg-sky-100 px-3 py-3 text-sm font-semibold text-sky-700">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p>Preventivo condiviso con i condomini</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onRefreshVoti(segnalazione.id)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-sky-700 border border-sky-200 hover:bg-sky-50"
                        >
                          Aggiorna voti
                        </button>
                        <button
                          type="button"
                          onClick={() => onInviaReminderVoto(segnalazione)}
                          className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-bold text-white hover:bg-sky-800"
                        >
                          Invia reminder non votanti
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Favorevoli</p>
                        <p className="text-lg font-black text-emerald-700">{sintesiFavorevoli}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Contrari</p>
                        <p className="text-lg font-black text-red-600">{sintesiContrari}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Indecisi</p>
                        <p className="text-lg font-black text-amber-600">{sintesiIndecisi}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 text-center border border-sky-100">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Consenso</p>
                        <p className="text-lg font-black text-sky-700">{consensoPercentuale}%</p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/70 bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                        <span>Partecipazione consultiva</span>
                        <span>{totaleVoti}/{totaleAventiDiritto} voti</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-600 transition-all duration-500" style={{ width: `${sintesiPartecipazione}%` }} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                          <p className="text-[10px] uppercase text-slate-500">Aventi diritto</p>
                          <p className="font-black text-slate-800">{totaleAventiDiritto}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                          <p className="text-[10px] uppercase text-slate-500">Ricevuti</p>
                          <p className="font-black text-sky-700">{totaleVoti}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                          <p className="text-[10px] uppercase text-slate-500">Mancanti</p>
                          <p className="font-black text-amber-600">{votiMancanti}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2 border border-slate-100">
                          <p className="text-[10px] uppercase text-slate-500">Partecipazione</p>
                          <p className="font-black text-emerald-700">{partecipazioneRealePercentuale}%</p>
                        </div>
                      </div>
                      <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-black ${sintesiCompletata ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {consultazioneCompletata ? 'Consultazione completata' : `In attesa di ${votiMancanti} voti`}
                      </div>
                      {ultimoVoto && (
                        <p className="mt-2 text-xs text-slate-500">
                          Ultimo voto: {ultimoVoto.voto} • {ultimoVoto.email}
                        </p>
                      )}
                    </div>

                    {isAmministratoreOperativoDettaglio && nonVotanti.length > 0 && (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 md:max-h-32 md:overflow-auto">
                        <p className="border-b border-amber-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-700">Non votanti</p>
                        {nonVotanti.map((email) => (
                          <p key={email} className="border-b border-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 last:border-b-0">{email}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 rounded-xl border border-white/70 bg-white md:max-h-40 md:overflow-y-auto md:csp-scroll">
                      {votiPratica.length === 0 ? (
                        <EmptyState icon="🗳️" title="Nessun voto ancora registrato" text="Quando i condòmini voteranno, il riepilogo apparirà qui in tempo reale." action="Votazione in attesa" tone="blue" />
                      ) : (
                        votiPratica.map((voto) => (
                          <div key={`${voto.segnalazione_id}-${voto.email}`} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
                            <p className="truncate text-xs font-semibold text-slate-700">{voto.email}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">{voto.voto}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="md:hidden">
              <TimelinePratica stato={segnalazione.stato} />
            </div>
            <div className="hidden md:block">
              <TimelinePratica stato={segnalazione.stato} />
            </div>
            <div className="flex flex-wrap gap-2">
              {ruolo === 'gestore' && STATI_PRATICA.map((stato) => (
                <button
                  key={stato}
                  onClick={() => onChangeStatus(segnalazione.id, stato)}
                  className={statoButtonClass(stato, segnalazione.stato)}
                  title={stato === segnalazione.stato ? 'Stato attuale' : `Passa a ${stato}`}
                >
                  {stato === segnalazione.stato ? '● ' : ''}{stato}
                </button>
              ))}
            </div>

            {ruolo === 'gestore' && segnalazione.stato === 'Sopralluogo effettuato' && (
              <div className="space-y-2 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <p className="font-semibold text-purple-800">Foto sopralluogo</p>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button disabled={!file || uploading} onClick={async () => { setUploading(true); await onUploadFile(segnalazione.id, file, 'fotosopralluogonome', 'sopralluogo'); setFile(null); setUploading(false); }} className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  Carica foto
                </button>
              </div>
            )}

            {ruolo === 'gestore' && segnalazione.stato === 'Accettata' && (
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

            {ruolo === 'gestore' && segnalazione.stato === 'Chiusa' && (
              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div>
                  <p className="font-semibold text-emerald-900">Foto lavoro finito</p>
                  <p className="mt-1 text-sm text-emerald-800">Carica una o più immagini rappresentative del lavoro concluso.</p>
                </div>
                {segnalazione.fotolavorifinitiurl && (
                  <img src={segnalazione.fotolavorifinitiurl} alt="Lavoro finito" className="w-full rounded-xl border border-emerald-200" />
                )}
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button
                  disabled={!file || uploading}
                  onClick={async () => {
                    setUploading(true);
                    await onUploadFile(segnalazione.id, file, 'fotolavorifinitinome', 'lavoro-finito');
                    setFile(null);
                    setUploading(false);
                  }}
                  className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  Carica foto lavoro finito
                </button>
              </div>
            )}

            {ruolo === 'gestore' && segnalazione.stato === 'Preventivata' && (
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

            {!ripartoSalvato && noteRipartoStorico && (
              <div className="space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="font-semibold text-amber-900">Riparto millesimale inviato</p>
                <p className="text-sm text-amber-800">
                  Per questa pratica risulta un riparto già inviato, ma non è presente il dettaglio strutturato delle rate.
                  Per visualizzare importi rata e scadenze nella scheda del condomino, reinvia il riparto con la nuova versione.
                </p>
              </div>
            )}

            {ruoloRipartoVisibile && ripartoSalvato && !canUseRipartoMillesimale && (
              <SubscriptionLockedCard
                required="plus"
                compact
                title="Riparto millesimale disponibile con CSP Plus"
                text="Il dettaglio quote, rate e scadenze personali è una funzione Plus e Premium. Il condominio resta operativo in Base, ma senza riparto automatico e reminder dedicati."
              />
            )}

            {ruoloRipartoVisibile && ripartoSalvato && canUseRipartoMillesimale && (
              <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div>
                  <p className="font-semibold text-amber-900">Riparto millesimale</p>
                  <p className="mt-1 text-sm text-amber-800">
                    Consulta il riepilogo riservato della tua quota e delle scadenze di pagamento.
                  </p>
                </div>

                {quotaUtenteRiparto ? (
                  <>
                    <div className="grid grid-cols-1 gap-2 text-xs font-bold sm:grid-cols-2 lg:grid-cols-4">
                      <span className="rounded-xl bg-white px-3 py-2 text-amber-700">Importo totale: {formatEuro(ripartoSalvato.importo_totale || 0)}</span>
                      <span className="rounded-xl bg-white px-3 py-2 text-amber-700">I tuoi millesimi: {Number(quotaUtenteRiparto.millesimi || 0).toLocaleString('it-IT')}</span>
                      <span className="rounded-xl bg-white px-3 py-2 text-amber-700">Tua quota totale: {formatEuro(quotaUtenteRiparto.quota || 0)}</span>
                      <span className="rounded-xl bg-white px-3 py-2 text-amber-700">Rate: {ripartoSalvato.rate || 1}</span>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-white p-3">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">Piano rate personale</p>
                      <div className="mt-2 space-y-2">
                        {(ripartoSalvato.scadenze_rate || [ripartoSalvato.scadenza]).filter(Boolean).map((scadenza, index) => {
                          const rateCount = Math.max(1, Number(ripartoSalvato.rate || 1));
                          const importoRata = rateCount > 1
                            ? Number(quotaUtenteRiparto.quota_rata || 0)
                            : Number(quotaUtenteRiparto.quota || 0);

                          return (
                            <div key={`${scadenza}-${index}`} className="grid grid-cols-3 items-center gap-3 rounded-xl bg-amber-50 px-3 py-2">
                              <span className="text-xs font-black text-amber-800">Rata {index + 1}</span>
                              <span className="text-xs font-semibold text-slate-600">Scadenza: {new Date(scadenza).toLocaleDateString('it-IT')}</span>
                              <span className="text-right text-sm font-black text-amber-700">{formatEuro(importoRata)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-amber-200 bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Quota personale non disponibile</p>
                    <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                      La tua quota personale non è stata trovata nel riparto. Verifica che la tua email sia associata correttamente al condominio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isAmministratoreOperativoDettaglio && ['Accettata', 'Pianificata', 'Chiusa'].includes(segnalazione.stato) && !canUseRipartoMillesimale && (
              <SubscriptionLockedCard
                required="plus"
                compact
                title="Riparto millesimale disponibile con CSP Plus"
                text="Con Plus e Premium l’amministratore può calcolare quote, rate e scadenze in automatico, riducendo lavoro manuale e richieste di chiarimento."
              />
            )}

            {isAmministratoreOperativoDettaglio && ['Accettata', 'Pianificata', 'Chiusa'].includes(segnalazione.stato) && canUseRipartoMillesimale && (
              <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div>
                  <p className="font-semibold text-amber-900">Riparto costi per millesimi</p>
                  <p className="mt-1 text-sm text-amber-800">Calcola e invia ai soli condomini la quota individuale della pratica deliberata.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input type="number" min="0" step="0.01" value={importoRiparto} onChange={(e) => setImportoRiparto(e.target.value)} placeholder={`Importo totale ${formatEuro(segnalazione.importo_preventivo || 0)}`} className="rounded-xl border border-amber-200 px-3 py-2 text-sm" />
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-white px-2 py-2">
                    <button
                      type="button"
                      onClick={() => aggiornaNumeroRateRiparto(Math.max(1, numeroRateRiparto - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg font-black text-amber-800"
                      aria-label="Diminuisci rate"
                    >
                      −
                    </button>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-wide text-amber-700">Rate</p>
                      <p className="text-lg font-black text-slate-900">{numeroRateRiparto}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => aggiornaNumeroRateRiparto(numeroRateRiparto + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-lg font-black text-white"
                      aria-label="Aumenta rate"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-white/70 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-700">Scadenze rate</p>
                  <p className="mt-1 text-xs text-amber-700">Inserisci una data per ogni rata prevista.</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {Array.from({ length: numeroRateRiparto }).map((_, index) => (
                      <label key={index} className="text-xs font-bold text-slate-600">
                        Rata {index + 1}
                        <input
                          type="date"
                          value={scadenzeRateRiparto[index] || ''}
                          onChange={(e) => aggiornaScadenzaRata(index, e.target.value)}
                          className="mt-1 w-full rounded-xl border border-amber-200 px-3 py-2 text-sm"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Aventi diritto: {condominiRiparto.length}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Totale millesimi: {totaleMillesimi}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Importo: {formatEuro(importoRipartoNumero)}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Rate: {numeroRateRiparto}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Importo rata: {formatEuro(quotePerRata)}</span>
                  </div>
                  {totaleMillesimi !== 1000 && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Attenzione: il totale millesimi non è 1000. Verifica i dati prima dell’invio.</p>
                  )}
                  <div className="mt-3 rounded-xl border border-slate-100 md:max-h-40 md:overflow-y-auto md:csp-scroll">
                    {quoteRiparto.length === 0 ? (
                      <EmptyState icon="📐" title="Millesimi non configurati" text="Configura i millesimi dei condòmini per ottenere un riparto chiaro e pronto da condividere." action="Configurazione richiesta" tone="amber" />
                    ) : quoteRiparto.map((item) => (
                      <div key={item.email} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">{item.nome}</p>
                          <p className="truncate text-[11px] text-slate-500">{item.email} • {item.millesimi} millesimi</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-black text-amber-700">{formatEuro(item.quota)}</p>
                          {numeroRateRiparto > 1 && <p className="text-[11px] font-semibold text-amber-600">{formatEuro(item.quota_rata)} / rata</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" disabled={!importoRipartoNumero || !scadenzeRateComplete || quoteRiparto.length === 0 || totaleMillesimi <= 0} onClick={() => onInviaRipartoMillesimi(segnalazione, { importo_totale: importoRipartoNumero, scadenza: scadenzeRateRiparto[0] || '', scadenze_rate: scadenzeRateRiparto.slice(0, numeroRateRiparto), rate: numeroRateRiparto, quote: quoteRiparto, totale_millesimi: totaleMillesimi })} className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  Invia riparto ai condomini
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

        <div className="border-t border-slate-200 bg-white px-4 py-2 md:px-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMostraCronologia((prev) => !prev)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm">📝</span>
              <span className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-wide text-slate-700">Cronologia note</span>
                <span className="block truncate text-[11px] text-slate-500">
                  {(segnalazione.note || []).length === 0
                    ? 'Nessuna nota presente'
                    : mostraCronologia
                      ? `${(segnalazione.note || []).length} aggiornamenti registrati`
                      : `Ultima: ${(segnalazione.note || [])[0]?.testo || 'nota disponibile'}`}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMostraCronologia((prev) => !prev)}
              className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600"
            >
              {mostraCronologia ? 'Nascondi' : 'Mostra'}
            </button>
          </div>

          {mostraCronologia && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 md:max-h-40 md:overflow-y-auto md:csp-scroll">
              {(segnalazione.note || []).length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Nessuna nota presente.
                </p>
              ) : (
                (segnalazione.note || []).map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-700">{n.testo}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">{n.data}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function LavoriPrivatiSuite({
  ruolo,
  userProfile,
  condomini = [],
  lavoriPrivati = [],
  fattureLavoriPrivati = [],
  aziendePartner = [],
  lavoroApertoId = null,
  onClearDeepLink = () => {},
  onCreateLavoro,
  onUpdateLavoro,
  onCreateFattura,
  onUpdateFattura,
  onUploadFile,
  onRefresh,
  subscriptionFlags = getSubscriptionFlags('premium'),
}) {
  const ruoloNorm = String(ruolo || '').toLowerCase().trim();
  const isGestore = ruoloNorm === 'gestore';
  const isCondomino = ruoloNorm === 'condominio' || ruoloNorm === 'condomino';
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [lavoroAperto, setLavoroAperto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [form, setForm] = useState({
    condominio_id: userProfile?.condominiIds?.[0] || '',
    titolo: '',
    descrizione: '',
    categoria: 'Manutenzione privata',
    priorita: 'Normale',
    telefono: userProfile?.telefono || '',
    file: null,
  });

  const flussoLspSteps = [
    { label: 'Nuova richiesta', text: 'Richiesta ricevuta', aliases: ['nuovo'] },
    { label: 'Preventivo caricato', text: 'Valutazione disponibile' },
    { label: 'Preventivo accettato', text: 'Conferma cliente', aliases: ['accettato'] },
    { label: 'Intervento pianificato', text: 'Data fissata', aliases: ['pianificato'] },
    { label: 'Intervento chiuso', text: 'Lavoro completato', aliases: ['chiuso', 'chiusa'] },
    { label: 'Preventivo rifiutato', text: 'Pratica conclusa', aliases: ['rifiutato'] },
  ];

  useEffect(() => {
    if (!lavoroApertoId || !lavoriPrivati.length) return;
    const trovato = lavoriPrivati.find((item) => Number(item.id) === Number(lavoroApertoId));
    if (trovato) {
      setLavoroAperto(trovato);
      onClearDeepLink();
    }
  }, [lavoroApertoId, lavoriPrivati, onClearDeepLink]);

  const lavoriVisibili = useMemo(() => {
    const email = String(userProfile?.email || '').toLowerCase();
    if (isGestore) return lavoriPrivati;
    return lavoriPrivati.filter((item) => String(item.condomino_email || '').toLowerCase() === email);
  }, [isGestore, lavoriPrivati, userProfile]);

  const getCondominioInfo = (id) => condomini.find((c) => Number(c.id) === Number(id));
  const getCondominioNome = (id) => getCondominioInfo(id)?.nome || 'Condominio non indicato';
  const fatturaDelLavoro = (id) => fattureLavoriPrivati.find((f) => Number(f.lavoro_privato_id) === Number(id));
  const updateDraft = (id, patch) => setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  const imponibileDaLordo22 = (valoreLordo) => Math.round((Number(valoreLordo || 0) / 1.22) * 100) / 100;
  const isFatturaPagata = (fattura) => String(fattura?.stato || '').toLowerCase().includes('pagat');
  const giorniAllaScadenza = (dataScadenza) => {
    if (!dataScadenza) return null;
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    const scadenza = new Date(dataScadenza);
    scadenza.setHours(0, 0, 0, 0);
    if (Number.isNaN(scadenza.getTime())) return null;
    return Math.ceil((scadenza.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
  };
  const lavoroDaFattura = (fattura) => lavoriPrivati.find((item) => Number(item.id) === Number(fattura?.lavoro_privato_id));
  const fattureVisibili = useMemo(() => {
    const email = String(userProfile?.email || '').toLowerCase();
    if (isGestore) return fattureLavoriPrivati || [];
    return (fattureLavoriPrivati || []).filter((fattura) => String(fattura.condomino_email || '').toLowerCase() === email);
  }, [fattureLavoriPrivati, isGestore, userProfile]);
  const fattureAperte = useMemo(() => fattureVisibili.filter((fattura) => !isFatturaPagata(fattura)), [fattureVisibili]);
  const fattureInScadenza = useMemo(() => fattureAperte.filter((fattura) => {
    const giorni = giorniAllaScadenza(fattura.data_scadenza);
    return giorni !== null && giorni >= 0 && giorni <= 15;
  }).sort((a, b) => new Date(a.data_scadenza || 0) - new Date(b.data_scadenza || 0)), [fattureAperte]);
  const fattureScadute = useMemo(() => fattureAperte.filter((fattura) => {
    const giorni = giorniAllaScadenza(fattura.data_scadenza);
    return giorni !== null && giorni < 0;
  }).sort((a, b) => new Date(a.data_scadenza || 0) - new Date(b.data_scadenza || 0)), [fattureAperte]);
  const totaleFattureAperte = fattureAperte.reduce((sum, fattura) => sum + Number(fattura.importo || 0), 0);
  const totaleFattureInScadenza = fattureInScadenza.reduce((sum, fattura) => sum + Number(fattura.importo || 0), 0);
  const totaleFattureScadute = fattureScadute.reduce((sum, fattura) => sum + Number(fattura.importo || 0), 0);
  const renderMiniFattura = (fattura, tone = 'amber') => {
    const lavoro = lavoroDaFattura(fattura);
    const giorni = giorniAllaScadenza(fattura.data_scadenza);
    const toneClass = tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';
    return (
      <div key={fattura.id} className={`rounded-2xl border p-3 ${toneClass}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] opacity-70">Fattura #{fattura.numero_fattura || fattura.id}</p>
            <p className="mt-1 text-sm font-black">{lavoro?.titolo || 'Lavoro privato'}</p>
            <p className="mt-1 text-xs font-bold opacity-80">{fattura.fornitore || 'Fornitore non indicato'} • scadenza {fattura.data_scadenza || 'n.d.'}</p>
            {isGestore && <p className="mt-1 text-xs font-semibold opacity-70">{fattura.condomino_email}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-black">{formatEuro(fattura.importo || 0)}</p>
            <p className="text-[11px] font-black">{giorni === null ? 'scadenza n.d.' : giorni < 0 ? `${Math.abs(giorni)} gg scaduta` : `${giorni} gg`}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {fattura.file_url && <a href={fattura.file_url} target="_blank" rel="noreferrer" className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-black shadow-sm">Apri fattura</a>}
          {isGestore && lavoro && <button type="button" onClick={() => setLavoroAperto(lavoro)} className="rounded-xl bg-white/80 px-3 py-1.5 text-xs font-black shadow-sm">Apri lavoro</button>}
        </div>
      </div>
    );
  };

  const creaRichiesta = async (e) => {
    e.preventDefault();
    if (!form.titolo || !form.descrizione) {
      alert('Inserisci almeno titolo e descrizione del lavoro.');
      return;
    }
    setSaving(true);
    try {
      await onCreateLavoro({
        condominio_id: form.condominio_id ? Number(form.condominio_id) : null,
        condomino_email: userProfile?.email || '',
        condomino_nome: userProfile?.nome || '',
        condomino_telefono: form.telefono || userProfile?.telefono || '',
        titolo: form.titolo,
        descrizione: form.descrizione,
        categoria: form.categoria,
        priorita: form.priorita,
        stato: 'Nuova richiesta',
      }, form.file);
      setForm({ condominio_id: userProfile?.condominiIds?.[0] || '', titolo: '', descrizione: '', categoria: 'Manutenzione privata', priorita: 'Normale', telefono: userProfile?.telefono || '', file: null });
      setShowForm(false);
      setSuccessMessage('Richiesta inviata correttamente. Ti terremo aggiornato direttamente da questo spazio.');
      window.setTimeout(() => setSuccessMessage(''), 4500);
    } finally {
      setSaving(false);
    }
  };

  const caricaPreventivo = async (lavoro) => {
    const draft = drafts[lavoro.id] || {};
    if (!draft.preventivoFile && !draft.importo_preventivo) {
      alert('Inserisci almeno il PDF del preventivo o l’importo.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        stato: 'Preventivo caricato',
        importo_preventivo: draft.importo_preventivo ? Number(String(draft.importo_preventivo).replace(',', '.')) : lavoro.importo_preventivo,
        data_preventivo: new Date().toISOString(),
      };
      if (draft.preventivoFile) {
        const uploaded = await onUploadFile(draft.preventivoFile, `lavori-privati/preventivi/${lavoro.id}`);
        payload.preventivo_url = uploaded.url;
        payload.preventivo_nome = uploaded.name;
      }
      await onUpdateLavoro(lavoro.id, payload, 'preventivo_caricato');
      updateDraft(lavoro.id, { preventivoFile: null, importo_preventivo: '' });
    } finally {
      setSaving(false);
    }
  };

  const aggiornaEsito = async (lavoro, esito) => {
    setSaving(true);
    try {
      await onUpdateLavoro(lavoro.id, {
        esito_preventivo: esito,
        data_esito_preventivo: new Date().toISOString(),
        stato: esito === 'accettato' ? 'Preventivo accettato' : 'Preventivo rifiutato',
      }, esito === 'accettato' ? 'preventivo_accettato' : 'preventivo_rifiutato');
    } finally {
      setSaving(false);
    }
  };

  const pianifica = async (lavoro) => {
    const draft = drafts[lavoro.id] || {};
    if (!draft.data_pianificazione) {
      alert('Inserisci la data pianificazione.');
      return;
    }
    setSaving(true);
    try {
      await onUpdateLavoro(lavoro.id, {
        stato: 'Intervento pianificato',
        data_pianificazione: draft.data_pianificazione,
        ora_pianificazione: draft.ora_pianificazione || null,
        note_pianificazione: draft.note_pianificazione || '',
      }, 'intervento_pianificato');
    } finally {
      setSaving(false);
    }
  };

  const chiudi = async (lavoro) => {
    const draft = drafts[lavoro.id] || {};
    setSaving(true);
    try {
      await onUpdateLavoro(lavoro.id, {
        stato: 'Intervento chiuso',
        data_chiusura: new Date().toISOString(),
        note_chiusura: draft.note_chiusura || '',
      }, 'intervento_chiuso');
    } finally {
      setSaving(false);
    }
  };

  const salvaFattura = async (lavoro) => {
    const draft = drafts[lavoro.id] || {};
    if (!draft.numero_fattura || !draft.importo || !draft.data_scadenza) {
      alert('Inserisci numero fattura, importo e scadenza.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        lavoro_privato_id: lavoro.id,
        condomino_email: lavoro.condomino_email,
        numero_fattura: draft.numero_fattura,
        azienda_partner_id: draft.azienda_partner_id ? Number(draft.azienda_partner_id) : null,
        fornitore: draft.azienda_partner_id ? ((aziendePartner || []).find((azienda) => Number(azienda.id) === Number(draft.azienda_partner_id))?.ragione_sociale || '') : '',
        importo: Number(String(draft.importo).replace(',', '.')),
        importo_imponibile: Math.round((Number(String(draft.importo).replace(',', '.')) / 1.22) * 100) / 100,
        data_fattura: draft.data_fattura || new Date().toISOString().slice(0, 10),
        data_scadenza: draft.data_scadenza,
        stato: draft.stato_fattura || 'Da pagare',
        note: draft.note_fattura || '',
      };
      if (draft.fatturaFile) {
        const uploaded = await onUploadFile(draft.fatturaFile, `lavori-privati/fatture/${lavoro.id}`);
        payload.file_url = uploaded.url;
        payload.file_nome = uploaded.name;
      }
      await onCreateFattura(payload, lavoro);
      updateDraft(lavoro.id, { numero_fattura: '', importo: '', data_scadenza: '', fatturaFile: null });
    } finally {
      setSaving(false);
    }
  };

  const aggiornaFattura = async (fattura, patch, lavoro) => {
    setSaving(true);
    try {
      await onUpdateFattura(fattura.id, patch, lavoro);
    } finally {
      setSaving(false);
    }
  };

  const renderCard = (lavoro) => {
    const fattura = fatturaDelLavoro(lavoro.id);
    return (
      <article
        key={lavoro.id}
        role="button"
        tabIndex={0}
        onClick={() => setLavoroAperto(lavoro)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setLavoroAperto(lavoro);
          }
        }}
        className={`cursor-pointer rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md ${MOTION_CARD}`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Lavoro privato #{lavoro.id}</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{lavoro.titolo}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">{getCondominioNome(lavoro.condominio_id)} • {lavoro.categoria || 'Lavoro privato'}</p>
            {isGestore && <p className="mt-1 text-xs font-semibold text-slate-400">{lavoro.condomino_nome || lavoro.condomino_email} • {lavoro.condomino_telefono || 'telefono non indicato'}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{lavoro.stato}</span>
            {lavoro.importo_preventivo ? <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">{formatEuro(lavoro.importo_preventivo)} compreso IVA 22%</span> : null}
            {fattura ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Fattura: {fattura.stato}</span> : null}
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white shadow-md shadow-emerald-900/20 transition group-hover:scale-105">›</span>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{lavoro.descrizione}</p>
      </article>
    );
  };

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Lavori Privati Senza Pensieri</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Contatto diretto con l’impresa</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Uno spazio dedicato ai lavori e alla cura della tua casa. Richieste, preventivi, documenti e aggiornamenti sempre disponibili in modo semplice e ordinato.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50">Aggiorna</button>
            {isCondomino && <button onClick={() => setShowForm(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-emerald-700">Richiedi un preventivo</button>}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800 shadow-sm">
          {successMessage}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Fatture aperte</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{fattureAperte.length}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{formatEuro(totaleFattureAperte)} da monitorare</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">In scadenza</p>
          <p className="mt-2 text-2xl font-black text-amber-900">{fattureInScadenza.length}</p>
          <p className="mt-1 text-sm font-bold text-amber-800">Entro 15 giorni • {formatEuro(totaleFattureInScadenza)}</p>
        </div>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">Scadute</p>
          <p className="mt-2 text-2xl font-black text-red-900">{fattureScadute.length}</p>
          <p className="mt-1 text-sm font-bold text-red-800">Da sollecitare • {formatEuro(totaleFattureScadute)}</p>
        </div>
      </div>

      {(fattureInScadenza.length > 0 || fattureScadute.length > 0 || fattureVisibili.length > 0) && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Control room fatture private</p>
              <h3 className="mt-1 text-xl font-black text-slate-900">Scadenze e fatture lavori privati</h3>
            </div>
            <p className="text-sm font-bold text-slate-500">State sereni, vi ricordiamo noi le scadenze.</p>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-black text-amber-800">Fatture in scadenza entro 15 giorni</h4>
              <div className="space-y-2">
                {fattureInScadenza.length ? fattureInScadenza.map((fattura) => renderMiniFattura(fattura, 'amber')) : <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Nessuna fattura in scadenza nei prossimi 15 giorni.</p>}
              </div>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-black text-red-800">Fatture scadute</h4>
              <div className="space-y-2">
                {fattureScadute.length ? fattureScadute.map((fattura) => renderMiniFattura(fattura, 'red')) : <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Nessuna fattura scaduta.</p>}
              </div>
            </div>
          </div>
          <details className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-black text-slate-700">Mostra elenco completo fatture private ({fattureVisibili.length})</summary>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {fattureVisibili.length ? fattureVisibili.map((fattura) => renderMiniFattura(fattura, giorniAllaScadenza(fattura.data_scadenza) < 0 ? 'red' : 'amber')) : <p className="text-sm font-semibold text-slate-500">Nessuna fattura privata presente.</p>}
            </div>
          </details>
        </div>
      )}

      {showForm && isCondomino && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-3">
          <form onSubmit={creaRichiesta} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/60 bg-white p-5 shadow-2xl csp-scroll">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">La tua casa Senza Pensieri</p>
                <h3 className="mt-1 text-xl font-black text-slate-900">Richiedi un preventivo</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Compila la richiesta: il form si chiude dopo l’invio e riceverai gli aggiornamenti in app.</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">Chiudi</button>
            </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Condominio
              <select value={form.condominio_id} onChange={(e) => setForm({ ...form, condominio_id: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700">Telefono
              <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Recapito per sopralluogo" />
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">Titolo richiesta
              <input value={form.titolo} onChange={(e) => setForm({ ...form, titolo: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Es. Ripristino bagno, infiltrazione, imbiancatura..." />
            </label>
            <label className="text-sm font-bold text-slate-700">Categoria
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
            <label className="text-sm font-bold text-slate-700">Priorità
              <select value={form.priorita} onChange={(e) => setForm({ ...form, priorita: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
                <option>Normale</option><option>Alta</option><option>Bassa</option>
              </select>
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">Descrizione
              <textarea value={form.descrizione} onChange={(e) => setForm({ ...form, descrizione: e.target.value })} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" placeholder="Descrivi il lavoro e allega eventuali foto." />
            </label>
            <label className="text-sm font-bold text-slate-700 md:col-span-2">Foto / allegato
              <input type="file" onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">Annulla</button>
            <button disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white disabled:opacity-60">{saving ? 'Invio...' : 'Invia richiesta'}</button>
          </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {lavoriVisibili.length === 0 ? (
          <EmptyState icon="🏠" title="Nessun lavoro privato" text={isCondomino ? 'Richiedi un preventivo per i lavori e la cura della tua casa.' : 'Le nuove richieste private dei condòmini compariranno qui.'} action="Canale pronto" tone="emerald" />
        ) : (
          groupItemsByWorkflowStatus(lavoriVisibili, flussoLspSteps).map((group) => (
            <WorkflowStatusGroup key={group.step.label} step={group.step} count={group.items.length} tone="emerald">
              {group.items.map(renderCard)}
            </WorkflowStatusGroup>
          ))
        )}
      </div>

      {lavoroAperto && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 p-3">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/60 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 p-4 backdrop-blur-xl">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Lavoro privato #{lavoroAperto.id}</p>
                <h3 className="text-xl font-black text-slate-900">{lavoroAperto.titolo}</h3>
                <p className="text-sm font-semibold text-slate-500">{getCondominioNome(lavoroAperto.condominio_id)} • {lavoroAperto.stato}</p>
                <GoogleMapsButton parts={[getCondominioInfo(lavoroAperto.condominio_id)?.indirizzo, getCondominioInfo(lavoroAperto.condominio_id)?.citta, getCondominioNome(lavoroAperto.condominio_id)]} className="mt-3" />
              </div>
              <button onClick={() => setLavoroAperto(null)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">Chiudi</button>
            </div>
            <div className="px-4 pt-4">
              <FlussoOperativoPratica
                titolo="Avanzamento LSP"
                stato={lavoroAperto.stato || 'Nuova richiesta'}
                steps={flussoLspSteps}
              />
            </div>
            <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-black text-slate-900">Richiesta</h4>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{lavoroAperto.descrizione}</p>
                  {lavoroAperto.allegato_url && <a href={lavoroAperto.allegato_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white">Apri allegato</a>}
                </div>
                {lavoroAperto.preventivo_url && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <h4 className="font-black text-emerald-900">Preventivo disponibile</h4>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{formatEuro(lavoroAperto.importo_preventivo)} <span className="text-xs font-black uppercase tracking-wide text-emerald-600">compreso IVA 22%</span></p>
                    <a href={lavoroAperto.preventivo_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white">Apri preventivo</a>
                    {isCondomino && !lavoroAperto.esito_preventivo && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => aggiornaEsito(lavoroAperto, 'accettato')} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Accetta</button>
                        <button onClick={() => aggiornaEsito(lavoroAperto, 'rifiutato')} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white">Rifiuta</button>
                      </div>
                    )}
                  </div>
                )}
                {lavoroAperto.data_pianificazione && (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                    <h4 className="font-black text-sky-900">Intervento pianificato</h4>
                    <p className="mt-1 text-sm font-bold text-sky-800">
                      Data: {lavoroAperto.data_pianificazione || 'n.d.'}{lavoroAperto.ora_pianificazione ? ` • Ore ${String(lavoroAperto.ora_pianificazione).slice(0, 5)}` : ''}
                    </p>
                    {lavoroAperto.note_pianificazione && <p className="mt-2 whitespace-pre-wrap text-sm text-sky-800">{lavoroAperto.note_pianificazione}</p>}
                  </div>
                )}
                {fatturaDelLavoro(lavoroAperto.id) && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="font-black text-amber-900">Fattura</h4>
                    <p className="mt-1 text-sm font-bold text-amber-800">Stato: {fatturaDelLavoro(lavoroAperto.id)?.stato} • Scadenza: {fatturaDelLavoro(lavoroAperto.id)?.data_scadenza || 'n.d.'}</p>
                    {fatturaDelLavoro(lavoroAperto.id)?.file_url && <a href={fatturaDelLavoro(lavoroAperto.id).file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white">Apri fattura</a>}
                  </div>
                )}
              </div>

              {isGestore && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-black text-slate-900">Carica preventivo</h4>
                    <div className="mt-3 grid gap-2">
                      <input type="number" step="0.01" placeholder="Importo preventivo compreso IVA 22%" value={drafts[lavoroAperto.id]?.importo_preventivo || ''} onChange={(e) => updateDraft(lavoroAperto.id, { importo_preventivo: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <p className="text-xs font-bold text-slate-500">Importo da mostrare al condòmino: totale compreso IVA 22%. La provvigione interna verrà calcolata sull’imponibile.</p>
                      <input type="file" onChange={(e) => updateDraft(lavoroAperto.id, { preventivoFile: e.target.files?.[0] || null })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <button onClick={() => caricaPreventivo(lavoroAperto)} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Invia preventivo</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-black text-slate-900">Pianificazione</h4>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <input type="date" value={drafts[lavoroAperto.id]?.data_pianificazione || ''} onChange={(e) => updateDraft(lavoroAperto.id, { data_pianificazione: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <input type="time" value={drafts[lavoroAperto.id]?.ora_pianificazione || ''} onChange={(e) => updateDraft(lavoroAperto.id, { ora_pianificazione: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <textarea placeholder="Note pianificazione" value={drafts[lavoroAperto.id]?.note_pianificazione || ''} onChange={(e) => updateDraft(lavoroAperto.id, { note_pianificazione: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 md:col-span-2" />
                      <button onClick={() => pianifica(lavoroAperto)} disabled={saving} className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-black text-white md:col-span-2">Pianifica intervento</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="font-black text-slate-900">Chiusura e fattura</h4>
                    <div className="mt-3 grid gap-2">
                      <textarea placeholder="Note chiusura" value={drafts[lavoroAperto.id]?.note_chiusura || ''} onChange={(e) => updateDraft(lavoroAperto.id, { note_chiusura: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <button onClick={() => chiudi(lavoroAperto)} disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white">Chiudi intervento</button>
                      <input placeholder="Numero fattura" value={drafts[lavoroAperto.id]?.numero_fattura || ''} onChange={(e) => updateDraft(lavoroAperto.id, { numero_fattura: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <select value={drafts[lavoroAperto.id]?.azienda_partner_id || ''} onChange={(e) => updateDraft(lavoroAperto.id, { azienda_partner_id: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2">
                        <option value="">Seleziona fornitore</option>
                        {(aziendePartner || []).map((azienda) => <option key={azienda.id} value={azienda.id}>{azienda.ragione_sociale}</option>)}
                      </select>
                      <input type="number" step="0.01" placeholder="Importo fattura compreso IVA 22%" value={drafts[lavoroAperto.id]?.importo || ''} onChange={(e) => updateDraft(lavoroAperto.id, { importo: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <input type="date" value={drafts[lavoroAperto.id]?.data_scadenza || ''} onChange={(e) => updateDraft(lavoroAperto.id, { data_scadenza: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <input type="file" onChange={(e) => updateDraft(lavoroAperto.id, { fatturaFile: e.target.files?.[0] || null })} className="rounded-xl border border-slate-200 px-3 py-2" />
                      <button onClick={() => salvaFattura(lavoroAperto)} disabled={saving} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-black text-white">Salva fattura</button>
                      {fatturaDelLavoro(lavoroAperto.id) && <button onClick={() => aggiornaFattura(fatturaDelLavoro(lavoroAperto.id), { stato: 'Pagata', data_pagamento: new Date().toISOString().slice(0, 10) }, lavoroAperto)} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white">Segna fattura pagata</button>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



function AppHardUpdateBanner({ updateInfo, onUpdate, onDismiss }) {
  if (!updateInfo) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[230] mx-auto max-w-4xl rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur md:bottom-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Nuova versione disponibile</p>
          <p className="text-xs font-semibold text-slate-500">
            È disponibile una versione aggiornata di CSP. Premi “Aggiorna ora” per caricare l’ultima release.
          </p>
          {updateInfo?.serverVersion && (
            <p className="mt-1 text-[11px] font-bold text-emerald-700">
              Versione disponibile: {updateInfo.serverVersion}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600"
          >
            Dopo
          </button>
          <button
            type="button"
            onClick={onUpdate}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-900/20"
          >
            Aggiorna ora
          </button>
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const generaPdfVotazioni = (pratica, ruoloExport = ruoloNormalizzato) => {
    if (!pratica) return;

    const ruoloPdf = String(ruoloExport || '').toLowerCase().trim();
    const isAmministratore = ruoloPdf === 'amministratore';

    const votiPratica = (votiPreventivi || []).filter((v) => Number(v.segnalazione_id) === Number(pratica.id));
    const riepilogoAggregato = (votazioniRiepiloghi || []).find((item) => Number(item.segnalazione_id) === Number(pratica.id));

    const favorevoli = Number(riepilogoAggregato?.favorevoli ?? votiPratica.filter((v) => v.voto === 'favorevole').length);
    const contrari = Number(riepilogoAggregato?.contrari ?? votiPratica.filter((v) => v.voto === 'contrario').length);
    const indecisi = Number(riepilogoAggregato?.indecisi ?? votiPratica.filter((v) => v.voto === 'indeciso').length);
    const totale = Number(riepilogoAggregato?.totale_voti ?? votiPratica.length);
    const totaleAventiDiritto = Number(riepilogoAggregato?.totale_aventi_diritto ?? totale);
    const mancanti = Math.max(Number(riepilogoAggregato?.voti_mancanti ?? Math.max(totaleAventiDiritto - totale, 0)), 0);
    const partecipazione = Number(riepilogoAggregato?.partecipazione_percentuale ?? (totaleAventiDiritto ? Math.round((totale / totaleAventiDiritto) * 100) : 0));
    const quorum = Number(riepilogoAggregato?.consenso_percentuale ?? (totale ? Math.round((favorevoli / totale) * 100) : 0));
    const completata = Boolean(riepilogoAggregato?.completata ?? (totaleAventiDiritto > 0 && totale >= totaleAventiDiritto));

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;

    const dettaglioVoti = votiPratica.length
      ? votiPratica.map((v) => `<tr><td style="padding:8px;border:1px solid #ccc;">${v.email}</td><td style="padding:8px;border:1px solid #ccc;">${v.voto}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:12px;border:1px solid #ccc;">Nessun voto registrato</td></tr>';

    const dettaglioAmministratore = isAmministratore
      ? `
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
        `
      : `
            <div class="privacy-note">
              Report sintetico: per tutela della privacy non sono visibili nominativi, email e voti individuali.
            </div>
        `;

    reportWindow.document.write(`
      <html>
        <head>
          <title>Report votazioni - ${pratica.titolo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 30px; background:#f8fafc; color:#0f172a; }
            .page { max-width: 900px; margin:auto; background:white; padding:35px; border-radius:20px; }
            .toolbar { display:flex; justify-content:flex-end; gap:10px; margin-bottom:20px; }
            .btn { background:#047857; color:white; border:none; padding:10px 16px; border-radius:10px; font-weight:bold; cursor:pointer; }
            .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin:20px 0; }
            .card { border:1px solid #d1fae5; background:#ecfdf5; border-radius:14px; padding:14px; text-align:center; }
            .card small { display:block; color:#64748b; font-weight:bold; text-transform:uppercase; font-size:10px; letter-spacing:.06em; }
            .card strong { display:block; margin-top:6px; font-size:24px; color:#047857; }
            .privacy-note { margin-top:24px; padding:14px; border-radius:14px; background:#f1f5f9; color:#475569; font-size:13px; font-weight:600; }
            table { width:100%; border-collapse:collapse; margin-top:20px; }
            th, td { text-align:left; }
            th { background:#ecfdf5; }
            .status { display:inline-block; margin-top:6px; padding:7px 12px; border-radius:999px; background:${completata ? '#dcfce7' : '#fef3c7'}; color:${completata ? '#047857' : '#92400e'}; font-weight:bold; font-size:12px; }
            @media print { .toolbar { display:none; } body { background:white; padding:0; } .page { box-shadow:none; } }
            @media (max-width: 700px) { .grid { grid-template-columns:repeat(2,1fr); } body { padding:12px; } .page { padding:22px; } }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button class="btn" onclick="window.print()">Scarica PDF / Stampa</button>
          </div>
          <div class="page">
            <h1>Condominio Senza Pensieri</h1>
            <h2>${isAmministratore ? 'Report votazioni condomini' : 'Esito votazione'}</h2>
            <p><strong>Condominio:</strong> ${pratica.condominio}</p>
            <p><strong>Pratica:</strong> ${pratica.titolo}</p>
            <p><strong>Importo preventivo:</strong> ${formatEuro(pratica.importo_preventivo || 0)}</p>
            <p><strong>Stato votazione:</strong> <span class="status">${completata ? 'Completata' : 'In corso'}</span></p>
            <hr/>
            <h3>Riepilogo finale</h3>
            <div class="grid">
              <div class="card"><small>Favorevoli</small><strong>${favorevoli}</strong></div>
              <div class="card"><small>Contrari</small><strong>${contrari}</strong></div>
              <div class="card"><small>Indecisi</small><strong>${indecisi}</strong></div>
              <div class="card"><small>Consenso</small><strong>${quorum}%</strong></div>
              <div class="card"><small>Voti ricevuti</small><strong>${totale}</strong></div>
              <div class="card"><small>Aventi diritto</small><strong>${totaleAventiDiritto}</strong></div>
              <div class="card"><small>Mancanti</small><strong>${mancanti}</strong></div>
              <div class="card"><small>Partecipazione</small><strong>${partecipazione}%</strong></div>
            </div>
            ${dettaglioAmministratore}
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
  const [ruolo, setRuolo] = useState('');
  const [condomini, setCondomini] = useState([]);
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastInterno, setToastInterno] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dettaglioAperto, setDettaglioAperto] = useState(null);
  const [selectedCondominioId, setSelectedCondominioId] = useState('');
  const [filtroCondominioId, setFiltroCondominioId] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNuovaSegnalazione, setShowNuovaSegnalazione] = useState(false);
  const [showFabLabel, setShowFabLabel] = useState(false);
  const [votiPreventivi, setVotiPreventivi] = useState([]);
  const [votazioniRiepiloghi, setVotazioniRiepiloghi] = useState([]);
  const [showArchiviate, setShowArchiviate] = useState(false);
  const [gestoreSection, setGestoreSection] = useState('pratiche');
  const [amministratoreSection, setAmministratoreSection] = useState('pratiche');
  const [condominoSection, setCondominoSection] = useState('segnalazioni');
  const [menuLateraleAperto, setMenuLateraleAperto] = useState(false);
  const [menuLateraleInChiusura, setMenuLateraleInChiusura] = useState(false);
  const [contratti, setContratti] = useState([]);
  const [leadAmministratori, setLeadAmministratori] = useState([]);
  const [leadTecnici, setLeadTecnici] = useState([]);
  const [aziendePartner, setAziendePartner] = useState([]);
  const [provvigioniPartner, setProvvigioniPartner] = useState([]);
  const [fatturePartner, setFatturePartner] = useState([]);
  const [lavoriPrivati, setLavoriPrivati] = useState([]);
  const [fattureLavoriPrivati, setFattureLavoriPrivati] = useState([]);
  const [lavoroPrivatoApertoId, setLavoroPrivatoApertoId] = useState(null);
  const [provvigioniMaturate, setProvvigioniMaturate] = useState([]);
  const [fattureProvvigioniGestore, setFattureProvvigioniGestore] = useState([]);
  const [fattureProvvigioniAmministratori, setFattureProvvigioniAmministratori] = useState([]);
  const [capitolatiSenzaPensieri, setCapitolatiSenzaPensieri] = useState([]);
  const [capitolatiEventi, setCapitolatiEventi] = useState([]);
  const [votiAssembleaCasep, setVotiAssembleaCasep] = useState([]);
  const [partnerOnboardingCaSP, setPartnerOnboardingCaSP] = useState([]);
  const [partnerCampaignLog, setPartnerCampaignLog] = useState([]);
  const [utentiCondomini, setUtentiCondomini] = useState([]);
  const [utentiSistema, setUtentiSistema] = useState([]);
  const [showReportSemestrale, setShowReportSemestrale] = useState(false);
  const [sendingReportSemestrale, setSendingReportSemestrale] = useState(false);


  const [reportCondominio, setReportCondominio] = useState([]);
  const [rivisteCondominio, setRivisteCondominio] = useState([]);
  const [showRivistaModal, setShowRivistaModal] = useState(false);
  const [sendingRivista, setSendingRivista] = useState(false);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const isCollaboratore = ruoloNormalizzato === 'collaboratore';
  const isAmministratoreOperativo = ruoloNormalizzato === 'amministratore' || isCollaboratore;
  const puoVedereGuadagniAmministratore = ruoloNormalizzato === 'amministratore';
  const puoVedereFattureOperative = isAmministratoreOperativo;
  const puoCreareSegnalazioni = isAmministratoreOperativo || ['condominio', 'condomino'].includes(ruoloNormalizzato);
  const historySyncRef = useRef({ ready: false, applyingPop: false, didPrimeBackStack: false });
  const lastCspHistoryRouteRef = useRef(null);

  const getCspHistoryRoute = () => {
    if (ruoloNormalizzato === 'gestore') return { role: 'gestore', section: gestoreSection || 'pratiche' };
    if (isAmministratoreOperativo) return { role: 'amministratore', section: amministratoreSection || 'pratiche' };
    if (['condominio', 'condomino'].includes(ruoloNormalizzato)) return { role: 'condomino', section: condominoSection || 'segnalazioni' };
    return { role: ruoloNormalizzato || 'utente', section: 'home' };
  };

  const buildCspSectionUrl = (route = getCspHistoryRoute()) => {
    try {
      const url = new URL(window.location.href);
      if (route?.section) url.searchParams.set('section', route.section);
      if (route?.role) url.searchParams.set('role', route.role);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      return window.location.pathname || '/';
    }
  };

  const aggiungiCspHistoryKey = (urlString) => {
    try {
      const url = new URL(urlString || window.location.href, window.location.origin);
      url.searchParams.set('cspnav', `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      return urlString || window.location.pathname || '/';
    }
  };

  const applicaCspHistoryRoute = (route) => {
    if (!route?.section) return;
    lastCspHistoryRouteRef.current = route;
    historySyncRef.current.applyingPop = true;
    if (route.role === 'gestore' || ruoloNormalizzato === 'gestore') setGestoreSection(route.section);
    else if (route.role === 'amministratore' || isAmministratoreOperativo) setAmministratoreSection(route.section);
    else if (route.role === 'condomino' || ['condominio', 'condomino'].includes(ruoloNormalizzato)) setCondominoSection(route.section);
    setDettaglioAperto(null);
    setShowNuovaSegnalazione(false);
    setShowReportSemestrale(false);
    setShowRivistaModal(false);
    setLavoroPrivatoApertoId(null);
    chiudiMenuLaterale();
    window.setTimeout(() => {
      historySyncRef.current.applyingPop = false;
    }, 0);
  };

  const registraNavigazioneCsp = (route) => {
    if (typeof window === 'undefined' || !window.history || historySyncRef.current.applyingPop) return;
    const nextRoute = route || getCspHistoryRoute();
    const currentRoute = window.history.state?.cspRoute || lastCspHistoryRouteRef.current;
    if (currentRoute?.role === nextRoute.role && currentRoute?.section === nextRoute.section) return;
    window.history.pushState({ ...(window.history.state || {}), cspRoute: nextRoute }, '', aggiungiCspHistoryKey(buildCspSectionUrl(nextRoute)));
    lastCspHistoryRouteRef.current = nextRoute;
  };

  // Elenco amministratori censiti per Gestione Anagrafiche.
  // La selezione operativa avviene per nome studio/ragione sociale; l'email resta il riferimento tecnico nascosto.
  const amministratoriAnagrafiche = useMemo(() => {
    const daUtenti = (utentiSistema || [])
      .filter((u) => String(u.ruolo || '').toLowerCase().trim() === 'amministratore')
      .map((u) => ({
        email: u.email,
        nome: u.nome || '',
        studio: u.studio || u.ragione_sociale || u.nome_studio || '',
      }));

    const daCondomini = (condomini || [])
      .filter((c) => c.amministratore_email)
      .map((c) => ({
        email: c.amministratore_email,
        nome: c.amministratore_nome || c.nome_amministratore || c.amministratore || '',
        studio: c.amministratore_studio || c.studio_amministratore || '',
      }));

    const mappa = new Map();
    [...daUtenti, ...daCondomini].forEach((admin) => {
      const email = String(admin.email || '').toLowerCase().trim();
      if (!email) return;
      const precedente = mappa.get(email) || {};
      mappa.set(email, {
        ...precedente,
        ...admin,
        email,
        nome: admin.nome || precedente.nome || '',
        studio: admin.studio || precedente.studio || '',
      });
    });

    return [...mappa.values()].sort((a, b) => {
      const labelA = a.studio || a.nome || a.email || '';
      const labelB = b.studio || b.nome || b.email || '';
      return String(labelA).localeCompare(String(labelB));
    });
  }, [utentiSistema, condomini]);


  useEffect(() => {
    const ids = (userProfile?.condominiIds || []).map((id) => String(id));
    if (ids.length === 1 && !selectedCondominioId) setSelectedCondominioId(ids[0]);
    if (filtroCondominioId && !ids.includes(String(filtroCondominioId)) && ruoloNormalizzato !== 'gestore') {
      setFiltroCondominioId('');
    }
  }, [userProfile, selectedCondominioId, filtroCondominioId, ruoloNormalizzato]);

  useEffect(() => {
    if (!utente || showSplash || !ruoloNormalizzato || typeof window === 'undefined' || !window.history) return;

    const routeFromUrl = (() => {
      try {
        const params = new URLSearchParams(window.location.search);
        const section = params.get('section');
        if (!section) return null;
        if (ruoloNormalizzato === 'gestore') return { role: 'gestore', section };
        if (isAmministratoreOperativo) return { role: 'amministratore', section };
        if (['condominio', 'condomino'].includes(ruoloNormalizzato)) return { role: 'condomino', section };
        return null;
      } catch (_) {
        return null;
      }
    })();

    const initialRoute = routeFromUrl || getCspHistoryRoute();
    if (!historySyncRef.current.ready) {
      const initialUrl = buildCspSectionUrl(initialRoute);
      window.history.replaceState({ ...(window.history.state || {}), cspRoute: initialRoute, cspInitial: true }, '', initialUrl);
      if (!historySyncRef.current.didPrimeBackStack) {
        window.history.pushState({ ...(window.history.state || {}), cspRoute: initialRoute, cspPrime: true }, '', aggiungiCspHistoryKey(initialUrl));
        historySyncRef.current.didPrimeBackStack = true;
      }
      lastCspHistoryRouteRef.current = initialRoute;
      if (routeFromUrl) applicaCspHistoryRoute(routeFromUrl);
      historySyncRef.current.ready = true;
    }

    const onPopState = (event) => {
      if (menuLateraleAperto || menuLateraleInChiusura) {
        chiudiMenuLaterale();
        return;
      }
      if (showNuovaSegnalazione) {
        setShowNuovaSegnalazione(false);
        return;
      }
      if (showReportSemestrale) {
        setShowReportSemestrale(false);
        return;
      }
      if (showRivistaModal) {
        setShowRivistaModal(false);
        return;
      }
      const route = event.state?.cspRoute;
      if (route?.section) {
        applicaCspHistoryRoute(route);
        return;
      }
      const currentRoute = getCspHistoryRoute();
      window.history.pushState({ ...(window.history.state || {}), cspRoute: currentRoute, cspPrime: true }, '', aggiungiCspHistoryKey(buildCspSectionUrl(currentRoute)));
      lastCspHistoryRouteRef.current = currentRoute;
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [utente, showSplash, ruoloNormalizzato, gestoreSection, amministratoreSection, condominoSection, menuLateraleAperto, menuLateraleInChiusura, showNuovaSegnalazione, showReportSemestrale, showRivistaModal]);


  useEffect(() => {
    if (!utente || showSplash || !ruoloNormalizzato || typeof window === 'undefined' || !window.history) return;
    if (!historySyncRef.current.ready || historySyncRef.current.applyingPop) return;
    const nextRoute = getCspHistoryRoute();
    const lastRoute = lastCspHistoryRouteRef.current || window.history.state?.cspRoute;
    if (lastRoute?.role === nextRoute.role && lastRoute?.section === nextRoute.section) return;
    window.history.pushState({ ...(window.history.state || {}), cspRoute: nextRoute }, '', aggiungiCspHistoryKey(buildCspSectionUrl(nextRoute)));
    lastCspHistoryRouteRef.current = nextRoute;
  }, [utente, showSplash, ruoloNormalizzato, gestoreSection, amministratoreSection, condominoSection]);

  const cambiaCondominioOperativo = (condominioId) => {
    const next = condominioId ? String(condominioId) : '';
    setFiltroCondominioId(next);
    setSelectedCondominioId(next);
  };

  const mostraToast = (title, message = '', tone = 'info') => {
    setToastInterno({ title, message, tone, createdAt: Date.now() });

    window.clearTimeout(window.__cspToastTimer);
    window.__cspToastTimer = window.setTimeout(() => {
      setToastInterno(null);
    }, 4200);
  };

  const inviaNotificaCondominio = async ({
    condominioId = null,
    destinatari = 'tutti',
    title,
    message,
    tipo = 'generica',
    riferimentoId = null,
    url = '',
    deepLink = '',
    iconUrl = '',
    globale = false,
    section = '',
  }) => {
    try {
      if (!condominioId && !globale) return null;

      const body = {
        destinatari,
        title,
        message,
        tipo,
        riferimentoId,
        url: url || deepLink || '',
        deepLink: deepLink || url || '',
        iconUrl,
        icon: iconUrl,
        globale,
        global: globale,
        section,
      };

      if (condominioId) body.condominioId = Number(condominioId);

      const { data, error } = await supabase.functions.invoke('notify-condominio', {
        body,
      });

      if (error) {
        console.warn('Notifica condominio non inviata:', error.message || error);
        return null;
      }

      if (data && data.success === false) {
        console.warn('Notifica condominio non completata:', data);
        return null;
      }

      console.info('Notifica condominio inviata:', data);
      return data;
    } catch (error) {
      console.warn('Errore invio notifica condominio:', error);
      return null;
    }
  };


  const inviaNotificaRivista = async ({
    title,
    message,
    tipo = 'rivista_disponibile',
    riferimentoId = null,
    url = '',
    deepLink = '',
    iconUrl = '',
    section = 'rivista',
    numero = '',
    periodo = '',
    titoloRivista = '',
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-rivista', {
        body: {
          title,
          message,
          tipo,
          riferimentoId,
          url: url || deepLink || '',
          deepLink: deepLink || url || '',
          iconUrl,
          icon: iconUrl,
          section,
          numero,
          periodo,
          titoloRivista,
        },
      });

      if (error) {
        console.warn('Notifica rivista non inviata:', error.message || error);
        return null;
      }

      if (data && data.success === false) {
        console.warn('Notifica rivista non completata:', data);
        return data;
      }

      console.info('Notifica rivista inviata:', data);
      return data;
    } catch (error) {
      console.warn('Errore invio notifica rivista:', error);
      return null;
    }
  };

  const inviaReportSemestrale = async ({ condominioId, periodo, titolo, file }) => {
    if (ruoloNormalizzato !== 'gestore') {
      mostraToast('Permesso negato', 'L’invio del report Premium è riservato al gestore.', 'warning');
      return;
    }

    if (!condominioId || !file) return;

    setSendingReportSemestrale(true);

    try {
      const safeName = file.name.split(' ').join('-');
      const fileName = `report-semestrale-${condominioId}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('allegati')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const reportUrl = buildPublicUrl(fileName);
      let reportId = null;

      try {
        const { data: reportData, error: reportError } = await supabase
          .from('report_condominio')
          .insert({
            condominio_id: condominioId,
            titolo,
            periodo,
            file_nome: fileName,
            file_url: reportUrl,
            creato_da: utente?.email || '',
          })
          .select()
          .single();

        if (reportError) throw reportError;
        reportId = reportData?.id || null;
      } catch (reportError) {
        console.warn('Report caricato ma non salvato in report_condominio:', reportError);
      }

      await inviaNotificaCondominio({
        condominioId,
        destinatari: 'tutti',
        title: 'Report semestrale disponibile',
        message: `È disponibile il report semestrale Premium: ${periodo}. Puoi consultarlo nell’app nella sezione Report condominio oppure dalla mail.`,
        tipo: 'report_semestrale',
        riferimentoId: reportId,
      });

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-report-condominio', {
        body: {
          condominioId,
          titolo,
          periodo,
          reportUrl,
          fileName,
        },
      });

      if (emailError) throw emailError;
      if (emailData && emailData.success === false) throw new Error(emailData.error || 'Invio email non completato.');

      mostraToast('Report inviato', 'Email e notifica push inviate ad amministratore e condòmini.', 'success');
      setStatusMessage('Report semestrale Premium inviato correttamente.');
      setShowReportSemestrale(false);
    } catch (error) {
      console.error(error);
      mostraToast('Errore report', error.message || 'Invio report non riuscito.', 'error');
    } finally {
      setSendingReportSemestrale(false);
    }
  };


  const pubblicaRivistaCondominio = async ({ numero, periodo, titolo, descrizione, file }) => {
    if (ruoloNormalizzato !== 'gestore') {
      mostraToast('Permesso negato', 'La pubblicazione della rivista è riservata al gestore.', 'warning');
      return;
    }

    if (!file || !titolo?.trim()) return;

    setSendingRivista(true);

    try {
      const safeName = file.name.split(' ').join('-');
      const fileName = `rivista-condominio-senza-pensieri-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('allegati')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const fileUrl = buildPublicUrl(fileName);
      let rivistaId = null;

      const { data: rivistaData, error: rivistaError } = await supabase
        .from('riviste_condominio')
        .insert({
          numero: numero?.trim() || '',
          periodo: periodo?.trim() || '',
          titolo: titolo.trim(),
          descrizione: descrizione?.trim() || '',
          file_nome: fileName,
          file_url: fileUrl,
          pubblicato_da: utente?.email || '',
        })
        .select()
        .single();

      if (rivistaError) {
        console.error('Errore salvataggio rivista_condominio:', rivistaError);
        throw new Error(`PDF caricato, ma archivio rivista non salvato: ${rivistaError.message || 'verifica tabella riviste_condominio e policy RLS'}`);
      }

      rivistaId = rivistaData?.id || null;
      setRivisteCondominio((prev) => [rivistaData, ...(prev || []).filter((r) => r.id !== rivistaData?.id)]);

      const rivistaDeepLink = buildAppDeepLink({
        section: 'rivista',
        rivista: rivistaId || 'ultima',
        fromPush: '1',
      });
      const rivistaPushIcon = 'https://tqeiytzscddfgttgbsgx.supabase.co/storage/v1/object/public/brand-assets/push_icon3.png';

      const notifyRivista = await inviaNotificaRivista({
        title: 'Nuova uscita disponibile',
        message: 'Il nuovo numero della rivista Condominio Senza Pensieri è ora disponibile nell’app.\nIdee, approfondimenti e soluzioni per il condominio di oggi.',
        tipo: 'rivista_disponibile',
        riferimentoId: rivistaId,
        url: rivistaDeepLink,
        deepLink: rivistaDeepLink,
        iconUrl: rivistaPushIcon,
        section: 'rivista',
        numero: numero?.trim() || '',
        periodo: periodo?.trim() || '',
        titoloRivista: titolo.trim(),
      });

      if (notifyRivista?.success === false) {
        console.warn('Notifica rivista non completata:', notifyRivista);
        mostraToast('Rivista pubblicata', 'La rivista è online, ma la push non è stata completata. Controlla i log di notify-rivista.', 'warning');
      } else if (notifyRivista?.recipients === 0) {
        console.warn('Rivista pubblicata senza dispositivi push:', notifyRivista);
        mostraToast('Rivista pubblicata', notifyRivista?.message || 'Rivista online, ma nessun dispositivo push registrato.', 'warning');
      } else {
        mostraToast('Rivista pubblicata', `La nuova uscita è disponibile e la push è stata inviata a ${notifyRivista?.recipients || 0} dispositivi.`, 'success');
      }

      setStatusMessage('Rivista Condominio Senza Pensieri pubblicata correttamente.');
      setShowRivistaModal(false);
      await carica();
    } catch (error) {
      console.error(error);
      mostraToast('Errore rivista', error.message || 'Pubblicazione rivista non riuscita.', 'error');
    } finally {
      setSendingRivista(false);
    }
  };

  const condominiVisibili = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return condomini;
    const ids = userProfile?.condominiIds || [];
    return condomini.filter((c) => ids.includes(c.id));
  }, [ruoloNormalizzato, condomini, userProfile]);

  const condominioIdPerAbbonamento = filtroCondominioId || selectedCondominioId || userProfile?.condominiIds?.[0] || '';
  const pianoAbbonamentoCorrente = ruoloNormalizzato === 'gestore'
    ? 'premium'
    : getPianoAbbonamentoCondominio(condominioIdPerAbbonamento, contratti);
  const subscriptionFlagsCorrenti = getSubscriptionFlags(pianoAbbonamentoCorrente);
  const reportAnnualeAttivo = subscriptionFlagsCorrenti.isPlus || subscriptionFlagsCorrenti.isPremium;
  const reportSemestraleAttivo = subscriptionFlagsCorrenti.isPremium;
  const contrattoCorrenteSospeso = ruoloNormalizzato !== 'gestore'
    && isContrattoSospesoCondominio(condominioIdPerAbbonamento, contratti);

  const segnalazioniFiltrate = useMemo(() => {
    if (ruoloNormalizzato === 'gestore') return segnalazioni;
    const ids = userProfile?.condominiIds || [];
    return segnalazioni.filter((s) => ids.includes(s.condominio_id));
  }, [segnalazioni, ruoloNormalizzato, userProfile]);

  const segnalazioniVisualizzate = useMemo(() => {
    const testo = searchTerm.toLowerCase().trim();
    return segnalazioniFiltrate.filter((s) => {
      const isArchiviata = isValoreVero(s.archiviata);
      const passaArchivio = showArchiviate ? isArchiviata : !isArchiviata;
      const passaCondominio = filtroCondominioId ? String(s.condominio_id) === String(filtroCondominioId) : true;
      const passaStato = filtroStato ? String(s.stato || '') === String(filtroStato) : true;
      const passaRicerca = !testo || [s.titolo, s.descrizione, s.condominio, s.categoria, s.luogo, s.referente].filter(Boolean).some((v) => String(v).toLowerCase().includes(testo));
      return passaCondominio && passaStato && passaRicerca && passaArchivio;
    });
  }, [segnalazioniFiltrate, filtroCondominioId, filtroStato, searchTerm, showArchiviate]);

  const reportVisibili = useMemo(() => {
    const ids = ruoloNormalizzato === 'gestore'
      ? condomini.map((c) => Number(c.id))
      : (userProfile?.condominiIds || []).map(Number);

    return (reportCondominio || []).filter((report) => ids.includes(Number(report.condominio_id)));
  }, [reportCondominio, ruoloNormalizzato, condomini, userProfile]);


  const hasPreventiviBanner = !['condominio', 'condomino'].includes(ruoloNormalizzato) && segnalazioniVisualizzate.some((s) => s.stato_invio === 'inviato' && !s.stato_conversione);

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
    fotolavorifinitiurl: item.fotolavorifinitinome ? buildPublicUrl(item.fotolavorifinitinome) : '',
    preventivourl: item.preventivonome ? buildPublicUrl(item.preventivonome) : '',
    note: Array.isArray(item.note) ? item.note : [],
    archiviata: isValoreVero(item.archiviata),
  };
  });

  useEffect(() => {
    if (!utente || !segnalazioni.length) return;

    const params = new URLSearchParams(window.location.search);
    const praticaId = params.get('pratica') || params.get('segnalazione') || params.get('segnalazioneId');

    if (!praticaId) return;

    const pratica = segnalazioni.find((item) => Number(item.id) === Number(praticaId));

    if (pratica) {
      setDettaglioAperto(pratica);
      params.delete('pratica');
      params.delete('segnalazione');
      params.delete('segnalazioneId');
      params.delete('fromPush');
      params.delete('source');
      params.delete('utm_source');

      const query = params.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({ ...(window.history.state || {}), cspRoute: getCspHistoryRoute() }, document.title, nextUrl);
    }
  }, [utente, segnalazioni]);

  useEffect(() => {
    if (!utente || !lavoriPrivati.length) return;

    const params = new URLSearchParams(window.location.search);
    const lavoroId = params.get('lavoroPrivato') || params.get('lavoro_privato') || params.get('privato');

    if (!lavoroId) return;

    const lavoro = lavoriPrivati.find((item) => Number(item.id) === Number(lavoroId));

    if (lavoro) {
      setLavoroPrivatoApertoId(Number(lavoroId));
      if (ruoloNormalizzato === 'gestore') setGestoreSection('lavori-privati');
      if (['condominio', 'condomino'].includes(ruoloNormalizzato)) setCondominoSection('lavori-privati');
      params.delete('lavoroPrivato');
      params.delete('lavoro_privato');
      params.delete('privato');

      const query = params.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({ ...(window.history.state || {}), cspRoute: getCspHistoryRoute() }, document.title, nextUrl);
    }
  }, [utente, lavoriPrivati, ruoloNormalizzato]);

  useEffect(() => {
    if (!utente) return;

    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    const rivistaId = params.get('rivista') || params.get('magazine');

    if (section !== 'rivista' && !rivistaId) return;

    if (ruoloNormalizzato === 'gestore') setGestoreSection('rivista');
    if (isAmministratoreOperativo) setAmministratoreSection('rivista');
    if (['condominio', 'condomino'].includes(ruoloNormalizzato)) setCondominoSection('rivista');

    params.delete('section');
    params.delete('rivista');
    params.delete('magazine');
    params.delete('fromPush');
    params.delete('source');
    params.delete('utm_source');

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({ ...(window.history.state || {}), cspRoute: getCspHistoryRoute() }, document.title, nextUrl);
  }, [utente, ruoloNormalizzato, isAmministratoreOperativo]);


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
      setRuolo(String(profile.ruolo || 'non_configurato').toLowerCase().trim());

      const { data: condominiData, error: condominiError } = await supabase.from('condomini').select('*').order('nome');
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
        .select('*')
        .order('created_at', { ascending: false });

      if (votiError && votiError.code !== 'PGRST116') throw votiError;
      setVotiPreventivi(votiData || []);

      const { data: riepiloghiData, error: riepiloghiError } = await supabase
        .from('votazioni_riepiloghi')
        .select('*')
        .order('updated_at', { ascending: false });

      if (riepiloghiError && riepiloghiError.code !== 'PGRST116' && riepiloghiError.code !== '42P01') throw riepiloghiError;
      setVotazioniRiepiloghi(riepiloghiData || []);

      const { data: contrattiData, error: contrattiError } = await supabase
        .from('contratti_condominio')
        .select('*');

      if (contrattiError && contrattiError.code !== 'PGRST116') throw contrattiError;
      setContratti(contrattiData || []);

      const { data: reportData, error: reportError } = await supabase
        .from('report_condominio')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportError && reportError.code !== 'PGRST116') throw reportError;
      setReportCondominio(reportData || []);

      const { data: rivisteData, error: rivisteError } = await supabase
        .from('riviste_condominio')
        .select('*')
        .order('created_at', { ascending: false });

      if (rivisteError && rivisteError.code !== 'PGRST116' && rivisteError.code !== '42P01') throw rivisteError;
      setRivisteCondominio(rivisteData || []);

      const { data: leadData, error: leadError } = await supabase
        .from('lead_amministratori')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadError && leadError.code !== 'PGRST116') throw leadError;
      setLeadAmministratori(leadData || []);

      const { data: leadTecniciData, error: leadTecniciError } = await supabase
        .from('lead_tecnici')
        .select('*')
        .order('updated_at', { ascending: false });

      if (leadTecniciError && leadTecniciError.code !== 'PGRST116' && leadTecniciError.code !== '42P01') throw leadTecniciError;
      setLeadTecnici(leadTecniciData || []);

      const { data: aziendePartnerData, error: aziendePartnerError } = await supabase
        .from('aziende_partner')
        .select('*')
        .order('created_at', { ascending: false });

      if (aziendePartnerError && aziendePartnerError.code !== 'PGRST116' && aziendePartnerError.code !== '42P01') throw aziendePartnerError;
      setAziendePartner(aziendePartnerData || []);

      const { data: provvigioniPartnerData, error: provvigioniPartnerError } = await supabase
        .from('provvigioni_partner')
        .select('*')
        .order('valida_dal', { ascending: false });

      if (provvigioniPartnerError && provvigioniPartnerError.code !== 'PGRST116' && provvigioniPartnerError.code !== '42P01') throw provvigioniPartnerError;
      setProvvigioniPartner(provvigioniPartnerData || []);

      const { data: fatturePartnerData, error: fatturePartnerError } = await supabase
        .from('fatture_partner')
        .select('*')
        .order('created_at', { ascending: false });

      if (fatturePartnerError && fatturePartnerError.code !== 'PGRST116' && fatturePartnerError.code !== '42P01') throw fatturePartnerError;
      setFatturePartner(fatturePartnerData || []);

      const { data: lavoriPrivatiData, error: lavoriPrivatiError } = await supabase
        .from('lavori_privati')
        .select('*')
        .order('created_at', { ascending: false });

      if (lavoriPrivatiError && lavoriPrivatiError.code !== 'PGRST116' && lavoriPrivatiError.code !== '42P01') throw lavoriPrivatiError;
      setLavoriPrivati(lavoriPrivatiData || []);

      const { data: fattureLavoriPrivatiData, error: fattureLavoriPrivatiError } = await supabase
        .from('fatture_lavori_privati')
        .select('*')
        .order('created_at', { ascending: false });

      if (fattureLavoriPrivatiError && fattureLavoriPrivatiError.code !== 'PGRST116' && fattureLavoriPrivatiError.code !== '42P01') throw fattureLavoriPrivatiError;
      setFattureLavoriPrivati(fattureLavoriPrivatiData || []);

      const { data: provvigioniMaturateData, error: provvigioniMaturateError } = await supabase
        .from('provvigioni_maturate')
        .select('*')
        .order('created_at', { ascending: false });

      if (provvigioniMaturateError && provvigioniMaturateError.code !== 'PGRST116' && provvigioniMaturateError.code !== '42P01') throw provvigioniMaturateError;
      setProvvigioniMaturate(provvigioniMaturateData || []);

      const { data: fattureProvvigioniData, error: fattureProvvigioniError } = await supabase
        .from('fatture_provvigioni_gestore')
        .select('*')
        .order('created_at', { ascending: false });

      if (fattureProvvigioniError && fattureProvvigioniError.code !== 'PGRST116' && fattureProvvigioniError.code !== '42P01') throw fattureProvvigioniError;
      setFattureProvvigioniGestore(fattureProvvigioniData || []);

      const { data: fattureProvvigioniAmministratoriData, error: fattureProvvigioniAmministratoriError } = await supabase
        .from('fatture_provvigioni_amministratori')
        .select('*')
        .order('created_at', { ascending: false });

      if (fattureProvvigioniAmministratoriError && fattureProvvigioniAmministratoriError.code !== 'PGRST116' && fattureProvvigioniAmministratoriError.code !== '42P01') throw fattureProvvigioniAmministratoriError;
      setFattureProvvigioniAmministratori(fattureProvvigioniAmministratoriData || []);

      const { data: capitolatiData, error: capitolatiError } = await supabase
        .from('capitolati_senza_pensieri')
        .select('*')
        .order('created_at', { ascending: false });

      if (capitolatiError && capitolatiError.code !== 'PGRST116' && capitolatiError.code !== '42P01') throw capitolatiError;
      setCapitolatiSenzaPensieri(capitolatiData || []);

      const { data: capitolatiEventiData, error: capitolatiEventiError } = await supabase
        .from('capitolati_eventi')
        .select('*')
        .order('created_at', { ascending: false });

      if (capitolatiEventiError && capitolatiEventiError.code !== 'PGRST116' && capitolatiEventiError.code !== '42P01') throw capitolatiEventiError;
      setCapitolatiEventi(capitolatiEventiData || []);

      const { data: votiAssembleaCasepData, error: votiAssembleaCasepError } = await supabase
        .from('casep_assemblea_voti')
        .select('*')
        .order('updated_at', { ascending: false });

      if (votiAssembleaCasepError && votiAssembleaCasepError.code !== 'PGRST116' && votiAssembleaCasepError.code !== '42P01') throw votiAssembleaCasepError;
      setVotiAssembleaCasep(votiAssembleaCasepData || []);

      const { data: onboardingData, error: onboardingError } = await supabase
        .from('partner_onboarding_casp')
        .select('*')
        .order('updated_at', { ascending: false });

      if (onboardingError && onboardingError.code !== 'PGRST116' && onboardingError.code !== '42P01') throw onboardingError;
      setPartnerOnboardingCaSP(onboardingData || []);

      const { data: campaignLogData, error: campaignLogError } = await supabase
        .from('partner_campaign_log')
        .select('*')
        .order('data_invio', { ascending: false });

      if (campaignLogError && campaignLogError.code !== 'PGRST116' && campaignLogError.code !== '42P01') throw campaignLogError;
      setPartnerCampaignLog(campaignLogData || []);

      let utentiCondominiData = [];
      const { data: utentiCondominiConCognome, error: utentiCondominiError } = await supabase
        .from('utenti_condomini')
        .select('email, condominio_id, millesimi, ruolo, cognome, onesignal_subscription_id');

      if (utentiCondominiError && utentiCondominiError.code === '42703') {
        const { data: utentiCondominiFallback, error: utentiCondominiFallbackError } = await supabase
          .from('utenti_condomini')
          .select('email, condominio_id, millesimi, ruolo, onesignal_subscription_id');
        if (utentiCondominiFallbackError && utentiCondominiFallbackError.code !== 'PGRST116') throw utentiCondominiFallbackError;
        utentiCondominiData = utentiCondominiFallback || [];
      } else {
        if (utentiCondominiError && utentiCondominiError.code !== 'PGRST116') throw utentiCondominiError;
        utentiCondominiData = utentiCondominiConCognome || [];
      }
      setUtentiCondomini(utentiCondominiData || []);

      const { data: utentiSistemaData, error: utentiSistemaError } = await supabase
        .from('utenti')
        .select('email, ruolo, nome, studio, onesignal_subscription_id');

      if (utentiSistemaError && utentiSistemaError.code !== 'PGRST116') throw utentiSistemaError;
      setUtentiSistema(utentiSistemaData || []);
    } catch (error) {
      console.error(error);
      setStatusMessage('Errore caricamento: ' + (error.message || 'sconosciuto'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2600);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const inizializzaAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (active) {
          await carica();
        }
      } catch (error) {
        console.error(error);
        setStatusMessage('Errore accesso: ' + (error.message || 'sconosciuto'));
        setLoading(false);
      }
    };

    inizializzaAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      if (session?.user) {
        setUtente(session.user);
        setTimeout(() => {
          carica();
        }, 0);
      } else {
        setUtente(null);
        setUserProfile(null);
        setRuolo('');
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!utente) return undefined;

    const channel = supabase
      .channel('preventivo-voti-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'preventivo_voti' },
        async () => {
          const { data, error } = await supabase
            .from('preventivo_voti')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error) {
            setVotiPreventivi(data || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utente]);


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
      const condominioId = Number(form.condominioId);
      const nomeCondominio = condomini.find((c) => Number(c.id) === condominioId)?.nome || 'il tuo condominio';

      const { data, error } = await supabase.functions.invoke('crea-segnalazione', {
        body: {
          titolo: form.titolo.trim(),
          descrizione: form.descrizione.trim(),
          categoria: form.categoria,
          priorita: form.priorita,
          luogo: form.luogo.trim(),
          referente: form.referente.trim(),
          telefono: form.telefono.trim(),
          condominioId,
          nomeCondominio,
          allegatonome,
          amministratoreEmail: utente?.email || '',
          amministratoreTelefono: userProfile?.telefono || '',
          appUrl: getCurrentAppBaseUrl(),
          launchUrl: buildAppDeepLink({ fromPush: '1' }),
          source: 'App.jsx',
          release: APP_VERSION,
        },
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Creazione segnalazione non completata.');

      console.info('Segnalazione creata tramite crea-segnalazione:', data);

      setShowNuovaSegnalazione(false);
      await carica();
      setStatusMessage('Segnalazione salvata correttamente.');
      mostraToast('Nuova segnalazione creata', 'La pratica è stata salvata e le notifiche sono state inviate agli utenti collegati al condominio.', 'success');
    } finally {
      setSaving(false);
    }
  };

  const cambiaStato = async (id, nuovoStato) => {
    try {
      const pratica = segnalazioni.find((s) => Number(s.id) === Number(id)) || dettaglioAperto;

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

      const mappaNotificheStato = {
        'Presa in carico': {
          amministrazione: true,
          condomini: false,
          titolo: 'Pratica presa in carico',
          messaggio: `La pratica “${pratica?.titolo || 'Pratica'}” è stata presa in carico.`,
          tipo: 'stato_presa_in_carico',
        },
        'Sopralluogo programmato': {
          amministrazione: true,
          condomini: true,
          titolo: 'Sopralluogo programmato',
          messaggio: `È stato programmato un sopralluogo per la pratica “${pratica?.titolo || 'Pratica'}”.`,
          tipo: 'stato_sopralluogo_programmato',
        },
        'Sopralluogo effettuato': {
          amministrazione: true,
          condomini: true,
          titolo: 'Sopralluogo effettuato',
          messaggio: `Il sopralluogo della pratica “${pratica?.titolo || 'Pratica'}” è stato completato. Foto disponibili in app.`,
          tipo: 'stato_sopralluogo_effettuato',
        },
        'Preventivata': {
          amministrazione: true,
          condomini: false,
          titolo: 'Pratica preventivata',
          messaggio: `La pratica “${pratica?.titolo || 'Pratica'}” è ora in fase preventivo.`,
          tipo: 'stato_preventivata',
        },
        'Pianificata': {
          amministrazione: true,
          condomini: true,
          titolo: 'Lavori pianificati',
          messaggio: `I lavori per la pratica “${pratica?.titolo || 'Pratica'}” sono stati pianificati.`,
          tipo: 'stato_lavori_pianificati',
        },
        'Chiusa': {
          amministrazione: true,
          condomini: true,
          titolo: 'Lavori completati',
          messaggio: `La pratica “${pratica?.titolo || 'Pratica'}” è stata completata.`,
          tipo: 'stato_completata',
        },
      };

      const config = mappaNotificheStato[nuovoStato];

      if (config && pratica?.condominio_id) {
        if (config.amministrazione) {
          try {
            await supabase.functions.invoke('notify-condominio', {
              body: {
                condominioId: Number(pratica.condominio_id),
                destinatari: 'amministrazione',
                title: config.titolo,
                message: config.messaggio,
                tipo: config.tipo,
                riferimentoId: Number(id),
              },
            });
          } catch (notifyError) {
            console.warn('Errore notifica amministrazione cambio stato:', notifyError);
          }
        }

        if (config.condomini) {
          try {
            await supabase.functions.invoke('notify-condominio', {
              body: {
                condominioId: Number(pratica.condominio_id),
                destinatari: 'condomini',
                title: config.titolo,
                message: config.messaggio,
                tipo: config.tipo,
                riferimentoId: Number(id),
              },
            });
          } catch (notifyError) {
            console.warn('Errore notifica condomini cambio stato:', notifyError);
          }
        }
      }

      setSegnalazioni((prev) => prev.map((item) => (
        item.id === id ? { ...item, ...updatePayload, stato: nuovoStato } : item
      )));

      setDettaglioAperto((prev) => prev && prev.id === id ? { ...prev, ...updatePayload, stato: nuovoStato } : prev);

      mostraToast('Stato aggiornato', `La pratica è passata a: ${nuovoStato}`, 'success');
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

    if (columnName === 'preventivonome') {
      try {
        const pratica = segnalazioni.find((s) => Number(s.id) === Number(id)) || dettaglioAperto;
        const condominioId = Number(pratica?.condominio_id || 0);

        if (condominioId) {
          const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-condominio', {
            body: {
              condominioId,
              destinatari: 'amministrazione',
              title: 'Preventivo caricato',
              message: `È stato caricato un preventivo per la pratica “${pratica?.titolo || 'Pratica'}”.`,
              tipo: 'preventivo_caricato',
              riferimentoId: Number(id),
            },
          });

          if (notifyError) {
            console.warn('Notifica preventivo caricato non inviata:', notifyError.message || notifyError);
          } else {
            console.info('Notifica preventivo caricato inviata:', notifyData);
          }
        }
      } catch (notifyCatchError) {
        console.warn('Errore chiamata notify-condominio preventivo caricato:', notifyCatchError);
      }
    }

    await carica();
    setDettaglioAperto((prev) => prev && prev.id === id ? {
      ...prev,
      ...updatePayload,
      [columnName]: fileName,
      fotosopralluogourl: columnName === 'fotosopralluogonome' ? buildPublicUrl(fileName) : prev.fotosopralluogourl,
      fotolavorifinitiurl: columnName === 'fotolavorifinitinome' ? buildPublicUrl(fileName) : prev.fotolavorifinitiurl,
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

      try {
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-condominio', {
          body: {
            condominioId: Number(pratica.condominio_id),
            destinatari: 'condomini',
            title: 'Preventivo da consultare',
            message: `È disponibile un preventivo per la pratica “${pratica.titolo}”. Apri l’app per consultarlo e votare.`,
            tipo: 'preventivo_votazione',
            riferimentoId: Number(pratica.id),
          },
        });

        if (notifyError) {
          console.warn('Notifica preventivo condiviso non inviata:', notifyError.message || notifyError);
        } else {
          console.info('Notifica preventivo condiviso inviata:', notifyData);
        }
      } catch (notifyCatchError) {
        console.warn('Errore chiamata notify-condominio preventivo condiviso:', notifyCatchError);
      }

      setStatusMessage('Preventivo condiviso con i condomini.');
      mostraToast('Preventivo condiviso', 'I condomini collegati hanno ricevuto la notifica per consultare e votare.', 'success');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore condivisione preventivo: ' + (error.message || 'sconosciuto'));
    }
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
      mostraToast('Voti aggiornati', `${(data || []).length} voti registrati per questa pratica.`, 'info');
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento voti: ' + (error.message || 'sconosciuto'));
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

      await inviaNotificaCondominio({
        condominioId: pratica.condominio_id,
        destinatari: 'condomini',
        title: 'Reminder votazione preventivo',
        message: `Ricorda di votare il preventivo della pratica “${pratica.titolo || 'Pratica'}”.`,
        tipo: 'reminder_votazione',
        riferimentoId: Number(pratica.id),
      });

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

      const { data, error } = await supabase
        .from('preventivo_voti')
        .upsert(votoPayload, { onConflict: 'segnalazione_id,email' })
        .select()
        .single();

      if (error) throw error;

      setVotiPreventivi((prev) => {
        const filtrati = prev.filter((item) => !(Number(item.segnalazione_id) === Number(id) && item.email === votoPayload.email));
        return [data || votoPayload, ...filtrati];
      });

      try {
        setStatusMessage(`Voto registrato. Controllo completamento votazione pratica #${Number(id)}...`);

        const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-votazione-completata', {
          body: {
            segnalazioneId: Number(id),
          },
        });

        if (notifyError) {
          console.warn('Controllo votazione completata non riuscito:', notifyError.message || notifyError);
          setStatusMessage(`Voto registrato, ma controllo completamento non riuscito: ${notifyError.message || 'errore funzione'}`);
        } else {
          console.info('Controllo votazione completata:', notifyData);

          if (notifyData?.completed && notifyData?.notified) {
            setStatusMessage('Votazione completata: push ed email inviati a tutti.');
            mostraToast('Votazione completata', 'Push ed email inviati a tutti gli utenti collegati.', 'success');
          } else if (notifyData?.already_sent) {
            setStatusMessage('Votazione già completata e già notificata.');
            mostraToast('Votazione già notificata', 'La comunicazione finale era già stata inviata.', 'info');
          } else if (notifyData?.completed === false) {
            setStatusMessage(`Voto registrato. Votazione non ancora completa: ${notifyData?.totaleVoti || 0}/${notifyData?.totaleAventiDiritto || 0} voti.`);
            mostraToast('Voto registrato', `Votazione non ancora completa: ${notifyData?.totaleVoti || 0}/${notifyData?.totaleAventiDiritto || 0}.`, 'info');
          } else if (notifyData?.success === false) {
            setStatusMessage(`Voto registrato, ma notifica finale non inviata: ${notifyData?.error || 'errore sconosciuto'}`);
            mostraToast('Controllo votazione', notifyData?.error || 'Notifica finale non inviata.', 'warning');
          } else {
            setStatusMessage('Voto registrato. Controllo completamento eseguito.');
          }
        }
      } catch (notifyError) {
        console.warn('Errore controllo votazione completata:', notifyError);
        setStatusMessage(`Voto registrato, ma controllo completamento non eseguito: ${notifyError?.message || 'errore sconosciuto'}`);
      }

      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore registrazione voto: ' + (error.message || 'sconosciuto'));
    }
  };

  const inviaRipartoMillesimi = async (pratica, riparto) => {
    try {
      if (!pratica?.id) return;
      const conferma = window.confirm('Vuoi inviare il riparto millesimale ai condomini?');
      if (!conferma) return;

      setStatusMessage('Salvataggio riparto strutturato e invio comunicazioni in corso...');

      const { data, error } = await supabase.functions.invoke('gestione-riparto-millesimale', {
        body: {
          segnalazione_id: Number(pratica.id),
          titolo: pratica.titolo,
          condominio_id: Number(pratica.condominio_id),
          importo_totale: riparto.importo_totale,
          scadenza: riparto.scadenza,
          scadenze_rate: riparto.scadenze_rate || [],
          rate: riparto.rate,
          quote: riparto.quote,
          totale_millesimi: riparto.totale_millesimi,
          created_by_email: utente?.email || '',
        },
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Gestione riparto non completata.');

      const ripartoMillesimale = data?.riparto_millesimale || {
        importo_totale: riparto.importo_totale,
        scadenza: riparto.scadenza,
        scadenze_rate: riparto.scadenze_rate || [],
        rate: riparto.rate,
        quote: riparto.quote,
        totale_millesimi: riparto.totale_millesimi,
        inviato_il: new Date().toISOString(),
      };

      const noteAggiornate = data?.note || pratica.note || [];

      setDettaglioAperto((prev) => prev && prev.id === pratica.id
        ? { ...prev, note: noteAggiornate, riparto_millesimale: ripartoMillesimale }
        : prev
      );

      const emailOk = data?.email?.success !== false;
      const pushOk = data?.push?.success !== false;
      const emailCount = data?.email?.emails?.length || data?.email?.sent || 0;
      const rateCount = data?.rate_count || 0;

      if (emailOk && pushOk) {
        setStatusMessage(`Riparto strutturato salvato e inviato. Rate generate: ${rateCount}. Email: ${emailCount || 'OK'}.`);
        mostraToast('Riparto inviato', `Riparto salvato, rate generate e comunicazioni inviate ai condòmini.`, 'success');
      } else if (emailOk && !pushOk) {
        setStatusMessage(`Riparto strutturato salvato. Email inviata, ma push non completata. Rate generate: ${rateCount}.`);
        mostraToast('Riparto salvato', 'Email inviata, push da verificare nei log.', 'warning');
      } else if (!emailOk && pushOk) {
        setStatusMessage(`Riparto strutturato salvato. Push inviata, ma email non completata. Rate generate: ${rateCount}.`);
        mostraToast('Riparto salvato', 'Push inviata, email da verificare nei log.', 'warning');
      } else {
        setStatusMessage(`Riparto strutturato salvato. Email e push non completate: controllare i log. Rate generate: ${rateCount}.`);
        mostraToast('Riparto salvato', 'Comunicazioni da verificare nei log.', 'warning');
      }

      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore invio riparto: ' + (error.message || 'sconosciuto'));
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

      const pratica = segnalazioni.find((s) => Number(s.id) === Number(id)) || dettaglioAperto || data;

      await inviaNotificaCondominio({
        condominioId: pratica?.condominio_id || data?.condominio_id,
        destinatari: 'tutti',
        title: 'Lavori pianificati',
        message: `I lavori per la pratica “${pratica?.titolo || 'Pratica'}” sono stati pianificati.`,
        tipo: 'lavori_pianificati',
        riferimentoId: Number(id),
      });

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

      const pratica = segnalazioni.find((s) => Number(s.id) === Number(id)) || dettaglioAperto;

      const { error } = await supabase
        .from('segnalazioni')
        .update({ stato_conversione, stato: statoVisuale })
        .eq('id', id);

      if (error) throw error;

      if (pratica?.condominio_id) {
        const approvato = stato_conversione === 'accettato';

        await inviaNotificaCondominio({
          condominioId: pratica.condominio_id,
          destinatari: 'tutti',
          title: approvato ? 'Preventivo approvato' : 'Preventivo rifiutato',
          message: approvato
            ? `Il preventivo della pratica “${pratica.titolo || 'Pratica'}” è stato approvato.`
            : `Il preventivo della pratica “${pratica.titolo || 'Pratica'}” è stato rifiutato.`,
          tipo: approvato ? 'preventivo_approvato' : 'preventivo_rifiutato',
          riferimentoId: Number(id),
        });
      }

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

  const normalizzaPayloadLeadAmministratore = (lead = {}) => ({
    ...lead,
    data_appuntamento: lead.data_appuntamento || null,
    prossimo_followup: lead.prossimo_followup || null,
    ora_appuntamento: lead.ora_appuntamento || null,
    stato_pipeline: lead.stato_pipeline || 'potenziale',
  });

  const creaLeadAmministratore = async (lead) => {
    try {
      const { error } = await supabase.from('lead_amministratori').insert(normalizzaPayloadLeadAmministratore(lead));

      if (error) throw error;
      setStatusMessage('Lead amministratore salvato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione lead: ' + (error.message || 'sconosciuto'));
    }
  };

  const aggiornaLeadAmministratore = async (leadId, updatePayload) => {
    try {
      const payloadPulito = normalizzaPayloadLeadAmministratore(updatePayload);
      const { error } = await supabase
        .from('lead_amministratori')
        .update(payloadPulito)
        .eq('id', leadId);

      if (error) throw error;

      setLeadAmministratori((prev) => prev.map((lead) => (
        Number(lead.id) === Number(leadId) ? { ...lead, ...payloadPulito } : lead
      )));

      setStatusMessage('Lead amministratore aggiornato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento lead: ' + (error.message || 'sconosciuto'));
    }
  };


  const normalizzaLeadTecnico = (tecnico = {}) => ({
    nome: String(tecnico.nome || '').trim(),
    cognome: String(tecnico.cognome || tecnico.tecnico_cognome || '').trim(),
    studio_tecnico: String(tecnico.studio_tecnico || tecnico.tecnico_studio || '').trim(),
    email: String(tecnico.email || tecnico.tecnico_email || '').toLowerCase().trim(),
    telefono: String(tecnico.telefono || tecnico.tecnico_telefono || '').trim(),
    indirizzo: String(tecnico.indirizzo || tecnico.tecnico_indirizzo || '').trim(),
    citta: String(tecnico.citta || tecnico.tecnico_citta || '').trim(),
    provincia: String(tecnico.provincia || tecnico.tecnico_provincia || '').trim(),
    note: String(tecnico.note || tecnico.tecnico_note || '').trim(),
  });

  const upsertLeadTecnico = async (tecnico = {}) => {
    const payload = normalizzaLeadTecnico(tecnico);
    if (!payload.email) return null;
    const { data: existing, error: existingError } = await supabase.from('lead_tecnici').select('id').eq('email', payload.email).maybeSingle();
    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing?.id) {
      const { data, error } = await supabase.from('lead_tecnici').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await supabase.from('lead_tecnici').insert(payload).select().single();
    if (error) throw error;
    return data;
  };

  const creaLeadTecnico = async (tecnico) => {
    try { await upsertLeadTecnico(tecnico); setStatusMessage('Lead tecnico salvato con successo.'); await carica(); }
    catch (error) { console.error(error); alert('Errore salvataggio tecnico: ' + (error.message || 'sconosciuto')); }
  };

  const aggiornaLeadTecnico = async (tecnicoId, updatePayload) => {
    try {
      const payload = normalizzaLeadTecnico(updatePayload);
      const { error } = await supabase.from('lead_tecnici').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', tecnicoId);
      if (error) throw error;
      setLeadTecnici((prev) => prev.map((tecnico) => Number(tecnico.id) === Number(tecnicoId) ? { ...tecnico, ...payload } : tecnico));
      setStatusMessage('Lead tecnico aggiornato con successo.'); await carica();
    } catch (error) { console.error(error); alert('Errore aggiornamento tecnico: ' + (error.message || 'sconosciuto')); }
  };

  const importaLeadTecnici = async (rows = []) => {
    try { let salvati = 0; for (const row of rows || []) { const payload = normalizzaLeadTecnico(row); if (!payload.email) continue; await upsertLeadTecnico(payload); salvati += 1; } setStatusMessage(`Import tecnici completato: ${salvati} contatti salvati.`); await carica(); }
    catch (error) { console.error(error); alert('Errore import tecnici: ' + (error.message || 'sconosciuto')); }
  };

  const creaAziendaPartner = async (azienda) => {
    try {
      const percentualeGestore = Number(azienda.percentuale_gestore || 0);
      const payloadAzienda = { ...azienda };
      delete payloadAzienda.percentuale_gestore;

      const { data, error } = await supabase
        .from('aziende_partner')
        .insert(payloadAzienda)
        .select()
        .single();

      if (error) throw error;

      if (data?.id) {
        const { error: provvigioneError } = await supabase
          .from('provvigioni_partner')
          .insert({
            azienda_partner_id: data.id,
            percentuale_gestore: percentualeGestore,
            valida_dal: new Date().toISOString().slice(0, 10),
            attiva: true,
          });

        if (provvigioneError) throw provvigioneError;
      }

      setStatusMessage('Azienda partner salvata con provvigione gestore.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione azienda partner: ' + (error.message || 'sconosciuto'));
    }
  };

  const aggiornaAziendaPartner = async (aziendaId, updatePayload) => {
    try {
      const { error } = await supabase
        .from('aziende_partner')
        .update(updatePayload)
        .eq('id', aziendaId);

      if (error) throw error;

      setAziendePartner((prev) => prev.map((azienda) => (
        Number(azienda.id) === Number(aziendaId) ? { ...azienda, ...updatePayload } : azienda
      )));

      setStatusMessage('Fornitore aggiornato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento fornitore: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaProvvigionePartner = async (aziendaId, percentualeGestore) => {
    try {
      const oggi = new Date().toISOString().slice(0, 10);

      await supabase
        .from('provvigioni_partner')
        .update({ attiva: false, valida_al: oggi })
        .eq('azienda_partner_id', aziendaId)
        .eq('attiva', true);

      const { error } = await supabase
        .from('provvigioni_partner')
        .insert({
          azienda_partner_id: aziendaId,
          percentuale_gestore: Number(percentualeGestore || 0),
          valida_dal: oggi,
          attiva: true,
        });

      if (error) throw error;

      setStatusMessage('Nuova provvigione fornitore salvata.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento provvigione: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaFatturaPartner = async (fattura) => {
    try {
      const { data, error } = await supabase
        .from('fatture_partner')
        .insert(fattura)
        .select()
        .single();

      if (error) throw error;

      setStatusMessage('Fattura partner salvata con successo.');
      await carica();
      return data;
    } catch (error) {
      console.error(error);
      alert('Errore creazione fattura: ' + (error.message || 'sconosciuto'));
      return null;
    }
  };

  const aggiornaFatturaPartner = async (fatturaId, updatePayload) => {
    try {
      const { error } = await supabase
        .from('fatture_partner')
        .update(updatePayload)
        .eq('id', fatturaId);

      if (error) throw error;

      setFatturePartner((prev) => prev.map((fattura) => (
        Number(fattura.id) === Number(fatturaId) ? { ...fattura, ...updatePayload } : fattura
      )));

      setStatusMessage('Fattura aggiornata con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento fattura: ' + (error.message || 'sconosciuto'));
    }
  };

  const uploadFatturaPdf = async (file) => {
    try {
      const safeName = String(file.name || 'fattura.pdf')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .toLowerCase();

      const filePath = `fatture-partner/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('fatture')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fatture')
        .getPublicUrl(filePath);

      return data?.publicUrl || '';
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const uploadCapitolatoPdf = async (file) => {
    try {
      const safeName = String(file.name || 'capitolato.pdf')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .toLowerCase();

      const filePath = `capitolati-senza-pensieri/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('fatture')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fatture')
        .getPublicUrl(filePath);

      return data?.publicUrl || '';
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const inviaNotificaCapitolato = async (eventType, capitolato, extra = {}) => {
    const functionName = 'notify-capitolato';

    try {
      if (!capitolato?.id) {
        console.warn('[CaSeP notify] Chiamata saltata: capitolato senza id', { eventType, capitolato });
        return { ok: false, skipped: true, reason: 'missing_capitolato_id' };
      }

      const payload = {
        event_type: eventType,
        capitolato_id: capitolato.id,
        capitolato,
        extra: {
          ...extra,
          source: 'App.jsx',
          release: APP_VERSION,
          function_name: functionName,
        },
      };

      console.log('[CaSeP notify] Invoco edge:', functionName, payload);

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) {
        console.warn('[CaSeP notify] Edge non completata:', functionName, error.message || error);
        return { ok: false, error };
      }

      console.log('[CaSeP notify] Risposta edge:', functionName, data);
      return data;
    } catch (error) {
      console.warn('[CaSeP notify] Errore non bloccante:', functionName, error.message || error);
      return { ok: false, error };
    }
  };

  const registraEventoCapitolato = async (capitolatoId, tipoEvento, descrizione, destinatario = 'sistema', canale = 'app') => {
    try {
      await supabase.from('capitolati_eventi').insert({
        capitolato_id: capitolatoId,
        tipo_evento: tipoEvento,
        descrizione,
        destinatario,
        canale,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const salvaPartnerOnboarding = async (azienda, statoCommerciale, note = '') => {
    try {
      if (!azienda?.id) return;
      const existing = (partnerOnboardingCaSP || []).find((item) => Number(item.azienda_id) === Number(azienda.id));

      if (existing) {
        await supabase.from('partner_onboarding_casp').update({
          stato_commerciale: statoCommerciale,
          data_followup: statoCommerciale === 'Follow-up programmato'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : existing.data_followup,
          data_conversione: statoCommerciale === 'Convertita annuale'
            ? new Date().toISOString().slice(0, 10)
            : existing.data_conversione,
          note,
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id);
      } else {
        await supabase.from('partner_onboarding_casp').insert({
          azienda_id: azienda.id,
          ragione_sociale: azienda.ragione_sociale,
          email: azienda.email,
          telefono: azienda.telefono,
          stato_commerciale: statoCommerciale,
          data_primo_contatto: statoCommerciale !== 'Da contattare' ? new Date().toISOString().slice(0, 10) : null,
          data_followup: statoCommerciale === 'Follow-up programmato'
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : null,
          data_conversione: statoCommerciale === 'Convertita annuale' ? new Date().toISOString().slice(0, 10) : null,
          note,
        });
      }

      await carica();
      alert(`Stato commerciale aggiornato: ${statoCommerciale}`);
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento onboarding partner.');
    }
  };

  const creaCapitolatoSenzaPensieri = async (capitolato) => {
    try {
      const numeroPratica = capitolato.numero_pratica || `CASEP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

      let tecnicoLead = null;
      if (capitolato.tecnico_email) {
        try {
          tecnicoLead = await upsertLeadTecnico({
            nome: capitolato.tecnico_nome,
            cognome: capitolato.tecnico_cognome,
            studio_tecnico: capitolato.tecnico_studio,
            email: capitolato.tecnico_email,
            telefono: capitolato.tecnico_telefono,
            indirizzo: capitolato.tecnico_indirizzo,
            citta: capitolato.tecnico_citta,
            provincia: capitolato.tecnico_provincia,
            note: capitolato.tecnico_note,
          });
        } catch (leadTecnicoError) {
          console.warn('Lead tecnico non salvato automaticamente:', leadTecnicoError);
        }
      }

      const {
        tecnico_cognome,
        tecnico_indirizzo,
        tecnico_citta,
        tecnico_provincia,
        ...capitolatoDbPayload
      } = capitolato;

      const payload = {
        ...capitolatoDbPayload,
        tecnico_id: tecnicoLead?.id || capitolato.tecnico_id || null,
        numero_pratica: numeroPratica,
        stato: capitolato.stato || 'Nuovo capitolato',
      };

      const { data, error } = await supabase
        .from('capitolati_senza_pensieri')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      if (data?.id) {
        await registraEventoCapitolato(data.id, 'apertura', 'Nuovo capitolato aperto', 'gestore', 'app');
        console.log('[CaSeP notify] TRIGGER REALE creazione capitolato -> notify-capitolato', data);
        const notifyResult = await inviaNotificaCapitolato('nuovo_capitolato', data, {
          trigger: 'creaCapitolatoSenzaPensieri',
          created_from_app: true,
        });
        console.log('[CaSeP notify] nuovo_capitolato result', notifyResult);
      }

      setStatusMessage('Pratica Capitolato Senza Pensieri aperta correttamente.');
      await carica();
      return { success: true, numero_pratica: numeroPratica };
    } catch (error) {
      console.error(error);
      alert('Errore apertura capitolato: ' + (error.message || 'sconosciuto'));
      return { success: false };
    }
  };

  const aggiornaCapitolatoSenzaPensieri = async (capitolatoId, updatePayload) => {
    try {
      const { data, error } = await supabase
        .from('capitolati_senza_pensieri')
        .update(updatePayload)
        .eq('id', capitolatoId)
        .select()
        .single();

      if (error) throw error;

      await registraEventoCapitolato(
        capitolatoId,
        'aggiornamento',
        `Aggiornamento pratica: ${Object.keys(updatePayload).join(', ')}`,
        'sistema',
        'app'
      );

      const statoCapitolatoAggiornato = String(updatePayload.stato || '').toLowerCase();
      const decisioneCapitolatoAggiornata = String(updatePayload.decisione_amministratore || '').toLowerCase();

      const eventType = updatePayload.convertita_casp
        ? 'conversione_casp'
        : updatePayload.presenza_csp_richiesta
          ? 'presenza_csp_richiesta'
          : statoCapitolatoAggiornato.includes('accett') || decisioneCapitolatoAggiornata.includes('accett')
            ? 'offerta_accettata'
            : statoCapitolatoAggiornato.includes('rifiut') || decisioneCapitolatoAggiornata.includes('rifiut')
              ? 'offerta_rifiutata'
              : updatePayload.data_assemblea
                ? 'assemblea_programmata'
                : updatePayload.offerta_pdf_url
                  ? 'offerta_inviata'
                  : updatePayload.relazione_pdf_url
                    ? 'relazione_inviata'
                    : updatePayload.data_sopralluogo
                      ? 'sopralluogo_programmato'
                      : updatePayload.stato
                        ? 'stato_aggiornato'
                        : 'aggiornamento';

      const campiSoloSalvataggio = ['luogo_assemblea', 'note_sopralluogo'];
      const deveInviareNotificaCapitolato = Object.keys(updatePayload || {}).some(
        (campo) => !campiSoloSalvataggio.includes(campo)
      );

      if (data?.id && deveInviareNotificaCapitolato) {
        console.log('[CaSeP notify] TRIGGER REALE update capitolato -> notify-capitolato', eventType, data, updatePayload);
        const notifyResult = await inviaNotificaCapitolato(eventType, data, {
          updatePayload,
          trigger: 'aggiornaCapitolatoSenzaPensieri',
          updated_from_app: true,
        });
        console.log('[CaSeP notify] update result', eventType, notifyResult);
      } else if (data?.id) {
        console.log('[CaSeP notify] update capitolato salvato senza notifica', updatePayload);
      }

      setStatusMessage('Capitolato Senza Pensieri aggiornato.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento capitolato: ' + (error.message || 'sconosciuto'));
    }
  };


  const salvaVotoAssembleaCasep = async (payload) => {
    try {
      if (!payload?.capitolato_id || !payload?.email) return;

      const record = {
        capitolato_id: Number(payload.capitolato_id),
        condominio_id: payload.condominio_id ? Number(payload.condominio_id) : null,
        email: String(payload.email || '').toLowerCase().trim(),
        nome: payload.nome || '',
        cognome: payload.cognome || '',
        millesimi: Number(payload.millesimi || 0),
        presente: Boolean(payload.presente),
        voto: payload.voto || null,
        delegato_a_email: payload.delegato_a_email || null,
        note: payload.note || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('casep_assemblea_voti')
        .upsert(record, { onConflict: 'capitolato_id,email' });

      if (error) throw error;

      setVotiAssembleaCasep((prev) => {
        const altri = (prev || []).filter((item) => !(Number(item.capitolato_id) === Number(record.capitolato_id) && String(item.email || '').toLowerCase().trim() === record.email));
        return [record, ...altri];
      });
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio voto assemblea CaSeP: ' + (error.message || 'sconosciuto'));
    }
  };

  const cancellaCapitolatoSenzaPensieri = async (capitolatoId) => {
    try {
      const id = Number(capitolatoId);
      if (!id) return;

      await supabase.from('capitolati_eventi').delete().eq('capitolato_id', id);
      const { error } = await supabase.from('capitolati_senza_pensieri').delete().eq('id', id);
      if (error) throw error;

      setStatusMessage('Pratica Capitolato Senza Pensieri cancellata.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore cancellazione pratica: ' + (error.message || 'sconosciuto'));
    }
  };

  const inviaFatturaPartner = async (fatturaId) => {
    try {
      const { data, error } = await supabase.functions.invoke('notify-fattura-partner', {
        body: { fatturaId },
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Invio fattura non completato');

      await supabase
        .from('fatture_partner')
        .update({ stato: 'inviata' })
        .eq('id', fatturaId);

      setStatusMessage('Fattura inviata via email e push all’amministratore.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore invio fattura: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaFatturaProvvigioneGestore = async (fatturaProvvigione) => {
    try {
      const { error } = await supabase
        .from('fatture_provvigioni_gestore')
        .insert(fatturaProvvigione);

      if (error) throw error;

      setStatusMessage('Fattura provvigione gestore salvata.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione fattura provvigione: ' + (error.message || 'sconosciuto'));
    }
  };


  const aggiornaFatturaProvvigioneGestore = async (fatturaId, updatePayload) => {
    try {
      const { error } = await supabase
        .from('fatture_provvigioni_gestore')
        .update(updatePayload)
        .eq('id', fatturaId);

      if (error) throw error;

      setStatusMessage('Fattura provvigione gestore aggiornata.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento fattura provvigione gestore: ' + (error.message || 'sconosciuto'));
    }
  };

  const creaFatturaProvvigioneAmministratore = async (fatturaProvvigione) => {
    try {
      const { error } = await supabase
        .from('fatture_provvigioni_amministratori')
        .insert(fatturaProvvigione);

      if (error) throw error;

      setStatusMessage('Riepilogo fattura provvigione amministratore salvato.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore salvataggio riepilogo fattura provvigione amministratore: ' + (error.message || 'sconosciuto'));
    }
  };

  const aggiornaFatturaProvvigioneAmministratore = async (fatturaId, updatePayload) => {
    try {
      const { error } = await supabase
        .from('fatture_provvigioni_amministratori')
        .update(updatePayload)
        .eq('id', fatturaId);

      if (error) throw error;

      setStatusMessage('Fattura provvigione amministratore aggiornata.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento fattura provvigione amministratore: ' + (error.message || 'sconosciuto'));
    }
  };


  const notificaAbbonamentoAttivato = async ({ condominioId, piano, contratto = null }) => {
    try {
      const pianoNorm = normalizzaPianoAbbonamento(piano);
      if (!Number(condominioId || 0)) return null;
      if (!['plus', 'premium'].includes(pianoNorm)) return null;

      const { data, error } = await supabase.functions.invoke('notify-abbonamento-attivato', {
        body: {
          condominioId: Number(condominioId),
          piano: pianoNorm,
          contrattoId: contratto?.id || null,
        },
      });

      if (error) {
        console.warn('Notifica abbonamento attivato non completata:', error);
        return null;
      }

      console.log('Notifica abbonamento attivato inviata:', data);
      return data;
    } catch (error) {
      console.warn('Errore notifica abbonamento attivato:', error);
      return null;
    }
  };

  const creaContratto = async (contratto) => {
    try {
      const condominioId = Number(contratto?.condominio_id || 0);
      if (!condominioId) throw new Error('Condominio non valido.');

      const payloadContratto = {
        ...contratto,
        condominio_id: condominioId,
        stato: 'attivo',
        data_attivazione: new Date().toISOString(),
      };

      // Un condominio deve avere una sola scheda contratto corrente.
      // Se esiste già, aggiorniamo quella invece di creare duplicati Plus/Premium.
      const { data: contrattoEsistente, error: existingError } = await supabase
        .from('contratti_condominio')
        .select('*')
        .eq('condominio_id', condominioId)
        .order('data_attivazione', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') throw existingError;

      let contrattoFinale = null;

      if (contrattoEsistente?.id) {
        const { data, error } = await supabase
          .from('contratti_condominio')
          .update({
            ...payloadContratto,
          })
          .eq('id', contrattoEsistente.id)
          .select('*')
          .maybeSingle();

        if (error) throw error;
        contrattoFinale = data || { ...contrattoEsistente, ...payloadContratto };
      } else {
        const { data, error } = await supabase
          .from('contratti_condominio')
          .insert(payloadContratto)
          .select('*')
          .maybeSingle();

        if (error) throw error;
        contrattoFinale = data || payloadContratto;
      }

      if (contrattoFinale?.id) {
        const { error: cleanupError } = await supabase
          .from('contratti_condominio')
          .delete()
          .eq('condominio_id', condominioId)
          .neq('id', contrattoFinale.id);

        if (cleanupError) {
          console.warn('Pulizia duplicati contratti non completata:', cleanupError);
        }
      }

      await notificaAbbonamentoAttivato({
        condominioId: contrattoFinale?.condominio_id || payloadContratto.condominio_id,
        piano: contrattoFinale?.piano || payloadContratto.piano,
        contratto: contrattoFinale || payloadContratto,
      });

      setStatusMessage(contrattoEsistente?.id ? 'Contratto aggiornato con successo.' : 'Contratto attivato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore creazione/aggiornamento contratto: ' + (error.message || 'sconosciuto'));
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

      const { error: cleanupError } = await supabase
        .from('contratti_condominio')
        .delete()
        .eq('condominio_id', contratto.condominio_id)
        .neq('id', contratto.id);

      if (cleanupError) {
        console.warn('Pulizia duplicati contratti non completata:', cleanupError);
      }

      await notificaAbbonamentoAttivato({
        condominioId: contratto.condominio_id,
        piano: 'premium',
        contratto: { ...contratto, piano: 'premium' },
      });

      setStatusMessage('Contratto aggiornato a Premium con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore upgrade contratto: ' + (error.message || 'sconosciuto'));
    }
  };



  const sospendiContratto = async (contratto) => {
    try {
      const sospensioneCompleta = {
        stato: 'sospeso',
        sospeso_il: new Date().toISOString(),
        motivo_sospensione: 'Mancato pagamento',
      };

      let { error } = await supabase
        .from('contratti_condominio')
        .update(sospensioneCompleta)
        .eq('id', contratto.id);

      // Fallback prudente: se le colonne motivo_sospensione/sospeso_il non esistono ancora,
      // non blocchiamo l'operazione principale e aggiorniamo almeno lo stato contratto.
      if (error && String(error.message || '').toLowerCase().includes('column')) {
        const fallback = await supabase
          .from('contratti_condominio')
          .update({ stato: 'sospeso' })
          .eq('id', contratto.id);
        error = fallback.error;
      }

      if (error) throw error;
      setStatusMessage('Contratto sospeso per mancato pagamento.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore sospensione contratto: ' + (error.message || 'sconosciuto'));
    }
  };



  const riattivaContratto = async (contratto) => {
    try {
      const riattivazioneCompleta = {
        stato: 'attivo',
        sospeso_il: null,
        motivo_sospensione: null,
      };

      let { error } = await supabase
        .from('contratti_condominio')
        .update(riattivazioneCompleta)
        .eq('id', contratto.id);

      // Fallback prudente: se le colonne motivo_sospensione/sospeso_il non esistono ancora,
      // aggiorniamo almeno lo stato per rendere subito selezionabile il contratto.
      if (error && String(error.message || '').toLowerCase().includes('column')) {
        const fallback = await supabase
          .from('contratti_condominio')
          .update({ stato: 'attivo' })
          .eq('id', contratto.id);
        error = fallback.error;
      }

      if (error) throw error;
      setStatusMessage('Contratto riattivato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore riattivazione contratto: ' + (error.message || 'sconosciuto'));
    }
  };

  const uploadLavoroPrivatoFile = async (file, folder = 'lavori-privati') => {
    if (!file) return { url: '', name: '' };
    const safeName = file.name.split(' ').join('-');
    const fileName = `${folder}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from('allegati').upload(fileName, file, { upsert: false });
    if (error) throw error;
    return { url: buildPublicUrl(fileName), name: fileName };
  };

  const inviaNotificaLavoroPrivato = async (eventType, lavoro, extra = {}) => {
    try {
      if (!lavoro?.id) return null;
      const { data, error } = await supabase.functions.invoke('notify-lavoro-privato', {
        body: {
          eventType,
          lavoroId: lavoro.id,
          lavoro,
          extra,
          deepLink: `${AUTH_REDIRECT_URL}/?fromPush=1&lavoroPrivato=${lavoro.id}`,
        },
      });
      if (error) {
        console.warn('Notifica lavoro privato non inviata:', error.message || error);
        return null;
      }
      return data;
    } catch (error) {
      console.warn('Errore notifica lavoro privato:', error);
      return null;
    }
  };

  const creaLavoroPrivato = async (payload, file = null) => {
    try {
      let allegato = { url: '', name: '' };
      if (file) allegato = await uploadLavoroPrivatoFile(file, 'lavori-privati/richieste');

      const { data, error } = await supabase
        .from('lavori_privati')
        .insert({
          ...payload,
          allegato_url: allegato.url || null,
          allegato_nome: allegato.name || null,
        })
        .select()
        .single();

      if (error) throw error;

      await inviaNotificaLavoroPrivato('nuova_richiesta', data, { origine: 'app' });
      mostraToast('Richiesta inviata', 'Il gestore riceverà push, mail e WhatsApp.', 'success');
      await carica();
      return data;
    } catch (error) {
      console.error(error);
      mostraToast('Errore lavoro privato', error.message || 'Richiesta non salvata.', 'error');
      throw error;
    }
  };

  const aggiornaLavoroPrivato = async (lavoroId, updatePayload, eventType = 'aggiornamento') => {
    try {
      const { data, error } = await supabase
        .from('lavori_privati')
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq('id', lavoroId)
        .select()
        .single();

      if (error) throw error;

      await inviaNotificaLavoroPrivato(eventType, data, { updatePayload });
      mostraToast('Lavoro privato aggiornato', 'Aggiornamento salvato e notifica inviata.', 'success');
      await carica();
      return data;
    } catch (error) {
      console.error(error);
      mostraToast('Errore aggiornamento', error.message || 'Aggiornamento non riuscito.', 'error');
      throw error;
    }
  };

  const creaFatturaLavoroPrivato = async (payload, lavoro) => {
    try {
      const { data, error } = await supabase
        .from('fatture_lavori_privati')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await inviaNotificaLavoroPrivato('fattura_inserita', lavoro, { fattura: data });
      mostraToast('Fattura salvata', 'Fattura lavoro privato salvata.', 'success');
      await carica();
      return data;
    } catch (error) {
      console.error(error);
      mostraToast('Errore fattura', error.message || 'Fattura non salvata.', 'error');
      throw error;
    }
  };

  const aggiornaFatturaLavoroPrivato = async (fatturaId, updatePayload, lavoro) => {
    try {
      const { data, error } = await supabase
        .from('fatture_lavori_privati')
        .update({ ...updatePayload, updated_at: new Date().toISOString() })
        .eq('id', fatturaId)
        .select()
        .single();

      if (error) throw error;

      await inviaNotificaLavoroPrivato('fattura_aggiornata', lavoro, { fattura: data });
      mostraToast('Fattura aggiornata', 'Stato fattura aggiornato.', 'success');
      await carica();
      return data;
    } catch (error) {
      console.error(error);
      mostraToast('Errore fattura', error.message || 'Aggiornamento fattura non riuscito.', 'error');
      throw error;
    }
  };


  const logout = async () => {
    try {
      setStatusMessage('Uscita in corso. Pulizia sessione dispositivo...');

      try {
        if (typeof OneSignal?.logout === 'function') {
          await OneSignal.logout();
        }
      } catch (oneSignalError) {
        console.warn('Logout OneSignal non completato:', oneSignalError);
      }

      await supabase.auth.signOut();

      try {
        const chiaviDaRimuovere = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (
            key &&
            (
              key.includes('csp') ||
              key.includes('supabase') ||
              key.includes('onesignal') ||
              key.includes('OneSignal')
            )
          ) {
            chiaviDaRimuovere.push(key);
          }
        }
        chiaviDaRimuovere.forEach((key) => localStorage.removeItem(key));
      } catch (storageError) {
        console.warn('Pulizia localStorage non completata:', storageError);
      }

      try {
        sessionStorage.clear();
      } catch (sessionError) {
        console.warn('Pulizia sessionStorage non completata:', sessionError);
      }

      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames
              .filter((cacheName) => cacheName.toLowerCase().includes('csp') || cacheName.toLowerCase().includes('workbox') || cacheName.toLowerCase().includes('onesignal'))
              .map((cacheName) => caches.delete(cacheName))
          );
        }
      } catch (cacheError) {
        console.warn('Pulizia cache non completata:', cacheError);
      }

      setUtente(null);
      setUserProfile(null);
      setRuolo('');
      setDettaglioAperto(null);

      window.location.replace(`/?logout=${Date.now()}`);
    } catch (error) {
      console.error('Errore logout pulito:', error);
      await supabase.auth.signOut();
      window.location.replace(`/?logout=${Date.now()}`);
    }
  };

  if (loading && !utente) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-600 shadow-sm">
          Accesso in corso...
        </div>
      </div>
    );
  }
  if (!utente) return <Login />;

  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-hidden bg-black p-6 text-white">
        <div className="relative flex w-full max-w-sm flex-col items-center text-center">
          <div className="absolute h-64 w-64 rounded-full bg-amber-300/10 blur-3xl csp-splash-glow" />
          <div className="relative csp-enter csp-premium-pulse rounded-[2.5rem] border border-amber-200/10 bg-black p-5 shadow-2xl shadow-amber-950/40">
            <LogoMark src={SPLASH_LOGO_SRC} className="h-44 w-auto md:h-56" />
          </div>
          <p className="relative csp-enter-slow mt-5 text-sm font-black tracking-[0.12em] text-slate-300">
            Gestione evoluta. Serenità reale.
          </p>
          <div className="relative mt-7 h-1.5 w-44 overflow-hidden rounded-full bg-white/10 shadow-inner shadow-black/20">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white csp-splash-progress" />
          </div>
          <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">preparo la tua area riservata</p>
        </div>
      </div>
    );
  }

  const gestoreSections = [
    { id: 'pratiche', label: 'Pratiche', subtitle: 'Operatività e segnalazioni' },
    { id: 'condominio', label: 'Condominio', subtitle: 'Anagrafiche e contratti' },
    { id: 'condomini-registrati', label: '🏢 Condomini registrati', subtitle: 'Piani, filtri e upgrade' },
    { id: 'amministratori', label: 'Amministratori', subtitle: 'CRM e sviluppo rete' },
    { id: 'tecnici', label: 'Tecnici', subtitle: 'CRM tecnico CaSP' },
    { id: 'territorio', label: 'Territorio', subtitle: 'Marginalità e Toscana' },
    { id: 'fatturazione', label: 'Fatturazione', subtitle: 'Partner, fatture e provvigioni' },
    { id: 'capitolato', label: '🏗️ Capitolato Senza Pensieri', subtitle: 'Grandi lavori e CaSP' },
    { id: 'campagne', label: 'Campagne', subtitle: 'Invii partner CaSP' },
    { id: 'lavori-privati', label: '🏠 La tua casa Senza Pensieri', subtitle: 'Contatto diretto con l’impresa' },
    { id: 'guadagni', label: '💰 Guadagni', subtitle: 'Control Room economica' },
    { id: 'report', label: '📄 I tuoi report', subtitle: 'Archivio report semestrali' },
    { id: 'rivista', label: '📰 La tua rivista', subtitle: 'Magazine e archivio uscite' },
  ];

  const amministratoreSections = [
    { id: 'pratiche', label: 'Pratiche', subtitle: 'Segnalazioni e vendite' },
    { id: 'condomini', label: '🏢 Condomini', subtitle: 'Schede, statistiche e upgrade' },
    { id: 'fatturazione', label: 'Fatturazione', subtitle: 'Fatture interventi, scadenze e PDF' },
    { id: 'capitolato', label: '🏗️ Capitolato Senza Pensieri', subtitle: 'Grandi lavori e CaSP' },
    ...(puoVedereGuadagniAmministratore ? [{ id: 'guadagni', label: 'Guadagni', subtitle: 'Provvigioni e fornitori' }] : []),
    { id: 'report', label: '📄 I tuoi report', subtitle: 'Archivio report semestrali' },
    { id: 'rivista', label: '📰 La tua rivista', subtitle: 'Magazine e archivio uscite' },
  ];

  const condominoSections = [
    { id: 'segnalazioni', label: 'Segnalazioni condominiali', subtitle: 'Pratiche del condominio' },
    { id: 'lavori-privati', label: '🏠 La tua casa Senza Pensieri', subtitle: 'Contatto diretto con l’impresa' },
    { id: 'report', label: '📄 I tuoi report', subtitle: 'Archivio report semestrali' },
    { id: 'rivista', label: '📰 La tua rivista', subtitle: 'Magazine e archivio uscite' },
  ];

  const sezioniMenuLaterale = ruoloNormalizzato === 'gestore'
    ? gestoreSections
    : isAmministratoreOperativo
      ? amministratoreSections
      : ['condominio', 'condomino'].includes(ruoloNormalizzato)
        ? condominoSections
        : [];

  const sezioneAttivaMenuLaterale = ruoloNormalizzato === 'gestore'
    ? gestoreSection
    : isAmministratoreOperativo
      ? amministratoreSection
      : ['condominio', 'condomino'].includes(ruoloNormalizzato)
        ? condominoSection
        : '';


  const menuCondominiLabel = Array.isArray(userProfile?.condomini) && userProfile.condomini.length
    ? userProfile.condomini.map((c) => c?.nome).filter(Boolean).join(', ')
    : (userProfile?.condominio || 'non specificato');
  const menuWhatsappText = 'Ciao Simone, sono ' + (userProfile?.nome || 'un utente') + ', del condominio ' + menuCondominiLabel + '. Ho bisogno di supporto tecnico.';
  const ruoloMenuLabel = (() => {
    if (!ruoloNormalizzato) return 'Profilo CSP';
    if (ruoloNormalizzato === 'condominio' || ruoloNormalizzato === 'condomino') return 'Condomino';
    return ruoloNormalizzato.charAt(0).toUpperCase() + ruoloNormalizzato.slice(1);
  })();

  const apriMenuLaterale = () => {
    setMenuLateraleInChiusura(false);
    setMenuLateraleAperto(true);
  };

  const chiudiMenuLaterale = () => {
    if (!menuLateraleAperto || menuLateraleInChiusura) return;
    setMenuLateraleInChiusura(true);
    window.setTimeout(() => {
      setMenuLateraleAperto(false);
      setMenuLateraleInChiusura(false);
    }, 520);
  };

  const apriSezioneDaMenuLaterale = (sectionId) => {
    if (!sectionId) return;
    let nextRoute = null;
    if (ruoloNormalizzato === 'gestore') {
      nextRoute = { role: 'gestore', section: sectionId };
      setGestoreSection(sectionId);
    } else if (isAmministratoreOperativo) {
      nextRoute = { role: 'amministratore', section: sectionId };
      setAmministratoreSection(sectionId);
    } else if (['condominio', 'condomino'].includes(ruoloNormalizzato)) {
      nextRoute = { role: 'condomino', section: sectionId };
      setCondominoSection(sectionId);
    }
    if (nextRoute) registraNavigazioneCsp(nextRoute);
    chiudiMenuLaterale();
  };

  const renderGestoreSectionTitle = (title, subtitle) => (
    <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Suite gestore</p>
      <h2 className="mt-1 text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 px-3 py-4 md:p-6">
      <ToastInterno toast={toastInterno} onClose={() => setToastInterno(null)} />
      <NotifichePushBox utenteEmail={utente?.email} />
      {showReportSemestrale && (
        <ReportSemestraleModal
          condomini={condominiVisibili}
          onClose={() => setShowReportSemestrale(false)}
          onInvia={inviaReportSemestrale}
          saving={sendingReportSemestrale}
        />
      )}
      {showRivistaModal && (
        <PubblicaRivistaModal
          onClose={() => setShowRivistaModal(false)}
          onPubblica={pubblicaRivistaCondominio}
          saving={sendingRivista}
        />
      )}
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 overflow-x-hidden">
        {sezioniMenuLaterale.length > 0 && (
          <LiveTopBar
            onOpenMenu={apriMenuLaterale}
            onRefresh={carica}
            loading={loading}
            userProfile={userProfile}
            pianoAbbonamento={pianoAbbonamentoCorrente}
          />
        )}

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

        {sezioniMenuLaterale.length > 0 && (
          <>
            {(menuLateraleAperto || menuLateraleInChiusura) && (
              <div className="fixed inset-0 z-[120] flex">
                <style>{`@keyframes cspMenuSlideIn { from { transform: translateX(-106%); opacity: 0.45; } 65% { transform: translateX(1.5%); opacity: 1; } to { transform: translateX(0); opacity: 1; } } @keyframes cspMenuSlideOut { from { transform: translateX(0); opacity: 1; } 35% { transform: translateX(1.5%); opacity: 1; } to { transform: translateX(-106%); opacity: 0.45; } } @keyframes cspOverlayFadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes cspOverlayFadeOut { from { opacity: 1; } to { opacity: 0; } }`}</style>
                <button
                  type="button"
                  className="absolute inset-0 z-[121] bg-slate-950/45 backdrop-blur-[2px]"
                  style={{ animation: menuLateraleInChiusura ? 'cspOverlayFadeOut 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'cspOverlayFadeIn 520ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                  onClick={chiudiMenuLaterale}
                  aria-label="Chiudi menu"
                />
                <aside
                  className="relative z-[122] flex h-full w-[86vw] max-w-sm flex-col overflow-hidden border-r border-emerald-100 bg-white shadow-2xl shadow-slate-950/30"
                  style={{ animation: menuLateraleInChiusura ? 'cspMenuSlideOut 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'cspMenuSlideIn 520ms cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <div className="border-b border-emerald-100/20 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 px-3 py-2 text-white">
                    <div className="flex items-center justify-start overflow-hidden">
                      <LogoMark className="h-18 w-auto max-w-full object-contain drop-shadow-2xl md:h-20" />
                    </div>
                  </div>
                  <nav className="flex-1 space-y-2 overflow-y-auto p-4 csp-scroll">
                    {sezioniMenuLaterale.map((section) => (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => apriSezioneDaMenuLaterale(section.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                          sezioneAttivaMenuLaterale === section.id
                            ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        <span className="block text-sm font-black">{section.label}</span>
                        <span className={`mt-1 block text-[11px] font-semibold ${sezioneAttivaMenuLaterale === section.id ? 'text-emerald-50' : 'text-slate-500'}`}>
                          {section.subtitle}
                        </span>
                      </button>
                    ))}
                  </nav>
                  <div className="border-t border-slate-100 bg-white px-4 py-4">
                    <a
                      href={'https://wa.me/393477921965?text=' + encodeURIComponent(menuWhatsappText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 shadow-md shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-lg"
                    >
                      Assistenza tecnica
                    </a>
                    <button
                      type="button"
                      onClick={logout}
                      className="mt-2 flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-red-50 hover:text-red-700 hover:shadow-md"
                    >
                      Logout
                    </button>
                    <div className="mt-4 bg-white text-center">
                      <p className="text-sm font-black leading-tight text-slate-900">{userProfile?.nome || utente?.email || 'Utente CSP'}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{ruoloMenuLabel}</p>
                      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{APP_VERSION_LABEL}</p>
                    </div>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}



        {ruoloNormalizzato === 'gestore' && gestoreSection === 'condomini-registrati' && (
          <GestoreCondominiRegistratiSuite
            condomini={condomini}
            contratti={contratti}
            utentiSistema={utentiSistema}
            utentiCondomini={utentiCondomini}
            segnalazioni={segnalazioni}
            capitolati={capitolatiSenzaPensieri}
          />
        )}

        {ruoloNormalizzato !== 'gestore' && (!isAmministratoreOperativo || amministratoreSection === 'pratiche') && (!['condominio', 'condomino'].includes(ruoloNormalizzato) || condominoSection === 'segnalazioni') && (
          <>
            <ActionBar
              condomini={condominiVisibili}
              filtroCondominioId={filtroCondominioId}
              onChangeFiltroCondominio={setFiltroCondominioId}
              filtroStato={filtroStato}
              onChangeFiltroStato={setFiltroStato}
              searchTerm={searchTerm}
              onChangeSearchTerm={setSearchTerm}
              onRefresh={carica}
              loading={loading}
              ruolo={ruoloNormalizzato}
              showArchiviate={showArchiviate}
              onToggleArchiviate={() => setShowArchiviate((prev) => !prev)}
            />
          </>
        )}


        {isAmministratoreOperativo && amministratoreSection === 'pratiche' && (
          <section className="space-y-3 pb-36 md:pb-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Segnalazioni</h2>
            </div>
            {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
            <SmartMicroInsight ruolo={ruoloNormalizzato} piano={pianoAbbonamentoCorrente} segnalazioni={segnalazioniVisualizzate} subscriptionFlags={subscriptionFlagsCorrenti} />
            <UtilizzoCspCondominiale ruolo={ruoloNormalizzato} condomini={condominiVisibili} segnalazioni={segnalazioniVisualizzate} />
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
            ) : segnalazioniVisualizzate.length === 0 ? (
              <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
                {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} pianoAbbonamento={getPianoAbbonamentoCondominio(s.condominio_id, contratti)} showSubscriptionBadge={!['condominio', 'condomino'].includes(ruoloNormalizzato)} />)}
              </div>
            )}
          </section>
        )}

        {isAmministratoreOperativo && amministratoreSection === 'condomini' && (
          <CondominiOperativiSuite
            condomini={condominiVisibili}
            segnalazioni={segnalazioniVisualizzate}
            capitolati={capitolatiSenzaPensieri}
            contratti={contratti}
            utentiCondomini={utentiCondomini}
          />
        )}

        {ruolo === 'non_configurato' && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Il tuo profilo non è configurato nella tabella utenti.
          </div>
        )}

        {isAmministratoreOperativo && amministratoreSection === 'pratiche' && (
          <>
            <div className="-mt-2">
              <DashboardOperativa ruolo={ruoloNormalizzato} segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} onOpen={setDettaglioAperto} />
            </div>
          </>
        )}

        {puoVedereFattureOperative && amministratoreSection === 'fatturazione' && (
          <FatturazioneAmministratoreSuite
            fatturePartner={fatturePartner}
            condomini={condomini}
            aziendePartner={aziendePartner}
            contratti={contratti}
            partnerOnboardingCaSP={partnerOnboardingCaSP}
          />
        )}

        {puoVedereGuadagniAmministratore && amministratoreSection === 'guadagni' && (
          <GuadagniAmministratoreSuite
            fatturePartner={fatturePartner}
            fattureProvvigioniAmministratori={fattureProvvigioniAmministratori}
            aziendePartner={aziendePartner}
            contratti={contratti}
            partnerOnboardingCaSP={partnerOnboardingCaSP}
          />
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'pratiche' && (
          <>
            {renderGestoreSectionTitle('Pratiche', 'Cruscotto operativo, flusso lavori, segnalazioni ed economia delle pratiche.')}
            <ActionBar
              condomini={condominiVisibili}
              filtroCondominioId={filtroCondominioId}
              onChangeFiltroCondominio={setFiltroCondominioId}
              filtroStato={filtroStato}
              onChangeFiltroStato={setFiltroStato}
              searchTerm={searchTerm}
              onChangeSearchTerm={setSearchTerm}
              onRefresh={carica}
              loading={loading}
              ruolo={ruoloNormalizzato}
              showArchiviate={showArchiviate}
              onToggleArchiviate={() => setShowArchiviate((prev) => !prev)}
            />

            <div className="-mt-2">
              <DashboardOperativa ruolo={ruoloNormalizzato} segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} onOpen={setDettaglioAperto} />
            </div>

            <DashboardStatiGestore segnalazioni={segnalazioniVisualizzate} onOpen={setDettaglioAperto} />

            <section className="space-y-3 pb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Segnalazioni operative</h2>
                  <p className="text-sm text-slate-500">Elenco pratiche filtrate, sempre in evidenza per il lavoro quotidiano.</p>
                </div>
              </div>
              {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
              ) : segnalazioniVisualizzate.length === 0 ? (
                <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
                  {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} pianoAbbonamento={getPianoAbbonamentoCondominio(s.condominio_id, contratti)} showSubscriptionBadge={!['condominio', 'condomino'].includes(ruoloNormalizzato)} />)}
                </div>
              )}
            </section>

            <DashboardEconomica segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} />
            {showArchiviate && (
              <DashboardStorico segnalazioni={segnalazioniVisualizzate} />
            )}
          </>
        )}


        {ruoloNormalizzato === 'gestore' && gestoreSection === 'condominio' && (
          <>
            {renderGestoreSectionTitle('Condominio', 'Anagrafiche, contratti, rinnovi, pagamenti, business, assemblee e report.')}
            <GestioneAnagraficheBox condomini={condomini} amministratori={amministratoriAnagrafiche} utentiSistema={utentiSistema} utentiCondomini={utentiCondomini} onSaved={carica} />
            <ArchivioContrattiAttiviCards condomini={condomini} contratti={contratti} onRinnovaContratto={rinnovaContratto} onUpgradeContratto={upgradeContratto} onSospendiContratto={sospendiContratto} onRiattivaContratto={riattivaContratto} />
            <GestioneContratti condomini={condomini} contratti={contratti} onCreateContratto={creaContratto} onRinnovaContratto={rinnovaContratto} onUpgradeContratto={upgradeContratto} onSospendiContratto={sospendiContratto} onRiattivaContratto={riattivaContratto} />
            <GestioneRinnoviContratti
              contratti={contratti}
              onRinnovaContratto={rinnovaContratto}
              onUpgradeContratto={upgradeContratto}
            />
            <DashboardPagamenti contratti={contratti} />
            <DashboardAbbonamenti contratti={contratti} />
            <DashboardAssemblea segnalazioni={segnalazioniVisualizzate} votiPreventivi={votiPreventivi} />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'amministratori' && (
          <>
            {renderGestoreSectionTitle('Amministratori', 'CRM, lead, ranking, espansione e pipeline commerciale.')}
            <DashboardCRM contratti={contratti} condomini={condomini} />
            <GestioneLeadAmministratori onCreateLead={creaLeadAmministratore} />
            <DashboardLeadAmministratori leadAmministratori={leadAmministratori} onUpdateLead={aggiornaLeadAmministratore} />
            <DashboardRanking contratti={contratti} condomini={condomini} />
            <DashboardEspansione contratti={contratti} condomini={condomini} />
            <DashboardLeadPipeline contratti={contratti} condomini={condomini} />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'tecnici' && (
          <>
            {renderGestoreSectionTitle('Tecnici', 'CRM tecnici, studi tecnici, import/export e sviluppo CaSP.')}
            <DashboardLeadTecnici leadTecnici={leadTecnici} onCreateLeadTecnico={creaLeadTecnico} onUpdateLeadTecnico={aggiornaLeadTecnico} onImportLeadTecnici={importaLeadTecnici} />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'territorio' && (
          <>
            {renderGestoreSectionTitle('Territorio', 'Marginalità, Toscana, opportunità territoriali, lead locali e forecast.')}
            <DashboardMarginalita contratti={contratti} />
            <DashboardTerritorioToscana contratti={contratti} condomini={condomini} />
            <DashboardProvinceOpportunita contratti={contratti} condomini={condomini} />
            <DashboardLeadCommercialeToscana contratti={contratti} condomini={condomini} />
            <DashboardForecast contratti={contratti} />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'fatturazione' && (
          <>
            {renderGestoreSectionTitle('Fatturazione', 'Aziende partner, fatture CSP/CaSeP, pagamenti, provvigioni e liquidazioni.')}
            <FatturazionePartnerSuite
              aziendePartner={aziendePartner}
            contratti={contratti}
            partnerOnboardingCaSP={partnerOnboardingCaSP}
              provvigioniPartner={provvigioniPartner}
              fatturePartner={fatturePartner}
              provvigioniMaturate={provvigioniMaturate}
              fattureProvvigioniGestore={fattureProvvigioniGestore}
              fattureProvvigioniAmministratori={fattureProvvigioniAmministratori}
              condomini={condomini}
              segnalazioni={segnalazioni}
              utentiSistema={utentiSistema}
              leadAmministratori={leadAmministratori}
              capitolatiSenzaPensieri={capitolatiSenzaPensieri}
              onCreateAziendaPartner={creaAziendaPartner}
              onUpdateAziendaPartner={aggiornaAziendaPartner}
              onCreateProvvigionePartner={creaProvvigionePartner}
              onCreateFatturaPartner={creaFatturaPartner}
              onUpdateFatturaPartner={aggiornaFatturaPartner}
              onInviaFatturaPartner={inviaFatturaPartner}
              onUploadFatturaPdf={uploadFatturaPdf}
              onCreateFatturaProvvigioneGestore={creaFatturaProvvigioneGestore}
              onUpdateFatturaProvvigioneGestore={aggiornaFatturaProvvigioneGestore}
              onCreateFatturaProvvigioneAmministratore={creaFatturaProvvigioneAmministratore}
              onUpdateFatturaProvvigioneAmministratore={aggiornaFatturaProvvigioneAmministratore}
            />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'capitolato' && (
          <>
            {renderGestoreSectionTitle('Capitolato Senza Pensieri', 'Grandi lavori, capitolati, tecnici incaricati e conversione verso CaSP.')}
            <CapitolatoSenzaPensieriSuite
              ruolo={ruoloNormalizzato}
              userProfile={userProfile}
              capitolati={capitolatiSenzaPensieri}
              capitolatiEventi={capitolatiEventi}
              condomini={condomini}
              utentiSistema={utentiSistema}
              utentiCondomini={utentiCondomini}
              votiAssembleaCasep={votiAssembleaCasep}
              onSaveVotoAssembleaCasep={salvaVotoAssembleaCasep}
              aziendePartner={aziendePartner}
            contratti={contratti}
            partnerOnboardingCaSP={partnerOnboardingCaSP}
              onCreateCapitolato={creaCapitolatoSenzaPensieri}
              onUpdateCapitolato={aggiornaCapitolatoSenzaPensieri}
              onDeleteCapitolato={cancellaCapitolatoSenzaPensieri}
              onUploadCapitolatoPdf={uploadCapitolatoPdf}
            />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'campagne' && (
          <>
            {renderGestoreSectionTitle('Campagne Partner CaSP', 'Storico invii, KPI campagne e monitoraggio commerciale partner.')}
            <CampagnePartnerSuite
              partnerCampaignLog={partnerCampaignLog}
              aziendePartner={aziendePartner}
            />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'lavori-privati' && (
          <>
            {renderGestoreSectionTitle('La tua casa Senza Pensieri', 'Spazio dedicato ai lavori e alla cura della casa, con preventivi, documenti e aggiornamenti sempre disponibili.')}
            <LavoriPrivatiSuite
              ruolo={ruoloNormalizzato}
              userProfile={userProfile}
              condomini={condomini}
              lavoriPrivati={lavoriPrivati}
              fattureLavoriPrivati={fattureLavoriPrivati}
              aziendePartner={aziendePartner}
              lavoroApertoId={lavoroPrivatoApertoId}
              onClearDeepLink={() => setLavoroPrivatoApertoId(null)}
              onCreateLavoro={creaLavoroPrivato}
              onUpdateLavoro={aggiornaLavoroPrivato}
              onCreateFattura={creaFatturaLavoroPrivato}
              onUpdateFattura={aggiornaFatturaLavoroPrivato}
              onUploadFile={uploadLavoroPrivatoFile}
              onRefresh={carica}
              subscriptionFlags={getSubscriptionFlags('premium')}
            />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'guadagni' && (
          <GuadagniGestoreDashboard
            contratti={contratti}
            segnalazioni={segnalazioni}
            capitolati={capitolatiSenzaPensieri}
            lavoriPrivati={lavoriPrivati}
            fattureLavoriPrivati={fattureLavoriPrivati}
            fatturePartner={fatturePartner}
            fattureProvvigioniGestore={fattureProvvigioniGestore}
          />
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'report' && (
          <>
            {renderGestoreSectionTitle('I tuoi report', 'Archivio report semestrali e documentazione premium pubblicata per i condomini.')}
            <ArchivioReportPremium
              reports={reportVisibili}
              ruolo={ruoloNormalizzato}
              canSend={true}
              onOpenInvia={() => setShowReportSemestrale(true)}
            />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && gestoreSection === 'rivista' && (
          <>
            {renderGestoreSectionTitle('La tua rivista', 'Magazine Condominio Senza Pensieri, uscite bimestrali e archivio digitale.')}
            <LaTuaRivistaSuite
              riviste={rivisteCondominio}
              ruolo={ruoloNormalizzato}
              canPublish={true}
              onOpenPubblica={() => setShowRivistaModal(true)}
            />
          </>
        )}

        {isAmministratoreOperativo && amministratoreSection === 'report' && (
          <ArchivioReportPremium
            reports={reportVisibili}
            ruolo={ruoloNormalizzato}
            canSend={false}
          />
        )}

        {isAmministratoreOperativo && amministratoreSection === 'rivista' && (
          <LaTuaRivistaSuite
            riviste={rivisteCondominio}
            ruolo={ruoloNormalizzato}
            canPublish={false}
          />
        )}

        {isAmministratoreOperativo && amministratoreSection === 'capitolato' && (
          <CapitolatoSenzaPensieriSuite
            ruolo={ruoloNormalizzato}
            userProfile={userProfile}
            capitolati={capitolatiSenzaPensieri}
            condomini={condominiVisibili}
            utentiSistema={utentiSistema}
            utentiCondomini={utentiCondomini}
            votiAssembleaCasep={votiAssembleaCasep}
            onSaveVotoAssembleaCasep={salvaVotoAssembleaCasep}
            aziendePartner={aziendePartner}
            contratti={contratti}
            partnerOnboardingCaSP={partnerOnboardingCaSP}
            onCreateCapitolato={creaCapitolatoSenzaPensieri}
            onUpdateCapitolato={aggiornaCapitolatoSenzaPensieri}
            onDeleteCapitolato={cancellaCapitolatoSenzaPensieri}
            onUploadCapitolatoPdf={uploadCapitolatoPdf}
          />
        )}

        {['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'segnalazioni' && (
          <section className="space-y-3 pb-36 md:pb-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold">Segnalazioni</h2>
            </div>
            {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
            <SmartMicroInsight ruolo={ruoloNormalizzato} piano={pianoAbbonamentoCorrente} segnalazioni={segnalazioniVisualizzate} subscriptionFlags={subscriptionFlagsCorrenti} />
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
            ) : segnalazioniVisualizzate.length === 0 ? (
              <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
                {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} pianoAbbonamento={getPianoAbbonamentoCondominio(s.condominio_id, contratti)} showSubscriptionBadge={!['condominio', 'condomino'].includes(ruoloNormalizzato)} />)}
              </div>
            )}
          </section>
        )}
        {['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'report' && (
          contrattoCorrenteSospeso ? (
            <SubscriptionLockedCard
              required="plus"
              title="Servizio temporaneamente non attivo"
              text="Il contratto CSP del condominio risulta sospeso. I report torneranno disponibili alla riattivazione del servizio."
            />
          ) : subscriptionFlagsCorrenti.isPlus || subscriptionFlagsCorrenti.isPremium ? (
            <ArchivioReportPremium
              reports={reportVisibili}
              ruolo={ruoloNormalizzato}
              canSend={false}
            />
          ) : (
            <SubscriptionLockedCard
              required="plus"
              title="I tuoi report sono disponibili con CSP Plus"
              text="Il piano Base mantiene le funzioni operative essenziali. Con Plus e Premium il condominio accede alla memoria documentale dell’immobile e ai report dedicati."
            />
          )
        )}

        {['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'rivista' && (
          contrattoCorrenteSospeso ? (
            <SubscriptionLockedCard
              required="plus"
              title="Servizio temporaneamente non attivo"
              text="Il contratto CSP del condominio risulta sospeso. La rivista tornerà disponibile alla riattivazione del servizio."
            />
          ) : (
            <LaTuaRivistaSuite
              riviste={rivisteCondominio}
              ruolo={ruoloNormalizzato}
              canPublish={false}
            />
          )
        )}
        {['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'lavori-privati' && (
          contrattoCorrenteSospeso ? (
            <SubscriptionLockedCard
              required="plus"
              title="Servizio temporaneamente non attivo"
              text="Il contratto CSP del condominio risulta sospeso. LSP tornerà disponibile alla riattivazione del servizio."
            />
          ) : subscriptionFlagsCorrenti.isPlus || subscriptionFlagsCorrenti.isPremium ? (
            <LavoriPrivatiSuite
              ruolo={ruoloNormalizzato}
              userProfile={userProfile}
              condomini={condominiVisibili}
              lavoriPrivati={lavoriPrivati}
              fattureLavoriPrivati={fattureLavoriPrivati}
              aziendePartner={aziendePartner}
              lavoroApertoId={lavoroPrivatoApertoId}
              onClearDeepLink={() => setLavoroPrivatoApertoId(null)}
              onCreateLavoro={creaLavoroPrivato}
              onUpdateLavoro={aggiornaLavoroPrivato}
              onCreateFattura={creaFatturaLavoroPrivato}
              onUpdateFattura={aggiornaFatturaLavoroPrivato}
              onUploadFile={uploadLavoroPrivatoFile}
              onRefresh={carica}
              subscriptionFlags={subscriptionFlagsCorrenti}
            />
          ) : (
            <SubscriptionLockedCard
              required="plus"
              title="La tua casa Senza Pensieri è disponibile con CSP Plus"
              text="Con Plus e Premium puoi usare LSP per richieste private, preventivi, documenti e aggiornamenti dedicati alla tua casa."
            />
          )
        )}

      </div>

      {puoCreareSegnalazioni && (
        (ruoloNormalizzato === 'gestore' && gestoreSection === 'pratiche') ||
        (isAmministratoreOperativo && amministratoreSection === 'pratiche') ||
        (['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'segnalazioni')
      ) && (
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

      {puoCreareSegnalazioni && (
        (ruoloNormalizzato === 'gestore' && gestoreSection === 'pratiche') ||
        (isAmministratoreOperativo && amministratoreSection === 'pratiche') ||
        (['condominio', 'condomino'].includes(ruoloNormalizzato) && condominoSection === 'segnalazioni')
      ) && showNuovaSegnalazione && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-3 md:p-4">
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
                selectedCondominioId={selectedCondominioId || filtroCondominioId}
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
        votazioniRiepiloghi={votazioniRiepiloghi}
        utentiCondomini={utentiCondomini}
        utentiSistema={utentiSistema}
        condomini={condomini}
        subscriptionFlags={getSubscriptionFlags(getPianoAbbonamentoCondominio(dettaglioAperto?.condominio_id, contratti))}
        pianoAbbonamento={getPianoAbbonamentoCondominio(dettaglioAperto?.condominio_id, contratti)}
        showSubscriptionBadge={!['condominio', 'condomino'].includes(ruoloNormalizzato)}
      />
    </div>
  );
}
