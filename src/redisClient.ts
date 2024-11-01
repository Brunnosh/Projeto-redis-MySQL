import { createClient } from 'redis';
import {ProductsRepository} from "./ProductsRepository";
import { Product } from './product';

const productsRepo = new ProductsRepository();// importação dos metodos do banco de dados

//criando uma conexão com o banco de dados Redis.
const client = createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await client.connect();


})();//iniciando a conexão com o redis


var qtd = 0;
//função que sincroniza os produtos com o redis
async function syncRedis() {
    
    if(qtd != 0){purgeRedis();}//limpando o redis antes de sincronizar novamente

    try{
        const products = await productsRepo.getAll();//pegando todos os itens da table products
        
        
        
        products.forEach(async (product)=> {
            await client.set( `product:${product.ID}`, JSON.stringify(product));//Itera sobre cada produto e armazena no Redis
            
        })


        console.log("MySQL Carregado no redis")
        
    }
    catch(err){console.error("Erro ao carregar produtos", err)}

    qtd++
}

async function purgeRedis() {//remove TUDO do Redis.
    try{
        const keys = await client.keys("product:*")//pega todas as chaves product

        if(keys.length === 0){console.log("nengum produto a apagar")}

        keys.forEach(async (key)=>{
            await client.del(key);
        });

        console.log("Redis purgado")
    }catch(err){console.error("Falha ao purgar", err)}
}

async function checkRedisSync():Promise<Boolean> {//Função para checar a sincronia entre o banco de dados mySQL e o redis
    
    const productsDB = await productsRepo.getAll();
    const keys = await client.keys('product:*');
    const productsRedis : Product[] = await Promise.all(keys.map(async (key) => {
        const product = await client.get(key); // Obtém cada produto do Redis
        return JSON.parse(product!); // Converte o JSON de volta para um objeto
    }));

    if (productsDB.length !== productsRedis.length) {
        console.error("Quantidade de produtos de cada banco é diferente")
        return false;
    }

        // Cria um Map dos produtos do Redis usando o ID como chave para comparação
    const redisProductsMap = new Map(productsRedis.map(product => [product.ID, product]));

    // Compara cada produto do banco com o correspondente no Redis
    //Iterando sobre cada produto do mySQL, pega um id, compara com o produto do redis com o mesmo ID campo por campo
    for (const productDB of productsDB) {
        const productRedis = redisProductsMap.get(productDB.ID);
        
        // Verifica se o produto existe no Redis e se todos os campos são iguais
        if (!productRedis ||productDB.NAME !== productRedis.NAME||productDB.PRICE !== productRedis.PRICE||productDB.DESCRIPTION !== productRedis.DESCRIPTION) {
            console.error("Inconsistência encontrada")
            return false;
        }
        
    }


    //inverso da ultima funcão, antes checava se tudo do banco de dados estava no redis, agora testa se tudo do redis está no banco de dados.
    const dbProductsMap = new Map(productsDB.map(product => [product.ID, product]));
    for (const productRedis of productsRedis) {
        const productDB = dbProductsMap.get(productRedis.ID);
        if (!productDB) {
            console.error("Inconsistência encontrada")
            return false;
        }
    }
    console.log("true")
    return true;
}

async function deleteRedis(id : number) {
    await client.del(`product:${id}`);
    
}

async function insertRedis(product : Product) {
    await client.set( `product:${product.ID}`, JSON.stringify(product));
}

async function updateRedis(product : Product) {
    await client.set( `product:${product.ID}`, JSON.stringify(product));
}



export {client, syncRedis, purgeRedis, checkRedisSync, insertRedis, deleteRedis, updateRedis};
