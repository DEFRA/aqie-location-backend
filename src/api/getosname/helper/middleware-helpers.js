// Helper function to process matches
const processMatches = (matches, locationNameOrPostcode, userLocation) => {
  const partialPostcodePattern = /^([A-Z]{1,2}\d[A-Z\d]?)$/
  const newMatches = matches.filter((item) => {
    const name = item?.GAZETTEER_ENTRY.NAME1.toUpperCase().replace(/\s+/g, '')
    const name2 = item?.GAZETTEER_ENTRY.NAME2?.toUpperCase().replace(/\s+/g, '')
    return (
      name.includes(userLocation.replace(/\s+/g, '')) ||
      userLocation.includes(name) ||
      userLocation.includes(name2)
    )
  })
  if (
    partialPostcodePattern.test(locationNameOrPostcode.toUpperCase()) &&
    matches.length > 0 &&
    locationNameOrPostcode.length <= 3
  ) {
    if (matches[0].GAZETTEER_ENTRY.NAME2) {
      matches[0].GAZETTEER_ENTRY.NAME1 = matches[0].GAZETTEER_ENTRY.NAME2
    } else {
      matches[0].GAZETTEER_ENTRY.NAME1 = locationNameOrPostcode.toUpperCase() // Set the name to the partial postcode
    }
    matches = [matches[0]]
    const urlRoute = `${matches[0].GAZETTEER_ENTRY.NAME1}_${matches[0].GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
    const headerTitle = convertStringToHyphenatedLowercaseWords(urlRoute)
    matches[0].GAZETTEER_ENTRY.ID = headerTitle
    return matches
  }

  return newMatches.reduce((acc, item) => {
    let headerTitle = ''
    let urlRoute = ''
    if (item.GAZETTEER_ENTRY.DISTRICT_BOROUGH) {
      if (item.GAZETTEER_ENTRY.NAME2) {
        headerTitle = `${item.GAZETTEER_ENTRY.NAME2}, ${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
        urlRoute = `${item.GAZETTEER_ENTRY.NAME2}_${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
      } else {
        headerTitle = `${item.GAZETTEER_ENTRY.NAME1}, ${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
        urlRoute = `${item.GAZETTEER_ENTRY.NAME1}_${item.GAZETTEER_ENTRY.DISTRICT_BOROUGH}`
      }
    } else {
      headerTitle = item.GAZETTEER_ENTRY.NAME2
        ? `${item.GAZETTEER_ENTRY.NAME2}, ${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
        : `${item.GAZETTEER_ENTRY.NAME1}, ${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
      urlRoute = item.GAZETTEER_ENTRY.NAME2
        ? `${item.GAZETTEER_ENTRY.NAME2}_${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
        : `${item.GAZETTEER_ENTRY.NAME1}_${item.GAZETTEER_ENTRY.COUNTY_UNITARY}`
    }
    headerTitle = convertStringToHyphenatedLowercaseWords(urlRoute) // Use the helper function to generate the custom ID
    item.GAZETTEER_ENTRY.ID = headerTitle // Update the nested object property
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
