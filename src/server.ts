import express from "express";
import { Request, Response, Router } from "express";
import {ProductsRepository} from "./ProductsRepository";
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

routes.put('/insertProduct', async(req:Request, res:Response)=>{

    const {name,price,description}= await req.body;

    console.log(name,price,description)

    try {
        const product = await productsRepo.create(name,price,description); // Chamando o método create
        res.status(201).json(product);
    } catch (error) {
        res.status(500).send({ error: "Erro ao inserir o produto" });
    }

});

// aplicar as rotas na aplicação web backend. 
app.use(routes);

app.listen(3000, ()=>{
    console.log("Server is running on 3000");
});