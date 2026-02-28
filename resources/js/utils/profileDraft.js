const storageKeyPrefix = 'vynce:profile-draft';

function getStorageKey(userId) {
    return `${storageKeyPrefix}:${userId}`;
}

export function saveProfileDraft(profile) {
    if (typeof window === 'undefined' || !profile?.id) {
        return;
    }

    window.sessionStorage.setItem(getStorageKey(profile.id), JSON.stringify(profile));
}

export function readProfileDraft(userId) {
    if (typeof window === 'undefined' || !userId) {
        return null;
    }

    const rawDraft = window.sessionStorage.getItem(getStorageKey(userId));

    if (!rawDraft) {
        return null;
    }

    try {
        return JSON.parse(rawDraft);
    } catch {
        return null;
    }
}

export function clearProfileDraft(userId) {
    if (typeof window === 'undefined' || !userId) {
        return;
    }

    window.sessionStorage.removeItem(getStorageKey(userId));
}
