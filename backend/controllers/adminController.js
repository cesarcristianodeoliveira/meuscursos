// D:\meuscursos\backend\src\controllers\adminController.js

// Importa o cliente Sanity.io usando a sintaxe de Módulos ES (import).
// O caminho foi ajustado para refletir a estrutura fornecida: backend/src/utils/sanityClient.js
// AGORA COM A EXTENSÃO .js PARA MÓDULOS ES
import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        // Define a ordem de exclusão para respeitar as referências do Sanity.io.
        // Documentos que são referenciados por outros devem ser deletados ANTES dos que os referenciam.
        // Baseado nos schemas fornecidos: badge, certificate, course, courseCategory, courseRating, courseSubCategory, courseTag, group, lesson, member, message
        const deletionOrder = [
            'lesson',         // Referencia 'course'
            'courseRating',   // Referencia 'course'
            'course',         // Referencia 'courseCategory', 'courseSubCategory', 'courseTag'
            'courseTag',      // Referencia 'courseCategory', 'courseSubCategory'
            'courseSubCategory', // Referencia 'courseCategory'
            'courseCategory', // Não referencia outros tipos de conteúdo listados aqui

            // Adicione outros tipos de documentos que você quer limpar e que não têm dependências
            // ou cujas dependências já foram resolvidas.
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
                // Se um erro ocorrer (ex: ainda há referências inesperadas), podemos parar ou continuar
                // Por segurança, se um erro de referência ocorrer, é melhor parar para que o admin possa investigar.
                // Se for um erro de rede ou outro, pode tentar continuar com os próximos tipos.
                // Para este caso, vamos re-lançar o erro para que o frontend seja notificado.
                throw new Error(`Falha ao limpar documentos do tipo ${docType}: ${error.message}`);
            }
        }

        if (errorsDuringDeletion.length > 0) {
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
