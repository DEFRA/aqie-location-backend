import { fetchOSPlaces } from '~/src/api/getosname/helper/get-osplace-util.js'
import { fetchData } from '~/src/api/getosname/helper/fetch-data.js'
import { processMatches } from '~/src/api/getosname/helper/middleware-helpers.js'

jest.mock('~/src/api/getosname/helper/fetch-data.js')
jest.mock('~/src/api/getosname/helper/middleware-helpers.js')

describe('fetchOSPlaces', () => {
  const mockRequest = (userLocation) => ({
    params: { userLocation }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return "no data found" for empty userLocation', async () => {
    const result = await fetchOSPlaces(mockRequest(''))
    expect(result).toBe('no data found')
  })

  it('should return "no data found" for null userLocation', async () => {
    const result = await fetchOSPlaces(mockRequest(null))
    expect(result).toBe('no data found')
  })

  it('should return "no data found" for string with two single quotes', async () => {
    const result = await fetchOSPlaces(mockRequest("''"))
    expect(result).toBe('no data found')
  })

  it('should return undefined if fetchData returns undefined', async () => {
    fetchData.mockResolvedValue(undefined)

    const result = await fetchOSPlaces(mockRequest('London'))
    expect(result).toBeUndefined()
  })

  it('should return undefined if getOSPlaces is undefined', async () => {
    fetchData.mockResolvedValue({})

    const result = await fetchOSPlaces(mockRequest('London'))
    expect(result).toBeUndefined()
  })

  it('should return empty array if getOSPlaces.results is empty', async () => {
    fetchData.mockResolvedValue({
      getOSPlaces: {
        results: []
      }
    })

    processMatches.mockReturnValue([])

    const result = await fetchOSPlaces(mockRequest('London'))
    expect(result).toEqual([])
  })

  it('should return processed matches with deduplicated results', async () => {
    const duplicateResult = {
      GAZETTEER_ENTRY: { NAME1: 'London', DISTRICT_BOROUGH: 'Westminster' }
    }

    fetchData.mockResolvedValue({
      getOSPlaces: {
        results: [duplicateResult, duplicateResult] // duplicate
      }
    })

    processMatches.mockReturnValue(['processed'])

    const result = await fetchOSPlaces(mockRequest('London'))

    expect(fetchData).toHaveBeenCalled()
    expect(processMatches).toHaveBeenCalledWith(
      [duplicateResult],
      'London',
      'LONDON'
    )
    expect(result).toEqual(['processed'])
  })
})
