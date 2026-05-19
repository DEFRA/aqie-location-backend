import { fetchData } from '~/src/api/getosname/helper/fetch-data.js'
import { catchProxyFetchError } from '~/src/api/common/helpers/catch-proxy-fetch-error.js'
import { config } from '~/src/config/index.js'

jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['password', 'token']
  }
}))

jest.mock('~/src/config/index.js', () => ({
  config: {
    get: jest.fn((key) => {
      if (key === 'osNamesApiUrl') return 'https://api.example.com/search?q='
      if (key === 'osNamesApiKey') return 'test-api-key'
      return undefined
    })
  }
}))

const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
}

jest.mock('~/src/api/common/helpers/logging/logger.js', () => ({
  createLogger: () => mockLogger
}))

jest.mock('~/src/api/common/helpers/catch-proxy-fetch-error.js', () => ({
  catchProxyFetchError: jest.fn()
}))

describe('fetchData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Restore default config mock after each test
    config.get.mockImplementation((key) => {
      if (key === 'osNamesApiUrl') return 'https://api.example.com/search?q='
      if (key === 'osNamesApiKey') return 'test-api-key'
      return undefined
    })
  })

  // ─── Branch: non-uk locationType → early return ───────────────────────────

  it('should return undefined for non-uk locationType', async () => {
    const result = await fetchData('non-uk-location', 'London')
    expect(result).toBeUndefined()
    expect(mockLogger.info).not.toHaveBeenCalled()
    expect(catchProxyFetchError).not.toHaveBeenCalled()
  })

  it('should return undefined for null locationType', async () => {
    const result = await fetchData(null, 'London')
    expect(result).toBeUndefined()
    expect(catchProxyFetchError).not.toHaveBeenCalled()
  })

  it('should return undefined for undefined locationType', async () => {
    const result = await fetchData(undefined, 'London')
    expect(result).toBeUndefined()
    expect(catchProxyFetchError).not.toHaveBeenCalled()
  })

  // ─── Branch: userLocation contains special symbols ─────────────────────────

  it('should encode userLocation containing & and call API', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place1'] }])
    const result = await fetchData('uk-location', 'Lon&don')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place1'] } })
  })

  it('should encode userLocation containing = and call API', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place=A'] }])
    const result = await fetchData('uk-location', 'Lon=don')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place=A'] } })
  })

  it('should encode userLocation containing ? and call API', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place?B'] }])
    const result = await fetchData('uk-location', 'Lon?don')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place?B'] } })
  })

  // ─── Branch: userLocation without special symbols ──────────────────────────

  it('should call API when userLocation has no special symbols', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place2'] }])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place2'] } })
  })

  // ─── Branch: status code is not 200 → log error ───────────────────────────

  it('should log error and return null data when status is 500', async () => {
    catchProxyFetchError.mockResolvedValue([500, null])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: 500'
    )
    expect(result).toEqual({ getOSPlaces: null })
  })

  it('should log error and return null data when status is 404', async () => {
    catchProxyFetchError.mockResolvedValue([404, null])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: 404'
    )
    expect(result).toEqual({ getOSPlaces: null })
  })

  it('should log error and return null data when status is 401', async () => {
    catchProxyFetchError.mockResolvedValue([401, null])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: 401'
    )
    expect(result).toEqual({ getOSPlaces: null })
  })

  // ─── Edge cases: empty / whitespace userLocation ───────────────────────────

  it('should handle empty userLocation gracefully', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: [] }])
    const result = await fetchData('uk-location', '')
    expect(result).toEqual({ getOSPlaces: { places: [] } })
  })

  it('should handle whitespace-only userLocation', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: [] }])
    const result = await fetchData('uk-location', '   ')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: [] } })
  })

  // ─── Edge case: undefined config values ───────────────────────────────────

  it('should handle missing/undefined config values gracefully', async () => {
    config.get.mockReturnValue(undefined)
    catchProxyFetchError.mockResolvedValue([200, { places: ['Fallback'] }])
    const result = await fetchData('uk-location', 'London')
    expect(result).toEqual({ getOSPlaces: { places: ['Fallback'] } })
  })

  // ─── URL construction: encodeURIComponent applied correctly ───────────────

  it('should encode userLocation and LOCAL_TYPE filters correctly in the fetch URL', async () => {
    catchProxyFetchError.mockResolvedValue([200, {}])
    await fetchData('uk-location', 'Lon&don')

    const [[calledUrl]] = catchProxyFetchError.mock.calls
    expect(calledUrl).toContain(encodeURIComponent('Lon&don'))
    expect(calledUrl).toContain(
      encodeURIComponent(
        'LOCAL_TYPE:City+LOCAL_TYPE:Town+LOCAL_TYPE:Village+LOCAL_TYPE:Suburban_Area+LOCAL_TYPE:Postcode+LOCAL_TYPE:Airport'
      )
    )
  })

  it('should include the osNamesApiUrl base in the fetch call', async () => {
    catchProxyFetchError.mockResolvedValue([200, {}])
    await fetchData('uk-location', 'Bristol')

    const [[calledUrl]] = catchProxyFetchError.mock.calls
    expect(calledUrl).toContain('https://api.example.com/search?q=')
  })

  it('should include the osNamesApiKey in the fetch call', async () => {
    catchProxyFetchError.mockResolvedValue([200, {}])
    await fetchData('uk-location', 'Bristol')

    const [[calledUrl]] = catchProxyFetchError.mock.calls
    expect(calledUrl).toContain('test-api-key')
  })

  // ─── Return shape: always { getOSPlaces: <data> } for uk-location ─────────

  it('should always wrap response in getOSPlaces key on success', async () => {
    const mockData = { places: [{ name: 'Oxford' }], totalResults: 1 }
    catchProxyFetchError.mockResolvedValue([200, mockData])
    const result = await fetchData('uk-location', 'Oxford')
    expect(result).toEqual({ getOSPlaces: mockData })
    expect(Object.keys(result)).toEqual(['getOSPlaces'])
  })

  it('should wrap null body in getOSPlaces key on error status', async () => {
    catchProxyFetchError.mockResolvedValue([503, null])
    const result = await fetchData('uk-location', 'Oxford')
    expect(result).toEqual({ getOSPlaces: null })
    expect(Object.keys(result)).toEqual(['getOSPlaces'])
  })

  // ─── Verify catchProxyFetchError is called exactly once per uk request ─────

  it('should call catchProxyFetchError exactly once for a valid uk-location request', async () => {
    catchProxyFetchError.mockResolvedValue([200, {}])
    await fetchData('uk-location', 'Leeds')
    expect(catchProxyFetchError).toHaveBeenCalledTimes(1)
  })

  it('should not call catchProxyFetchError for non-uk locationType', async () => {
    await fetchData('postal', 'Leeds')
    expect(catchProxyFetchError).not.toHaveBeenCalled()
  })
})
