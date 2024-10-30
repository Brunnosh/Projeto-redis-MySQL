import { ResultSetHeader } from "mysql2"
import { conn } from "./db"
import { Product } from "./product"

export class ProductsRepository {

  getAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>("SELECT * FROM PRODUCTS", (err, res) => {
        if (err) reject(err)
        else resolve(res)
      })
    })
  }

  getById(product_id: number): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<Product[]>(
        "SELECT * FROM PRODUCTS WHERE id = ?",
        [product_id],
        (err, res) => {
          if (err) reject(err)
          else resolve(res?.[0])
        }
      )
    })
  }

  create(name:string,price:number,description:string): Promise<Product> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>("INSERT INTO PRODUCTS (name, price, description) VALUES(?,?,?)",[name, price, description],(err, res) => {
          if (err) 
          {
            reject(err);
            //console.error(err)
          }
          else
            this.getById(res.insertId)
              .then(user => resolve(user!))
              .catch(reject)
        }
      )
    })
  }

  update(p: Product): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      conn.query<ResultSetHeader>(
        "UPDATE PRODUCTS SET name = ?, price = ?, description = ? WHERE id = ?",
        [p.name, p.price, p.description, p.id],
        (err, res) => {
          if (err) reject(err)
          else
            this.getById(p.id!)
              .then(resolve)
              .catch(reject)
        }
      )
    })
  }
  delete(product_id: number): Promise<number | undefined> {
    return new Promise((resolve, reject) => {
        conn.query<ResultSetHeader>(
            "DELETE FROM PRODUCTS WHERE id = ?",
            [product_id],
            (err, res) => {
                if (err) {
                    reject(err);
                } else if (res.affectedRows > 0) {
                    resolve(res.affectedRows); // Retorna o número de linhas afetadas
                } else {
                    resolve(undefined); // Retorna undefined se nenhum produto foi deletado
                }
            }
        );
    });
}}
