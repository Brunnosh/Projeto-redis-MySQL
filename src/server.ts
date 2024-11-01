import express from "express";
import { Request, Response, Router } from "express";
import {ProductsRepository} from "./ProductsRepository";
import { Product } from "./product";
import { close } from "fs";
import {checkRedisSync, client, deleteRedis, insertRedis, purgeRedis, syncRedis, updateRedis} from "./redisClient"
import { checkPrime } from "crypto";
import { error } from "console";

const app = express();
const port = 3000;
const routes = Router();

app.use(express.json());

const productsRepo = new ProductsRepository();

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 200;
    res.send("Funcionando...");
});

//----------------------------------------------COMANDOS PARA TESTAR REDIS----------------------------------------------//

routes.delete('/purgeRedis', async(req:Request, res:Response)=>{
    try{
        purgeRedis()
        res.status(200).send("Redis Purgado")
    }catch(err){
        console.error("Falha ao apagar redis", err)
    }
});

routes.get('/checkRedisSync', async(req:Request,res:Response)=>{
    console.log(await checkRedisSync());
    res.status(200).send("")
});



//----------------------------------------------COMANDOS PARA TESTAR REDIS----------------------------------------------//

routes.get('/getAllProducts', async (req: Request, res: Response) => {
    try {

        if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao
        console.time()
        // Tenta buscar os produtos do Redis
        const keys = await client.keys('product:*'); // Busca todas as chaves de produtos
        console.log("Chaves encontradas no Redis:", keys);//garantindo que foi pego no redis 
        const products = await Promise.all(keys.map(async (key) => {
            const product = await client.get(key); // Obtém cada produto do Redis
            return JSON.parse(product!); // Converte o JSON de volta para um objeto
        }));
        console.timeEnd()
        res.status(200).json(products); // Retorna os produtos encontrados
    } catch (err) {
        console.error("Erro ao buscar produtos no Redis", err);
        res.status(500).json({ message: "Erro interno ao buscar produtos." });
    }
});

routes.get('/getById', async(req:Request,res:Response)=>{
    
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const ID = req.body.ID; // pbtem o ID do corpo da requisição 

    if(!ID){console.error("ID OBRIGATORIO"); return}// Busca o produto no Redis usando o ID.

 

    const product  = await client.get(`product:${ID}`);
    

    if(product)
    {res.status(200).json(JSON.parse(product))// retorna o produto , convertendo para json

    }else
    {res.status(400).json({message:"Nenhum produto com tal ID"})};


    
});


routes.get('/getByName', async(req:Request,res:Response)=>{
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const nome = req.body.NAME;

    if(!nome){console.error("ID OBRIGATORIO"); return}

    const keys = await client.keys('product:*'); // Busca todas as chaves de produtos

    const products = await Promise.all(keys.map(async (key) => {
        const product = await client.get(key); // Obtém cada produto do Redis
        return JSON.parse(product!); // Converte o JSON de volta para um objeto
    }));
    
    products.forEach(product=>{
        if(product.NAME.toLowerCase().includes(nome.toLowerCase())){res.status(200).json(product)}
    }); 
    
});



routes.put('/updateProduct', async(req:Request,res:Response)=>{

    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const {id, name, price, description} = req.body;
    const newProd = new Product(name,price,description,id);

    if(id == undefined) res.status(500).send({error:"id não está presente"})

    try{
        await productsRepo.update(newProd);
        res.status(201).json(newProd);
        syncRedis();
        updateRedis(newProd);
    }catch(erro){
        res.status(500).send({ error: "Erro ao alterar o produto" });
    }

});

routes.delete('/deleteProduct', async (req:Request,res:Response) => {
    
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao
    
    const  {id} = req.body;

    if (id === undefined)res.status(400).send({ error: "ID não está presente" });
    

    try {
        await productsRepo.delete(id);
        res.status(200).send("item deletado com sucesso"); // No Content
        deleteRedis(id);
    } catch (error) {
        res.status(500).send({ error: "Erro ao deletar o produto" });
    }
});


routes.put('/insertProduct', async(req:Request, res:Response)=>{

    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao
    const {name,price,description}= await req.body;
    const prodInserir = new Product(name,price,description);


    try {
        const result = await productsRepo.create(prodInserir); // Chamando o método create

        insertRedis(result)
        res.status(202).json(result);
        //Sincronizando o redis todo apos uma insersão porque não consegui trazer o ID do produto da funcão create no productsRepo pra inserir no redis,
    } catch (error) {
        res.status(500).send({ error: "Erro ao inserir o produto" });
        console.error(error)
    }

});





// aplicar as rotas na aplicação web backend. 
app.use(routes);

app.listen(3000, async ()=>{
    console.log("Server is running on 3000");

    await client.ping();
    console.log("Redis connnected")
    await syncRedis()
    if(!checkRedisSync){await syncRedis();}
});