export function generateRandomSprottyId(): string {
    return Math.random().toString(36).substring(7);
}
