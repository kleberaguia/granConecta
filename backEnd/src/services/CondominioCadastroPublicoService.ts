import { AppDataSource } from "../config/data-source";

import {
    Condominio,
    CondominioGeocodingStatus,
    CondominioGeocodingPrecision,
    CondominioStatusValidacao,
} from "../models/condominiosModels";

import {
    CondominioUnidade,
    CondominioUnidadeStatusValidacao,
} from "../models/CondominioUnidadeModel";

import CepService from "./address/CepService";
import GeocodingService from "./address/GeocodingService";

interface ICadastrarCondominioPublicoRequest {
    nome: string;
    cep: string;
    numero: string;

    complemento?: string | null;

    bloco_torre: string;
    unidade_apto: string;
}

interface ICadastrarCondominioPublicoResponse {
    condominio: Condominio;
    unidade: CondominioUnidade;

    condominioCriado: boolean;
    unidadeCriada: boolean;
}

class CondominioCadastroPublicoService {
    private condominioRepository =
        AppDataSource.getRepository(Condominio);

    private unidadeRepository =
        AppDataSource.getRepository(CondominioUnidade);

    /**
     * Remove acentos, espaços duplicados etc.
     *
     * Usado somente para comparação.
     */
    private normalizarTexto(valor: string): string {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/\s+/g, " ")
            .toUpperCase();
    }

    private normalizarCep(valor: string): string {
        return String(valor || "").replace(/\D/g, "");
    }

    /**
     * Normaliza torre/bloco para composição do código.
     *
     * Exemplos:
     *
     * "Torre 2" -> "T2"
     * "T 2"     -> "T2"
     * "Bloco A" -> "BA"
     * "A"       -> "A"
     */
    private normalizarBlocoTorre(valor: string): string {
        let texto = this.normalizarTexto(valor);

        texto = texto
            .replace(/^TORRE\s*/i, "T")
            .replace(/^BLOCO\s*/i, "B")
            .replace(/[^A-Z0-9]/g, "");

        return texto;
    }

    private normalizarUnidade(valor: string): string {
        return this.normalizarTexto(valor)
            .replace(/[^A-Z0-9]/g, "");
    }

    /**
     * Gera a base da sigla.
     *
     * Chácara das Flores -> CDF
     * Gran Reserva Paulista -> GRP
     *
     * Palavras de ligação são ignoradas.
     */
    private gerarSiglaBase(nome: string): string {
        const ignorar = new Set([
            "DA",
            "DAS",
            "DE",
            "DO",
            "DOS",
            "E",
            "EM",
        ]);

        const palavras = this.normalizarTexto(nome)
            .replace(/[^A-Z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(Boolean)
            .filter((palavra) => !ignorar.has(palavra));

        if (palavras.length === 0) {
            return "CON";
        }

        if (palavras.length === 1) {
            const primeiraPalavra = palavras[0];

            if (!primeiraPalavra) {
                return "CON";
            }

            return primeiraPalavra
                .replace(/[^A-Z0-9]/g, "")
                .substring(0, 3)
                .padEnd(3, "X");
        }

        const sigla = palavras
            .map((palavra) => {
                return palavra.charAt(0);
            })
            .filter(Boolean)
            .join("")
            .substring(0, 6);

        return sigla || "CON";
    }

    /**
     * Garante que a sigla não colida com outro condomínio.
     *
     * Exemplo:
     *
     * GRP
     * GRP2
     * GRP3
     */
    private async gerarSiglaUnica(
        nome: string
    ): Promise<string> {
        const base = this.gerarSiglaBase(nome)
            .substring(0, 10);

        let tentativa = base;
        let contador = 2;

        while (true) {
            const existente =
                await this.condominioRepository.findOne({
                    where: {
                        sigla: tentativa,
                    },
                });

            if (!existente) {
                return tentativa;
            }

            const sufixo = String(contador);

            tentativa =
                `${base.substring(
                    0,
                    Math.max(1, 12 - sufixo.length)
                )}${sufixo}`;

            contador++;

            if (contador > 9999) {
                throw new Error(
                    "NAO_FOI_POSSIVEL_GERAR_SIGLA_CONDOMINIO"
                );
            }
        }
    }

    /**
     * codigo_acesso ainda é NOT NULL e UNIQUE no banco.
     *
     * Como o sistema antigo ainda depende desse campo,
     * não podemos removê-lo neste momento.
     *
     * Este código é interno/legado e NÃO será o código
     * residencial CHF-T2-1801.
     */
    private async gerarCodigoAcessoLegado(): Promise<string> {
        for (
            let tentativa = 0;
            tentativa < 20;
            tentativa++
        ) {
            const codigo =
                `GC-${Date.now().toString(36)}-${Math.random()
                    .toString(36)
                    .substring(2, 8)}`
                    .toUpperCase();

            const existente =
                await this.condominioRepository.findOne({
                    where: {
                        codigo_acesso: codigo,
                    },
                });

            if (!existente) {
                return codigo;
            }
        }

        throw new Error(
            "NAO_FOI_POSSIVEL_GERAR_CODIGO_CONDOMINIO"
        );
    }

    /**
     * Procura primeiro pelo endereço físico.
     *
     * CEP + número é mais confiável do que comparar
     * somente o nome digitado.
     */
    private async procurarCondominioExistente(
        nome: string,
        cep: string,
        numero: string
    ): Promise<Condominio | null> {
        const porEndereco =
            await this.condominioRepository.findOne({
                where: {
                    cep,
                    numero,
                },
            });

        if (porEndereco) {
            return porEndereco;
        }

        /**
         * Compatibilidade com condomínios antigos.
         *
         * Alguns registros existentes ainda não possuem CEP.
         * Nesse caso fazemos uma segunda análise pelo nome.
         */
        const condominios =
            await this.condominioRepository.find();

        const nomeNormalizado =
            this.normalizarTexto(nome);

        const porNome =
            condominios.find(
                (condominio) =>
                    this.normalizarTexto(
                        condominio.nome
                    ) === nomeNormalizado
            );

        return porNome || null;
    }

    private gerarCodigoUnidade(
        sigla: string,
        blocoTorre: string,
        unidade: string
    ): string {
        const bloco =
            this.normalizarBlocoTorre(blocoTorre);

        const apartamento =
            this.normalizarUnidade(unidade);

        if (!bloco) {
            throw new Error(
                "BLOCO_TORRE_INVALIDO"
            );
        }

        if (!apartamento) {
            throw new Error(
                "UNIDADE_INVALIDA"
            );
        }

        return `${sigla}-${bloco}-${apartamento}`;
    }

    public async execute(
        dados: ICadastrarCondominioPublicoRequest
    ): Promise<ICadastrarCondominioPublicoResponse> {
        const nome = String(dados.nome || "")
            .trim()
            .replace(/\s+/g, " ");

        const cep =
            this.normalizarCep(dados.cep);

        const numero =
            String(dados.numero || "").trim();

        const complemento =
            dados.complemento
                ? String(dados.complemento).trim()
                : null;

        const blocoTorre =
            String(dados.bloco_torre || "").trim();

        const unidadeApto =
            String(dados.unidade_apto || "").trim();

        if (nome.length < 3) {
            throw new Error(
                "NOME_CONDOMINIO_INVALIDO"
            );
        }

        if (!/^\d{8}$/.test(cep)) {
            throw new Error("CEP_INVALIDO");
        }

        if (!numero) {
            throw new Error(
                "NUMERO_CONDOMINIO_OBRIGATORIO"
            );
        }

        if (!blocoTorre) {
            throw new Error(
                "BLOCO_TORRE_OBRIGATORIO"
            );
        }

        if (!unidadeApto) {
            throw new Error(
                "UNIDADE_APARTAMENTO_OBRIGATORIA"
            );
        }

        /**
         * Consulta o CEP no backend.
         *
         * Não confiamos em logradouro, cidade, UF ou
         * coordenadas enviados pelo frontend.
         *
         * IMPORTANTE:
         *
         * As coordenadas eventualmente retornadas pelo
         * CepService possuem precisão de CEP.
         *
         * Elas NÃO representam necessariamente o número
         * exato do imóvel.
         */
        const enderecoCep =
            await CepService.consultar(cep);

        /**
         * Somente aceitamos latitude/longitude do
         * CepService quando ele declarar explicitamente
         * que essas coordenadas possuem precisão CEP.
         */
        const possuiCoordenadasCep =
            enderecoCep.coordenadasPrecisao === "CEP" &&
            enderecoCep.latitude !== null &&
            enderecoCep.longitude !== null;

        let condominio =
            await this.procurarCondominioExistente(
                nome,
                cep,
                numero
            );

        let condominioCriado = false;

        if (!condominio) {
            const sigla =
                await this.gerarSiglaUnica(nome);

            const codigoAcesso =
                await this.gerarCodigoAcessoLegado();

            condominio =
                this.condominioRepository.create({
                    nome,

                    codigo_acesso: codigoAcesso,

                    sigla,

                    cep: enderecoCep.cep,

                    logradouro:
                        enderecoCep.logradouro || null,

                    numero,

                    complemento,

                    bairro:
                        enderecoCep.bairro || null,

                    cidade:
                        enderecoCep.cidade || null,

                    uf:
                        enderecoCep.uf || null,

                    /**
                     * Coordenadas aproximadas de CEP.
                     *
                     * Não são classificadas como ENDERECO.
                     */
                    latitude:
                        possuiCoordenadasCep
                            ? enderecoCep.latitude
                            : null,

                    longitude:
                        possuiCoordenadasCep
                            ? enderecoCep.longitude
                            : null,

                    status_validacao:
                        CondominioStatusValidacao
                            .PENDENTE_VALIDACAO,

                    geocoding_status:
                        possuiCoordenadasCep
                            ? CondominioGeocodingStatus.LOCALIZADO
                            : CondominioGeocodingStatus.PENDENTE,

                    geocoding_precision:
                        possuiCoordenadasCep
                            ? CondominioGeocodingPrecision.CEP
                            : CondominioGeocodingPrecision.NENHUMA,
                });

            condominio =
                await this.condominioRepository.save(
                    condominio
                );

            condominioCriado = true;
        }

        /**
         * Enriquece condomínios antigos/incompletos sem
         * sobrescrever informações válidas já existentes.
         */
        let condominioAlterado = false;

        if (!condominio.sigla) {
            condominio.sigla =
                await this.gerarSiglaUnica(
                    condominio.nome
                );

            condominioAlterado = true;
        }

        if (!condominio.cep) {
            condominio.cep =
                enderecoCep.cep;

            condominioAlterado = true;
        }

        if (
            !condominio.logradouro &&
            enderecoCep.logradouro
        ) {
            condominio.logradouro =
                enderecoCep.logradouro;

            condominioAlterado = true;
        }

        if (!condominio.numero) {
            condominio.numero = numero;
            condominioAlterado = true;
        }

        if (
            !condominio.complemento &&
            complemento
        ) {
            condominio.complemento =
                complemento;

            condominioAlterado = true;
        }

        if (
            !condominio.bairro &&
            enderecoCep.bairro
        ) {
            condominio.bairro =
                enderecoCep.bairro;

            condominioAlterado = true;
        }

        if (
            !condominio.cidade &&
            enderecoCep.cidade
        ) {
            condominio.cidade =
                enderecoCep.cidade;

            condominioAlterado = true;
        }

        if (
            !condominio.uf &&
            enderecoCep.uf
        ) {
            condominio.uf =
                enderecoCep.uf;

            condominioAlterado = true;
        }

        /**
         * Só utiliza coordenadas vindas do CEP quando:
         *
         * 1. o condomínio ainda não possui coordenadas;
         * 2. CepService declarou explicitamente precisão CEP;
         * 3. latitude e longitude existem.
         *
         * Nunca promovemos isso para ENDERECO aqui.
         */
        const semCoordenadas =
            condominio.latitude == null ||
            condominio.longitude == null;

        if (
            semCoordenadas &&
            possuiCoordenadasCep
        ) {
            condominio.latitude =
                enderecoCep.latitude;

            condominio.longitude =
                enderecoCep.longitude;

            condominio.geocoding_status =
                CondominioGeocodingStatus.LOCALIZADO;

            condominio.geocoding_precision =
                CondominioGeocodingPrecision.CEP;

            condominioAlterado = true;
        }

        if (condominioAlterado) {
            condominio =
                await this.condominioRepository.save(
                    condominio
                );
        }

        /**
         * Tenta promover:
         *
         * CEP -> ENDERECO
         *
         * Somente GeocodingService pode realizar essa
         * promoção porque ele valida o número retornado.
         *
         * Falha no geocoder nunca impede o cadastro e
         * nunca apaga coordenadas aproximadas de CEP
         * que já estejam disponíveis.
         */
        if (
            condominio.logradouro &&
            condominio.numero &&
            condominio.cidade &&
            condominio.uf &&
            condominio.geocoding_precision !==
                CondominioGeocodingPrecision.ENDERECO
        ) {
            try {
                const geo =
                    await GeocodingService.geocodificar({
                        logradouro:
                            condominio.logradouro,

                        numero:
                            condominio.numero,

                        bairro:
                            condominio.bairro,

                        cidade:
                            condominio.cidade,

                        uf:
                            condominio.uf,

                        cep:
                            condominio.cep,
                    });

                /**
                 * geo somente existe quando o
                 * GeocodingService conseguiu confirmar
                 * o endereço segundo suas regras.
                 */
                if (geo) {
                    condominio.latitude =
                        geo.latitude;

                    condominio.longitude =
                        geo.longitude;

                    condominio.geocoding_status =
                        CondominioGeocodingStatus.LOCALIZADO;

                    condominio.geocoding_precision =
                        CondominioGeocodingPrecision.ENDERECO;

                    condominio =
                        await this.condominioRepository.save(
                            condominio
                        );

                    console.info(
                        "[CondominioCadastroPublicoService] Condomínio promovido para precisão ENDERECO.",
                        {
                            condominioId:
                                condominio.id,

                            cep:
                                condominio.cep,

                            numero:
                                condominio.numero,

                            latitude:
                                condominio.latitude,

                            longitude:
                                condominio.longitude,
                        }
                    );
                } else {
                    console.info(
                        "[CondominioCadastroPublicoService] Endereço exato não confirmado. Mantendo precisão atual.",
                        {
                            condominioId:
                                condominio.id,

                            geocodingPrecision:
                                condominio.geocoding_precision,
                        }
                    );
                }
            } catch (error) {
                console.warn(
                    `[CondominioCadastroPublicoService] Geocodificação precisa falhou para condomínio ${condominio.id}.`,
                    error instanceof Error
                        ? error.message
                        : error
                );
            }
        }

        const siglaCondominio =
            condominio.sigla;

        if (!siglaCondominio) {
            throw new Error(
                "SIGLA_CONDOMINIO_NAO_DEFINIDA"
            );
        }

        const blocoNormalizado =
            this.normalizarBlocoTorre(
                blocoTorre
            );

        const unidadeNormalizada =
            this.normalizarUnidade(
                unidadeApto
            );

        /**
         * Primeiro procuramos pela composição física,
         * porque ela possui UNIQUE no banco.
         */
        let unidade =
            await this.unidadeRepository.findOne({
                where: {
                    condominio_id:
                        condominio.id,

                    bloco_torre:
                        blocoNormalizado,

                    unidade_apto:
                        unidadeNormalizada,
                },
            });

        let unidadeCriada = false;

        if (!unidade) {
            const codigoUnidade =
                this.gerarCodigoUnidade(
                    siglaCondominio,
                    blocoNormalizado,
                    unidadeNormalizada
                );

            /**
             * Segurança adicional:
             * codigo_unidade também possui UNIQUE.
             */
            const codigoExistente =
                await this.unidadeRepository.findOne({
                    where: {
                        codigo_unidade:
                            codigoUnidade,
                    },
                });

            if (codigoExistente) {
                /**
                 * Se por algum motivo o código já existir
                 * associado a outra composição, não devemos
                 * criar silenciosamente outro registro.
                 */
                if (
                    codigoExistente.condominio_id !==
                        condominio.id ||
                    codigoExistente.bloco_torre !==
                        blocoNormalizado ||
                    codigoExistente.unidade_apto !==
                        unidadeNormalizada
                ) {
                    throw new Error(
                        "CODIGO_UNIDADE_EM_CONFLITO"
                    );
                }

                unidade = codigoExistente;
            } else {
                unidade =
                    this.unidadeRepository.create({
                        condominio_id:
                            condominio.id,

                        bloco_torre:
                            blocoNormalizado,

                        unidade_apto:
                            unidadeNormalizada,

                        codigo_unidade:
                            codigoUnidade,

                        status_validacao:
                            CondominioUnidadeStatusValidacao
                                .DECLARADA,
                    });

                unidade =
                    await this.unidadeRepository.save(
                        unidade
                    );

                unidadeCriada = true;
            }
        }

        return {
            condominio,
            unidade,

            condominioCriado,
            unidadeCriada,
        };
    }
}

export default CondominioCadastroPublicoService;