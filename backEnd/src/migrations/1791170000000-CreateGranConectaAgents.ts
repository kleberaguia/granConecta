import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from "typeorm";

export class CreateGranConectaAgents1791170000000
  implements MigrationInterface
{
  name = "CreateGranConectaAgents1791170000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("granconecta_agents");

    if (hasTable) {
      console.log(
        "[Migration] Tabela granconecta_agents já existe. Criação ignorada."
      );
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: "granconecta_agents",
        columns: [
          {
            name: "id",
            type: "varchar",
            length: "36",
            isPrimary: true,
            isNullable: false,
          },

          {
            name: "store_id",
            type: "varchar",
            length: "36",
            isNullable: false,
          },

          {
            name: "name",
            type: "varchar",
            length: "120",
            isNullable: false,
            default: "'Agente Comercial GranConecta'",
          },

          {
            name: "type",
            type: "enum",
            enum: ["COMMERCIAL"],
            isNullable: false,
            default: "'COMMERCIAL'",
          },

          {
            name: "responsibility",
            type: "varchar",
            length: "255",
            isNullable: false,
          },

          {
            name: "objective",
            type: "text",
            isNullable: true,
          },

          {
            name: "status",
            type: "enum",
            enum: ["ACTIVE", "PAUSED", "DISABLED"],
            isNullable: false,
            default: "'ACTIVE'",
          },

          {
            name: "autonomy_level",
            type: "enum",
            enum: ["ADVISORY", "ASSISTED", "AUTONOMOUS"],
            isNullable: false,
            default: "'ASSISTED'",
          },

          // ============================================================
          // PERMISSÕES DO AGENTE
          // ============================================================

          {
            name: "can_read_catalog",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 1,
          },

          {
            name: "can_create_opportunity",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 1,
          },

          {
            name: "can_advance_commercial_flow",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 1,
          },

          {
            name: "can_request_human_handoff",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 1,
          },

          {
            name: "can_propose_campaign",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 1,
          },

          {
            name: "can_send_campaign",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 0,
          },

          {
            name: "can_change_price",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 0,
          },

          {
            name: "can_refund_payment",
            type: "tinyint",
            width: 1,
            isNullable: false,
            default: 0,
          },

          // ============================================================
          // CONFIGURAÇÃO DA IA
          // ============================================================

          {
            name: "provider",
            type: "varchar",
            length: "50",
            isNullable: false,
            default: "'OPENROUTER'",
          },

          {
            name: "model",
            type: "varchar",
            length: "120",
            isNullable: true,
          },

          {
            name: "instructions",
            type: "text",
            isNullable: true,
          },

          {
            name: "metadata",
            type: "json",
            isNullable: true,
          },

          // ============================================================
          // AUDITORIA
          // ============================================================

          {
            name: "createdAt",
            type: "datetime",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
          },

          {
            name: "updatedAt",
            type: "datetime",
            isNullable: false,
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // ================================================================
    // ÍNDICES
    // ================================================================

    await queryRunner.createIndex(
      "granconecta_agents",
      new TableIndex({
        name: "idx_granconecta_agent_store",
        columnNames: ["store_id"],
      })
    );

    await queryRunner.createIndex(
      "granconecta_agents",
      new TableIndex({
        name: "idx_granconecta_agent_status",
        columnNames: ["status"],
      })
    );

    await queryRunner.createIndex(
      "granconecta_agents",
      new TableIndex({
        name: "idx_granconecta_agent_type",
        columnNames: ["type"],
      })
    );

    await queryRunner.createIndex(
      "granconecta_agents",
      new TableIndex({
        name: "uk_granconecta_agent_store_type",
        columnNames: ["store_id", "type"],
        isUnique: true,
      })
    );

    console.log(
      "[Migration] Tabela granconecta_agents criada com sucesso."
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("granconecta_agents");

    if (!hasTable) {
      return;
    }

    await queryRunner.dropTable("granconecta_agents");

    console.log(
      "[Migration] Tabela granconecta_agents removida."
    );
  }
}