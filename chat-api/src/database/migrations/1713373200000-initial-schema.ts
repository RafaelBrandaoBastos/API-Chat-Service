import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class InitialSchema1713373200000 implements MigrationInterface {
  name = 'InitialSchema1713373200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Add uuid-ossp extension
      await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

      // Verificar se a tabela migrations existe
      const migrationsTableExists = await queryRunner.hasTable('migrations');
      if (!migrationsTableExists) {
        await queryRunner.createTable(
          new Table({
            name: 'migrations',
            columns: [
              {
                name: 'id',
                type: 'int',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              {
                name: 'timestamp',
                type: 'bigint',
                isNullable: false,
              },
              {
                name: 'name',
                type: 'varchar',
                isNullable: false,
              },
            ],
          }),
        );
      }

      // Verificar se a tabela user existe
      const userTableExists = await queryRunner.hasTable('user');
      if (!userTableExists) {
        // Criar tabela de usuários
        await queryRunner.query(`
          CREATE TABLE "user" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "login" character varying NOT NULL,
            CONSTRAINT "UQ_a62473490b3e4578fd683235c5e" UNIQUE ("login"),
            CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
          )
        `);
      }

      // Verificar se a tabela room existe
      const roomTableExists = await queryRunner.hasTable('room');
      if (!roomTableExists) {
        // Criar tabela de salas
        await queryRunner.query(`
          CREATE TABLE "room" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "description" character varying,
            CONSTRAINT "PK_c6d46db005d623e691b2fbcba23" PRIMARY KEY ("id")
          )
        `);
      }

      // Verificar se a tabela message existe
      const messageTableExists = await queryRunner.hasTable('message');
      if (!messageTableExists) {
        // Criar tabela de mensagens
        await queryRunner.query(`
          CREATE TABLE "message" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "content" character varying NOT NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "senderId" uuid,
            "roomId" uuid,
            "receiverId" uuid,
            CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id")
          )
        `);
      }

      // Verificar se a tabela de junção existe
      const junctionTableExists = await queryRunner.hasTable('room_users_user');
      if (!junctionTableExists) {
        // Criar tabela de junção para a relação many-to-many entre Sala e Usuário
        await queryRunner.query(`
          CREATE TABLE "room_users_user" (
            "roomId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            CONSTRAINT "PK_a12c269a924e93b49f8b8faf169" PRIMARY KEY ("roomId", "userId")
          )
        `);

        // Adicionar índices
        await queryRunner.query(`
          CREATE INDEX "IDX_3e96ccfed308e8b94f4c192df7" ON "room_users_user" ("roomId")
        `);

        await queryRunner.query(`
          CREATE INDEX "IDX_d7f569cfe9e3b5d2bd3f14453a" ON "room_users_user" ("userId")
        `);
      }

      // Adicionar restrições de chave estrangeira apenas se as tabelas foram criadas
      if (!messageTableExists && !userTableExists) {
        await queryRunner.query(`
          ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"
          FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
      }

      if (!messageTableExists && !roomTableExists) {
        await queryRunner.query(`
          ALTER TABLE "message" ADD CONSTRAINT "FK_fdfe54a21d1542c564384b74d5c"
          FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
      }

      if (!messageTableExists && !userTableExists) {
        await queryRunner.query(`
          ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906ed26a59b51f1e62232"
          FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
      }

      if (!junctionTableExists && !roomTableExists) {
        await queryRunner.query(`
          ALTER TABLE "room_users_user" ADD CONSTRAINT "FK_3e96ccfed308e8b94f4c192df7a"
          FOREIGN KEY ("roomId") REFERENCES "room"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
      }

      if (!junctionTableExists && !userTableExists) {
        await queryRunner.query(`
          ALTER TABLE "room_users_user" ADD CONSTRAINT "FK_d7f569cfe9e3b5d2bd3f14453a8"
          FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);
      }

      // Registrar a migração manualmente se todas as tabelas já existirem
      if (
        userTableExists &&
        roomTableExists &&
        messageTableExists &&
        junctionTableExists
      ) {
        await this.registerMigration(queryRunner);
      }
    } catch (error) {
      // Se ocorrer algum erro, tente registrar a migração mesmo assim
      if (error.message.includes('already exists')) {
        console.log(
          'Algumas tabelas já existem, registrando migração manualmente...',
        );
        await this.registerMigration(queryRunner);
      } else {
        // Se for outro tipo de erro, reenvie-o
        throw error;
      }
    }
  }

  private async registerMigration(queryRunner: QueryRunner): Promise<void> {
    try {
      // Verificar se a migração já está registrada
      const result = await queryRunner.query(
        `SELECT * FROM migrations WHERE name = $1`,
        [this.name],
      );

      if (result.length === 0) {
        // Registrar a migração manualmente
        await queryRunner.query(
          `INSERT INTO migrations (timestamp, name) VALUES ($1, $2)`,
          [1713373200000, this.name],
        );
        console.log('Migração registrada manualmente com sucesso!');
      } else {
        console.log('Migração já está registrada na tabela migrations.');
      }
    } catch (error) {
      console.error('Erro ao registrar migração manualmente:', error.message);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Tentar remover as restrições de chave estrangeira (não falha se não existir)
    try {
      await queryRunner.query(
        `ALTER TABLE "room_users_user" DROP CONSTRAINT IF EXISTS "FK_d7f569cfe9e3b5d2bd3f14453a8"`,
      );
      await queryRunner.query(
        `ALTER TABLE "room_users_user" DROP CONSTRAINT IF EXISTS "FK_3e96ccfed308e8b94f4c192df7a"`,
      );
      await queryRunner.query(
        `ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "FK_71fb36906ed26a59b51f1e62232"`,
      );
      await queryRunner.query(
        `ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "FK_fdfe54a21d1542c564384b74d5c"`,
      );
      await queryRunner.query(
        `ALTER TABLE "message" DROP CONSTRAINT IF EXISTS "FK_bc096b4e18b1f9508197cd98066"`,
      );
    } catch (error) {
      console.log('Algumas restrições podem não existir:', error.message);
    }

    // Tentar remover os índices (não falha se não existir)
    try {
      await queryRunner.query(
        `DROP INDEX IF EXISTS "public"."IDX_d7f569cfe9e3b5d2bd3f14453a"`,
      );
      await queryRunner.query(
        `DROP INDEX IF EXISTS "public"."IDX_3e96ccfed308e8b94f4c192df7"`,
      );
    } catch (error) {
      console.log('Alguns índices podem não existir:', error.message);
    }

    // Tentar remover as tabelas (não falha se não existir)
    try {
      await queryRunner.query(`DROP TABLE IF EXISTS "room_users_user"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "message"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "room"`);
      await queryRunner.query(`DROP TABLE IF EXISTS "user"`);
    } catch (error) {
      console.log('Algumas tabelas podem não existir:', error.message);
    }

    // Drop extension
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
