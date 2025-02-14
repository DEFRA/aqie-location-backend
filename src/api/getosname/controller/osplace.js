import { fetchOSPlaces } from '~/src/api/getosname/helper/get-osplace-util.js'
import { config } from '~/src/config/index.js'

const osplaceController = {
  handler: async (request, h) => {
    const getOSPlaces = await fetchOSPlaces(request)
    const allowOriginUrl = config.get('allowOriginUrl')
    return h
      .response({ message: 'success', getOSPlaces })
      .code(200)
      .header('Access-Control-Allow-Origin', allowOriginUrl)
  }
}
export { osplaceController }
