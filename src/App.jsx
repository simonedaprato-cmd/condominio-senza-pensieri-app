// PATCH NOTIFICA VOTAZIONE COMPLETA
// Applica queste modifiche al tuo App.jsx attuale.
// Il canvas è già stato aggiornato con queste correzioni.

// 1) Dentro il realtime preventivo_voti, sostituisci:
//
// await aggiornaVotiPratica(voto.segnalazione_id);
//
// con:

await aggiornaVotiPratica(voto.segnalazione_id);

const praticaAggiornata = pratiche.find((p) => Number(p.id) === Number(voto.segnalazione_id));
if (praticaAggiornata) {
  const { data: votiAggiornati, error: votiError } = await supabase
    .from('preventivo_voti')
    .select('*')
    .eq('segnalazione_id', voto.segnalazione_id)
    .order('created_at', { ascending: false });

  if (!votiError) {
    await notificaVotazioneCompleta(praticaAggiornata, votiAggiornati || []);
  }
}

// 2) Nello stesso useEffect realtime, cambia la dependency list da:
//
// }, [session?.user?.email]);
//
// a:

}, [session?.user?.email, pratiche]);

// 3) Dentro notificaVotazioneCompleta, sostituisci il blocco che legge utenti_condomini
// e costruisce emailAventiDiritto con questo:

const { data: collegamentiCondominio, error: aventiDirittoError } = await supabase
  .from('utenti_condomini')
  .select('email')
  .eq('condominio_id', condominioId);

if (aventiDirittoError) throw aventiDirittoError;

const emailCollegati = [...new Set((collegamentiCondominio || [])
  .map((u) => String(u.email || '').toLowerCase().trim())
  .filter(Boolean)
)];

const { data: utentiCollegati, error: utentiCollegatiError } = emailCollegati.length
  ? await supabase
      .from('utenti')
      .select('email, ruolo')
      .in('email', emailCollegati)
  : { data: [], error: null };

if (utentiCollegatiError) throw utentiCollegatiError;

const ruoloByEmail = new Map((utentiCollegati || [])
  .map((u) => [String(u.email || '').toLowerCase().trim(), String(u.ruolo || '').toLowerCase().trim()])
);

const emailAmministratore = String(condominio?.amministratore_email || '').toLowerCase().trim();
const ruoliNonVotanti = ['admin', 'amministratore', 'gestore', 'tecnico'];

const emailAventiDiritto = [...new Set(emailCollegati
  .filter((email) => email !== emailAmministratore)
  .filter((email) => !ruoliNonVotanti.includes(ruoloByEmail.get(email) || ''))
)];
