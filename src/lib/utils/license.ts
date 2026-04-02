/**
 * Utility per la verifica della validità della licenza di TimbroSmart.
 */

export interface LicenseInfo {
    plan: string;
    licenseExpiry?: string | null;
    licenseActivatedAt?: string | null;
}

/**
 * Verifica se una licenza è valida (non scaduta).
 * Se licenseExpiry è null, si assume che sia una licenza FREE o vecchia logica (senza scadenza).
 */
export function isLicenseValid(license: LicenseInfo): boolean {
    if (!license || license.plan === 'FREE') return true;
    
    // Se non c'è una data di scadenza (licenze legacy), per ora la consideriamo valida
    if (!license.licenseExpiry) return true;

    const expiryDate = new Date(license.licenseExpiry);
    const now = new Date();

    return now < expiryDate;
}

/**
 * Calcola i giorni rimanenti alla scadenza.
 */
export function getDaysUntilExpiry(expiryDateStr: string): number {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formatta la data di scadenza in formato leggibile italiano.
 */
export function formatExpiryDate(expiryDateStr: string): string {
    return new Date(expiryDateStr).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
