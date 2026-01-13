import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

(async function testCloudinary() {
    console.log('🔧 Configurando Cloudinary...');
    
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    console.log('📤 Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
    console.log('📤 API Key:', process.env.CLOUDINARY_API_KEY);
    
    try {
        // Upload uma imagem de teste
        console.log('\n📤 Fazendo upload de imagem de teste...');
        
        const uploadResult = await cloudinary.uploader.upload(
            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
            {
                public_id: 'teste-nautiluz-crm',
                folder: 'nautiluz-crm/test',
                transformation: [
                    { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            }
        );
        
        console.log('\n✅ Upload realizado com sucesso!');
        console.log('📸 URL da imagem:', uploadResult.secure_url);
        console.log('🆔 Public ID:', uploadResult.public_id);
        console.log('📐 Dimensões:', uploadResult.width, 'x', uploadResult.height);
        console.log('📦 Tamanho:', (uploadResult.bytes / 1024).toFixed(2), 'KB');
        
        // Gerar URL otimizada
        const optimizeUrl = cloudinary.url(uploadResult.public_id, {
            fetch_format: 'auto',
            quality: 'auto'
        });
        
        console.log('\n🔗 URL Otimizada:', optimizeUrl);
        
        // Deletar a imagem de teste
        console.log('\n🗑️ Deletando imagem de teste...');
        await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log('✅ Imagem de teste deletada com sucesso!');
        
        console.log('\n🎉 Cloudinary está configurado e funcionando perfeitamente!');
        
    } catch (error) {
        console.error('\n❌ Erro ao testar Cloudinary:', error);
        process.exit(1);
    }
})();
