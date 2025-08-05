import { fetchOSPlaces } from '~/src/api/getosname/helper/get-osplace-util.js'
import { config } from '~/src/config/index.js'
import { statusCodes } from '~/src/api/common/constants/status-codes.js'

const osplaceController = {
  handler: async (request, h) => {
    const getOSPlaces = await fetchOSPlaces(request)
    const allowOriginUrl = config.get('allowOriginUrl')
    return h
      .response({ message: 'success', getOSPlaces })
      .code(statusCodes.ok)
      .header('Access-Control-Allow-Origin', allowOriginUrl)
      .header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
      )
      .header('Referrer-Policy', 'strict-origin-when-cross-origin')
      .header('X-Content-Type-Options', 'nosniff')
      .header('X-Frame-Options', 'DENY')
      .header('X-XSS-Protection', '1; mode=block')
      .header(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
      )
  }
}
export { osplaceController }
