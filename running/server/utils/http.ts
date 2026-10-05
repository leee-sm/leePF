export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly code = 'EXTERNAL_API_ERROR',
  ) {
    super(message)
  }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 7000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) {
      throw new ExternalApiError(`외부 API 응답 오류 (${response.status})`)
    }
    return (await response.json()) as T
  } catch (error) {
    if (error instanceof ExternalApiError) throw error
    throw new ExternalApiError('외부 API 호출에 실패했습니다.')
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchText(url: string, init: RequestInit = {}, timeoutMs = 7000): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) throw new ExternalApiError(`External API response error (${response.status})`)
    return await response.text()
  } catch (error) {
    if (error instanceof ExternalApiError) throw error
    throw new ExternalApiError('External API request failed.')
  } finally {
    clearTimeout(timer)
  }
}
