)}
<p className="break-all text-white/80">Utente: {utente.email}</p>
<p className="text-white/80">Ruolo: {ruoloNormalizzato}</p>
                  {userProfile?.condominio && (

                  {/* HEADER SMART PER RUOLO */}
                  {ruoloNormalizzato === 'condominio' && userProfile?.condominio && (
<p className="text-white/80">Condominio: {userProfile.condominio}</p>
)}

                  {ruoloNormalizzato === 'amministratore' && (
                    <p className="text-white/80">
                      {(() => {
                        const criticita = segnalazioniVisualizzate.filter((s) => s.priorita === 'Alta' || s.stato === 'Urgente').length;
                        const inAttesa = segnalazioniVisualizzate.filter((s) => s.stato_invio === 'inviato' && !s.stato_conversione).length;
                        if (criticita > 0) return `${criticita} criticità da presidiare su ${condominiVisibili?.length || 0} condomini`;
                        if (inAttesa > 0) return `${inAttesa} preventivi in attesa di risposta`;
                        return `Gestisci ${condominiVisibili?.length || 0} condomini senza criticità attive`;
                      })()}
                    </p>
                  )}

                  {ruoloNormalizzato === 'gestore' && (
                    <p className="text-white/80">
                      {(() => {
                        const criticita = segnalazioniVisualizzate.filter((s) => s.priorita === 'Alta' || s.stato === 'Urgente').length;
                        const inAttesa = segnalazioniVisualizzate.filter((s) => s.stato_invio === 'inviato' && !s.stato_conversione).length;
                        const valoreAperto = segnalazioniVisualizzate
                          .filter((s) => s.stato_invio === 'inviato' && !s.stato_conversione)
                          .reduce((sum, s) => sum + Number(s.importo_preventivo || 0), 0);
                        if (criticita > 0) return `Controllo globale: ${criticita} criticità operative attive`;
                        if (valoreAperto > 0) return `Pipeline aperta: ${formatEuro(valoreAperto)} da seguire`;
                        if (inAttesa > 0) return `${inAttesa} preventivi in attesa di risposta`;
                        return 'Controllo globale attivo: situazione sotto controllo';
                      })()}
                    </p>
                  )}
</div>
</div>
</div>
