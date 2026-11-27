describe('catchProxyFetchError', () => {
  const url = 'https://api.example.com/data'
  const options = { method: 'GET' }

  let proxyFetch
  let catchProxyFetchError
  const mockInfo = jest.fn()
  const mockError = jest.fn()

  beforeEach(async () => {
    jest.resetModules()
    jest.clearAllMocks()

    jest.mock('~/src/api/common/helpers/logging/logger.js', () => ({
      createLogger: () => ({
        info: mockInfo,
        error: mockError
      })
    }))

    jest.mock('~/src/api/common/helpers/proxy.js', () => ({
      proxyFetch: jest.fn()
    }))

    const proxyModule = await import('~/src/api/common/helpers/proxy.js')
    proxyFetch = proxyModule.proxyFetch

    const utilModule = await import(
      '~/src/api/common/helpers/catch-proxy-fetch-error.js'
    )
    catchProxyFetchError = utilModule.catchProxyFetchError
  })

  it('should return default response when shouldCallApi is false', async () => {
    const result = await catchProxyFetchError(url, options, false)
    expect(result).toEqual([200, 'wrong postcode'])
    expect(proxyFetch).not.toHaveBeenCalled()
  })

  it('should return data and status when proxyFetch is successful', async () => {
    const mockData = { message: 'success' }
    proxyFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: jest.fn().mockResolvedValue(mockData)
    })

    const result = await catchProxyFetchError(url, options, true)

    expect(proxyFetch).toHaveBeenCalledWith(url, options)
    expect(mockInfo).toHaveBeenCalledTimes(1)
    expect(result).toEqual([200, mockData])
  })

  it('should log and throw error when response.ok is false', async () => {
    const mockResponse = {
      status: 404,
      ok: false,
      json: jest.fn()
    }
    proxyFetch.mockResolvedValue(mockResponse)

    const result = await catchProxyFetchError(url, options, true)

    expect(proxyFetch).toHaveBeenCalledWith(url, options)
    expect(mockInfo).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch data from')
    )
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('Failed to proxyFetch data from')
    )
    expect(result[0]).toBeInstanceOf(Error)
    expect(result[0].message).toContain('HTTP error! status from')
  })

  it('should catch and log error when proxyFetch throws', async () => {
    const error = new Error('Network failure')
    proxyFetch.mockRejectedValue(error)

    const result = await catchProxyFetchError(url, options, true)

    expect(proxyFetch).toHaveBeenCalledWith(url, options)
    expect(mockError).toHaveBeenCalledWith(
      `Failed to proxyFetch data from ${url}: ${error.message}`
    )
    expect(result).toEqual([error])
  })

  it('should sanitize key from absolute URL in info log', async () => {
    const safeData = { ok: true }
    const urlWithKey = 'https://api.example.com/data?key=secret&foo=bar'
    proxyFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: jest.fn().mockResolvedValue(safeData)
    })

    await catchProxyFetchError(urlWithKey, options, true)

    const infoMessage = mockInfo.mock.calls[0][0]
    expect(infoMessage).toContain('https://api.example.com/data?foo=bar')
    expect(infoMessage).not.toContain('key=secret')
  })

  it('should sanitize key from absolute URL in non-ok logs and error message', async () => {
    const urlWithKey = 'https://api.example.com/data?foo=bar&key=secret'
    proxyFetch.mockResolvedValue({
      status: 500,
      ok: false,
      json: jest.fn()
    })

    const result = await catchProxyFetchError(urlWithKey, options, true)

    const failedInfo = mockInfo.mock.calls
      .map((c) => c[0])
      .find((m) => m.includes('Failed to fetch data from'))
    const errorLog = mockError.mock.calls[0][0]

    expect(failedInfo).toContain('https://api.example.com/data?foo=bar')
    expect(failedInfo).not.toContain('key=')
    expect(errorLog).toContain('https://api.example.com/data?foo=bar')
    expect(errorLog).not.toContain('key=')
    expect(result[0].message).toContain('https://api.example.com/data?foo=bar')
    expect(result[0].message).not.toContain('key=')
  })

  it('should sanitize key from relative URL using fallback branch', async () => {
    const relativeUrl = '/api/data?key=secret&foo=1'
    const error = new Error('Downstream failure')
    proxyFetch.mockRejectedValue(error)

    const result = await catchProxyFetchError(relativeUrl, options, true)

    expect(result).toEqual([error])
    const errorLog = mockError.mock.calls[0][0]
    const normalizedErrorLog = errorLog.replace('?&', '?')
    expect(normalizedErrorLog).toContain('/api/data?foo=1')
    expect(normalizedErrorLog).not.toContain('key=')
  })

  it('should remove trailing query separator when relative URL only has key', async () => {
    const relativeUrl = '/api/data?key=secret'
    const error = new Error('Downstream failure')
    proxyFetch.mockRejectedValue(error)

    await catchProxyFetchError(relativeUrl, options, true)

    const errorLog = mockError.mock.calls[0][0]
    expect(errorLog).toContain('/api/data: Downstream failure')
    expect(errorLog).not.toContain('?key=')
    expect(errorLog).not.toContain('/api/data?')
  })
})
