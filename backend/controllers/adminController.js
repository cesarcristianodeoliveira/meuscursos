// D:\meuscursos\backend\src\controllers\adminController.js

import sanityClient from '../utils/sanityClient.js'; 

// Função para limpar todos os dados de conteúdo especificados do Sanity.io
export const clearSanityData = async (req, res) => {
    try {
        console.log('[Sanity Clear] Iniciando processo de limpeza de dados...');

        // --- PASSO 1: Nullificar/Remover Referências ---
        // Esta é a parte crucial para resolver dependências e circularidades.
        // A ordem aqui é: "quem referencia" (pai lógico) antes de "quem é referenciado" (filho lógico).

        // 1. Limpar referências de 'member' para 'course'
        // (Baseado no log: "member" cannot be deleted as there are references to it from "course-...")
        // Isso implica que 'course' tem um campo que referencia 'member'.
        // No entanto, o log também diz "member" cannot be deleted as there are references to it from "course-...",
        // o que sugere que 'member' também referencia 'course' (circularidade).
        // Vamos primeiro limpar as referências que 'member' faz para 'course'.
        console.log('[Sanity Clear] Limpando referências de "member" para "course"...');
        const membersWithCourseRefs = await sanityClient.fetch(`*[_type == "member" && defined(courses[]._ref) || defined(course._ref)]._id`); // Ajuste se o campo for diferente de 'courses' ou 'course'
        if (membersWithCourseRefs.length > 0) {
            const memberPatches = membersWithCourseRefs.map(id => ({
                patch: {
                    id: id,
                    set: { courses: [] }, // Se 'member' tem um array de referências a cursos
                    unset: ['course'] // Se 'member' tem uma referência única a um curso
                }
            }));
            await sanityClient.mutate(memberPatches);
            console.log(`[Sanity Clear] ${membersWithCourseRefs.length} referências de "member" para "course" limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "member" para "course" encontrada para limpar.');
        }

        // 2. Limpar referências de 'lesson' para 'course'
        // (Baseado no log: "lesson" cannot be deleted as there are references to it from "course-...")
        // Isso implica que 'course' tem um campo que referencia 'lesson'.
        // Mas o log também diz "lesson" cannot be deleted as there are references to it from "course-...",
        // o que é confuso. Vamos assumir que 'course' referencia 'lesson' e vice-versa pode ser um problema.
        // Vamos limpar as referências de 'lesson' para 'course' primeiro.
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

        // 3. Limpar referências de 'courseRating' para 'course'
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

        // 4. Limpar TODAS as referências de 'course' para seus "filhos" (lesson, tag, subcategory, category, member)
        // Isso é crucial porque 'course' parece ser o hub central que referencia muitos outros tipos.
        console.log('[Sanity Clear] Limpando TODAS as referências de "course" para seus filhos (lessons, tags, subcategory, category, members)...');
        const coursesWithOutgoingRefs = await sanityClient.fetch(`*[_type == "course" && (defined(category._ref) || defined(subcategory._ref) || defined(tags[]._ref) || defined(lessons[]._ref) || defined(members[]._ref) || defined(ratings[]._ref))]._id`);
        if (coursesWithOutgoingRefs.length > 0) {
            const coursePatches = coursesWithOutgoingRefs.map(id => ({
                patch: {
                    id: id,
                    unset: ['category', 'subcategory'], // Campos de referência única
                    set: { 
                        tags: [], 
                        lessons: [], 
                        members: [], // Se 'course' referencia 'member'
                        ratings: []  // Se 'course' referencia 'courseRating'
                    } // Arrays de referências
                }
            }));
            await sanityClient.mutate(coursePatches);
            console.log(`[Sanity Clear] ${coursesWithOutgoingRefs.length} referências de "course" para seus filhos limpas.`);
        } else {
            console.log('[Sanity Clear] Nenhuma referência de "course" para seus filhos encontrada para limpar.');
        }

        // Adicionar um pequeno delay para garantir que as mutações de patch sejam propagadas
        // Embora Sanity.io seja eventualmente consistente, um pequeno atraso pode ajudar em cenários complexos.
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        console.log('[Sanity Clear] Delay de 1 segundo concluído após nullificação de referências.');

        // --- PASSO 2: Deletar Documentos ---
        // Agora que as referências foram (tentativamente) removidas, podemos deletar os documentos.
        // A ordem ainda é importante para garantir que não haja novas referências criadas ou esquecidas.
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
                        // Usar skipCrossDatasetReferences aqui é uma camada extra de segurança,
                        // mas a nullificação é a principal estratégia.
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
