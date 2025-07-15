import {
  processMatches,
  convertStringToHyphenatedLowercaseWords
} from '~/src/api/getosname/helper/middleware-helpers.js'

jest.mock('~/src/api/common/constants/status-codes.js', () => ({
  statusCodes: {
    locationNameOrPostcodelength: 10
  }
}))

describe('convertStringToHyphenatedLowercaseWords', () => {
  it('should convert string with commas and spaces to hyphenated lowercase', () => {
    const input = 'London, Greater London'
    const result = convertStringToHyphenatedLowercaseWords(input)
    expect(result).toBe('london-greater-london')
  })

  it('should handle hyphens surrounded by spaces', () => {
    const input = 'Kingston - Upon - Thames'
    const result = convertStringToHyphenatedLowercaseWords(input)
    expect(result).toBe('kingston-upon-thames')
  })
})

describe('processMatches', () => {
  it('should return filtered matches based on userLocation match', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'London', 'GreaterLondon')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle partial postcode match and override NAME1 with NAME2', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'Old Name',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'SW1A', 'SW1A')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.NAME1).toBe('Greater London')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle partial postcode with no NAME2', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'Old Name',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'SW1A', 'SW1A')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.NAME1).toBe('SW1A')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('sw1a-camden')
  })

  it('should handle missing DISTRICT_BOROUGH and use COUNTY_UNITARY', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'Oxford',
          COUNTY_UNITARY: 'Oxfordshire'
        }
      }
    ]
    const result = processMatches(matches, 'Oxford', 'Oxford')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('oxford-oxfordshire')
  })

  it('should handle missing NAME2 and use NAME1', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'Brighton',
          DISTRICT_BOROUGH: 'Brighton Borough'
        }
      }
    ]
    const result = processMatches(matches, 'Brighton', 'Brighton')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('brighton-brighton-borough')
  })

  it('should return empty array if no matches found', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'Leeds',
          DISTRICT_BOROUGH: 'Leeds Borough'
        }
      }
    ]
    const result = processMatches(matches, 'London', 'Manchester')
    expect(result).toEqual([])
  })

  it('should handle empty matches array', () => {
    const result = processMatches([], 'London', 'London')
    expect(result).toEqual([])
  })

  it('should not match if locationNameOrPostcode is too long', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const longPostcode = 'SW1A1234567890'
    const result = processMatches(matches, longPostcode, longPostcode)
    expect(result).toHaveLength(0)
  })

  it('should handle mixed case and spaces in userLocation', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'london', 'Greater London')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle userLocation with spaces', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'London', 'Greater London')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle userLocation with mixed case and spaces', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'london', 'greater london')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle userLocation with special characters', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'London!', 'Greater London@')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })

  it('should handle userLocation with numbers', () => {
    const matches = [
      {
        GAZETTEER_ENTRY: {
          NAME1: 'London',
          NAME2: 'Greater London',
          DISTRICT_BOROUGH: 'Camden',
          COUNTY_UNITARY: 'London County'
        }
      }
    ]
    const result = processMatches(matches, 'London123', 'Greater London456')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('greater-london-camden')
  })
})
