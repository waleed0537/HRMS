module.exports = {
  apps: [
    {
      name: "attendance-sync",
      script: "./attendance-sync-daemon.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      exp_backoff_restart_delay: 1000, // Restart with exponential backoff
      env: {
        NODE_ENV: "production",
        DEVICE_IP: "192.168.100.35",
        DEVICE_PORT: "4370",
        DEVICE_INPORT: "5678",
        MONGODB_URI: "mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms",
        SYNC_INTERVAL: "5000",
        LOG_DIR: "./logs"
      }
    }
  ]
};