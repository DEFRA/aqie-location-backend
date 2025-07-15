// Helper function to process matches

import { statusCodes } from '~/src/api/common/constants/status-codes.js'

const processMatches = (matches, locationNameOrPostcode, userLocation) => {
  const partialPostcodePattern = /^([A-Z]{1,2}\d[A-Z\d]?)$/
  const normalizedUserLocation = userLocation
    .toUpperCase()
    .replace(/[^A-Z0-9]/gi, '')

  const newMatches = matches.filter((item) => {
    const name = item?.GAZETTEER_ENTRY.NAME1?.toUpperCase().replace(
      /[^A-Z0-9]/gi,
      ''
    )
    const name2 = item?.GAZETTEER_ENTRY.NAME2?.toUpperCase().replace(
      /[^A-Z0-9]/gi,
      ''
    )
    return (
      name?.includes(normalizedUserLocation) ||
      normalizedUserLocation.includes(name) ||
      normalizedUserLocation.includes(name2)
    )
  })

  if (
    partialPostcodePattern.test(locationNameOrPostcode.toUpperCase()) &&
    matches.length > 0 &&
    locationNameOrPostcode.length <= statusCodes.locationNameOrPostcodelength
  ) {
    if (matches[0].GAZETTEER_ENTRY.NAME2) {
      matches[0].GAZETTEER_ENTRY.NAME1 = matches[0].GAZETTEER_ENTRY.NAME2
    } else {
      matches[0].GAZETTEER_ENTRY.NAME1 = locationNameOrPostcode.toUpperCase()
    }

    matches = [matches[0]]
    const urlRoute = `${matches[0].GAZETTEER_ENTRY.NAME1}, ${matches[0].GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
    const headerTitle = convertStringToHyphenatedLowercaseWords(urlRoute)
    matches[0].GAZETTEER_ENTRY.ID = headerTitle
    return matches
  }

  return newMatches.reduce((acc, item) => {
    let headerTitle = ''
    let urlRoute = ''

    if (item.GAZETTEER_ENTRY.DISTRICT_BOROUGH) {
      if (item.GAZETTEER_ENTRY.NAME2) {
        urlRoute = `${item.GAZETTEER_ENTRY.NAME2}, ${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
      } else {
        urlRoute = `${item.GAZETTEER_ENTRY.NAME1}, ${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
      }
    } else {
      urlRoute = item.GAZETTEER_ENTRY.NAME2
        ? `${item.GAZETTEER_ENTRY.NAME2}, ${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
        : `${item.GAZETTEER_ENTRY.NAME1}, ${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
    }

    headerTitle = convertStringToHyphenatedLowercaseWords(urlRoute)
    item.GAZETTEER_ENTRY.ID = headerTitle
    acc.push(item)
    return acc
  }, [])
}

const convertStringToHyphenatedLowercaseWords = (input) => {
  const removedHyphens = input.replace(/ - /g, ' ')
  // Remove commas, convert to lowercase, and split the string into words
  const words = removedHyphens.replace(/,/g, '').toLowerCase().split(' ')

  // Join the words with hyphens
  return words.join('-')
}

export { processMatches, convertStringToHyphenatedLowercaseWords }
