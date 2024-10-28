import exp from "constants"
import { RowDataPacket } from "mysql2"

export interface Product extends RowDataPacket {
    id?: number
    name: string
    price: number
    description: string 
}

export class Product{
    id?:number;
    name:string;
    price:number;
    description:string;

    constructor(name:string,price:number,description:string,id?:number)
    {
        this.name= name;
        this.price = price;
        this.description = description;

        if(id)
        {
            this.id=id;
        }   
    }
}
