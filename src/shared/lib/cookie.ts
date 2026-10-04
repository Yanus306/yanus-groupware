// 클라이언트에 가볍게 보관할 값(채팅 알림 설정, 읽음 상태 등)을 쿠키로 저장/조회하는 유틸.
// 별도 의존성 없이 document.cookie를 사용한다. 쿠키 용량(도메인당 ~4KB)에 유의해 작은 값만 저장한다.

const DEFAULT_MAX_AGE_DAYS = 365

export function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  const found = document.cookie.split('; ').find((row) => row.startsWith(prefix))
  return found ? decodeURIComponent(found.slice(prefix.length)) : null
}

export function setCookie(name: string, value: string, maxAgeDays = DEFAULT_MAX_AGE_DAYS): void {
  const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60)
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function removeCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`
}
