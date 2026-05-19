import OneSignal from 'react-onesignal';

export async function initOneSignal() {
  try {
    if (!import.meta.env.VITE_ONESIGNAL_APP_ID) {
      console.warn('VITE_ONESIGNAL_APP_ID non configurato');
      return null;
    }

    await OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });

    console.log('OneSignal inizializzato');
    return OneSignal;
  } catch (error) {
    console.error('Errore inizializzazione OneSignal:', error);
    return null;
  }
}

export async function getOneSignalUserId() {
  try {
    return await OneSignal.User.PushSubscription.id;
  } catch (error) {
    console.warn('Impossibile recuperare OneSignal subscription id:', error);
    return null;
  }
}

export default OneSignal;
