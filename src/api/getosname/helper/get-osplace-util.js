import { fetchData } from '~/src/api/getosname/helper/fetch-data.js'
import { processMatches } from '~/src/api/getosname/helper/middleware-helpers.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'

async function fetchOSPlaces(request) {
  const logger = createLogger()
  let { userLocation } = request.payload || {}
  // write test cases to check for the above condition
  if (typeof userLocation === 'object') {
    userLocation = userLocation.userLocation || ''
  } else if (typeof userLocation === 'string') {
    userLocation = userLocation.trim()
  } else {
    userLocation = ''
  }

  // Helper function to check if a value is null, undefined, or blank
  const isBlank = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (typeof value === 'object' && Object.keys(value).length === 0)
    )
  }
  if (isBlank(userLocation)) {
    logger.info(`Invalid input: userLocation is blank : ${userLocation}`)
    return 'no data found'
  } else {
    logger.info(`Valid input: userLocation are provided : ${userLocation}`)
    const locationType = 'uk-location'
    const locationNameOrPostcode = userLocation //= 'DA16 1LT'//'LONDON'
    userLocation = userLocation.toUpperCase()
    // const { getOSPlaces } = await fetchData(
    const data = await fetchData(
      locationType,
      locationNameOrPostcode,
      request,
      'h'
    )
    if (!data?.getOSPlaces) {
      return undefined
    }
    const { getOSPlaces } = data
    if (locationType === 'uk-location') {
      // let { results } = getOSPlaces

      // Remove duplicates from the results array
      if (getOSPlaces?.results) {
        getOSPlaces.results = Array.from(
          new Set(getOSPlaces.results.map((item) => JSON.stringify(item)))
        ).map((item) => JSON.parse(item))
      }
      const selectedMatches = processMatches(
        getOSPlaces?.results,
        locationNameOrPostcode,
        userLocation
      )
      return selectedMatches
    }
  }
}
export { fetchOSPlaces }
