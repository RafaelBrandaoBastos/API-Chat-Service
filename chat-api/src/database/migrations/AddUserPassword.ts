import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class AddUserPassword1713398200000 implements MigrationInterface {
  name = 'AddUserPassword1713398200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add password column to user table
    await queryRunner.query(
      `ALTER TABLE "user" ADD "password" character varying`,
    );

    // Get all existing users
    const users = await queryRunner.query(`SELECT id FROM "user"`);

    // Set a secure default password for existing users with UUID + salt
    for (const user of users) {
      const temporaryPassword = `temp_${user.id.substring(0, 8)}`;
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      await queryRunner.query(
        `UPDATE "user" SET "password" = $1 WHERE id = $2`,
        [hashedPassword, user.id],
      );

      // You might want to log these temporary passwords or notify users to change them
      console.log(
        `User ${user.id} has temporary password: ${temporaryPassword}`,
      );
    }

    // Make password column not nullable
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "password" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "password"`);
  }
}
