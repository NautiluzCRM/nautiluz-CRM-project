/**
 * Script para testar integração com Meta Lead Ads
 * 
 * Execute com: npx ts-node src/scripts/test-meta-integration.ts
 */

// ============================================
// SUAS CREDENCIAIS (do sandbox - use em produção com token de longa duração)
// ============================================
const ACCESS_TOKEN = 'EAAhqAxPQ4MYBQUte3bQM9rqzhpQdpIPjUvaijL20GSnkd2EYsAmJbTauATZByznukYaIwZCXhbYXNZAzfBMPdIulsNxtO58nz5ggAln87QbfNXgZBFzdxNLeJKfvwIti3IbFRoUt8RhllXb9txZBe1ChWfTlTKrcY2B3XAdGZA6YB2g7GViZAThxPWwtkRYOZCNUkaD2wYZAh';
const APP_ID = '2368361263587526';
const AD_ACCOUNT_ID = 'act_1362014541894760';

// ============================================
// TESTES
// ============================================

async function testToken() {
  console.log('\n🔐 Testando Token de Acesso...\n');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro no token:', data.error.message);
      return false;
    }
    
    console.log('✅ Token válido!');
    console.log(`   Nome: ${data.name}`);
    console.log(`   ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar token:', error);
    return false;
  }
}

async function checkPermissions() {
  console.log('\n🔑 Verificando Permissões...\n');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro:', data.error.message);
      return;
    }
    
    const requiredPermissions = [
      'leads_retrieval',      // ESSENCIAL para Lead Ads
      'pages_read_engagement',
      'pages_show_list',
      'ads_read',
      'ads_management',
      'business_management'
    ];
    
    console.log('Permissões concedidas:');
    const grantedPermissions = data.data
      .filter((p: any) => p.status === 'granted')
      .map((p: any) => p.permission);
    
    for (const perm of grantedPermissions) {
      console.log(`   ✅ ${perm}`);
    }
    
    console.log('\nPermissões necessárias para Lead Ads:');
    for (const perm of requiredPermissions) {
      const hasIt = grantedPermissions.includes(perm);
      console.log(`   ${hasIt ? '✅' : '❌'} ${perm} ${!hasIt ? '← FALTANDO!' : ''}`);
    }
    
    if (!grantedPermissions.includes('leads_retrieval')) {
      console.log('\n⚠️  IMPORTANTE: Você precisa da permissão "leads_retrieval" para buscar leads!');
      console.log('   Adicione essa permissão no seu app em: https://developers.facebook.com/apps');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error);
  }
}

async function listPages() {
  console.log('\n📄 Buscando suas Páginas...\n');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro:', data.error.message);
      return [];
    }
    
    if (!data.data || data.data.length === 0) {
      console.log('   Nenhuma página encontrada.');
      return [];
    }
    
    console.log('Páginas encontradas:');
    for (const page of data.data) {
      console.log(`\n   📌 ${page.name}`);
      console.log(`      Page ID: ${page.id}`);
      console.log(`      Page Token: ${page.access_token?.substring(0, 30)}...`);
      if (page.instagram_business_account) {
        console.log(`      Instagram ID: ${page.instagram_business_account.id}`);
      }
    }
    
    return data.data;
  } catch (error) {
    console.error('❌ Erro ao buscar páginas:', error);
    return [];
  }
}

async function listLeadForms(pageId: string, pageToken: string) {
  console.log(`\n📝 Buscando Formulários de Lead da Página ${pageId}...\n`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${pageToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro:', data.error.message);
      if (data.error.message.includes('leads_retrieval')) {
        console.log('\n⚠️  Você precisa da permissão "leads_retrieval" para acessar formulários de leads!');
      }
      return;
    }
    
    if (!data.data || data.data.length === 0) {
      console.log('   Nenhum formulário de lead encontrado.');
      return;
    }
    
    console.log('Formulários encontrados:');
    for (const form of data.data) {
      console.log(`\n   📋 ${form.name}`);
      console.log(`      Form ID: ${form.id}`);
      console.log(`      Status: ${form.status}`);
      console.log(`      Leads: ${form.leads_count || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar formulários:', error);
  }
}

async function listLeads(pageId: string, pageToken: string) {
  console.log(`\n👥 Buscando Leads da Página ${pageId}...\n`);
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/leadgen_forms?fields=leads{id,created_time,field_data}&access_token=${pageToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro:', data.error.message);
      return;
    }
    
    let totalLeads = 0;
    for (const form of data.data || []) {
      if (form.leads?.data) {
        totalLeads += form.leads.data.length;
        console.log(`\nFormulário com ${form.leads.data.length} lead(s):`);
        for (const lead of form.leads.data.slice(0, 3)) {
          console.log(`\n   Lead ID: ${lead.id}`);
          console.log(`   Criado: ${lead.created_time}`);
          if (lead.field_data) {
            for (const field of lead.field_data) {
              console.log(`   ${field.name}: ${field.values?.join(', ')}`);
            }
          }
        }
      }
    }
    
    if (totalLeads === 0) {
      console.log('   Nenhum lead encontrado ainda.');
    } else {
      console.log(`\n   Total: ${totalLeads} lead(s) encontrado(s)`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar leads:', error);
  }
}

async function testAdAccount() {
  console.log('\n📊 Testando Conta de Anúncios...\n');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${AD_ACCOUNT_ID}?fields=name,account_status,amount_spent,balance&access_token=${ACCESS_TOKEN}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Erro:', data.error.message);
      return;
    }
    
    console.log('✅ Conta de Anúncios encontrada!');
    console.log(`   Nome: ${data.name}`);
    console.log(`   Status: ${data.account_status === 1 ? 'Ativa' : 'Inativa'}`);
    console.log(`   Gasto Total: ${data.amount_spent ? (parseInt(data.amount_spent) / 100).toFixed(2) : 0}`);
    
  } catch (error) {
    console.error('❌ Erro ao testar conta:', error);
  }
}

// ============================================
// EXECUTAR TESTES
// ============================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       🚀 TESTE DE INTEGRAÇÃO META LEAD ADS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`App ID: ${APP_ID}`);
  console.log(`Ad Account: ${AD_ACCOUNT_ID}`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // 1. Testar token
  const tokenValid = await testToken();
  if (!tokenValid) {
    console.log('\n❌ Token inválido. Verifique suas credenciais.');
    return;
  }
  
  // 2. Verificar permissões
  await checkPermissions();
  
  // 3. Listar páginas
  const pages = await listPages();
  
  // 4. Para cada página, listar formulários e leads
  for (const page of pages) {
    await listLeadForms(page.id, page.access_token);
    await listLeads(page.id, page.access_token);
  }
  
  // 5. Testar conta de anúncios
  await testAdAccount();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    ✅ TESTE CONCLUÍDO');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Adicione a permissão "leads_retrieval" no seu app Meta');
  console.log('2. Crie uma integração no CRM com o Page ID e Page Token');
  console.log('3. Configure o webhook no Meta Developers ou use Make/Zapier');
  console.log('4. Teste enviando um lead pelo formulário do Instagram\n');
}

main().catch(console.error);
