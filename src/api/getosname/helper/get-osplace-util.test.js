import { fetchOSPlaces } from '~/src/api/getosname/helper/get-osplace-util.js'
import { fetchData } from '~/src/api/getosname/helper/fetch-data.js'
import { processMatches } from '~/src/api/getosname/helper/middleware-helpers.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'

jest.mock('~/src/api/getosname/helper/fetch-data.js')
jest.mock('~/src/api/getosname/helper/middleware-helpers.js')
jest.mock('~/src/api/common/helpers/logging/logger.js')

describe('fetchOSPlaces', () => {
  const mockLogger = { info: jest.fn() }

  beforeEach(() => {
    jest.clearAllMocks()
    createLogger.mockReturnValue(mockLogger)
  })

  test('should return "no data found" when request.payload is null', async () => {
    const result = await fetchOSPlaces({ payload: null })
    expect(result).toBe('no data found')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Invalid input')
    )
  })

  test.each([[undefined], [''], ['   '], [{}]])(
    'should return "no data found" for blank userLocation: %p',
    async (input) => {
      const result = await fetchOSPlaces({ payload: { userLocation: input } })
      expect(result).toBe('no data found')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
    }
  )

  test('should return undefined if fetchData returns no getOSPlaces', async () => {
    fetchData.mockResolvedValue({})
    const result = await fetchOSPlaces({ payload: { userLocation: 'London' } })
    expect(result).toBeUndefined()
  })

  test('should return processed matches if valid data is returned', async () => {
    const mockResults = [
      { id: 1, name: 'Place A' },
      { id: 1, name: 'Place A' }, // duplicate
      { id: 2, name: 'Place B' }
    ]
    const processed = [{ id: 1 }, { id: 2 }]
    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(processed)

    const result = await fetchOSPlaces({ payload: { userLocation: 'London' } })
    expect(fetchData).toHaveBeenCalled()
    expect(processMatches).toHaveBeenCalledWith(
      expect.any(Array),
      'London',
      'LONDON'
    )
    expect(result).toEqual(processed)
  })

  test('should handle getOSPlaces with no results', async () => {
    fetchData.mockResolvedValue({ getOSPlaces: {} })
    processMatches.mockReturnValue([])

    const result = await fetchOSPlaces({ payload: { userLocation: 'London' } })
    expect(result).toEqual([])
  })

  test('should convert userLocation to uppercase', async () => {
    const mockResults = [{ id: 1 }]
    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(mockResults)

    await fetchOSPlaces({ payload: { userLocation: 'london' } })
    expect(processMatches).toHaveBeenCalledWith(mockResults, 'london', 'LONDON')
  })

  test('should log valid input', async () => {
    fetchData.mockResolvedValue({ getOSPlaces: { results: [] } })
    await fetchOSPlaces({ payload: { userLocation: 'London' } })
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid input')
    )
  })

  test('should call fetchData with correct parameters', async () => {
    const userLocation = 'London'
    await fetchOSPlaces({ payload: { userLocation } })
    expect(fetchData).toHaveBeenCalledWith(
      'uk-location',
      userLocation,
      expect.anything(),
      'h'
    )
  })

  test('should log valid input and return selected matches when all conditions are met', async () => {
    const mockResults = [
      { id: 1, name: 'Place A' },
      { id: 2, name: 'Place B' }
    ]
    const processed = [{ id: 1 }, { id: 2 }]
    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(processed)

    const result = await fetchOSPlaces({
      payload: { userLocation: 'DA16 1LT' }
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid input: userLocation are provided')
    )
    expect(result).toEqual(processed)
  })

  test('should log valid input and return selected matches', async () => {
    const mockResults = [{ id: 1, name: 'Place A' }]
    const mockProcessed = [{ id: 1, name: 'Place A' }]

    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(mockProcessed)

    const result = await fetchOSPlaces({
      payload: { userLocation: 'TestCity' }
    })

    // Line 20
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Valid input: userLocation are provided')
    )

    // Line 45
    expect(result).toEqual(mockProcessed)
  })

  test('should handle userLocation as an object', async () => {
    const mockResults = [{ id: 1, name: 'Place A' }]
    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(mockResults)

    const result = await fetchOSPlaces({
      payload: { userLocation: { userLocation: 'London' } }
    })
    expect(result).toEqual(mockResults)
  })

  test('should handle userLocation as a string', async () => {
    const mockResults = [{ id: 1, name: 'Place A' }]
    fetchData.mockResolvedValue({ getOSPlaces: { results: mockResults } })
    processMatches.mockReturnValue(mockResults)

    const result = await fetchOSPlaces({ payload: { userLocation: 'London' } })
    expect(result).toEqual(mockResults)
  })

  test('should handle userLocation as an empty string', async () => {
    const result = await fetchOSPlaces({ payload: { userLocation: '' } })
    expect(result).toBe('no data found')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Invalid input')
    )
  })

  test('should handle userLocation as an object with no userLocation property', async () => {
    const result = await fetchOSPlaces({ payload: { userLocation: {} } })
    expect(result).toBe('no data found')
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Invalid input')
    )
  })
})
