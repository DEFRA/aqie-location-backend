import { proxyFetch } from '~/src/api/common/helpers/proxy.js'
import { createLogger } from '~/src/api/common/helpers/logging/logger.js'
const logger = createLogger()

function sanitizeUrlForLog(rawUrl) {
  try {
    const parsedUrl = new URL(rawUrl)
    parsedUrl.searchParams.delete('key')
    return parsedUrl.toString()
  } catch {
    // Fallback for non-standard/relative URLs
    return rawUrl.replace(/([?&])key=[^&]*/gi, '$1').replace(/[?&]$/, '')
  }
}

async function catchProxyFetchError(url, options, shouldCallApi) {
  let statusCode = 200
  if (shouldCallApi) {
    try {
      const startTime = performance.now()
      const date = new Date().toUTCString()
      const response = await proxyFetch(url, options)
      const endTime = performance.now()
      const duration = endTime - startTime
      const safeUrl = sanitizeUrlForLog(url)

      logger.info(
        `API response.status: ${response.status} from ${safeUrl} fetch took ${date} ${duration} milliseconds`
      )
      statusCode = response.status
      if (!response.ok) {
        logger.info(
          `Failed to fetch data from ${safeUrl}: ${JSON.stringify(response)}`
        )
        throw new Error(
          `HTTP error! status from ${safeUrl}: ${response.status}`
        )
      }
      const data = await response.json()
      return [statusCode, data]
    } catch (error) {
      const safeUrl = sanitizeUrlForLog(url)
      logger.error(
        `Failed to proxyFetch data from ${safeUrl}: ${error.message}`
      )
      return [error]
    }
  }
  return [statusCode, 'wrong postcode']
}

export { catchProxyFetchError }
