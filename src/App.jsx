
function DashboardOperativa({ ruolo, segnalazioni, condomini, onOpen }) {
// Dashboard operativa: tutte le costanti devono stare dentro questa funzione.
  const [bannerCompatto, setBannerCompatto] = useState(false);
  const preventiviInAttesaCount = segnalazioni.filter((s) => s.stato_invio === 'inviato' && !s.stato_conversione).length;

  useEffect(() => {
    if (preventiviInAttesaCount <= 0) return;
    setBannerCompatto(false);
    const timer = window.setTimeout(() => setBannerCompatto(true), 3500);
    return () => window.clearTimeout(timer);
  }, [preventiviInAttesaCount]);
const totale = segnalazioni.length;
const urgenti = segnalazioni.filter((s) => s.stato === 'Urgente').length;
const verifica = segnalazioni.filter((s) => s.stato === 'Presa in carico' || s.stato === 'In verifica').length;
@@ -1008,11 +1017,16 @@ function DashboardOperativa({ ruolo, segnalazioni, condomini, onOpen }) {
return (
<section className="space-y-5">
{/* Notifica intelligente */}
      {segnalazioni && segnalazioni.filter(s => s.stato_invio==='inviato' && !s.stato_conversione).length > 0 && (
      {preventiviInAttesaCount > 0 && (
<div id="preventivi-banner" className="fixed bottom-4 left-3 right-3 md:left-auto md:right-6 md:bottom-6 z-50 animate-[fadeIn_.4s_ease-out]">
          <div className="rounded-2xl bg-slate-900 text-white px-4 py-3 shadow-2xl flex items-center justify-center md:justify-start gap-3">
          <div className={`rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center md:justify-start gap-3 transition-all duration-500 ${bannerCompatto ? 'px-3 py-2 md:px-4' : 'px-4 py-2'}`}>
<span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-sm font-semibold">Nuovi preventivi in attesa</span>
            <span className={`text-sm font-semibold transition-all duration-500 ${bannerCompatto ? 'max-w-0 opacity-0 overflow-hidden whitespace-nowrap md:max-w-56 md:opacity-100' : 'max-w-72 opacity-100'}`}>
              Nuovi preventivi in attesa
            </span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-bold">
              {preventiviInAttesaCount}
            </span>
</div>
</div>
)}
@@ -1754,20 +1768,33 @@ export default function App() {
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
              className="self-start md:self-auto px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/20 text-white text-sm font-semibold hover:bg-white/25 shrink-0"
            >
              Logout
            </button>
            <div className="flex items-center gap-2 self-start md:self-auto">
              <a
                href={`https://wa.me/393477921965?text=${encodeURIComponent(`Ciao Simone, sono ${userProfile?.nome || 'un utente'}, del condominio ${userProfile?.condominio || 'non specificato'}. Ho bisogno di supporto.${ruoloNormalizzato ? `
Ruolo: ${ruoloNormalizzato}` : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 rounded-full bg-white/15 backdrop-blur border border-white/20 text-white text-lg hover:bg-green-500/80 transition"
                title="WhatsApp"
              >
                🟢
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

@@ -1808,7 +1835,7 @@ export default function App() {



        <section className={`space-y-3 transition-all duration-300 ${hasPreventiviBanner ? 'pb-32 md:pb-6' : 'pb-20 md:pb-6'}`}> 
        <section className={`space-y-3 transition-all duration-300 ${hasPreventiviBanner ? 'pb-40 md:pb-6' : 'pb-24 md:pb-6'}`}> 
<div className="flex items-center justify-between gap-4">
<h2 className="text-xl font-bold">Segnalazioni</h2>
<button
@@ -1878,7 +1905,7 @@ export default function App() {
{puoCreareSegnalazioni && (
<button
onClick={() => setShowNuovaSegnalazione(true)}
          style={{ bottom: hasPreventiviBanner ? 'calc(1rem + 86px)' : '1.25rem' }}
          style={{ bottom: hasPreventiviBanner ? 'calc(1rem + 110px)' : '1.25rem' }}
className={`fixed right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-700 active:scale-95 md:bottom-5 md:rounded-2xl md:px-5 md:py-3 ${mostraLabelFab ? 'px-4 py-3' : 'h-14 w-14 justify-center px-0 py-0'}`}
aria-label="Nuova segnalazione"
>
