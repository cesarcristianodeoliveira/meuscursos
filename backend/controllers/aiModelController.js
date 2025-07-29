// D:\meuscursos\backend\controllers\aiModelController.js

// @route   GET /api/ai-models
// @desc    Obter a lista de modelos de IA disponíveis
// @access  Private (requer autenticação para garantir que apenas usuários logados vejam os modelos)
export const getAvailableAIModels = (req, res) => { // Removido 'async' e 'asyncHandler'
    // Para a v0.1, vamos hardcodar os modelos disponíveis.
    // No futuro, isso poderia vir de um banco de dados, Sanity, ou ser dinâmico.
    const aiModels = [
        {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            description: 'Modelo rápido e eficiente do Google Gemini.',
            provider: 'Google',
            default: true // Indica que este é o modelo padrão para a v0.1
        },
        // Na v0.2, você adicionaria algo como:
        // {
        //     id: 'gpt-4o',
        //     name: 'GPT-4o',
        //     description: 'Modelo avançado da OpenAI.',
        //     provider: 'OpenAI',
        //     default: false
        // }
    ];

    // Verifica se o usuário está autenticado antes de retornar os modelos
    if (!req.user) {
        return res.status(401).json({ message: 'Não autorizado. Token não fornecido ou inválido.' });
    }

    res.status(200).json({ models: aiModels });
};
