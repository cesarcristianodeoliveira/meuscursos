// scripts/nuclear-format.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function nuke() {
  try {
    console.log('💥 FORMATADOR NUCLEAR DO SANITY');
    console.log('═'.repeat(50));

    // Importa o client
    const clientModule = await import('../src/config/sanityClient.js');
    const client = clientModule.default;

    console.log('📡 Conectado ao projeto:', process.env.SANITY_PROJECT_ID);

    // SEUS SCHEMAS - lista fixa dos seus tipos
    const YOUR_SCHEMAS = ['course', 'video', 'thumbnail', 'category', 'subcategory', 'tag'];
    
    console.log('\n🎯 SCHEMAS QUE SERÃO ZERADOS:');
    YOUR_SCHEMAS.forEach(schema => console.log(`   📄 ${schema}`));

    // Conta documentos existentes
    console.log('\n📊 CONTAGEM ATUAL:');
    let totalDocuments = 0;
    
    for (const schema of YOUR_SCHEMAS) {
      const count = await client.fetch(`count(*[_type == "${schema}"])`);
      totalDocuments += count;
      console.log(`   ${schema}: ${count} documentos`);
    }

    console.log(`\n📈 TOTAL: ${totalDocuments} documentos`);

    if (totalDocuments === 0) {
      console.log('\n✅ Dataset já está vazio! Nada para formatar.');
      rl.close();
      return;
    }

    // CONFIRMAÇÕES DRÁSTICAS
    console.log('\n⚠️  ⚠️  ⚠️  ALERTA CRÍTICO!');
    console.log('Isso vai DELETAR PERMANENTEMENTE TODOS os documentos!');
    console.log('Todos os cursos, categorias, tags, vídeos... TUDO!');
    
    const confirm1 = await question('\n🔴 Digite "FORMATAR" para continuar: ');
    if (confirm1.trim().toUpperCase() !== 'FORMATAR') {
      console.log('❌ Cancelado pelo usuário');
      rl.close();
      return;
    }

    const confirm2 = await question('🔴 Digite "ZERAR-TUDO" para confirmar: ');
    if (confirm2.trim().toUpperCase() !== 'ZERAR-TUDO') {
      console.log('❌ Cancelado - confirmação final não fornecida');
      rl.close();
      return;
    }

    // EXECUÇÃO DA LIMPEZA TOTAL
    console.log('\n💥 INICIANDO FORMATAÇÃO...');
    console.log('═'.repeat(50));

    let deletedCount = 0;
    let errors = [];

    // Ordem de deleção (para evitar problemas de referência)
    const deleteOrder = ['course', 'video', 'thumbnail', 'subcategory', 'tag', 'category'];

    for (const schema of deleteOrder) {
      if (!YOUR_SCHEMAS.includes(schema)) continue;

      console.log(`\n🗑️  LIMPANDO: ${schema}`);
      
      try {
        // Busca TODOS os documentos desse tipo
        const documents = await client.fetch(`*[_type == "${schema}"]{_id, _type, title, name}`);
        
        if (documents.length === 0) {
          console.log(`   ⚪ Nenhum documento encontrado`);
          continue;
        }

        console.log(`   📋 Encontrados: ${documents.length} documentos`);
        
        // Deleta em lotes
        const batchSize = 20;
        for (let i = 0; i < documents.length; i += batchSize) {
          const batch = documents.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(documents.length / batchSize);

          const transaction = client.transaction();
          batch.forEach(doc => transaction.delete(doc._id));
          
          try {
            await transaction.commit();
            deletedCount += batch.length;
            
            // Mostra progresso
            const progress = ((i + batch.length) / documents.length * 100).toFixed(1);
            console.log(`   ✅ Lote ${batchNumber}/${totalBatches} (${progress}%): ${batch.length} deletados`);
            
          } catch (batchError) {
            console.log(`   ❌ Erro no lote ${batchNumber}: ${batchError.message}`);
            errors.push({ schema, batch: batchNumber, error: batchError.message });
          }

          // Delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`   🎯 ${schema}: LIMPO - ${documents.length} documentos removidos`);
        
      } catch (schemaError) {
        console.log(`   💥 ERRO CRÍTICO em ${schema}: ${schemaError.message}`);
        errors.push({ schema, error: schemaError.message });
      }
    }

    // RELATÓRIO FINAL
    console.log('\n✨ FORMATAÇÃO CONCLUÍDA!');
    console.log('═'.repeat(50));
    console.log(`📊 Documentos deletados: ${deletedCount}`);
    console.log(`❌ Erros: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n📋 Erros encontrados:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.schema}: ${err.error}`);
      });
    }

    // VERIFICAÇÃO FINAL
    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    let remainingTotal = 0;
    
    for (const schema of YOUR_SCHEMAS) {
      const remaining = await client.fetch(`count(*[_type == "${schema}"])`);
      remainingTotal += remaining;
      
      if (remaining > 0) {
        console.log(`   ⚠️  ${schema}: ${remaining} documentos RESTANTES`);
      } else {
        console.log(`   ✅ ${schema}: ZERADO`);
      }
    }

    if (remainingTotal === 0) {
      console.log('\n🎉 DATASET COMPLETAMENTE FORMATADO!');
      console.log('💾 Agora você tem um dataset limpo para começar do zero.');
    } else {
      console.log(`\n⚠️  Ainda existem ${remainingTotal} documentos no dataset.`);
      console.log('💡 Alguns documentos podem ter referências que impedem a deleção.');
    }

  } catch (error) {
    console.error('💥 ERRO CATASTRÓFICO:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    rl.close();
  }
}

// BOMBA RELÓGIO - executar com cuidado!
nuke().catch(console.error);