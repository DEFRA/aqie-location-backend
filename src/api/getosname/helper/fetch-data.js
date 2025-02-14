import { config } from '~/src/config/index.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
import { catchProxyFetchError } from '~/src/api/common/helpers/catch-proxy-fetch-error.js'

async function fetchData(locationType, userLocation) {
  const options = {
    method: 'get',
    headers: { 'Content-Type': 'text/json', preserveWhitespace: true }
  }
  const logger = createLogger()
  if (locationType === 'uk-location') {
    const filters = [
      'LOCAL_TYPE:City',
      'LOCAL_TYPE:Town',
      'LOCAL_TYPE:Village',
      'LOCAL_TYPE:Suburban_Area',
      'LOCAL_TYPE:Postcode',
      'LOCAL_TYPE:Airport'
    ].join('+')
    const osNamesApiUrl = config.get('osNamesApiUrl')
    const osNamesApiKey = config.get('osNamesApiKey')
    const osNamesApiUrlFull = `${osNamesApiUrl}${encodeURIComponent(
      userLocation
    )}&fq=${encodeURIComponent(filters)}&key=${osNamesApiKey}`
    const symbolsArr = ['%', '$', '&', '#', '!', '¬', '`']
    const shouldCallApi = symbolsArr.some((symbol) =>
      userLocation.includes(symbol)
    )
    logger.info(
      `osPlace data requested osNamesApiUrlFull: ${osNamesApiUrlFull}`
    )
    const [statusCodeOSPlace, getOSPlaces] = await catchProxyFetchError(
      osNamesApiUrlFull,
      options,
      !shouldCallApi
    )
    if (statusCodeOSPlace !== 200) {
      logger.error(
        `Error fetching statusCodeOSPlace data: ${statusCodeOSPlace}`
      )
    } else {
      logger.info(`getOSPlaces data fetched:`)
    }
    return { getOSPlaces }
  }
}
export { fetchData }
