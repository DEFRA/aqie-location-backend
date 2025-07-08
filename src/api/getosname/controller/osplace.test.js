import { osplaceController } from '~/src/api/getosname/controller/osplace.js'
import { fetchOSPlaces } from '~/src/api/getosname/helper/get-osplace-util.js'
import { config } from '~/src/config/index.js'
import { statusCodes } from '~/src/api/common/constants/status-codes.js'

jest.mock('~/src/api/getosname/helper/get-osplace-util.js')
jest.mock('~/src/config/index.js')
jest.mock('~/src/api/common/helpers/logging/logger-options.js', () => ({
  logConfig: {
    enabled: true,
    redact: ['authorization']
  }
}))

describe('osplaceController.handler', () => {
  let mockRequest
  let mockResponseToolkit

  beforeEach(() => {
    mockRequest = { query: { name: 'test' } }

    mockResponseToolkit = {
      response: jest.fn().mockReturnThis(),
      code: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    }

    config.get.mockReturnValue('https://example.com')
  })

  it('should return success response with data', async () => {
    const mockData = { places: ['London', 'Manchester'] }
    fetchOSPlaces.mockResolvedValue(mockData)

    const result = await osplaceController.handler(
      mockRequest,
      mockResponseToolkit
    )

    expect(fetchOSPlaces).toHaveBeenCalledWith(mockRequest)
    expect(config.get).toHaveBeenCalledWith('allowOriginUrl')
    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'success',
      getOSPlaces: mockData
    })
    expect(mockResponseToolkit.code).toHaveBeenCalledWith(statusCodes.ok)
    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://example.com'
    )
    expect(result).toBe(mockResponseToolkit)
  })

  it('should handle undefined allowOriginUrl gracefully', async () => {
    config.get.mockReturnValue(undefined)
    const mockData = { places: [] }
    fetchOSPlaces.mockResolvedValue(mockData)

    const result = await osplaceController.handler(
      mockRequest,
      mockResponseToolkit
    )

    expect(mockResponseToolkit.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      undefined
    )
    expect(result).toBe(mockResponseToolkit)
  })

  it('should handle fetchOSPlaces throwing an error', async () => {
    const error = new Error('Failed to fetch')
    fetchOSPlaces.mockRejectedValue(error)

    await expect(
      osplaceController.handler(mockRequest, mockResponseToolkit)
    ).rejects.toThrow('Failed to fetch')
  })

  it('should handle missing request object', async () => {
    const mockData = { places: ['Test'] }
    fetchOSPlaces.mockResolvedValue(mockData)

    const result = await osplaceController.handler(
      undefined,
      mockResponseToolkit
    )

    expect(fetchOSPlaces).toHaveBeenCalledWith(undefined)
    expect(mockResponseToolkit.response).toHaveBeenCalledWith({
      message: 'success',
      getOSPlaces: mockData
    })
    expect(result).toBe(mockResponseToolkit)
  })
})
