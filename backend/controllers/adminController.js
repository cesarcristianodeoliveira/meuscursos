// D:\meuscursos\backend\src\controllers\adminController.js

// Importa o cliente Sanity.io usando a sintaxe de Módulos ES (import).
// O caminho foi ajustado para refletir a estrutura fornecida: backend/src/utils/sanityClient.js
// AGORA USANDO 'sanityClient' para consistência com categoryController.js
import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => { // Exporta a função usando 'export const'
    try {
        // Define os tipos de documentos a serem deletados.
        // ATENÇÃO: Estes nomes devem corresponder EXATAMENTE aos nomes dos seus schemas no Sanity.io.
        // Baseado nos schemas fornecidos: courseCategory, courseSubCategory, courseTag, course.
        const documentTypesToClear = ['courseCategory', 'courseSubCategory', 'courseTag', 'course'];

        // Busca todos os IDs dos documentos dos tipos especificados.
        // A query seleciona todos os documentos cujo tipo está na lista 'documentTypesToClear'.
        const query = `*[_type in [${documentTypesToClear.map(type => `'${type}'`).join(', ')}]]._id`;
        // Usando 'sanityClient' para a chamada fetch
        const idsToDelete = await sanityClient.fetch(query);

        // Verifica se há documentos para deletar.
        if (idsToDelete.length === 0) {
            return res.status(200).json({ message: 'Nenhum documento dos tipos especificados encontrado para limpar.' });
        }

        // Inicia uma transação para deletar os documentos.
        // As transações são recomendadas para múltiplas operações de escrita no Sanity.io.
        // Usando 'sanityClient' para iniciar a transação
        let transaction = sanityClient.transaction();
        idsToDelete.forEach(id => {
            transaction = transaction.delete(id);
        });

        // Confirma a transação, executando as operações de exclusão.
        await transaction.commit();

        console.log(`Successfully cleared ${idsToDelete.length} documents from Sanity.io.`);
        res.status(200).json({ message: `Sucesso ao limpar ${idsToDelete.length} documentos do Sanity.io.` });

    } catch (error) {
        // Captura e loga quaisquer erros que ocorram durante o processo.
        console.error('Erro ao limpar dados do Sanity.io:', error);
        res.status(500).json({ message: 'Falha ao limpar dados do Sanity.io.', error: error.message });
    }
};
