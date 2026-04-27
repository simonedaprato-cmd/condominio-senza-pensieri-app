const [searchTerm, setSearchTerm] = useState('');
const [quickFilter, setQuickFilter] = useState('');
const [showNuovaSegnalazione, setShowNuovaSegnalazione] = useState(false);
  const [mostraLabelFab, setMostraLabelFab] = useState(false);
const hasPreventiviBanner = segnalazioni.some(
(s) => s.stato_invio === 'inviato' && !s.stato_conversione
);
@@ -1152,6 +1153,25 @@ export default function App() {
const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const fullHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const nearBottom = scrollTop + viewport >= fullHeight - 160;
      setMostraLabelFab(nearBottom);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

useEffect(() => {
if (!segnalazioni || segnalazioni.length === 0) return;

@@ -1859,11 +1879,13 @@ export default function App() {
<button
onClick={() => setShowNuovaSegnalazione(true)}
style={{ bottom: hasPreventiviBanner ? 'calc(1rem + 86px)' : '1.25rem' }}
          className="fixed right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-700 active:scale-95 px-4 py-3 md:bottom-5 md:rounded-2xl md:px-5 md:py-3"
          className={`fixed right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-900/30 transition-all duration-300 hover:scale-105 hover:bg-emerald-700 active:scale-95 md:bottom-5 md:rounded-2xl md:px-5 md:py-3 ${mostraLabelFab ? 'px-4 py-3' : 'h-14 w-14 justify-center px-0 py-0'}`}
aria-label="Nuova segnalazione"
>
<span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl font-light leading-none">+</span>
          <span className="text-sm font-semibold tracking-tight">Nuova segnalazione</span>
          <span className={`overflow-hidden whitespace-nowrap text-sm font-semibold tracking-tight transition-all duration-300 ${mostraLabelFab ? 'max-w-44 opacity-100' : 'max-w-0 opacity-0'}`}>
            Nuova segnalazione
          </span>
</button>
)}
