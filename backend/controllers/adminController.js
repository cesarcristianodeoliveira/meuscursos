// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        console.log('[Sanity Clear] Iniciando processo de limpeza de dados...');

        // --- PASSO 1: Nullificar/Remover Referências ---
        // Esta é a parte crucial para resolver dependências e circularidades.
        // A ordem aqui é: "quem referencia" (pai lógico) antes de "quem é referenciado" (filho lógico).

        // Mapeamento dos tipos de documentos e os campos de REFERÊNCIA que eles contêm.
        // Estes nomes de campo SÃO BASEADOS EXATAMENTE NOS SEUS SCHEMAS FORNECIDOS.
        const typesToNullify = {
            'member': { // Member referencia Course, Lesson, Group, Badge, Certificate, Message
                singleRefs: [], // Não há referências únicas diretas a outros documentos que precisam ser nullificadas aqui
                arrayRefs: ['createdCourses', 'enrolledCourses', 'favoriteCourses', 'createdGroups', 'joinedGroups', 'badgesEarned', 'certificatesAwarded', 'messages']
            },
            'lesson': { // Lesson referencia Course
                singleRefs: ['course'],
                arrayRefs: []
            },
            'courseRating': { // CourseRating referencia Member, Course
                singleRefs: ['member', 'course'],
                arrayRefs: []
            },
            'course': { // Course referencia Category, SubCategory, CourseTag, Member (creator), Lesson
                singleRefs: ['category', 'subCategory', 'creator'],
                arrayRefs: ['courseTags', 'lessons']
            },
            'courseTag': { // CourseTag referencia Category, SubCategory
                singleRefs: [],
                arrayRefs: ['categories']
            },
            'courseSubCategory': { // CourseSubCategory referencia CourseCategory
                singleRefs: ['parentCategory'],
                arrayRefs: []
            },
            // courseCategory não referencia outros documentos que precisam de nullificação
        };

        // Ordem de nullificação para quebrar as circularidades e dependências
        // Começamos pelos documentos que contêm referências para os mais "profundos" ou circulares.
        const nullificationOrder = [
            'member',
            'lesson',
            'courseRating',
            'course',
            'courseTag',
            'courseSubCategory'
        ];

        for (const docType of nullificationOrder) {
            const config = typesToNullify[docType];
            if (!config) continue; // Pula se o tipo não estiver configurado para nullificação

            console.log(`\n[Sanity Clear] --- Processando nullificação para o tipo: "${docType}" ---`);
            
            // Buscar todos os IDs dos documentos deste tipo
            const documentsToPatchIds = await sanityClient.fetch(`*[_type == "${docType}"]._id`);
            console.log(`[Sanity Clear] Encontrados ${documentsToPatchIds.length} documentos do tipo "${docType}" para inspecionar e nullificar.`);

            if (documentsToPatchIds.length > 0) {
                const patches = [];
                for (const id of documentsToPatchIds) {
                    const currentDoc = await sanityClient.fetch(`*[_id == "${id}"][0]{${[...config.singleRefs, ...config.arrayRefs].join(',')}}`);
                    
                    const patch = {
                        patch: {
                            id: id,
                            unset: [], 
                            set: {}    
                        }
                    };
                    let hasChanges = false;

                    // Lidar com referências únicas
                    config.singleRefs.forEach(field => {
                        if (currentDoc && currentDoc[field] && currentDoc[field]._ref) {
                            patch.patch.unset.push(field);
                            hasChanges = true;
                            console.log(`[Sanity Clear - Patch] Doc ${id} (${docType}) - Removendo referência única: ${field}`);
                        }
                    });

                    // Lidar com arrays de referências
                    config.arrayRefs.forEach(field => {
                        if (currentDoc && Array.isArray(currentDoc[field]) && currentDoc[field].length > 0) {
                            patch.patch.set[field] = []; // Esvazia o array
                            hasChanges = true;
                            console.log(`[Sanity Clear - Patch] Doc ${id} (${docType}) - Esvaziando array de referência: ${field}`);
                        }
                    });

                    // Adiciona o patch apenas se houver mudanças a serem feitas
                    if (hasChanges) {
                        if (patch.patch.unset.length === 0) delete patch.patch.unset;
                        if (Object.keys(patch.patch.set).length === 0) delete patch.patch.set;
                        patches.push(patch);
                    }
                }

                if (patches.length > 0) {
                    console.log(`[Sanity Clear] Aplicando ${patches.length} patches para o tipo "${docType}"...`);
                    await sanityClient.mutate(patches);
                    console.log(`[Sanity Clear] Sucesso ao aplicar patches para o tipo "${docType}".`);
                } else {
                    console.log(`[Sanity Clear] Nenhum patch necessário para documentos do tipo "${docType}".`);
                }
            } else {
                console.log(`[Sanity Clear] Nenhum documento do tipo "${docType}" encontrado para limpar referências.`);
            }
        }

        // Adicionar um pequeno delay para garantir que as mutações de patch sejam propagadas
        await new Promise(resolve => setTimeout(resolve, 5000)); // Aumentado para 5 segundos
        console.log('[Sanity Clear] Delay de 5 segundos concluído após nullificação de referências.');

        // --- PASSO 2: Deletar Documentos ---
        // Agora que as referências foram (tentativamente) removidas, podemos deletar os documentos.
        // A ordem deve ir dos documentos que agora não são mais referenciados para os mais "raiz".
        const deletionOrder = [
            'courseRating',      // Não referencia mais course/member
            'lesson',            // Não referencia mais course
            'badge',             // Não referenciado por nada aqui
            'certificate',       // Não referenciado por nada aqui
            'group',             // Não referenciado por nada aqui
            'message',           // Não referenciado por nada aqui
            'member',            // Não referencia mais course/group/badge/certificate/message
            'course',            // Não referencia mais lesson/courseTag/courseSubCategory/courseCategory/member
            'courseTag',         // Não referencia mais courseCategory/courseSubCategory
            'courseSubCategory', // Não referencia mais courseCategory
            'courseCategory',    // Não referenciado por nada aqui
        ];

        let totalDeletedCount = 0;
        let successfulDeletions = [];
        let failedDeletions = [];

        for (const docType of deletionOrder) {
            try {
                const idsToDelete = await sanityClient.fetch(`*[_type == "${docType}"]._id`);

                if (idsToDelete.length > 0) {
                    console.log(`[Sanity Clear] Tentando deletar ${idsToDelete.length} documentos do tipo: ${docType}...`);
                    
                    const mutations = idsToDelete.map(id => ({ delete: { id: id } }));
                    const result = await sanityClient.mutate(mutations, {
                        // Usar skipCrossDatasetReferences aqui é uma camada extra de segurança.
                        skipCrossDatasetReferences: true 
                    });
                    
                    const deletedCount = result.results ? result.results.filter(r => r.operation === 'delete' && r.success).length : 0;
                    totalDeletedCount += deletedCount;
                    successfulDeletions.push({ type: docType, count: deletedCount });
                    console.log(`[Sanity Clear] Sucesso ao deletar ${deletedCount} documentos do tipo: ${docType}.`);

                    if (deletedCount < idsToDelete.length) {
                        const failedCount = idsToDelete.length - deletedCount;
                        failedDeletions.push({ type: docType, count: failedCount, reason: 'Deletion prevented by references (even after nullification/skipCrossDatasetReferences)' });
                        console.warn(`[Sanity Clear] ${failedCount} documentos do tipo ${docType} não puderam ser deletados.`);
                    }

                } else {
                    console.log(`[Sanity Clear] Nenhum documento do tipo: ${docType} encontrado para deletar.`);
                }
            } catch (error) {
                console.error(`[Sanity Clear] Erro inesperado durante a exclusão do tipo ${docType}:`, error.message);
                failedDeletions.push({ type: docType, error: error.message });
            }
        }

        if (failedDeletions.length > 0) {
            return res.status(500).json({ 
                message: 'Limpeza de dados concluída, mas com falhas em alguns tipos de documentos devido a referências persistentes. Verifique o console do backend.', 
                details: failedDeletions,
                totalDeleted: totalDeletedCount
            });
        }

        console.log(`[Sanity Clear] Limpeza completa! Total de ${totalDeletedCount} documentos deletados do Sanity.io.`);
        res.status(200).json({ message: `Sucesso ao limpar ${totalDeletedCount} documentos do Sanity.io.`, totalDeleted: totalDeletedCount });

    } catch (error) {
        console.error('Erro geral no processo de limpeza do Sanity.io:', error);
        res.status(500).json({ message: 'Falha geral ao limpar dados do Sanity.io.', error: error.message });
    }
};
