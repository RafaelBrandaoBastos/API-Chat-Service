import { dataSource } from '../typeorm.config';

// Check if migration name is provided as command-line argument
const migrationNameArg = process.argv[2];

async function registerMigration() {
  try {
    // Initialize connection
    await dataSource.initialize();
    console.log('Conexão com o banco de dados inicializada');

    // Default migration to register if none provided
    const migrationName = migrationNameArg || 'AddUserPassword1713398200000';

    // Check if migration is already registered
    const result = await dataSource.query(
      `SELECT * FROM migrations WHERE name = $1`,
      [migrationName],
    );

    if (result.length === 0) {
      // Register migration manually
      const timestamp = migrationName.replace(/\D/g, '').substring(0, 13);
      await dataSource.query(
        `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
        [parseInt(timestamp), migrationName],
      );
      console.log(
        `Migração ${migrationName} registrada manualmente com sucesso!`,
      );
    } else {
      console.log(
        `Migração ${migrationName} já está registrada na tabela migrations.`,
      );
    }

    process.exit(0);
  } catch (error) {
    console.error('Erro ao registrar migração:', error);
    process.exit(1);
  }
}

// Execute migration registration
registerMigration();
