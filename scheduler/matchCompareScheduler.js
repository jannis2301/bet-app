const cron = require('node-cron')
const { compareScores } = require('./compareScores')

const initializeCron = () => {
  /* cron.schedule('* * * * *', async () => {
    try {
      await compareScores()
    } catch (error) {
      console.error('Error while updating scores:', error)
    }
  }) */
  // Run at midnight every Sunday to Monday (Sunday 00:00)
  cron.schedule('0 0 * * 0', async () => {
    try {
      await compareScores()
    } catch (error) {
      console.error('Error while updating scores:', error)
    }
  })

  // Run at midnight every Wednesday to Thursday (Wednesday 00:00)
  cron.schedule('0 0 * * 3', async () => {
    try {
      await compareScores()
    } catch (error) {
      console.error('Error while updating scores:', error)
    }
  })
}

module.exports = { initializeCron }
