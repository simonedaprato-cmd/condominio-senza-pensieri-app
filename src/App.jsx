import { createClient } from '@supabase/supabase-js';
import { useEffect, useMemo, useState } from 'react';
import OneSignal from 'react-onesignal';

const SUPABASE_URL = 'https://tqeiytzscddfgttgbsgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZWl5dHpzY2RkZmd0dGdic2d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4OTg1NzgsImV4cCI6MjA5MjQ3NDU3OH0.8tn5-MZsgpY-Ql77PRI1jYTBz1FeAlf0wi2xyNVkJfU';
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




function CentroNotifiche({ notifiche, aperto, onToggle, onClose, onSegnaLette }) {
  const nonLette = (notifiche || []).filter((n) => !n.letto).length;

  return (
    <>
      {aperto && (
        <div className="fixed inset-0 z-[75] bg-slate-950/35 p-3 backdrop-blur-sm md:flex md:justify-end">
          <div className="ml-auto flex h-full w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/50 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Notifiche</h3>
                <p className="text-xs text-slate-500">
                  {nonLette > 0 ? `${nonLette} non lette` : 'Tutto letto'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {nonLette > 0 && (
                  <button
                    type="button"
                    onClick={onSegnaLette}
                    className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-800"
                  >
                    Segna lette
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                >
                  Chiudi
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4 csp-scroll">
              {(notifiche || []).length === 0 ? (
                <EmptyState
                  icon="🔔"
                  title="Nessuna notifica"
                  text="Quando arriveranno aggiornamenti importanti del condominio, li troverai qui."
                  action="Centro notifiche pronto"
                  tone="slate"
                />
              ) : (
                notifiche.map((notifica) => (
                  <div
                    key={notifica.id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      notifica.letto
                        ? 'border-slate-100 bg-slate-50'
                        : 'border-emerald-100 bg-emerald-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900">{notifica.titolo}</p>
                        {notifica.messaggio && (
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">{notifica.messaggio}</p>
                        )}
                        <p className="mt-2 text-[11px] font-semibold text-slate-400">
                          {notifica.created_at ? new Date(notifica.created_at).toLocaleString('it-IT') : ''}
                        </p>
                      </div>
                      <span className={`mt-1 shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${
                        notifica.letto ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 text-white'
                      }`}>
                        {notifica.letto ? 'Letta' : 'Nuova'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
  const [permesso, setPermesso] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [collegatoEmail, setCollegatoEmail] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState('');
  const [dispositivoSalvato, setDispositivoSalvato] = useState(false);
  const [messaggio, setMessaggio] = useState('');
  const [debugSalvataggio, setDebugSalvataggio] = useState('');

  const emailPulita = String(utenteEmail || '').toLowerCase().trim();

  const leggiSubscriptionId = async () => {
    for (let tentativo = 1; tentativo <= 12; tentativo += 1) {
      let subId = '';

      try {
        subId =
          OneSignal.User?.PushSubscription?.id ||
          OneSignal.User?.PushSubscription?.subscriptionId ||
          OneSignal.User?.PushSubscription?.token ||
          '';
      } catch (error) {
        console.warn('Lettura subscription OneSignal non riuscita:', error);
      }

      if (subId) {
        console.info('Subscription ID rilevato:', subId);
        return subId;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 500));
    }

    console.warn('Subscription ID non disponibile dopo attesa.');
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
            : /iPhone|iPad/i.test(navigator.userAgent)
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

    try {
      await OneSignal.login(emailPulita);

      try {
        await OneSignal.User.addEmail(emailPulita);
      } catch (emailError) {
        console.warn('OneSignal addEmail non completato:', emailError);
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
      } else if (Notification.permission === 'granted') {
        setMessaggio('Notifiche consentite, ma dispositivo non ancora registrato. Riprova tra qualche secondo.');
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
    if (typeof window === 'undefined') return;

    const browserSupportato = 'Notification' in window && 'serviceWorker' in navigator;
    setSupportate(browserSupportato);

    if (!browserSupportato || inizializzato) return;

    let active = true;

    const inizializza = async () => {
      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          serviceWorkerUpdaterPath: '/OneSignalSDKUpdaterWorker.js',
          notifyButton: {
            enable: false,
          },
        });

        if (!active) return;

        setInizializzato(true);
        setPermesso(Notification.permission);
        console.info('OneSignal inizializzato');
      } catch (error) {
        console.error('Errore inizializzazione OneSignal:', error);
        if (active) setMessaggio('Notifiche non inizializzate. Verifica configurazione OneSignal.');
      }
    };

    inizializza();

    return () => {
      active = false;
    };
  }, [inizializzato]);

  useEffect(() => {
    if (!inizializzato || !emailPulita) return;

    let active = true;

    const collega = async () => {
      const subId = await collegaUtenteOneSignal('login-effect');
      if (!active) return;

      if (Notification.permission === 'granted' && subId) {
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

      if (!inizializzato) {
        setMessaggio('Notifiche in preparazione. Riprova tra pochi secondi.');
        return;
      }

      if (emailPulita) {
        await collegaUtenteOneSignal('prima-del-permesso');
      }

      await OneSignal.Notifications.requestPermission();

      const nuovoPermesso = Notification.permission;
      setPermesso(nuovoPermesso);

      if (nuovoPermesso === 'granted') {
        const subId = await collegaUtenteOneSignal('dopo-permesso');

        if (subId) {
          setCollegatoEmail(true);
          setDispositivoSalvato(true);
          setMessaggio('');
        } else {
          setMessaggio('Notifiche consentite, ma registrazione dispositivo non completata.');
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

  if (!supportate) return null;

  const attive = permesso === 'granted' && collegatoEmail && dispositivoSalvato;

  if (attive) {
    return null;
  }

  return (
    <div className="csp-enter rounded-3xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-amber-900">
            {permesso === 'granted' ? 'Registra questo dispositivo' : 'Attiva notifiche push'}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {permesso === 'granted'
              ? 'Le notifiche sono consentite. Completa la registrazione del dispositivo per riceverle.'
              : 'Ricevi avvisi su nuove segnalazioni, votazioni e aggiornamenti importanti.'}
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
          className={`rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white shadow-sm ${MOTION_BUTTON}`}
        >
          {permesso === 'granted' ? 'Registra' : 'Attiva'}
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

    setMessaggio('Link inviato. Controlla la tua email.');
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
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Accesso con codice OTP</p>
          <p className="mt-1 text-xs text-slate-500">
            Se il link Gmail non apre correttamente l’app, copia il codice ricevuto via email.
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

function Header({ utente, ruolo, userProfile, condominiVisibili, segnalazioni, onLogout, notificheNonLette = 0, onOpenNotifiche }) {
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
          <button
            type="button"
            onClick={onOpenNotifiche}
            className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-transparent shadow-lg backdrop-blur-xl transition duration-300 hover:scale-110 hover:bg-white/10"
            title={notificheNonLette > 0 ? `${notificheNonLette} notifiche non lette` : 'Nessuna nuova notifica'}
            aria-label="Centro notifiche"
          >
            <span className={`relative h-3.5 w-3.5 rounded-full ${
              notificheNonLette > 0 ? 'bg-red-500' : 'bg-emerald-300'
            }`}>
              <span className={`absolute inset-0 rounded-full ${
                notificheNonLette > 0 ? 'bg-red-400' : 'bg-emerald-300'
              } animate-ping opacity-60`} />
              <span className={`absolute inset-0 rounded-full ring-2 ring-white/70 ${
                notificheNonLette > 0 ? 'bg-red-500' : 'bg-emerald-400'
              }`} />
            </span>
          </button>
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
          <EmptyState icon="🚀" title="Nessun lead inserito" text="Aggiungi il primo lead per iniziare a costruire una pipeline commerciale ordinata e misurabile." action="Crea il primo lead" tone="emerald" />
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
          <h3 className="text-lg font-bold">Situazione per condominio</h3>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1 csp-scroll">
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
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
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

function DettaglioPraticaModal({ segnalazione, onClose, onChangeStatus, onAddNote, onUploadFile, onUpdateImporto, ruolo, utenteEmail, onConversionePreventivo, onPianificaLavori, onGeneraReport, onGeneraPdfVotazioni, onCondividiCondomini, onVotoCondomino, onInviaReminderVoto, onInviaRipartoMillesimi, onDeletePratica, onRipristinaPratica, votiPreventivi, utentiCondomini, utentiSistema, onRefreshVoti }) {
  const [nota, setNota] = useState('');
  const [mostraCronologia, setMostraCronologia] = useState(false);
  const [file, setFile] = useState(null);
  const [importo, setImporto] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dataInizioPresunta, setDataInizioPresunta] = useState('');
  const [importoRiparto, setImportoRiparto] = useState('');
  const [scadenzaRiparto, setScadenzaRiparto] = useState('');
  const [rateRiparto, setRateRiparto] = useState('1');

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

  const condominiRiparto = (utentiCondomini || [])
    .filter((item) => Number(item.condominio_id) === Number(segnalazione.condominio_id))
    .map((item) => {
      const email = String(item.email || '').toLowerCase().trim();
      const utente = (utentiSistema || []).find((u) => String(u.email || '').toLowerCase().trim() === email);
      return {
        email,
        nome: utente?.nome || email,
        ruolo: String(utente?.ruolo || '').toLowerCase().trim(),
        millesimi: Number(item.millesimi || 0),
      };
    })
    .filter((item) => item.email && item.ruolo === 'condominio');

  const totaleMillesimi = condominiRiparto.reduce((sum, item) => sum + Number(item.millesimi || 0), 0);
  const importoRipartoNumero = Number(importoRiparto || segnalazione.importo_preventivo || 0);
  const quoteRiparto = condominiRiparto.map((item) => ({
    ...item,
    quota: importoRipartoNumero * Number(item.millesimi || 0) / 1000,
  }));

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
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1 csp-scroll">
            <p><span className="text-slate-500">Descrizione:</span> {segnalazione.descrizione}</p>
            <p><span className="text-slate-500">Categoria:</span> {segnalazione.categoria || 'n.d.'}</p>
            <p><span className="text-slate-500">Luogo:</span> {segnalazione.luogo || 'n.d.'}</p>
            <p><span className="text-slate-500">Referente:</span> {segnalazione.referente || 'n.d.'}</p>
            <p><span className="text-slate-500">Telefono:</span> {segnalazione.telefono || 'n.d.'}</p>
            {ruolo === 'gestore' && (
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

                    <div className="mt-3 rounded-xl border border-white/70 bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
                        <span>Partecipazione consultiva</span>
                        <span>{totaleVoti}/{totaleAventiDiritto} voti</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-sky-600 transition-all duration-500" style={{ width: `${partecipazioneRealePercentuale}%` }} />
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
                      <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-black ${consultazioneCompletata ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {consultazioneCompletata ? 'Consultazione completata' : `In attesa di ${votiMancanti} voti`}
                      </div>
                      {ultimoVoto && (
                        <p className="mt-2 text-xs text-slate-500">
                          Ultimo voto: {ultimoVoto.voto} • {ultimoVoto.email}
                        </p>
                      )}
                    </div>

                    {ruolo === 'amministratore' && nonVotanti.length > 0 && (
                      <div className="mt-3 max-h-32 overflow-auto rounded-xl border border-amber-100 bg-amber-50">
                        <p className="border-b border-amber-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-700">Non votanti</p>
                        {nonVotanti.map((email) => (
                          <p key={email} className="border-b border-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 last:border-b-0">{email}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 max-h-40 overflow-y-auto csp-scroll rounded-xl border border-white/70 bg-white">
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
            <TimelinePratica stato={segnalazione.stato} />
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

            {segnalazione.stato === 'Sopralluogo effettuato' && (
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

            {ruolo === 'amministratore' && ['Accettata', 'Pianificata', 'Chiusa'].includes(segnalazione.stato) && (
              <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div>
                  <p className="font-semibold text-amber-900">Riparto costi per millesimi</p>
                  <p className="mt-1 text-sm text-amber-800">Calcola e invia ai soli condomini la quota individuale della pratica deliberata.</p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <input type="number" min="0" step="0.01" value={importoRiparto} onChange={(e) => setImportoRiparto(e.target.value)} placeholder={`Importo totale ${formatEuro(segnalazione.importo_preventivo || 0)}`} className="rounded-xl border border-amber-200 px-3 py-2 text-sm" />
                  <input type="date" value={scadenzaRiparto} onChange={(e) => setScadenzaRiparto(e.target.value)} className="rounded-xl border border-amber-200 px-3 py-2 text-sm" />
                  <input type="number" min="1" value={rateRiparto} onChange={(e) => setRateRiparto(e.target.value)} placeholder="Numero rate" className="rounded-xl border border-amber-200 px-3 py-2 text-sm" />
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-3 text-sm">
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Aventi diritto: {condominiRiparto.length}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Totale millesimi: {totaleMillesimi}</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Importo: {formatEuro(importoRipartoNumero)}</span>
                  </div>
                  {totaleMillesimi !== 1000 && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Attenzione: il totale millesimi non è 1000. Verifica i dati prima dell’invio.</p>
                  )}
                  <div className="mt-3 max-h-40 overflow-y-auto csp-scroll rounded-xl border border-slate-100">
                    {quoteRiparto.length === 0 ? (
                      <EmptyState icon="📐" title="Millesimi non configurati" text="Configura i millesimi dei condòmini per ottenere un riparto chiaro e pronto da condividere." action="Configurazione richiesta" tone="amber" />
                    ) : quoteRiparto.map((item) => (
                      <div key={item.email} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-800">{item.nome}</p>
                          <p className="truncate text-[11px] text-slate-500">{item.email} • {item.millesimi} millesimi</p>
                        </div>
                        <p className="shrink-0 text-sm font-black text-amber-700">{formatEuro(item.quota)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" disabled={!importoRipartoNumero || !scadenzaRiparto || quoteRiparto.length === 0 || totaleMillesimi <= 0} onClick={() => onInviaRipartoMillesimi(segnalazione, { importo_totale: importoRipartoNumero, scadenza: scadenzaRiparto, rate: Number(rateRiparto || 1), quote: quoteRiparto, totale_millesimi: totaleMillesimi })} className="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
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
            <div className="mt-3 max-h-40 space-y-2 overflow-y-auto csp-scroll border-t border-slate-100 pt-3">
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
  const [toastInterno, setToastInterno] = useState(null);
  const [notificheUtente, setNotificheUtente] = useState([]);
  const [centroNotificheAperto, setCentroNotificheAperto] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
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
  const [utentiCondomini, setUtentiCondomini] = useState([]);
  const [utentiSistema, setUtentiSistema] = useState([]);

  const ruoloNormalizzato = String(ruolo || '').toLowerCase().trim();
  const puoCreareSegnalazioni = ruoloNormalizzato === 'amministratore' || ruoloNormalizzato === 'condominio';


  const mostraToast = (title, message = '', tone = 'info') => {
    setToastInterno({ title, message, tone, createdAt: Date.now() });

    window.clearTimeout(window.__cspToastTimer);
    window.__cspToastTimer = window.setTimeout(() => {
      setToastInterno(null);
    }, 4200);
  };

  const caricaNotificheUtente = async (emailOverride = null) => {
    const email = String(emailOverride || utente?.email || '').toLowerCase().trim();
    if (!email) return;

    try {
      const { data, error } = await supabase
        .from('notifiche_utenti')
        .select('*')
        .ilike('email', email)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificheUtente(data || []);
    } catch (error) {
      console.warn('Errore caricamento notifiche utente:', error);
    }
  };

  const segnaNotificheLette = async () => {
    const email = String(utente?.email || '').toLowerCase().trim();
    if (!email) return;

    try {
      const { error } = await supabase
        .from('notifiche_utenti')
        .update({ letto: true })
        .ilike('email', email)
        .eq('letto', false);

      if (error) throw error;
      setNotificheUtente((prev) => prev.map((n) => ({ ...n, letto: true })));
    } catch (error) {
      console.warn('Errore aggiornamento notifiche lette:', error);
      mostraToast('Notifiche', 'Non sono riuscito ad aggiornare lo stato letto.', 'warning');
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
      const passaArchivio = showArchiviate ? s.archiviata === true : s.archiviata !== true;
      const passaCondominio = filtroCondominioId ? String(s.condominio_id) === String(filtroCondominioId) : true;
      const passaRicerca = !testo || [s.titolo, s.descrizione, s.condominio, s.categoria, s.luogo, s.referente].filter(Boolean).some((v) => String(v).toLowerCase().includes(testo));
      return passaCondominio && passaRicerca && passaArchivio;
    });
  }, [segnalazioniFiltrate, filtroCondominioId, searchTerm]);

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
        .select('*')
        .order('created_at', { ascending: false });

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

      await caricaNotificheUtente(currentUser?.email || utente?.email);
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
        setNotificheUtente([]);
        setCentroNotificheAperto(false);
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


  useEffect(() => {
    const email = String(utente?.email || '').toLowerCase().trim();
    if (!email) return undefined;

    caricaNotificheUtente(email);

    const channel = supabase
      .channel(`notifiche-utente-${email}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifiche_utenti' },
        async (payload) => {
          const payloadEmail = String(payload?.new?.email || payload?.old?.email || '').toLowerCase().trim();
          if (payloadEmail && payloadEmail !== email) return;

          await caricaNotificheUtente(email);

          if (payload.eventType === 'INSERT' && payloadEmail === email) {
            mostraToast(payload.new?.titolo || 'Nuova notifica', payload.new?.messaggio || '', 'info');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utente?.email]);

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
      await caricaNotificheUtente();
      setStatusMessage('Segnalazione salvata correttamente.');
      mostraToast('Nuova segnalazione creata', 'La pratica è stata salvata e la notifica è stata inviata agli utenti collegati al condominio.', 'success');
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

      setStatusMessage('Voto consultivo registrato con successo.');
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

      const { data, error } = await supabase.functions.invoke('notify-riparto-millesimi', {
        body: {
          segnalazione_id: pratica.id,
          titolo: pratica.titolo,
          condominio_id: pratica.condominio_id,
          importo_totale: riparto.importo_totale,
          scadenza: riparto.scadenza,
          rate: riparto.rate,
          quote: riparto.quote,
          totale_millesimi: riparto.totale_millesimi,
        },
      });

      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || 'Invio riparto non riuscito.');

      const notaRiparto = {
        id: Date.now(),
        testo: `Riparto millesimale inviato ai condomini. Importo totale: ${formatEuro(riparto.importo_totale)}. Scadenza: ${new Date(riparto.scadenza).toLocaleDateString('it-IT')}. Rate: ${riparto.rate}.`,
        data: new Date().toLocaleString('it-IT'),
      };

      const noteAggiornate = [...(pratica.note || []), notaRiparto];
      await supabase.from('segnalazioni').update({ note: noteAggiornate }).eq('id', pratica.id);

      setStatusMessage(`Riparto inviato a ${data?.emails?.length || 0} condomini.`);
      await carica();
      setDettaglioAperto((prev) => prev && prev.id === pratica.id ? { ...prev, note: noteAggiornate } : prev);
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

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-slate-50 px-3 py-4 md:p-6">
      <ToastInterno toast={toastInterno} onClose={() => setToastInterno(null)} />
      <CentroNotifiche
        notifiche={notificheUtente}
        aperto={centroNotificheAperto}
        onToggle={() => setCentroNotificheAperto((prev) => !prev)}
        onClose={() => setCentroNotificheAperto(false)}
        onSegnaLette={segnaNotificheLette}
      />
      <NotifichePushBox utenteEmail={utente?.email} />
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
          notificheNonLette={notificheUtente.filter((n) => !n.letto).length}
          onOpenNotifiche={() => setCentroNotificheAperto(true)}
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
            <DashboardStatiGestore segnalazioni={segnalazioniVisualizzate} onOpen={setDettaglioAperto} />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <DashboardAssemblea segnalazioni={segnalazioniVisualizzate} votiPreventivi={votiPreventivi} />
              <DashboardEconomica segnalazioni={segnalazioniVisualizzate} condomini={condominiVisibili} />
            </div>

            <section className="space-y-3 pb-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Segnalazioni operative</h2>
                  <p className="text-sm text-slate-500">Elenco pratiche filtrate, sempre in evidenza prima dei moduli commerciali.</p>
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
        utentiCondomini={utentiCondomini}
        utentiSistema={utentiSistema}
      />
    </div>
  );
}
