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
        "socket.io-client": false, // Adicionar fallback para socket.io-client
      };

      // Configurar aliases para resolver problemas de importação
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        "socket.io-client": require.resolve("./src/socket-io-mock.js"),
      };

      // Desabilitar HMR para evitar requisições infinitas
      if (webpackConfig.devServer) {
        webpackConfig.devServer.hot = false;
      }

      // Remover o plugin HotModuleReplacementPlugin
      webpackConfig.plugins = webpackConfig.plugins.filter(
        (plugin) => plugin.constructor.name !== "HotModuleReplacementPlugin"
      );

      return webpackConfig;
    },
  },
  devServer: {
    hot: false,
    liveReload: false,
  },
};
