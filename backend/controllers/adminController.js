// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        // Define a ordem de exclusão para respeitar as referências do Sanity.io.
        // Ordem: Documentos que contêm referências (os "pais" lógicos) devem ser deletados ANTES
        // dos documentos que são referenciados (os "filhos" lógicos).
        //
        // Com base no erro "lesson cannot be deleted as there are references to it from course",
        // significa que 'course' referencia 'lesson'. Portanto, 'course' deve ser deletado antes de 'lesson'.
        const deletionOrder = [
            'courseRating',      // Se 'courseRating' referencia 'course', deve ser deletado primeiro.
            'course',            // 'course' referencia 'lesson'. DELETAR 'course' ANTES de 'lesson'.
            'lesson',            // 'lesson' é referenciado por 'course'. DELETAR 'lesson' DEPOIS de 'course'.
            'courseTag',         // 'courseTag' referencia 'courseCategory', 'courseSubCategory'.
                                 // Deve ser deletado antes de 'courseSubCategory' e 'courseCategory'.
            'courseSubCategory', // 'courseSubCategory' referencia 'courseCategory'.
                                 // Deve ser deletado antes de 'courseCategory'.
            'courseCategory',    // 'courseCategory' não referencia outros tipos de conteúdo listados aqui.

            // Outros tipos de documentos que você quer limpar e que não têm dependências
            // cíclicas ou complexas com os tipos acima.
            'badge',
            'certificate',
            'group',
            'member',
            'message',
        ];

        let totalDeletedCount = 0;
        let successfulDeletions = [];
        let failedDeletions = [];

        // Itera sobre os tipos de documentos na ordem definida
        for (const docType of deletionOrder) {
            try {
                // Busca todos os IDs dos documentos do tipo atual
                const query = `*[_type == "${docType}"]._id`;
                const idsToDelete = await sanityClient.fetch(query);

                if (idsToDelete.length > 0) {
                    console.log(`[Sanity Clear] Tentando deletar ${idsToDelete.length} documentos do tipo: ${docType}...`);
                    
                    // Prepara as mutações de exclusão
                    const mutations = idsToDelete.map(id => ({
                        delete: {
                            id: id
                        }
                    }));

                    // Executa a mutação de exclusão em massa.
                    // 'skipCrossDatasetReferences: true' é uma opção que pode ajudar a ignorar
                    // algumas verificações de referência, útil para limpeza em dev, mas use com cautela.
                    const result = await sanityClient.mutate(mutations, {
                        skipCrossDatasetReferences: true 
                    });
                    
                    // Conta quantos documentos foram realmente deletados com sucesso
                    const deletedCount = result.results ? result.results.filter(r => r.operation === 'delete' && r.success).length : 0;
                    totalDeletedCount += deletedCount;
                    successfulDeletions.push({ type: docType, count: deletedCount });
                    console.log(`[Sanity Clear] Sucesso ao deletar ${deletedCount} documentos do tipo: ${docType}.`);

                    // Se nem todos os documentos foram deletados, registra como falha parcial
                    if (deletedCount < idsToDelete.length) {
                        const failedCount = idsToDelete.length - deletedCount;
                        failedDeletions.push({ type: docType, count: failedCount, reason: 'Deletion prevented by references (even with skipCrossDatasetReferences)' });
                        console.warn(`[Sanity Clear] ${failedCount} documentos do tipo ${docType} não puderam ser deletados devido a referências.`);
                    }

                } else {
                    console.log(`[Sanity Clear] Nenhum documento do tipo: ${docType} encontrado para deletar.`);
                }
            } catch (error) {
                // Captura erros específicos para este tipo de documento
                console.error(`[Sanity Clear] Erro inesperado ao tentar deletar documentos do tipo ${docType}:`, error.message);
                failedDeletions.push({ type: docType, error: error.message });
                // Não lança o erro aqui para permitir que outros tipos sejam processados.
            }
        }

        // Verifica se houve alguma falha total ou parcial
        if (failedDeletions.length > 0) {
            return res.status(500).json({ 
                message: 'Limpeza de dados concluída, mas com falhas em alguns tipos de documentos devido a referências. Verifique o console do backend.', 
                details: failedDeletions,
                totalDeleted: totalDeletedCount
            });
        }

        console.log(`[Sanity Clear] Limpeza completa! Total de ${totalDeletedCount} documentos deletados do Sanity.io.`);
        res.status(200).json({ message: `Sucesso ao limpar ${totalDeletedCount} documentos do Sanity.io.`, totalDeleted: totalDeletedCount });

    } catch (error) {
        // Captura erros gerais que podem ocorrer fora do loop de exclusão
        console.error('Erro geral ao limpar dados do Sanity.io (fora do loop):', error);
        res.status(500).json({ message: 'Falha ao limpar dados do Sanity.io.', error: error.message });
    }
};
