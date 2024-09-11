const { createClient } = require("redis")

let redisClient

async function createRedisClient() {
  // Declare client explicitly
  const client = createClient({
    url: process.env.REDIS_URL
  })

  client.on("connect", () => {
    console.log("Redis client connected")
  })

  client.on("error", (err) => {
    console.log(`Something went wrong: ${err}`)
  })

  // Wait for the client to connect
  await client.connect()

  return client
}

// Initialize the client if it hasn't been created
if (!redisClient) {
  redisClient = createRedisClient()
}

// Export the promise of redisClient
module.exports = redisClient
