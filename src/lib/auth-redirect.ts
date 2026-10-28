export function safeAuthNext(value: string | null | undefined) {
  return value && /^\/(?:studio(?:\/[a-zA-Z0-9-]+)?|admin(?:\/[a-zA-Z0-9-]+)*)$/.test(value) ? value : '/studio';
}
