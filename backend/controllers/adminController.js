// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        // Define a ordem de exclusão para respeitar as referências do Sanity.io.
        // Documentos que contêm referências (os "pais" lógicos) devem ser deletados ANTES
        // dos documentos que são referenciados (os "filhos" lógicos).
        const deletionOrder = [
            'courseRating',      // Se 'courseRating' referencia 'course', deve ser deletado primeiro.
            'lesson',            // 'lesson' referencia 'course', então 'lesson' deve ser deletado antes de 'course'.
            'course',            // 'course' referencia 'courseCategory', 'courseSubCategory', 'courseTag'.
                                 // Pode ser deletado depois de 'lesson' e 'courseRating', mas antes de seus próprios "filhos".
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
        let errorsDuringDeletion = [];

        // Itera sobre os tipos de documentos na ordem definida
        for (const docType of deletionOrder) {
            try {
                // Busca todos os IDs dos documentos do tipo atual
                const query = `*[_type == "${docType}"]._id`;
                const idsToDelete = await sanityClient.fetch(query);

                if (idsToDelete.length > 0) {
                    console.log(`[Sanity Clear] Deletando ${idsToDelete.length} documentos do tipo: ${docType}...`);
                    
                    // Cria e executa uma transação para deletar estes documentos
                    let transaction = sanityClient.transaction();
                    idsToDelete.forEach(id => {
                        transaction = transaction.delete(id);
                    });
                    await transaction.commit();
                    
                    totalDeletedCount += idsToDelete.length;
                    console.log(`[Sanity Clear] Sucesso ao deletar ${idsToDelete.length} documentos do tipo: ${docType}.`);
                } else {
                    console.log(`[Sanity Clear] Nenhum documento do tipo: ${docType} encontrado para deletar.`);
                }
            } catch (error) {
                console.error(`[Sanity Clear] Erro ao deletar documentos do tipo ${docType}:`, error.message);
                errorsDuringDeletion.push({ type: docType, error: error.message });
                // Se um erro ocorrer (ex: ainda há referências inesperadas), vamos re-lançar
                // para que o processo pare e o admin possa investigar.
                throw new Error(`Falha ao limpar documentos do tipo ${docType}: ${error.message}`);
            }
        }

        if (errorsDuringDeletion.length > 0) {
            // Este bloco será alcançado apenas se um 'throw new Error' não interromper o loop.
            // No cenário atual, ele será interrompido no primeiro erro de exclusão.
            return res.status(500).json({ 
                message: 'Limpeza de dados concluída com erros em alguns tipos de documentos. Verifique o console do backend.', 
                details: errorsDuringDeletion,
                totalDeleted: totalDeletedCount
            });
        }

        console.log(`[Sanity Clear] Limpeza completa! Total de ${totalDeletedCount} documentos deletados do Sanity.io.`);
        res.status(200).json({ message: `Sucesso ao limpar ${totalDeletedCount} documentos do Sanity.io.`, totalDeleted: totalDeletedCount });

    } catch (error) {
        console.error('Erro geral ao limpar dados do Sanity.io:', error);
        res.status(500).json({ message: 'Falha ao limpar dados do Sanity.io.', error: error.message });
    }
};
