// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configurar o fallback para módulos Node.js
      webpackConfig.resolve.fallback = {
        net: false,
        tls: false,
        dns: false,
        fs: false, // Isso também pode ser necessário se o erro for relacionado ao 'fs'
      };

      return webpackConfig;
    },
  },
};
