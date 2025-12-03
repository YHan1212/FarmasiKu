/**
 * Helper function to show loading overlay with minimum display time
 * @param {Function} setLoading - State setter function for loading
 * @param {Function} asyncFunction - Async function to execute
 * @param {string} message - Loading message to display
 * @param {number} minDisplayTime - Minimum display time in milliseconds (default: 1500ms)
 * @returns {Promise} - Promise that resolves when operation completes
 */
export async function withLoading(
  setLoading,
  asyncFunction,
  message = 'Loading...',
  minDisplayTime = 1500
) {
  const startTime = Date.now()
  setLoading(true)

  try {
    const result = await asyncFunction()
    const elapsedTime = Date.now() - startTime
    const remainingTime = Math.max(0, minDisplayTime - elapsedTime)

    // Ensure loading shows for at least minDisplayTime
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }

    return result
  } catch (error) {
    const elapsedTime = Date.now() - startTime
    const remainingTime = Math.max(0, minDisplayTime - elapsedTime)

    // Even on error, ensure minimum display time
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime))
    }

    throw error
  } finally {
    setLoading(false)
  }
}

