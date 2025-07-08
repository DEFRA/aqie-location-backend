import {
  processMatches,
  convertStringToHyphenatedLowercaseWords
} from '~/src/api/getosname/helper/middleware-helpers.js'

describe('convertStringToHyphenatedLowercaseWords', () => {
  it('should convert string to hyphenated lowercase words', () => {
    expect(
      convertStringToHyphenatedLowercaseWords('London - Central, UK')
    ).toBe('london-central-uk')
  })

  it('should handle strings without commas or hyphens', () => {
    expect(convertStringToHyphenatedLowercaseWords('Simple Test')).toBe(
      'simple-test'
    )
  })

  it('should return empty string for empty input', () => {
    expect(convertStringToHyphenatedLowercaseWords('')).toBe('')
  })
})

describe('processMatches', () => {
  const baseEntry = {
    GAZETTEER_ENTRY: {
      NAME1: 'London',
      NAME2: 'Central',
      DISTRICT_BOROUGH: 'Westminster',
      COUNTY_UNITARY: 'Greater London'
    }
  }

  //   it('should return filtered matches based on userLocation match', () => {
  //     const matches = [baseEntry]
  //     const result = processMatches(matches, 'London', 'Central')
  //     expect(result.length).toBe(1)
  //     expect(result[0].GAZETTEER_ENTRY.ID).toBe('central_westminster')
  //   })

  it.skip('should handle partial postcode logic and override NAME1', () => {
    const matches = [JSON.parse(JSON.stringify(baseEntry))]
    const result = processMatches(matches, 'W1', 'Central')
    expect(result).toHaveLength(1)
    expect(result[0].GAZETTEER_ENTRY.NAME1).toBe('Central')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('central_westminster')
  })

  it('should handle partial postcode with no NAME2', () => {
    const entry = {
      GAZETTEER_ENTRY: {
        NAME1: 'W1',
        DISTRICT_BOROUGH: 'Camden',
        COUNTY_UNITARY: 'London'
      }
    }
    const matches = [entry]
    const result = processMatches(matches, 'W1', 'W1')
    expect(result[0].GAZETTEER_ENTRY.NAME1).toBe('W1')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('w1_camden')
  })

  //   it('should handle entries with no DISTRICT_BOROUGH but with NAME2', () => {
  //     const entry = {
  //       GAZETTEER_ENTRY: {
  //         NAME1: 'Oxford',
  //         NAME2: 'Cowley',
  //         COUNTY_UNITARY: 'Oxfordshire'
  //       }
  //     }
  //     const result = processMatches([entry], 'Cowley', 'Cowley')
  //     expect(result[0].GAZETTEER_ENTRY.ID).toBe('cowley_oxfordshire')
  //   })

  it.skip('should handle entries with no NAME2 and no DISTRICT_BOROUGH', () => {
    const entry = {
      GAZETTEER_ENTRY: {
        NAME1: 'Reading',
        COUNTY_UNITARY: 'Berkshire'
      }
    }
    const result = processMatches([entry], 'Reading', 'Reading')

    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toHaveProperty('GAZETTEER_ENTRY')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('reading_berkshire')
  })

  it('should return empty array if no matches found', () => {
    const entry = {
      GAZETTEER_ENTRY: {
        NAME1: 'Brighton',
        NAME2: 'Hove',
        DISTRICT_BOROUGH: 'Brighton and Hove',
        COUNTY_UNITARY: 'East Sussex'
      }
    }
    const result = processMatches([entry], 'London', 'Nowhere')
    expect(result).toEqual([])
  })

  it.skip('should handle undefined NAME2 gracefully', () => {
    const entry = {
      GAZETTEER_ENTRY: {
        NAME1: 'York',
        DISTRICT_BOROUGH: 'Yorkshire',
        COUNTY_UNITARY: 'North Yorkshire'
      }
    }
    const result = processMatches([entry], 'York', 'York')
    expect(result[0].GAZETTEER_ENTRY.ID).toBe('york_yorkshire')
  })

  it.skip('should handle missing GAZETTEER_ENTRY gracefully', () => {
    const entry = {} // No GAZETTEER_ENTRY
    const result = processMatches([entry], 'Test', 'Test')
    expect(result).toEqual([])
  })
})
