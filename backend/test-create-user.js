import { Resend } from 'resend';
import crypto from 'crypto';

const API_URL = 'http://localhost:10000/api';
const RESEND_API_KEY = 're_6bXGauEP_JvJWZ5SJaW9NteZJdEwn32Bp';

async function testCreateUser() {
  try {
    console.log('🔐 1. Fazendo login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nautiluz.com',
        password: 'demo123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginResponse.status, loginResponse.statusText);
      const errorText = await loginResponse.text();
      console.error('Resposta:', errorText);
      process.exit(1);
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    console.log('✅ Login OK! Token:', token.substring(0, 50) + '...');
    console.log('');

    console.log('👤 2. Criando vendedor...');
    const createUserResponse = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Felipe Coqueiro Teste',
        email: 'felipeteste2026@gmail.com',
        password: 'demo123',
        role: 'vendedor',
        active: true,
        phone: '(11) 98765-4321',
        jobTitle: 'Vendedor Teste',
        sendResetEmail: true
      })
    });

    if (!createUserResponse.ok) {
      console.error('❌ Erro ao criar usuário:', createUserResponse.status, createUserResponse.statusText);
      const errorText = await createUserResponse.text();
      console.error('Resposta:', errorText);
      process.exit(1);
    }

    const userData = await createUserResponse.json();
    console.log('✅ Usuário criado:', userData);
    console.log('');
    console.log('📧 Verifique o email felipeteste2026@gmail.com');
    console.log('✨ Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testCreateUser();
