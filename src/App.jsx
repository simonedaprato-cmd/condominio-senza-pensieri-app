import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import OneSignal from 'react-onesignal';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
const APP_VERSION = '1.0.40';
const APP_VERSION_LABEL = 'CSP v1.0.40';
const isValoreVero = (value) => value === true || value === 'true' || value === 1 || value === '1';
const LOGO_SRC = '/logo-condominio-senza-pensieri.png';
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

      if (data?.success && Number(data?.records_updated || 0) > 0) {
        setDispositivoSalvato(true);
        setMessaggio('');
        return true;
      }

      console.warn('Subscription inviata ma nessun record salvato:', data);
      setMessaggio('Dispositivo rilevato, ma non salvato nella tabella push. Controlla la risposta sotto.');
      return false;
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
  const [codiceOtp, setCodiceOtp] = useState('');
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

    setMessaggio('Email inviata. Da iPhone non aprire il link: copia il codice OTP e inseriscilo qui nell’app.');
  };

  const verificaCodice = async () => {
    const emailPulita = email.trim().toLowerCase();
    const token = codiceOtp.trim().replace(/\s+/g, '');

    if (!emailPulita) return setMessaggio('Inserisci prima la tua email.');
    if (!token) return setMessaggio('Inserisci il codice OTP ricevuto via email.');

    setInvioInCorso(true);
    setMessaggio('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: emailPulita,
        token,
        type: 'email',
      });

      if (error) throw error;
      setMessaggio('Accesso confermato. Caricamento area riservata...');
    } catch (error) {
      console.error(error);
      setMessaggio('Errore verifica codice: ' + (error.message || 'codice non valido o scaduto'));
    } finally {
      setInvioInCorso(false);
    }
  };

  const incollaDaClipboard = async () => {
    try {
      if (!navigator?.clipboard?.readText) {
        return setMessaggio('Copia automatica non supportata su questo dispositivo.');
      }

      const testo = await navigator.clipboard.readText();
      if (!testo) return setMessaggio('Nessun codice trovato negli appunti.');

      setCodiceOtp(testo.replace(/\s+/g, ''));
      setMessaggio('Codice incollato automaticamente.');
    } catch (error) {
      console.error(error);
      setMessaggio('Impossibile leggere gli appunti. Incolla manualmente il codice.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm csp-enter csp-touch-card">
        <div className="mb-5 flex flex-col items-center rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-center shadow-inner">
          <LogoMark />
          <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-amber-300">Condominio Senza Pensieri</p>
          <p className="mt-1 text-xs text-white/70">Gestione evoluta. Serenità reale.</p>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Accesso</h1>
        <p className="mt-2 text-sm text-slate-500">Inserisci la tua email per ricevere il link di accesso. Da iPhone usa il codice OTP: il link può aprire Safari e non l’app installata.</p>
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
          {invioInCorso ? 'Invio...' : 'Ricevi link / codice'}
        </button>
        <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          <strong>Accesso iPhone:</strong> apri l’app dalla Home, richiedi l’email, poi copia il codice OTP dalla mail e rientra qui. Non usare il link della mail su iPhone.
        </div>
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Accesso con codice OTP</p>
          <p className="mt-1 text-xs text-slate-500">
            Su iPhone usa sempre questo metodo: non aprire il link, copia il codice ricevuto via email e inseriscilo qui.
          </p>
          <input
            value={codiceOtp}
            onChange={(e) => setCodiceOtp(e.target.value)}
            placeholder="Codice OTP"
            className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={incollaDaClipboard}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 shadow-sm"
            >
              Incolla codice
            </button>
            <button
              type="button"
              onClick={verificaCodice}
              disabled={invioInCorso || !email.trim() || !codiceOtp.trim()}
              className="rounded-2xl bg-slate-900 px-4 py-3 font-bold text-white shadow-lg shadow-slate-900/20 disabled:opacity-60"
            >
              Entra con OTP
            </button>
          </div>
        </div>
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
    <header className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-800 px-2 pb-6 pt-6 shadow-[0_35px_120px_-30px_rgba(5,150,105,0.85)] backdrop-blur-2xl transition-all duration-500 ease-out hover:shadow-[0_45px_140px_-35px_rgba(5,150,105,0.95)] md:px-6 md:pb-8 md:pt-12">
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

      <div className="pointer-events-none absolute bottom-3 right-4 z-10 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-white/80 shadow-sm backdrop-blur">
        {APP_VERSION_LABEL}
      </div>
    </header>
  );
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


function FatturazionePartnerSuite({
  aziendePartner,
  provvigioniPartner,
  fatturePartner,
  provvigioniMaturate,
  fattureProvvigioniGestore,
  condomini,
  segnalazioni,
  utentiSistema,
  onCreateAziendaPartner,
  onUpdateAziendaPartner,
  onCreateProvvigionePartner,
  onCreateFatturaPartner,
  onUpdateFatturaPartner,
  onInviaFatturaPartner,
  onUploadFatturaPdf,
  onCreateFatturaProvvigioneGestore,
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
    ].some((value) => String(value || '').toLowerCase().includes(search));
  });

  const updateFattura = (field, value) => {
    setFatturaForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'importo_imponibile' || field === 'iva') {
        const imponibile = Number(field === 'importo_imponibile' ? value : next.importo_imponibile || 0);
        const ivaPercentuale = Number(field === 'iva' ? value : next.iva || 0);
        next.totale = Math.round((imponibile + (imponibile * ivaPercentuale / 100)) * 100) / 100;
      }

      return next;
    });
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
      }
    } catch (error) {
      console.error(error);
      alert('Errore caricamento PDF fattura: ' + (error.message || 'sconosciuto'));
    } finally {
      setUploadingFatturaPdf(false);
    }
  };

  const amministratori = (utentiSistema || []).filter((u) => String(u.ruolo || '').toLowerCase() === 'amministratore');
  const praticheChiuse = (segnalazioni || []).filter((s) => String(s.stato || '').toLowerCase().trim() === 'chiusa');


  const fatturatoTotale = (fatturePartner || []).reduce((sum, fattura) => sum + Number(fattura.totale || 0), 0);
  const fatturatoPagato = (fatturePartner || []).filter((f) => f.stato === 'pagata').reduce((sum, fattura) => sum + Number(fattura.totale || 0), 0);
  const fattureScadute = (fatturePartner || []).filter((f) => f.stato === 'scaduta').length;
  const provvigioniGestore = (provvigioniMaturate || []).reduce((sum, p) => sum + Number(p.importo_gestore || 0), 0);
  const provvigioniAmministratori = (provvigioniMaturate || []).reduce((sum, p) => sum + Number(p.importo_amministratore || 0), 0);
  const mieProvvigioniFatturate = (fattureProvvigioniGestore || []).reduce((sum, f) => sum + Number(f.importo_imponibile || 0), 0);
  const mieProvvigioniDaFatturare = Math.max(provvigioniGestore - mieProvvigioniFatturate, 0);

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
      note: '',
    });
  };

  const creaFattura = async (e) => {
    e.preventDefault();
    if (!fatturaForm.azienda_partner_id) return;

    await onCreateFatturaPartner({
      ...fatturaForm,
      azienda_partner_id: Number(fatturaForm.azienda_partner_id),
      condominio_id: fatturaForm.condominio_id ? Number(fatturaForm.condominio_id) : null,
      segnalazione_id: fatturaForm.segnalazione_id ? Number(fatturaForm.segnalazione_id) : null,
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <DashboardStat label="Fatturato totale" value={formatEuro(fatturatoTotale)} tone="slate" />
        <DashboardStat label="Fatturato pagato" value={formatEuro(fatturatoPagato)} tone="emerald" />
        <DashboardStat label="Fatture scadute" value={fattureScadute} tone="red" />
        <DashboardStat label="Provv. gestore" value={formatEuro(provvigioniGestore)} tone="sky" />
        <DashboardStat label="Provv. amministratori" value={formatEuro(provvigioniAmministratori)} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  <th className="px-3 py-3">Stato</th>
                  <th className="px-3 py-3 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {aziendeFiltrate.length === 0 ? (
                  <tr><td colSpan="5" className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Nessun fornitore trovato.</td></tr>
                ) : aziendeFiltrate.map((azienda) => {
                  const provv = provvigioneAttivaAzienda(azienda.id);
                  return (
                    <tr key={azienda.id} className="border-t border-slate-100 hover:bg-emerald-50/40">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{azienda.ragione_sociale}</p>
                        <p className="text-xs text-slate-500">{azienda.tipo_attivita || 'Attività n.d.'} • {azienda.citta || ''} {azienda.provincia || ''}</p>
                        <p className="text-xs text-slate-400">{azienda.partita_iva || 'P.IVA n.d.'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-700">{azienda.referente || 'n.d.'}</p>
                        <p className="text-xs text-slate-500">{azienda.telefono || ''}</p>
                        <p className="text-xs text-slate-500">{azienda.email || ''}</p>
                      </td>
                      <td className="px-3 py-3 font-black text-emerald-700">{provv ? `${Number(provv.percentuale_gestore || 0)}%` : '0%'}</td>
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

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
                {amministratori.map((u) => <option key={u.email} value={u.email}>{u.nome || u.email}</option>)}
              </select>
              <select value={fatturaForm.condominio_id} onChange={(e) => updateFattura('condominio_id', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="">Condominio</option>
                {(condomini || []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select value={fatturaForm.segnalazione_id} onChange={(e) => updateFattura('segnalazione_id', e.target.value)} className="rounded-2xl border border-slate-200 px-3 py-3">
                <option value="">Pratica collegata</option>
                {praticheChiuse.slice(0, 120).map((s) => <option key={s.id} value={s.id}>{s.titolo}</option>)}
              </select>
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

                  const saved = await onCreateFatturaPartner({
                    ...fatturaForm,
                    azienda_partner_id: Number(fatturaForm.azienda_partner_id),
                    condominio_id: fatturaForm.condominio_id ? Number(fatturaForm.condominio_id) : null,
                    segnalazione_id: fatturaForm.segnalazione_id ? Number(fatturaForm.segnalazione_id) : null,
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
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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

          <div className="max-h-[430px] overflow-auto rounded-3xl border border-slate-200 csp-scroll">
            <table className="min-w-[680px] w-full border-collapse text-sm">
              <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Fattura</th>
                  <th className="px-3 py-3">Azienda</th>
                  <th className="px-3 py-3 text-right">Imponibile</th>
                  <th className="px-3 py-3 text-right">Totale</th>
                </tr>
              </thead>
              <tbody>
                {(fattureProvvigioniGestore || []).length === 0 ? (
                  <tr><td colSpan="4" className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Nessuna fattura provvigione registrata.</td></tr>
                ) : (
                  fattureProvvigioniGestore.map((fattura) => (
                    <tr key={fattura.id} className="border-t border-slate-100 hover:bg-violet-50/40">
                      <td className="px-3 py-3">
                        <p className="font-black text-slate-900">{fattura.numero_fattura}</p>
                        <p className="text-xs text-slate-500">{fattura.data_fattura}</p>
                        {fattura.file_url && <a href={fattura.file_url} target="_blank" rel="noreferrer" className="text-xs font-black text-violet-700">PDF</a>}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'n.d.'}</td>
                      <td className="px-3 py-3 text-right font-black text-slate-900">{formatEuro(fattura.importo_imponibile || 0)}</td>
                      <td className="px-3 py-3 text-right font-black text-violet-700">{formatEuro(fattura.totale || 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-700">Elenco fatture</p>
            <h2 className="mt-1 text-xl font-bold">Fatture partner e pagamenti</h2>
          </div>
          <p className="text-xs font-bold text-slate-500">Segna “Pagata” per maturare automaticamente le provvigioni.</p>
        </div>

        <div className="mt-4 max-h-[520px] overflow-auto rounded-2xl border border-slate-200 csp-scroll">
          <table className="min-w-[980px] w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-[11px] font-black uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3">Fattura</th>
                <th className="px-3 py-3">Partner</th>
                <th className="px-3 py-3">Condominio</th>
                <th className="px-3 py-3">Amministratore</th>
                <th className="px-3 py-3 text-right">Totale</th>
                <th className="px-3 py-3">Stato</th>
                <th className="px-3 py-3 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {(fatturePartner || []).length === 0 ? (
                <tr><td colSpan="7" className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Nessuna fattura inserita.</td></tr>
              ) : (
                fatturePartner.map((fattura) => (
                  <tr key={fattura.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <p className="font-black text-slate-900">{fattura.numero_fattura || `Fattura #${fattura.id}`}</p>
                      <p className="text-xs text-slate-500">{fattura.data_emissione || 'n.d.'} • Scad. {fattura.data_scadenza || 'n.d.'}</p>
                      {fattura.file_url && <a href={fattura.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-sky-700">Apri PDF</a>}
                    </td>
                    <td className="px-3 py-3 font-semibold text-slate-700">{aziendaById(fattura.azienda_partner_id)?.ragione_sociale || 'n.d.'}</td>
                    <td className="px-3 py-3 text-slate-600">{condominioById(fattura.condominio_id)?.nome || 'n.d.'}</td>
                    <td className="px-3 py-3 text-slate-600">{fattura.amministratore_email || 'n.d.'}</td>
                    <td className="px-3 py-3 text-right font-black text-slate-900">{formatEuro(fattura.totale || 0)}</td>
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
                      <div className="flex justify-end gap-2">
                        {fattura.stato !== 'inviata' && fattura.stato !== 'pagata' && (
                          <button type="button" onClick={() => onInviaFatturaPartner(fattura.id)} className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-black text-white">
                            Invia
                          </button>
                        )}
                        {fattura.stato !== 'pagata' && (
                          <button type="button" onClick={() => onUpdateFatturaPartner(fattura.id, { stato: 'pagata', pagata_il: new Date().toISOString().slice(0, 10) })} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">
                            Pagata
                          </button>
                        )}
                        {fattura.stato !== 'scaduta' && fattura.stato !== 'pagata' && (
                          <button type="button" onClick={() => onUpdateFatturaPartner(fattura.id, { stato: 'scaduta' })} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white">
                            Scaduta
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

function DashboardVendite({ segnalazioni }) {
  const preventivi = segnalazioni.filter((s) => Number(s.importo_preventivo || 0) > 0);
  const deliberati = segnalazioni.filter((s) => s.stato_conversione === 'accettato');

  const totalePreventivi = preventivi.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const totaleDeliberato = deliberati.reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
  const daDeliberare = Math.max(totalePreventivi - totaleDeliberato, 0);
  const provvigione = totaleDeliberato * 0.10;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Vendite</p>
      <h2 className="mt-1 text-xl font-bold">Dashboard vendite amministratore</h2>
      <p className="mt-1 text-sm text-slate-500">Totale preventivi, deliberato, da deliberare e provvigione stimata al 10%.</p>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <DashboardStat label="Totale preventivi" value={formatEuro(totalePreventivi)} />
        <DashboardStat label="Totale deliberato" value={formatEuro(totaleDeliberato)} tone="emerald" />
        <DashboardStat label="Da deliberare" value={formatEuro(daDeliberare)} tone="amber" />
        <DashboardStat label="Provvigione 10%" value={formatEuro(provvigione)} tone="sky" />
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

function ArchivioReportPremium({ reports }) {
  if (!reports || reports.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Premium</p>
        <h2 className="text-xl font-black text-slate-900">Report condominio</h2>
        <p className="mt-1 text-sm text-slate-500">Archivio dei report semestrali disponibili.</p>
      </div>

      <div className="max-h-[288px] space-y-2 overflow-y-auto pr-1">
        {reports.map((report) => (
          <div key={report.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-black text-slate-900">{report.titolo}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {report.periodo} • {report.created_at ? new Date(report.created_at).toLocaleDateString('it-IT') : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={report.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-sm font-black text-white"
                >
                  Apri report
                </a>
                <a
                  href={`${report.file_url}?download=1`}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-center text-sm font-black text-emerald-700"
                >
                  Apri / Scarica
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reports.length > 3 && (
        <p className="mt-2 text-xs font-semibold text-emerald-700">
          Scorri il riquadro per visualizzare gli altri report disponibili.
        </p>
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
    <div className="fixed inset-0 z-[72] overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm">
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


function GestioneAnagraficheBox({ condomini, onSaved }) {
  const [tab, setTab] = useState('amministratore');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [adminForm, setAdminForm] = useState({ nome: '', email: '', telefono: '', studio: '' });
  const [condominioForm, setCondominioForm] = useState({ condominioNome: '', condominioIndirizzo: '', condominioCitta: '', amministratoreEmail: '' });
  const [condominoForm, setCondominoForm] = useState({ nome: '', email: '', telefono: '', condominioId: '', millesimi: '' });
  const [importCondominioId, setImportCondominioId] = useState('');
  const [importText, setImportText] = useState('');

  const invokeGestione = async (payload) => {
    setSaving(true);
    setMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('gestione-anagrafiche', {
        body: payload,
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error || 'Operazione non riuscita.');

      setMessage('Operazione completata correttamente.');
      await onSaved?.();
      return data;
    } catch (error) {
      setMessage(`Errore: ${error.message || 'operazione non riuscita'}`);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const parseImportRows = () => {
    return importText
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => {
        const parts = row.includes(';') ? row.split(';') : row.split(',');
        return {
          nome: String(parts[0] || '').trim(),
          email: String(parts[1] || '').trim(),
          millesimi: String(parts[2] || '').trim(),
          telefono: String(parts[3] || '').trim(),
        };
      });
  };

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Gestore</p>
          <h2 className="text-xl font-black text-slate-900">Gestione anagrafiche</h2>
          <p className="mt-1 text-sm text-slate-500">Inserisci amministratori, condomìni e condòmini senza accedere a Supabase.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['amministratore', 'Amministratore'],
            ['condominio', 'Condominio'],
            ['condomino', 'Condòmino'],
            ['import', 'Import condòmini'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTab(key);
                setMessage('');
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-black ${tab === key ? 'bg-emerald-600 text-white' : 'border border-emerald-100 bg-emerald-50 text-emerald-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-2xl border p-3 text-sm font-bold ${message.startsWith('Errore') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      )}

      {tab === 'amministratore' && (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = await invokeGestione({ action: 'crea_amministratore', ...adminForm });
            if (data?.success) setAdminForm({ nome: '', email: '', telefono: '', studio: '' });
          }}
        >
          <input value={adminForm.nome} onChange={(e) => setAdminForm({ ...adminForm, nome: e.target.value })} placeholder="Nome amministratore" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="Email" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={adminForm.telefono} onChange={(e) => setAdminForm({ ...adminForm, telefono: e.target.value })} placeholder="Telefono" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={adminForm.studio} onChange={(e) => setAdminForm({ ...adminForm, studio: e.target.value })} placeholder="Studio / riferimento" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60 md:col-span-2">
            {saving ? 'Salvataggio...' : 'Salva amministratore'}
          </button>
        </form>
      )}

      {tab === 'condominio' && (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = await invokeGestione({ action: 'crea_condominio', ...condominioForm });
            if (data?.success) setCondominioForm({ condominioNome: '', condominioIndirizzo: '', condominioCitta: '', amministratoreEmail: '' });
          }}
        >
          <input value={condominioForm.condominioNome} onChange={(e) => setCondominioForm({ ...condominioForm, condominioNome: e.target.value })} placeholder="Nome condominio" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominioForm.condominioIndirizzo} onChange={(e) => setCondominioForm({ ...condominioForm, condominioIndirizzo: e.target.value })} placeholder="Indirizzo" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominioForm.condominioCitta} onChange={(e) => setCondominioForm({ ...condominioForm, condominioCitta: e.target.value })} placeholder="Città" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominioForm.amministratoreEmail} onChange={(e) => setCondominioForm({ ...condominioForm, amministratoreEmail: e.target.value })} placeholder="Email amministratore associato" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60 md:col-span-2">
            {saving ? 'Salvataggio...' : 'Salva condominio'}
          </button>
        </form>
      )}

      {tab === 'condomino' && (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const data = await invokeGestione({ action: 'crea_condomino', ...condominoForm });
            if (data?.success) setCondominoForm({ nome: '', email: '', telefono: '', condominioId: '', millesimi: '' });
          }}
        >
          <select value={condominoForm.condominioId} onChange={(e) => setCondominoForm({ ...condominoForm, condominioId: e.target.value })} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
            <option value="">Seleziona condominio</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <input value={condominoForm.nome} onChange={(e) => setCondominoForm({ ...condominoForm, nome: e.target.value })} placeholder="Nome condòmino" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominoForm.email} onChange={(e) => setCondominoForm({ ...condominoForm, email: e.target.value })} placeholder="Email" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominoForm.telefono} onChange={(e) => setCondominoForm({ ...condominoForm, telefono: e.target.value })} placeholder="Telefono" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm" />
          <input value={condominoForm.millesimi} onChange={(e) => setCondominoForm({ ...condominoForm, millesimi: e.target.value })} placeholder="Millesimi" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm md:col-span-2" />
          <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60 md:col-span-2">
            {saving ? 'Salvataggio...' : 'Salva condòmino'}
          </button>
        </form>
      )}

      {tab === 'import' && (
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const rows = parseImportRows();
            const data = await invokeGestione({ action: 'importa_condomini', condominioId: importCondominioId, condomini: rows });
            if (data?.success) setImportText('');
          }}
        >
          <select value={importCondominioId} onChange={(e) => setImportCondominioId(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
            <option value="">Seleziona condominio</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder={'Formato: Nome; email; millesimi; telefono\\nMario Rossi; mario@email.it; 120; 333000000'}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"
          />
          <button disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">
            {saving ? 'Importazione...' : 'Importa condòmini'}
          </button>
        </form>
      )}
    </section>
  );
}


function ActionBar({ condomini, filtroCondominioId, onChangeFiltroCondominio, filtroStato, onChangeFiltroStato, searchTerm, onChangeSearchTerm, onRefresh, loading, ruolo, showArchiviate, onToggleArchiviate, onOpenReportPremium }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Azioni rapide</p>
          <p className="mt-1 text-sm text-slate-500">Filtra, cerca e aggiorna le pratiche.</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:grid-cols-[1fr_1fr_1fr_auto]">
          <select value={filtroCondominioId} onChange={(e) => onChangeFiltroCondominio(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
            <option value="">Tutti i condomini</option>
            {condomini.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          {ruolo === 'amministratore' && (
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
          <button onClick={onRefresh} disabled={loading} className="rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60">
            {loading ? 'Sincronizzo...' : 'Aggiorna live'}
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {ruolo === 'gestore' && (
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

function SegnalazioneCard({ segnalazione, onOpen }) {
  return (
    <button onClick={() => onOpen(segnalazione)} className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-md">
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

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote, onUploadFile, onUpdateImporto, ruolo, utenteEmail, onConversionePreventivo, onPianificaLavori, onGeneraReport, onGeneraPdfVotazioni, onCondividiCondomini, onVotoCondomino, onInviaReminderVoto, onInviaRipartoMillesimi, onDeletePratica, onRipristinaPratica, votiPreventivi, votazioniRiepiloghi = [], utentiCondomini, utentiSistema, onRefreshVoti }) {
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
      .filter((utente) => String(utente.ruolo || '').toLowerCase().trim() === 'condominio')
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
  const quotaUtenteRiparto = ripartoSalvato?.quote?.find((item) => {
    const emailQuota = String(item.email || item.utente_email || item.email_condomino || '').toLowerCase().trim();
    return emailQuota && emailQuota === emailUtentePulita;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-2 md:flex md:items-center md:justify-center md:overflow-hidden md:p-4">
      <div className="min-h-full w-full max-w-4xl rounded-2xl border border-white/60 bg-white shadow-2xl md:flex md:h-[90vh] md:min-h-0 md:flex-col md:overflow-hidden md:rounded-3xl">
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
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            {(ruolo === 'gestore' || ruolo === 'amministratore') && (
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
            {segnalazione.preventivourl && (ruolo !== 'condominio' || segnalazione.preventivo_condiviso_condomini) && (
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
                        {votoUtente && (
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Votato</p>
                            <p className="mt-1 text-sm font-bold text-emerald-800">Il tuo voto: {votoUtente.voto}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(ruolo === 'condominio' || ruolo === 'gestore') && (
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

                    {ruolo === 'amministratore' && nonVotanti.length > 0 && (
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

            {ruoloRipartoVisibile && ripartoSalvato && (
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

            {ruolo === 'amministratore' && ['Accettata', 'Pianificata', 'Chiusa'].includes(segnalazione.stato) && (
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


function AppHardUpdateBanner({ updateInfo, onUpdate, onDismiss }) {
  if (!updateInfo) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-4xl rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur md:bottom-5">
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
  const [ruolo, setRuolo] = useState('gestore');
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
  const [contratti, setContratti] = useState([]);
  const [leadAmministratori, setLeadAmministratori] = useState([]);
  const [aziendePartner, setAziendePartner] = useState([]);
  const [provvigioniPartner, setProvvigioniPartner] = useState([]);
  const [fatturePartner, setFatturePartner] = useState([]);
  const [provvigioniMaturate, setProvvigioniMaturate] = useState([]);
  const [fattureProvvigioniGestore, setFattureProvvigioniGestore] = useState([]);
  const [utentiCondomini, setUtentiCondomini] = useState([]);
  const [utentiSistema, setUtentiSistema] = useState([]);
  const [showReportSemestrale, setShowReportSemestrale] = useState(false);
  const [sendingReportSemestrale, setSendingReportSemestrale] = useState(false);


  const [reportCondominio, setReportCondominio] = useState([]);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const puoCreareSegnalazioni = ruoloNormalizzato === 'amministratore' || ruoloNormalizzato === 'condominio';


  const mostraToast = (title, message = '', tone = 'info') => {
    setToastInterno({ title, message, tone, createdAt: Date.now() });

    window.clearTimeout(window.__cspToastTimer);
    window.__cspToastTimer = window.setTimeout(() => {
      setToastInterno(null);
    }, 4200);
  };

  const inviaNotificaCondominio = async ({
    condominioId,
    destinatari = 'tutti',
    title,
    message,
    tipo = 'generica',
    riferimentoId = null,
  }) => {
    try {
      if (!condominioId) return null;

      const { data, error } = await supabase.functions.invoke('notify-condominio', {
        body: {
          condominioId: Number(condominioId),
          destinatari,
          title,
          message,
          tipo,
          riferimentoId,
        },
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


  const hasPreventiviBanner = ruoloNormalizzato !== 'condominio' && segnalazioniVisualizzate.some((s) => s.stato_invio === 'inviato' && !s.stato_conversione);

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

      const query = params.toString();
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      window.history.replaceState({}, document.title, nextUrl);
    }
  }, [utente, segnalazioni]);

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

      const { data: leadData, error: leadError } = await supabase
        .from('lead_amministratori')
        .select('*')
        .order('created_at', { ascending: false });

      if (leadError && leadError.code !== 'PGRST116') throw leadError;
      setLeadAmministratori(leadData || []);

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

      const { data: utentiCondominiData, error: utentiCondominiError } = await supabase
        .from('utenti_condomini')
        .select('email, condominio_id, millesimi, ruolo, onesignal_subscription_id');

      if (utentiCondominiError && utentiCondominiError.code !== 'PGRST116') throw utentiCondominiError;
      setUtentiCondomini(utentiCondominiData || []);

      const { data: utentiSistemaData, error: utentiSistemaError } = await supabase
        .from('utenti')
        .select('email, ruolo, nome, onesignal_subscription_id');

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
    }, 1300);

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
      const { error } = await supabase.from('segnalazioni').insert({
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim(),
        categoria: form.categoria,
        priorita: form.priorita,
        luogo: form.luogo.trim(),
        referente: form.referente.trim(),
        telefono: form.telefono.trim(),
        condominio_id: condominioId,
        stato: 'Presa in carico',
        allegatonome,
        amministratore_email: utente?.email || '',
        amministratore_telefono: userProfile?.telefono || '',
        note: [],
      });
      if (error) throw error;

      try {
        const nomeCondominio = condomini.find((c) => Number(c.id) === condominioId)?.nome || 'il tuo condominio';
        const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-condominio', {
          body: {
            condominioId,
            title: 'Nuova segnalazione',
            message: `È stata inserita una nuova segnalazione per ${nomeCondominio}. Apri l’app per i dettagli.`,
          },
        });

        if (notifyError) {
          console.warn('Notifica push nuova segnalazione non inviata:', notifyError.message || notifyError);
        } else {
          console.info('Notifica push nuova segnalazione inviata:', notifyData);
        }
      } catch (notifyCatchError) {
        console.warn('Errore chiamata notify-condominio:', notifyCatchError);
      }

      setShowNuovaSegnalazione(false);
      await carica();
      setStatusMessage('Segnalazione salvata correttamente.');
      mostraToast('Nuova segnalazione creata', 'La pratica è stata salvata e la notifica è stata inviata agli utenti collegati al condominio.', 'success');
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

  const creaLeadAmministratore = async (lead) => {
    try {
      const { error } = await supabase.from('lead_amministratori').insert({
        ...lead,
        stato_pipeline: lead.stato_pipeline || 'potenziale',
      });

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
      const { error } = await supabase
        .from('lead_amministratori')
        .update(updatePayload)
        .eq('id', leadId);

      if (error) throw error;

      setLeadAmministratori((prev) => prev.map((lead) => (
        Number(lead.id) === Number(leadId) ? { ...lead, ...updatePayload } : lead
      )));

      setStatusMessage('Lead amministratore aggiornato con successo.');
      await carica();
    } catch (error) {
      console.error(error);
      alert('Errore aggiornamento lead: ' + (error.message || 'sconosciuto'));
    }
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
      setRuolo('gestore');
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-700 p-6 text-white">
        <div className="flex flex-col items-center text-center">
          <div className="csp-enter csp-premium-pulse rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl transition-all duration-700 ease-out hover:scale-[1.02]">
            <LogoMark className="h-28 w-auto md:h-40" />
          </div>
          <p className="csp-enter-slow mt-6 text-xs font-black uppercase tracking-[0.35em] text-emerald-100">
            Condominio Senza Pensieri
          </p>
          <p className="mt-2 text-sm text-emerald-50/80">
            Gestione evoluta. Serenità reale.
          </p>
          <div className="mt-6 h-1.5 w-36 overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-300" />
          </div>
        </div>
      </div>
    );
  }

  const gestoreSections = [
    { id: 'pratiche', label: 'Pratiche', subtitle: 'Operatività e segnalazioni' },
    { id: 'condominio', label: 'Condominio', subtitle: 'Anagrafiche, contratti e report' },
    { id: 'amministratori', label: 'Amministratori', subtitle: 'CRM e sviluppo rete' },
    { id: 'territorio', label: 'Territorio', subtitle: 'Marginalità e Toscana' },
    { id: 'fatturazione', label: 'Fatturazione', subtitle: 'Partner, fatture e provvigioni' },
  ];

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

        {ruoloNormalizzato !== 'gestore' && (
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
              onOpenReportPremium={() => setShowReportSemestrale(true)}
            />

            <ArchivioReportPremium reports={reportVisibili} />
          </>
        )}

        {ruoloNormalizzato === 'gestore' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {gestoreSections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setGestoreSection(section.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                    gestoreSection === section.id
                      ? 'border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <span className="block text-sm font-black">{section.label}</span>
                  <span className={`mt-1 block text-[11px] font-semibold ${gestoreSection === section.id ? 'text-emerald-50' : 'text-slate-500'}`}>
                    {section.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

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
              <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
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

        {ruoloNormalizzato === 'amministratore' && (
          <>
            <div className="-mt-2">
              <DashboardOperativa ruolo={ruoloNormalizzato} segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} onOpen={setDettaglioAperto} />
            </div>
            <DashboardVendite segnalazioni={segnalazioniVisualizzate} />
          </>
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
              onOpenReportPremium={() => setShowReportSemestrale(true)}
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
                <button onClick={carica} disabled={loading} className="rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 px-4 py-2 font-semibold text-white shadow-lg shadow-emerald-900/20 disabled:opacity-60">
                  {loading ? 'Live...' : 'Aggiorna live'}
                </button>
              </div>
              {statusMessage && <p className="text-sm text-slate-600">{statusMessage}</p>}
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-500">Caricamento segnalazioni...</div>
              ) : segnalazioniVisualizzate.length === 0 ? (
                <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
                  {segnalazioniVisualizzate.map((s) => <SegnalazioneCard key={s.id} segnalazione={s} onOpen={setDettaglioAperto} />)}
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
            <GestioneAnagraficheBox condomini={condomini} onSaved={carica} />
            <GestioneContratti condomini={condomini} contratti={contratti} onCreateContratto={creaContratto} />
            <GestioneRinnoviContratti
              contratti={contratti}
              onRinnovaContratto={rinnovaContratto}
              onUpgradeContratto={upgradeContratto}
            />
            <DashboardPagamenti contratti={contratti} />
            <DashboardAbbonamenti contratti={contratti} />
            <DashboardAssemblea segnalazioni={segnalazioniVisualizzate} votiPreventivi={votiPreventivi} />
            <ArchivioReportPremium reports={reportVisibili} />
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
            {renderGestoreSectionTitle('Fatturazione', 'Aziende partner, fatture, pagamenti, provvigioni e liquidazioni.')}
            <FatturazionePartnerSuite
              aziendePartner={aziendePartner}
              provvigioniPartner={provvigioniPartner}
              fatturePartner={fatturePartner}
              provvigioniMaturate={provvigioniMaturate}
              fattureProvvigioniGestore={fattureProvvigioniGestore}
              condomini={condomini}
              segnalazioni={segnalazioni}
              utentiSistema={utentiSistema}
              onCreateAziendaPartner={creaAziendaPartner}
              onUpdateAziendaPartner={aggiornaAziendaPartner}
              onCreateProvvigionePartner={creaProvvigionePartner}
              onCreateFatturaPartner={creaFatturaPartner}
              onUpdateFatturaPartner={aggiornaFatturaPartner}
              onInviaFatturaPartner={inviaFatturaPartner}
              onUploadFatturaPdf={uploadFatturaPdf}
              onCreateFatturaProvvigioneGestore={creaFatturaProvvigioneGestore}
            />
          </>
        )}

        {ruoloNormalizzato === 'condominio' && (
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
              <EmptyState icon="🛠️" title="Nessuna segnalazione presente" text="Tutto tranquillo per ora. Quando arriverà una nuova segnalazione, la troverai qui con stato e priorità." action="Situazione sotto controllo" tone="emerald" />
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
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
      />
    </div>
  );
}
