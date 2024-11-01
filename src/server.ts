import express from "express";
import { Request, Response, Router } from "express";
import {ProductsRepository} from "./ProductsRepository";
import { Product } from "./product";
import { close } from "fs";
import {checkRedisSync, client, purgeRedis, syncRedis} from "./redisClient"
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


routes.get('/syncRedis',async(req:Request,res:Response)=>{
    try{
        syncRedis();
        res.status(200).send("Redis syncado!!!!!!!");
    } catch (error) {
        res.status(500).send({ error: "Erro ao sincronizar redis" });
    }
})

//----------------------------------------------COMANDOS PARA TESTAR REDIS----------------------------------------------//

routes.get('/getAllProducts', async (req: Request, res: Response) => {
    try {

        if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

        // Tenta buscar os produtos do Redis
        const keys = await client.keys('product:*'); // Busca todas as chaves de produtos
        console.log("Chaves encontradas no Redis:", keys);//garantindo que foi pego no redis 
        const products = await Promise.all(keys.map(async (key) => {
            const product = await client.get(key); // Obtém cada produto do Redis
            return JSON.parse(product!); // Converte o JSON de volta para um objeto
        }));
        console.log("products encontrado",products.length)
        console.log("Produtos encontrados:", products)
        res.status(200).json(products); // Retorna os produtos encontrados
    } catch (err) {
        console.error("Erro ao buscar produtos no Redis", err);
        res.status(500).json({ message: "Erro interno ao buscar produtos." });
    }
});

routes.get('/getById', async(req:Request,res:Response)=>{
    
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const ID = req.body.ID;

    if(!ID){console.error("ID OBRIGATORIO"); return}

    console.log(`product:${ID} `)

    const product  = await client.get(`product:${ID}`);
    

    if(product)
    {res.status(200).json(JSON.parse(product))

    }else
    {res.status(400).json({message:"Nenhum produto com tal ID"})};


    
});


routes.get('/getByName', async(req:Request,res:Response)=>{
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const nome = req.body.NAME;

    if(!nome){console.error("ID OBRIGATORIO"); return}

    const keys = await client.keys('product:*'); // Busca todas as chaves de produtos
    console.log("Chaves encontradas no Redis:", keys);

    const products = await Promise.all(keys.map(async (key) => {
        const product = await client.get(key); // Obtém cada produto do Redis
        return JSON.parse(product!); // Converte o JSON de volta para um objeto
    }));
    
    products.forEach(produto=>{
        if(produto.NAME.toLowerCase().includes(nome.toLowerCase())){res.status(200).json(produto)}
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
    }catch(erro){
        res.status(500).send({ error: "Erro ao alterar o produto" });
    }

});

routes.delete('/deleteProduct', async (req:Request,res:Response) => {
    
    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao
    
    const  {id} = req.body;
    console.log("parametro id :",id)

    if (id === undefined)res.status(400).send({ error: "ID não está presente" });
    

    try {
        await productsRepo.delete(id);
        res.status(200).send("item deletado com sucesso"); // No Content
        syncRedis();
    } catch (error) {
        res.status(500).send({ error: "Erro ao deletar o produto" });
    }
});


routes.put('/insertProduct', async(req:Request, res:Response)=>{

    if (!(await checkRedisSync())){await syncRedis();}//checagem para ver se redis e o mysql estao sincronizados, se nao estiverem, efetuar sincronizacao

    const {name,price,description}= await req.body;


    try {
        const product = await productsRepo.create(name,price,description); // Chamando o método create
        res.status(202).json(product);
        syncRedis();
    } catch (error) {
        res.status(500).send({ error: "Erro ao inserir o produto" });
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