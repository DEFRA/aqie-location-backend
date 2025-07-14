import { statusCodes } from '~/src/api/getosname/helper/constants.js'

describe('statusCodes', () => {
  it('should be an object', () => {
    expect(typeof statusCodes).toBe('object')
    expect(statusCodes).not.toBeNull()
  })

  it('should contain all expected status codes with correct values', () => {
    expect(statusCodes.ok).toBe(200)
    expect(statusCodes.noContent).toBe(204)
    expect(statusCodes.badRequest).toBe(400)
    expect(statusCodes.unauthorized).toBe(401)
    expect(statusCodes.forbidden).toBe(403)
    expect(statusCodes.notFound).toBe(404)
    expect(statusCodes.imATeapot).toBe(418)
    expect(statusCodes.locationNameOrPostcodelength).toBe(3)
  })

  it('should not contain unexpected keys', () => {
    const expectedKeys = [
      'ok',
      'noContent',
      'badRequest',
      'unauthorized',
      'forbidden',
      'notFound',
      'imATeapot',
      'locationNameOrPostcodelength'
    ]
    const actualKeys = Object.keys(statusCodes)
    expect(actualKeys.sort()).toEqual(expectedKeys.sort())
  })

  it('should have only number values', () => {
    Object.values(statusCodes).forEach((value) => {
      expect(typeof value).toBe('number')
    })
  })

  it('should not allow mutation if frozen (optional)', () => {
    // Optional: If you freeze the object in the source file
    // Object.freeze(statusCodes);
    // Then test:
    expect(() => {
      statusCodes.ok = 201
    }).not.toThrow() // Will throw only if frozen
    // expect(statusCodes.ok).toBe(200); // Uncomment if frozen
  })
})
