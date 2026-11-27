import { failAction } from '../../api/common/helpers/fail-action.js'

describe('failAction', () => {
  test('should be a function', () => {
    expect(typeof failAction).toBe('function')
  })

  test('should execute the failure handler (lines 13-14)', () => {
    const request = { logger: { error: jest.fn() } }
    const h = {}
    const error = new Error('validation failed')

    // Adjust to the real behaviour (throw / return / log)
    expect(() => failAction(request, h, error)).toThrow()
  })
})
