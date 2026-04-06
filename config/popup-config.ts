export interface PopupBehaviorConfig {
    /** Delay in ms before the popup opens (default: 5000) */
    delay: number;
    /** How long (ms) to suppress the popup after dismissal (default: 24h) */
    dismissDuration: number;
}

export const POPUP_CONFIG: PopupBehaviorConfig = {
    delay: 5000,
    dismissDuration: 24 * 60 * 60 * 1000, // 24 hours
};
