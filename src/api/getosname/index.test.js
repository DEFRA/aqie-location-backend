import hapi from '@hapi/hapi'
import { osnameplaces } from '~/src/api/getosname/index.js'
import { proxyFetch } from '~/src/api/common/helpers/proxy.js'

jest.mock('~/src/api/common/helpers/proxy.js', () => ({
  proxyFetch: jest.fn()
}))

jest.mock('~/src/api/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() })
}))

const osNamesReply = (body) => ({
  ok: true,
  status: 200,
  json: () => Promise.resolve(body)
})

const gazetteerEntry = (name) => ({
  GAZETTEER_ENTRY: {
    NAME1: name,
    DISTRICT_BOROUGH: 'Somewhere',
    COUNTY_UNITARY: 'Somewhere'
  }
})

describe('POST /osnameplaces', () => {
  let server

  const search = (userLocation) =>
    server.inject({
      method: 'POST',
      url: '/osnameplaces',
      payload: { userLocation }
    })

  beforeEach(async () => {
    server = hapi.server()
    await server.register(osnameplaces)
  })

  it('returns 200 and an empty list when OS Names finds nothing and sends no results', async () => {
    proxyFetch.mockResolvedValue(
      osNamesReply({ header: { query: 'asdfghjkl', totalresults: 0 } })
    )

    const response = await search('asdfghjkl')

    expect(response.statusCode).toBe(200)
    expect(response.result).toEqual({ message: 'success', getOSPlaces: [] })
  })

  it('returns 200 and an empty list when OS Names returns places that do not match the search', async () => {
    proxyFetch.mockResolvedValue(
      osNamesReply({ results: [gazetteerEntry('Completely Different')] })
    )

    const response = await search('asdfghjkl')

    expect(response.statusCode).toBe(200)
    expect(response.result).toEqual({ message: 'success', getOSPlaces: [] })
  })

  it('returns the matching places for a genuine search', async () => {
    proxyFetch.mockResolvedValue(
      osNamesReply({ results: [gazetteerEntry('London')] })
    )

    const response = await search('London')

    expect(response.statusCode).toBe(200)
    expect(response.result.getOSPlaces).toHaveLength(1)
    expect(response.result.getOSPlaces[0].GAZETTEER_ENTRY.NAME1).toBe('London')
  })
})
