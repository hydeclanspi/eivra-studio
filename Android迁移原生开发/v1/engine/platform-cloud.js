// Optional remote sync is deliberately not linked in the offline engine.
export const createClient = () => { throw new Error('Cloud sync is not configured in native offline mode') }
