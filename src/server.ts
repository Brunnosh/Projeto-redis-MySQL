import express from "express";
import { Request, Response, Router } from "express";
import {ProductsRepository} from "./ProductsRepository";
import { Product } from "./product";
import { close } from "fs";

const app = express();
const port = 3000;
const routes = Router();

app.use(express.json());

const productsRepo = new ProductsRepository();

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 200;
    res.send("Funcionando...");
});

routes.get('/getAllProducts', async(req: Request, res: Response)=>{
    // obter todos os produtos.
    const products = await productsRepo.getAll();
    res.statusCode = 200; 
    res.type('application/json')
    res.send(products);
});

routes.put('/updateProduct', async(req:Request,res:Response)=>{

    const {id, name, price, description} = req.body;
    const newProd = new Product(name,price,description,id);

    if(id == undefined) res.status(500).send({error:"id não está presente"})

    try{
        await productsRepo.update(newProd);
        res.status(201).json(newProd);
    }catch(erro){
        res.status(500).send({ error: "Erro ao alterar o produto" });
    }

});

routes.delete('/deleteProduct', async (req: Request, res: Response) => {
    const { id } = req.body; // Obtenha o ID do corpo da requisição
    try {
        const result = await productsRepo.delete(id); // Chama o método de exclusão no repositório
       
        res.status(200).send(); // Retorna 200 No Content em caso de sucesso
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Erro ao deletar o produto" });
    }
});


routes.put('/insertProduct', async(req:Request, res:Response)=>{

    const {name,price,description}= await req.body;


    try {
        const product = await productsRepo.create(name,price,description); // Chamando o método create
        res.status(202).json(product);
    } catch (error) {
        res.status(500).send({ error: "Erro ao inserir o produto" });
    }

});





// aplicar as rotas na aplicação web backend. 
app.use(routes);

app.listen(3000, ()=>{
    console.log("Server is running on 3000");
});