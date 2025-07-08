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
  }
}
export { osplaceController }
