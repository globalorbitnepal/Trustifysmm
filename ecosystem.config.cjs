module.exports = {
  apps: [
    {
      name: "trustifysmm",
      cwd: "/srv/apps/trustifysmm",
      script: "npm",
      args: "run start -- --port 3036",
      interpreter: "none",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3036",
        HOSTNAME: "127.0.0.1"
      },
      time: true
    }
  ]
};
