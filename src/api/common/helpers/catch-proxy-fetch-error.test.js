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
})
