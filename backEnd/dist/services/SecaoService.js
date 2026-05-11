"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecaoService = void 0;
// /src/services/SecaoService.ts
const data_source_1 = require("../config/data-source");
const secaoModels_1 = require("../models/secaoModels");
const CardModels_1 = require("../models/CardModels"); // ESTA LINHA DEVE EXISTIR E ESTAR CORRETA
const ImagemGaleriaModels_1 = require("../models/ImagemGaleriaModels"); // E ESTA TAMBÉM
const secaoRepository = data_source_1.AppDataSource.getRepository(secaoModels_1.Secao);
exports.SecaoService = {
    /**
     * Busca todas as seções da home page, incluindo seus sub-componentes (cards, imagens).
     * Equivalente ao seu mock.
     */
    async getHomePageSections() {
        // A query mais importante: Carrega seções e seus relacionamentos em uma única consulta (JOINs)
        const secoes = await secaoRepository.find({
            order: {
                ordem: 'ASC',
            },
            relations: {
                // Carrega cards E imagens da galeria (TypeORM lida com qual está populado)
                cards: true,
                imagens: true,
            },
        });
        return secoes;
    },
    async saveSecao(secaoData) {
        // Inicia uma Transação de Banco de Dados
        const novaSecao = await data_source_1.AppDataSource.transaction(async (manager) => {
            // 1. EXTRAI DADOS FILHOS (cards e imagens) da requisição
            const cardsData = secaoData.cards || [];
            const imagensData = secaoData.imagens || [];
            // Remove as propriedades aninhadas do objeto principal 
            // antes de salvá-lo, pois TypeORM as salvará separadamente.
            delete secaoData.cards;
            delete secaoData.imagens;
            // 2. SALVA A ENTIDADE PAI (Secao)
            // Cria uma instância e salva no banco de dados
            let secao = manager.create(secaoModels_1.Secao, secaoData);
            secao = await manager.save(secaoModels_1.Secao, secao);
            // Variável para armazenar a seção final
            const secaoFinal = secao;
            // 3. SALVA ENTIDADES FILHAS, se houver
            // Verifica o tipo de seção para saber quais filhos salvar
            if (secaoFinal.tipo_secao === 'info_grid' && cardsData.length > 0) {
                const novosCards = cardsData.map((card) => {
                    // Liga o card à seção pai recém-criada
                    const novoCard = manager.create(CardModels_1.Card, {
                        ...card,
                        secao: secaoFinal // Use a entidade Secao como foreign key
                    });
                    return novoCard;
                });
                // Salva todos os cards de uma vez
                await manager.save(CardModels_1.Card, novosCards);
                // Anexa os cards salvos ao objeto de retorno
                secaoFinal.cards = novosCards;
            }
            else if (secaoFinal.tipo_secao === 'gallery' && imagensData.length > 0) {
                const novasImagens = imagensData.map((imagem) => {
                    // Liga a imagem à seção pai recém-criada
                    const novaImagem = manager.create(ImagemGaleriaModels_1.ImagemGaleria, {
                        ...imagem,
                        secao: secaoFinal // Use a entidade Secao como foreign key
                    });
                    return novaImagem;
                });
                // Salva todas as imagens de uma vez
                await manager.save(ImagemGaleriaModels_1.ImagemGaleria, novasImagens);
                // Anexa as imagens salvas ao objeto de retorno
                secaoFinal.imagens = novasImagens;
            }
            // O objeto 'secaoFinal' agora contém a seção principal e seus filhos salvos
            return secaoFinal;
        });
        // Retorna a seção recém-criada e completa
        return novaSecao;
    },
    async updateSecao(id, secaoData) {
        const secaoAtualizada = await data_source_1.AppDataSource.transaction(async (manager) => {
            // 1. BUSCA a seção existente (com os filhos carregados eager)
            let secaoExistente = await manager.findOne(secaoModels_1.Secao, {
                where: { id: id },
                // Garante que os filhos são carregados para delete e merge
                relations: ['cards', 'imagens']
            });
            if (!secaoExistente) {
                throw new Error(`Seção com ID ${id} não encontrada para atualização.`);
            }
            // 2. EXTRAI os dados dos filhos do payload
            const cardsData = secaoData.cards || [];
            const imagensData = secaoData.imagens || [];
            delete secaoData.cards;
            delete secaoData.imagens;
            // 3. ATUALIZA a ENTIDADE PAI (Merge e Save)
            // Mescla os dados recebidos com a entidade existente (exceto filhos)
            manager.merge(secaoModels_1.Secao, secaoExistente, secaoData);
            secaoExistente = await manager.save(secaoModels_1.Secao, secaoExistente);
            // 4. ATUALIZA/SUBSTITUI ENTIDADES FILHAS (DELETE e INSERT)
            const tipoSecao = secaoExistente.tipo_secao;
            if (tipoSecao === 'info_grid') {
                // A) DELETE dos cards antigos
                if (secaoExistente.cards && secaoExistente.cards.length > 0) {
                    await manager.remove(CardModels_1.Card, secaoExistente.cards);
                }
                // B) INSERT dos novos cards (se houver)
                if (cardsData.length > 0) {
                    const novosCards = cardsData.map((card) => manager.create(CardModels_1.Card, {
                        ...card,
                        secao: secaoExistente
                    }));
                    secaoExistente.cards = await manager.save(CardModels_1.Card, novosCards);
                }
                else {
                    secaoExistente.cards = [];
                }
            }
            else if (tipoSecao === 'gallery') {
                // A) DELETE das imagens antigas
                if (secaoExistente.imagens && secaoExistente.imagens.length > 0) {
                    await manager.remove(ImagemGaleriaModels_1.ImagemGaleria, secaoExistente.imagens);
                }
                // B) INSERT das novas imagens (se houver)
                if (imagensData.length > 0) {
                    const novasImagens = imagensData.map((imagem) => manager.create(ImagemGaleriaModels_1.ImagemGaleria, {
                        ...imagem,
                        secao: secaoExistente
                    }));
                    secaoExistente.imagens = await manager.save(ImagemGaleriaModels_1.ImagemGaleria, novasImagens);
                }
                else {
                    secaoExistente.imagens = [];
                }
            }
            // Retorna a seção atualizada e com os novos filhos
            return secaoExistente;
        });
        return secaoAtualizada;
    },
    async deleteSecao(id) {
        await data_source_1.AppDataSource.transaction(async (manager) => {
            // 1. BUSCA a seção
            const secao = await manager.findOne(secaoModels_1.Secao, { where: { id: id } });
            if (!secao) {
                throw new Error(`Seção com ID ${id} não encontrada para exclusão.`);
            }
            // 2. REMOVE a seção
            // Devido ao ON DELETE CASCADE no MySQL e ao cascade: true no TypeORM,
            // os cards e imagens filhos serão removidos automaticamente pelo banco.
            await manager.remove(secaoModels_1.Secao, secao);
        });
        // Se a transação for bem-sucedida, o método retorna void
    },
    async getSecaoById(id) {
        if (isNaN(id)) {
            throw new Error('ID da seção inválido.');
        }
        // Usamos findOne para buscar pelo ID
        const secao = await secaoRepository.findOne({
            where: { id: id },
            // CRUCIAL: Precisamos carregar explicitamente as relações 'cards' e 'imagens',
            // pois o findOne padrão sem 'eager: false' em todas as relações pode não fazê-lo.
            relations: ['cards', 'imagens'],
            // Opcional: Garante que os filhos (cards/imagens) virão ordenados
            order: {
                cards: { ordem: 'ASC' },
                imagens: { ordem: 'ASC' },
            },
        });
        if (!secao) {
            throw new Error(`Seção com ID ${id} não encontrada.`);
        }
        return secao;
    }
};
