import { createClient } from 'redis';
import {ProductsRepository} from "./ProductsRepository";
import { Product } from './product';

const productsRepo = new ProductsRepository();// importação dos metodos do banco de dados

// ?  cria-se uma conexão com o banco de dados Redis.
const client = createClient({
    url: 'redis://localhost:6379', // Altere se necessário para o endereço correto do Redis
});

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await client.connect();
})();

var qtd = 0; //var controlando qts vezes a func. syncRedis foi chamada
console.log("quantidade de vezes que o redis foi chamado: ",qtd)

//? função que sincroniza os produtos com o redis
async function syncRedis() {
    

    if(qtd != 0){await purgeRedis()}//se não tiver sido executada nenhuma vez, ou seja, ao iniciar o programa.
    //não faz sentido purgar o redis, como ele não vai ter nada ou vai ter a mesma coisa que da ultima vez

    try{
        const products = await productsRepo.getAll();//* pegando todos os itens do repositório 
        
        
        
        products.forEach(async (product)=> {
            await client.set( `product:${product.ID} `, JSON.stringify(product));//* Itera sobre cada produto e armazena no Redis
            
        })


        console.log("MySQL Carregado no redis")
        qtd++;
    }
    catch(err){console.error("Erro ao carregar produtos", err)}
}


async function purgeRedis() {//* remove chaves antigas do Redis.
    try{
        const keys = await client.keys("product:*")//pega todas as chaves product

        if(keys.length === 0){console.log("nengum produto a apagar")}

        keys.forEach(async (key)=>{
            await client.del(key);
        });

        console.log("Redis purgado")
    }catch(err){console.error("Falha ao purgar", err)}
}


export {client, syncRedis, purgeRedis};