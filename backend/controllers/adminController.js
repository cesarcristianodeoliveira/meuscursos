// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        console.log('[Sanity Clear] Iniciando processo de limpeza de dados...');

        // --- PASSO 1: Nullificar/Remover Referências ---
        // Esta é a parte crucial para resolver dependências e circularidades.
        // A ordem aqui é: "quem referencia" (pai lógico) antes de "quem é referenciado" (filho lógico).

        // Definir os tipos de documentos e os campos de referência que eles podem conter.
        // Isso nos permite iterar e limpar de forma mais genérica.
        const typesToNullify = {
            // Documentos que referenciam 'course'
            'lesson': ['course'], // Campo 'course' em 'lesson' referencia 'course'
            'courseRating': ['course'], // Campo 'course' em 'courseRating' referencia 'course'
            'member': ['courses', 'course'], // 'member' pode ter um array 'courses' ou um campo único 'course' que referencia 'course'

            // Documentos que referenciam 'courseCategory', 'courseSubCategory', 'courseTag', 'lesson', 'member', 'courseRating'
            'course': ['category', 'subcategory', 'tags', 'lessons', 'members', 'ratings']
        };

        for (const docType in typesToNullify) {
            const referenceFields = typesToNullify[docType];
            console.log(`[Sanity Clear] Limpando referências de "${docType}" para os tipos relacionados...`);
            
            // Buscar todos os documentos deste tipo
            const documentsToPatch = await sanityClient.fetch(`*[_type == "${docType}"]._id`);

            if (documentsToPatch.length > 0) {
                const patches = [];
                documentsToPatch.forEach(id => {
                    const patch = {
                        patch: {
                            id: id,
                            unset: [], // Para campos de referência única
                            set: {}    // Para arrays de referências
                        }
                    };

                    referenceFields.forEach(field => {
                        // Assumindo que campos como 'tags', 'lessons', 'members', 'ratings' são arrays
                        if (['tags', 'lessons', 'members', 'ratings'].includes(field)) {
                            patch.patch.set[field] = []; // Esvazia o array de referências
                        } else {
                            // Assumindo que campos como 'course', 'category', 'subcategory' são referências únicas
                            patch.patch.unset.push(field); // Remove o campo de referência
                        }
                    });
                    // Remove 'unset' ou 'set' se estiverem vazios para evitar erros de patch
                    if (patch.patch.unset.length === 0) delete patch.patch.unset;
                    if (Object.keys(patch.patch.set).length === 0) delete patch.patch.set;

                    if (patch.patch.unset || patch.patch.set) {
                        patches.push(patch);
                    }
                });

                if (patches.length > 0) {
                    await sanityClient.mutate(patches);
                    console.log(`[Sanity Clear] ${patches.length} documentos do tipo "${docType}" tiveram suas referências limpas.`);
                } else {
                    console.log(`[Sanity Clear] Nenhum patch necessário para documentos do tipo "${docType}".`);
                }
            } else {
                console.log(`[Sanity Clear] Nenhum documento do tipo "${docType}" encontrado para limpar referências.`);
            }
        }

        // Adicionar um pequeno delay para garantir que as mutações de patch sejam propagadas
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2 segundos
        console.log('[Sanity Clear] Delay de 2 segundos concluído após nullificação de referências.');

        // --- PASSO 2: Deletar Documentos ---
        // Agora que as referências foram (tentativamente) removidas, podemos deletar os documentos.
        // A ordem é importante para garantir que não haja novas referências criadas ou esquecidas.
        // A ordem deve ir dos documentos que agora não são mais referenciados para os mais "raiz".
        const deletionOrder = [
            'lesson',            // Agora que 'course' não os referencia mais
            'courseRating',      // Agora que 'course' não os referencia mais
            'member',            // Agora que 'course' não os referencia mais (e vice-versa)
            'course',            // Agora que seus filhos e os que o referenciavam foram tratados
            'courseTag',         // Agora que 'course' não os referencia mais
            'courseSubCategory', // Agora que 'course' não os referencia mais
            'courseCategory',    // Agora que 'course' e 'courseSubCategory' não os referenciam mais
            
            // Outros tipos de documentos que você quer limpar e que não têm dependências
            // cíclicas ou complexas com os tipos acima.
            'badge',
            'certificate',
            'group',
            'message',
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
