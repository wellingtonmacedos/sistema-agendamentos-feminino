module.exports = {
  apps: [{
    name: "agenda-feminino",
    script: "./src/server.js",
    env: {
      NODE_ENV: "production",
      PORT: 3001,
      MONGO_URI: "mongodb://localhost:27017/agenda-feminino"
    }
  }]
}
