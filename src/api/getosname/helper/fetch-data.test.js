/** @jest-environment node */

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
  })

  it('should return undefined for non-uk locationType', async () => {
    const result = await fetchData('non-uk-location', 'London')
    expect(result).toBeUndefined()
    expect(mockLogger.info).not.toHaveBeenCalled()
  })

  it('should call API when userLocation contains special symbols', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place1'] }])
    const result = await fetchData('uk-location', 'Lon&don')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place1'] } })
  })

  it('should not call API when userLocation does not contain special symbols', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: ['Place2'] }])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('osPlace data requested')
    )
    expect(result).toEqual({ getOSPlaces: { places: ['Place2'] } })
  })

  it('should log error if statusCodeOSPlace is not 200', async () => {
    catchProxyFetchError.mockResolvedValue([500, null])
    const result = await fetchData('uk-location', 'London')
    expect(mockLogger.error).toHaveBeenCalledWith(
      'Error fetching statusCodeOSPlace data: 500'
    )
    expect(result).toEqual({ getOSPlaces: null })
  })

  it('should handle empty userLocation gracefully', async () => {
    catchProxyFetchError.mockResolvedValue([200, { places: [] }])
    const result = await fetchData('uk-location', '')
    expect(result).toEqual({ getOSPlaces: { places: [] } })
  })

  it('should handle missing config values', async () => {
    config.get.mockReturnValue(undefined)
    catchProxyFetchError.mockResolvedValue([200, { places: ['Fallback'] }])
    const result = await fetchData('uk-location', 'London')
    expect(result).toEqual({ getOSPlaces: { places: ['Fallback'] } })
  })

  it('should encode userLocation and filters correctly in URL', async () => {
    catchProxyFetchError.mockResolvedValue([200, {}])
    await fetchData('uk-location', 'Lon&don')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('Lon&don'))
    )
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        encodeURIComponent(
          'LOCAL_TYPE:City+LOCAL_TYPE:Town+LOCAL_TYPE:Village+LOCAL_TYPE:Suburban_Area+LOCAL_TYPE:Postcode+LOCAL_TYPE:Airport'
        )
      )
    )
  })
})
