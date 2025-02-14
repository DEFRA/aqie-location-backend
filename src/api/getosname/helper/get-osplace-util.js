import { fetchData } from '~/src/api/getosname/helper/fetch-data.js'
import { processMatches } from '~/src/api/getosname/helper/middleware-helpers.js'

async function fetchOSPlaces(request) {
  if (
    request.params.userLocation !== '' &&
    request.params.userLocation !== null &&
    request.params.userLocation !== "''"
  ) {
    // const url = config.get('osNamesApiUrl')
    const locationType = 'uk-location'
    const locationNameOrPostcode = request.params.userLocation //= 'DA16 1LT'//'London'
    const userLocation = request.params.userLocation.toUpperCase() //= 'DA16 1LT'//'LONDON'

    const { getOSPlaces } = await fetchData(
      locationType,
      locationNameOrPostcode,
      request,
      'h'
    )
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
  } else {
    return 'no data found'
  }

  // return {getOSPlaces}
}
export { fetchOSPlaces }
