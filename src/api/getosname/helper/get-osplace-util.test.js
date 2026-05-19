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

  // ─── userLocation type normalisation (lines 14-22) ───────────────────────
  //
  // Three mutually exclusive branches:
  //   A) typeof userLocation === 'object'  →  use .userLocation sub-property or ''
  //   B) typeof userLocation === 'string'  →  trim()
  //   C) anything else (undefined)         →  ''

  describe('branch A – userLocation is an object', () => {
    // Line 20 – TRUTHY side: object has a .userLocation string property
    test('uses the nested .userLocation string when present', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: { results: [{ id: 1 }] } })
      processMatches.mockReturnValue([{ id: 1 }])

      const result = await fetchOSPlaces({
        payload: { userLocation: { userLocation: 'London' } }
      })

      expect(fetchData).toHaveBeenCalledWith(
        'uk-location',
        'London',
        expect.anything(),
        'h'
      )
      expect(result).toEqual([{ id: 1 }])
    })

    // Line 20 – FALSY side (|| ''): object has NO .userLocation property → blank → 'no data found'
    test('falls back to blank and returns "no data found" when nested property is missing', async () => {
      const result = await fetchOSPlaces({ payload: { userLocation: {} } })

      expect(result).toBe('no data found')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
      expect(fetchData).not.toHaveBeenCalled()
    })

    // Extra: nested .userLocation is explicitly an empty string → also blank
    test('returns "no data found" when nested .userLocation is an empty string', async () => {
      const result = await fetchOSPlaces({
        payload: { userLocation: { userLocation: '' } }
      })

      expect(result).toBe('no data found')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
    })
  })

  describe('branch B – userLocation is a string', () => {
    test('trims whitespace and returns "no data found" for blank strings', async () => {
      for (const blank of ['', '   ']) {
        jest.clearAllMocks()
        createLogger.mockReturnValue(mockLogger)

        const result = await fetchOSPlaces({ payload: { userLocation: blank } })

        expect(result).toBe('no data found')
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Invalid input')
        )
      }
    })

    test('proceeds normally for a non-blank string', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: { results: [{ id: 1 }] } })
      processMatches.mockReturnValue([{ id: 1 }])

      const result = await fetchOSPlaces({
        payload: { userLocation: 'London' }
      })

      expect(result).toEqual([{ id: 1 }])
    })

    test('passes original (pre-uppercase) value as locationNameOrPostcode to fetchData', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: { results: [] } })
      processMatches.mockReturnValue([])

      await fetchOSPlaces({ payload: { userLocation: 'london' } })

      expect(fetchData).toHaveBeenCalledWith(
        'uk-location',
        'london',
        expect.anything(),
        'h'
      )
    })

    test('passes uppercased value as third argument to processMatches', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: { results: [{ id: 1 }] } })
      processMatches.mockReturnValue([{ id: 1 }])

      await fetchOSPlaces({ payload: { userLocation: 'london' } })

      expect(processMatches).toHaveBeenCalledWith(
        expect.any(Array),
        'london',
        'LONDON'
      )
    })
  })

  describe('branch C – userLocation is undefined (else branch)', () => {
    test('treats undefined as blank and returns "no data found"', async () => {
      const result = await fetchOSPlaces({
        payload: { userLocation: undefined }
      })

      expect(result).toBe('no data found')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
    })

    test('treats null payload as blank and returns "no data found"', async () => {
      const result = await fetchOSPlaces({ payload: null })

      expect(result).toBe('no data found')
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
    })
  })

  // ─── fetchData response shape ─────────────────────────────────────────────

  describe('fetchData response handling', () => {
    test('returns undefined when getOSPlaces is absent', async () => {
      fetchData.mockResolvedValue({})

      const result = await fetchOSPlaces({
        payload: { userLocation: 'London' }
      })

      expect(result).toBeUndefined()
      expect(processMatches).not.toHaveBeenCalled()
    })

    // Line 45 – selectedMatches is returned from inside the if (locationType === 'uk-location') block
    test('returns the value from processMatches (line 45 – return selectedMatches)', async () => {
      const processed = [
        { id: 1, name: 'Place A' },
        { id: 2, name: 'Place B' }
      ]
      fetchData.mockResolvedValue({
        getOSPlaces: { results: [{ id: 1 }, { id: 2 }] }
      })
      processMatches.mockReturnValue(processed)

      const result = await fetchOSPlaces({
        payload: { userLocation: 'London' }
      })

      expect(result).toEqual(processed)
    })

    test('handles getOSPlaces present but results missing (undefined path into processMatches)', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: {} })
      processMatches.mockReturnValue([])

      const result = await fetchOSPlaces({
        payload: { userLocation: 'London' }
      })

      expect(processMatches).toHaveBeenCalledWith(undefined, 'London', 'LONDON')
      expect(result).toEqual([])
    })
  })

  // ─── deduplication ────────────────────────────────────────────────────────

  describe('duplicate removal', () => {
    test('deduplicates results before passing to processMatches', async () => {
      const duplicate = { id: 1, name: 'Place A' }
      fetchData.mockResolvedValue({
        getOSPlaces: {
          results: [duplicate, duplicate, { id: 2, name: 'Place B' }]
        }
      })
      processMatches.mockReturnValue([{ id: 1 }, { id: 2 }])

      await fetchOSPlaces({ payload: { userLocation: 'London' } })

      const receivedResults = processMatches.mock.calls[0][0]
      expect(receivedResults).toHaveLength(2)
      expect(receivedResults).toEqual([
        { id: 1, name: 'Place A' },
        { id: 2, name: 'Place B' }
      ])
    })
  })

  // ─── logging ──────────────────────────────────────────────────────────────

  describe('logging', () => {
    test('logs valid input message when userLocation is provided', async () => {
      fetchData.mockResolvedValue({ getOSPlaces: { results: [] } })
      processMatches.mockReturnValue([])

      await fetchOSPlaces({ payload: { userLocation: 'London' } })

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Valid input: userLocation are provided')
      )
    })

    test('logs invalid input message when userLocation is blank', async () => {
      await fetchOSPlaces({ payload: { userLocation: '' } })

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Invalid input')
      )
    })
  })
})
