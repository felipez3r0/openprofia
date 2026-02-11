import { buildApp } from './app.js';
import { getFastifyOptions, defaultConfig } from './config/env.js';
import { documentProcessor } from './worker/processor.js';
import { skillService } from './services/skill.service.js';
import { settingsService } from './services/settings.service.js';
import { ollamaService } from './services/ollama.service.js';
import db from './db/connection.js';

/**
 * Bootstrap do servidor
 */
async function start() {
  const app = await buildApp(getFastifyOptions());

  try {
    // Aplica URL do Ollama salva no DB (se houver)
    const savedUrl = settingsService.get('ollama_base_url');
    if (savedUrl !== defaultConfig.OLLAMA_BASE_URL) {
      ollamaService.updateBaseUrl(savedUrl);
    }

    // Registra skills built-in que existem no disco
    skillService.seedDefaultSkills();

    // Inicia o servidor HTTP
    await app.listen({
      port: defaultConfig.PORT,
      host: defaultConfig.HOST,
    });

    // Log especial para sidecar detectar que o server está pronto
    if (defaultConfig.SIDECAR_MODE) {
      console.log(`OPENPROFIA_SERVER_READY:${defaultConfig.PORT}`);
    }

    app.log.info(
      `🚀 Server listening on ${defaultConfig.HOST}:${defaultConfig.PORT}`,
    );
    app.log.info(
      `📚 API documentation: http://localhost:${defaultConfig.PORT}/docs`,
    );

    if (defaultConfig.SIDECAR_MODE) {
      app.log.info('🔒 Running in sidecar mode (localhost only)');
    }

    // Inicia o worker de background
    documentProcessor.start();
    app.log.info('🔄 Background worker started');
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`${signal} received, shutting down gracefully...`);

      // Para o worker (aguarda job corrente)
      await documentProcessor.stop();

      // Fecha o servidor
      await app.close();

      // Fecha o banco de dados
      db.close();

      app.log.info('Server closed');
      process.exit(0);
    });
  });
}

// Inicia o servidor
start();
