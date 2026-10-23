import "reflect-metadata";
import * as dotenv from "dotenv";
import path from "node:path";

const ENV = process.env.NODE_ENV || "development";

const envMap: Record<string, string> = {
    local: ".env.local",
    development: ".env.dev",
    production: ".env.production",
};

const envFile = envMap[ENV] || ".env.dev";

dotenv.config({
    path: path.resolve(process.cwd(), envFile),
    override: true,
});

import { AppDataSource } from "../config/data-source";
import { Usuario } from "../models/UserModels";
import { encrypt, decrypt } from "../utils/crypto";

const USUARIO_ID =
    "af30b0f0-0e95-4518-beb5-8785516948f9";

/**
 * Verifica se o valor está no formato produzido atualmente
 * pelo src/utils/crypto.ts:
 *
 * <IV_HEX_32_CARACTERES>:<CIPHERTEXT_HEX>
 */
function possuiFormatoCriptografado(
    valor: string
): boolean {
    const partes = valor.split(":");

    if (partes.length !== 2) {
        return false;
    }

    const ivHex = partes[0];
    const encryptedHex = partes[1];

    if (!ivHex || !encryptedHex) {
        return false;
    }

    const ivValido =
        /^[0-9a-fA-F]{32}$/.test(ivHex);

    const encryptedValido =
        encryptedHex.length > 0 &&
        encryptedHex.length % 2 === 0 &&
        /^[0-9a-fA-F]+$/.test(encryptedHex);

    return ivValido && encryptedValido;
}

async function migrarTokenMercadoPago(): Promise<void> {
    try {
        console.log("==========================================");
        console.log(" MIGRAÇÃO TOKEN MERCADO PAGO");
        console.log("==========================================");
        console.log("Ambiente:", ENV);
        console.log("Arquivo ENV:", envFile);
        console.log("Usuário:", USUARIO_ID);
        console.log("");

        // =========================================================
        // 1. BANCO
        // =========================================================

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log("✅ Banco de dados conectado.");

        const usuarioRepo =
            AppDataSource.getRepository(Usuario);

        // =========================================================
        // 2. BUSCA SOMENTE O USUÁRIO DA MIGRAÇÃO
        // =========================================================

        const usuario =
            await usuarioRepo.findOne({
                where: {
                    id: USUARIO_ID,
                },
            });

        if (!usuario) {
            throw new Error(
                "USUARIO_NAO_ENCONTRADO"
            );
        }

        console.log(
            "Usuário encontrado:",
            usuario.name
        );

        console.log(
            "Gateway conta ID:",
            usuario.gateway_conta_id ||
            "NÃO INFORMADO"
        );

        // =========================================================
        // 3. TOKEN ATUAL
        // =========================================================

        const tokenAtual =
            String(
                usuario.mercadoPagoAccessToken || ""
            ).trim();

        if (!tokenAtual) {
            throw new Error(
                "USUARIO_SEM_TOKEN_MERCADO_PAGO"
            );
        }

        /*
         * IMPORTANTE:
         *
         * Nunca imprimimos o conteúdo do token.
         */
        console.log(
            "Token encontrado. Tamanho:",
            tokenAtual.length
        );

        // =========================================================
        // 4. VERIFICA SE JÁ ESTÁ CRIPTOGRAFADO
        // =========================================================

        if (
            possuiFormatoCriptografado(
                tokenAtual
            )
        ) {
            console.log("");
            console.log(
                "ℹ️ O token já possui o formato criptografado atual."
            );

            /*
             * Também testa se a ENCRYPTION_KEY
             * deste ambiente consegue abri-lo.
             */
            const tokenTeste =
                decrypt(tokenAtual);

            if (!tokenTeste) {
                throw new Error(
                    "TOKEN_CRIPTOGRAFADO_MAS_NAO_PODE_SER_LIDO"
                );
            }

            console.log(
                "✅ Token descriptografado com sucesso."
            );

            console.log(
                "Nenhuma alteração no banco foi necessária."
            );

            return;
        }

        // =========================================================
        // 5. ACEITA SOMENTE O FORMATO LEGADO CONHECIDO
        // =========================================================

        const tokenLegadoValido =
            tokenAtual.startsWith("APP_USR-") ||
            tokenAtual.startsWith("TEST-");

        if (!tokenLegadoValido) {
            throw new Error(
                "FORMATO_TOKEN_DESCONHECIDO_MIGRACAO_CANCELADA"
            );
        }

        console.log("");
        console.log(
            "⚠️ Token legado em texto puro detectado."
        );

        console.log(
            "Iniciando criptografia sem exibir o conteúdo..."
        );

        // =========================================================
        // 6. CRIPTOGRAFA
        // =========================================================

        const tokenCriptografado =
            encrypt(tokenAtual);

        // =========================================================
        // 7. VALIDA ANTES DE TOCAR NO BANCO
        // =========================================================

        if (
            !possuiFormatoCriptografado(
                tokenCriptografado
            )
        ) {
            throw new Error(
                "FALHA_AO_GERAR_TOKEN_CRIPTOGRAFADO"
            );
        }

        /*
         * Faz um teste de ida e volta:
         *
         * texto puro
         *    ↓
         * encrypt()
         *    ↓
         * decrypt()
         *    ↓
         * deve ser exatamente igual ao original
         */
        const tokenValidacao =
            decrypt(tokenCriptografado);

        if (
            tokenValidacao !== tokenAtual
        ) {
            throw new Error(
                "VALIDACAO_CRIPTOGRAFIA_FALHOU"
            );
        }

        console.log(
            "✅ Criptografia validada antes da gravação."
        );

        // =========================================================
        // 8. SALVA SOMENTE O ACCESS TOKEN
        // =========================================================

        usuario.mercadoPagoAccessToken =
            tokenCriptografado;

        await usuarioRepo.save(
            usuario
        );

        // =========================================================
        // 9. RELÊ O REGISTRO
        // =========================================================

        const usuarioDepois =
            await usuarioRepo.findOne({
                where: {
                    id: USUARIO_ID,
                },
            });

        if (!usuarioDepois) {
            throw new Error(
                "USUARIO_NAO_ENCONTRADO_APOS_GRAVACAO"
            );
        }

        const tokenSalvo =
            String(
                usuarioDepois
                    .mercadoPagoAccessToken || ""
            ).trim();

        if (!tokenSalvo) {
            throw new Error(
                "TOKEN_NAO_ENCONTRADO_APOS_GRAVACAO"
            );
        }

        if (
            !possuiFormatoCriptografado(
                tokenSalvo
            )
        ) {
            throw new Error(
                "FORMATO_INVALIDO_APOS_GRAVACAO"
            );
        }

        // =========================================================
        // 10. TESTE FINAL DE DESCRIPTOGRAFIA
        // =========================================================

        const tokenFinal =
            decrypt(tokenSalvo);

        if (
            tokenFinal !== tokenAtual
        ) {
            throw new Error(
                "TOKEN_DIFERENTE_APOS_MIGRACAO"
            );
        }

        // =========================================================
        // RESULTADO
        // =========================================================

        console.log("");
        console.log("==========================================");
        console.log(" MIGRAÇÃO CONCLUÍDA COM SUCESSO");
        console.log("==========================================");

        console.log(
            "✅ Token antigo convertido para formato criptografado."
        );

        console.log(
            "✅ Formato IV:ciphertext validado."
        );

        console.log(
            "✅ IV possui 32 caracteres hexadecimais."
        );

        console.log(
            "✅ Token foi relido do banco."
        );

        console.log(
            "✅ Token foi descriptografado corretamente."
        );

        console.log(
            "✅ gateway_conta_id não foi alterado."
        );

        console.log(
            "✅ Nenhum pagamento foi alterado."
        );

        console.log(
            "✅ Nenhuma transação foi alterada."
        );

    } catch (error: unknown) {
        console.error("");
        console.error("==========================================");
        console.error(" MIGRAÇÃO CANCELADA");
        console.error("==========================================");

        if (error instanceof Error) {
            console.error(
                error.message
            );
        } else {
            console.error(
                "ERRO_DESCONHECIDO"
            );
        }

        process.exitCode = 1;

    } finally {
        if (
            AppDataSource.isInitialized
        ) {
            await AppDataSource.destroy();
        }
    }
}

migrarTokenMercadoPago();