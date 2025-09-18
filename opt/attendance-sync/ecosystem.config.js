// module.exports = {
//   apps: [
//     {
//       name: "attendance-sync",
//       script: "./attendance-sync-daemon.js",
//       instances: 1,
//       autorestart: true,
//       watch: false,
//       max_memory_restart: "200M",
//       exp_backoff_restart_delay: 1000, // Restart with exponential backoff
//       env: {
//         NODE_ENV: "production",
//         DEVICE_IP: "192.168.100.35",
//         DEVICE_PORT: "4370",
//         DEVICE_INPORT: "5678",
//         MONGODB_URI: "mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms",
//         SYNC_INTERVAL: "5000",
//         LOG_DIR: "./logs"
//       }
//     }
//   ]
// };


// ecosystem.config.js - Production PM2 configuration
// module.exports = {
//   apps: [
//     {
//       name: 'hrms-backend',
//       script: './src/Backend/server.js',
//       instances: 2, // Use 2 instances for better performance
//       exec_mode: 'cluster',
//       autorestart: true,
//       watch: false, // Don't watch in production
//       max_memory_restart: '1G',
//       env: {
//         NODE_ENV: 'production',
//         PORT: 5000
//       },
//       error_file: '/home/hrms/logs/backend-error.log',
//       out_file: '/home/hrms/logs/backend-out.log',
//       log_file: '/home/hrms/logs/backend.log',
//       time: true,
//       // Auto-restart on crash
//       min_uptime: '10s',
//       max_restarts: 10,
//       // Log rotation
//       log_date_format: 'YYYY-MM-DD HH:mm Z'
//     },
//     {
//       name: "attendance-sync",
//       script: "./attendance-sync-daemon.js",
//       instances: 1,
//       autorestart: true,
//       watch: false,
//       max_memory_restart: "200M",
//       exp_backoff_restart_delay: 1000,
//       env: {
//         NODE_ENV: "production",
//         DEVICE_IP: "192.168.100.35",
//         DEVICE_PORT: "4370",
//         DEVICE_INPORT: "5678",
//         MONGODB_URI: "mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms",
//         SYNC_INTERVAL: "5000",
//         LOG_DIR: "/home/hrms/logs"
//       },
//       error_file: '/home/hrms/logs/attendance-error.log',
//       out_file: '/home/hrms/logs/attendance-out.log',
//       log_file: '/home/hrms/logs/attendance.log',
//       time: true
//     }
//   ]
// };

// ecosystem.config.js - Combined configuration for both services
module.exports = {
  apps: [
    // Main HRMS Backend Server
    {
      name: 'hrms-backend',
      script: '/home/hrms/backend/HRMS/src/Backend/server.js',  // Path from attendance-sync folder to server.js
      cwd: '/home/hrms/backend/HRMS',         // Working directory
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/home/hrms/logs/backend-error.log',
      out_file: '/home/hrms/logs/backend-out.log',
      log_file: '/home/hrms/logs/backend.log',
      time: true
    },
    
    // Attendance Sync Daemon (existing)
    {
      name: "attendance-sync",
      script: "./attendance-sync-daemon.js",  // Current attendance sync script
      cwd: '/home/hrms/backend/HRMS/opt/attendance-sync',  // Stay in current directory
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "200M",
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: "production",
        DEVICE_IP: "192.168.100.35",
        DEVICE_PORT: "4370",
        DEVICE_INPORT: "5678",
        MONGODB_URI: "mongodb+srv://hrmsmongo:YWCuBGMkletJv65z@cluster0.hrtxh.mongodb.net/hrms",
        SYNC_INTERVAL: "5000",
        LOG_DIR: "/home/hrms/logs"
      },
      error_file: '/home/hrms/logs/attendance-error.log',
      out_file: '/home/hrms/logs/attendance-out.log',
      log_file: '/home/hrms/logs/attendance.log',
      time: true
    }
  ]
};