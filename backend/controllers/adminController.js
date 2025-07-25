// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        console.log('[Sanity Clear] Iniciando processo de limpeza de dados...');

        // --- PASSO 1: Nullificar/Remover Referências ---
        // Esta é a parte crucial para resolver dependências circulares e referências fortes.
        // A ordem aqui é: "quem referencia" (pai lógico) antes de "quem é referenciado" (filho lógico).
        // Ex: Se 'lesson' referencia 'course', então limpamos a referência em 'lesson' primeiro.

        // 1. Limpar referências de 'lesson' para 'course'
        console.log('[Sanity Clear] Limpando referências de "lesson" para "course"...');
        const lessonsWithCourseRefs = await sanityClient.fetch(`*[_type == "lesson" && defined(course._ref)]._id`);
        if (lessonsWithCourseRefs.length > 0) {
            const lessonPatches = lessonsWithCourseRefs.map(id => ({
                patch: {
                    id: id,
                    unset: ['course'] // Remove o campo 'course' que referencia o curso
                }
            }));
            await sanityClient.mutate(lessonPatches);
            console.log(`[Sanity Clear] ${lessonsWithCourseRefs.length} referências de "lesson" para "course" limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "lesson" para "course" encontrada para limpar.');
        }

        // 2. Limpar referências de 'courseRating' para 'course'
        console.log('[Sanity Clear] Limpando referências de "courseRating" para "course"...');
        const courseRatingsWithCourseRefs = await sanityClient.fetch(`*[_type == "courseRating" && defined(course._ref)]._id`);
        if (courseRatingsWithCourseRefs.length > 0) {
            const courseRatingPatches = courseRatingsWithCourseRefs.map(id => ({
                patch: {
                    id: id,
                    unset: ['course'] // Remove o campo 'course' que referencia o curso
                }
            }));
            await sanityClient.mutate(courseRatingPatches);
            console.log(`[Sanity Clear] ${courseRatingsWithCourseRefs.length} referências de "courseRating" para "course" limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "courseRating" para "course" encontrada para limpar.');
        }

        // 3. Limpar referências de 'member' para 'course' (assumindo que 'member' tem um array de referências a 'course' chamado 'courses')
        console.log('[Sanity Clear] Limpando referências de "member" para "course"...');
        const membersWithCourseRefs = await sanityClient.fetch(`*[_type == "member" && defined(courses[]._ref)]._id`);
        if (membersWithCourseRefs.length > 0) {
            const memberPatches = membersWithCourseRefs.map(id => ({
                patch: {
                    id: id,
                    set: { courses: [] } // Define o array de cursos como vazio
                }
            }));
            await sanityClient.mutate(memberPatches);
            console.log(`[Sanity Clear] ${membersWithCourseRefs.length} referências de "member" para "course" limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "member" para "course" encontrada para limpar.');
        }

        // 4. Limpar referências de 'course' para 'courseCategory', 'courseSubCategory', 'courseTag', e 'lesson' (se 'course' tiver array de lessons)
        console.log('[Sanity Clear] Limpando referências de "course" para categorias, tags e lessons...');
        const coursesWithRefs = await sanityClient.fetch(`*[_type == "course" && (defined(category._ref) || defined(subcategory._ref) || defined(tags[]._ref) || defined(lessons[]._ref))]._id`);
        if (coursesWithRefs.length > 0) {
            const coursePatches = coursesWithRefs.map(id => ({
                patch: {
                    id: id,
                    unset: ['category', 'subcategory'], // Remove campos de referência diretos
                    set: { tags: [], lessons: [] } // Define arrays de referências como vazios
                }
            }));
            await sanityClient.mutate(coursePatches);
            console.log(`[Sanity Clear] ${coursesWithRefs.length} referências de "course" para categorias, tags e lessons limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "course" para categorias, tags e lessons encontrada para limpar.');
        }


        // --- PASSO 2: Deletar Documentos ---
        // Agora que as referências foram (tentativamente) removidas, podemos deletar os documentos.
        // A ordem ainda é importante para garantir que não haja novas referências criadas ou esquecidas.
        const deletionOrder = [
            'lesson',            // Referenciado por 'course' (referência já limpa)
            'courseRating',      // Referenciado por 'course' (referência já limpa)
            'member',            // Referencia 'course' (referência já limpa)
            'course',            // Referencia 'courseCategory', 'courseSubCategory', 'courseTag' (referências já limpas)
            'courseTag',         // Referenciado por 'course' (referência já limpa)
            'courseSubCategory', // Referenciado por 'course' (referência já limpa)
            'courseCategory',    // Referenciado por 'course' (referência já limpa)
            
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
                        // Usar skipCrossDatasetReferences aqui pode ajudar em casos de referências
                        // que o Sanity ainda identifica, mesmo após a nullificação.
                        // Mas o ideal é que a nullificação resolva a maioria.
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
