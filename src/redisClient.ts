import { createClient } from 'redis';
import {ProductsRepository} from "./ProductsRepository";
import { Product } from './product';

const productsRepo = new ProductsRepository();


const client = createClient({
    url: 'redis://localhost:6379', // Altere se necessário para o endereço correto do Redis
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await client.connect();
})();


async function syncRedis() {
    try{
        const products = await productsRepo.getAll();
        
        
    
        products.forEach(async (product)=> {
            await client.set( `product:${product.ID} `, JSON.stringify(product));
            
        })


        console.log("MySQL Carregado no redis")
    }
    catch(err){console.error("Erro ao carregar produtos", err)}
}

async function pesquisaRedis() {
    
}

async function inserirRedis() {
    
}

async function removerRedis() {
    
}

async function updateRedis(product : Product) {
    try {
        await client.set(`product:${product.id}`, JSON.stringify(product));
        console.log("Produto atualizado no Redis:", product);
    } catch (error) {
        console.error("Erro ao atualizar produto no Redis:", error);
    }
}

async function purgeRedis() {
    try{
        const keys = await client.keys("product:*")

        if(keys.length === 0){console.log("nengum produto a apagar")}

        keys.forEach(async (key)=>{
            await client.del(key);
        });

        console.log("Redis purgado")
    }catch(err){console.error("Falha ao purgar", err)}
}


export {client, syncRedis};
