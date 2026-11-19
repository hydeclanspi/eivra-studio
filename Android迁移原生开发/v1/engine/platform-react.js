// The business layer imports two React hooks from a mixed module. Native code
// never renders them; this tiny platform alias keeps that UI dependency out.
export const useState = (initial) => [typeof initial === 'function' ? initial() : initial, () => {}]
export const useEffect = () => {}
